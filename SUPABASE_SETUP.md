# LuxPOS Supabase Integration Setup Guide

This guide will help you set up LuxPOS to use Supabase as the main database for all accounts, orders, and other data.

## Prerequisites

- A Supabase account (https://supabase.com)
- Node.js and npm installed
- LuxPOS project cloned locally

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "luxpos")
5. Set a strong database password
6. Choose a region closest to your users
7. Click "Create new project"

## Step 2: Set Up Database Schema

1. In your Supabase project, go to the **SQL Editor**
2. Copy the contents of `supabase-migrations.sql` from this project
3. Paste it into the SQL Editor and click **Run**
4. This will create all the necessary tables and set up Row Level Security (RLS)

## Step 3: Configure Environment Variables

1. In your Supabase project, go to **Settings** → **API**
2. Copy your Project URL and Anon Key
3. Create a `.env` file in the `app` directory:
   ```bash
   cd app
   cp .env.example .env
   ```
4. Edit the `.env` file and replace the placeholder values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Step 4: Set Up Authentication

1. In Supabase, go to **Authentication** → **Settings**
2. Configure your site URL: `http://localhost:3003` (for development)
3. Add redirect URLs for production when deployed
4. Enable email/password authentication if desired

## Step 5: Configure Storage

1. In Supabase, go to **Storage**
2. The `product-images` bucket should already be created by the migration script
3. Verify the bucket exists and is public
4. Test image upload functionality

## Step 6: Update Application Code

The application has been updated with:

### ✅ Image Upload Functionality
- Product creation form now includes image upload
- Images are stored in Supabase Storage
- File validation (type, size limits)
- Image preview before upload

### ✅ Supabase Database Integration
- Complete database schema in `src/types/database.ts`
- Supabase client configuration in `src/lib/supabase.ts`
- Database operations in `src/lib/supabaseDb.ts`
- Image upload utilities in `src/lib/imageUpload.ts`

### 🔄 Partial Integration
- Some functions still use `mockDb` (for backward compatibility)
- Authentication still uses the mock system
- You can gradually migrate to Supabase functions

## Step 7: Test the Integration

1. Start the development server:
   ```bash
   cd app
   npm run dev
   ```

2. Test image upload:
   - Go to Dashboard → Inventory → Products
   - Click "+ Add Product"
   - Try uploading an image
   - Verify the image appears in the product list

3. Test database operations:
   - Create new products, categories, ingredients
   - Verify data persists in Supabase dashboard

## Step 8: Production Deployment

For production deployment:

1. Update environment variables with production values
2. Configure proper CORS settings in Supabase
3. Set up proper authentication providers
4. Enable database backups
5. Monitor storage usage for images

## Migration from Mock Database

To fully migrate from the mock database:

1. Replace imports in components:
   ```typescript
   // From:
   import { createProduct } from '@/lib/mockDb';
   // To:
   import { createProduct } from '@/lib/supabaseDb';
   ```

2. Update authentication to use Supabase Auth
3. Test all functionality
4. Remove mock database files when confident

## Features Added

### Image Upload System
- **File Types**: JPEG, PNG, WebP
- **Max Size**: 5MB per image
- **Storage**: Supabase Storage bucket
- **Validation**: Client-side and server-side
- **UI**: Drag-and-drop or click to upload
- **Preview**: Image preview before saving

### Database Schema
- **Tenants**: Multi-tenant architecture
- **Users**: Role-based access control
- **Products**: With variants and recipes
- **Orders**: Complete order management
- **Inventory**: Stock tracking and logs
- **Notifications**: System notifications

### Security
- **Row Level Security (RLS)**: Data isolation per tenant
- **Authentication**: Ready for Supabase Auth integration
- **Storage Policies**: Secure image access

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your domain is added to Supabase CORS settings
2. **Storage Access**: Verify storage bucket policies are correct
3. **RLS Policies**: Check that Row Level Security allows proper access
4. **Environment Variables**: Ensure `.env` file is properly configured

### Debug Tips

- Check browser console for errors
- Verify network requests in DevTools
- Check Supabase logs for database errors
- Test with small files first

## Support

If you encounter issues:

1. Check the Supabase dashboard logs
2. Verify all environment variables are set
3. Ensure database schema was created correctly
4. Test with a fresh Supabase project if needed

## Next Steps

1. Complete authentication migration to Supabase Auth
2. Add real-time subscriptions for live updates
3. Implement proper error handling and loading states
4. Add data validation and sanitization
5. Set up automated backups and monitoring
