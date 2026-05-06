-- Fix Admin Permissions for Tenant Creation
-- This fixes the RLS policy that was preventing admins from creating new tenant users

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Admins can create users" ON users;

-- Create corrected policy that checks if current user is admin/super_admin
CREATE POLICY "Admins can create users" ON users
    FOR INSERT WITH CHECK (is_super_admin());

-- Also fix the policy for updating users to allow admins
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth_id = auth.uid() OR 
        is_super_admin()
    );

-- Fix delete policy as well
DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (is_super_admin());
