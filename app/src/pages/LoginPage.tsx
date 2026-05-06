import { useState } from "react";
import { useNavigate } from "react-router";
import { Coffee, Store, Shield, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/stores/useStore";
import { getTenant } from "@/lib/supabaseDb";
import { useToast } from "@/components/ui/toast";
import type { UserRole } from "@/types";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, error, isLoading } = useAuth();
  const { setCurrentTenant } = useStore();
  const { showToast, ToastContainer } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>("cashier");

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setEmail(""); // Clear email when switching roles
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isLoading) return;

    // Validate inputs
    if (!email.trim()) {
      showToast("Please enter your email address", "error");
      return;
    }
    if (!password.trim()) {
      showToast("Please enter your password", "error");
      return;
    }

    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      showToast("Login successful!", "success");
      // Wait for auth state to update and then navigate
      setTimeout(async () => {
        const { currentUser } = useStore.getState();
        if (currentUser) {
          if (currentUser.role === "admin") {
            navigate("/admin");
          } else if (
            currentUser.role === "owner" ||
            currentUser.role === "tenant"
          ) {
            const tenant = await getTenant(currentUser.tenant_id);
            if (tenant) setCurrentTenant(tenant);
            navigate("/dashboard");
          } else {
            const tenant = await getTenant(currentUser.tenant_id);
            if (tenant) setCurrentTenant(tenant);
            navigate("/cashier");
          }
        }
      }, 100);
    } else if (error) {
      // Show specific error message based on the error
      if (
        error.includes("Invalid login credentials") ||
        error.includes("Incorrect email or password")
      ) {
        showToast("Incorrect email or password. Please try again.", "error");
      } else if (error.includes("Email not confirmed")) {
        showToast("Please confirm your email before logging in.", "warning");
      } else {
        showToast(error, "error");
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
    tenant: {
      icon: Store,
      label: "Tenant Login",
      color: "bg-success-green",
      desc: "Manage your business",
    },
  };

  const config = roleConfig[activeRole];
  const Icon = config.icon;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#f5f5f5" }}
    >
      {/* ── Admin shortcut — fixed top-left ── */}
      <button
        onClick={() => handleRoleChange("admin")}
        className={`fixed top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
          activeRole === "admin"
            ? "bg-[#2c2c2c] text-white border-[#2c2c2c]"
            : "bg-white text-[#5a5a5a] border-[#e0e0e0] hover:border-[#2c2c2c] hover:text-[#2c2c2c]"
        }`}
      >
        <Shield className="w-4 h-4" />
        <span>Admin</span>
      </button>

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

        {/* Role Selector — cashier / owner only */}
        <div className="flex gap-2 mb-6 p-1 bg-white rounded-full shadow-sm">
          {(["cashier", "owner"] as const).map((role) => {
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-12 rounded-full ${config.color} hover:opacity-90 text-white font-semibold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
