import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Shield, UserCheck, UserX, CreditCard as Edit3, Plus } from 'lucide-react';
import { db } from '../lib/database';
import { User as UserType, User } from '../types/database';
import { UserModal } from '../components/admin/UserModal';
import clsx from 'clsx';

export function PeoplePage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | undefined>();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const users = await db.getUsers();
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'staff': return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="w-8 h-8 mr-3 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">People Directory</h1>
            <p className="text-gray-600">{filteredUsers.length} people in the system</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setSelectedUser(undefined);
            setShowUserModal(true);
          }}
          className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all transform hover:scale-105 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Person
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search people by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <span className={clsx('inline-flex px-2 py-1 text-xs font-medium rounded-full border', getRoleColor(user.role))}>
                    {user.role}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center">
                {user.active ? (
                  <UserCheck className="w-5 h-5 text-green-600" />
                ) : (
                  <UserX className="w-5 h-5 text-red-600" />
                )}
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowUserModal(true);
                  }}
                  className="ml-2 p-1 hover:bg-gray-100 rounded-lg transition-colors" title="Edit"
                >
                  <Edit3 className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {user.email}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Shield className="w-4 h-4 mr-2" />
                {user.role} access level
              </div>

              <div className="text-xs text-gray-500">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <strong>Mention:</strong> @{user.name.toLowerCase().replace(/\s+/g, '')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-30 text-indigo-600" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No matching people found' : 'No people found'}
          </h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search terms' : 'People will appear here once they are added to the system.'}
          </p>
        </div>
      )}
      
      {/* User Modal */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(undefined);
        }}
        user={selectedUser}
        onUserSaved={() => {
          fetchUsers();
          setShowUserModal(false);
          setSelectedUser(undefined);
        }}
      />
    </div>
  );
}