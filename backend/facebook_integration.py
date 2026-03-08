"""
Facebook Business Page Integration for BookaRide Admin Panel.

Supports:
- OAuth: Connect/disconnect Facebook Business Page via Meta OAuth flow
- Page Posts: Create, schedule, and list posts on the connected page
- Messenger: Webhook for auto-replying to incoming Messenger messages
- Insights: Pull basic page analytics (reach, engagement)

Requires environment variables:
  FACEBOOK_APP_ID        - Meta App ID
  FACEBOOK_APP_SECRET    - Meta App Secret
  FACEBOOK_VERIFY_TOKEN  - Webhook verification token (you choose this)
"""

import os
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

import requests

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

GRAPH_API = "https://graph.facebook.com/v19.0"


def _fb_configured() -> bool:
    return bool(os.environ.get("FACEBOOK_APP_ID") and os.environ.get("FACEBOOK_APP_SECRET"))


def _graph(path: str, params: dict | None = None, method: str = "GET", data: dict | None = None, timeout: int = 15):
    """Thin wrapper around the Graph API."""
    url = f"{GRAPH_API}/{path.lstrip('/')}"
    try:
        if method == "GET":
            resp = requests.get(url, params=params, timeout=timeout)
        else:
            resp = requests.post(url, params=params, json=data, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.HTTPError as e:
        body = {}
        try:
            body = e.response.json()
        except Exception:
            pass
        logger.error(f"Graph API error {e.response.status_code}: {body}")
        raise
    except Exception as e:
        logger.error(f"Graph API request failed: {e}")
        raise


# ---------------------------------------------------------------------------
# OAuth helpers
# ---------------------------------------------------------------------------

def get_oauth_url(redirect_uri: str) -> str:
    """Return the Meta OAuth dialog URL the admin should be redirected to."""
    app_id = os.environ.get("FACEBOOK_APP_ID", "")
    scopes = "pages_manage_posts,pages_read_engagement,pages_messaging,pages_read_user_content"
    return (
        f"https://www.facebook.com/v19.0/dialog/oauth"
        f"?client_id={app_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scopes}"
        f"&response_type=code"
    )


def exchange_code_for_token(code: str, redirect_uri: str) -> dict:
    """Exchange the short-lived code for a user access token, then get a long-lived token."""
    app_id = os.environ.get("FACEBOOK_APP_ID", "")
    app_secret = os.environ.get("FACEBOOK_APP_SECRET", "")

    # Short-lived user token
    resp = _graph("oauth/access_token", params={
        "client_id": app_id,
        "redirect_uri": redirect_uri,
        "client_secret": app_secret,
        "code": code,
    })
    short_token = resp["access_token"]

    # Exchange for long-lived token (~60 days)
    resp = _graph("oauth/access_token", params={
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_token,
    })
    long_token = resp["access_token"]
    expires_in = resp.get("expires_in", 5184000)  # default 60 days

    return {"access_token": long_token, "expires_in": expires_in}


def get_user_pages(user_token: str) -> list[dict]:
    """Fetch pages the user manages. Returns [{id, name, access_token, category}, ...]"""
    resp = _graph("me/accounts", params={
        "access_token": user_token,
        "fields": "id,name,access_token,category,picture{url}",
    })
    pages = []
    for p in resp.get("data", []):
        pages.append({
            "id": p["id"],
            "name": p["name"],
            "access_token": p["access_token"],
            "category": p.get("category", ""),
            "picture_url": p.get("picture", {}).get("data", {}).get("url", ""),
        })
    return pages


# ---------------------------------------------------------------------------
# Page posting
# ---------------------------------------------------------------------------

def create_page_post(page_id: str, page_token: str, message: str, link: str | None = None, scheduled_time: int | None = None) -> dict:
    """Create a post on the page. If scheduled_time (unix ts) is provided, schedule it."""
    data = {"message": message}
    if link:
        data["link"] = link
    if scheduled_time:
        data["scheduled_publish_time"] = scheduled_time
        data["published"] = False

    resp = _graph(f"{page_id}/feed", params={"access_token": page_token}, method="POST", data=data)
    return resp  # {"id": "page_post_id"}


def get_page_posts(page_id: str, page_token: str, limit: int = 25) -> list[dict]:
    """Fetch recent posts from the page."""
    resp = _graph(f"{page_id}/feed", params={
        "access_token": page_token,
        "fields": "id,message,created_time,full_picture,permalink_url,shares,likes.summary(true),comments.summary(true),is_published,scheduled_publish_time",
        "limit": limit,
    })
    return resp.get("data", [])


def delete_page_post(post_id: str, page_token: str) -> bool:
    """Delete a page post."""
    try:
        _graph(post_id, params={"access_token": page_token}, method="POST", data={"method": "delete"})
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Page insights (basic)
# ---------------------------------------------------------------------------

def get_page_insights(page_id: str, page_token: str, period: str = "day", metrics: str | None = None) -> dict:
    """Fetch page-level insights."""
    if not metrics:
        metrics = "page_impressions,page_engaged_users,page_fans,page_views_total"
    try:
        resp = _graph(f"{page_id}/insights", params={
            "access_token": page_token,
            "metric": metrics,
            "period": period,
        })
        return resp.get("data", [])
    except Exception as e:
        logger.error(f"Failed to fetch page insights: {e}")
        return []


# ---------------------------------------------------------------------------
# Messenger auto-reply
# ---------------------------------------------------------------------------

AUTO_REPLY_TEMPLATES = {
    "greeting": (
        "Hi {name}! Thanks for reaching out to BookaRide NZ.\n\n"
        "We provide premium airport transfers, city rides, and long-distance shuttles across New Zealand.\n\n"
        "Get an instant quote at bookaride.co.nz/book-now or reply here and our team will help you."
    ),
    "pricing": (
        "For instant pricing, visit bookaride.co.nz/book-now and enter your pickup and dropoff addresses.\n\n"
        "Our prices are fixed — no surge, no surprises!"
    ),
    "default": (
        "Thanks for your message! Our team typically responds within 1 hour during business hours (8am-8pm NZST).\n\n"
        "For instant pricing and booking, visit bookaride.co.nz/book-now"
    ),
}

PRICING_KEYWORDS = {"price", "cost", "how much", "rate", "fare", "quote", "pricing", "charge"}
GREETING_KEYWORDS = {"hi", "hello", "hey", "kia ora", "good morning", "good afternoon", "good evening"}


def classify_message(text: str) -> str:
    """Simple keyword classifier for incoming Messenger messages."""
    lower = text.lower().strip()
    words = set(lower.split())
    # Check greeting first (short messages)
    if len(lower) < 30 and words & GREETING_KEYWORDS:
        return "greeting"
    if any(kw in lower for kw in PRICING_KEYWORDS):
        return "pricing"
    return "default"


def build_auto_reply(message_text: str, sender_name: str = "there") -> str:
    """Generate an auto-reply based on the incoming message."""
    category = classify_message(message_text)
    template = AUTO_REPLY_TEMPLATES[category]
    return template.format(name=sender_name)


def send_messenger_reply(recipient_id: str, message_text: str, page_token: str) -> bool:
    """Send a text reply via Messenger."""
    try:
        _graph("me/messages", params={"access_token": page_token}, method="POST", data={
            "recipient": {"id": recipient_id},
            "message": {"text": message_text},
            "messaging_type": "RESPONSE",
        })
        return True
    except Exception as e:
        logger.error(f"Failed to send Messenger reply: {e}")
        return False
