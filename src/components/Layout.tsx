import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  KanbanSquare, 
  CalendarDays, 
  Menu, 
  X,
  Bell,
  Search,
  UserCircle,
  FileText,
  PieChart,
  Plug,
  ListChecks,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: Building2, label: 'İlanlar', path: '/app/listings' },
  { icon: Users, label: 'Müşteriler', path: '/app/customers' },
  { icon: KanbanSquare, label: 'Satış Panosu', path: '/app/kanban' },
  { icon: CalendarDays, label: 'Takvim', path: '/app/calendar' },
  { icon: FileText, label: 'Sözleşmeler', path: '/app/contracts' },
  { icon: PieChart, label: 'Raporlar & Prim', path: '/app/reports', permission: 'rapor:view:own' },
  { icon: Plug, label: 'Portal Ayarları', path: '/app/portal-settings' },
  { icon: ListChecks, label: 'Portal Kuyruğu', path: '/app/portal-jobs' },
  { icon: Users, label: 'Kullanıcılar', path: '/app/users', permission: 'user:manage:branch' },
  { icon: UserCircle, label: 'Ayarlar', path: '/app/settings', permission: 'settings:manage' }
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const visibleNavItems = navItems.filter((item) => !item.permission || hasPermission(item.permission));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">EmlakCRM Pro</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 h-[100dvh] bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-50 shadow-2xl md:shadow-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        sidebarCollapsed ? "w-20" : "w-72"
      )}>
        <div className={cn(
          "hidden md:flex border-b border-slate-100",
          sidebarCollapsed ? "flex-col items-center gap-2 p-4" : "items-center gap-3 p-6"
        )}>
          <div className="bg-indigo-600 p-2 rounded-xl shadow-sm shadow-indigo-200">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-2xl text-slate-900 tracking-tight">EmlakCRM</span>
          )}
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className={cn(
              "p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors",
              sidebarCollapsed ? "mt-1" : "ml-auto"
            )}
            title={sidebarCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                "group-hover:text-indigo-600"
              )} />
              {!sidebarCollapsed && item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className={cn(
            "flex items-center px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-sm border border-indigo-200">
                {user?.initials || 'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">{user?.name || 'Kullanıcı'}</span>
                  <span className="text-xs text-slate-500 font-medium">{user?.title || 'Danışman'}</span>
                </div>
              )}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="hidden md:flex bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center bg-slate-100/80 hover:bg-slate-100 border border-slate-200/50 rounded-xl px-3 py-2 w-96 transition-colors focus-within:bg-white focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="İlan, müşteri veya görev ara..." 
              className="bg-transparent border-none focus:outline-none ml-2 w-full text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
