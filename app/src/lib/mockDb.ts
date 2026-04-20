import type {
  Tenant,
  Branch,
  AppUser,
  Category,
  Product,
  ProductVariant,
  Ingredient,
  ProductIngredient,
  Order,
  OrderItem,
  InventoryLog,
  Notification,
  PaymentMethod,
  UserRole,
} from "@/types";
import { getStoredData, setStoredData, generateId } from "./mockData";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Tenant Management (Super Admin)
export async function getTenants(): Promise<Tenant[]> {
  await delay(200);
  return getStoredData().tenants;
}

export async function createTenant(tenantData: {
  name: string;
  slug: string;
  receipt_printing_enabled: boolean;
  receipt_config: Tenant["receipt_config"];
}): Promise<Tenant> {
  await delay(300);
  const data = getStoredData();
  const newTenant: Tenant = {
    id: generateId("tenant"),
    name: tenantData.name,
    slug: tenantData.slug,
    receipt_printing_enabled: tenantData.receipt_printing_enabled,
    receipt_config: tenantData.receipt_config,
    created_at: new Date().toISOString(),
  };

  // Create tenant user
  const newTenantUser: AppUser = {
    id: generateId("user"),
    tenant_id: newTenant.id,
    branch_id: null,
    role: "tenant",
    full_name: tenantData.name + " Owner",
    email: `${tenantData.slug}@tenant.app`,
    avatar_url: null,
    created_at: new Date().toISOString(),
  };

  setStoredData({
    tenants: [...data.tenants, newTenant],
    users: [...data.users, newTenantUser],
  });

  return newTenant;
}

export async function deleteTenant(tenantId: string): Promise<void> {
  await delay(300);
  const data = getStoredData();

  // Delete tenant and all associated data
  setStoredData({
    tenants: data.tenants.filter((t) => t.id !== tenantId),
    users: data.users.filter((u) => u.tenant_id !== tenantId),
    branches: data.branches.filter((b) => b.tenant_id !== tenantId),
    categories: data.categories.filter((c) => c.tenant_id !== tenantId),
    products: data.products.filter((p) => p.tenant_id !== tenantId),
    productVariants: data.productVariants.filter((pv) => {
      const product = data.products.find((p) => p.id === pv.product_id);
      return product?.tenant_id !== tenantId;
    }),
    ingredients: data.ingredients.filter((i) => i.tenant_id !== tenantId),
    productIngredients: data.productIngredients.filter((pi) => {
      const product = data.products.find((p) => p.id === pi.product_id);
      return product?.tenant_id !== tenantId;
    }),
    orders: data.orders.filter((o) => o.tenant_id !== tenantId),
    orderItems: data.orderItems.filter((oi) => {
      const order = data.orders.find((o) => o.id === oi.order_id);
      return order?.tenant_id !== tenantId;
    }),
    inventoryLogs: data.inventoryLogs.filter((il) => il.tenant_id !== tenantId),
    notifications: data.notifications.filter((n) => n.tenant_id !== tenantId),
  });
}

export async function resetAllData(): Promise<void> {
  await delay(500);
  localStorage.removeItem("luxpos_data");
}

// Auth
export async function signIn(
  email: string,
  _password: string,
): Promise<{ user: AppUser | null; error: string | null }> {
  await delay(400);
  const data = getStoredData();
  const user = data.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (!user) {
    // Auto-create demo login for known emails
    if (email === "admin@luxpos.app") {
      const admin = data.users.find((u) => u.role === "super_admin");
      return { user: admin || null, error: null };
    }
    if (email === "juan@silogan.ph") {
      const tenant = data.users.find((u) => u.role === "tenant");
      return { user: tenant || null, error: null };
    }
    if (email === "maria@silogan.ph") {
      const cashier = data.users.find(
        (u) => u.role === "cashier" && u.branch_id === "branch-1",
      );
      return { user: cashier || null, error: null };
    }
    if (email === "pedro@silogan.ph") {
      const cashier = data.users.find(
        (u) => u.role === "cashier" && u.branch_id === "branch-2",
      );
      return { user: cashier || null, error: null };
    }
    return {
      user: null,
      error:
        "User not found. Try admin@luxpos.app, juan@silogan.ph, maria@silogan.ph, or pedro@silogan.ph",
    };
  }
  return { user, error: null };
}

export async function signOut(): Promise<void> {
  await delay(200);
}

export async function getTenant(id: string): Promise<Tenant | null> {
  await delay(150);
  return getStoredData().tenants.find((t) => t.id === id) || null;
}

// Cashier Management (Tenant)
export async function getCashiers(tenantId: string): Promise<AppUser[]> {
  await delay(200);
  return getStoredData().users.filter(
    (u) => u.tenant_id === tenantId && u.role === "cashier",
  );
}

export async function createCashier(cashierData: {
  tenant_id: string;
  branch_id: string | null;
  full_name: string;
  email: string;
}): Promise<AppUser> {
  await delay(300);
  const data = getStoredData();
  const newCashier: AppUser = {
    id: generateId("user"),
    tenant_id: cashierData.tenant_id,
    branch_id: cashierData.branch_id,
    role: "cashier",
    full_name: cashierData.full_name,
    email: cashierData.email,
    avatar_url: null,
    created_at: new Date().toISOString(),
  };

  setStoredData({
    users: [...data.users, newCashier],
  });

  return newCashier;
}

export async function deleteCashier(cashierId: string): Promise<void> {
  await delay(300);
  const data = getStoredData();
  setStoredData({
    users: data.users.filter((u) => u.id !== cashierId),
  });
}

export async function updateTenant(
  id: string,
  updates: Partial<Tenant>,
): Promise<Tenant> {
  await delay(300);
  const data = getStoredData();
  const idx = data.tenants.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Tenant not found");
  data.tenants[idx] = { ...data.tenants[idx], ...updates };
  setStoredData({ tenants: data.tenants });
  return data.tenants[idx];
}

// Branches
export async function getBranches(tenantId: string): Promise<Branch[]> {
  await delay(200);
  return getStoredData().branches.filter((b) => b.tenant_id === tenantId);
}

export async function getBranch(id: string): Promise<Branch | null> {
  await delay(150);
  return getStoredData().branches.find((b) => b.id === id) || null;
}

export async function createBranch(
  branch: Omit<Branch, "id" | "created_at">,
): Promise<Branch> {
  await delay(300);
  const data = getStoredData();
  const newBranch: Branch = {
    ...branch,
    id: generateId("branch"),
    created_at: new Date().toISOString(),
  };
  data.branches.push(newBranch);
  setStoredData({ branches: data.branches });
  return newBranch;
}

export async function updateBranch(
  id: string,
  updates: Partial<Branch>,
): Promise<Branch> {
  await delay(300);
  const data = getStoredData();
  const idx = data.branches.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Branch not found");
  data.branches[idx] = { ...data.branches[idx], ...updates };
  setStoredData({ branches: data.branches });
  return data.branches[idx];
}

// Categories
export async function getCategories(tenantId: string): Promise<Category[]> {
  await delay(200);
  return getStoredData()
    .categories.filter((c) => c.tenant_id === tenantId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function createCategory(
  category: Omit<Category, "id" | "created_at">,
): Promise<Category> {
  await delay(300);
  const data = getStoredData();
  const newCat: Category = {
    ...category,
    id: generateId("cat"),
    created_at: new Date().toISOString(),
  };
  data.categories.push(newCat);
  setStoredData({ categories: data.categories });
  return newCat;
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>,
): Promise<Category> {
  await delay(300);
  const data = getStoredData();
  const idx = data.categories.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Category not found");
  data.categories[idx] = { ...data.categories[idx], ...updates };
  setStoredData({ categories: data.categories });
  return data.categories[idx];
}

export async function deleteCategory(id: string): Promise<void> {
  await delay(300);
  const data = getStoredData();
  data.categories = data.categories.filter((c) => c.id !== id);
  setStoredData({ categories: data.categories });
}

// Products
export async function getProducts(
  tenantId: string,
  categoryId?: string,
): Promise<Product[]> {
  await delay(200);
  let products = getStoredData().products.filter(
    (p) => p.tenant_id === tenantId,
  );
  if (categoryId) {
    products = products.filter((p) => p.category_id === categoryId);
  }
  return products;
}

export async function getProduct(id: string): Promise<Product | null> {
  await delay(150);
  return getStoredData().products.find((p) => p.id === id) || null;
}

export async function createProduct(
  product: Omit<Product, "id" | "created_at">,
): Promise<Product> {
  await delay(300);
  const data = getStoredData();
  const newProduct: Product = {
    ...product,
    id: generateId("prod"),
    created_at: new Date().toISOString(),
  };
  data.products.push(newProduct);
  setStoredData({ products: data.products });
  return newProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>,
): Promise<Product> {
  await delay(300);
  const data = getStoredData();
  const idx = data.products.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Product not found");
  data.products[idx] = { ...data.products[idx], ...updates };
  setStoredData({ products: data.products });
  return data.products[idx];
}

export async function deleteProduct(id: string): Promise<void> {
  await delay(300);
  const data = getStoredData();
  data.products = data.products.filter((p) => p.id !== id);
  data.productVariants = data.productVariants.filter(
    (v) => v.product_id !== id,
  );
  data.productIngredients = data.productIngredients.filter(
    (pi) => pi.product_id !== id,
  );
  setStoredData({
    products: data.products,
    productVariants: data.productVariants,
    productIngredients: data.productIngredients,
  });
}

// Product Variants
export async function getProductVariants(
  productId: string,
): Promise<ProductVariant[]> {
  await delay(150);
  return getStoredData().productVariants.filter(
    (v) => v.product_id === productId,
  );
}

export async function createVariant(
  variant: Omit<ProductVariant, "id" | "created_at">,
): Promise<ProductVariant> {
  await delay(200);
  const data = getStoredData();
  const newVariant: ProductVariant = {
    ...variant,
    id: generateId("var"),
    created_at: new Date().toISOString(),
  };
  data.productVariants.push(newVariant);
  setStoredData({ productVariants: data.productVariants });
  return newVariant;
}

export async function updateVariant(
  id: string,
  updates: Partial<ProductVariant>,
): Promise<ProductVariant> {
  await delay(200);
  const data = getStoredData();
  const idx = data.productVariants.findIndex((v) => v.id === id);
  if (idx === -1) throw new Error("Variant not found");
  data.productVariants[idx] = { ...data.productVariants[idx], ...updates };
  setStoredData({ productVariants: data.productVariants });
  return data.productVariants[idx];
}

export async function deleteVariant(id: string): Promise<void> {
  await delay(200);
  const data = getStoredData();
  data.productVariants = data.productVariants.filter((v) => v.id !== id);
  setStoredData({ productVariants: data.productVariants });
}

// Ingredients
export async function getIngredients(
  tenantId: string,
  branchId?: string,
): Promise<Ingredient[]> {
  await delay(200);
  let ingredients = getStoredData().ingredients.filter(
    (i) => i.tenant_id === tenantId,
  );
  if (branchId) {
    ingredients = ingredients.filter((i) => i.branch_id === branchId);
  }
  return ingredients;
}

export async function createIngredient(
  ingredient: Omit<Ingredient, "id" | "created_at">,
): Promise<Ingredient> {
  await delay(300);
  const data = getStoredData();
  const newIng: Ingredient = {
    ...ingredient,
    id: generateId("ing"),
    created_at: new Date().toISOString(),
  };
  data.ingredients.push(newIng);
  setStoredData({ ingredients: data.ingredients });
  return newIng;
}

export async function updateIngredient(
  id: string,
  updates: Partial<Ingredient>,
): Promise<Ingredient> {
  await delay(300);
  const data = getStoredData();
  const idx = data.ingredients.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Ingredient not found");
  data.ingredients[idx] = { ...data.ingredients[idx], ...updates };
  setStoredData({ ingredients: data.ingredients });
  return data.ingredients[idx];
}

export async function deleteIngredient(id: string): Promise<void> {
  await delay(300);
  const data = getStoredData();
  data.ingredients = data.ingredients.filter((i) => i.id !== id);
  data.productIngredients = data.productIngredients.filter(
    (pi) => pi.ingredient_id !== id,
  );
  setStoredData({
    ingredients: data.ingredients,
    productIngredients: data.productIngredients,
  });
}

// Product Ingredients
export async function getProductIngredients(
  productId: string,
): Promise<ProductIngredient[]> {
  await delay(150);
  return getStoredData().productIngredients.filter(
    (pi) => pi.product_id === productId,
  );
}

export async function setProductIngredients(
  productId: string,
  ingredients: { ingredient_id: string; qty_required: number }[],
): Promise<void> {
  await delay(300);
  const data = getStoredData();
  data.productIngredients = data.productIngredients.filter(
    (pi) => pi.product_id !== productId,
  );
  for (const ing of ingredients) {
    data.productIngredients.push({
      id: generateId("pi"),
      product_id: productId,
      ingredient_id: ing.ingredient_id,
      qty_required: ing.qty_required,
    });
  }
  setStoredData({ productIngredients: data.productIngredients });
}

// Orders
export async function getOrders(
  tenantId: string,
  branchId?: string,
  limit?: number,
): Promise<Order[]> {
  await delay(200);
  let orders = getStoredData().orders.filter((o) => o.tenant_id === tenantId);
  if (branchId) {
    orders = orders.filter((o) => o.branch_id === branchId);
  }
  orders = orders.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  if (limit) orders = orders.slice(0, limit);
  return orders;
}

export async function getOrder(id: string): Promise<Order | null> {
  await delay(150);
  const order = getStoredData().orders.find((o) => o.id === id);
  if (!order) return null;
  const branch = getStoredData().branches.find((b) => b.id === order.branch_id);
  const cashier = getStoredData().users.find((u) => u.id === order.cashier_id);
  return {
    ...order,
    branch_name: branch?.name,
    cashier_name: cashier?.full_name,
  };
}

export async function createOrder(
  order: Omit<Order, "id" | "created_at">,
  items: Omit<OrderItem, "id">[],
): Promise<Order> {
  await delay(400);
  const data = getStoredData();
  const newOrder: Order = {
    ...order,
    id: generateId("order"),
    created_at: new Date().toISOString(),
  };
  data.orders.push(newOrder);

  // Create order items
  const newItems: OrderItem[] = items.map((item) => ({
    ...item,
    id: generateId("oi"),
  }));
  data.orderItems.push(...newItems);

  // Deduct inventory
  for (const item of items) {
    const prodIngredients = data.productIngredients.filter(
      (pi) => pi.product_id === item.product_id,
    );
    for (const pi of prodIngredients) {
      const ingredient = data.ingredients.find(
        (i) => i.id === pi.ingredient_id && i.branch_id === order.branch_id,
      );
      if (ingredient) {
        const deduction = pi.qty_required * item.qty;
        ingredient.stock_qty = Math.max(0, ingredient.stock_qty - deduction);
        data.inventoryLogs.push({
          id: generateId("log"),
          tenant_id: order.tenant_id,
          branch_id: order.branch_id,
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          change_qty: -deduction,
          reason: "order",
          triggered_by: order.cashier_id,
          created_at: newOrder.created_at,
        });
      }
    }
  }

  setStoredData({
    orders: data.orders,
    orderItems: data.orderItems,
    ingredients: data.ingredients,
    inventoryLogs: data.inventoryLogs,
  });
  return newOrder;
}

export async function voidOrder(
  orderId: string,
  approvedBy: string,
): Promise<Order> {
  await delay(300);
  const data = getStoredData();
  const idx = data.orders.findIndex((o) => o.id === orderId);
  if (idx === -1) throw new Error("Order not found");

  const order = data.orders[idx];
  if (order.status === "voided") throw new Error("Order already voided");

  // Get order items
  const items = data.orderItems.filter((oi) => oi.order_id === orderId);

  // Restore inventory
  for (const item of items) {
    const prodIngredients = data.productIngredients.filter(
      (pi) => pi.product_id === item.product_id,
    );
    for (const pi of prodIngredients) {
      const ingredient = data.ingredients.find(
        (i) => i.id === pi.ingredient_id && i.branch_id === order.branch_id,
      );
      if (ingredient) {
        const restoration = pi.qty_required * item.qty;
        ingredient.stock_qty += restoration;
        data.inventoryLogs.push({
          id: generateId("log"),
          tenant_id: order.tenant_id,
          branch_id: order.branch_id,
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          change_qty: restoration,
          reason: "void_reversal",
          triggered_by: approvedBy,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  data.orders[idx] = { ...order, status: "voided" };
  setStoredData({
    orders: data.orders,
    ingredients: data.ingredients,
    inventoryLogs: data.inventoryLogs,
  });
  return data.orders[idx];
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  await delay(150);
  return getStoredData().orderItems.filter((oi) => oi.order_id === orderId);
}

// Inventory
export async function getInventoryLogs(
  tenantId: string,
  branchId?: string,
): Promise<InventoryLog[]> {
  await delay(200);
  let logs = getStoredData().inventoryLogs.filter(
    (l) => l.tenant_id === tenantId,
  );
  if (branchId) {
    logs = logs.filter((l) => l.branch_id === branchId);
  }
  return logs.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function restockIngredient(
  ingredientId: string,
  qty: number,
  triggeredBy: string,
): Promise<Ingredient> {
  await delay(300);
  const data = getStoredData();
  const idx = data.ingredients.findIndex((i) => i.id === ingredientId);
  if (idx === -1) throw new Error("Ingredient not found");
  data.ingredients[idx].stock_qty += qty;
  data.inventoryLogs.push({
    id: generateId("log"),
    tenant_id: data.ingredients[idx].tenant_id,
    branch_id: data.ingredients[idx].branch_id,
    ingredient_id: ingredientId,
    ingredient_name: data.ingredients[idx].name,
    change_qty: qty,
    reason: "restock",
    triggered_by: triggeredBy,
    created_at: new Date().toISOString(),
  });
  setStoredData({
    ingredients: data.ingredients,
    inventoryLogs: data.inventoryLogs,
  });
  return data.ingredients[idx];
}

// Notifications
export async function getNotifications(
  tenantId: string,
  branchId?: string,
): Promise<Notification[]> {
  await delay(200);
  let notifs = getStoredData().notifications.filter(
    (n) => n.tenant_id === tenantId,
  );
  if (branchId) {
    notifs = notifs.filter(
      (n) => n.branch_id === branchId || n.branch_id === null,
    );
  }
  return notifs.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function createNotification(
  notification: Omit<Notification, "id" | "created_at">,
): Promise<Notification> {
  await delay(300);
  const data = getStoredData();
  const newNotif: Notification = {
    ...notification,
    id: generateId("notif"),
    created_at: new Date().toISOString(),
  };
  data.notifications.push(newNotif);
  setStoredData({ notifications: data.notifications });
  return newNotif;
}

export async function updateNotificationStatus(
  id: string,
  status: "approved" | "rejected",
  resolverId: string,
): Promise<Notification> {
  await delay(300);
  const data = getStoredData();
  const idx = data.notifications.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error("Notification not found");
  data.notifications[idx] = { ...data.notifications[idx], status };
  setStoredData({ notifications: data.notifications });

  // Handle side effects
  const notif = data.notifications[idx];
  if (notif.type === "void_order" && status === "approved") {
    await voidOrder(notif.payload.order_id as string, resolverId);
  }

  return notif;
}

// Dashboard stats
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

export async function getDashboardStats(
  tenantId: string,
  branchId?: string,
  days: number = 30,
): Promise<DashboardStats> {
  await delay(300);
  const data = getStoredData();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  let orders = data.orders.filter(
    (o) =>
      o.tenant_id === tenantId &&
      o.status === "completed" &&
      new Date(o.created_at) >= cutoff,
  );
  if (branchId) orders = orders.filter((o) => o.branch_id === branchId);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const totalProducts = data.products.filter(
    (p) => p.tenant_id === tenantId,
  ).length;

  let ingredients = data.ingredients.filter((i) => i.tenant_id === tenantId);
  if (branchId)
    ingredients = ingredients.filter((i) => i.branch_id === branchId);
  const lowStockCount = ingredients.filter(
    (i) => i.stock_qty <= i.low_stock_threshold,
  ).length;

  const methods: PaymentMethod[] = ["cash", "gcash", "maya"];
  const paymentBreakdown = methods.map((m) => ({
    method: m,
    amount: orders
      .filter((o) => o.payment_method === m)
      .reduce((s, o) => s + o.total, 0),
    count: orders.filter((o) => o.payment_method === m).length,
  }));

  // Daily revenue (last 14 days)
  const dailyRevenue: { date: string; amount: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOrders = orders.filter((o) => o.created_at.startsWith(dateStr));
    dailyRevenue.push({
      date: dateStr,
      amount: dayOrders.reduce((s, o) => s + o.total, 0),
    });
  }

  // Top products
  const productSales: Record<
    string,
    { name: string; qty: number; revenue: number }
  > = {};
  for (const o of orders) {
    const items = data.orderItems.filter((oi) => oi.order_id === o.id);
    for (const item of items) {
      if (!productSales[item.product_name]) {
        productSales[item.product_name] = {
          name: item.product_name,
          qty: 0,
          revenue: 0,
        };
      }
      productSales[item.product_name].qty += item.qty;
      productSales[item.product_name].revenue += item.unit_price * item.qty;
    }
  }
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Branch breakdown
  const branchData = data.branches.filter((b) => b.tenant_id === tenantId);
  const branchBreakdown = branchData.map((b) => {
    const bOrders = orders.filter((o) => o.branch_id === b.id);
    return {
      branch_id: b.id,
      branch_name: b.name,
      revenue: bOrders.reduce((s, o) => s + o.total, 0),
      orders: bOrders.length,
    };
  });

  return {
    totalRevenue,
    totalOrders,
    totalProducts,
    lowStockCount,
    paymentBreakdown,
    dailyRevenue,
    topProducts,
    branchBreakdown,
  };
}

// Users
export async function getUsers(
  tenantId: string,
  role?: UserRole,
): Promise<AppUser[]> {
  await delay(200);
  let users = getStoredData().users.filter((u) => u.tenant_id === tenantId);
  if (role) users = users.filter((u) => u.role === role);
  return users;
}

export async function createUser(
  user: Omit<AppUser, "id" | "created_at">,
): Promise<AppUser> {
  await delay(300);
  const data = getStoredData();
  const newUser: AppUser = {
    ...user,
    id: generateId("user"),
    created_at: new Date().toISOString(),
  };
  data.users.push(newUser);
  setStoredData({ users: data.users });
  return newUser;
}
