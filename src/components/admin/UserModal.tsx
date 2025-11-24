import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db } from '../../lib/database';
import { User as UserType } from '../../types/database';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserType;
  onUserSaved: () => void;
}

export function UserModal({ isOpen, onClose, user, onUserSaved }: UserModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff' as const,
    active: true
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active
        });
      } else {
        setFormData({
          name: '',
          email: '',
          role: 'staff',
          active: true
        });
      }
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and Email are required.');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: formData.active,
        notification_prefs: {
          email: true,
          in_app: true,
          mentions: true,
          assignments: true
        },
        force_password_change: false,
        timezone: 'America/New_York'
      };

      if (user) {
        await db.updateUser(user.id, userData);
        toast.success('User updated successfully');
      } else {
        await db.createUser(userData);
        toast.success('User created successfully');
      }

      onUserSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving user:', error);
      
      // Handle specific error cases
      if (error.message?.includes('User already registered') || error.message?.includes('user_already_exists')) {
        toast.error('A user with this email already exists. Please use a different email address.');
      } else if (error.message?.includes('row-level security policy')) {
        toast.error('Permission denied. Please contact your system administrator.');
      } else {
        toast.error(error.message || 'Failed to save user');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="user-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter full name..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter email address..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active user</span>
            </label>
          </div>
        </form>

        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim() || !formData.email.trim()}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
          </button>
        </div>
      </div>
    </div>
  );
}