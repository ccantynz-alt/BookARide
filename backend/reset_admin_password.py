#!/usr/bin/env python3
"""
Emergency script to reset an admin password when locked out.
Use when: login fails, password reset email not received, or Mailgun not configured.

Run from backend directory: python reset_admin_password.py

Requires: MONGO_URL and DB_NAME in .env (or environment)
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Must match server.py
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


async def reset_password():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'bookaride')

    if not mongo_url:
        print("\n❌ MONGO_URL not set. Add it to backend/.env")
        print("   Example: MONGO_URL=mongodb://localhost:27017")
        sys.exit(1)

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("\n=== Admin Password Reset (Emergency) ===\n")

    # List existing admins
    admins = await db.admin_users.find({}, {"username": 1, "email": 1}).to_list(100)
    if not admins:
        print("No admin users found. Run create_admin.py first.")
        client.close()
        sys.exit(1)

    print("Existing admin accounts:")
    for a in admins:
        print(f"  - {a.get('username')} ({a.get('email', 'no email')})")
    print()

    username = input("Enter username to reset: ").strip()
    if not username:
        print("Username required.")
        client.close()
        sys.exit(1)

    admin = await db.admin_users.find_one({"username": username})
    if not admin:
        print(f"\n❌ User '{username}' not found!")
        client.close()
        sys.exit(1)

    new_password = input("Enter new password: ").strip()
    confirm = input("Confirm new password: ").strip()

    if new_password != confirm:
        print("\n❌ Passwords don't match!")
        client.close()
        sys.exit(1)

    if len(new_password) < 8:
        print("\n❌ Password must be at least 8 characters!")
        client.close()
        sys.exit(1)

    hashed = pwd_context.hash(new_password)
    await db.admin_users.update_one(
        {"username": username},
        {"$set": {"hashed_password": hashed}}
    )

    print(f"\n✅ Password reset for '{username}'!")
    print("   You can now log in at /admin/login\n")
    client.close()


if __name__ == "__main__":
    asyncio.run(reset_password())
