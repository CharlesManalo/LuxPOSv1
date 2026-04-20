import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Coffee, Store, Shield, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/stores/useStore";
import { getTenant } from "@/lib/mockDb";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const { login, error, isLoading } = useAuth();
  const { setCurrentTenant, setCurrentBranch, setBranches } = useStore();

  const [email, setEmail] = useState(() => {
    if (roleParam === "owner") return "juan@silogan.ph";
    if (roleParam === "admin") return "admin@luxpos.app";
    return "maria@silogan.ph";
  });
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState<"cashier" | "owner" | "admin">(
    () => {
      if (roleParam === "owner") return "owner";
      if (roleParam === "admin") return "admin";
      return "cashier";
    },
  );

  const handleRoleChange = (role: "cashier" | "owner" | "admin") => {
    setActiveRole(role);
    if (role === "admin") setEmail("admin@luxpos.app");
    else if (role === "owner") setEmail("juan@silogan.ph");
    else setEmail("maria@silogan.ph");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      // Get user data from store after login
      const stored = localStorage.getItem("luxpos_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === "admin") {
          navigate("/admin");
        } else if (user.role === "owner") {
          const tenant = await getTenant(user.tenant_id);
          if (tenant) setCurrentTenant(tenant);
          navigate("/dashboard");
        } else {
          const tenant = await getTenant(user.tenant_id);
          if (tenant) {
            setCurrentTenant(tenant);
            setBranches([]);
            const { getBranches } = await import("@/lib/mockDb");
            const branches = await getBranches(user.tenant_id);
            setBranches(branches);
            const userBranch = branches.find(
              (b: { id: string }) => b.id === user.branch_id,
            );
            if (userBranch) setCurrentBranch(userBranch);
          }
          navigate("/cashier");
        }
      }
    }
  };

  const roleConfig = {
    cashier: {
      icon: Coffee,
      label: "Cashier Login",
      color: "bg-accent-orange",
      desc: "Access the POS system",
    },
    owner: {
      icon: Store,
      label: "Owner Login",
      color: "bg-success-green",
      desc: "Manage your business",
    },
    admin: {
      icon: Shield,
      label: "Admin Access",
      color: "bg-[#2c2c2c]",
      desc: "System administration",
    },
  };

  const config = roleConfig[activeRole];
  const Icon = config.icon;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#f5f5f5" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-orange shadow-float mb-4">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#2c2c2c] font-heading">
            LuxPOS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Restaurant Management System
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-2 mb-6 p-1 bg-white rounded-full shadow-sm">
          {(["cashier", "owner", "admin"] as const).map((role) => {
            const RoleIcon = roleConfig[role].icon;
            return (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeRole === role
                    ? `${roleConfig[role].color} text-white shadow-md`
                    : "text-muted-foreground hover:text-[#2c2c2c]"
                }`}
              >
                <RoleIcon className="w-4 h-4" />
                <span className="hidden sm:inline capitalize">{role}</span>
              </button>
            );
          })}
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#2c2c2c] font-heading">
                {config.label}
              </h2>
              <p className="text-xs text-muted-foreground">{config.desc}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#2c2c2c] mb-1.5 block">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-[#e0e0e0] focus:border-[#ff9e2c] focus:ring-[#ff9e2c]/20 text-base"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#2c2c2c] mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-[#e0e0e0] focus:border-[#ff9e2c] focus:ring-[#ff9e2c]/20 text-base pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#2c2c2c]"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full h-12 rounded-full ${config.color} hover:opacity-90 text-white font-semibold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-4 border-t border-[#e0e0e0]">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Demo credentials
            </p>
            <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => handleRoleChange("cashier")}
                className="text-left px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors"
              >
                <span className="font-medium text-[#ff9e2c]">Cashier:</span>{" "}
                maria@silogan.ph
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("tenant")}
                className="text-left px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors"
              >
                <span className="font-medium text-[#00c29f]">Tenant:</span>{" "}
                juan@silogan.ph
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("super_admin")}
                className="text-left px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors"
              >
                <span className="font-medium text-[#2c2c2c]">Super Admin:</span>{" "}
                admin@luxpos.app
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
