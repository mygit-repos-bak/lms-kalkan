import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Scale, 
  Handshake, 
  Building, 
  MoreHorizontal, 
  Users,
  Calendar,
  LogOut,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

const navigation = [
  { name: 'Legal Fights', href: '/legal', icon: Scale, color: 'text-red-600' },
  { name: 'Business Deals', href: '/deals', icon: Handshake, color: 'text-green-600' },
  { name: 'Real Estate', href: '/real-estate', icon: Building, color: 'text-blue-600' },
  { name: 'Others', href: '/others', icon: MoreHorizontal, color: 'text-purple-600' },
  { name: 'People', href: '/people', icon: Users, color: 'text-indigo-600' },
  { name: 'Calendar', href: '/calendar', icon: Calendar, color: 'text-amber-600' },
];

const adminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: Settings, color: 'text-gray-600' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className={clsx(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={clsx(
        "border-b border-gray-200 flex items-center",
        collapsed ? "p-4 justify-center" : "p-6"
      )}>
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
        
        {!collapsed && (
          <div className="flex items-center ml-3">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">LegalFlow</h1>
              <p className="text-xs text-gray-500">Management Platform</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={clsx(
        "flex-1 space-y-2",
        collapsed ? "p-2" : "p-4"
      )}>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            title={collapsed ? item.name : undefined}
            className={({ isActive }) =>
              clsx(
                'flex items-center text-sm font-medium rounded-lg transition-all hover:bg-gray-50',
                collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
                isActive
                  ? 'bg-amber-50 text-amber-700 border-r-2 border-amber-600'
                  : 'text-gray-700 hover:text-gray-900'
              )
            }
          >
            <item.icon className={clsx('w-5 h-5', item.color, !collapsed && 'mr-3')} />
            {!collapsed && item.name}
          </NavLink>
        ))}
        
        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <div className={clsx(
              "border-t border-gray-200 my-4",
              collapsed && "mx-2"
            )}></div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                title={collapsed ? item.name : undefined}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center text-sm font-medium rounded-lg transition-all hover:bg-gray-50',
                    collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
                    isActive
                      ? 'bg-amber-50 text-amber-700 border-r-2 border-amber-600'
                      : 'text-gray-700 hover:text-gray-900'
                  )
                }
              >
                <item.icon className={clsx('w-5 h-5', item.color, !collapsed && 'mr-3')} />
                {!collapsed && item.name}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User Info */}
      <div className={clsx(
        "border-t border-gray-200",
        collapsed ? "p-2" : "p-4"
      )}>
        <div className={clsx(
          "flex items-center mb-3",
          collapsed && "justify-center"
        )}>
          <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</p>
            </div>
          )}
        </div>
        
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign Out" : undefined}
          className={clsx(
            "flex items-center text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors",
            collapsed ? "w-full justify-center px-3 py-2" : "w-full px-3 py-2"
          )}
        >
          <LogOut className={clsx('w-4 h-4', !collapsed && 'mr-2')} />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  );
}