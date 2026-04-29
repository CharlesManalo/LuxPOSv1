import { useEffect, useRef } from "react";

export function useRealtimeOrders(
  tenantId: string | null,
  callback: (order: Record<string, unknown>) => void,
) {
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

export function useRealtimeNotifications(
  tenantId: string | null,
  callback: (notif: Record<string, unknown>) => void,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!tenantId) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.97) {
        callbackRef.current({
          id: `notif-${Date.now()}`,
          tenant_id: tenantId,
          type: "new_order",
          status: "pending",
          created_at: new Date().toISOString(),
        });
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [tenantId]);
}
