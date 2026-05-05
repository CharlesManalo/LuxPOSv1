-- LuxPOS Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'owner', 'tenant', 'cashier');
CREATE TYPE order_status AS ENUM ('completed', 'voided');
CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'maya');
CREATE TYPE notification_type AS ENUM ('password_reset', 'void_order', 'low_stock', 'new_order');
CREATE TYPE notification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE inventory_reason AS ENUM ('order', 'restock', 'void_reversal', 'adjustment');

-- Tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    receipt_printing_enabled BOOLEAN DEFAULT false,
    receipt_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Ingredients table
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    stock_qty DECIMAL(10,2) DEFAULT 0,
    low_stock_threshold DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT DEFAULT '',
    is_available BOOLEAN DEFAULT true,
    description TEXT DEFAULT '',
    has_variants BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Product variants table
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, name)
);

-- Product ingredients (recipe) table
CREATE TABLE product_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    qty_required DECIMAL(10,2) NOT NULL,
    UNIQUE(product_id, ingredient_id)
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status order_status DEFAULT 'completed',
    payment_method payment_method NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    qty INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

-- Inventory logs table
CREATE TABLE inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    change_qty DECIMAL(10,2) NOT NULL,
    reason inventory_reason NOT NULL,
    triggered_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    status notification_status DEFAULT 'pending',
    payload JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX idx_ingredients_tenant_id ON ingredients(tenant_id);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_cashier_id ON orders(cashier_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_inventory_logs_tenant_id ON inventory_logs(tenant_id);
CREATE INDEX idx_inventory_logs_ingredient_id ON inventory_logs(ingredient_id);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add database constraints for data integrity
ALTER TABLE ingredients 
ADD CONSTRAINT stock_non_negative CHECK (stock_qty >= 0);

ALTER TABLE ingredients 
ADD CONSTRAINT low_stock_threshold_non_negative CHECK (low_stock_threshold >= 0);

ALTER TABLE products 
ADD CONSTRAINT price_non_negative CHECK (price >= 0);

ALTER TABLE orders 
ADD CONSTRAINT total_non_negative CHECK (total >= 0);

ALTER TABLE order_items 
ADD CONSTRAINT qty_positive CHECK (qty > 0);

ALTER TABLE order_items 
ADD CONSTRAINT unit_price_non_negative CHECK (unit_price >= 0);

-- Create atomic stock update function
CREATE OR REPLACE FUNCTION increment_stock(
  ingredient_id UUID,
  amount DECIMAL
) RETURNS VOID AS $$
BEGIN
  -- Update stock atomically
  UPDATE ingredients 
  SET stock_qty = stock_qty + amount 
  WHERE id = ingredient_id;
  
  -- Ensure stock doesn't go negative
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ingredient not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create atomic order function for true transaction safety
CREATE OR REPLACE FUNCTION create_order_with_inventory(
  p_tenant_id UUID,
  p_cashier_id UUID,
  p_payment_method TEXT,
  p_total DECIMAL,
  p_order_items JSONB,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  order_id UUID;
  item JSONB;
  product_id UUID;
  product_record RECORD;
  ingredient_record RECORD;
  required_qty DECIMAL;
  new_stock DECIMAL;
BEGIN
  -- Validate all stock before making any changes
  FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    product_id := (item->>'product_id')::UUID;
    
    -- Get product with recipe
    SELECT * INTO product_record 
    FROM products p
    LEFT JOIN product_ingredients pi ON p.id = pi.product_id
    WHERE p.id = product_id;
    
    -- Check stock for each ingredient
    FOR ingredient_record IN
      SELECT pi.ingredient_id, pi.qty_required, i.stock_qty, i.name
      FROM product_ingredients pi
      JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE pi.product_id = product_id
    LOOP
      required_qty := ingredient_record.qty_required * (item->>'qty')::DECIMAL;
      
      IF ingredient_record.stock_qty < required_qty THEN
        RAISE EXCEPTION 'Insufficient stock for %: need %, have %', 
          ingredient_record.name, required_qty, ingredient_record.stock_qty;
      END IF;
    END LOOP;
  END LOOP;
  
  -- All stock validated, now create order
  INSERT INTO orders (tenant_id, cashier_id, status, payment_method, total)
  VALUES (p_tenant_id, p_cashier_id, 'completed', p_payment_method, p_total)
  RETURNING id INTO order_id;
  
  -- Deduct stock and create order items
  FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    product_id := (item->>'product_id')::UUID;
    
    -- Create order item
    INSERT INTO order_items (
      order_id, product_id, product_name, variant_name, qty, unit_price
    ) VALUES (
      order_id,
      product_id,
      item->>'product_name',
      item->>'variant_name',
      (item->>'qty')::DECIMAL,
      (item->>'unit_price')::DECIMAL
    );
    
    -- Deduct stock
    FOR ingredient_record IN
      SELECT pi.ingredient_id, pi.qty_required, i.name
      FROM product_ingredients pi
      JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE pi.product_id = product_id
    LOOP
      required_qty := ingredient_record.qty_required * (item->>'qty')::DECIMAL;
      
      -- Update stock atomically
      UPDATE ingredients 
      SET stock_qty = stock_qty - required_qty 
      WHERE id = ingredient_record.ingredient_id;
      
      -- Log inventory change
      INSERT INTO inventory_logs (
        tenant_id, ingredient_id, ingredient_name, change_qty, reason, triggered_by
      ) VALUES (
        p_tenant_id, 
        ingredient_record.ingredient_id, 
        ingredient_record.name, 
        -required_qty, 
        'order', 
        p_user_id
      );
    END LOOP;
  END LOOP;
  
  RETURN order_id;
END;
$$ LANGUAGE plpgsql;

-- Set up Row Level Security (RLS)
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

-- RLS Policies

-- Tenants: Super admins can read all, others can only read their own
CREATE POLICY "Super admins can view all tenants" ON tenants
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'super_admin'
    );

CREATE POLICY "Users can view their own tenant" ON tenants
    FOR SELECT USING (
        id IN (
            SELECT tenant_id FROM users 
            WHERE users.id = auth.uid()
        )
    );

-- Users: Users can only see users from their own tenant
CREATE POLICY "Users can view tenant users" ON users
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users 
            WHERE users.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tenant users" ON users
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM users 
            WHERE users.id = auth.uid()
        )
    );

-- Similar policies for other tables...
-- (For brevity, showing pattern - you'd want to create policies for all tables)

-- Storage policy for product images
CREATE POLICY "Anyone can view product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own product images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-images' AND 
        auth.uid() IN (
            SELECT tenant_id FROM users 
            WHERE users.id = auth.uid()
        )
    );

-- Sample data insertion (optional - for testing)
-- You can uncomment this to add sample data

-- Sample Tenant
-- INSERT INTO tenants (name, slug, receipt_printing_enabled, receipt_config) 
-- VALUES ('Sample Restaurant', 'sample-restaurant', true, '{"header_text": "Sample Restaurant", "address": "123 Main St", "contact_number": "+1234567890", "footer_message": "Thank you for your order!", "paper_width": "80mm", "show_cashier_name": true}');

-- Sample User (you'd need to create this through Supabase Auth first)
-- INSERT INTO users (tenant_id, role, full_name, email) 
-- VALUES ((SELECT id FROM tenants WHERE slug = 'sample-restaurant'), 'owner', 'Restaurant Owner', 'owner@sample.com');

-- Sample Categories
-- INSERT INTO categories (tenant_id, name, sort_order) 
-- SELECT id, 'Silog Meals', 1 FROM tenants WHERE slug = 'sample-restaurant';
-- INSERT INTO categories (tenant_id, name, sort_order) 
-- SELECT id, 'Drinks', 2 FROM tenants WHERE slug = 'sample-restaurant';

-- Sample Ingredients
-- INSERT INTO ingredients (tenant_id, name, unit, stock_qty, low_stock_threshold)
-- SELECT id, 'Eggs', 'pieces', 50, 10 FROM tenants WHERE slug = 'sample-restaurant';
-- INSERT INTO ingredients (tenant_id, name, unit, stock_qty, low_stock_threshold)
-- SELECT id, 'Rice', 'kg', 10, 2 FROM tenants WHERE slug = 'sample-restaurant';

-- Sample Products
-- INSERT INTO products (tenant_id, category_id, name, price, description)
-- SELECT t.id, c.id, 'Tapsilog', 95.00, 'Tapa with Sinangag and Itlog'
-- FROM tenants t, categories c 
-- WHERE t.slug = 'sample-restaurant' AND c.name = 'Silog Meals';
