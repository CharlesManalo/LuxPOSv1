import { useState, useEffect } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import type { AppUser, Branch } from '@/types';
import { getCashiers, createCashier, deleteCashier, getBranches } from '@/lib/mockDb';

interface CashierManagementProps {
  tenantId: string;
}

export function CashierManagement({ tenantId }: CashierManagementProps) {
  const [cashiers, setCashiers] = useState<AppUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCashierName, setNewCashierName] = useState('');
  const [newCashierEmail, setNewCashierEmail] = useState('');
  const [newCashierBranch, setNewCashierBranch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    setIsLoading(true);
    const [cashiersData, branchesData] = await Promise.all([
      getCashiers(tenantId),
      getBranches(tenantId),
    ]);
    setCashiers(cashiersData);
    setBranches(branchesData);
    setIsLoading(false);
  };

  const handleCreateCashier = async () => {
    if (!newCashierName || !newCashierEmail) return;
    
    await createCashier({
      tenant_id: tenantId,
      branch_id: newCashierBranch || null,
      full_name: newCashierName,
      email: newCashierEmail,
    });
    
    setNewCashierName('');
    setNewCashierEmail('');
    setNewCashierBranch('');
    setShowCreateModal(false);
    loadData();
  };

  const handleDeleteCashier = async (cashierId: string) => {
    if (!confirm('Are you sure you want to delete this cashier?')) return;
    await deleteCashier(cashierId);
    loadData();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2c2c2c] font-heading">Cashier Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage cashier accounts for your business</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-success-green text-white rounded-xl font-medium hover:shadow-float transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cashier</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e0e0e0] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading cashiers...</div>
        ) : cashiers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No cashiers found. Add your first cashier to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#f5f5f5] border-b border-[#e0e0e0]">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#2c2c2c]">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#2c2c2c]">Email</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#2c2c2c]">Branch</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-[#2c2c2c]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cashiers.map((cashier) => {
                const branch = branches.find((b) => b.id === cashier.branch_id);
                return (
                  <tr key={cashier.id} className="border-b border-[#e0e0e0] last:border-0 hover:bg-[#f5f5f5]/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-orange/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-accent-orange" />
                        </div>
                        <span className="font-medium text-[#2c2c2c]">{cashier.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{cashier.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{branch?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteCashier(cashier.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Cashier Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#2c2c2c] font-heading mb-4">Add New Cashier</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2c2c2c] mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={newCashierName}
                  onChange={(e) => setNewCashierName(e.target.value)}
                  placeholder="e.g., Juan Dela Cruz"
                  className="w-full px-4 py-2.5 border border-[#e0e0e0] rounded-xl focus:outline-none focus:ring-2 focus:ring-success-green/20 focus:border-success-green"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#2c2c2c] mb-1.5">Email</label>
                <input
                  type="email"
                  value={newCashierEmail}
                  onChange={(e) => setNewCashierEmail(e.target.value)}
                  placeholder="e.g., juan@example.com"
                  className="w-full px-4 py-2.5 border border-[#e0e0e0] rounded-xl focus:outline-none focus:ring-2 focus:ring-success-green/20 focus:border-success-green"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c2c2c] mb-1.5">Branch (Optional)</label>
                <select
                  value={newCashierBranch}
                  onChange={(e) => setNewCashierBranch(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#e0e0e0] rounded-xl focus:outline-none focus:ring-2 focus:ring-success-green/20 focus:border-success-green"
                >
                  <option value="">Unassigned</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
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
                onClick={handleCreateCashier}
                disabled={!newCashierName || !newCashierEmail}
                className="flex-1 px-4 py-2.5 bg-success-green text-white rounded-xl font-medium hover:shadow-float transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Cashier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
