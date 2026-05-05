-- Admin Account Setup Script for LuxPOS
-- Run this script after creating your Supabase auth user

-- Step 1: Create the super admin user record
-- Replace 'YOUR_AUTH_USER_ID_HERE' with the actual auth.user.id from your Supabase auth users table

-- First, get your auth user ID by running:
-- SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';

-- Then insert the user record:
INSERT INTO users (auth_id, tenant_id, role, full_name, email, is_active)
VALUES (
    'YOUR_AUTH_USER_ID_HERE', -- Replace with actual auth user ID
    '550e8400-e29b-41d4-a716-446655440001', -- Default tenant ID
    'super_admin',
    'Super Admin',
    'admin@luxpos.app',
    true
) ON CONFLICT (auth_id) DO NOTHING;

-- Step 2: Create additional users for testing (optional)
-- You can create tenant admin, owner, and cashier users as needed

-- Example: Create a tenant admin
-- First create auth user for tenant admin, then:
INSERT INTO users (auth_id, tenant_id, role, full_name, email, is_active)
VALUES (
    'TENANT_ADMIN_AUTH_ID_HERE', -- Replace with actual auth user ID
    '550e8400-e29b-41d4-a716-446655440001',
    'admin',
    'Restaurant Manager',
    'manager@luxpos.app',
    true
) ON CONFLICT (auth_id) DO NOTHING;

-- Example: Create a cashier
-- First create auth user for cashier, then:
INSERT INTO users (auth_id, tenant_id, role, full_name, email, is_active)
VALUES (
    'CASHIER_AUTH_ID_HERE', -- Replace with actual auth user ID
    '550e8400-e29b-41d4-a716-446655440001',
    'cashier',
    'Cashier User',
    'cashier@luxpos.app',
    true
) ON CONFLICT (auth_id) DO NOTHING;

-- Step 3: Verify setup
-- Run these queries to verify your setup:

-- Check all users:
SELECT u.*, t.name as tenant_name 
FROM users u 
JOIN tenants t ON u.tenant_id = t.id 
ORDER BY u.created_at;

-- Check tenant setup:
SELECT * FROM tenants;

-- Check if super admin has proper access:
SELECT 
    u.role,
    u.email,
    t.name as tenant,
    COUNT(*) as user_count
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.role = 'super_admin'
GROUP BY u.role, u.email, t.name;
