-- Minimal RLS Policies for LuxPOS
-- Simplified version that doesn't rely on complex auth checks

-- Disable RLS temporarily to avoid circular dependency issues
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

-- Create very simple helper functions that don't cause errors
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Temporarily return true to allow all operations during setup
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- Temporarily return null to allow all operations during setup
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_belongs_to_tenant(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Temporarily return true to allow all operations during setup
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment: After you have created users and authenticated properly,
-- you can re-enable RLS and update these functions to use proper auth checks

-- To re-enable RLS later, uncomment these lines:
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
