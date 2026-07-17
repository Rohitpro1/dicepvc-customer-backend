from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global _client, _db
    try:
        _client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=100,
            minPoolSize=10,
            maxIdleTimeMS=60000,
            waitQueueTimeoutMS=10000
        )
        await _client.admin.command('ping')
        _db = _client[settings.MONGO_DB]
        print(f"[Database] Connected successfully to MongoDB: {settings.MONGO_DB}")
    except Exception as e:
        print(f"[Database] Failed to connect to MongoDB: {e}")
        raise e


async def close_mongo_connection() -> None:
    global _client
    if _client:
        _client.close()
        print("[Database] MongoDB connection closed.")


async def create_mongodb_indexes() -> None:
    """Configures performance compound and TTL indexes across all collections."""
    db = get_db()
    
    # 1. Users collection
    await db["users"].create_index("email", unique=True)
    await db["users"].create_index("id", unique=True)
    await db["users"].create_index("role")
    
    # 2. Customers
    await db["customers"].create_index("id", unique=True)
    await db["customers"].create_index("user_id", unique=True)
    await db["customers"].create_index("company_name")
    
    # 3. Subscriptions
    await db["subscriptions"].create_index("id", unique=True)
    await db["subscriptions"].create_index("customer_id")
    await db["subscriptions"].create_index([("status", 1), ("current_period_end", 1)])
    
    # 4. Licenses
    await db["licenses"].create_index("id", unique=True)
    await db["licenses"].create_index("license_key", unique=True)
    await db["licenses"].create_index("subscription_id")
    
    # 5. Sessions & Auth tokens (with TTL)
    await db["sessions"].create_index("id", unique=True)
    await db["sessions"].create_index("user_id")
    await db["sessions"].create_index("expires_at", expireAfterSeconds=0)
    
    await db["refresh_tokens"].create_index("token", unique=True)
    await db["refresh_tokens"].create_index("expires_at", expireAfterSeconds=0)
    
    await db["password_resets"].create_index("token", unique=True)
    await db["password_resets"].create_index("expires_at", expireAfterSeconds=0)
    
    await db["email_verifications"].create_index("token", unique=True)
    await db["email_verifications"].create_index("expires_at", expireAfterSeconds=0)
    
    # 6. Support Tickets
    await db["support_tickets"].create_index("id", unique=True)
    await db["support_tickets"].create_index("user_id")
    await db["support_tickets"].create_index("status")
    
    await db["ticket_messages"].create_index("ticket_id")
    
    # 7. Orders & Payments
    await db["orders"].create_index("id", unique=True)
    await db["orders"].create_index("razorpay_order_id", unique=True)
    
    await db["payments"].create_index("id", unique=True)
    await db["payments"].create_index("razorpay_payment_id", unique=True)
    await db["payments"].create_index("order_id")
    
    await db["payment_webhooks"].create_index("event_id", unique=True)
    await db["payment_webhooks"].create_index("received_at", expireAfterSeconds=30 * 24 * 3600)  # 30 days history TTL
    
    # 8. Audits & Telemetry
    await db["audit_logs"].create_index("created_at")
    await db["activity_logs"].create_index("user_id")
    
    # 9. Releases & Downloads
    await db["software_versions"].create_index("version", unique=True)
    await db["downloads"].create_index("version_id")
    
    print("[Database] Performance compound and TTL indexes verified/created.")


def get_db() -> AsyncIOMotorDatabase:
    global _db
    if _db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo first.")
    return _db


def col(name: str):
    return get_db()[name]
