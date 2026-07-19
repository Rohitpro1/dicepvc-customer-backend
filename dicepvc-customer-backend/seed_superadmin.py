"""
seed_superadmin.py
==================
One-shot script to create the initial super_admin user in MongoDB.

Usage:
    python seed_superadmin.py

Set credentials via environment variables or edit the defaults below.
This script is IDEMPOTENT -- safe to re-run; won't create duplicates.

Requirements (same as backend):
    pip install motor passlib[bcrypt] python-dotenv
"""

import asyncio
import os
import secrets
from datetime import datetime, timezone

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
    print("[Seed] Loaded .env file.")
except ImportError:
    print("[Seed] python-dotenv not installed. Reading from environment only.")

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# ─── CONFIG ────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://rohitpro:ROHITPRO@cluster0.2kw80u1.mongodb.net/")
MONGO_DB  = os.getenv("MONGO_DB",  "dicepvc_customer_db")

SUPERADMIN_EMAIL    = os.getenv("SUPERADMIN_EMAIL",    "admin@dicepvc.com")
SUPERADMIN_PASSWORD = os.getenv("SUPERADMIN_PASSWORD", "Admin@DicePVC2026!")
SUPERADMIN_NAME     = os.getenv("SUPERADMIN_NAME",     "Super Admin")
# ───────────────────────────────────────────────────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(8)}"


async def seed():
    print(f"[Seed] Connecting to MongoDB: {MONGO_DB}")
    client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGO_DB]

    # ── Idempotency check ─────────────────────────────────────────────────
    existing = await db["users"].find_one({"email": SUPERADMIN_EMAIL})
    if existing:
        print(f"[Seed] Super admin already exists: {SUPERADMIN_EMAIL}")
        print(f"       Role   : {existing.get('role')}")
        print(f"       Status : {existing.get('status')}")
        print(f"       User ID: {existing.get('id')}")
        client.close()
        return

    # ── Create super admin user ───────────────────────────────────────────
    now = datetime.now(timezone.utc)
    user_id = new_id("usr")

    user_doc = {
        "id": user_id,
        "name": SUPERADMIN_NAME,
        "email": SUPERADMIN_EMAIL,
        "password_hash": pwd_context.hash(SUPERADMIN_PASSWORD),
        "role": "super_admin",
        "status": "active",
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
        "created_by": "seed_script",
        "updated_by": "seed_script",
    }
    await db["users"].insert_one(user_doc)

    print(f"[Seed] Super admin created successfully!")
    print(f"       Name    : {SUPERADMIN_NAME}")
    print(f"       Email   : {SUPERADMIN_EMAIL}")
    print(f"       Password: {SUPERADMIN_PASSWORD}")
    print(f"       Role    : super_admin")
    print(f"       Status  : active")
    print(f"       User ID : {user_id}")
    print()
    print("[Seed] WARNING: CHANGE THE PASSWORD immediately after first login!")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
