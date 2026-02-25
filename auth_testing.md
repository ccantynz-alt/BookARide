# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# Test auth endpoint
curl -X GET "https://bookaride.co.nz/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test protected endpoints
curl -X GET "https://bookaride.co.nz/api/bookings" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing
```javascript
// Set cookie and navigate
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "bookaride.co.nz",
    "path": "/",
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
}]);
await page.goto("https://bookaride.co.nz");
```

## Quick Debug
```bash
# Check data format
mongosh --eval "
use('test_database');
db.admin_users.find().limit(2).pretty();
db.admin_sessions.find().limit(2).pretty();
db.password_reset_tokens.find().limit(2).pretty();
"

# Clean test data
mongosh --eval "
use('test_database');
db.admin_sessions.deleteMany({session_token: /test_session/});
db.password_reset_tokens.deleteMany({created_at: {\$lt: new Date(Date.now() - 3600000)}});
"
```

## Checklist
- [ ] Admin user exists in admin_users collection
- [ ] Password reset tokens stored in password_reset_tokens collection
- [ ] Admin sessions stored in admin_sessions collection
- [ ] All queries use `{"_id": 0}` projection
- [ ] API returns proper responses (not 401/404)
- [ ] Dashboard loads after Google OAuth

## Success Indicators
✅ /api/admin/me returns admin data
✅ Dashboard loads without redirect
✅ Password reset email sent successfully
✅ Google OAuth redirects correctly

## Failure Indicators
❌ "User not found" errors
❌ 401 Unauthorized responses
❌ Redirect to login page after OAuth
