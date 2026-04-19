import { create } from 'zustand';
import type { AppUser, Tenant, Branch, Category, Product, ProductVariant, CartItem, ReceiptConfig } from '@/types';

interface AppState {
  // Auth
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;

  // Tenant/Branch context
  currentTenant: Tenant | null;
  currentBranch: Branch | null;
  branches: Branch[];
  setCurrentTenant: (tenant: Tenant | null) => void;
  setCurrentBranch: (branch: Branch | null) => void;
  setBranches: (branches: Branch[]) => void;

  // Admin panel state
  adminActiveTenant: Tenant | null;
  adminActiveTab: string;
  setAdminActiveTenant: (tenant: Tenant | null) => void;
  setAdminActiveTab: (tab: string) => void;

  // Menu management
  categories: Category[];
  products: Product[];
  selectedProduct: Product | null;
  productVariants: ProductVariant[];
  setCategories: (categories: Category[]) => void;
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  setProductVariants: (variants: ProductVariant[]) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQty: (productId: string, qty: number, variantId?: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;

  // Notifications
  unreadCount: number;
  setUnreadCount: (count: number) => void;

  // Receipt
  receiptConfig: ReceiptConfig;
  setReceiptConfig: (config: ReceiptConfig) => void;
}

const defaultReceiptConfig: ReceiptConfig = {
  header_text: 'LuxPOS Restaurant',
  address: '123 Main Street',
  contact_number: '+63 912 345 6789',
  footer_message: 'Thank you! Come again.',
  paper_width: '80mm',
  show_cashier_name: true,
  show_branch_name: true,
};

export const useStore = create<AppState>((set, get) => ({
  // Auth
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ isLoading: loading }),

  // Tenant/Branch
  currentTenant: null,
  currentBranch: null,
  branches: [],
  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
  setCurrentBranch: (branch) => set({ currentBranch: branch }),
  setBranches: (branches) => set({ branches }),

  // Admin
  adminActiveTenant: null,
  adminActiveTab: 'products',
  setAdminActiveTenant: (tenant) => set({ adminActiveTenant: tenant }),
  setAdminActiveTab: (tab) => set({ adminActiveTab: tab }),

  // Menu
  categories: [],
  products: [],
  selectedProduct: null,
  productVariants: [],
  setCategories: (categories) => set({ categories }),
  setProducts: (products) => set({ products }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setProductVariants: (variants) => set({ productVariants: variants }),

  // Cart
  cart: [],
  addToCart: (item) => {
    const { cart } = get();
    const existing = cart.find(
      (c) => c.product_id === item.product_id && c.variant_id === item.variant_id
    );
    if (existing) {
      set({
        cart: cart.map((c) =>
          c.product_id === item.product_id && c.variant_id === item.variant_id
            ? { ...c, qty: c.qty + 1 }
            : c
        ),
      });
    } else {
      set({ cart: [...cart, { ...item, qty: 1 }] });
    }
  },
  removeFromCart: (productId, variantId) => {
    set({ cart: get().cart.filter((c) => !(c.product_id === productId && c.variant_id === variantId)) });
  },
  updateQty: (productId, qty, variantId) => {
    if (qty <= 0) {
      get().removeFromCart(productId, variantId);
      return;
    }
    set({
      cart: get().cart.map((c) =>
        c.product_id === productId && c.variant_id === variantId ? { ...c, qty } : c
      ),
    });
  },
  clearCart: () => set({ cart: [] }),
  getCartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.qty, 0),
  getCartCount: () => get().cart.reduce((sum, item) => sum + item.qty, 0),

  // Notifications
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  // Receipt
  receiptConfig: defaultReceiptConfig,
  setReceiptConfig: (config) => set({ receiptConfig: config }),
}));
