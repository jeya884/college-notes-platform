# Supabase Setup - Detailed Guide

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Sign Up" button
3. Choose GitHub or Email signup
4. Verify your email
5. Create organization (or skip)

## Step 2: Create New Project

1. Click "New Project"
2. Fill in details:
   - **Project Name**: College Notes Platform
   - **Database Password**: Create strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Select "Free" tier
3. Click "Create new project"
4. Wait for project to initialize (2-3 minutes)

## Step 3: Get API Keys

1. Click on your project
2. Go to **Settings** (gear icon at bottom left)
3. Click **API** tab
4. Copy these values:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
5. Paste into `js/config.js`

## Step 4: Create Database Tables

1. Go to **SQL Editor** (in left sidebar)
2. Click **New Query**
3. Copy entire content from `docs/DATABASE_SCHEMA.sql`
4. Paste into SQL editor
5. Click **Run** button
6. Verify success message

## Step 5: Configure Storage

1. Go to **Storage** section
2. Verify "notes" bucket is created
3. Click on "notes" bucket
4. Check permissions are set correctly

## Step 6: Configure Authentication

1. Go to **Authentication** in sidebar
2. Click **Providers**
3. Enable providers you want:
   - Email (enabled by default)
   - Google OAuth (optional)
   - GitHub OAuth (optional)

## Step 7: Test Connection

1. Open `index.html` in browser
2. Check browser console (F12)
3. Should see "Config loaded successfully"
4. Try signing up with test email
5. Should receive verification email

## Step 8: Create Test Admin

To test admin features:

1. Sign up with email ending in `@admin`
2. Go to **Authentication → Users**
3. Find your user
4. Click user → Edit
5. In metadata, add: `{"role": "admin"}`
6. Save

## Settings to Adjust

### Email Templates (Optional)
1. Go to **Authentication → Email Templates**
2. Customize welcome, confirmation emails
3. Add your branding

### Rate Limiting
1. Go to **Settings → Rate Limiting**
2. Adjust if needed (free tier: 1000 req/sec)

### JWT Expiration
1. Go to **Settings → JWT Settings**
2. Change token expiry (default: 1 hour)

## Monitoring & Quotas

### Check Usage
1. Go to **Settings → Billing**
2. View current usage
3. Free tier includes:
   - 50,000 database operations/month
   - 1GB storage
   - 2GB bandwidth

### View Logs
1. Go to **Logs** in sidebar
2. Check API activity
3. Monitor errors

## Troubleshooting

### Storage Bucket Not Working
- Go to Storage
- Click "notes" bucket
- Check public/private setting
- Update policies if needed

### Users Can't Upload Files
- Check Storage RLS policies
- Verify bucket permissions
- Check file size limit (50MB)

### Authentication Failing
- Verify SUPABASE_URL and KEY are correct
- Check if user is confirmed (check email)
- Clear browser cookies and cache

### Database Errors
- Re-run SQL schema
- Check table names match exactly
- Verify RLS policies are enabled

## Next Steps

1. ✅ Supabase project created
2. ✅ Database schema uploaded
3. ✅ API keys added to config
4. ✅ Storage configured
5. ✅ Test account created
6. ✅ Ready to deploy!

## Support

- Supabase Docs: https://supabase.com/docs
- Contact: support@supabase.com
- Community: Discord server on supabase.com
