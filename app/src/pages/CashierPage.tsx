import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Minus,
  Trash2,
  Send,
  ChevronLeft,
  Search,
  ShoppingCart,
  CreditCard,
  Banknote,
  Wallet,
  Check,
  X,
  ChefHat,
  Camera,
  Printer,
  ReceiptText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/stores/useStore";
import {
  getTenant,
  getProducts,
  getCategories,
  getProductVariants,
  getIngredients,
} from "@/lib/supabaseDb";
import { createOrderWithInventory } from "@/lib/atomicOrders";
import type { Product, Category, ProductVariant, PaymentMethod } from "@/types";
import { Receipt } from "@/components/Receipt";
import { useToast } from "@/components/ui/toast";
import gsap from "gsap";

// ─── Step type ────────────────────────────────────────────────────────────────
type CheckoutStep =
  | "catalog"
  | "payment"
  | "cash-input"
  | "digital-payment"
  | "order-complete"
  | "receipt";

// ─── Component ────────────────────────────────────────────────────────────────
export function CashierPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const {
    currentTenant,
    setCurrentTenant,
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    getCartTotal,
    getCartCount,
  } = useStore();

  // ── Data state ──
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // ── Checkout / payment state ──
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("catalog");
  const [orderNumber, setOrderNumber] = useState("");
  const [receiptConfig, setReceiptConfig] = useState(
    currentTenant?.receipt_config || null,
  );

  // ── New: payment input state ──
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [amountError, setAmountError] = useState<string>("");
  const [isExactPayment, setIsExactPayment] = useState<boolean>(true);
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [orderCreating, setOrderCreating] = useState<boolean>(false);

  // ── UI state ──
  const [lowStockAlert, setLowStockAlert] = useState<string[]>([]);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);

  const cartItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // ── Redirect non-cashier ──
  useEffect(() => {
    if (currentUser && currentUser.role !== "cashier") {
      navigate(currentUser.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [currentUser, navigate]);

  // ── Load data (single effect, no checkoutStep dependency) ──
  useEffect(() => {
    if (currentUser?.tenant_id) {
      getTenant(currentUser.tenant_id).then((t) => {
        if (t) setCurrentTenant(t);
      });
      Promise.all([
        getProducts(currentUser.tenant_id),
        getCategories(currentUser.tenant_id),
        getIngredients(currentUser.tenant_id),
      ]).then(([p, c, i]) => {
        setProducts(p);
        setCategories(c);
        setIngredients(i);
        const low = i
          .filter((ing: any) => ing.stock_qty <= ing.low_stock_threshold)
          .map((ing: any) => ing.name);
        setLowStockAlert(low);
      });
    }
  }, [currentUser, setCurrentTenant]);

  // ── Sync receipt config when tenant loads ──
  useEffect(() => {
    if (currentTenant) setReceiptConfig(currentTenant.receipt_config);
  }, [currentTenant]);

  // ── Auto-focus amount input when stepping into payment screens ──
  useEffect(() => {
    if (
      (checkoutStep === "cash-input" ||
        (checkoutStep === "digital-payment" && !isExactPayment)) &&
      amountInputRef.current
    ) {
      setTimeout(() => amountInputRef.current?.focus(), 100);
    }
  }, [checkoutStep, isExactPayment]);

  // ── Derived values ──
  const total = getCartTotal();
  const serviceCharge = total * 0;
  const grandTotal = total + serviceCharge;
  const cartCount = getCartCount();

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      activeCategory === "all" || p.category_id === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Live change calculation (reactive to input)
  const liveChange = useMemo(() => {
    const received = parseFloat(amountReceived);
    if (isNaN(received) || received < grandTotal) return null;
    return received - grandTotal;
  }, [amountReceived, grandTotal]);

  // ── Availability helpers ──
  function getProductAvailability(product: Product, ings: any[]) {
    if (!product.recipe || product.recipe.length === 0) return true;
    return product.recipe.every((req) => {
      const ing = ings.find((i) => i.id === req.ingredient_id);
      return ing && ing.stock_qty >= req.qty_required;
    });
  }

  function canAddToCart(product: Product, ings: any[], qty = 1) {
    if (!product.recipe) return true;
    return product.recipe.every((req) => {
      const ing = ings.find((i) => i.id === req.ingredient_id);
      return ing && ing.stock_qty >= req.qty_required * qty;
    });
  }

  const availabilityMap = useMemo(
    () =>
      new Map(
        products.map((p) => [p.id, getProductAvailability(p, ingredients)]),
      ),
    [products, ingredients],
  );

  // ── Product click ──
  const handleProductClick = async (product: Product) => {
    if (!canAddToCart(product, ingredients, 1)) {
      console.log("❌ Cannot add product to cart:", product.name);
      showToast("Cannot add product to cart", "warning");
      return;
    }

    if (!product.has_variants) {
      addToCart({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        image_url: product.image_url,
        qty: 1,
      });
      const key = `${product.id}-undefined`;
      if (cartItemRefs.current[key]) {
        gsap.from(cartItemRefs.current[key], {
          x: 50,
          opacity: 0,
          duration: 0.3,
        });
      }
      return;
    }

    setSelectedProduct(product);
    const vars = await getProductVariants(product.id);
    setVariants(vars);
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(1.5)" },
      );
    }
  };

  const handleAddVariant = (variant: ProductVariant) => {
    if (!selectedProduct) return;
    addToCart({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      variant_id: variant.id,
      variant_name: variant.name,
      price: variant.price,
      image_url: selectedProduct.image_url,
      qty: 1,
    });
    setSelectedProduct(null);
    setVariants([]);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PAYMENT FLOW
  // ─────────────────────────────────────────────────────────────────────────────

  /** Single, unified order-creation function — eliminates the double-call bug */
  const submitOrder = async (_received: number, change: number) => {
    if (!currentUser) return;
    setOrderCreating(true);
    try {
      const orderItems = cart.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        variant_name: item.variant_name,
        qty: item.qty,
        unit_price: item.price,
        order_id: "",
      }));

      const order = await createOrderWithInventory(
        {
          tenant_id: currentUser.tenant_id,
          cashier_id: currentUser.id,
          status: "completed",
          payment_method: paymentMethod,
          total: grandTotal,
        },
        orderItems,
        products,
        ingredients,
      );

      // Refresh stock levels
      const [updatedProducts, updatedIngredients] = await Promise.all([
        getProducts(currentUser.tenant_id),
        getIngredients(currentUser.tenant_id),
      ]);
      setProducts(updatedProducts);
      setIngredients(updatedIngredients);

      // Refresh low-stock alerts after order
      const low = updatedIngredients
        .filter((i: any) => i.stock_qty <= i.low_stock_threshold)
        .map((i: any) => i.name);
      setLowStockAlert(low);

      setOrderNumber(order.id.split("-")[1] || order.id);
      setChangeAmount(change);
      setShowSuccessFlash(true);
      setTimeout(() => setShowSuccessFlash(false), 600);
      setCheckoutStep("order-complete");
    } catch (error) {
      showToast(
        `Order failed: ${error instanceof Error ? error.message : "Please try again."}`,
        "error",
      );
    } finally {
      setOrderCreating(false);
    }
  };

  /** Routes to the correct payment input screen — no dialog boxes */
  const handleGoToPaymentInput = () => {
    setAmountReceived("");
    setAmountError("");
    setIsExactPayment(true);
    if (paymentMethod === "cash") {
      setCheckoutStep("cash-input");
    } else {
      setCheckoutStep("digital-payment");
    }
  };

  /** Cash: validate input then create order */
  const handleCashConfirm = () => {
    const received = parseFloat(amountReceived);
    if (isNaN(received) || received <= 0) {
      setAmountError("Please enter a valid amount.");
      return;
    }
    if (received < grandTotal) {
      setAmountError(
        `Amount is short by ₱${(grandTotal - received).toFixed(2)}`,
      );
      return;
    }
    setAmountError("");
    submitOrder(received, received - grandTotal);
  };

  /** GCash / Maya: validate then create order */
  const handleDigitalConfirm = () => {
    if (isExactPayment) {
      submitOrder(grandTotal, 0);
    } else {
      const received = parseFloat(amountReceived);
      if (isNaN(received) || received <= 0) {
        setAmountError("Please enter a valid amount.");
        return;
      }
      if (received < grandTotal) {
        setAmountError(
          `Amount is short by ₱${(grandTotal - received).toFixed(2)}`,
        );
        return;
      }
      setAmountError("");
      submitOrder(received, received - grandTotal);
    }
  };

  const handleViewReceipt = () => setCheckoutStep("receipt");

  const handlePrintReceipt = () => {
    window.print();
    handleNewOrder();
  };

  const handleNewOrder = () => {
    clearCart();
    setCheckoutStep("catalog");
    setPaymentMethod("cash");
    setOrderNumber("");
    setAmountReceived("");
    setChangeAmount(0);
    setAmountError("");
    setIsExactPayment(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING GUARD
  // ─────────────────────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f5f5f5" }}
      >
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-[#e0e0e0] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="h-screen flex overflow-hidden max-w-full"
      style={{ background: "#f5f5f5" }}
    >
      {/* Toast Container */}
      <ToastContainer />

      {/* ── Success flash overlay ── */}
      {showSuccessFlash && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ background: "rgba(0, 194, 159, 0.1)" }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CATALOG                                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {checkoutStep === "catalog" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="h-16 bg-white border-b border-[#e0e0e0] flex items-center px-2 sm:px-4 gap-2 sm:gap-4 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent-orange flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-bold text-sm sm:text-lg text-[#2c2c2c] truncate">
                {currentTenant?.name || "Cashier"}
              </h1>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                {currentUser.full_name}
              </p>
            </div>
            {/* Cart Toggle - Mobile */}
            <button
              onClick={() => setShowCartModal(true)}
              className="lg:hidden relative w-8 h-8 rounded-full bg-accent-orange flex items-center justify-center shrink-0 hover:bg-accent-hover transition-colors"
            >
              <ShoppingCart className="w-4 h-4 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger-red text-white text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
            <div className="relative w-24 sm:w-48 shrink-0">
              <Search className="w-3 h-3 sm:w-4 sm:h-4 absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-7 sm:pl-9 h-8 sm:h-9 rounded-full border-[#e0e0e0] text-xs sm:text-sm"
              />
            </div>
            {lowStockAlert.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-2 py-1 items-center gap-1 shrink-0 hidden sm:flex">
                <span className="text-xs text-red-600 font-medium truncate max-w-[200px]">
                  ⚠ Low stock: {lowStockAlert.join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Category Filters */}
          <div className="bg-white px-2 sm:px-4 py-2 sm:py-3 border-b border-[#e0e0e0] flex gap-1 sm:gap-2 overflow-x-auto shrink-0 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === "all"
                  ? "bg-accent-orange text-white shadow-float"
                  : "bg-[#f5f5f5] text-[#5a5a5a] hover:bg-[#e0e0e0]"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-accent-orange text-white shadow-float"
                    : "bg-[#f5f5f5] text-[#5a5a5a] hover:bg-[#e0e0e0]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-auto p-2 sm:p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((c) => c.product_id === product.id);
                const available = availabilityMap.get(product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (!available) return;
                      handleProductClick(product);
                    }}
                    disabled={!available}
                    className={`bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.03] transition-all duration-200 text-left group ${
                      inCart
                        ? "ring-2 sm:ring-4 ring-[#ff9e2c] bg-orange-50/50"
                        : ""
                    } ${!available ? "opacity-60 cursor-not-allowed hover:scale-100 hover:shadow-sm" : ""}`}
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
                          <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-[#e0e0e0]" />
                        </div>
                      )}
                      {!available && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-bold uppercase tracking-wide">
                            No Stock
                          </span>
                        </div>
                      )}
                      {inCart && (
                        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-accent-orange text-white flex items-center justify-center text-xs font-bold shadow-md">
                          {inCart.qty}
                        </div>
                      )}
                    </div>
                    <div className="p-2 sm:p-3">
                      <h3 className="font-heading font-semibold text-[#2c2c2c] text-xs sm:text-sm truncate">
                        {product.name}
                      </h3>
                      <p className="text-accent-orange font-mono font-semibold text-xs sm:text-sm mt-0.5">
                        ₱{product.price.toFixed(2)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SELECT PAYMENT METHOD                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {checkoutStep === "payment" && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative">
          <button
            onClick={() => setCheckoutStep("catalog")}
            className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-[#2c2c2c] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to order
          </button>

          <h2 className="text-3xl font-heading font-bold text-[#2c2c2c] mb-2">
            Payment
          </h2>
          <p className="text-muted-foreground mb-8">Select payment method</p>

          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-5xl font-heading font-bold text-[#2c2c2c]">
              ₱{grandTotal.toFixed(2)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-8">
            {[
              { method: "cash" as const, icon: Banknote, label: "Cash" },
              { method: "gcash" as const, icon: Wallet, label: "GCash" },
              { method: "maya" as const, icon: CreditCard, label: "Maya" },
            ].map(({ method, icon: Icon, label }) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                  paymentMethod === method
                    ? "border-[#ff9e2c] bg-orange-50 shadow-float"
                    : "border-[#e0e0e0] bg-white hover:border-[#d0d0d0]"
                }`}
              >
                <Icon
                  className={`w-8 h-8 ${paymentMethod === method ? "text-[#ff9e2c]" : "text-muted-foreground"}`}
                />
                <span
                  className={`font-medium ${paymentMethod === method ? "text-[#ff9e2c]" : "text-[#2c2c2c]"}`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

          <Button
            onClick={handleGoToPaymentInput}
            className="w-full max-w-md h-14 rounded-full bg-accent-orange hover:bg-accent-hover text-white text-xl font-heading font-semibold shadow-float active:scale-[0.98] transition-transform"
          >
            <Send className="w-5 h-5 mr-2" />
            Continue
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CASH INPUT                                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {checkoutStep === "cash-input" && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative">
          <button
            onClick={() => setCheckoutStep("payment")}
            className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-[#2c2c2c] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-accent-orange/10 flex items-center justify-center mx-auto mb-4">
                <Banknote className="w-7 h-7 text-accent-orange" />
              </div>
              <h2 className="text-3xl font-heading font-bold text-[#2c2c2c] mb-1">
                Cash Payment
              </h2>
              <p className="text-muted-foreground text-sm">
                Enter the amount received from the customer
              </p>
            </div>

            {/* Total */}
            <div className="bg-[#f5f5f5] rounded-2xl p-4 flex justify-between items-center mb-6">
              <span className="text-muted-foreground font-medium">
                Total Due
              </span>
              <span className="text-2xl font-heading font-bold text-[#2c2c2c]">
                ₱{grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#2c2c2c] mb-2">
                Amount Received (₱)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                  ₱
                </span>
                <Input
                  ref={amountInputRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => {
                    setAmountReceived(e.target.value);
                    setAmountError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleCashConfirm()}
                  placeholder="0.00"
                  className="pl-9 h-16 text-2xl font-mono font-bold text-center rounded-2xl border-2 border-[#e0e0e0] focus:border-accent-orange"
                />
              </div>
              {amountError && (
                <p className="text-danger-red text-sm mt-2 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  {amountError}
                </p>
              )}
            </div>

            {/* Live Change Display */}
            <div
              className={`rounded-2xl p-4 mb-6 flex justify-between items-center transition-all duration-200 ${
                liveChange !== null
                  ? "bg-green-50 border-2 border-green-200"
                  : "bg-[#f5f5f5] border-2 border-transparent"
              }`}
            >
              <span className="font-medium text-muted-foreground">Change</span>
              <span
                className={`text-2xl font-heading font-bold ${
                  liveChange !== null ? "text-success-green" : "text-[#e0e0e0]"
                }`}
              >
                ₱{liveChange !== null ? liveChange.toFixed(2) : "—"}
              </span>
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handleCashConfirm}
              disabled={orderCreating || !amountReceived}
              className="w-full h-14 rounded-full bg-accent-orange hover:bg-accent-hover text-white text-lg font-heading font-semibold shadow-float active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {orderCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DIGITAL PAYMENT (GCash / Maya)                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {checkoutStep === "digital-payment" && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-auto">
          <button
            onClick={() => setCheckoutStep("payment")}
            className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-[#2c2c2c] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="w-full max-w-md py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-accent-orange/10 flex items-center justify-center mx-auto mb-4">
                {paymentMethod === "gcash" ? (
                  <Wallet className="w-7 h-7 text-accent-orange" />
                ) : (
                  <CreditCard className="w-7 h-7 text-accent-orange" />
                )}
              </div>
              <h2 className="text-3xl font-heading font-bold text-[#2c2c2c] mb-1">
                {paymentMethod === "gcash" ? "GCash" : "Maya"} Payment
              </h2>
              <p className="text-muted-foreground text-sm">
                Confirm payment details below
              </p>
            </div>

            {/* Total */}
            <div className="bg-[#f5f5f5] rounded-2xl p-4 flex justify-between items-center mb-6">
              <span className="text-muted-foreground font-medium">
                Total Due
              </span>
              <span className="text-2xl font-heading font-bold text-[#2c2c2c]">
                ₱{grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Exact toggle */}
            <div className="mb-6">
              <p className="text-sm font-medium text-[#2c2c2c] mb-3">
                Is the payment exact?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setIsExactPayment(true);
                    setAmountReceived("");
                    setAmountError("");
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    isExactPayment
                      ? "border-[#ff9e2c] bg-orange-50"
                      : "border-[#e0e0e0] bg-white hover:border-[#d0d0d0]"
                  }`}
                >
                  <Check
                    className={`w-6 h-6 ${isExactPayment ? "text-accent-orange" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`font-medium text-sm ${isExactPayment ? "text-accent-orange" : "text-[#2c2c2c]"}`}
                  >
                    Yes, Exact
                  </span>
                </button>
                <button
                  onClick={() => {
                    setIsExactPayment(false);
                    setAmountError("");
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    !isExactPayment
                      ? "border-[#ff9e2c] bg-orange-50"
                      : "border-[#e0e0e0] bg-white hover:border-[#d0d0d0]"
                  }`}
                >
                  <Banknote
                    className={`w-6 h-6 ${!isExactPayment ? "text-accent-orange" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`font-medium text-sm ${!isExactPayment ? "text-accent-orange" : "text-[#2c2c2c]"}`}
                  >
                    No, Enter Amount
                  </span>
                </button>
              </div>
            </div>

            {/* Amount input if not exact */}
            {!isExactPayment && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#2c2c2c] mb-2">
                  Amount Received (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                    ₱
                  </span>
                  <Input
                    ref={amountInputRef}
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => {
                      setAmountReceived(e.target.value);
                      setAmountError("");
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleDigitalConfirm()
                    }
                    placeholder="0.00"
                    className="pl-9 h-16 text-2xl font-mono font-bold text-center rounded-2xl border-2 border-[#e0e0e0] focus:border-accent-orange"
                  />
                </div>
                {amountError && (
                  <p className="text-danger-red text-sm mt-2 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" />
                    {amountError}
                  </p>
                )}

                {/* Live Change */}
                <div
                  className={`rounded-2xl p-4 mt-3 flex justify-between items-center transition-all duration-200 ${
                    liveChange !== null
                      ? "bg-green-50 border-2 border-green-200"
                      : "bg-[#f5f5f5] border-2 border-transparent"
                  }`}
                >
                  <span className="font-medium text-muted-foreground">
                    Change
                  </span>
                  <span
                    className={`text-2xl font-heading font-bold ${
                      liveChange !== null
                        ? "text-success-green"
                        : "text-[#e0e0e0]"
                    }`}
                  >
                    ₱{liveChange !== null ? liveChange.toFixed(2) : "—"}
                  </span>
                </div>
              </div>
            )}

            {/* Reminder banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3 items-start">
              <Camera className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-700 text-sm leading-relaxed">
                <span className="font-semibold">Reminder:</span> Verify payment
                and take a screenshot/photo of the{" "}
                {paymentMethod === "gcash" ? "GCash" : "Maya"} transaction
                receipt before proceeding.
              </p>
            </div>

            {/* Confirm */}
            <Button
              onClick={handleDigitalConfirm}
              disabled={orderCreating || (!isExactPayment && !amountReceived)}
              className="w-full h-14 rounded-full bg-accent-orange hover:bg-accent-hover text-white text-lg font-heading font-semibold shadow-float active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {orderCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ORDER COMPLETE                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {checkoutStep === "order-complete" && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-sm">
            {/* Success icon */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-full bg-success-green flex items-center justify-center mb-4 shadow-float-green">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-heading font-bold text-[#2c2c2c] mb-1">
                Payment Complete!
              </h2>
              <p className="text-muted-foreground">Order #{orderNumber}</p>
            </div>

            {/* Summary card */}
            <div className="bg-[#f5f5f5] rounded-2xl p-5 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">
                  Payment Method
                </span>
                <span className="font-medium text-sm capitalize">
                  {paymentMethod === "gcash"
                    ? "GCash"
                    : paymentMethod === "maya"
                      ? "Maya"
                      : "Cash"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">
                  Total Paid
                </span>
                <span className="font-mono font-semibold">
                  ₱{grandTotal.toFixed(2)}
                </span>
              </div>
              {changeAmount > 0 && (
                <>
                  <div className="h-px bg-[#e0e0e0]" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Change</span>
                    <span className="font-heading font-bold text-2xl text-success-green">
                      ₱{changeAmount.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              {/* Digital payment reminder */}
              {(paymentMethod === "gcash" || paymentMethod === "maya") && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-1 flex gap-2 items-start">
                  <Camera className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-700 text-xs leading-relaxed">
                    Remember to verify the{" "}
                    {paymentMethod === "gcash" ? "GCash" : "Maya"} transaction
                    screenshot/photo.
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleNewOrder}
                className="w-full h-12 rounded-full bg-accent-orange hover:bg-accent-hover text-white font-heading font-semibold shadow-float"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Proceed — No Receipt
              </Button>

              <Button
                onClick={handleViewReceipt}
                variant="outline"
                className="w-full h-12 rounded-full border-2 border-[#e0e0e0] bg-white text-[#2c2c2c] font-heading font-semibold hover:border-[#d0d0d0]"
              >
                <ReceiptText className="w-4 h-4 mr-2" />
                View Receipt
              </Button>

              {currentTenant?.receipt_printing_enabled && (
                <Button
                  onClick={handlePrintReceipt}
                  variant="outline"
                  className="w-full h-12 rounded-full border-2 border-[#e0e0e0] bg-white text-[#2c2c2c] font-heading font-semibold hover:border-[#d0d0d0]"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* RECEIPT VIEW                                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {checkoutStep === "receipt" && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-auto">
          <h2 className="text-2xl font-heading font-bold text-[#2c2c2c] mb-6">
            Receipt — Order #{orderNumber}
          </h2>

          {receiptConfig && (
            <div className="mb-6">
              <Receipt
                orderNumber={orderNumber}
                date={new Date().toLocaleString("en-PH")}
                cashierName={currentUser.full_name}
                items={cart}
                paymentMethod={paymentMethod}
                receiptConfig={receiptConfig}
              />
            </div>
          )}

          <div className="flex gap-3">
            {currentTenant?.receipt_printing_enabled && (
              <Button
                onClick={handlePrintReceipt}
                className="h-12 rounded-full bg-accent-orange hover:bg-accent-hover text-white px-6 font-heading font-semibold"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            )}
            <Button
              onClick={handleNewOrder}
              variant="outline"
              className="h-12 rounded-full border-2 border-[#e0e0e0] bg-white text-[#2c2c2c] px-6 font-heading font-semibold hover:border-[#d0d0d0]"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CART SIDEBAR (desktop)                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {checkoutStep === "catalog" && (
        <div className="hidden lg:flex w-[360px] bg-white border-l border-[#e0e0e0] flex-col shrink-0 shadow-lg">
          {/* Header */}
          <div className="p-4 border-b border-[#e0e0e0]">
            <h2 className="font-heading font-bold text-xl text-[#2c2c2c]">
              Current Order
            </h2>
            <p className="text-sm text-muted-foreground">{cartCount} items</p>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="w-16 h-16 text-[#e0e0e0] mb-3" />
                <p className="text-muted-foreground font-heading">
                  Your cart is empty
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tap a product to add it
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.product_id}-${item.variant_id || ""}`}
                  ref={(el) => {
                    cartItemRefs.current[
                      `${item.product_id}-${item.variant_id || ""}`
                    ] = el;
                  }}
                  className="flex items-center gap-3 bg-[#f5f5f5] rounded-xl p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#2c2c2c] truncate">
                      {item.product_name}
                    </p>
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground">
                        {item.variant_name}
                      </p>
                    )}
                    <p className="text-xs text-accent-orange font-mono mt-0.5">
                      ₱{item.price.toFixed(2)} × {item.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        updateQty(
                          item.product_id,
                          item.qty - 1,
                          item.variant_id,
                        )
                      }
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow transition-shadow"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono text-sm font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() =>
                        updateQty(
                          item.product_id,
                          item.qty + 1,
                          item.variant_id,
                        )
                      }
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow transition-shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        removeFromCart(item.product_id, item.variant_id)
                      }
                      className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center ml-1 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-danger-red" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-[#e0e0e0] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">₱{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Charge</span>
                <span className="font-mono">₱{serviceCharge.toFixed(2)}</span>
              </div>
              <div className="receipt-line" />
              <div className="flex justify-between">
                <span className="font-heading font-bold text-lg">Total</span>
                <span className="font-heading font-bold text-2xl text-accent-orange">
                  ₱{grandTotal.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={() => setCheckoutStep("payment")}
                className="w-full h-14 rounded-full bg-accent-orange hover:bg-accent-hover text-white text-lg font-heading font-semibold shadow-float active:scale-[0.98] transition-transform mt-2"
              >
                <Send className="w-5 h-5 mr-2" />
                Checkout
              </Button>
              <button
                onClick={clearCart}
                className="w-full text-center text-xs text-muted-foreground hover:text-danger-red py-1 transition-colors"
              >
                Clear cart
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VARIANT SELECTION MODAL                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedProduct && variants.length > 0 && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: "rgba(0, 0, 0, 0.4)" }}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-xl">
                {selectedProduct.name}
              </h3>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setVariants([]);
                }}
                className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedProduct.image_url && (
              <img
                src={selectedProduct.image_url}
                alt=""
                className="w-full h-40 object-cover rounded-2xl mb-4"
              />
            )}
            <p className="text-muted-foreground text-sm mb-4">
              {selectedProduct.description}
            </p>
            <p className="text-sm font-medium mb-3">Select a variant:</p>
            <div className="space-y-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleAddVariant(v)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#f5f5f5] hover:bg-orange-50 hover:border-[#ff9e2c] border-2 border-transparent transition-all"
                >
                  <span className="font-medium">{v.name}</span>
                  <span className="font-mono text-accent-orange font-semibold">
                    ₱{v.price.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* FLOATING CART BUTTON (mobile)                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {checkoutStep === "catalog" && cart.length > 0 && (
        <button
          onClick={() => setShowCartModal(true)}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent-orange text-white flex items-center justify-center shadow-float hover:bg-accent-hover transition-all z-40"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-danger-red text-white text-xs flex items-center justify-center font-bold">
            {cartCount}
          </span>
        </button>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CART MODAL (mobile)                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showCartModal && checkoutStep === "catalog" && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:hidden"
          style={{ background: "rgba(0, 0, 0, 0.4)" }}
          onClick={() => setShowCartModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#e0e0e0] flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-xl text-[#2c2c2c]">
                  Current Order
                </h2>
                <p className="text-sm text-muted-foreground">
                  {cartCount} items
                </p>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <ShoppingCart className="w-16 h-16 text-[#e0e0e0] mb-3" />
                  <p className="text-muted-foreground font-heading">
                    Your cart is empty
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tap a product to add it
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.product_id}-${item.variant_id || ""}`}
                    className="flex items-center gap-3 bg-[#f5f5f5] rounded-xl p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#2c2c2c] truncate">
                        {item.product_name}
                      </p>
                      {item.variant_name && (
                        <p className="text-xs text-muted-foreground">
                          {item.variant_name}
                        </p>
                      )}
                      <p className="text-xs text-accent-orange font-mono mt-0.5">
                        ₱{item.price.toFixed(2)} × {item.qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          updateQty(
                            item.product_id,
                            item.qty - 1,
                            item.variant_id,
                          )
                        }
                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow transition-shadow"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-mono text-sm font-medium">
                        {item.qty}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(
                            item.product_id,
                            item.qty + 1,
                            item.variant_id,
                          )
                        }
                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow transition-shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          removeFromCart(item.product_id, item.variant_id)
                        }
                        className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center ml-1 hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-danger-red" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-[#e0e0e0] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">₱{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Charge</span>
                  <span className="font-mono">₱{serviceCharge.toFixed(2)}</span>
                </div>
                <div className="receipt-line" />
                <div className="flex justify-between">
                  <span className="font-heading font-bold text-lg">Total</span>
                  <span className="font-heading font-bold text-2xl text-accent-orange">
                    ₱{grandTotal.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    setShowCartModal(false);
                    setCheckoutStep("payment");
                  }}
                  className="w-full h-14 rounded-full bg-accent-orange hover:bg-accent-hover text-white text-lg font-heading font-semibold shadow-float active:scale-[0.98] transition-transform mt-2"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Checkout
                </Button>
                <button
                  onClick={clearCart}
                  className="w-full text-center text-xs text-muted-foreground hover:text-danger-red py-1 transition-colors"
                >
                  Clear cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
