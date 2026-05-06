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
  Notification, // Added missing import
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
  const { data, error } = await getSupabase()
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("getUserByAuthId error:", error);
    return null;
  }
  if (!data) return null;
  return data as AppUser;
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
