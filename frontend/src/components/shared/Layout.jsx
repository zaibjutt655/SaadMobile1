import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/',          label: 'Dashboard',   icon: '📊', roles: ['owner','manager'] },
  { to: '/sales',     label: 'Sales',       icon: '🛒', roles: ['owner','manager'] },
  { to: '/purchases', label: 'Purchases',   icon: '📦', roles: ['owner','manager'] },
  { to: '/products',  label: 'Products',    icon: '🏷️', roles: ['owner','manager'] },
  { to: '/mobiles',   label: 'Used Mobiles',icon: '📱', roles: ['owner','manager'] },
  { to: '/services',  label: 'Services',    icon: '🔧', roles: ['owner','manager'] },
  { to: '/customers', label: 'Customers',   icon: '👥', roles: ['owner','manager'] },
  { to: '/expenses',  label: 'Expenses',    icon: '💳', roles: ['owner','manager'] },
  { to: '/reports',   label: 'Reports',     icon: '📈', roles: ['owner','manager'] },
  { to: '/staff',     label: 'Staff',       icon: '👤', roles: ['owner','manager'] },
  { to: '/audit',     label: 'Audit Log',   icon: '🔍', roles: ['owner','manager'] },
  { to: '/knowledge', label: 'Help',        icon: '❓', roles: ['owner','manager','seller'] },
];

export default function Layout() {
  const { user, logout, isOwner } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-20 lg:hidden"
             onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col
        transform transition-transform duration-300 shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="text-2xl bg-white bg-opacity-20 p-2 rounded-xl backdrop-blur">📱</div>
          <div>
            <div className="font-bold text-base leading-tight">Mobile Shop</div>
            <div className="text-xs text-white text-opacity-80 capitalize flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {user?.role}
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {visibleNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mb-1 text-sm rounded-xl transition-all duration-200
                 ${isActive
                   ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                   : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:translate-x-1'}`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-gray-700 bg-gray-900 bg-opacity-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-lg font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 truncate">@{user?.username}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-sm bg-red-600 hover:bg-red-700 text-white
                       px-4 py-2 rounded-lg transition-all duration-200 font-medium
                       hover:shadow-lg transform hover:-translate-y-0.5">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white border-b shadow-sm px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 text-2xl hover:text-indigo-600 transition-colors">☰</button>
          <span className="font-bold text-gray-800 text-lg">Mobile Shop</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
