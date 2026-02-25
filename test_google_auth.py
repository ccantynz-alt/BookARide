#!/usr/bin/env python3
"""Test Google OAuth flow"""

import requests
import os
from dotenv import load_dotenv

# Load environment
load_dotenv('/app/backend/.env')

# Test the OAuth endpoint
print("Testing Google OAuth Authorization...")
print("=" * 60)

response = requests.get('http://localhost:8001/api/auth/google/login', allow_redirects=False)

print(f"Status Code: {response.status_code}")
print(f"Headers: {dict(response.headers)}")

if response.status_code == 307:
    redirect_url = response.headers.get('Location')
    print(f"\n✅ Redirect working!")
    print(f"Redirect URL: {redirect_url[:200]}...")
    
    # Parse the redirect URL to check parameters
    if 'redirect_uri' in redirect_url:
        import urllib.parse
        parsed = urllib.parse.urlparse(redirect_url)
        params = urllib.parse.parse_qs(parsed.query)
        
        print(f"\n📋 OAuth Parameters:")
        print(f"  Client ID: {params.get('client_id', ['NOT FOUND'])[0][:50]}...")
        print(f"  Redirect URI: {params.get('redirect_uri', ['NOT FOUND'])[0]}")
        print(f"  Scope: {params.get('scope', ['NOT FOUND'])[0]}")
        
        print(f"\n⚠️  Make sure this EXACT redirect URI is in Google Console:")
        print(f"  {params.get('redirect_uri', ['NOT FOUND'])[0]}")
else:
    print(f"❌ Expected 307 redirect, got {response.status_code}")
    print(f"Response: {response.text[:500]}")
