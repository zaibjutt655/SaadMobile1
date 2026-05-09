import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/',          label: 'Dashboard',    icon: '📊', roles: ['owner','manager'] },
  { to: '/sales',     label: 'Sales',        icon: '🛒', roles: ['owner','manager'] },
  { to: '/purchases', label: 'Purchases',    icon: '📦', roles: ['owner','manager'] },
  { to: '/products',  label: 'Products',     icon: '🏷️', roles: ['owner','manager'] },
  { to: '/mobiles',   label: 'Used Mobiles', icon: '📱', roles: ['owner','manager'] },
  { to: '/services',  label: 'Services',     icon: '🔧', roles: ['owner','manager'] },
  { to: '/customers', label: 'Customers',    icon: '👥', roles: ['owner','manager'] },
  { to: '/expenses',  label: 'Expenses',     icon: '💳', roles: ['owner','manager'] },
  { to: '/reports',   label: 'Reports',      icon: '📈', roles: ['owner','manager'] },
  { to: '/staff',     label: 'Staff',        icon: '👤', roles: ['owner','manager'] },
  { to: '/audit',     label: 'Audit Log',    icon: '🔍', roles: ['owner','manager'] },
  { to: '/knowledge', label: 'Help',         icon: '❓', roles: ['owner','manager','seller'] },
];

// Bottom nav mein sirf 5 most used items
const bottomNavItems = [
  { to: '/',          label: 'Dashboard', icon: '📊', roles: ['owner','manager'] },
  { to: '/sales',     label: 'Sales',     icon: '🛒', roles: ['owner','manager'] },
  { to: '/products',  label: 'Products',  icon: '🏷️', roles: ['owner','manager'] },
  { to: '/purchases', label: 'Purchases', icon: '📦', roles: ['owner','manager'] },
  { to: '/customers', label: 'Customers', icon: '👥', roles: ['owner','manager'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role));
  const visibleBottom = bottomNavItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR (Desktop always visible, Mobile slide-in) ─── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
        text-white flex flex-col shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600 shrink-0">
          <div className="text-2xl bg-white bg-opacity-20 p-2 rounded-xl">📱</div>
          <div>
            <div className="font-bold text-base leading-tight">Mobile Shop</div>
            <div className="text-xs text-white text-opacity-80 capitalize flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {user?.role}
            </div>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-white text-opacity-70 hover:text-opacity-100 text-xl"
          >✕</button>
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
                `flex items-center gap-3 px-4 py-2.5 mb-0.5 text-sm rounded-xl transition-all duration-200
                 ${isActive
                   ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                   : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
              }
            >
              <span className="text-lg w-6 text-center">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-gray-700 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 truncate">@{user?.username}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Top bar - mobile only */}
        <header className="lg:hidden bg-white border-b shadow-sm px-4 py-3 flex items-center gap-3 shrink-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 text-2xl hover:text-indigo-600 transition-colors p-1"
          >☰</button>
          <span className="font-bold text-gray-800">📱 Mobile Shop</span>
          {/* User avatar top right */}
          <div className="ml-auto w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-xs text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>

        {/* ─── BOTTOM NAV - Mobile only ─── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10 safe-area-inset-bottom">
          <div className="flex items-center justify-around px-1 py-1">
            {visibleBottom.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl flex-1 transition-all
                   ${isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`text-xl leading-none transition-transform ${isActive ? 'scale-110' : ''}`}>
                      {item.icon}
                    </span>
                    <span className={`text-xs font-medium leading-none ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5"></span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
            {/* More button - opens sidebar */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl flex-1 text-gray-500"
            >
              <span className="text-xl leading-none">☰</span>
              <span className="text-xs font-medium leading-none">More</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
