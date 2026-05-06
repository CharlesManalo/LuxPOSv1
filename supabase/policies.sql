-- Row Level Security (RLS) Policies for LuxPOS
-- These policies ensure users can only access data they're authorized to see

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has admin privileges
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Return false if no auth context
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    
    -- Return false if no users table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RETURN false;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE auth_id = auth.uid() 
        AND role::text IN ('owner', 'admin')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE auth_id = auth.uid()
        AND role::text = 'owner'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (
    SELECT tenant_id FROM public.users
    WHERE auth_id = auth.uid()
    AND is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function to check if user belongs to tenant
CREATE OR REPLACE FUNCTION user_belongs_to_tenant(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        tenant_uuid = current_user_tenant_id()
        OR is_super_admin()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TENANTS POLICIES
-- Super admins can read all tenants
CREATE POLICY "Super admins can view all tenants" ON tenants
    FOR SELECT USING (is_super_admin());

-- Only super admins can insert tenants
CREATE POLICY "Super admins can create tenants" ON tenants
    FOR INSERT WITH CHECK (is_super_admin());

-- Only super admins can update tenants
CREATE POLICY "Super admins can update tenants" ON tenants
    FOR UPDATE USING (is_super_admin());

-- Only super admins can delete tenants
CREATE POLICY "Super admins can delete tenants" ON tenants
    FOR DELETE USING (is_super_admin());

-- USERS POLICIES
-- Users can always view their own record (needed for initial login)
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (
        auth_id = auth.uid() OR
        is_super_admin() OR 
        tenant_id = current_user_tenant_id()
    );

-- Only admins can create users
CREATE POLICY "Admins can create users" ON users
    FOR INSERT WITH CHECK (role::text IN ('admin', 'super_admin'));

-- Owners can create cashiers
CREATE POLICY "Owners can create cashiers" ON users
    FOR INSERT WITH CHECK (
        role::text = 'cashier'
        AND tenant_id = current_user_tenant_id()
        AND is_owner()
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth_id = auth.uid() OR 
        role::text IN ('admin', 'super_admin')
    );

-- Only admins can delete users
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (role::text IN ('admin', 'super_admin'));

-- Duplicate policy removed

-- CATEGORIES POLICIES
CREATE POLICY "Users can view categories in their tenant" ON categories
    FOR SELECT USING (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can create categories" ON categories
    FOR INSERT WITH CHECK (
        role::text IN ('admin', 'super_admin') OR 
        (role::text IN ('owner', 'cashier') AND tenant_id = current_user_tenant_id())
    );

CREATE POLICY "Admins can update categories" ON categories
    FOR UPDATE USING (
        role::text IN ('admin', 'super_admin') OR 
        (role::text IN ('owner', 'cashier') AND tenant_id = current_user_tenant_id())
    );

CREATE POLICY "Admins can delete categories" ON categories
    FOR DELETE USING (
        role::text IN ('admin', 'super_admin') OR 
        (role::text IN ('owner', 'cashier') AND tenant_id = current_user_tenant_id())
    );

-- INGREDIENTS POLICIES
CREATE POLICY "Users can view ingredients in their tenant" ON ingredients
    FOR SELECT USING (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can manage ingredients" ON ingredients
    FOR ALL USING (
        role::text IN ('admin', 'super_admin') OR 
        (role::text IN ('owner', 'cashier') AND tenant_id = current_user_tenant_id())
    );

-- PRODUCTS POLICIES
CREATE POLICY "Users can view products in their tenant" ON products
    FOR SELECT USING (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (
        role::text IN ('admin', 'super_admin') OR 
        (role::text IN ('owner', 'cashier') AND tenant_id = current_user_tenant_id())
    );

-- PRODUCT VARIANTS POLICIES
CREATE POLICY "Users can view product variants in their tenant" ON product_variants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_variants.product_id 
            AND user_belongs_to_tenant(p.tenant_id)
        )
    );

CREATE POLICY "Admins can manage product variants" ON product_variants
    FOR ALL USING (
        role::text IN ('admin', 'super_admin') OR 
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_variants.product_id 
            AND role::text IN ('owner', 'cashier') 
            AND p.tenant_id = current_user_tenant_id()
        )
    );

-- PRODUCT INGREDIENTS POLICIES
CREATE POLICY "Users can view product ingredients in their tenant" ON product_ingredients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_ingredients.product_id 
            AND user_belongs_to_tenant(p.tenant_id)
        )
    );

CREATE POLICY "Admins can manage product ingredients" ON product_ingredients
    FOR ALL USING (
        role::text IN ('admin', 'super_admin') OR 
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_ingredients.product_id 
            AND role::text IN ('owner', 'cashier') 
            AND p.tenant_id = current_user_tenant_id()
        )
    );

-- ORDERS POLICIES
CREATE POLICY "Users can view orders in their tenant" ON orders
    FOR SELECT USING (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Cashiers can create orders" ON orders
    FOR INSERT WITH CHECK (
        role::text IN ('admin', 'super_admin') OR 
        (role::text IN ('owner', 'cashier') AND tenant_id = current_user_tenant_id())
    );

CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (
        is_super_admin() OR 
        (role::text IN ('owner', 'cashier', 'admin') AND tenant_id = current_user_tenant_id())
    );

CREATE POLICY "Admins can manage orders" ON orders
    FOR ALL USING (
        is_super_admin() OR 
        (role::text IN ('owner', 'cashier', 'admin') AND tenant_id = current_user_tenant_id())
    );

-- ORDER ITEMS POLICIES
CREATE POLICY "Users can view order items in their tenant" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND user_belongs_to_tenant(o.tenant_id)
        )
    );

CREATE POLICY "Users can manage order items" ON order_items
    FOR ALL USING (
        is_super_admin() OR 
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND role::text IN ('cashier', 'admin', 'owner', 'tenant') 
            AND o.tenant_id = current_user_tenant_id()
        )
    );

-- INVENTORY LOGS POLICIES
CREATE POLICY "Users can view inventory logs in their tenant" ON inventory_logs
    FOR SELECT USING (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Users can create inventory logs" ON inventory_logs
    FOR INSERT WITH CHECK (
        is_super_admin() OR 
        (role::text IN ('cashier', 'admin', 'owner', 'tenant') AND tenant_id = current_user_tenant_id())
    );

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view notifications in their tenant" ON notifications
    FOR SELECT USING (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Users can create notifications" ON notifications
    FOR INSERT WITH CHECK (
        is_super_admin() OR 
        (role::text IN ('cashier', 'admin', 'owner', 'tenant') AND tenant_id = current_user_tenant_id())
    );

CREATE POLICY "Tenant admins can update notifications" ON notifications
    FOR UPDATE USING (
        is_super_admin() OR 
        (role::text IN ('admin', 'owner', 'tenant') AND tenant_id = current_user_tenant_id())
    );

-- USER PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (user_id = auth.uid() OR is_super_admin());

CREATE POLICY "Users can manage own profile" ON user_profiles
    FOR ALL USING (user_id = auth.uid() OR is_super_admin());
