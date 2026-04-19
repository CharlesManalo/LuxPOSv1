export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          receipt_printing_enabled: boolean;
          receipt_config: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };
      branches: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          address: string;
          manager_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['branches']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['branches']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          branch_id: string | null;
          role: 'admin' | 'owner' | 'cashier';
          full_name: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      ingredients: {
        Row: {
          id: string;
          tenant_id: string;
          branch_id: string;
          name: string;
          unit: string;
          stock_qty: number;
          low_stock_threshold: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ingredients']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ingredients']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          tenant_id: string;
          category_id: string;
          name: string;
          price: number;
          image_url: string;
          is_available: boolean;
          description: string;
          has_variants: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          price: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>;
      };
      product_ingredients: {
        Row: {
          id: string;
          product_id: string;
          ingredient_id: string;
          qty_required: number;
        };
        Insert: Omit<Database['public']['Tables']['product_ingredients']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['product_ingredients']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          tenant_id: string;
          branch_id: string;
          cashier_id: string;
          status: 'completed' | 'voided';
          payment_method: 'cash' | 'gcash' | 'maya';
          total: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          variant_name: string | null;
          qty: number;
          unit_price: number;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };
      inventory_logs: {
        Row: {
          id: string;
          tenant_id: string;
          branch_id: string;
          ingredient_id: string;
          ingredient_name: string;
          change_qty: number;
          reason: 'order' | 'restock' | 'void_reversal' | 'adjustment';
          triggered_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inventory_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['inventory_logs']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          tenant_id: string;
          branch_id: string | null;
          type: 'password_reset' | 'void_order' | 'low_stock' | 'new_order';
          status: 'pending' | 'approved' | 'rejected';
          payload: Record<string, unknown>;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
    Enums: {
      user_role: 'admin' | 'owner' | 'cashier';
      order_status: 'completed' | 'voided';
      payment_method: 'cash' | 'gcash' | 'maya';
      notification_type: 'password_reset' | 'void_order' | 'low_stock' | 'new_order';
      notification_status: 'pending' | 'approved' | 'rejected';
      inventory_reason: 'order' | 'restock' | 'void_reversal' | 'adjustment';
    };
  };
}
