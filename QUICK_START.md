# ⚡ Quick Start - Get Running in 5 Minutes

## 🚨 The Key Fix

The main issue was **email confirmation** being enabled in Supabase. Here's the 2-step fix:

### Step 1: Disable Email Confirmations in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Settings**
4. **Turn OFF "Enable email confirmations"** ⬅️ THIS IS CRITICAL!
5. Make sure **"Enable signup"** is ON
6. Click **Save**

### Step 2: Test the App

```bash
npm run dev
```

Now try:
1. Click "Don't have an account? Sign up"
2. Use `test@example.com` / `password123`
3. You should be immediately signed in! ✅

## Why This Fixes It

- **Before**: Supabase required users to click email verification links
- **After**: Users can sign up and immediately start using the app
- **No more**: "Email not confirmed" errors
- **Still secure**: Users need valid passwords to access accounts

## If You Still Get Errors

1. **Clear browser storage**: Dev tools → Application → Clear storage
2. **Check environment**: Make sure `.env` has your Supabase URL and key
3. **Verify database**: Run the SQL schema from `database-schema.sql`
4. **Check console**: Look for detailed error messages

## That's It! 

With email confirmations disabled, the simple email/password auth should work perfectly. Users can:
- ✅ Sign up instantly 
- ✅ Sign in immediately
- ✅ Sync data across devices
- ✅ No email hassles

The authentication flow is now:
**Enter email + password → Click Create Account → Start tracking! 🏋️‍♂️**