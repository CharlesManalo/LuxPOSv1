-- Storage buckets and policies for LuxPOS
-- This sets up file storage for product images and user avatars

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true, -- Public bucket for product images
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-avatars',
    'user-avatars',
    true, -- Public bucket for user avatars
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
-- Users can view product images in their tenant
CREATE POLICY "Users can view product images in their tenant" ON storage.objects
    FOR SELECT USING (
        storage.objects.bucket_id = 'product-images' AND
        (
            -- Super admins can view all
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_id = auth.uid() 
                AND role = 'super_admin'
                AND is_active = true
            ) OR
            -- Users can view images in their tenant
            EXISTS (
                SELECT 1 FROM products p
                JOIN tenants t ON p.tenant_id = t.id
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
                AND t.id = (
                    SELECT tenant_id FROM users 
                    WHERE auth_id = auth.uid() 
                    AND is_active = true
                )
            )
        )
    );

-- Tenant admins can upload product images
CREATE POLICY "Tenant admins can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        storage.objects.bucket_id = 'product-images' AND
        (
            -- Super admins can upload to any tenant
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_id = auth.uid() 
                AND role = 'super_admin'
                AND is_active = true
            ) OR
            -- Tenant admins can upload to their tenant
            EXISTS (
                SELECT 1 FROM products p
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
                AND p.tenant_id = (
                    SELECT tenant_id FROM users 
                    WHERE auth_id = auth.uid() 
                    AND role IN ('admin', 'owner', 'tenant')
                    AND is_active = true
                )
            )
        )
    );

-- Tenant admins can update product images
CREATE POLICY "Tenant admins can update product images" ON storage.objects
    FOR UPDATE USING (
        storage.objects.bucket_id = 'product-images' AND
        (
            -- Super admins can update all
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_id = auth.uid() 
                AND role = 'super_admin'
                AND is_active = true
            ) OR
            -- Tenant admins can update their tenant's images
            EXISTS (
                SELECT 1 FROM products p
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
                AND p.tenant_id = (
                    SELECT tenant_id FROM users 
                    WHERE auth_id = auth.uid() 
                    AND role IN ('admin', 'owner', 'tenant')
                    AND is_active = true
                )
            )
        )
    );

-- Tenant admins can delete product images
CREATE POLICY "Tenant admins can delete product images" ON storage.objects
    FOR DELETE USING (
        storage.objects.bucket_id = 'product-images' AND
        (
            -- Super admins can delete all
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_id = auth.uid() 
                AND role = 'super_admin'
                AND is_active = true
            ) OR
            -- Tenant admins can delete their tenant's images
            EXISTS (
                SELECT 1 FROM products p
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
                AND p.tenant_id = (
                    SELECT tenant_id FROM users 
                    WHERE auth_id = auth.uid() 
                    AND role IN ('admin', 'owner', 'tenant')
                    AND is_active = true
                )
            )
        )
    );

-- Storage policies for user avatars
-- Anyone can view user avatars
CREATE POLICY "Anyone can view user avatars" ON storage.objects
    FOR SELECT USING (storage.objects.bucket_id = 'user-avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        storage.objects.bucket_id = 'user-avatars' AND
        (storage.foldername(storage.objects.name))[1] = auth.uid()::text
    );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        storage.objects.bucket_id = 'user-avatars' AND
        (storage.foldername(storage.objects.name))[1] = auth.uid()::text
    );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        storage.objects.bucket_id = 'user-avatars' AND
        (storage.foldername(storage.objects.name))[1] = auth.uid()::text
    );

-- Function to generate public URL for product images
CREATE OR REPLACE FUNCTION get_product_image_url(product_uuid UUID, image_name TEXT DEFAULT 'default.jpg')
RETURNS TEXT AS $$
BEGIN
    RETURN '/storage/v1/object/public/product-images/' || product_uuid::text || '/' || image_name;
END;
$$ LANGUAGE plpgsql;

-- Function to generate public URL for user avatars
CREATE OR REPLACE FUNCTION get_avatar_url(user_auth_id UUID, image_name TEXT DEFAULT 'default.jpg')
RETURNS TEXT AS $$
BEGIN
    RETURN '/storage/v1/object/public/user-avatars/' || user_auth_id::text || '/' || image_name;
END;
$$ LANGUAGE plpgsql;
