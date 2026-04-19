import { useEffect, useRef } from 'react';

export function useRealtimeOrders(tenantId: string | null, callback: (order: Record<string, unknown>) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!tenantId) return;
    // Simulate real-time with periodic polling + random events
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        callbackRef.current({
          id: `order-${Date.now()}`,
          tenant_id: tenantId,
          total: Math.floor(Math.random() * 300) + 50,
          created_at: new Date().toISOString(),
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [tenantId]);
}

export function useRealtimeNotifications(tenantId: string | null, callback: (notif: Record<string, unknown>) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!tenantId) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.97) {
        callbackRef.current({
          id: `notif-${Date.now()}`,
          tenant_id: tenantId,
          type: 'new_order',
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [tenantId]);
}

export function useRealtimeInventory(branchId: string | null, callback: (ingredient: Record<string, unknown>) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!branchId) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.98) {
        callbackRef.current({
          id: `ing-${Date.now()}`,
          branch_id: branchId,
          stock_qty: Math.random() * 5,
          low_stock_threshold: 3,
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [branchId]);
}
