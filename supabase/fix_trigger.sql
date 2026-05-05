-- Fix for duplicate trigger error
-- This script safely drops and recreates the order_created_update_stock trigger

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS order_created_update_stock ON orders;

-- Recreate the trigger
CREATE TRIGGER order_created_update_stock
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredient_stock_on_order();
