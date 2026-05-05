import { supabase } from "./supabase";
import type {
  Tenant,
  AppUser,
  Category,
  Product,
  ProductVariant,
  Ingredient,
  Order,
  OrderItem,
  InventoryLog,
  Notification,
  PaymentMethod,
  UserRole,
  ProductRecipe,
} from "@/types";

// Helper function to handle Supabase errors
function handleSupabaseError(error: any) {
  console.error("Supabase error:", error);
  throw new Error(error.message || "Database operation failed");
}

// TENANT OPERATIONS
export async function getTenants(): Promise<any[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) handleSupabaseError(error);
  return data || [];
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (error && error.code !== "PGRST116") handleSupabaseError(error);
  return data || null;
}

export async function createTenant(tenantData: {
  name: string;
  slug: string;
  receipt_printing_enabled: boolean;
  receipt_config: Tenant["receipt_config"];
}): Promise<Tenant> {
  const { data, error } = await supabase
    .from("tenants")
    .insert(tenantData as any)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("Failed to create tenant");
  return data as Tenant;
}

// USER OPERATIONS
export async function getUsers(
  tenantId: string,
  role?: UserRole,
): Promise<AppUser[]> {
  let query = supabase.from("users").select("*").eq("tenant_id", tenantId);

  if (role) {
    query = query.eq("role", role);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) handleSupabaseError(error);
  return data || [];
}

export async function getUserByAuthId(authId: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") handleSupabaseError(error);
  return data || null;
}

export async function createUser(
  user: Omit<AppUser, "id" | "created_at">,
): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("users")
    .insert(user as any)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data as AppUser | null;
}

export async function updateUser(
  userId: string,
  updates: Partial<Omit<AppUser, "id" | "created_at">>,
): Promise<AppUser> {
  const { data, error } = await supabase
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
  const { error } = await supabase.from("users").delete().eq("id", userId);

  if (error) handleSupabaseError(error);
}

// CATEGORY OPERATIONS
export async function getCategories(tenantId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  if (error) handleSupabaseError(error);
  return (data || []).map((category) => category as Category);
}

export async function createCategory(
  category: Omit<Category, "id" | "created_at">,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert(category as any)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("Failed to create category");
  return data as Category;
}

// INGREDIENT OPERATIONS
export async function getIngredients(tenantId: string): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) handleSupabaseError(error);
  return data || [];
}

export async function createIngredient(
  ingredient: Omit<Ingredient, "id" | "created_at">,
): Promise<Ingredient> {
  const { data, error } = await supabase
    .from("ingredients")
    .insert(ingredient as any)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data as unknown as Ingredient;
}

export async function deleteIngredient(ingredientId: string): Promise<void> {
  const { error } = await supabase
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
  // Get current ingredient
  const { data: ingredient, error: fetchError } = await supabase
    .from("ingredients")
    .select("*")
    .eq("id", ingredientId)
    .single();

  if (fetchError) handleSupabaseError(fetchError);

  // Update stock
  const newStock = ingredient.stock_qty + qty;
  const { error: updateError } = await supabase
    .from("ingredients")
    .update({ stock_qty: newStock })
    .eq("id", ingredientId);

  if (updateError) handleSupabaseError(updateError);

  // Create inventory log
  const { error: logError } = await supabase.from("inventory_logs").insert({
    tenant_id: ingredient.tenant_id,
    ingredient_id: ingredientId,
    ingredient_name: ingredient.name,
    change_qty: qty,
    reason: qty > 0 ? "restock" : "order",
    triggered_by: userId,
  });

  if (logError) handleSupabaseError(logError);
}

// PRODUCT OPERATIONS
export async function getProducts(tenantId: string): Promise<Product[]> {
  const { data, error } = await supabase
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

  // Transform data to match expected format
  return (data || []).map((product) => ({
    ...product,
    variants: product.product_variants || [],
    recipe: (product.product_ingredients || []).map((pi: any) => ({
      ingredient_id: pi.ingredient_id,
      qty_required: pi.qty_required,
      ingredient: pi.ingredients,
    })),
  }));
}

export async function createProduct(
  product: Omit<Product, "id" | "created_at">,
): Promise<Product> {
  // Extract recipe and variants from the product data
  const { recipe, variants, ...productData } = product as any;

  // Create the product
  const { data, error } = await supabase
    .from("products")
    .insert(productData as any)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("Failed to create product");

  // Create product ingredients if recipe exists
  if (recipe && recipe.length > 0) {
    const productIngredients = recipe.map((item: ProductRecipe) => ({
      product_id: data.id,
      ingredient_id: item.ingredient_id,
      qty_required: item.qty_required,
    }));

    const { error: ingredientError } = await supabase
      .from("product_ingredients")
      .insert(productIngredients as any);

    if (ingredientError) handleSupabaseError(ingredientError);
  }

  // Create product variants if they exist
  if (variants && variants.length > 0) {
    const productVariants = variants.map((variant: any) => ({
      ...variant,
      product_id: data.id,
    }));

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert(productVariants as any);

    if (variantError) handleSupabaseError(variantError);
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
  // Extract recipe and variants from updates
  const { recipe, variants, ...productData } = updates;

  // Update the product
  const { data, error } = await supabase
    .from("products")
    .update(productData as any)
    .eq("id", productId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("Product not found");

  // Update product ingredients if recipe is provided
  if (recipe !== undefined) {
    // Delete existing ingredients
    await supabase
      .from("product_ingredients")
      .delete()
      .eq("product_id", productId);

    // Add new ingredients
    if (recipe.length > 0) {
      const productIngredients = recipe.map((item: ProductRecipe) => ({
        product_id: productId,
        ingredient_id: item.ingredient_id,
        qty_required: item.qty_required,
      }));

      const { error: ingredientError } = await supabase
        .from("product_ingredients")
        .insert(productIngredients);

      if (ingredientError) handleSupabaseError(ingredientError);
    }
  }

  return data;
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) handleSupabaseError(error);
}

export async function getProductVariants(
  productId: string,
): Promise<ProductVariant[]> {
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) handleSupabaseError(error);
  return data || [];
}

// ORDER OPERATIONS
export async function getOrders(
  tenantId: string,
  limit?: number,
): Promise<Order[]> {
  let query = supabase
    .from("orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) handleSupabaseError(error);
  return (data || []) as Order[];
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) handleSupabaseError(error);
  return data || [];
}
// NOTIFICATIONS
export async function getNotifications(
  tenantId: string,
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) handleSupabaseError(error);
  return data || [];
}

export async function updateNotificationStatus(
  notificationId: string,
  status: "approved" | "rejected",
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ status })
    .eq("id", notificationId);

  if (error) handleSupabaseError(error);
}

// AUTH OPERATIONS (placeholder - would integrate with Supabase Auth)
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) handleSupabaseError(error);
  return { user: data.user, error };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) handleSupabaseError(error);
  return data || {};
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>,
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new Error("User profile not found");
  return data;
}
