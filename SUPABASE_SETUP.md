# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization and enter project details:
   - **Name**: `workout-tracker`
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to your users
4. Wait for the project to be created (2-3 minutes)

## 2. Set Up Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the contents of `database-schema.sql` from this project
3. Paste it into the SQL Editor and click **Run**
4. This will create all necessary tables, policies, and triggers

## 3. Configure Environment Variables

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://abcdefg.supabase.co`)
   - **Public anon key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

3. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

4. Fill in your Supabase credentials in the `.env` file:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Configure Email/Password Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. **IMPORTANT**: Turn OFF **"Enable email confirmations"**
   - This allows users to sign up and immediately sign in without clicking email links
   - Without this, users will get "Email not confirmed" errors
3. Make sure **"Enable signup"** is ON
4. **Site URL** should be `http://localhost:5173` (for development)
5. Click **Save**

### Why disable email confirmations?
- **Simpler UX**: Users can sign up and immediately start using the app
- **No email setup needed**: No need to configure SMTP or email templates
- **Perfect for development**: Testing auth flows without email complications
- **Still secure**: Users still need valid passwords to access their accounts

## 5. Database Structure

The setup creates these tables:

### `profiles`
- User profile information (extends auth.users)
- Stores email, full_name, avatar_url

### `workouts`
- Individual workout entries
- Links to user via user_id
- Stores exercise_name, reps, weight, date

### `body_weights`
- Body weight tracking entries
- One entry per user per day
- Stores weight and date

### `exercises`
- Global exercise library (shared across all users)
- Pre-populated with common exercises
- Users can reference these in their workouts

### `user_exercises`
- User-specific exercise preferences
- Links users to exercises they use
- Allows custom names and favorites

## 6. Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Proper authentication is required
- No data leakage between users

## 7. Test the Setup

1. Start your development server: `npm run dev`
2. The app should show the login screen
3. Click "Don't have an account? Sign up"
4. Create an account with any email (e.g., `test@example.com`) and password (6+ chars)
5. You should be immediately signed in (no email verification needed!)
6. Add some workout data to test the database connection
7. Sign out and sign back in with the same credentials
8. Try opening the app in another browser tab - data should sync in real-time!

## 8. Real-time Features

The setup includes real-time subscriptions so data will sync instantly across devices when you're logged in to the same account.

## Troubleshooting

### Common Issues

- **Connection errors**: Check your environment variables in `.env`
- **"Email not confirmed" error**: 
  - Go to Supabase → Authentication → Settings
  - Turn OFF "Enable email confirmations"
  - This is the #1 cause of auth issues!
- **"Invalid login credentials"**: Double-check email and password are correct
- **Can't sign up**: Make sure "Enable signup" is ON in Supabase auth settings
- **Permission errors**: Ensure RLS policies are properly set up by running the full SQL schema
- **Profile not created**: Check that the trigger function `handle_new_user()` is working

### Quick Fixes

1. **Most important**: Disable email confirmations in Supabase auth settings
2. **Reset auth state**: Clear browser storage and cookies
3. **Check network**: Ensure you can access `https://your-project.supabase.co`
4. **Verify setup**: Run the SQL schema again if tables are missing
5. **Test in incognito**: Rule out browser extension conflicts
6. **Check console**: Look for detailed error messages in browser dev tools

### Test Account
For quick testing, create an account with:
- **Email**: `test@example.com` 
- **Password**: `password123`

This should work immediately without any email verification!