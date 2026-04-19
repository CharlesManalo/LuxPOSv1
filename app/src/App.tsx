import { Routes, Route, Navigate } from 'react-router';
import { LoginPage } from '@/pages/LoginPage';
import { AdminPage } from '@/pages/AdminPage';
import { CashierPage } from '@/pages/CashierPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f5' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff9e2c]/30 border-t-[#ff9e2c] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-heading">Loading LuxPOS...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={getRedirectPath(currentUser?.role)} replace /> : <LoginPage />
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin', 'owner']} userRole={currentUser?.role}>
          <AdminPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['owner', 'admin']} userRole={currentUser?.role}>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/cashier" element={
        <ProtectedRoute allowedRoles={['cashier', 'admin', 'owner']} userRole={currentUser?.role}>
          <CashierPage />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to={isAuthenticated ? getRedirectPath(currentUser?.role) : '/login'} replace />} />
    </Routes>
  );
}

function ProtectedRoute({
  children, allowedRoles, userRole,
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
    case 'admin': return '/admin';
    case 'owner': return '/dashboard';
    case 'cashier': return '/cashier';
    default: return '/login';
  }
}

export default App;
