import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ShoppingBag,
  Package,
  AlertTriangle,
  DollarSign,
  Bell,
  CheckCircle,
  XCircle,
  LogOut,
  Store,
  BarChart3,
  Utensils,
  ClipboardList,
  RefreshCw,
  Trash2,
  X,
  Users,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/stores/useStore";
import {
  useRealtimeOrders,
  useRealtimeNotifications,
} from "@/hooks/useRealtime";
import {
  getTenant,
  getDashboardStats,
  getNotifications,
  updateNotificationStatus,
  getIngredients,
  getProducts,
  getCategories,
  createCategory,
  deleteCategory,
  createIngredient,
  deleteIngredient,
  createProduct,
  deleteProduct,
  restockIngredient,
  getOrders,
  getOrderItems,
  getUsers,
} from "@/lib/supabaseDb";
import { uploadProductImage } from "@/lib/imageUpload";
import type {
  Notification,
  Ingredient,
  Order,
  OrderItem,
  DashboardStats,
  Product,
  ProductRecipe,
  Category,
} from "@/types";

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { currentTenant, setCurrentTenant } = useStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [restockQty, setRestockQty] = useState<Record<string, string>>({});
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [cashiers, setCashiers] = useState<any[]>([]);

  // Inventory-driven alert engine (Fix #1)
  const [inventoryAlerts, setInventoryAlerts] = useState({
    low: 0,
    out: 0,
    total: 0,
  });

  // Redirect non-owner
  useEffect(() => {
    if (
      currentUser &&
      currentUser.role !== "owner" &&
      currentUser.role !== "tenant"
    ) {
      if (currentUser.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/cashier");
      }
    }
  }, [currentUser, navigate]);

  // Load data
  const loadData = useCallback(async () => {
    if (!currentUser?.tenant_id) return;
    const tenant = await getTenant(currentUser.tenant_id);
    if (tenant) setCurrentTenant(tenant);

    const [s, notifs, ings, prods, cats, ords, cash] = await Promise.all([
      getDashboardStats(currentUser.tenant_id),
      getNotifications(currentUser.tenant_id),
      getIngredients(currentUser.tenant_id),
      getProducts(currentUser.tenant_id),
      getCategories(currentUser.tenant_id),
      getOrders(currentUser.tenant_id, 20),
      getUsers(currentUser.tenant_id),
    ]);
    setStats(s);
    setNotifications(notifs);
    setIngredients(ings);
    setProducts(prods);
    setCategories(cats);
    setOrders(ords);
    setCashiers(cash.filter((user: any) => user.role === "cashier"));

    // Compute inventory alerts from real ingredient data (Fix #1)
    const lowStockItems = ings.filter(
      (i: Ingredient) =>
        i.stock_qty > 0 && i.stock_qty <= i.low_stock_threshold,
    );
    const outOfStockItems = ings.filter((i: Ingredient) => i.stock_qty <= 0);
    setInventoryAlerts({
      low: lowStockItems.length,
      out: outOfStockItems.length,
      total: lowStockItems.length + outOfStockItems.length,
    });

    // Load order items
    const itemsMap: Record<string, OrderItem[]> = {};
    for (const order of ords.slice(0, 10)) {
      itemsMap[order.id] = await getOrderItems(order.id);
    }
    setOrderItems(itemsMap);
  }, [currentUser, setCurrentTenant]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time
  useRealtimeOrders(currentUser?.tenant_id || null, () => {
    loadData();
  });
  useRealtimeNotifications(currentUser?.tenant_id || null, () => {
    loadData();
  });

  const handleApproveNotif = async (id: string) => {
    if (!currentUser) return;
    await updateNotificationStatus(id, "approved");
    loadData();
  };

  const handleRejectNotif = async (id: string) => {
    if (!currentUser) return;
    await updateNotificationStatus(id, "rejected");
    loadData();
  };

  const handleRestock = async (ingredientId: string) => {
    if (!currentUser) return;
    const qty = Number(restockQty[ingredientId]);
    if (!qty || qty <= 0) return;
    await restockIngredient(ingredientId, qty, currentUser.id);
    setRestockQty((p) => ({ ...p, [ingredientId]: "" }));
    loadData();
  };

  const tabs = [
    { id: "overview", icon: BarChart3, label: "Overview" },
    { id: "orders", icon: ClipboardList, label: "Orders" },
    { id: "inventory", icon: Package, label: "Inventory" },
    { id: "products", icon: Utensils, label: "Products" },
    { id: "cashiers", icon: Users, label: "Cashiers" },
    { id: "notifications", icon: Bell, label: "Notifications" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f5" }}>
      {/* Top Bar */}
      <header className="bg-white border-b border-[#e0e0e0] sticky top-0 z-30">
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-accent-orange flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-[#2c2c2c]">
                {currentTenant?.name || "Dashboard"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center hover:bg-[#e0e0e0] transition-colors"
            >
              <Bell className="w-5 h-5 text-[#2c2c2c]" />
              {inventoryAlerts.total > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger-red text-white text-xs flex items-center justify-center font-bold">
                  {inventoryAlerts.total}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                logout();
                navigate("/login?role=owner");
              }}
              className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center hover:bg-[#e0e0e0] transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pb-2">
          <div className="flex gap-1 justify-center overflow-x-auto scrollbar-hide sm:overflow-x-visible">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 min-w-[44px] sm:min-w-[48px] ${
                    activeTab === tab.id
                      ? "bg-accent-orange text-white shadow-float"
                      : "text-muted-foreground hover:text-[#2c2c2c] hover:bg-[#e0e0e0]"
                  }`}
                  title={tab.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 sm:px-6 py-4 sm:py-6 max-w-full overflow-x-hidden">
        {activeTab === "overview" && <OverviewTab stats={stats} />}
        {activeTab === "orders" && (
          <OrdersTab orders={orders} orderItems={orderItems} />
        )}
        {activeTab === "inventory" && (
          <InventoryTab
            ingredients={ingredients}
            products={products}
            categories={categories}
            restockQty={restockQty}
            setRestockQty={setRestockQty}
            onRestock={handleRestock}
            onProductUpdate={loadData}
            currentUser={currentUser}
          />
        )}
        {activeTab === "products" && (
          <ProductStatusPanel products={products} ingredients={ingredients} />
        )}
        {activeTab === "cashiers" && (
          <CashierManagementTab cashiers={cashiers} />
        )}
        {activeTab === "notifications" && (
          <NotificationsTab
            notifications={notifications}
            onApprove={handleApproveNotif}
            onReject={handleRejectNotif}
          />
        )}
      </main>
    </div>
  );
}

// --- Daily Revenue Chart Component ---
function DailyRevenueChart({ data }: { data: { date: string; amount: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;
    
    // Check if it's dark mode
    const isDark = document.documentElement.classList.contains("dark");
    const orange = "#ff9e2c";
    const faint = isDark ? "rgba(255, 158, 44, 0.1)" : "rgba(255, 158, 44, 0.05)";

    // Destroy previous instance to avoid canvas reuse errors
    if (chartRef.current) chartRef.current.destroy();

    // Dynamically import Chart.js
    import("chart.js/auto").then(({ Chart }) => {
      chartRef.current = new Chart(canvasRef.current!, {
        type: "bar",
        data: {
          labels: data.map((d) => new Date(d.date).getDate()),
          datasets: [{
            label: "Revenue",
            data: data.map((d) => d.amount),
            backgroundColor: data.map((d) => d.amount > 0 ? orange : faint),
            borderColor: data.map((d) => d.amount > 0 ? orange : "transparent"),
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
            barThickness: 'flex' as any,
            maxBarThickness: 32,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#2c2c2c",
              titleFont: { family: "Fredoka" },
              bodyFont: { family: "DM Sans" },
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (ctx: any) => `P${(ctx.raw as number).toLocaleString()}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { size: 10, family: "DM Sans" },
                color: "#888",
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
              },
              ticks: {
                font: { size: 10, family: "DM Sans" },
                color: "#888",
                callback: (v: any) => `P${v}`,
              },
            },
          },
        },
      });
    });

    return () => { chartRef.current?.destroy(); };
  }, [data]);

  return (
    <div className="w-full h-48 sm:h-64 mt-4">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Overview Tab ───
function OverviewTab({ stats }: { stats: DashboardStats | null }) {
  // Default empty stats if null
  const s = stats || {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
    paymentBreakdown: [],
    dailyRevenue: [],
    topProducts: [],
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Total Revenue"
          value={`P${s.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="orange"
        />
        <KpiCard
          title="Total Orders"
          value={s.totalOrders.toString()}
          icon={ShoppingBag}
          color="green"
        />
        <KpiCard
          title="Products"
          value={s.totalProducts.toString()}
          icon={Utensils}
          color="blue"
        />
        <KpiCard
          title="Low Stock Items"
          value={s.lowStockCount.toString()}
          icon={AlertTriangle}
          color={s.lowStockCount > 0 ? "red" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="font-heading font-semibold text-base sm:text-lg mb-3 sm:mb-4">
            Daily Revenue (14 days)
          </h3>
          <DailyRevenueChart data={s.dailyRevenue} />
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="font-heading font-semibold text-base sm:text-lg mb-3 sm:mb-4">
            Payment Methods
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {s.paymentBreakdown.map((p) => (
              <div key={p.method}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium capitalize">{p.method}</span>
                  <span className="font-mono">
                    P{p.amount.toLocaleString()} ({p.count} orders)
                  </span>
                </div>
                <div className="h-2.5 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-orange transition-all"
                    style={{
                      width: `${s.totalRevenue > 0 ? (p.amount / s.totalRevenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
        <h3 className="font-heading font-semibold text-base sm:text-lg mb-3 sm:mb-4">
          Top Products
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {s.topProducts.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[#f5f5f5] flex items-center justify-center text-xs font-bold text-muted-foreground">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.qty} sold</p>
              </div>
              <span className="font-mono text-sm font-semibold">
                P{p.revenue.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-50 text-[#ff9e2c]",
    green: "bg-green-50 text-[#00c29f]",
    blue: "bg-blue-50 text-blue-500",
    red: "bg-red-50 text-red-500",
  };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl ${colorMap[color]?.split(" ")[0] || "bg-gray-50"} flex items-center justify-center`}
        >
          <Icon
            className={`w-5 h-5 ${colorMap[color]?.split(" ")[1] || "text-gray-500"}`}
          />
        </div>
      </div>
      <p className="text-2xl font-heading font-bold text-[#2c2c2c]">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
    </div>
  );
}

// ─── Orders Tab ───
function OrdersTab({
  orders,
  orderItems,
}: {
  orders: Order[];
  orderItems: Record<string, OrderItem[]>;
}) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#e0e0e0]">
        <h3 className="font-heading font-semibold text-lg">Recent Orders</h3>
      </div>
      <div className="divide-y divide-[#e0e0e0]">
        {orders.map((order) => {
          const items = orderItems[order.id] || [];
          const isExpanded = expandedOrder === order.id;
          return (
            <div
              key={order.id}
              className="hover:bg-[#f5f5f5]/50 transition-colors"
            >
              <button
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === "completed" ? "bg-green-100" : "bg-red-100"}`}
                  >
                    {order.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Order #{order.id.split("-")[1] || order.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("en-PH")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold">
                    P{order.total.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {order.payment_method}
                  </p>
                </div>
              </button>
              {isExpanded && items.length > 0 && (
                <div className="px-4 pb-4 pl-14">
                  <div className="bg-[#f5f5f5] rounded-xl p-3 space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.product_name}{" "}
                          {item.variant_name && `(${item.variant_name})`} x
                          {item.qty}
                        </span>
                        <span className="font-mono">
                          P{(item.unit_price * item.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Comprehensive Inventory Management Tab ───
function InventoryTab({
  ingredients,
  products,
  categories,
  restockQty,
  setRestockQty,
  onRestock,
  onProductUpdate,
  currentUser,
}: {
  ingredients: Ingredient[];
  products: Product[];
  categories: Category[];
  restockQty: Record<string, string>;
  setRestockQty: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onRestock: (id: string) => void;
  onProductUpdate: () => void;
  currentUser: any;
}) {
  const [activeSection, setActiveSection] = useState<
    "categories" | "ingredients" | "products"
  >("ingredients");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  // Form states
  const [newCategory, setNewCategory] = useState({
    name: "",
    sort_order: 0,
  });

  const [newIngredient, setNewIngredient] = useState({
    name: "",
    unit: "",
    stock_qty: 0,
    low_stock_threshold: 0,
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    price: 0,
    description: "",
    recipe: [] as ProductRecipe[],
    imageFile: null as File | null,
    imagePreview: "",
  });

  // Helper function to get products affected by an ingredient
  const getAffectedProducts = (ingredientId: string, products: Product[]) => {
    return products.filter((p) =>
      p.recipe?.some((r) => r.ingredient_id === ingredientId),
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!currentUser?.tenant_id) return;

    try {
      await deleteCategory(categoryId);
      onProductUpdate(); // Refresh data
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim()) return;
    if (!currentUser?.tenant_id) return;

    try {
      // Create the ingredient
      const ingredientData = {
        name: newIngredient.name,
        unit: newIngredient.unit,
        stock_qty: newIngredient.stock_qty,
        low_stock_threshold: newIngredient.low_stock_threshold,
      };

      await createIngredient({
        ...ingredientData,
        tenant_id: currentUser.tenant_id,
      });
      setShowAddIngredient(false);
      setNewIngredient({
        name: "",
        unit: "",
        stock_qty: 0,
        low_stock_threshold: 0,
      });
      onProductUpdate(); // Refresh data
    } catch (error) {
      console.error("Error creating ingredient:", error);
      alert("Failed to create ingredient. Please try again.");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    if (!currentUser?.tenant_id) return;

    try {
      const categoryData = {
        name: newCategory.name,
        sort_order: newCategory.sort_order,
      };

      await createCategory({
        ...categoryData,
        tenant_id: currentUser.tenant_id,
      });
      setShowAddCategory(false);
      setNewCategory({
        name: "",
        sort_order: 0,
      });
      onProductUpdate(); // Refresh to show new category
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category. Please try again.");
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) return;
    if (!currentUser?.tenant_id) return;

    try {
      let imageUrl = "";

      // Upload image if provided
      if (newProduct.imageFile) {
        imageUrl = await uploadProductImage(
          newProduct.imageFile,
          currentUser.tenant_id,
        );
      }

      // Create the product with recipe
      const productData = {
        name: newProduct.name,
        category_id: newProduct.category_id,
        price: newProduct.price,
        description: newProduct.description,
        is_available: true,
        has_variants: false,
        recipe: newProduct.recipe.filter(
          (item) => item.ingredient_id && item.qty_required > 0,
        ),
      };

      await createProduct({
        ...productData,
        tenant_id: currentUser.tenant_id,
        image_url: imageUrl,
      });
      setShowAddProduct(false);
      setNewProduct({
        name: "",
        category_id: "",
        price: 0,
        description: "",
        recipe: [] as ProductRecipe[],
        imageFile: null,
        imagePreview: "",
      });
      onProductUpdate();
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product. Please try again.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;

    try {
      await deleteProduct(productId);
      onProductUpdate();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    if (!confirm("Delete this ingredient? This cannot be undone.")) return;

    try {
      await deleteIngredient(ingredientId);
      onProductUpdate();
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      alert("Failed to delete ingredient. Please try again.");
    }
  };

  const addRecipeItem = () => {
    setNewProduct((prev) => ({
      ...prev,
      recipe: [...prev.recipe, { ingredient_id: "", qty_required: 1 }],
    }));
  };

  const updateRecipeItem = (
    index: number,
    field: keyof ProductRecipe,
    value: string | number,
  ) => {
    setNewProduct((prev) => ({
      ...prev,
      recipe: prev.recipe.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const removeRecipeItem = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      recipe: prev.recipe.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-lg">
          Inventory Management
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCategory(true)}
            className="px-4 py-2 bg-[#2c2c2c] text-white rounded-lg text-sm font-medium hover:bg-[#3a3a3a]"
          >
            + Add Category
          </button>
          <button
            onClick={() => setShowAddIngredient(true)}
            className="px-4 py-2 bg-[#2c2c2c] text-white rounded-lg text-sm font-medium hover:bg-[#3a3a3a]"
          >
            + Add Ingredient
          </button>
          <button
            onClick={() => setShowAddProduct(true)}
            className="px-4 py-2 bg-accent-orange text-white rounded-lg text-sm font-medium hover:bg-accent-hover"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-[#e0e0e0]">
        <button
          onClick={() => setActiveSection("categories")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === "categories"
              ? "border-accent-orange text-accent-orange"
              : "border-transparent text-muted-foreground hover:text-[#2c2c2c]"
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveSection("ingredients")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === "ingredients"
              ? "border-accent-orange text-accent-orange"
              : "border-transparent text-muted-foreground hover:text-[#2c2c2c]"
          }`}
        >
          Ingredients ({ingredients.length})
        </button>
        <button
          onClick={() => setActiveSection("products")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === "products"
              ? "border-accent-orange text-accent-orange"
              : "border-transparent text-muted-foreground hover:text-[#2c2c2c]"
          }`}
        >
          Products ({products.length})
        </button>
      </div>

      {/* INGREDIENTS SECTION */}
      {activeSection === "ingredients" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#f5f5f5]">
                <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Current Stock</th>
                  <th className="px-4 py-3">Low Stock Threshold</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Used In</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {ingredients.map((ing) => {
                  const isLow = ing.stock_qty <= ing.low_stock_threshold;
                  const affectedProducts = getAffectedProducts(
                    ing.id,
                    products,
                  );

                  return (
                    <tr key={ing.id} className="hover:bg-[#f5f5f5]/50">
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium">{ing.name}</span>
                          <p className="text-xs text-muted-foreground">
                            Unit: {ing.unit}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-sm ${isLow ? "text-red-600" : "text-green-600"}`}
                        >
                          {ing.stock_qty.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                        {ing.low_stock_threshold}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isLow
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {isLow ? "Low Stock" : "OK"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {affectedProducts.length > 0 ? (
                          <div className="text-xs">
                            <p className="font-medium text-muted-foreground">
                              {affectedProducts.length} product
                              {affectedProducts.length > 1 ? "s" : ""}
                            </p>
                            <p className="text-muted-foreground">
                              {affectedProducts
                                .slice(0, 2)
                                .map((p) => p.name)
                                .join(", ")}
                              {affectedProducts.length > 2 && "..."}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not used
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={restockQty[ing.id] || ""}
                            onChange={(e) =>
                              setRestockQty((p) => ({
                                ...p,
                                [ing.id]: e.target.value,
                              }))
                            }
                            placeholder="Qty"
                            className="w-20 h-8 rounded-lg border border-[#e0e0e0] px-2 text-sm"
                          />
                          <button
                            onClick={() => onRestock(ing.id)}
                            className="h-8 px-3 rounded-lg bg-success-green text-white text-xs font-medium hover:opacity-90 transition-opacity"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteIngredient(ing.id)}
                            className="h-8 px-3 rounded-lg bg-red-100 text-red-600 text-xs font-medium hover:bg-red-200 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCTS SECTION */}
      {activeSection === "products" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const isAvailable = isProductAvailable(product, ingredients);

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl p-4 border-2 ${
                    isAvailable
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-sm">{product.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        ₱{product.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isAvailable ? "✓ Available" : "✗ Unavailable"}
                  </span>

                  {product.recipe && product.recipe.length > 0 && (
                    <div className="mt-3 text-xs">
                      <p className="font-medium text-muted-foreground mb-1">
                        Recipe:
                      </p>
                      <ul className="space-y-1">
                        {product.recipe.map((req, idx) => {
                          const ing = ingredients.find(
                            (i) => i.id === req.ingredient_id,
                          );
                          return (
                            <li key={idx} className="text-muted-foreground">
                              • {ing?.name || "Unknown"}: {req.qty_required}{" "}
                              {ing?.unit || ""}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORIES SECTION */}
      {activeSection === "categories" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#f5f5f5]">
                <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Sort Order</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#f5f5f5]/50">
                    <td className="px-4 py-3">
                      <span className="font-medium">{cat.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                      {cat.sort_order}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD INGREDIENT MODAL */}
      {showAddIngredient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Ingredient</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newIngredient.name}
                  onChange={(e) =>
                    setNewIngredient((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg"
                  placeholder="e.g., Rice"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select
                  value={newIngredient.unit}
                  onChange={(e) =>
                    setNewIngredient((prev) => ({
                      ...prev,
                      unit: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg"
                >
                  <option value="">Select Unit</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="L">Liters (L)</option>
                  <option value="g">Grams (g)</option>
                  <option value="mL">Milliliters (mL)</option>
                  <option value="box">Box</option>
                  <option value="bottle">Bottle</option>
                  <option value="pack">Pack</option>
                  <option value="dozen">Dozen</option>
                  <option value="unit">Unit</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newIngredient.stock_qty}
                    onChange={(e) =>
                      setNewIngredient((prev) => ({
                        ...prev,
                        stock_qty: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    value={newIngredient.low_stock_threshold}
                    onChange={(e) =>
                      setNewIngredient((prev) => ({
                        ...prev,
                        low_stock_threshold: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddIngredient(false)}
                className="flex-1 px-4 py-2 border border-[#e0e0e0] rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIngredient}
                className="flex-1 px-4 py-2 bg-accent-orange text-white rounded-lg text-sm font-medium"
              >
                Add Ingredient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg"
                  placeholder="e.g., Beverages"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={newCategory.sort_order}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      sort_order: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddCategory(false)}
                className="flex-1 px-4 py-2 border border-[#e0e0e0] rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 px-4 py-2 bg-accent-orange text-white rounded-lg text-sm font-medium"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg"
                    placeholder="e.g., Fried Rice"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={newProduct.category_id}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        category_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Image
                </label>
                <div className="space-y-2">
                  {newProduct.imagePreview ? (
                    <div className="relative">
                      <img
                        src={newProduct.imagePreview}
                        alt="Product preview"
                        className="w-full h-48 object-cover rounded-lg border border-[#e0e0e0]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewProduct((prev) => ({
                            ...prev,
                            imageFile: null,
                            imagePreview: "",
                          }))
                        }
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-[#e0e0e0] rounded-lg p-6 text-center">
                      <div className="w-12 h-12 bg-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Package className="w-6 h-6 text-[#9ca3af]" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WebP up to 5MB
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <label
                        htmlFor="product-image-upload"
                        className="inline-block mt-3 px-4 py-2 bg-accent-orange text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-accent-hover"
                      >
                        Choose Image
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Recipe Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">
                    Recipe (Ingredients)
                  </label>
                  <button
                    onClick={addRecipeItem}
                    className="px-3 py-1 bg-accent-orange text-white rounded text-sm"
                  >
                    + Add Ingredient
                  </button>
                </div>
                <div className="space-y-2">
                  {newProduct.recipe.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={item.ingredient_id}
                        onChange={(e) =>
                          updateRecipeItem(
                            index,
                            "ingredient_id",
                            e.target.value,
                          )
                        }
                        className="flex-1 px-3 py-2 border border-[#e0e0e0] rounded-lg text-sm"
                      >
                        <option value="">Select Ingredient</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={item.qty_required}
                        onChange={(e) =>
                          updateRecipeItem(
                            index,
                            "qty_required",
                            Number(e.target.value),
                          )
                        }
                        className="w-24 px-3 py-2 border border-[#e0e0e0] rounded-lg text-sm"
                        placeholder="Qty"
                      />
                      <button
                        onClick={() => removeRecipeItem(index)}
                        className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddProduct(false)}
                className="flex-1 px-4 py-2 border border-[#e0e0e0] rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="flex-1 px-4 py-2 bg-accent-orange text-white rounded-lg text-sm font-medium"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Product Status Validation (Fix #4) ───
function isProductAvailable(product: Product, ingredients: Ingredient[]) {
  if (!product.recipe || product.recipe.length === 0) return true; // Non-recipe products are always available

  return product.recipe.every((req: ProductRecipe) => {
    const ing = ingredients.find((i) => i.id === req.ingredient_id);
    return ing && ing.stock_qty >= req.qty_required;
  });
}

function ProductStatusPanel({
  products,
  ingredients,
}: {
  products: Product[];
  ingredients: Ingredient[];
}) {
  const [activeFilter, setActiveFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");

  const filteredProducts = products.filter((product) => {
    const isAvailable = isProductAvailable(product, ingredients);
    if (activeFilter === "available") return isAvailable;
    if (activeFilter === "unavailable") return !isAvailable;
    return true;
  });

  const availableCount = products.filter((p) =>
    isProductAvailable(p, ingredients),
  ).length;
  const unavailableCount = products.length - availableCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-lg">Product Status</h3>
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
            {availableCount} Available
          </span>
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">
            {unavailableCount} Unavailable
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "available", "unavailable"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === filter
                ? "bg-[#2c2c2c] text-white"
                : "bg-[#f5f5f5] text-[#5a5a5a] hover:bg-[#e0e0e0]"
            }`}
          >
            {filter === "all" && "All Products"}
            {filter === "available" && "Available"}
            {filter === "unavailable" && "Unavailable"}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const isAvailable = isProductAvailable(product, ingredients);
          const blockingIngredients = product.recipe?.filter((req) => {
            const ing = ingredients.find((i) => i.id === req.ingredient_id);
            return !ing || ing.stock_qty < req.qty_required;
          });

          return (
            <div
              key={product.id}
              className={`bg-white rounded-xl p-4 border-2 ${
                isAvailable
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-sm">{product.name}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isAvailable ? "✓ Available" : "✗ Unavailable"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-2">
                Price: ₱{product.price.toFixed(2)}
              </p>

              {!isAvailable &&
                blockingIngredients &&
                blockingIngredients.length > 0 && (
                  <div className="text-xs">
                    <p className="font-medium text-red-600 mb-1">
                      Missing ingredients:
                    </p>
                    <ul className="space-y-1">
                      {blockingIngredients.map((req) => {
                        const ing = ingredients.find(
                          (i) => i.id === req.ingredient_id,
                        );
                        return (
                          <li key={req.ingredient_id} className="text-red-600">
                            • {ing?.name || "Unknown"} (need: {req.qty_required}
                            , have: {ing?.stock_qty || 0})
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Notifications Tab ───
function NotificationsTab({
  notifications,
  onApprove,
  onReject,
}: {
  notifications: Notification[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [activeNotifTab, setActiveNotifTab] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  const filtered =
    activeNotifTab === "all"
      ? notifications
      : notifications.filter((n) => n.status === activeNotifTab);

  const typeIcon = (type: string) => {
    switch (type) {
      case "password_reset":
        return <RefreshCw className="w-4 h-4" />;
      case "void_order":
        return <XCircle className="w-4 h-4" />;
      case "low_stock":
        return <AlertTriangle className="w-4 h-4" />;
      case "new_order":
        return <ShoppingBag className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "password_reset":
        return "bg-blue-50 text-blue-500";
      case "void_order":
        return "bg-red-50 text-red-500";
      case "low_stock":
        return "bg-orange-50 text-orange-500";
      case "new_order":
        return "bg-green-50 text-green-500";
      default:
        return "bg-gray-50 text-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveNotifTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              activeNotifTab === tab
                ? "bg-accent-orange text-white shadow-float"
                : "bg-white text-muted-foreground hover:bg-[#e0e0e0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((notif) => (
          <div key={notif.id} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${typeColor(notif.type)} flex items-center justify-center shrink-0`}
              >
                {typeIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">
                    {(notif.payload as { title?: string }).title || notif.type}
                  </h4>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      notif.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : notif.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {notif.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(notif.payload as { message?: string }).message || ""}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notif.created_at).toLocaleString("en-PH")}
                </p>
              </div>
              {notif.status === "pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onApprove(notif.id)}
                    className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => onReject(notif.id)}
                    className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Cashier Management Tab ───
function CashierManagementTab({ cashiers }: { cashiers: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-semibold text-xl text-[#2c2c2c]">
            Cashier Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            View cashiers for your restaurant
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f5f5f5]">
            <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
              <th className="px-4 py-3">Cashier</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {cashiers.map((cashier) => (
              <tr key={cashier.id} className="hover:bg-[#f5f5f5]/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-accent-orange" />
                    </div>
                    <span className="font-medium">{cashier.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {cashier.email}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    Active
                  </span>
                </td>
              </tr>
            ))}
            {cashiers.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No cashiers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DashboardPage;
