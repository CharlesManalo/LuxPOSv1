import { getSupabaseClient } from "./supabaseClient";

// Lazy getter to ensure single client instance
const getSupabase = () => getSupabaseClient();
import type {
  Tenant,
  AppUser,
  Category,
  Product,
  ProductVariant,
  Ingredient,
  Order,
  OrderItem,
  UserRole,
  ProductRecipe,
  Notification,
  DashboardStats,
  PaymentMethod,
} from "@/types";

// Helper function to handle Supabase errors
function handleSupabaseError(error: any): never {
  console.error("Supabase error:", error);
  throw new Error(error.message || "Database operation failed");
}

// --- TENANT OPERATIONS ---

export async function getTenants(): Promise<any[]> {
  const { data, error } = await getSupabase()
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) handleSupabaseError(error);
  return data || [];
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const { data, error } = await getSupabase()
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (error && error.code !== "PGRST116") handleSupabaseError(error);
  return data as Tenant | null;
}

export async function createTenant(tenantData: {
  name: string;
  slug: string;
  receipt_printing_enabled: boolean;
  receipt_config: Tenant["receipt_config"];
}): Promise<Tenant> {
  const { data, error } = await getSupabase()
    .from("tenants")
    .insert(tenantData as any)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("Failed to create tenant");
  return data as Tenant;
}

export async function deleteTenant(tenantId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("tenants")
    .delete()
    .eq("id", tenantId);

  if (error) handleSupabaseError(error);
}

// --- USER OPERATIONS ---

export async function getUsers(
  tenantId: string,
  role?: UserRole,
): Promise<AppUser[]> {
  let query = getSupabase().from("users").select("*").eq("tenant_id", tenantId);

  if (role) {
    query = query.eq("role", role);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) handleSupabaseError(error);
  return (data || []) as AppUser[];
}

export async function getUserByAuthId(authId: string): Promise<AppUser | null> {
  try {
    const { data, error } = await getSupabase()
      .from("users")
      .select("*")
      .eq("auth_id", authId)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - user not found
        console.log("User not found in database for auth_id:", authId);
        return null;
      } else {
        // Other database errors
        console.error("getUserByAuthId database error:", error);
        throw error;
      }
    }
    if (!data) return null;
    return data as AppUser;
  } catch (err) {
    console.error("getUserByAuthId failed:", err);
    return null;
  }
}

export async function createUser(
  user: Omit<AppUser, "id" | "created_at">,
): Promise<AppUser> {
  const { data, error } = await getSupabase()
    .from("users")
    .insert(user as any)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("Failed to create user");
  return data as AppUser;
}

export async function updateUser(
  userId: string,
  updates: Partial<Omit<AppUser, "id" | "created_at">>,
): Promise<AppUser> {
  const { data, error } = await getSupabase()
    .from("users")
    .update(updates as any)
    .eq("id", userId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("Failed to update user");
  return data as AppUser;
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await getSupabase().from("users").delete().eq("id", userId);
  if (error) handleSupabaseError(error);
}

// Cashier-specific wrapper functions
export async function getCashiers(tenantId: string): Promise<AppUser[]> {
  return getUsers(tenantId, "cashier");
}

export async function createCashier(cashierData: {
  tenant_id: string;
  full_name: string;
  email: string;
  password?: string;
}): Promise<AppUser> {
  const { tenant_id, full_name, email, password = "cashier123" } = cashierData;

  const supabase = getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-cashier`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          tenant_id,
          full_name,
          email,
          password,
        }),
      },
    );

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to create cashier");

    return result.user as AppUser;
  } catch (err: any) {
    console.error("Failed to create cashier:", err);
    throw new Error(err.message || "Failed to create cashier");
  }
}

export async function deleteCashier(cashierId: string): Promise<void> {
  return deleteUser(cashierId);
}

// --- DASHBOARD STATS ---

export async function getDashboardStats(
  tenantId: string,
): Promise<DashboardStats> {
  const supabase = getSupabase();

  // Get orders for revenue calculation
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("total, payment_method, created_at")
    .eq("tenant_id", tenantId)
    .eq("status", "completed");

  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
  }

  // Get products count
  const { count: productsCount, error: productsError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (productsError) {
    console.error("Error fetching products count:", productsError);
  }

  // Get low stock ingredients count
  const { data: ingredients, error: ingredientsError } = await supabase
    .from("ingredients")
    .select("stock_qty, low_stock_threshold")
    .eq("tenant_id", tenantId);

  if (ingredientsError) {
    console.error("Error fetching ingredients:", ingredientsError);
  }

  // Calculate stats
  const totalRevenue =
    orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) ||
    0;
  const totalOrders = orders?.length || 0;
  const totalProducts = productsCount || 0;

  // Calculate low stock count
  const lowStockCount =
    ingredients?.filter(
      (i: any) => i.stock_qty > 0 && i.stock_qty <= i.low_stock_threshold,
    ).length || 0;

  // Calculate payment breakdown
  const paymentMap = new Map<string, { amount: number; count: number }>();
  orders?.forEach((order: any) => {
    const method = order.payment_method || "cash";
    const current = paymentMap.get(method) || { amount: 0, count: 0 };
    paymentMap.set(method, {
      amount: current.amount + (order.total || 0),
      count: current.count + 1,
    });
  });
  const paymentBreakdown = Array.from(paymentMap.entries()).map(
    ([method, data]) => ({
      method: method as PaymentMethod,
      amount: data.amount,
      count: data.count,
    }),
  );

  // Calculate daily revenue (last 14 days)
  const dailyRevenueMap = new Map<string, number>();
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    dailyRevenueMap.set(dateStr, 0);
  }

  orders?.forEach((order: any) => {
    const dateStr = order.created_at?.split("T")[0];
    if (dateStr && dailyRevenueMap.has(dateStr)) {
      const current = dailyRevenueMap.get(dateStr) || 0;
      dailyRevenueMap.set(dateStr, current + (order.total || 0));
    }
  });

  const dailyRevenue = Array.from(dailyRevenueMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({ date, amount }));

  // Get top products (simplified - would need order_items data)
  const topProducts: { name: string; qty: number; revenue: number }[] = [];

  return {
    totalRevenue,
    totalOrders,
    totalProducts,
    lowStockCount,
    paymentBreakdown,
    dailyRevenue,
    topProducts,
  };
}

// --- CATEGORY OPERATIONS ---

export async function getCategories(tenantId: string): Promise<Category[]> {
  const { data, error } = await getSupabase()
    .from("categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  if (error) handleSupabaseError(error);
  return (data || []) as Category[];
}

export async function createCategory(
  category: Omit<Category, "id" | "created_at">,
): Promise<Category> {
  // @ts-ignore
  const { data, error } = await getSupabase()
    .from("categories")
    .insert(category as any)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("Failed to create category");
  return data as Category;
}

// --- INGREDIENT OPERATIONS ---

export async function getIngredients(tenantId: string): Promise<Ingredient[]> {
  const { data, error } = await getSupabase()
    .from("ingredients")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) handleSupabaseError(error);
  return (data || []) as Ingredient[];
}

export async function createIngredient(
  ingredient: Omit<Ingredient, "id" | "created_at">,
): Promise<Ingredient> {
  // @ts-ignore
  const { data, error } = await getSupabase()
    .from("ingredients")
    .insert(ingredient as any)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("Failed to create ingredient");
  return data as Ingredient;
}

export async function deleteIngredient(ingredientId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("ingredients")
    .delete()
    .eq("id", ingredientId);

  if (error) handleSupabaseError(error);
}

export async function restockIngredient(
  ingredientId: string,
  qty: number,
  userId: string,
): Promise<void> {
  const { data: ingredient, error: fetchError } = await getSupabase()
    .from("ingredients")
    .select("*")
    .eq("id", ingredientId)
    .single();

  if (fetchError) handleSupabaseError(fetchError);
  if (!ingredient) throw new Error("Ingredient not found");

  const newStock = (ingredient as any).stock_qty + qty;

  // @ts-ignore
  const { error: updateError } = await getSupabase()
    .from("ingredients")
    .update({ stock_qty: newStock } as any)
    .eq("id", ingredientId);

  if (updateError) handleSupabaseError(updateError);

  // @ts-ignore
  const { error: logError } = await getSupabase()
    .from("inventory_logs")
    .insert({
      tenant_id: (ingredient as any).tenant_id,
      ingredient_id: ingredientId,
      ingredient_name: (ingredient as any).name,
      change_qty: qty,
      reason: qty > 0 ? "restock" : "order",
      triggered_by: userId,
    } as any);

  if (logError) handleSupabaseError(logError);
}

// --- PRODUCT OPERATIONS ---

export async function getProducts(tenantId: string): Promise<Product[]> {
  const { data, error } = await getSupabase()
    .from("products")
    .select(
      `
      *,
      product_variants(*),
      product_ingredients(*, ingredients(*))
    `,
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) handleSupabaseError(error);

  return (data || []).map((product: any) => ({
    ...product,
    variants: product.product_variants || [],
    recipe: (product.product_ingredients || []).map((pi: any) => ({
      ingredient_id: pi.ingredient_id,
      qty_required: pi.qty_required,
      ingredient: pi.ingredients,
    })),
  })) as Product[];
}

export async function createProduct(
  product: Omit<Product, "id" | "created_at">,
): Promise<Product> {
  const { recipe, variants, ...productData } = product as any;

  // @ts-ignore
  const { data, error } = await getSupabase()
    .from("products")
    .insert(productData as any)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("Failed to create product");

  if (recipe && recipe.length > 0) {
    const productIngredients = recipe.map((item: ProductRecipe) => ({
      product_id: data.id,
      ingredient_id: item.ingredient_id,
      qty_required: item.qty_required,
    }));
    // @ts-ignore
    const { error: iErr } = await getSupabase()
      .from("product_ingredients")
      .insert(productIngredients as any);
    if (iErr) handleSupabaseError(iErr);
  }

  if (variants && variants.length > 0) {
    const productVariants = variants.map((variant: any) => ({
      ...variant,
      product_id: data.id,
    }));
    // @ts-ignore
    const { error: vErr } = await getSupabase()
      .from("product_variants")
      .insert(productVariants as any);
    if (vErr) handleSupabaseError(vErr);
  }

  return data as Product;
}

export async function updateProduct(
  productId: string,
  updates: Partial<Product> & {
    recipe?: ProductRecipe[];
    variants?: ProductVariant[];
  },
): Promise<Product> {
  const { recipe, variants, ...productData } = updates;

  // @ts-ignore
  const { data, error } = await getSupabase()
    .from("products")
    .update(productData as any)
    .eq("id", productId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("Product not found");

  if (recipe !== undefined) {
    await getSupabase()
      .from("product_ingredients")
      .delete()
      .eq("product_id", productId);
    if (recipe.length > 0) {
      const productIngredients = recipe.map((item: ProductRecipe) => ({
        product_id: productId,
        ingredient_id: item.ingredient_id,
        qty_required: item.qty_required,
      }));
      // @ts-ignore
      const { error: iErr } = await getSupabase()
        .from("product_ingredients")
        .insert(productIngredients as any);
      if (iErr) handleSupabaseError(iErr);
    }
  }

  return data as Product;
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("products")
    .delete()
    .eq("id", productId);
  if (error) handleSupabaseError(error);
}

export async function getProductVariants(
  productId: string,
): Promise<ProductVariant[]> {
  const { data, error } = await getSupabase()
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) handleSupabaseError(error);
  return (data || []) as ProductVariant[];
}

// --- ORDER OPERATIONS ---

export async function getOrders(
  tenantId: string,
  limit?: number,
): Promise<Order[]> {
  let query = getSupabase()
    .from("orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) handleSupabaseError(error);
  return (data || []) as Order[];
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await getSupabase()
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) handleSupabaseError(error);
  return (data || []) as OrderItem[];
}

// --- NOTIFICATIONS ---

export async function getNotifications(
  tenantId: string,
): Promise<Notification[]> {
  const { data, error } = await getSupabase()
    .from("notifications")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) handleSupabaseError(error);
  return (data || []) as Notification[];
}

export async function updateNotificationStatus(
  notificationId: string,
  status: "approved" | "rejected",
): Promise<void> {
  // @ts-ignore
  const { error } = await getSupabase()
    .from("notifications")
    .update({ status } as any)
    .eq("id", notificationId);

  if (error) handleSupabaseError(error);
}

// --- AUTH & PROFILE ---

export async function signIn(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  });
  if (error) handleSupabaseError(error);
  return { user: data.user, error };
}

export async function signOut() {
  await getSupabase().auth.signOut();
}

export async function getUserProfile(userId: string): Promise<any> {
  const { data, error } = await getSupabase()
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") handleSupabaseError(error);
  return data || {};
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<any>,
): Promise<any> {
  // @ts-ignore
  const { data, error } = await getSupabase()
    .from("user_profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("User profile not found");
  return data;
}
