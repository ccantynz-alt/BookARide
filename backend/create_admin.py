#!/usr/bin/env python3
"""
Script to create the initial admin user.
Run this script once after deployment to create your admin account.

Uses Neon PostgreSQL via DATABASE_URL.
"""

import asyncio
import os
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("\n❌ DATABASE_URL environment variable is required.")
        print("   Set it in your .env file or export it in your shell.")
        return

    from database import NeonDatabase
    db = await NeonDatabase.connect(database_url)

    print("\n=== Create Admin User ===\n")

    username = input("Enter admin username: ").strip()
    email = input("Enter admin email: ").strip()
    password = input("Enter admin password: ").strip()
    confirm_password = input("Confirm password: ").strip()

    if password != confirm_password:
        print("\n❌ Passwords don't match!")
        return

    if len(password) < 8:
        print("\n❌ Password must be at least 8 characters!")
        return

    existing = await db.admin_users.find_one({"username": username})
    if existing:
        print(f"\n❌ Username '{username}' already exists!")
        return

    hashed_password = pwd_context.hash(password)
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": username,
        "email": email,
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }

    await db.admin_users.insert_one(admin_user)
    print(f"\n✅ Admin user '{username}' created successfully!")
    print(f"\nLogin at: /admin/login")
    print(f"Username: {username}")
    print(f"Password: (the one you just entered)\n")

    await db.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
