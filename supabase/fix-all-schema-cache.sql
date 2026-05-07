-- Comprehensive migration to fix all schema cache issues
-- Run this in Supabase SQL editor to fix all table schema problems

-- Fix order_items table schema cache
DO $$
BEGIN
    -- Add product_name column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_name'
        AND table_schema = current_schema()
    ) THEN
        RAISE NOTICE 'product_name column already exists in order_items';
    ELSE
        ALTER TABLE order_items ADD COLUMN product_name TEXT;
        RAISE NOTICE 'Added product_name column to order_items';
    END IF;

    -- Add variant_name column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'variant_name'
        AND table_schema = current_schema()
    ) THEN
        RAISE NOTICE 'variant_name column already exists in order_items';
    ELSE
        ALTER TABLE order_items ADD COLUMN variant_name TEXT;
        RAISE NOTICE 'Added variant_name column to order_items';
    END IF;

    -- Add qty column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'qty'
        AND table_schema = current_schema()
    ) THEN
        RAISE NOTICE 'qty column already exists in order_items';
    ELSE
        ALTER TABLE order_items ADD COLUMN qty INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added qty column to order_items';
    END IF;

    -- Add unit_price column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'unit_price'
        AND table_schema = current_schema()
    ) THEN
        RAISE NOTICE 'unit_price column already exists in order_items';
    ELSE
        ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;
        RAISE NOTICE 'Added unit_price column to order_items';
    END IF;

    -- Add order_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'order_id'
        AND table_schema = current_schema()
    ) THEN
        RAISE NOTICE 'order_id column already exists in order_items';
    ELSE
        ALTER TABLE order_items ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added order_id column to order_items';
    END IF;
END $$;

-- Verify all columns exist
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = current_schema()
ORDER BY ordinal_position;

-- Refresh schema cache
NOTIFY pgrst_schema_changed;
