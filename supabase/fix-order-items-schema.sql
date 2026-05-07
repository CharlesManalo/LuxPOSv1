-- Migration: Ensure order_items table has all required columns
-- Run this in Supabase SQL editor to fix schema cache issues

-- Add product_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_name'
        AND table_schema = current_schema()
    ) THEN
        -- Column exists, do nothing
        RAISE NOTICE 'product_name column already exists in order_items';
    ELSE
        -- Add missing column
        ALTER TABLE order_items ADD COLUMN product_name TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added product_name column to order_items';
    END IF;
END $$;

-- Add variant_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'variant_name'
        AND table_schema = current_schema()
    ) THEN
        -- Column exists, do nothing
        RAISE NOTICE 'variant_name column already exists in order_items';
    ELSE
        -- Add missing column
        ALTER TABLE order_items ADD COLUMN variant_name TEXT;
        RAISE NOTICE 'Added variant_name column to order_items';
    END IF;
END $$;

-- Verify columns exist
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = current_schema()
ORDER BY ordinal_position;
