import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import Kanban from './pages/Kanban';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Calendar from './pages/Calendar';
import Contracts from './pages/Contracts';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Marketing from './pages/Marketing';
import PortalSettings from './pages/PortalSettings';
import PortalJobs from './pages/PortalJobs';
import Settings from './pages/Settings';
import Users from './pages/Users';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="listings" element={<Listings />} />
            <Route path="listings/:id" element={<ListingDetail />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="kanban" element={<Kanban />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="portal-settings" element={<PortalSettings />} />
            <Route path="portal-jobs" element={<PortalJobs />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<Users />} />
          </Route>
          <Route path="/" element={<Marketing />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
