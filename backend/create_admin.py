#!/usr/bin/env python3
"""
Script to create the initial admin user
Run this script once after deployment to create your admin account
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("\n=== Create Admin User ===\n")
    
    # Get admin details
    username = input("Enter admin username: ").strip()
    email = input("Enter admin email: ").strip()
    password = input("Enter admin password: ").strip()
    confirm_password = input("Confirm password: ").strip()
    
    if password != confirm_password:
        print("\n❌ Passwords don't match!")
        client.close()
        return
    
    if len(password) < 8:
        print("\n❌ Password must be at least 8 characters!")
        client.close()
        return
    
    # Check if username exists
    existing = await db.admin_users.find_one({"username": username})
    if existing:
        print(f"\n❌ Username '{username}' already exists!")
        client.close()
        return
    
    # Create admin user
    hashed_password = pwd_context.hash(password)
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": username,
        "email": email,
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc),
        "is_active": True
    }
    
    await db.admin_users.insert_one(admin_user)
    print(f"\n✅ Admin user '{username}' created successfully!")
    print(f"\nLogin at: /admin/login")
    print(f"Username: {username}")
    print(f"Password: (the one you just entered)\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
