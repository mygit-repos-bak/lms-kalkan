import React, { useState } from 'react';
import { Users, Settings, Shield, Database, Download } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { SystemSettings } from './SystemSettings';
import clsx from 'clsx';

const adminTabs = [
  { id: 'users', name: 'User Management', icon: Users },
  { id: 'settings', name: 'System Settings', icon: Settings },
  { id: 'permissions', name: 'Roles & Permissions', icon: Shield },
  { id: 'data', name: 'Data Management', icon: Database },
];

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SystemSettings />;
      case 'permissions':
        return <div className="p-8 text-center text-gray-500">Roles & Permissions management coming soon...</div>;
      case 'data':
        return <div className="p-8 text-center text-gray-500">Data management tools coming soon...</div>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-600">System administration</p>
        </div>

        <nav className="p-4 space-y-2">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all',
                activeTab === tab.id
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <tab.icon className="w-5 h-5 mr-3" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}