"""
Vercel Serverless Function entry point for the BookARide FastAPI backend.
Vercel automatically detects this as a Python serverless function and
routes /api/* requests to the FastAPI app.
"""
import sys
import os

# Add backend directory to Python path so imports resolve
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from server import app
