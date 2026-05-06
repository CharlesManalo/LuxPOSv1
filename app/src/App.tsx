import { Routes, Route, Navigate } from "react-router";
import { useNavigate } from "react-router";
import { Shield, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { LoginPage } from "@/pages/LoginPage";
import { AdminPage } from "@/pages/AdminPage";
import { CashierPage } from "@/pages/CashierPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { useAuth } from "@/hooks/useAuth";
import type { AppUser } from "@/types";

function AdminButton({ currentUser }: { currentUser: AppUser | null }) {
  const navigate = useNavigate();

  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "owner")
  ) {
    return null;
  }

  return (
    <button
      onClick={() => navigate("/admin")}
      className="fixed top-4 left-4 z-50 w-12 h-12 rounded-full bg-[#2c2c2c] flex items-center justify-center hover:bg-[#1a1a1a] transition-all shadow-lg hover:shadow-xl"
      title="Admin Panel"
    >
      <Shield className="w-6 h-6 text-white" />
    </button>
  );
}

function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);

    // Clear all LuxPOS and Supabase related localStorage items
    Object.keys(localStorage)
      .filter((k) => k.includes("luxpos") || k.includes("sb-"))
      .forEach((k) => localStorage.removeItem(k));

    // Force page reload
    setTimeout(() => {
      location.reload();
    }, 500);
  };

  return (
    <button
      onClick={handleRefresh}
      className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-[#ff9e2c] flex items-center justify-center hover:bg-[#ff8800] transition-all shadow-lg hover:shadow-xl md:w-14 md:h-14"
      title="Force Refresh"
      disabled={isRefreshing}
    >
      <RefreshCw
        className={`w-5 h-5 text-white md:w-6 md:h-6 ${isRefreshing ? "animate-spin" : ""}`}
      />
    </button>
  );
}

function App() {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setForceReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading && !forceReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f5f5f5" }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff9e2c]/30 border-t-[#ff9e2c] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-heading">
            Loading LuxPOS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminButton currentUser={currentUser} />
      <RefreshButton />
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getRedirectPath(currentUser?.role)} replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "owner"]}
              userRole={currentUser?.role}
            >
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["owner", "tenant"]}
              userRole={currentUser?.role}
            >
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier"
          element={
            <ProtectedRoute
              allowedRoles={["cashier", "admin", "owner"]}
              userRole={currentUser?.role}
            >
              <CashierPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <Navigate
              to={
                isAuthenticated ? getRedirectPath(currentUser?.role) : "/login"
              }
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

function ProtectedRoute({
  children,
  allowedRoles,
  userRole,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
  userRole?: string;
}) {
  if (!userRole) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={getRedirectPath(userRole)} replace />;
  }
  return <>{children}</>;
}

function getRedirectPath(role?: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "owner":
    case "tenant":
      return "/dashboard";
    case "cashier":
      return "/cashier";
    default:
      return "/login";
  }
}

export default App;
