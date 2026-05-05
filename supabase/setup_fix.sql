-- Setup fix for initial database setup
-- This script handles the chicken-and-egg problem of RLS policies

-- Temporarily disable RLS to allow initial setup
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Create a simpler version of helper functions that don't cause circular dependencies
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- For initial setup, return false to avoid errors
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- For initial setup, return null to avoid errors
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_belongs_to_tenant(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- For initial setup, return true to allow access
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- After creating your first user with super_admin role, 
-- you can re-enable RLS and update these functions to use the proper logic

-- To re-enable RLS later, run:
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- (etc. for all tables)
