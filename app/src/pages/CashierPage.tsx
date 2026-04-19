import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Minus, Trash2, Send, ChevronLeft, Search, ShoppingCart,
  CreditCard, Banknote, Wallet, Check, X, ChefHat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/stores/useStore';
import {
  getProducts, getCategories, getProductVariants, getTenant,
  createOrder, getIngredients,
} from '@/lib/mockDb';
import type { Product, Category, ProductVariant, PaymentMethod } from '@/types';
import { Receipt } from '@/components/Receipt';
import gsap from 'gsap';

export function CashierPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const {
    currentTenant, setCurrentTenant, currentBranch,
    cart, addToCart, removeFromCart, updateQty, clearCart, getCartTotal, getCartCount,
  } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [checkoutStep, setCheckoutStep] = useState<'catalog' | 'payment' | 'success'>('catalog');
  const [orderNumber, setOrderNumber] = useState('');
  const [receiptConfig, setReceiptConfig] = useState(currentTenant?.receipt_config || null);
  const [lowStockAlert, setLowStockAlert] = useState<string[]>([]);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  const cartItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  // Redirect non-cashier
  useEffect(() => {
    if (currentUser && currentUser.role !== 'cashier') {
      navigate(currentUser.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [currentUser, navigate]);

  // Load data
  useEffect(() => {
    if (currentUser?.tenant_id) {
      getTenant(currentUser.tenant_id).then((t) => { if (t) setCurrentTenant(t); });
      Promise.all([getProducts(currentUser.tenant_id), getCategories(currentUser.tenant_id)])
        .then(([p, c]) => { setProducts(p); setCategories(c); });
    }
  }, [currentUser, setCurrentTenant]);

  // Check low stock
  useEffect(() => {
    if (currentUser?.tenant_id && currentBranch?.id) {
      getIngredients(currentUser.tenant_id, currentBranch.id).then((ings) => {
        const low = ings.filter((i) => i.stock_qty <= i.low_stock_threshold).map((i) => i.name);
        setLowStockAlert(low);
      });
    }
  }, [currentUser, currentBranch, checkoutStep]);

  // Update receipt config when tenant changes
  useEffect(() => {
    if (currentTenant) {
      setReceiptConfig(currentTenant.receipt_config);
    }
  }, [currentTenant]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category_id === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = async (product: Product) => {
    if (!product.has_variants) {
      addToCart({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        image_url: product.image_url,
        qty: 1,
      });
      // Animate cart item
      const key = `${product.id}-undefined`;
      if (cartItemRefs.current[key]) {
        gsap.from(cartItemRefs.current[key], { x: 50, opacity: 0, duration: 0.3 });
      }
      return;
    }
    setSelectedProduct(product);
    const vars = await getProductVariants(product.id);
    setVariants(vars);
    if (modalRef.current) {
      gsap.fromTo(modalRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.5)' });
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

  const handleSendOrder = async () => {
    if (!currentUser || !currentBranch) return;
    const total = getCartTotal();
    const orderItems = cart.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      qty: item.qty,
      unit_price: item.price,
      order_id: '',
    }));

    const order = await createOrder({
      tenant_id: currentUser.tenant_id,
      branch_id: currentBranch.id,
      cashier_id: currentUser.id,
      status: 'completed',
      payment_method: paymentMethod,
      total,
    }, orderItems);

    setOrderNumber(order.id.split('-')[1] || order.id);
    setShowSuccessFlash(true);
    setTimeout(() => setShowSuccessFlash(false), 600);

    setTimeout(() => {
      setCheckoutStep('success');
    }, 300);
  };

  const handleNewOrder = () => {
    clearCart();
    setCheckoutStep('catalog');
    setPaymentMethod('cash');
    setOrderNumber('');
  };

  const total = getCartTotal();
  const serviceCharge = total * 0;
  const grandTotal = total + serviceCharge;
  const cartCount = getCartCount();

  if (!currentUser || !currentBranch) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f5' }}>
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-[#e0e0e0] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#f5f5f5' }}>
      {/* Success flash overlay */}
      {showSuccessFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none" style={{ background: 'rgba(0, 194, 159, 0.1)' }} />
      )}

      {/* Left: Catalog */}
      {checkoutStep === 'catalog' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="h-16 bg-white border-b border-[#e0e0e0] flex items-center px-4 gap-4 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-accent-orange flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-bold text-lg text-[#2c2c2c] truncate">{currentBranch.name}</h1>
              <p className="text-xs text-muted-foreground truncate">{currentUser.full_name}</p>
            </div>
            {lowStockAlert.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shrink-0">
                <span className="text-xs text-red-600 font-medium">Low stock: {lowStockAlert.join(', ')}</span>
              </div>
            )}
            <div className="relative w-48 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-9 h-9 rounded-full border-[#e0e0e0] text-sm"
              />
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-muted-foreground hover:text-[#2c2c2c] shrink-0"
            >
              Logout
            </button>
          </div>

          {/* Category Filters */}
          <div className="bg-white px-4 py-3 border-b border-[#e0e0e0] flex gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === 'all' ? 'bg-accent-orange text-white shadow-float' : 'bg-[#f5f5f5] text-[#5a5a5a] hover:bg-[#e0e0e0]'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id ? 'bg-accent-orange text-white shadow-float' : 'bg-[#f5f5f5] text-[#5a5a5a] hover:bg-[#e0e0e0]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((c) => c.product_id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.03] transition-all duration-200 text-left group ${
                      inCart ? 'ring-4 ring-[#ff9e2c] bg-orange-50/50' : ''
                    }`}
                  >
                    <div className="aspect-square bg-[#f5f5f5] relative overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-10 h-10 text-[#e0e0e0]" />
                        </div>
                      )}
                      {!product.is_available && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-bold uppercase">Unavailable</span>
                        </div>
                      )}
                      {inCart && (
                        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-accent-orange text-white flex items-center justify-center text-xs font-bold shadow-md">
                          {inCart.qty}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-heading font-semibold text-[#2c2c2c] text-sm truncate">{product.name}</h3>
                      <p className="text-accent-orange font-mono font-semibold text-sm mt-0.5">
                        P{product.price.toFixed(2)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Payment Screen */}
      {checkoutStep === 'payment' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <button
            onClick={() => setCheckoutStep('catalog')}
            className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-[#2c2c2c]"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to order
          </button>

          <h2 className="text-3xl font-heading font-bold text-[#2c2c2c] mb-2">Payment</h2>
          <p className="text-muted-foreground mb-8">Select payment method</p>

          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-5xl font-heading font-bold text-[#2c2c2c]">P{grandTotal.toFixed(2)}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-8">
            {([
              { method: 'cash' as const, icon: Banknote, label: 'Cash' },
              { method: 'gcash' as const, icon: Wallet, label: 'GCash' },
              { method: 'maya' as const, icon: CreditCard, label: 'Maya' },
            ]).map(({ method, icon: Icon, label }) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                  paymentMethod === method
                    ? 'border-[#ff9e2c] bg-orange-50 shadow-float'
                    : 'border-[#e0e0e0] bg-white hover:border-[#d0d0d0]'
                }`}
              >
                <Icon className={`w-8 h-8 ${paymentMethod === method ? 'text-[#ff9e2c]' : 'text-muted-foreground'}`} />
                <span className={`font-medium ${paymentMethod === method ? 'text-[#ff9e2c]' : 'text-[#2c2c2c]'}`}>{label}</span>
              </button>
            ))}
          </div>

          <Button
            onClick={handleSendOrder}
            className="w-full max-w-md h-14 rounded-full bg-accent-orange hover:bg-accent-hover text-white text-xl font-heading font-semibold shadow-float active:scale-[0.98] transition-transform"
          >
            <Send className="w-5 h-5 mr-2" />
            Send Order
          </Button>
        </div>
      )}

      {/* Success Screen */}
      {checkoutStep === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 rounded-full bg-success-green flex items-center justify-center mb-6 shadow-float-green">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-[#2c2c2c] mb-1">Order Sent!</h2>
          <p className="text-muted-foreground mb-6">Order #{orderNumber}</p>

          {/* Receipt */}
          {currentTenant?.receipt_printing_enabled && receiptConfig && (
            <div className="mb-6">
              <Receipt
                orderNumber={orderNumber}
                date={new Date().toLocaleString('en-PH')}
                cashierName={currentUser.full_name}
                branchName={currentBranch.name}
                items={cart}
                paymentMethod={paymentMethod}
                receiptConfig={receiptConfig}
              />
            </div>
          )}

          <Button
            onClick={handleNewOrder}
            className="h-12 rounded-full bg-accent-orange hover:bg-accent-hover text-white px-8 shadow-float font-heading font-semibold"
          >
            New Order
          </Button>
        </div>
      )}

      {/* Right: Cart Sidebar */}
      {checkoutStep === 'catalog' && (
        <div className="w-[360px] bg-white border-l border-[#e0e0e0] flex flex-col shrink-0 shadow-lg">
          {/* Header */}
          <div className="p-4 border-b border-[#e0e0e0]">
            <h2 className="font-heading font-bold text-xl text-[#2c2c2c]">Current Order</h2>
            <p className="text-sm text-muted-foreground">{cartCount} items</p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="w-16 h-16 text-[#e0e0e0] mb-3" />
                <p className="text-muted-foreground font-heading">Your cart is empty</p>
                <p className="text-xs text-muted-foreground mt-1">Tap a product to add it</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.product_id}-${item.variant_id || ''}`}
                  ref={(el) => { cartItemRefs.current[`${item.product_id}-${item.variant_id || ''}`] = el; }}
                  className="flex items-center gap-3 bg-[#f5f5f5] rounded-xl p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#2c2c2c] truncate">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                    )}
                    <p className="text-xs text-accent-orange font-mono mt-0.5">
                      P{item.price.toFixed(2)} x {item.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQty(item.product_id, item.qty - 1, item.variant_id)}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow transition-shadow"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.product_id, item.qty + 1, item.variant_id)}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow transition-shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product_id, item.variant_id)}
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
                <span className="font-mono">P{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Charge</span>
                <span className="font-mono">P{serviceCharge.toFixed(2)}</span>
              </div>
              <div className="receipt-line" />
              <div className="flex justify-between">
                <span className="font-heading font-bold text-lg">Total</span>
                <span className="font-heading font-bold text-2xl text-accent-orange">P{grandTotal.toFixed(2)}</span>
              </div>
              <Button
                onClick={() => setCheckoutStep('payment')}
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

      {/* Variant Selection Modal */}
      {selectedProduct && variants.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
          <div ref={modalRef} className="bg-white rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-xl">{selectedProduct.name}</h3>
              <button
                onClick={() => { setSelectedProduct(null); setVariants([]); }}
                className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedProduct.image_url && (
              <img src={selectedProduct.image_url} alt="" className="w-full h-40 object-cover rounded-2xl mb-4" />
            )}
            <p className="text-muted-foreground text-sm mb-4">{selectedProduct.description}</p>
            <p className="text-sm font-medium mb-3">Select a variant:</p>
            <div className="space-y-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleAddVariant(v)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#f5f5f5] hover:bg-orange-50 hover:border-[#ff9e2c] border-2 border-transparent transition-all"
                >
                  <span className="font-medium">{v.name}</span>
                  <span className="font-mono text-accent-orange font-semibold">P{v.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
