import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  LayoutGrid,
  Package,
  ChefHat,
  Store,
  Receipt,
  Users,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ImageIcon,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Check,
  Pencil,
  Building2,
  Database,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/stores/useStore";
import {
  getTenants,
  createTenant,
  deleteTenant,
  resetAllData,
  getTenant,
  getCategories,
  getProducts,
  getIngredients,
  getBranches,
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  createIngredient,
  deleteIngredient,
  createBranch,
  updateBranch,
  getProductVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  updateTenant,
} from "@/lib/mockDb";
import type {
  Category,
  Product,
  Ingredient,
  Branch,
  ProductVariant,
  ReceiptConfig,
} from "@/types";
import { CashierManagement } from "./CashierManagement";
import gsap from "gsap";

export function AdminPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { currentTenant, setCurrentTenant } = useStore();
  const [activeTab, setActiveTab] = useState("products");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect non-admin
  useEffect(() => {
    if (
      currentUser &&
      currentUser.role !== "admin" &&
      currentUser.role !== "owner"
    ) {
      navigate("/cashier");
    }
  }, [currentUser, navigate]);
  // Load tenant data
  useEffect(() => {
    if (currentUser?.tenant_id) {
      getTenant(currentUser.tenant_id).then((t) => {
        if (t) setCurrentTenant(t);
      });
    }
  }, [currentUser, setCurrentTenant]);

  const tabs = [
    { id: "products", icon: Package, label: "Products" },
    { id: "categories", icon: LayoutGrid, label: "Categories" },
    { id: "ingredients", icon: ChefHat, label: "Ingredients" },
    { id: "branches", icon: Store, label: "Branches" },
    { id: "cashiers", icon: Users, label: "Cashiers" },
    { id: "receipt", icon: Receipt, label: "Receipt" },
    ...(currentUser?.role === "super_admin"
      ? [{ id: "tenants", icon: Building2, label: "Tenants" } as const]
      : []),
    ...(currentUser?.role === "super_admin"
      ? [{ id: "system", icon: Database, label: "System" } as const]
      : []),
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#f5f5f5" }}>
      <aside
        className={`${sidebarCollapsed ? "w-16" : "w-56"} bg-white border-r border-[#e0e0e0] flex flex-col transition-all duration-400 shrink-0`}
        style={{ transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="h-16 flex items-center px-4 border-b border-[#e0e0e0] justify-between">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-xl bg-accent-orange flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="ml-3 font-heading font-bold text-lg text-[#2c2c2c] truncate">
                {currentTenant?.name || "Admin"}
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[#5a5a5a]" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-[#5a5a5a]" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-accent-orange text-white shadow-float"
                    : "text-muted-foreground hover:text-[#2c2c2c] hover:bg-[#f5f5f5]"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[#e0e0e0]">
          <button
            onClick={() => {
              logout();
              navigate("/login?role=admin");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-[#2c2c2c] hover:bg-[#f5f5f5] transition-all"
          >
            <ChevronLeft className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === "products" && (
          <AdminProducts tenantId={currentUser?.tenant_id || ""} />
        )}
        {activeTab === "categories" && (
          <AdminCategories tenantId={currentUser?.tenant_id || ""} />
        )}
        {activeTab === "ingredients" && (
          <AdminIngredients tenantId={currentUser?.tenant_id || ""} />
        )}
        {activeTab === "branches" && (
          <AdminBranches tenantId={currentUser?.tenant_id || ""} />
        )}
        {activeTab === "cashiers" && (
          <CashierManagement tenantId={currentUser?.tenant_id || ""} />
        )}
        {activeTab === "receipt" && (
          <AdminReceipt tenantId={currentUser?.tenant_id || ""} />
        )}
        {activeTab === "tenants" && currentUser?.role === "super_admin" && (
          <TenantManagement />
        )}
        {activeTab === "system" && currentUser?.role === "super_admin" && (
          <SystemManagement />
        )}
      </main>
    </div>
  );
}

// ─── Admin Products ───
function AdminProducts({ tenantId }: { tenantId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const panelRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    const [prods, cats] = await Promise.all([
      getProducts(tenantId),
      getCategories(tenantId),
    ]);
    setProducts(prods);
    setCategories(cats);
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Animate panel when editing state changes
  useEffect(() => {
    if (isEditing && panelRef.current) {
      gsap.to(panelRef.current, {
        x: 0,
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, [isEditing]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === null || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product);
    setIsEditing(true);
    setHasVariants(product.has_variants);
    const vars = await getProductVariants(product.id);
    setVariants(vars);
  };

  const handleClosePanel = () => {
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        x: 400,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      });
    }
    setTimeout(() => {
      setSelectedProduct(null);
      setIsEditing(false);
      setVariants([]);
    }, 300);
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    setSaveStatus("saving");

    let productId: string;
    if (selectedProduct.id === "") {
      // New product - create it first
      const newProduct = await createProduct({
        tenant_id: tenantId,
        name: selectedProduct.name,
        category_id: selectedProduct.category_id,
        price: selectedProduct.price,
        image_url: selectedProduct.image_url,
        has_variants: hasVariants,
        is_available: true,
        description: "",
      });
      productId = newProduct.id;
      setSelectedProduct(newProduct);
    } else {
      // Existing product - update it
      await updateProduct(selectedProduct.id, {
        ...selectedProduct,
        has_variants: hasVariants,
      });
      productId = selectedProduct.id;
    }

    // Save variants
    for (const v of variants) {
      if (v.id.startsWith("temp-")) {
        await createVariant({
          product_id: productId,
          name: v.name,
          price: v.price,
        });
      } else {
        await updateVariant(v.id, { name: v.name, price: v.price });
      }
    }
    setSaveStatus("saved");
    setTimeout(() => {
      setSaveStatus("idle");
      loadData();
    }, 800);
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: `temp-${Date.now()}`,
        product_id: selectedProduct?.id || "",
        name: "",
        price: 0,
        created_at: "",
      },
    ]);
  };

  const handleRemoveVariant = async (id: string) => {
    if (!id.startsWith("temp-")) {
      await deleteVariant(id);
    }
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    handleClosePanel();
    loadData();
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#2c2c2c] font-heading">
              Products
            </h1>
            <p className="text-sm text-muted-foreground">
              {products.length} items total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-9 h-10 w-64 rounded-full border-[#e0e0e0]"
              />
            </div>
            <Button
              onClick={() => {
                const newProduct: Product = {
                  id: "",
                  tenant_id: tenantId,
                  category_id: categories[0]?.id || "",
                  name: "New Product",
                  price: 0,
                  image_url: "",
                  is_available: true,
                  description: "",
                  has_variants: false,
                  created_at: "",
                };
                setSelectedProduct(newProduct);
                setIsEditing(true);
                setVariants([]);
                setHasVariants(false);
                if (panelRef.current) {
                  gsap.to(panelRef.current, {
                    x: 0,
                    opacity: 1,
                    duration: 0.4,
                    ease: "power2.out",
                  });
                }
              }}
              className="bg-accent-orange hover:bg-accent-hover text-white rounded-full shadow-float h-10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2 rounded-full text-sm font-medium shadow-float whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? "bg-accent-orange text-white"
                : "bg-white text-[#5a5a5a] hover:bg-[#e0e0e0]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-accent-orange text-white shadow-float"
                  : "bg-white text-[#5a5a5a] hover:bg-[#e0e0e0]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                <div className="aspect-square bg-[#f5f5f5] relative overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-[#e0e0e0]" />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(product.id);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-semibold text-[#2c2c2c] text-lg">
                    {product.name}
                  </h3>
                  <p className="text-accent-orange font-mono font-semibold mt-1">
                    P{product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${product.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {product.is_available ? "Available" : "Unavailable"}
                    </span>
                    {product.has_variants && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        Variants
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle className="w-16 h-16 text-[#e0e0e0] mb-4" />
            <h3 className="text-3xl font-heading font-bold text-[#e0e0e0]">
              No items found
            </h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search
            </p>
          </div>
        )}
      </div>

      {/* Right Panel */}
      {isEditing && selectedProduct && (
        <div
          ref={panelRef}
          className="w-[380px] bg-white border-l border-[#e0e0e0] flex flex-col shrink-0"
          style={{ transform: "translateX(400px)", opacity: 0 }}
        >
          <div className="flex items-center justify-between p-4 border-b border-[#e0e0e0]">
            <h2 className="font-heading font-semibold text-lg">
              {selectedProduct.id ? "Edit Product" : "New Product"}
            </h2>
            <button
              onClick={handleClosePanel}
              className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Image Upload */}
            <div className="relative">
              <div
                className="border-2 border-dashed border-[#e0e0e0] rounded-2xl h-40 flex flex-col items-center justify-center hover:border-[#ff9e2c] transition-colors cursor-pointer overflow-hidden"
                onClick={() =>
                  document.getElementById("product-image-input")?.click()
                }
              >
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-[#e0e0e0] mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Drop here or click to upload
                    </span>
                  </>
                )}
              </div>
              <input
                id="product-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setSelectedProduct({
                        ...selectedProduct,
                        image_url: reader.result as string,
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {selectedProduct.image_url && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("product-image-input")?.click();
                    }}
                    className="px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg text-xs font-medium hover:bg-white shadow-sm"
                  >
                    Replace
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct({ ...selectedProduct, image_url: "" });
                    }}
                    className="px-3 py-1.5 bg-red-500/90 backdrop-blur rounded-lg text-xs font-medium text-white hover:bg-red-600 shadow-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-[#2c2c2c] mb-1 block">
                Product Name
              </label>
              <Input
                value={selectedProduct.name}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    name: e.target.value,
                  })
                }
                className="h-11 rounded-xl border-[#e0e0e0] font-heading text-lg"
              />
            </div>

            {/* Price & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-[#2c2c2c] mb-1 block">
                  Price (P)
                </label>
                <Input
                  type="number"
                  value={selectedProduct.price}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      price: Number(e.target.value),
                    })
                  }
                  className="h-11 rounded-xl border-[#e0e0e0] font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2c2c2c] mb-1 block">
                  Category
                </label>
                <select
                  value={selectedProduct.category_id}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      category_id: e.target.value,
                    })
                  }
                  className="w-full h-11 rounded-xl border border-[#e0e0e0] px-3 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-[#2c2c2c] mb-1 block">
                Description
              </label>
              <textarea
                value={selectedProduct.description}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    description: e.target.value,
                  })
                }
                className="w-full h-24 rounded-xl border border-[#e0e0e0] p-3 text-sm resize-none"
              />
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Available for sale</span>
              <Switch
                checked={selectedProduct.is_available}
                onCheckedChange={(checked) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    is_available: checked,
                  })
                }
              />
            </div>

            {/* Variants Toggle */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Has variants</span>
              <Switch
                checked={hasVariants}
                onCheckedChange={(checked) => {
                  setHasVariants(checked);
                  if (!checked) setVariants([]);
                }}
              />
            </div>

            {/* Variant Builder */}
            {hasVariants && (
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div
                    key={v.id}
                    className="bg-[#f5f5f5] rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        value={v.name}
                        onChange={(e) => {
                          const newVars = [...variants];
                          newVars[i] = { ...v, name: e.target.value };
                          setVariants(newVars);
                        }}
                        placeholder="Variant name"
                        className="h-9 rounded-lg border-[#e0e0e0] text-sm flex-1"
                      />
                      <button
                        onClick={() => handleRemoveVariant(v.id)}
                        className="w-8 h-8 rounded-full bg-danger-red/10 flex items-center justify-center hover:bg-danger-red/20"
                      >
                        <X className="w-4 h-4 text-danger-red" />
                      </button>
                    </div>
                    <Input
                      type="number"
                      value={v.price}
                      onChange={(e) => {
                        const newVars = [...variants];
                        newVars[i] = { ...v, price: Number(e.target.value) };
                        setVariants(newVars);
                      }}
                      placeholder="Price"
                      className="h-9 rounded-lg border-[#e0e0e0] text-sm font-mono"
                    />
                  </div>
                ))}
                <button
                  onClick={handleAddVariant}
                  className="w-full py-2.5 border border-dashed border-[#ff9e2c] text-[#ff9e2c] rounded-xl text-sm font-medium hover:bg-orange-50 transition-colors"
                >
                  + Add Variant
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#e0e0e0] flex gap-3">
            <Button
              variant="outline"
              onClick={handleClosePanel}
              className="flex-1 rounded-full h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveStatus !== "idle"}
              className="flex-1 rounded-full h-11 bg-accent-orange hover:bg-accent-hover text-white shadow-float"
            >
              {saveStatus === "saving" && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              )}
              {saveStatus === "saved" && <Check className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tenant Management (Super Admin Only) ───
function TenantManagement() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantSlug, setNewTenantSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setIsLoading(true);
    const data = await getTenants();
    setTenants(data);
    setIsLoading(false);
  };

  const handleCreateTenant = async () => {
    if (!newTenantName || !newTenantSlug) return;

    await createTenant({
      name: newTenantName,
      slug: newTenantSlug,
      receipt_printing_enabled: true,
      receipt_config: {
        header_text: newTenantName,
        address: "",
        contact_number: "",
        footer_message: "Thank you!",
        paper_width: "80mm",
        show_cashier_name: true,
        show_branch_name: true,
      },
    });

    setNewTenantName("");
    setNewTenantSlug("");
    setShowCreateModal(false);
    loadTenants();
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (
      !confirm("Are you sure you want to delete this tenant and all its data?")
    )
      return;
    await deleteTenant(tenantId);
    loadTenants();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2c2c2c] font-heading">
            Tenant Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all tenant accounts
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-orange text-white rounded-xl font-medium hover:shadow-float transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Tenant</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e0e0e0] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading tenants...
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No tenants found. Create one to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#f5f5f5] border-b border-[#e0e0e0]">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#2c2c2c]">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#2c2c2c]">
                  Slug
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#2c2c2c]">
                  Created
                </th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-[#2c2c2c]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="border-b border-[#e0e0e0] last:border-0 hover:bg-[#f5f5f5]/50"
                >
                  <td className="px-6 py-4 font-medium text-[#2c2c2c]">
                    {tenant.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {tenant.slug}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteTenant(tenant.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#2c2c2c] font-heading mb-4">
              Create New Tenant
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2c2c2c] mb-1.5">
                  Tenant Name
                </label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="e.g., My Restaurant"
                  className="w-full px-4 py-2.5 border border-[#e0e0e0] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-orange/20 focus:border-accent-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c2c2c] mb-1.5">
                  Slug (URL identifier)
                </label>
                <input
                  type="text"
                  value={newTenantSlug}
                  onChange={(e) =>
                    setNewTenantSlug(
                      e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    )
                  }
                  placeholder="e.g., my-restaurant"
                  className="w-full px-4 py-2.5 border border-[#e0e0e0] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-orange/20 focus:border-accent-orange"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#e0e0e0] rounded-xl font-medium text-[#2c2c2c] hover:bg-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTenant}
                disabled={!newTenantName || !newTenantSlug}
                className="flex-1 px-4 py-2.5 bg-accent-orange text-white rounded-xl font-medium hover:shadow-float transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── System Management (Super Admin Only) ───
function SystemManagement() {
  const handleResetAllData = async () => {
    if (
      !confirm(
        "Are you sure you want to reset ALL data? This will delete all tenants, users, and data. This action cannot be undone.",
      )
    )
      return;
    await resetAllData();
    window.location.reload();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2c2c2c] font-heading">
          System
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          System-wide settings and operations
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e0e0e0] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#2c2c2c]">Reset All Data</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Delete all tenants, users, orders, and other data. This action
              cannot be undone.
            </p>
          </div>
          <button
            onClick={handleResetAllData}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Categories ───
function AdminCategories({ tenantId }: { tenantId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    setCategories(await getCategories(tenantId));
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!newCatName.trim()) return;
    await createCategory({
      tenant_id: tenantId,
      name: newCatName.trim(),
      sort_order: categories.length + 1,
    });
    setNewCatName("");
    load();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await updateCategory(id, { name: editName.trim() });
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await deleteCategory(id);
    load();
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#2c2c2c] font-heading mb-6">
        Categories
      </h1>

      <div className="flex gap-3 mb-6">
        <Input
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          placeholder="New category name..."
          className="h-11 rounded-xl border-[#e0e0e0]"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button
          onClick={handleAdd}
          className="bg-accent-orange hover:bg-accent-hover text-white rounded-full h-11 px-6 shadow-float"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm"
          >
            {editingId === cat.id ? (
              <div className="flex items-center gap-3 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9 rounded-lg border-[#e0e0e0] flex-1"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => handleUpdate(cat.id)}
                  className="bg-success-green text-white rounded-full h-8"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(null)}
                  className="rounded-full h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-6">
                    {cat.sort_order}
                  </span>
                  <span className="font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditName(cat.name);
                    }}
                    className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] flex items-center justify-center"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 text-danger-red" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Ingredients ───
function AdminIngredients({ tenantId }: { tenantId: string }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newIng, setNewIng] = useState({
    name: "",
    unit: "",
    stock_qty: 0,
    low_stock_threshold: 0,
    branch_id: "",
  });

  const load = useCallback(async () => {
    const [ings, brs] = await Promise.all([
      getIngredients(tenantId),
      getBranches(tenantId),
    ]);
    setIngredients(ings);
    setBranches(brs);
    if (brs.length > 0 && !newIng.branch_id)
      setNewIng((p) => ({ ...p, branch_id: brs[0].id }));
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!newIng.name.trim() || !newIng.branch_id) return;
    await createIngredient({
      tenant_id: tenantId,
      branch_id: newIng.branch_id,
      name: newIng.name.trim(),
      unit: newIng.unit || "pcs",
      stock_qty: Number(newIng.stock_qty),
      low_stock_threshold: Number(newIng.low_stock_threshold),
    });
    setNewIng({
      name: "",
      unit: "",
      stock_qty: 0,
      low_stock_threshold: 0,
      branch_id: branches[0]?.id || "",
    });
    setIsAdding(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ingredient?")) return;
    await deleteIngredient(id);
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2c2c2c] font-heading">
            Ingredients
          </h1>
          <p className="text-sm text-muted-foreground">
            {ingredients.length} items across all branches
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-accent-orange hover:bg-accent-hover text-white rounded-full shadow-float"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Ingredient
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Name"
              value={newIng.name}
              onChange={(e) => setNewIng({ ...newIng, name: e.target.value })}
              className="rounded-xl"
            />
            <Input
              placeholder="Unit (kg, pcs, L)"
              value={newIng.unit}
              onChange={(e) => setNewIng({ ...newIng, unit: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              type="number"
              placeholder="Stock qty"
              value={newIng.stock_qty}
              onChange={(e) =>
                setNewIng({ ...newIng, stock_qty: Number(e.target.value) })
              }
              className="rounded-xl"
            />
            <Input
              type="number"
              placeholder="Low stock threshold"
              value={newIng.low_stock_threshold}
              onChange={(e) =>
                setNewIng({
                  ...newIng,
                  low_stock_threshold: Number(e.target.value),
                })
              }
              className="rounded-xl"
            />
            <select
              value={newIng.branch_id}
              onChange={(e) =>
                setNewIng({ ...newIng, branch_id: e.target.value })
              }
              className="rounded-xl border border-[#e0e0e0] px-3 text-sm"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAdding(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-accent-orange text-white rounded-full shadow-float"
            >
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-[#f5f5f5]">
            <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Threshold</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {ingredients.map((ing) => {
              const branch = branches.find((b) => b.id === ing.branch_id);
              const isLow = ing.stock_qty <= ing.low_stock_threshold;
              return (
                <tr key={ing.id} className="hover:bg-[#f5f5f5]/50">
                  <td className="px-4 py-3 font-medium">{ing.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {branch?.name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {ing.stock_qty} {ing.unit}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                    {ing.low_stock_threshold}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${isLow ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
                    >
                      {isLow ? "Low" : "OK"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(ing.id)}
                      className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-danger-red" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Admin Branches ───
function AdminBranches({ tenantId }: { tenantId: string }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", address: "" });

  const load = useCallback(async () => {
    setBranches(await getBranches(tenantId));
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!newBranch.name.trim()) return;
    await createBranch({
      tenant_id: tenantId,
      name: newBranch.name.trim(),
      address: newBranch.address,
      manager_id: null,
      is_active: true,
    });
    setNewBranch({ name: "", address: "" });
    setIsAdding(false);
    load();
  };

  const toggleActive = async (branch: Branch) => {
    await updateBranch(branch.id, { is_active: !branch.is_active });
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2c2c2c] font-heading">
            Branches
          </h1>
          <p className="text-sm text-muted-foreground">
            {branches.filter((b) => b.is_active).length} active of{" "}
            {branches.length} total
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-accent-orange hover:bg-accent-hover text-white rounded-full shadow-float"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Branch
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <Input
            placeholder="Branch name"
            value={newBranch.name}
            onChange={(e) =>
              setNewBranch({ ...newBranch, name: e.target.value })
            }
            className="rounded-xl"
          />
          <Input
            placeholder="Address"
            value={newBranch.address}
            onChange={(e) =>
              setNewBranch({ ...newBranch, address: e.target.value })
            }
            className="rounded-xl"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAdding(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-accent-orange text-white rounded-full shadow-float"
            >
              Create Branch
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch) => (
          <div key={branch.id} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-heading font-semibold text-lg">
                  {branch.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {branch.address}
                </p>
              </div>
              <button onClick={() => toggleActive(branch)} className="shrink-0">
                {branch.is_active ? (
                  <ToggleRight className="w-8 h-8 text-success-green" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${branch.is_active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}
              >
                {branch.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Receipt Settings ───
function AdminReceipt({ tenantId }: { tenantId: string }) {
  const { currentTenant, setCurrentTenant } = useStore();
  const [config, setConfig] = useState<ReceiptConfig>({
    header_text: "",
    address: "",
    contact_number: "",
    footer_message: "",
    paper_width: "80mm",
    show_cashier_name: true,
    show_branch_name: true,
  });
  const [enabled, setEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  useEffect(() => {
    if (currentTenant) {
      setConfig(currentTenant.receipt_config as ReceiptConfig);
      setEnabled(currentTenant.receipt_printing_enabled);
    }
  }, [currentTenant]);

  // Show loading state if currentTenant is null
  if (!currentTenant) {
    return (
      <div className="p-6 max-w-xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading tenant data...</div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaveStatus("saving");
    await updateTenant(tenantId, {
      receipt_printing_enabled: enabled,
      receipt_config: config,
    });
    const updated = await getTenant(tenantId);
    if (updated) setCurrentTenant(updated);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold text-[#2c2c2c] font-heading mb-6">
        Receipt Settings
      </h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="font-medium">Enable Receipt Printing</span>
            <p className="text-xs text-muted-foreground">
              Show print button on cashier screen after order
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Header / Shop Name
                </label>
                <Input
                  value={config.header_text}
                  onChange={(e) =>
                    setConfig({ ...config, header_text: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Address
                </label>
                <Input
                  value={config.address}
                  onChange={(e) =>
                    setConfig({ ...config, address: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Contact Number
                </label>
                <Input
                  value={config.contact_number}
                  onChange={(e) =>
                    setConfig({ ...config, contact_number: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Footer Message
                </label>
                <Input
                  value={config.footer_message}
                  onChange={(e) =>
                    setConfig({ ...config, footer_message: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Paper Width
                </label>
                <div className="flex gap-3">
                  {(["80mm", "58mm"] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setConfig({ ...config, paper_width: w })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                        config.paper_width === w
                          ? "border-[#ff9e2c] bg-orange-50 text-[#ff9e2c]"
                          : "border-[#e0e0e0] text-muted-foreground hover:border-[#d0d0d0]"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Show cashier name on receipt</span>
                <Switch
                  checked={config.show_cashier_name}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, show_cashier_name: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show branch name on receipt</span>
                <Switch
                  checked={config.show_branch_name}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, show_branch_name: checked })
                  }
                />
              </div>
            </div>
          </>
        )}

        <Button
          onClick={handleSave}
          disabled={saveStatus !== "idle"}
          className="w-full rounded-full h-11 bg-accent-orange hover:bg-accent-hover text-white shadow-float"
        >
          {saveStatus === "saving" && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          )}
          {saveStatus === "saved" && <Check className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
