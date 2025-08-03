# 🔧 Google OAuth Setup - Step by Step

This error means Google OAuth isn't enabled in your Supabase project. Follow these exact steps:

## Step 1: Enable Google in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. In the left sidebar, click **Authentication**
4. Click **Providers** (or **Settings** → **Auth** → **External OAuth Providers**)
5. Find **Google** in the list
6. Toggle the **Enable** switch to ON
7. You'll see fields for Client ID and Client Secret - leave them empty for now

## Step 2: Quick Test (Optional - for immediate testing)

If you just want to test if it works without setting up Google Cloud Console:

1. In Supabase, under Google provider settings:
   - **Client ID**: Leave empty or put any text
   - **Client Secret**: Leave empty or put any text
   - **Redirect URL**: `http://localhost:5173`
2. Click **Save**
3. Try the app - it should at least not show the "provider not enabled" error

⚠️ **Note**: This won't actually work for real authentication, but will test if the provider is enabled.

## Step 3: Full Google Cloud Console Setup (Required for real auth)

### 3.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name your project (e.g., "Workout Tracker")
4. Click **Create**

### 3.2 Enable Google+ API

1. In the left menu, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click **Enable**
4. Also search for "People API" and enable it (sometimes needed)

### 3.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in required fields:
   - **App name**: "Workout Tracker"
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. Skip **Scopes** page (click **Save and Continue**)
6. Skip **Test users** page (click **Save and Continue**)

### 3.4 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Name it "Workout Tracker Web"
5. Add **Authorized redirect URIs**:
   - `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
   - `http://localhost:5173` (for development)
6. Click **Create**
7. **Copy the Client ID and Client Secret** - you'll need these!

### 3.5 Configure Supabase with Google Credentials

1. Back in Supabase, go to **Authentication** → **Providers** → **Google**
2. Paste your credentials:
   - **Client ID**: The Client ID from Google
   - **Client Secret**: The Client Secret from Google
3. Click **Save**

## Step 4: Update Your Redirect URL

Make sure your redirect URL in the app matches what you set in Google:

```typescript
// In src/services/supabase.ts, the redirect should be:
redirectTo: `${window.location.origin}` // This will be http://localhost:5173 in dev
```

## Step 5: Test the Setup

1. Start your app: `npm run dev`
2. Click "Continue with Google"
3. You should be redirected to Google's authorization page
4. After authorizing, you should be redirected back to your app
5. Check the browser's network tab for any errors

## Troubleshooting

### Common Errors:

1. **"provider is not enabled"** 
   - Solution: Make sure Google is toggled ON in Supabase Auth Providers

2. **"unauthorized_client"**
   - Solution: Check that your redirect URI in Google Cloud Console matches exactly

3. **"access_denied"**
   - Solution: Make sure OAuth consent screen is configured

4. **"redirect_uri_mismatch"**
   - Solution: Add `http://localhost:5173` to authorized redirect URIs in Google Cloud Console

### Quick Debug Steps:

1. Check Supabase logs: **Authentication** → **Logs**
2. Check browser console for errors
3. Verify your `.env` file has correct Supabase URL and key
4. Make sure Google Cloud project has Google+ API enabled

## Alternative: Use Development Mode

If you just want to test quickly without full Google setup:

1. In Supabase, enable Google provider (even with dummy credentials)
2. The error will change, which confirms the provider is enabled
3. Set up proper Google credentials later

Let me know if you get stuck on any step!