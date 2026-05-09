import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import ProductsPage    from './pages/ProductsPage';
import MobilesPage     from './pages/MobilesPage';
import SalesPage       from './pages/SalesPage';
import PurchasesPage   from './pages/PurchasesPage';
import ServicesPage    from './pages/ServicesPage';
import CustomersPage   from './pages/CustomersPage';
import ReportsPage     from './pages/ReportsPage';
import StaffPage       from './pages/StaffPage';
import ExpensesPage    from './pages/ExpensesPage';
import AuditPage       from './pages/AuditPage';
import KnowledgePage   from './pages/KnowledgePage';
import SellerPage      from './pages/SellerPage';
import Layout          from './components/shared/Layout';

// ─── ROUTE GUARDS ─────────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

// ─── APP ROUTER ───────────────────────────────────────────────────────────────
const AppRoutes = () => {
  const { user } = useAuth();

  // Sellers get their own simplified interface
  if (user?.role === 'seller') {
    return (
      <Routes>
        <Route path="/"          element={<PrivateRoute><SellerPage /></PrivateRoute>} />
        <Route path="/knowledge" element={<PrivateRoute><KnowledgePage /></PrivateRoute>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index          element={<DashboardPage />} />
        <Route path="products"  element={<ProductsPage />} />
        <Route path="mobiles"   element={<MobilesPage />} />
        <Route path="sales"     element={<SalesPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="services"  element={<ServicesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="reports"   element={
          <RoleRoute roles={['owner', 'manager']}><ReportsPage /></RoleRoute>
        } />
        <Route path="staff"     element={
          <RoleRoute roles={['owner', 'manager']}><StaffPage /></RoleRoute>
        } />
        <Route path="expenses"  element={
          <RoleRoute roles={['owner', 'manager']}><ExpensesPage /></RoleRoute>
        } />
        <Route path="audit"     element={
          <RoleRoute roles={['owner', 'manager']}><AuditPage /></RoleRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '14px', maxWidth: '360px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
