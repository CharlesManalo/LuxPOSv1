import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  Users,
  Database,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  ImageIcon,
  Check,
  X,
  ChevronLeft,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { createTenant, deleteTenant, resetAllData } from "@/lib/mockDb";

// ── types ──────────────────────────────────────────────────────────────────
interface OwnerAccount {
  id: string;
  name: string; // shop name
  slug: string;
  logo_url?: string;
  owner_email: string;
  owner_password?: string;
  created_at: string;
}

interface NewOwnerForm {
  shopName: string;
  slug: string;
  email: string;
  password: string;
  confirmPassword: string;
  logo_url: string;
}

const EMPTY_FORM: NewOwnerForm = {
  shopName: "",
  slug: "",
  email: "",
  password: "",
  confirmPassword: "",
  logo_url: "",
};

// ── seed data (2 test accounts) ────────────────────────────────────────────
const SEED_OWNERS: OwnerAccount[] = [
  {
    id: "seed-1",
    name: "Silogan ni Juan",
    slug: "silogan-ni-juan",
    logo_url: "",
    owner_email: "juan@silogan.ph",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: "seed-2",
    name: "Tapsi Express",
    slug: "tapsi-express",
    logo_url: "",
    owner_email: "tapsi@express.ph",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

// ── root component ─────────────────────────────────────────────────────────
export function AdminPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"owners" | "system">("owners");

  useEffect(() => {
    if (currentUser && currentUser.role !== "super_admin") {
      navigate("/cashier");
    }
  }, [currentUser, navigate]);

  const tabs = [
    { id: "owners" as const, icon: Users, label: "Owner Accounts" },
    { id: "system" as const, icon: Database, label: "System" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#f5f5f5" }}>
      {/* ── Sidebar ── */}
      <aside
        className="w-60 bg-white flex flex-col shrink-0"
        style={{ borderRight: "1px solid #e0e0e0" }}
      >
        {/* Brand */}
        <div
          className="h-14 flex items-center gap-3 px-4"
          style={{ borderBottom: "1px solid #e0e0e0" }}
        >
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: "#2c2c2c" }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-[#2c2c2c]">
            LuxPOS Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors"
              style={{
                borderRadius: 8,
                background: activeTab === id ? "#f5f5f5" : "transparent",
                color: activeTab === id ? "#2c2c2c" : "#5a5a5a",
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: "1px solid #e0e0e0" }}>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#5a5a5a] hover:text-[#2c2c2c] transition-colors"
            style={{ borderRadius: 8 }}
          >
            <ChevronLeft className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto">
        {activeTab === "owners" && <OwnerAccountsPanel />}
        {activeTab === "system" && <SystemPanel />}
      </main>
    </div>
  );
}

// ── Owner Accounts Panel ───────────────────────────────────────────────────
function OwnerAccountsPanel() {
  const [owners, setOwners] = useState<OwnerAccount[]>(SEED_OWNERS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewOwnerForm>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewOwnerForm, string>>
  >({});
  const logoInputRef = useRef<HTMLInputElement>(null);

  // auto-generate slug from shop name
  const handleShopNameChange = (val: string) => {
    setForm((f) => ({
      ...f,
      shopName: val,
      slug: val
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    }));
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.shopName.trim()) e.shopName = "Shop name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email.";
    if (owners.some((o) => o.owner_email === form.email))
      e.email = "This email is already registered.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Minimum 6 characters.";
    if (form.confirmPassword !== form.password)
      e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaveStatus("saving");

    // Create tenant in mockDb
    await createTenant({
      name: form.shopName.trim(),
      slug: form.slug || form.shopName.toLowerCase().replace(/\s+/g, "-"),
      receipt_printing_enabled: true,
      receipt_config: {
        header_text: form.shopName.trim(),
        address: "",
        contact_number: "",
        footer_message: "Thank you!",
        paper_width: "80mm",
        show_cashier_name: true,
      },
    });

    // Add to local list for immediate feedback
    const newOwner: OwnerAccount = {
      id: `owner-${Date.now()}`,
      name: form.shopName.trim(),
      slug: form.slug,
      logo_url: form.logo_url,
      owner_email: form.email,
      created_at: new Date().toISOString(),
    };

    setOwners((prev) => [newOwner, ...prev]);
    setSaveStatus("saved");

    setTimeout(() => {
      setSaveStatus("idle");
      setForm(EMPTY_FORM);
      setErrors({});
      setShowForm(false);
    }, 800);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its data? This cannot be undone.`))
      return;
    await deleteTenant(id);
    setOwners((prev) => prev.filter((o) => o.id !== id));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setForm((f) => ({ ...f, logo_url: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-[#2c2c2c] font-heading">
            Owner Accounts
          </h1>
          <p className="text-sm text-[#8a8a8a] mt-0.5">
            {owners.length} registered{" "}
            {owners.length === 1 ? "owner" : "owners"}
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-white text-sm font-medium"
            style={{
              background: "#2c2c2c",
              borderRadius: 8,
              height: 36,
              paddingLeft: 14,
              paddingRight: 14,
            }}
          >
            <Plus className="w-4 h-4" />
            Add Owner
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <div
          className="bg-white mb-6"
          style={{ border: "1px solid #e0e0e0", borderRadius: 10 }}
        >
          {/* Form header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid #e0e0e0" }}
          >
            <span className="font-semibold text-[#2c2c2c] text-sm">
              New Owner Account
            </span>
            <button
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
                setErrors({});
              }}
              className="w-7 h-7 flex items-center justify-center text-[#8a8a8a] hover:text-[#2c2c2c] transition-colors"
              style={{ borderRadius: 6 }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Logo + Shop name row */}
            <div className="flex gap-4 items-start">
              {/* Logo upload */}
              <div>
                <p className="text-xs font-medium text-[#5a5a5a] mb-1.5">
                  Logo
                </p>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-16 h-16 flex flex-col items-center justify-center transition-colors overflow-hidden"
                  style={{
                    border: "1px dashed #d0d0d0",
                    borderRadius: 8,
                    background: form.logo_url ? "transparent" : "#fafafa",
                  }}
                >
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 text-[#c0c0c0] mb-1" />
                      <span className="text-[10px] text-[#b0b0b0]">Upload</span>
                    </>
                  )}
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>

              {/* Shop name + slug */}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#5a5a5a] mb-1.5 block">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.shopName}
                    onChange={(e) => handleShopNameChange(e.target.value)}
                    placeholder="e.g., Silogan ni Juan"
                    className="h-9 text-sm"
                    style={{ borderRadius: 8 }}
                  />
                  {errors.shopName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.shopName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-[#5a5a5a] mb-1.5 block">
                    Slug
                  </label>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    placeholder="auto-generated"
                    className="h-9 text-sm font-mono text-[#8a8a8a]"
                    style={{ borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #f0f0f0" }} />

            {/* Credentials */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-medium text-[#5a5a5a] mb-1.5 block">
                  Owner Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="owner@shop.com"
                  className="h-9 text-sm"
                  style={{ borderRadius: 8 }}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#5a5a5a] mb-1.5 block">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                      }
                      placeholder="Min. 6 characters"
                      className="h-9 text-sm pr-9"
                      style={{ borderRadius: 8 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#5a5a5a]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5a5a5a] mb-1.5 block">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Re-enter password"
                      className="h-9 text-sm pr-9"
                      style={{ borderRadius: 8 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#5a5a5a]"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form footer */}
          <div
            className="flex items-center justify-end gap-3 px-5 py-4"
            style={{ borderTop: "1px solid #e0e0e0" }}
          >
            <button
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
                setErrors({});
              }}
              className="px-4 py-2 text-sm font-medium text-[#5a5a5a] hover:text-[#2c2c2c] transition-colors"
              style={{ borderRadius: 8 }}
            >
              Cancel
            </button>
            <Button
              onClick={handleCreate}
              disabled={saveStatus !== "idle"}
              className="flex items-center gap-2 text-white text-sm font-medium"
              style={{
                background: "#2c2c2c",
                borderRadius: 8,
                height: 36,
                paddingLeft: 14,
                paddingRight: 14,
              }}
            >
              {saveStatus === "saving" && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {saveStatus === "saved" && <Check className="w-3.5 h-3.5" />}
              {saveStatus === "idle" && <Plus className="w-3.5 h-3.5" />}
              {saveStatus === "saved" ? "Created!" : "Create Account"}
            </Button>
          </div>
        </div>
      )}

      {/* Owner Table */}
      <div
        className="bg-white overflow-hidden"
        style={{ border: "1px solid #e0e0e0", borderRadius: 10 }}
      >
        {owners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#b0b0b0]">
            <Store className="w-10 h-10 mb-3" />
            <p className="text-sm">No owner accounts yet.</p>
            <p className="text-xs mt-1">Click "Add Owner" to create one.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #e0e0e0",
                  background: "#fafafa",
                }}
              >
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8a8a] uppercase tracking-wide">
                  Shop
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8a8a] uppercase tracking-wide">
                  Owner Email
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8a8a] uppercase tracking-wide">
                  Slug
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8a8a] uppercase tracking-wide">
                  Created
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {owners.map((owner) => (
                <tr
                  key={owner.id}
                  style={{ borderBottom: "1px solid #f0f0f0" }}
                  className="hover:bg-[#fafafa] transition-colors"
                >
                  {/* Shop */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 flex items-center justify-center overflow-hidden shrink-0"
                        style={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 8,
                          background: "#f5f5f5",
                        }}
                      >
                        {owner.logo_url ? (
                          <img
                            src={owner.logo_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-4 h-4 text-[#c0c0c0]" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-[#2c2c2c]">
                        {owner.name}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-3.5 text-sm text-[#5a5a5a]">
                    {owner.owner_email}
                  </td>

                  {/* Slug */}
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs font-mono text-[#8a8a8a] px-2 py-0.5"
                      style={{
                        background: "#f0f0f0",
                        borderRadius: 6,
                      }}
                    >
                      {owner.slug}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-5 py-3.5 text-sm text-[#8a8a8a]">
                    {new Date(owner.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(owner.id, owner.name)}
                      className="w-7 h-7 flex items-center justify-center text-[#c0c0c0] hover:text-red-500 hover:bg-red-50 transition-colors ml-auto"
                      style={{ borderRadius: 6 }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── System Panel ───────────────────────────────────────────────────────────
function SystemPanel() {
  const handleReset = async () => {
    if (
      !confirm(
        "Reset ALL data? This deletes every tenant, user, and order. Cannot be undone.",
      )
    )
      return;
    await resetAllData();
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-[#2c2c2c] font-heading mb-8">
        System
      </h1>

      <div
        className="bg-white p-5"
        style={{ border: "1px solid #e0e0e0", borderRadius: 10 }}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-[#2c2c2c]">
              Reset All Data
            </p>
            <p className="text-sm text-[#8a8a8a] mt-1">
              Permanently delete all tenants, users, orders, and associated
              data. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shrink-0"
            style={{ borderRadius: 8 }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
