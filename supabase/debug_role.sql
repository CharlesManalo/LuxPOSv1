-- Debug script to identify the role column issue

-- Check if users table exists
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') AS users_table_exists;

-- Check users table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any users in the table
SELECT COUNT(*) as user_count FROM users;

-- Check current auth context
SELECT auth.uid() as current_auth_uid;

-- Test a simple query to see if role column is accessible
SELECT 
    id, 
    auth_id, 
    role, 
    role::text as role_text,
    full_name,
    is_active 
FROM users 
LIMIT 5;
