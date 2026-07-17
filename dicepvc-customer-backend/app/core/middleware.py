import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.exceptions import RateLimitException
from app.core.config import settings

logger = logging.getLogger("api_request_tracker")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        
        # Unique correlation request ID
        request_id = request.headers.get("X-Request-ID", "unknown")
        
        try:
            response = await call_next(request)
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            logger.info(
                f"HTTP {request.method} {request.url.path} responded {response.status_code}",
                extra={
                    "request_id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "status_code": response.status_code,
                    "latency_ms": process_time_ms
                }
            )
            return response
        except Exception as e:
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"HTTP {request.method} {request.url.path} failed with: {str(e)}",
                extra={
                    "request_id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "latency_ms": process_time_ms
                },
                exc_info=True
            )
            raise e


class RedisRateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_client=None, rate_limit: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.redis_client = redis_client
        self.rate_limit = rate_limit
        self.window_seconds = window_seconds

    async def dispatch(self, request: Request, call_next) -> Response:
        redis_conn = self.redis_client or getattr(request.app.state, "redis", None)
        # Bypass rate limiting if Redis is not configured or available
        if not redis_conn:
            return await call_next(request)
            
        client_ip = request.client.host if request.client else "unknown"
        key = f"rate_limit:{client_ip}:{request.url.path}"
        
        try:
            # Atomic increment
            current = await redis_conn.incr(key)
            
            # Set TTL on new key
            if current == 1:
                await redis_conn.expire(key, self.window_seconds)
                
            if current > self.rate_limit:
                raise RateLimitException("Too many requests. Limit exceeded.")
        except RateLimitException as ex:
            raise ex
        except Exception as err:
            # Fail-open if Redis encounters connection errors
            logger.warning(f"[RateLimiter] Fail-open due to Redis error: {err}")
            
        return await call_next(request)
