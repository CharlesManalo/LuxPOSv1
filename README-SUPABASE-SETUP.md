# LuxPOS Supabase Setup Guide

This guide will help you set up a production-ready Supabase database for your LuxPOS application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- Your LuxPOS project codebase

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: LuxPOS Production
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## Step 2: Get Project Credentials

1. Go to your project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (looks like `https://your-project-ref.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace the placeholder values:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

## Step 4: Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL files in order:

   ### 4.1 Schema Setup
   ```sql
   -- Copy and paste the contents of supabase/schema.sql
   ```
   Click **Run** to execute.

   ### 4.2 Storage Setup
   ```sql
   -- Copy and paste the contents of supabase/storage.sql
   ```
   Click **Run** to execute.

   ### 4.3 Functions and Triggers
   ```sql
   -- Copy and paste the contents of supabase/functions.sql
   ```
   Click **Run** to execute.

   ### 4.4 RLS Policies
   ```sql
   -- Copy and paste the contents of supabase/policies.sql
   ```
   Click **Run** to execute.

   ### 4.5 Initial Data
   ```sql
   -- Copy and paste the contents of supabase/seed.sql
   ```
   Click **Run** to execute.

## Step 5: Create the Super Admin User

1. In your Supabase dashboard, go to **Authentication** → **Users**
2. Click "Add user"
3. Enter the super admin details:
   - **Email**: `admin@yourdomain.com` (replace with your preferred email)
   - **Password**: Create a strong password
   - **Auto-confirm user**: Check this box
4. Click "Save"

5. After creating the user, copy their **ID** from the users table

6. Go back to **SQL Editor** and run:
   ```sql
   INSERT INTO users (auth_id, tenant_id, role, full_name, email)
   VALUES (
       'PASTE_THE_USER_ID_HERE', -- Replace with the actual auth user ID
       '550e8400-e29b-41d4-a716-446655440001', -- Default tenant ID
       'super_admin',
       'Super Admin',
       'admin@yourdomain.com'
   );
   ```

## Step 6: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure the following:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: Add `http://localhost:5173/*`
   - **Enable email confirmations**: Off (for easier testing)

## Step 7: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:5173`

3. Try logging in with your super admin credentials

## Step 8: Production Deployment

For production deployment:

1. Update your environment variables with production values
2. Configure production URLs in Supabase Authentication settings
3. Enable email confirmations
4. Set up proper CORS policies
5. Configure custom domains if needed

## Database Structure Overview

### Core Tables
- `tenants` - Multi-tenant support
- `users` - Application users linked to Supabase Auth
- `categories` - Product categories
- `ingredients` - Inventory items
- `products` - Menu items
- `product_variants` - Product variations (size, etc.)
- `product_ingredients` - Product recipes
- `orders` - Customer orders
- `order_items` - Individual order items
- `inventory_logs` - Stock movement tracking
- `notifications` - System notifications
- `user_profiles` - Extended user information

### Security Features
- Row Level Security (RLS) on all tables
- Tenant isolation
- Role-based access control
- Secure file storage

### Automated Features
- Automatic stock updates on orders
- Low stock alerts
- Inventory logging
- Dashboard statistics

## Troubleshooting

### Common Issues

1. **"User not found" error**
   - Make sure you created the user record in the `users` table
   - Check that the `auth_id` matches the actual auth user ID

2. **"Permission denied" errors**
   - Ensure RLS policies are properly set up
   - Check that the user has the correct role and tenant

3. **Storage upload issues**
   - Verify storage policies are in place
   - Check file size limits and allowed MIME types

4. **Database connection issues**
   - Verify your environment variables are correct
   - Check that your Supabase project is active

### Getting Help

- Check the Supabase documentation: https://supabase.com/docs
- Review the SQL error messages in the Supabase dashboard
- Ensure all SQL files were executed in the correct order

## Next Steps

After setup is complete:

1. Create additional users and tenants as needed
2. Customize categories and products
3. Set up inventory management
4. Configure receipt printing
5. Test all workflows thoroughly

## Security Notes

- Never commit your `.env` file to version control
- Use strong passwords for all accounts
- Enable two-factor authentication on your Supabase account
- Regularly review and update RLS policies
- Monitor your database for unusual activity
