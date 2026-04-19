import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ShoppingBag, Package, AlertTriangle, DollarSign,
  Bell, CheckCircle, XCircle, ChevronDown, LogOut, Store,
  BarChart3, Utensils, ClipboardList, RefreshCw,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/stores/useStore';
import { useRealtimeOrders, useRealtimeNotifications } from '@/hooks/useRealtime';
import {
  getTenant, getBranches, getDashboardStats, getNotifications,
  updateNotificationStatus, getIngredients, restockIngredient,
  getOrders, getOrderItems,
} from '@/lib/mockDb';
import type { Branch, Notification, Ingredient, Order, OrderItem, DashboardStats } from '@/types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { currentTenant, setCurrentTenant } = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [restockQty, setRestockQty] = useState<Record<string, string>>({});
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Redirect non-owner
  useEffect(() => {
    if (currentUser && currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      navigate('/cashier');
    }
  }, [currentUser, navigate]);

  // Load data
  const loadData = useCallback(async () => {
    if (!currentUser?.tenant_id) return;
    const tenant = await getTenant(currentUser.tenant_id);
    if (tenant) setCurrentTenant(tenant);

    const brs = await getBranches(currentUser.tenant_id);
    setBranches(brs);

    const branchId = selectedBranchId === 'all' ? undefined : selectedBranchId;
    const [s, notifs, ings, ords] = await Promise.all([
      getDashboardStats(currentUser.tenant_id, branchId),
      getNotifications(currentUser.tenant_id, branchId),
      getIngredients(currentUser.tenant_id, branchId),
      getOrders(currentUser.tenant_id, branchId, 20),
    ]);
    setStats(s);
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => n.status === 'pending').length);
    setIngredients(ings);
    setOrders(ords);

    // Load order items
    const itemsMap: Record<string, OrderItem[]> = {};
    for (const order of ords.slice(0, 10)) {
      itemsMap[order.id] = await getOrderItems(order.id);
    }
    setOrderItems(itemsMap);
  }, [currentUser, selectedBranchId, setCurrentTenant]);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time
  useRealtimeOrders(currentUser?.tenant_id || null, () => {
    loadData();
  });
  useRealtimeNotifications(currentUser?.tenant_id || null, () => {
    loadData();
  });

  const handleApproveNotif = async (id: string) => {
    if (!currentUser) return;
    await updateNotificationStatus(id, 'approved', currentUser.id);
    loadData();
  };

  const handleRejectNotif = async (id: string) => {
    if (!currentUser) return;
    await updateNotificationStatus(id, 'rejected', currentUser.id);
    loadData();
  };

  const handleRestock = async (ingredientId: string) => {
    if (!currentUser) return;
    const qty = Number(restockQty[ingredientId]);
    if (!qty || qty <= 0) return;
    await restockIngredient(ingredientId, qty, currentUser.id);
    setRestockQty((p) => ({ ...p, [ingredientId]: '' }));
    loadData();
  };

  const tabs = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'orders', icon: ClipboardList, label: 'Orders' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
  ];

  const selectedBranchName = selectedBranchId === 'all'
    ? 'All Branches'
    : branches.find((b) => b.id === selectedBranchId)?.name || 'Select Branch';

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      {/* Top Bar */}
      <header className="bg-white border-b border-[#e0e0e0] sticky top-0 z-30">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-accent-orange flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-[#2c2c2c]">
                {currentTenant?.name || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Branch Selector */}
            <div className="relative">
              <button
                onClick={() => setShowNotifPanel(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5f5f5] text-sm font-medium hover:bg-[#e0e0e0] transition-colors"
              >
                <Store className="w-4 h-4 text-muted-foreground" />
                {selectedBranchName}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              {/* Branch Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-[#e0e0e0] overflow-hidden z-50">
                <button
                  onClick={() => setSelectedBranchId('all')}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-[#f5f5f5] transition-colors flex items-center gap-2 ${selectedBranchId === 'all' ? 'bg-orange-50 text-[#ff9e2c]' : ''}`}
                >
                  <Store className="w-4 h-4" />
                  All Branches
                </button>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranchId(b.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-[#f5f5f5] transition-colors flex items-center gap-2 ${selectedBranchId === b.id ? 'bg-orange-50 text-[#ff9e2c]' : ''}`}
                  >
                    <Store className="w-4 h-4" />
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center hover:bg-[#e0e0e0] transition-colors"
            >
              <Bell className="w-5 h-5 text-[#2c2c2c]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger-red text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { logout(); navigate('/login?role=owner'); }}
              className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center hover:bg-[#e0e0e0] transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 px-6 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-accent-orange text-white shadow-float'
                    : 'text-muted-foreground hover:text-[#2c2c2c] hover:bg-[#e0e0e0]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        {activeTab === 'overview' && stats && (
          <OverviewTab stats={stats} />
        )}
        {activeTab === 'orders' && (
          <OrdersTab orders={orders} orderItems={orderItems} branches={branches} />
        )}
        {activeTab === 'inventory' && (
          <InventoryTab
            ingredients={ingredients}
            branches={branches}
            restockQty={restockQty}
            setRestockQty={setRestockQty}
            onRestock={handleRestock}
          />
        )}
        {activeTab === 'notifications' && (
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

// ─── Overview Tab ───
function OverviewTab({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={`P${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="orange"
        />
        <KpiCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          icon={ShoppingBag}
          color="green"
        />
        <KpiCard
          title="Products"
          value={stats.totalProducts.toString()}
          icon={Utensils}
          color="blue"
        />
        <KpiCard
          title="Low Stock Items"
          value={stats.lowStockCount.toString()}
          icon={AlertTriangle}
          color={stats.lowStockCount > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">Daily Revenue (14 days)</h3>
          <div className="flex items-end gap-1.5 h-48">
            {stats.dailyRevenue.map((d, i) => {
              const maxVal = Math.max(...stats.dailyRevenue.map((dd) => dd.amount), 1);
              const height = (d.amount / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-accent-orange/80 hover:bg-accent-orange transition-colors relative group"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2c2c2c] text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      P{d.amount.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(d.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">Payment Methods</h3>
          <div className="space-y-4">
            {stats.paymentBreakdown.map((p) => (
              <div key={p.method}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium capitalize">{p.method}</span>
                  <span className="font-mono">P{p.amount.toLocaleString()} ({p.count} orders)</span>
                </div>
                <div className="h-2.5 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-orange transition-all"
                    style={{ width: `${stats.totalRevenue > 0 ? (p.amount / stats.totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products & Branch Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">Top Products</h3>
          <div className="space-y-3">
            {stats.topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#f5f5f5] flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.qty} sold</p>
                </div>
                <span className="font-mono text-sm font-semibold">P{p.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold text-lg mb-4">Branch Performance</h3>
          <div className="space-y-3">
            {stats.branchBreakdown.map((b) => (
              <div key={b.branch_id} className="flex items-center gap-3">
                <Store className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{b.branch_name}</p>
                  <p className="text-xs text-muted-foreground">{b.orders} orders</p>
                </div>
                <span className="font-mono text-sm font-semibold">P{b.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ElementType; color: string }) {
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-50 text-[#ff9e2c]',
    green: 'bg-green-50 text-[#00c29f]',
    blue: 'bg-blue-50 text-blue-500',
    red: 'bg-red-50 text-red-500',
  };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${colorMap[color]?.split(' ')[0] || 'bg-gray-50'} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colorMap[color]?.split(' ')[1] || 'text-gray-500'}`} />
        </div>
      </div>
      <p className="text-2xl font-heading font-bold text-[#2c2c2c]">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
    </div>
  );
}

// ─── Orders Tab ───
function OrdersTab({ orders, orderItems, branches }: { orders: Order[]; orderItems: Record<string, OrderItem[]>; branches: Branch[] }) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#e0e0e0]">
        <h3 className="font-heading font-semibold text-lg">Recent Orders</h3>
      </div>
      <div className="divide-y divide-[#e0e0e0]">
        {orders.map((order) => {
          const branch = branches.find((b) => b.id === order.branch_id);
          const items = orderItems[order.id] || [];
          const isExpanded = expandedOrder === order.id;
          return (
            <div key={order.id} className="hover:bg-[#f5f5f5]/50 transition-colors">
              <button
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'completed' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {order.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">Order #{order.id.split('-')[1] || order.id}</p>
                    <p className="text-xs text-muted-foreground">{branch?.name} · {new Date(order.created_at).toLocaleString('en-PH')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold">P{order.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{order.payment_method}</p>
                </div>
              </button>
              {isExpanded && items.length > 0 && (
                <div className="px-4 pb-4 pl-14">
                  <div className="bg-[#f5f5f5] rounded-xl p-3 space-y-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product_name} {item.variant_name && `(${item.variant_name})`} x{item.qty}</span>
                        <span className="font-mono">P{(item.unit_price * item.qty).toFixed(2)}</span>
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

// ─── Inventory Tab ───
function InventoryTab({
  ingredients, branches, restockQty, setRestockQty, onRestock,
}: {
  ingredients: Ingredient[];
  branches: Branch[];
  restockQty: Record<string, string>;
  setRestockQty: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onRestock: (id: string) => void;
}) {
  const [filterBranch, setFilterBranch] = useState<string>('all');

  const filtered = filterBranch === 'all'
    ? ingredients
    : ingredients.filter((i) => i.branch_id === filterBranch);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-lg">Inventory Management</h3>
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="rounded-xl border border-[#e0e0e0] px-4 py-2 text-sm"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f5f5f5]">
            <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
              <th className="px-4 py-3">Ingredient</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Threshold</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Restock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {filtered.map((ing) => {
              const branch = branches.find((b) => b.id === ing.branch_id);
              const isLow = ing.stock_qty <= ing.low_stock_threshold;
              return (
                <tr key={ing.id} className="hover:bg-[#f5f5f5]/50">
                  <td className="px-4 py-3 font-medium">{ing.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{branch?.name}</td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {ing.stock_qty.toFixed(2)} {ing.unit}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                    {ing.low_stock_threshold} {ing.unit}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isLow ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {isLow ? 'Low Stock' : 'OK'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={restockQty[ing.id] || ''}
                        onChange={(e) => setRestockQty((p) => ({ ...p, [ing.id]: e.target.value }))}
                        placeholder="Qty"
                        className="w-20 h-8 rounded-lg border border-[#e0e0e0] px-2 text-sm"
                      />
                      <button
                        onClick={() => onRestock(ing.id)}
                        className="h-8 px-3 rounded-lg bg-success-green text-white text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
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
  );
}

// ─── Notifications Tab ───
function NotificationsTab({
  notifications, onApprove, onReject,
}: {
  notifications: Notification[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [activeNotifTab, setActiveNotifTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filtered = activeNotifTab === 'all'
    ? notifications
    : notifications.filter((n) => n.status === activeNotifTab);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'password_reset': return <RefreshCw className="w-4 h-4" />;
      case 'void_order': return <XCircle className="w-4 h-4" />;
      case 'low_stock': return <AlertTriangle className="w-4 h-4" />;
      case 'new_order': return <ShoppingBag className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'password_reset': return 'bg-blue-50 text-blue-500';
      case 'void_order': return 'bg-red-50 text-red-500';
      case 'low_stock': return 'bg-orange-50 text-orange-500';
      case 'new_order': return 'bg-green-50 text-green-500';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveNotifTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              activeNotifTab === tab ? 'bg-accent-orange text-white shadow-float' : 'bg-white text-muted-foreground hover:bg-[#e0e0e0]'
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
              <div className={`w-10 h-10 rounded-xl ${typeColor(notif.type)} flex items-center justify-center shrink-0`}>
                {typeIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{(notif.payload as { title?: string }).title || notif.type}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    notif.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    notif.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {notif.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{(notif.payload as { message?: string }).message || ''}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notif.created_at).toLocaleString('en-PH')}
                </p>
              </div>
              {notif.status === 'pending' && (
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
