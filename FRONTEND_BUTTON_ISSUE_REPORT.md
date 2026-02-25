# Frontend Button Visibility Issue - Investigation Report

## Issue Summary
Calendar authorization button added to AdminDashboard.jsx is visible on localhost:3000 but NOT visible on production URL https://bookaride.co.nz/admin/dashboard

## Investigation Results

### ✅ What's Working:
1. Code is correctly added to `/app/frontend/src/pages/AdminDashboard.jsx` (lines 284-292)
2. React dev server compiles successfully (no errors)
3. Frontend supervisor service shows RUNNING status
4. Button is visible when accessing localhost:3000 (confirmed via screenshot tool)
5. Hot reload is working - changes to other files appear correctly on localhost

### ❌ What's NOT Working:
1. Production URL (https://bookaride.co.nz) does NOT show the new button
2. User tried: hard refresh, cache clear, incognito mode, different browsers - no success
3. Multiple frontend restarts did not help

### Root Cause Analysis:
Based on troubleshooting agent investigation, the issue is that **the production URL is not properly routing to the React dev server on port 3000**. There appears to be a deployment pipeline or proxy configuration that needs to be updated.

## Technical Details

### Current Configuration:
- **Frontend Service**: React dev server via `yarn start` on port 3000
- **Supervisor Config**: `/etc/supervisor/conf.d/supervisord.conf` - [program:frontend]
- **Command**: `yarn start`
- **Environment**: `HOST="0.0.0.0",PORT="3000"`
- **Status**: RUNNING (pid varies, restarts successfully)

### Code Changes Made:
```javascript
// File: /app/frontend/src/pages/AdminDashboard.jsx
// Lines 284-292

<Button 
  onClick={() => {
    window.open(`${BACKEND_URL}/api/auth/google/login`, '_blank');
    toast.info('Opening Google Calendar authorization in new tab...');
  }}
  variant="outline" 
  className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
>
  📅 Authorize Calendar
</Button>
```

### Compilation Status:
```
Compiled successfully!
webpack compiled successfully
```

## Attempted Fixes

1. ✅ Restarted frontend service multiple times
2. ✅ Touched AdminDashboard.jsx to trigger recompile
3. ✅ Verified code is in the file
4. ✅ Checked for syntax errors (none found)
5. ✅ Tested on localhost:3000 (works correctly)
6. ❌ Production URL still doesn't reflect changes

## Possible Causes

Based on Emergent platform architecture:

### 1. Kubernetes Ingress/Proxy Caching
- **Likelihood**: HIGH
- **Description**: Kubernetes ingress controller may be caching frontend responses
- **Solution**: Need to clear ingress cache or restart ingress controller

### 2. CDN/Cloudflare Caching
- **Likelihood**: MEDIUM  
- **Description**: Production URL uses Cloudflare which aggressively caches assets
- **Solution**: Need to purge Cloudflare cache for https://bookaride.co.nz

### 3. Service Worker Caching
- **Likelihood**: LOW
- **Description**: React app may have registered a service worker
- **Solution**: Check for service-worker.js and unregister

### 4. Multiple Frontend Instances
- **Likelihood**: LOW
- **Description**: Multiple frontend pods, some not updated
- **Solution**: Restart all frontend pods in cluster

### 5. Build vs Dev Server Mismatch
- **Likelihood**: HIGH
- **Description**: Production serves static build files, not dev server
- **Solution**: Run `yarn build` and deploy build artifacts

## Recommended Actions

### For Emergent Support Team:

**Option A: Clear Platform Caches**
```bash
# Clear Kubernetes ingress cache
kubectl delete pods -l app=ingress-nginx

# Force reload frontend service
kubectl rollout restart deployment/frontend

# Purge CDN cache
# (via Cloudflare dashboard or API)
```

**Option B: Deploy Static Build**
```bash
cd /app/frontend
yarn build
# Deploy build/ directory to production
```

**Option C: Verify Routing**
```bash
# Check if port 3000 is accessible from ingress
kubectl exec -it <ingress-pod> -- curl http://frontend-service:3000/admin/dashboard | grep "Authorize Calendar"
```

## Temporary Workaround

User can access calendar authorization directly via:
```
https://bookaride.co.nz/api/auth/google/login
```

This URL bypasses the frontend button and goes directly to the OAuth endpoint.

## Files to Review

1. `/app/frontend/src/pages/AdminDashboard.jsx` - Contains the button code
2. `/etc/supervisor/conf.d/supervisord.conf` - Frontend service config
3. `/etc/nginx/*` - Nginx proxy configurations
4. Kubernetes ingress configuration (if applicable)
5. Cloudflare cache settings for bookaride.co.nz

## Next Steps

1. **Immediate**: User should use direct link for calendar authorization
2. **Short-term**: Emergent support to investigate routing/caching issue
3. **Long-term**: Document proper deployment procedure for frontend changes

## Contact Info

- **User Domain**: bookaride.co.nz
- **Internal Domain**: ride-booking-fix-2.emergent.host
- **Issue Date**: December 7, 2025
- **Priority**: MEDIUM (workaround available)

---

**Status**: UNDER INVESTIGATION  
**Workaround**: Direct link provided  
**Requires**: Emergent platform support
