import httpx
import asyncio
import logging
from typing import Any, Optional
from app.core.config import settings
from app.core.exceptions import ExternalServiceException
from app.core.redis import get_redis

logger = logging.getLogger("license_client")


class LicenseServiceClient:
    def __init__(self):
        self.base_url = settings.LICENSE_SERVICE_URL
        self.headers = {
            "Authorization": f"Bearer {settings.LICENSE_SERVICE_API_KEY}",
            "Content-Type": "application/json"
        }
        self.redis = get_redis()

    async def _call_api(self, method: str, path: str, json_data: dict = None, params: dict = None, timeout: float = 10.0) -> Any:
        circuit_key = "circuit:license_service"
        state = None
        try:
            state = await self.redis.get(circuit_key)
        except Exception as redis_err:
            logger.warning(f"[LicenseClient] Redis circuit state lookup failed: {redis_err}. Bypassing circuit breaker check.")

        if state == "open":
            if settings.DEBUG:
                logger.info("[LicenseClient] Circuit open, using debug mock fallback.")
                return self._get_debug_mock_response(method, path, json_data)
            logger.error("[LicenseClient] Downstream circuit breaker is OPEN. Fast-failing request.")
            raise ExternalServiceException("License Service is currently unavailable (Circuit Breaker Tripped).")

        attempts = 3
        backoff = 0.5
        for attempt in range(attempts):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    if method == "POST":
                        response = await client.post(
                            f"{self.base_url}{path}",
                            json=json_data,
                            params=params,
                            headers=self.headers
                        )
                    else:
                        response = await client.get(
                            f"{self.base_url}{path}",
                            params=params,
                            headers=self.headers
                        )
                    
                    response.raise_for_status()
                    
                    # Reset failure count on success
                    try:
                        await self.redis.delete("circuit_failures:license_service")
                    except Exception as redis_err:
                        logger.warning(f"[LicenseClient] Redis failure reset failed: {redis_err}")
                    return response.json()
            except (httpx.HTTPStatusError, httpx.RequestError) as err:
                logger.warning(
                    f"[LicenseClient] Downstream call failed (attempt {attempt + 1}/{attempts}): {err}",
                    extra={"path": path, "attempt": attempt + 1}
                )
                if attempt == attempts - 1:
                    # In debug/development mode, fall back to mock response to allow end-to-end testing
                    if settings.DEBUG:
                        logger.info(f"[LicenseClient] Downstream call failed in debug mode. Returning mock fallback response.")
                        return self._get_debug_mock_response(method, path, json_data)

                    # Increment failure counter in Redis
                    try:
                        failures = await self.redis.incr("circuit_failures:license_service")
                        await self.redis.expire("circuit_failures:license_service", 60)
                        if failures >= 5:
                            logger.error("[LicenseClient] Critical downstream failure count. Tripping circuit breaker for 30s.")
                            await self.redis.set(circuit_key, "open", ex=30)
                    except Exception as redis_err:
                        logger.warning(f"[LicenseClient] Redis circuit failure increment failed: {redis_err}")
                    raise ExternalServiceException(f"Failed to communicate with License Service: {str(err)}")
                
                await asyncio.sleep(backoff * (2 ** attempt))

    def _get_debug_mock_response(self, method: str, path: str, json_data: dict = None) -> Any:
        """Generates realistic mock data payloads for debugging/testing local flows."""
        import secrets
        if path == "/api/licenses" and method == "POST":
            return {
                "id": f"lic_{secrets.token_hex(8)}",
                "license_key": f"PRO-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"
            }
        elif path == "/api/licenses/validate" and method == "POST":
            return {"valid": True, "message": "Signature verified"}
        elif "/status" in path:
            return {"status": json_data.get("status", "active") if json_data else "active"}
        elif "/renew" in path:
            return {"ok": True, "message": "License renewed"}
        elif "/api/analytics/usage-logs" in path:
            return []
        else:
            return {
                "id": f"lic_mock",
                "license_key": "PRO-MOCK-LICENSE-KEY-VALUE",
                "status": "active"
            }

    async def generate_license(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Calls downstream to generate a serial key with features/devices/validity."""
        return await self._call_api("POST", "/api/licenses", json_data=payload)

    async def get_license(self, license_id: str) -> dict[str, Any]:
        """Fetches current status of a downstream license."""
        return await self._call_api("GET", f"/api/licenses/{license_id}")

    async def set_license_status(self, license_id: str, status: str) -> dict[str, Any]:
        """Locks, blocks, expires, or activates a license key downstream."""
        return await self._call_api("POST", f"/api/licenses/{license_id}/status", json_data={"status": status})

    async def renew_license(self, license_id: str, days: int) -> dict[str, Any]:
        """Extends license validity end date downstream."""
        return await self._call_api("POST", f"/api/licenses/{license_id}/renew", json_data={"days": days})

    async def validate_license(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Validates license signature and device hardware configuration checks."""
        return await self._call_api("POST", "/api/licenses/validate", json_data=payload)

    async def get_usage_logs(self, limit: int = 1000) -> list[dict[str, Any]]:
        """Pulls raw logs from downstream for central synchronization."""
        return await self._call_api("GET", "/api/analytics/usage-logs", params={"limit": limit}, timeout=15.0)
