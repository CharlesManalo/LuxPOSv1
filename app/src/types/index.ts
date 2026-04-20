export type UserRole = "super_admin" | "tenant" | "cashier" | "admin" | "owner";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  receipt_printing_enabled: boolean;
  receipt_config: ReceiptConfig;
  created_at: string;
}

export interface ReceiptConfig {
  header_text: string;
  address: string;
  contact_number: string;
  footer_message: string;
  paper_width: "80mm" | "58mm";
  show_cashier_name: boolean;
  show_branch_name: boolean;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  address: string;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AppUser {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Ingredient {
  id: string;
  tenant_id: string;
  branch_id: string;
  name: string;
  unit: string;
  stock_qty: number;
  low_stock_threshold: number;
  created_at: string;
}

export interface Product {
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
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  created_at: string;
}

export interface ProductIngredient {
  id: string;
  product_id: string;
  ingredient_id: string;
  qty_required: number;
  ingredient_name?: string;
  ingredient_unit?: string;
}

export type OrderStatus = "completed" | "voided";
export type PaymentMethod = "cash" | "gcash" | "maya";

export interface Order {
  id: string;
  tenant_id: string;
  branch_id: string;
  cashier_id: string;
  cashier_name?: string;
  branch_name?: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant_name?: string;
  qty: number;
  unit_price: number;
}

export interface InventoryLog {
  id: string;
  tenant_id: string;
  branch_id: string;
  ingredient_id: string;
  ingredient_name: string;
  change_qty: number;
  reason: "order" | "restock" | "void_reversal" | "adjustment";
  triggered_by: string;
  created_at: string;
}

export type NotificationType =
  | "password_reset"
  | "void_order"
  | "low_stock"
  | "new_order";

export interface Notification {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  type: NotificationType;
  status: "pending" | "approved" | "rejected";
  payload: NotificationPayload;
  created_by: string;
  created_at: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  order_id?: string;
  ingredient_id?: string;
  ingredient_name?: string;
  cashier_name?: string;
  branch_name?: string;
  amount?: number;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_name?: string;
  price: number;
  qty: number;
  image_url?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockCount: number;
  paymentBreakdown: { method: PaymentMethod; amount: number; count: number }[];
  dailyRevenue: { date: string; amount: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  branchBreakdown: {
    branch_id: string;
    branch_name: string;
    revenue: number;
    orders: number;
  }[];
}
