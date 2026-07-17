import logging
from redis.asyncio import Redis
from app.core.config import settings

logger = logging.getLogger("redis_core")

_redis_client: Redis | None = None


def get_redis() -> Redis:
    """Returns a shared, single-instance async Redis client.
    
    Configures robust connection pooling, health check PINGs to prevent
    'Connection closed by server' errors, and automatic timeout retries.
    """
    global _redis_client
    if _redis_client is None:
        logger.info(f"Initializing shared Redis client pool targeting {settings.REDIS_URL.split('@')[-1]}")
        
        # Configure SSL cert validation requirements if TLS (rediss://) is used
        ssl_args = {}
        if settings.REDIS_URL.startswith("rediss://"):
            import ssl
            ssl_args["ssl_cert_reqs"] = ssl.CERT_NONE
            
        _redis_client = Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            health_check_interval=30,
            socket_timeout=5.0,
            socket_connect_timeout=5.0,
            retry_on_timeout=True,
            **ssl_args
        )
    return _redis_client


async def close_redis() -> None:
    """Safely closes the shared Redis client and its connection pool."""
    global _redis_client
    if _redis_client is not None:
        logger.info("Closing shared Redis client connection pool.")
        await _redis_client.close()
        _redis_client = None
