-- Database Functions and Triggers for LuxPOS
-- These functions handle automated inventory management and business logic

-- Function to update ingredient stock when order is created
CREATE OR REPLACE FUNCTION update_ingredient_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- For each order item, update ingredient stock
    INSERT INTO inventory_logs (tenant_id, ingredient_id, ingredient_name, change_qty, reason, triggered_by)
    SELECT 
        NEW.tenant_id,
        pi.ingredient_id,
        i.name,
        -(pi.qty_required * oi.qty),
        'order',
        NEW.cashier_id
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN product_ingredients pi ON p.id = pi.product_id
    JOIN ingredients i ON pi.ingredient_id = i.id
    WHERE oi.order_id = NEW.id;

    -- Update ingredient stock quantities
    UPDATE ingredients 
    SET stock_qty = stock_qty - sub.change_qty
    FROM (
        SELECT 
            pi.ingredient_id,
            SUM(pi.qty_required * oi.qty) as change_qty
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN product_ingredients pi ON p.id = pi.product_id
        WHERE oi.order_id = NEW.id
        GROUP BY pi.ingredient_id
    ) sub
    WHERE ingredients.id = sub.ingredient_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order creation
CREATE TRIGGER order_created_update_stock
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredient_stock_on_order();

-- Function to restore ingredient stock when order is voided
CREATE OR REPLACE FUNCTION restore_ingredient_stock_on_void()
RETURNS TRIGGER AS $$
BEGIN
    -- Only restore if order is being voided (was completed)
    IF OLD.status = 'completed' AND NEW.status = 'voided' THEN
        -- Create inventory logs for stock restoration
        INSERT INTO inventory_logs (tenant_id, ingredient_id, ingredient_name, change_qty, reason, triggered_by)
        SELECT 
            NEW.tenant_id,
            pi.ingredient_id,
            i.name,
            (pi.qty_required * oi.qty),
            'void_reversal',
            NEW.cashier_id
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN product_ingredients pi ON p.id = pi.product_id
        JOIN ingredients i ON pi.ingredient_id = i.id
        WHERE oi.order_id = NEW.id;

        -- Restore ingredient stock quantities
        UPDATE ingredients 
        SET stock_qty = stock_qty + sub.change_qty
        FROM (
            SELECT 
                pi.ingredient_id,
                SUM(pi.qty_required * oi.qty) as change_qty
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN product_ingredients pi ON p.id = pi.product_id
            WHERE oi.order_id = NEW.id
            GROUP BY pi.ingredient_id
        ) sub
        WHERE ingredients.id = sub.ingredient_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status changes
CREATE TRIGGER order_status_change_update_stock
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION restore_ingredient_stock_on_void();

-- Function to check for low stock and create notifications
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock is below threshold
    IF NEW.stock_qty <= NEW.low_stock_threshold THEN
        -- Create low stock notification
        INSERT INTO notifications (tenant_id, type, status, payload, created_by)
        VALUES (
            NEW.tenant_id,
            'low_stock',
            'pending',
            jsonb_build_object(
                'title', 'Low Stock Alert',
                'message', NEW.name || ' is running low on stock',
                'ingredient_id', NEW.id::text,
                'ingredient_name', NEW.name,
                'current_stock', NEW.stock_qty,
                'threshold', NEW.low_stock_threshold
            ),
            (SELECT id FROM users WHERE tenant_id = NEW.tenant_id AND role IN ('admin', 'owner', 'tenant') LIMIT 1)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low stock checking
CREATE TRIGGER ingredient_low_stock_check
    AFTER UPDATE ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(tenant_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'totalRevenue', COALESCE(SUM(total), 0),
        'totalOrders', COUNT(*),
        'totalProducts', (SELECT COUNT(*) FROM products WHERE tenant_id = tenant_uuid),
        'lowStockCount', (SELECT COUNT(*) FROM ingredients WHERE tenant_id = tenant_uuid AND stock_qty <= low_stock_threshold),
        'paymentBreakdown', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'method', payment_method,
                    'amount', SUM(total),
                    'count', COUNT(*)
                )
            )
            FROM orders 
            WHERE tenant_id = tenant_uuid 
            AND status = 'completed'
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY payment_method
        ),
        'dailyRevenue', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', DATE(created_at),
                    'amount', COALESCE(SUM(total), 0)
                )
            )
            FROM orders 
            WHERE tenant_id = tenant_uuid 
            AND status = 'completed'
            AND created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        ),
        'topProducts', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'name', product_name,
                    'qty', SUM(qty),
                    'revenue', SUM(unit_price * qty)
                )
            )
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.tenant_id = tenant_uuid 
            AND o.status = 'completed'
            AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY product_name
            ORDER BY SUM(qty) DESC
            LIMIT 5
        )
    )
    INTO result
    FROM orders 
    WHERE tenant_id = tenant_uuid 
    AND status = 'completed'
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile when auth user is created
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, tenant_id)
    VALUES (
        NEW.id,
        NULL -- Will be set when user is created in users table
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Function to validate product availability
CREATE OR REPLACE FUNCTION check_product_availability(product_uuid UUID, order_qty INTEGER DEFAULT 1)
RETURNS JSON AS $$
DECLARE
    is_available BOOLEAN := true;
    shortage_items JSONB := '[]'::jsonb;
    ingredient_record RECORD;
BEGIN
    -- Check if product has sufficient ingredients
    FOR ingredient_record IN 
        SELECT 
            i.id,
            i.name,
            i.stock_qty,
            pi.qty_required,
            (i.stock_qty - (pi.qty_required * order_qty)) as remaining_stock
        FROM product_ingredients pi
        JOIN ingredients i ON pi.ingredient_id = i.id
        WHERE pi.product_id = product_uuid
    LOOP
        IF ingredient_record.remaining_stock < 0 THEN
            is_available := false;
            shortage_items := shortage_items || jsonb_build_object(
                'ingredient_id', ingredient_record.id,
                'ingredient_name', ingredient_record.name,
                'required_qty', ingredient_record.qty_required * order_qty,
                'available_qty', ingredient_record.stock_qty,
                'shortage', ABS(ingredient_record.remaining_stock)
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'is_available', is_available,
        'shortages', shortage_items
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role from auth context
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role::text 
        FROM users 
        WHERE auth_id = auth.uid() 
        AND is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
