# Production Monitoring Setup (Frontend + Backend)

This repo includes a scheduled GitHub Actions monitor:

- Workflow: `.github/workflows/production-smoke-monitor.yml`
- Frequency: every 15 minutes
- Checks:
  - frontend homepage
  - backend `/health`
  - backend `/api/health`
  - backend forgot-password endpoint reachability

## One-time setup

In GitHub repo settings, add these **Actions secrets**:

- `PROD_FRONTEND_URL`  
  Example: `https://bookaride.co.nz`
- `PROD_BACKEND_URL`  
  Example: `https://your-backend-service.onrender.com`

Then run the workflow once manually from:

`Actions -> Production Smoke Monitor -> Run workflow`

## How this keeps things green

- If frontend or backend goes down, the workflow run fails quickly.
- You get failure notifications via GitHub Actions notifications.
- The failing step points to which surface broke (frontend, health, or forgot-password route).

## Optional hardening (recommended)

1. Keep Render auto-deploy enabled for backend/frontend.
2. Add a second external monitor (UptimeRobot/Better Stack) for independent alerts.
3. Route alert emails to a shared ops inbox so failures are seen immediately.
