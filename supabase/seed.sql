-- Initial Data Setup for LuxPOS
-- This script creates the initial admin account and default tenant
-- Run this after setting up your Supabase project

-- Create default tenant
INSERT INTO tenants (id, name, slug, receipt_config)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001', -- Fixed UUID for consistency
    'LuxPOS Demo Restaurant',
    'luxpos-demo',
    '{
        "header_text": "LUXPOS DEMO",
        "address": "123 Demo Street, Demo City",
        "contact_number": "+63 912 345 6789",
        "footer_message": "Thank you for dining with us!",
        "paper_width": "80mm",
        "show_cashier_name": true
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Note: The super admin user will be created through the Supabase Auth signup process
-- After creating the auth user, you need to manually create the corresponding user record
-- with the following SQL (replace the auth_id with the actual auth user ID):

/*
-- Create super admin user (run this after creating the auth user)
INSERT INTO users (auth_id, tenant_id, role, full_name, email)
VALUES (
    'YOUR_AUTH_USER_ID_HERE', -- Replace with actual auth.user.id
    '550e8400-e29b-41d4-a716-446655440001', -- Default tenant ID
    'super_admin',
    'Super Admin',
    'admin@luxpos.app'
) ON CONFLICT (auth_id) DO NOTHING;
*/

-- Create default categories for the demo tenant
INSERT INTO categories (tenant_id, name, sort_order) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Rice Meals', 1),
    ('550e8400-e29b-41d4-a716-446655440001', 'Noodles', 2),
    ('550e8400-e29b-41d4-a716-446655440001', 'Beverages', 3),
    ('550e8400-e29b-41d4-a716-446655440001', 'Desserts', 4),
    ('550e8400-e29b-41d4-a716-446655440001', 'Add-ons', 5)
ON CONFLICT DO NOTHING;

-- Create default ingredients for the demo tenant
INSERT INTO ingredients (tenant_id, name, unit, stock_qty, low_stock_threshold) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Rice', 'cups', 100.0, 20.0),
    ('550e8400-e29b-41d4-a716-446655440001', 'Chicken', 'kg', 50.0, 10.0),
    ('550e8400-e29b-41d4-a716-446655440001', 'Pork', 'kg', 30.0, 8.0),
    ('550e8400-e29b-41d4-a716-446655440001', 'Eggs', 'pieces', 200.0, 50.0),
    ('550e8400-e29b-41d4-a716-446655440001', 'Noodles', 'packs', 100.0, 25.0),
    ('550e8400-e29b-41d4-a716-446655440001', 'Coffee Powder', 'kg', 10.0, 2.0),
    ('550e8400-e29b-41d4-a716-446655440001', 'Sugar', 'kg', 25.0, 5.0),
    ('550e8400-e29b-41d4-a716-446655440001', 'Milk', 'liters', 20.0, 5.0),
    ('550e8400-e29b-41d4-a716-446655440001', 'Ice Cream', 'liters', 15.0, 3.0),
    ('550e8400-e29b-41d4-a716-446655440001', 'Bread', 'pieces', 50.0, 10.0)
ON CONFLICT DO NOTHING;

-- Create sample products (these are just templates - you can modify or remove them)
INSERT INTO products (tenant_id, category_id, name, price, description, is_available) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 
     (SELECT id FROM categories WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Rice Meals' LIMIT 1),
     'Chicken Adobo', 89.00, 'Tender chicken stewed in soy sauce and vinegar', true),
    ('550e8400-e29b-41d4-a716-446655440001',
     (SELECT id FROM categories WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Rice Meals' LIMIT 1),
     'Pork Sinigang', 95.00, 'Pork soup with tamarind and vegetables', true),
    ('550e8400-e29b-41d4-a716-446655440001',
     (SELECT id FROM categories WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Noodles' LIMIT 1),
     'Pancit Canton', 75.00, 'Stir-fried noodles with vegetables and meat', true),
    ('550e8400-e29b-41d4-a716-446655440001',
     (SELECT id FROM categories WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Beverages' LIMIT 1),
     'Brewed Coffee', 45.00, 'Hot brewed coffee', true),
    ('550e8400-e29b-41d4-a716-446655440001',
     (SELECT id FROM categories WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Desserts' LIMIT 1),
     'Ice Cream Scoop', 35.00, 'Single scoop of ice cream', true)
ON CONFLICT DO NOTHING;

-- Create product recipes (ingredient requirements)
INSERT INTO product_ingredients (product_id, ingredient_id, qty_required)
SELECT 
    p.id,
    i.id,
    CASE 
        WHEN p.name = 'Chicken Adobo' AND i.name = 'Rice' THEN 1.0
        WHEN p.name = 'Chicken Adobo' AND i.name = 'Chicken' THEN 0.3
        WHEN p.name = 'Pork Sinigang' AND i.name = 'Rice' THEN 1.0
        WHEN p.name = 'Pork Sinigang' AND i.name = 'Pork' THEN 0.25
        WHEN p.name = 'Pancit Canton' AND i.name = 'Noodles' THEN 1.0
        WHEN p.name = 'Pancit Canton' AND i.name = 'Eggs' THEN 1.0
        WHEN p.name = 'Brewed Coffee' AND i.name = 'Coffee Powder' THEN 0.02
        WHEN p.name = 'Brewed Coffee' AND i.name = 'Sugar' THEN 0.01
        WHEN p.name = 'Ice Cream Scoop' AND i.name = 'Ice Cream' THEN 0.1
        ELSE 0
    END
FROM products p
CROSS JOIN ingredients i
WHERE p.tenant_id = '550e8400-e29b-41d4-a716-446655440001'
AND i.tenant_id = '550e8400-e29b-41d4-a716-446655440001'
AND CASE 
    WHEN p.name = 'Chicken Adobo' AND i.name IN ('Rice', 'Chicken') THEN true
    WHEN p.name = 'Pork Sinigang' AND i.name IN ('Rice', 'Pork') THEN true
    WHEN p.name = 'Pancit Canton' AND i.name IN ('Noodles', 'Eggs') THEN true
    WHEN p.name = 'Brewed Coffee' AND i.name IN ('Coffee Powder', 'Sugar') THEN true
    WHEN p.name = 'Ice Cream Scoop' AND i.name = 'Ice Cream' THEN true
    ELSE false
END
ON CONFLICT (product_id, ingredient_id) DO NOTHING;
