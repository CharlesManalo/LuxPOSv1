import type {
  Tenant, Branch, AppUser, Category, Product, ProductVariant,
  ProductIngredient, Ingredient, Order, OrderItem, InventoryLog, Notification
} from '@/types';

// Demo Tenant
export const demoTenant: Tenant = {
  id: 'tenant-1',
  name: 'Silogan Ni Juan',
  slug: 'silogan-ni-juan',
  receipt_printing_enabled: true,
  receipt_config: {
    header_text: 'Silogan Ni Juan',
    address: '456 Mabini St., Batangas City',
    contact_number: '+63 917 123 4567',
    footer_message: 'Maraming salamat po! Balik kayo ah!',
    paper_width: '80mm',
    show_cashier_name: true,
    show_branch_name: true,
  },
  created_at: '2024-01-15T00:00:00Z',
};

// Demo Branches
export const demoBranches: Branch[] = [
  {
    id: 'branch-1',
    tenant_id: 'tenant-1',
    name: 'Main Branch',
    address: '456 Mabini St., Batangas City',
    manager_id: null,
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'branch-2',
    tenant_id: 'tenant-1',
    name: 'Annex Branch',
    address: '78 Poblacion Rd., Batangas City',
    manager_id: null,
    is_active: true,
    created_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 'branch-3',
    tenant_id: 'tenant-1',
    name: 'SM City Branch',
    address: 'SM City Batangas, Food Court Level 2',
    manager_id: null,
    is_active: true,
    created_at: '2024-06-15T00:00:00Z',
  },
];

// Demo Users
export const demoUsers: AppUser[] = [
  {
    id: 'admin-1',
    tenant_id: 'tenant-1',
    branch_id: null,
    role: 'admin',
    full_name: 'System Admin',
    email: 'admin@luxpos.app',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'owner-1',
    tenant_id: 'tenant-1',
    branch_id: null,
    role: 'owner',
    full_name: 'Juan Dela Cruz',
    email: 'juan@silogan.ph',
    avatar_url: null,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'cashier-1',
    tenant_id: 'tenant-1',
    branch_id: 'branch-1',
    role: 'cashier',
    full_name: 'Maria Santos',
    email: 'maria@silogan.ph',
    avatar_url: null,
    created_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'cashier-2',
    tenant_id: 'tenant-1',
    branch_id: 'branch-2',
    role: 'cashier',
    full_name: 'Pedro Reyes',
    email: 'pedro@silogan.ph',
    avatar_url: null,
    created_at: '2024-04-01T00:00:00Z',
  },
];

// Demo Categories
export const demoCategories: Category[] = [
  { id: 'cat-1', tenant_id: 'tenant-1', name: 'Silog Meals', sort_order: 1, created_at: '2024-01-15T00:00:00Z' },
  { id: 'cat-2', tenant_id: 'tenant-1', name: 'Drinks', sort_order: 2, created_at: '2024-01-15T00:00:00Z' },
  { id: 'cat-3', tenant_id: 'tenant-1', name: 'Add-ons', sort_order: 3, created_at: '2024-01-15T00:00:00Z' },
  { id: 'cat-4', tenant_id: 'tenant-1', name: 'Combo Meals', sort_order: 4, created_at: '2024-01-15T00:00:00Z' },
];

// Demo Products
export const demoProducts: Product[] = [
  {
    id: 'prod-1', tenant_id: 'tenant-1', category_id: 'cat-1', name: 'Tapsilog',
    price: 95, image_url: 'https://images.unsplash.com/photo-1603133872878-684f2d09c77c?w=400&h=400&fit=crop',
    is_available: true, description: 'Tapa + Sinangag + Itlog. Our signature silog meal with marinated beef tapa.',
    has_variants: true, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-2', tenant_id: 'tenant-1', category_id: 'cat-1', name: 'Longsilog',
    price: 85, image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=400&fit=crop',
    is_available: true, description: 'Longganisa + Sinangag + Itlog. Sweet Filipino pork sausage with garlic rice and egg.',
    has_variants: true, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-3', tenant_id: 'tenant-1', category_id: 'cat-1', name: 'Bangsilog',
    price: 105, image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a270b?w=400&h=400&fit=crop',
    is_available: true, description: 'Bangus + Sinangag + Itlog. Fried milkfish served with garlic rice and sunny-side up egg.',
    has_variants: false, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-4', tenant_id: 'tenant-1', category_id: 'cat-1', name: 'Hotsilog',
    price: 80, image_url: 'https://images.unsplash.com/photo-1547424450-75ec164925ad?w=400&h=400&fit=crop',
    is_available: true, description: 'Hotdog + Sinangag + Itlog. Classic Filipino breakfast hotdog with garlic rice and egg.',
    has_variants: false, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-5', tenant_id: 'tenant-1', category_id: 'cat-1', name: 'Chicksilog',
    price: 100, image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop',
    is_available: true, description: 'Chicken + Sinangag + Itlog. Crispy fried chicken with garlic rice and egg.',
    has_variants: true, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-6', tenant_id: 'tenant-1', category_id: 'cat-2', name: 'Iced Coffee',
    price: 45, image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
    is_available: true, description: 'Refreshing iced coffee made with Barako beans.',
    has_variants: true, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-7', tenant_id: 'tenant-1', category_id: 'cat-2', name: 'Calamansi Juice',
    price: 35, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=400&fit=crop',
    is_available: true, description: 'Fresh calamansi juice, perfectly sweet and sour.',
    has_variants: true, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-8', tenant_id: 'tenant-1', category_id: 'cat-2', name: 'Iced Tea',
    price: 40, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
    is_available: true, description: 'House-blend iced tea with lemon.',
    has_variants: false, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-9', tenant_id: 'tenant-1', category_id: 'cat-2', name: 'Bottled Water',
    price: 20, image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop',
    is_available: true, description: '500ml bottled water.',
    has_variants: false, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-10', tenant_id: 'tenant-1', category_id: 'cat-3', name: 'Extra Rice',
    price: 20, image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
    is_available: true, description: 'Extra serving of garlic fried rice.',
    has_variants: false, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-11', tenant_id: 'tenant-1', category_id: 'cat-3', name: 'Extra Egg',
    price: 15, image_url: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&h=400&fit=crop',
    is_available: true, description: 'Additional sunny-side up egg.',
    has_variants: false, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-12', tenant_id: 'tenant-1', category_id: 'cat-3', name: 'Atsara',
    price: 25, image_url: 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=400&h=400&fit=crop',
    is_available: true, description: 'Pickled papaya side dish.',
    has_variants: false, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-13', tenant_id: 'tenant-1', category_id: 'cat-4', name: 'Buddy Meal',
    price: 165, image_url: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=400&fit=crop',
    is_available: true, description: '2 Silog meals + 2 drinks. Perfect for sharing!',
    has_variants: true, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-14', tenant_id: 'tenant-1', category_id: 'cat-4', name: 'Family Feast',
    price: 320, image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=400&fit=crop',
    is_available: true, description: '4 Silog meals + 4 drinks + 4 extra rice. Sulit!',
    has_variants: true, created_at: '2024-01-15T00:00:00Z',
  },
];

// Demo Product Variants
export const demoProductVariants: ProductVariant[] = [
  { id: 'var-1', product_id: 'prod-1', name: 'Regular', price: 95, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-2', product_id: 'prod-1', name: 'Large', price: 120, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-3', product_id: 'prod-1', name: 'With Cheese', price: 115, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-4', product_id: 'prod-2', name: 'Regular', price: 85, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-5', product_id: 'prod-2', name: 'Large', price: 105, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-6', product_id: 'prod-5', name: '1pc Chicken', price: 100, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-7', product_id: 'prod-5', name: '2pc Chicken', price: 145, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-8', product_id: 'prod-6', name: 'Small', price: 45, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-9', product_id: 'prod-6', name: 'Large', price: 60, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-10', product_id: 'prod-7', name: 'Small', price: 35, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-11', product_id: 'prod-7', name: 'Large', price: 50, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-12', product_id: 'prod-13', name: 'Tapsilog + Longsilog', price: 165, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-13', product_id: 'prod-13', name: 'Any 2 Meals', price: 180, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-14', product_id: 'prod-14', name: 'Tapsilog Family', price: 320, created_at: '2024-01-15T00:00:00Z' },
  { id: 'var-15', product_id: 'prod-14', name: 'Mixed Family', price: 350, created_at: '2024-01-15T00:00:00Z' },
];

// Demo Ingredients (per branch - Main Branch)
export const demoIngredients: Ingredient[] = [
  { id: 'ing-1', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Beef Tapa', unit: 'kg', stock_qty: 12.5, low_stock_threshold: 5, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-2', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Longganisa', unit: 'kg', stock_qty: 8.3, low_stock_threshold: 5, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-3', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Bangus', unit: 'kg', stock_qty: 3.2, low_stock_threshold: 3, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-4', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Chicken', unit: 'kg', stock_qty: 15.0, low_stock_threshold: 5, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-5', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Hotdog', unit: 'pcs', stock_qty: 48, low_stock_threshold: 20, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-6', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Rice', unit: 'kg', stock_qty: 50, low_stock_threshold: 15, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-7', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Egg', unit: 'pcs', stock_qty: 120, low_stock_threshold: 30, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-8', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Cooking Oil', unit: 'L', stock_qty: 10, low_stock_threshold: 3, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-9', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Calamansi', unit: 'kg', stock_qty: 2.5, low_stock_threshold: 2, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-10', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Barako Coffee', unit: 'kg', stock_qty: 4.0, low_stock_threshold: 1, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-11', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Sugar', unit: 'kg', stock_qty: 8, low_stock_threshold: 3, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-12', tenant_id: 'tenant-1', branch_id: 'branch-1', name: 'Cheese', unit: 'kg', stock_qty: 4.5, low_stock_threshold: 2, created_at: '2024-01-15T00:00:00Z' },
  // Annex Branch ingredients
  { id: 'ing-13', tenant_id: 'tenant-1', branch_id: 'branch-2', name: 'Beef Tapa', unit: 'kg', stock_qty: 6.0, low_stock_threshold: 5, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-14', tenant_id: 'tenant-1', branch_id: 'branch-2', name: 'Longganisa', unit: 'kg', stock_qty: 4.0, low_stock_threshold: 5, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-15', tenant_id: 'tenant-1', branch_id: 'branch-2', name: 'Rice', unit: 'kg', stock_qty: 35, low_stock_threshold: 15, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ing-16', tenant_id: 'tenant-1', branch_id: 'branch-2', name: 'Egg', unit: 'pcs', stock_qty: 80, low_stock_threshold: 30, created_at: '2024-01-15T00:00:00Z' },
];

// Demo Product-Ingredient mappings
export const demoProductIngredients: ProductIngredient[] = [
  { id: 'pi-1', product_id: 'prod-1', ingredient_id: 'ing-1', qty_required: 0.15 },
  { id: 'pi-2', product_id: 'prod-1', ingredient_id: 'ing-6', qty_required: 0.2 },
  { id: 'pi-3', product_id: 'prod-1', ingredient_id: 'ing-7', qty_required: 1 },
  { id: 'pi-4', product_id: 'prod-2', ingredient_id: 'ing-2', qty_required: 0.1 },
  { id: 'pi-5', product_id: 'prod-2', ingredient_id: 'ing-6', qty_required: 0.2 },
  { id: 'pi-6', product_id: 'prod-2', ingredient_id: 'ing-7', qty_required: 1 },
  { id: 'pi-7', product_id: 'prod-3', ingredient_id: 'ing-3', qty_required: 0.2 },
  { id: 'pi-8', product_id: 'prod-3', ingredient_id: 'ing-6', qty_required: 0.2 },
  { id: 'pi-9', product_id: 'prod-3', ingredient_id: 'ing-7', qty_required: 1 },
  { id: 'pi-10', product_id: 'prod-4', ingredient_id: 'ing-5', qty_required: 2 },
  { id: 'pi-11', product_id: 'prod-4', ingredient_id: 'ing-6', qty_required: 0.2 },
  { id: 'pi-12', product_id: 'prod-4', ingredient_id: 'ing-7', qty_required: 1 },
  { id: 'pi-13', product_id: 'prod-5', ingredient_id: 'ing-4', qty_required: 0.25 },
  { id: 'pi-14', product_id: 'prod-5', ingredient_id: 'ing-6', qty_required: 0.2 },
  { id: 'pi-15', product_id: 'prod-5', ingredient_id: 'ing-7', qty_required: 1 },
  { id: 'pi-16', product_id: 'prod-6', ingredient_id: 'ing-10', qty_required: 0.02 },
  { id: 'pi-17', product_id: 'prod-7', ingredient_id: 'ing-9', qty_required: 0.05 },
  { id: 'pi-18', product_id: 'prod-10', ingredient_id: 'ing-6', qty_required: 0.2 },
  { id: 'pi-19', product_id: 'prod-11', ingredient_id: 'ing-7', qty_required: 1 },
];

// Generate demo orders
function generateDemoOrders(): Order[] {
  const orders: Order[] = [];
  const methods = ['cash', 'gcash', 'maya'] as const;
  const baseDate = new Date('2026-04-19');

  for (let i = 0; i < 50; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(Math.floor(Math.random() * 14) + 6, Math.floor(Math.random() * 60));

    orders.push({
      id: `order-${i + 1}`,
      tenant_id: 'tenant-1',
      branch_id: Math.random() > 0.4 ? 'branch-1' : Math.random() > 0.5 ? 'branch-2' : 'branch-3',
      cashier_id: Math.random() > 0.5 ? 'cashier-1' : 'cashier-2',
      status: i < 45 ? 'completed' : 'voided',
      payment_method: methods[Math.floor(Math.random() * 3)],
      total: Math.floor(Math.random() * 400) + 50,
      created_at: date.toISOString(),
    });
  }
  return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const demoOrders: Order[] = generateDemoOrders();

// Generate demo order items
function generateDemoOrderItems(): OrderItem[] {
  const items: OrderItem[] = [];
  const productNames = ['Tapsilog', 'Longsilog', 'Bangsilog', 'Hotsilog', 'Chicksilog', 'Iced Coffee', 'Calamansi Juice', 'Iced Tea', 'Extra Rice', 'Extra Egg', 'Atsara', 'Buddy Meal', 'Family Feast'];
  const variantNames: Record<string, string[]> = {
    'Tapsilog': ['Regular', 'Large', 'With Cheese'],
    'Longsilog': ['Regular', 'Large'],
    'Chicksilog': ['1pc Chicken', '2pc Chicken'],
    'Iced Coffee': ['Small', 'Large'],
    'Calamansi Juice': ['Small', 'Large'],
    'Buddy Meal': ['Tapsilog + Longsilog', 'Any 2 Meals'],
    'Family Feast': ['Tapsilog Family', 'Mixed Family'],
  };

  demoOrders.forEach((order) => {
    const itemCount = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < itemCount; j++) {
      const prodName = productNames[Math.floor(Math.random() * productNames.length)];
      const variants = variantNames[prodName];
      const variant = variants ? variants[Math.floor(Math.random() * variants.length)] : undefined;
      const qty = Math.floor(Math.random() * 3) + 1;
      const unitPrice = Math.floor(Math.random() * 150) + 20;

      items.push({
        id: `oi-${order.id}-${j}`,
        order_id: order.id,
        product_id: `prod-${Math.floor(Math.random() * 14) + 1}`,
        product_name: prodName,
        variant_name: variant || undefined,
        qty,
        unit_price: unitPrice,
      });
    }
  });
  return items;
}

export const demoOrderItems: OrderItem[] = generateDemoOrderItems();

// Demo inventory logs
export const demoInventoryLogs: InventoryLog[] = [
  { id: 'log-1', tenant_id: 'tenant-1', branch_id: 'branch-1', ingredient_id: 'ing-1', ingredient_name: 'Beef Tapa', change_qty: -1.5, reason: 'order', triggered_by: 'cashier-1', created_at: '2026-04-19T08:30:00Z' },
  { id: 'log-2', tenant_id: 'tenant-1', branch_id: 'branch-1', ingredient_id: 'ing-6', ingredient_name: 'Rice', change_qty: -5.0, reason: 'order', triggered_by: 'cashier-1', created_at: '2026-04-19T09:00:00Z' },
  { id: 'log-3', tenant_id: 'tenant-1', branch_id: 'branch-1', ingredient_id: 'ing-7', ingredient_name: 'Egg', change_qty: -24, reason: 'order', triggered_by: 'cashier-1', created_at: '2026-04-19T09:30:00Z' },
  { id: 'log-4', tenant_id: 'tenant-1', branch_id: 'branch-1', ingredient_id: 'ing-1', ingredient_name: 'Beef Tapa', change_qty: 10, reason: 'restock', triggered_by: 'owner-1', created_at: '2026-04-18T16:00:00Z' },
  { id: 'log-5', tenant_id: 'tenant-1', branch_id: 'branch-1', ingredient_id: 'ing-3', ingredient_name: 'Bangus', change_qty: -0.8, reason: 'order', triggered_by: 'cashier-1', created_at: '2026-04-19T10:00:00Z' },
  { id: 'log-6', tenant_id: 'tenant-1', branch_id: 'branch-2', ingredient_id: 'ing-13', ingredient_name: 'Beef Tapa', change_qty: -0.6, reason: 'order', triggered_by: 'cashier-2', created_at: '2026-04-19T08:45:00Z' },
  { id: 'log-7', tenant_id: 'tenant-1', branch_id: 'branch-2', ingredient_id: 'ing-15', ingredient_name: 'Rice', change_qty: -3.0, reason: 'order', triggered_by: 'cashier-2', created_at: '2026-04-19T09:15:00Z' },
  { id: 'log-8', tenant_id: 'tenant-1', branch_id: 'branch-1', ingredient_id: 'ing-7', ingredient_name: 'Egg', change_qty: 60, reason: 'restock', triggered_by: 'owner-1', created_at: '2026-04-18T17:00:00Z' },
];

// Demo notifications
export const demoNotifications: Notification[] = [
  {
    id: 'notif-1', tenant_id: 'tenant-1', branch_id: 'branch-1', type: 'password_reset', status: 'pending',
    payload: { title: 'Password Reset Request', message: 'Maria Santos requested a password reset', cashier_name: 'Maria Santos', branch_name: 'Main Branch' },
    created_by: 'cashier-1', created_at: '2026-04-19T08:00:00Z',
  },
  {
    id: 'notif-2', tenant_id: 'tenant-1', branch_id: 'branch-1', type: 'void_order', status: 'pending',
    payload: { title: 'Void Order Request', message: 'Request to void Order #1234', order_id: 'order-5', cashier_name: 'Maria Santos', branch_name: 'Main Branch', amount: 180 },
    created_by: 'cashier-1', created_at: '2026-04-19T09:00:00Z',
  },
  {
    id: 'notif-3', tenant_id: 'tenant-1', branch_id: 'branch-2', type: 'low_stock', status: 'pending',
    payload: { title: 'Low Stock Alert', message: 'Bangus stock is below threshold', ingredient_name: 'Bangus', branch_name: 'Annex Branch' },
    created_by: 'cashier-2', created_at: '2026-04-19T07:30:00Z',
  },
  {
    id: 'notif-4', tenant_id: 'tenant-1', branch_id: 'branch-1', type: 'new_order', status: 'pending',
    payload: { title: 'New Order', message: 'Order #1238 received', order_id: 'order-8', branch_name: 'Main Branch', amount: 250 },
    created_by: 'cashier-1', created_at: '2026-04-19T10:00:00Z',
  },
  {
    id: 'notif-5', tenant_id: 'tenant-1', branch_id: 'branch-2', type: 'password_reset', status: 'approved',
    payload: { title: 'Password Reset Request', message: 'Pedro Reyes requested a password reset', cashier_name: 'Pedro Reyes', branch_name: 'Annex Branch' },
    created_by: 'cashier-2', created_at: '2026-04-18T16:00:00Z',
  },
];

// Storage helper for localStorage persistence
const STORAGE_KEY = 'luxpos_data';

export interface StoredData {
  tenants: Tenant[];
  branches: Branch[];
  users: AppUser[];
  categories: Category[];
  products: Product[];
  productVariants: ProductVariant[];
  ingredients: Ingredient[];
  productIngredients: ProductIngredient[];
  orders: Order[];
  orderItems: OrderItem[];
  inventoryLogs: InventoryLog[];
  notifications: Notification[];
}

function getDefaultData(): StoredData {
  return {
    tenants: [demoTenant],
    branches: demoBranches,
    users: demoUsers,
    categories: demoCategories,
    products: demoProducts,
    productVariants: demoProductVariants,
    ingredients: demoIngredients,
    productIngredients: demoProductIngredients,
    orders: demoOrders,
    orderItems: demoOrderItems,
    inventoryLogs: demoInventoryLogs,
    notifications: demoNotifications,
  };
}

export function getStoredData(): StoredData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  const defaultData = getDefaultData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
}

export function setStoredData(data: Partial<StoredData>): void {
  const current = getStoredData();
  const updated = { ...current, ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// ID generator
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
