from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis.asyncio import Redis

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, create_mongodb_indexes
from app.core.logging import setup_logging
from app.core.exceptions import BaseAppException
from app.core.middleware import RequestLoggingMiddleware, RedisRateLimiterMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup structured JSON logging
    setup_logging()
    
    # Establish connection to primary MongoDB and build indexes
    await connect_to_mongo()
    await create_mongodb_indexes()
    
    # Initialize async Redis client pool
    app.state.redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    yield
    
    # Safely close Redis and Mongo
    await app.state.redis.close()
    await close_mongo_connection()


app = FastAPI(
    title="DicePVC SaaS Customer Backend API",
    description="Primary business backend managing billing, support tickets, coupons, and license coordination.",
    version="1.0.0",
    lifespan=lifespan,
)

# Global Exception Handler for application errors
@app.exception_handler(BaseAppException)
async def app_exception_handler(request: Request, exc: BaseAppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"ok": False, "error": exc.message}
    )


# Standard Middlewares Wireup
origins = []
if settings.CORS_ORIGINS.strip() == "*":
    if settings.DEBUG:
        origins = ["http://localhost:3000"]
    else:
        origins = [settings.DASHBOARD_URL]
else:
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RedisRateLimiterMiddleware, rate_limit=100, window_seconds=60)
app.add_middleware(RequestLoggingMiddleware)


@app.get("/")
async def root():
    return {
        "service": "DicePVC SaaS Customer Backend API",
        "status": "online",
        "version": "1.0.0"
    }


@app.get("/health")
async def health(request: Request):
    from app.core.database import get_db
    from fastapi.responses import JSONResponse
    status_code = 200
    details = {"status": "healthy", "mongodb": "connected", "redis": "connected"}

    # Test MongoDB
    try:
        db = get_db()
        await db.command("ping")
    except Exception as e:
        details["mongodb"] = f"error: {str(e)}"
        details["status"] = "unhealthy"
        status_code = 503

    # Test Redis
    try:
        redis_client = request.app.state.redis
        await redis_client.ping()
    except Exception as e:
        details["redis"] = f"error: {str(e)}"
        details["status"] = "unhealthy"
        status_code = 503

    return JSONResponse(status_code=status_code, content=details)


# Base API Router
api_router = APIRouter(prefix="/api/v1")

from app.domains.auth.routes import router as auth_router
from app.domains.billing.routes import router as billing_router
from app.domains.tickets.routes import router as tickets_router
from app.domains.announcements.routes import router as announcements_router
from app.domains.downloads.routes import router as downloads_router
from app.domains.accounts.routes import router as accounts_router
from app.domains.admin.routes import router as admin_router
from app.domains.licenses.routes import router as licenses_router

api_router.include_router(auth_router)
api_router.include_router(billing_router)
api_router.include_router(tickets_router)
api_router.include_router(announcements_router)
api_router.include_router(downloads_router)
api_router.include_router(accounts_router)
api_router.include_router(admin_router)
api_router.include_router(licenses_router)

app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    import os
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
