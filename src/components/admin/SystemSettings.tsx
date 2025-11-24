import React, { useState, useEffect } from 'react';
import { Save, Mail, Database, Shield, Bell, Scale, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db } from '../../lib/database';

export function SystemSettings() {
  const [systemConfig, setSystemConfigState] = useState({
    legalDepartments: [],
    dealBusinessNatures: [],
    realEstateBusinessNatures: [],
    cityApprovals: []
  });
  const [newDepartment, setNewDepartment] = useState('');
  const [newDealNature, setNewDealNature] = useState('');
  const [newRealEstateNature, setNewRealEstateNature] = useState('');
  const [newCityApproval, setNewCityApproval] = useState('');
  
  const [settings, setSettings] = useState({
    emailEnabled: true,
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    backupEnabled: true,
    backupFrequency: 'daily',
    sessionTimeout: '480', // 8 hours in minutes
    forcePasswordChange: true,
    combinedKanban: {
      legal: true,
      deals: true,
      realEstate: true,
      others: true,
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      const config = await db.getSystemConfig();
      setSystemConfigState(config);
    } catch (error) {
      console.error('Error fetching system config:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Save system configuration
      await db.setSystemConfig(systemConfig);
      
      // Simulate saving other settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = () => {
    if (newDepartment.trim() && !systemConfig.legalDepartments.includes(newDepartment.trim())) {
      setSystemConfigState(prev => ({
        ...prev,
        legalDepartments: [...prev.legalDepartments, newDepartment.trim()]
      }));
      setNewDepartment('');
    }
  };

  const removeDepartment = (department: string) => {
    setSystemConfigState(prev => ({
      ...prev,
      legalDepartments: prev.legalDepartments.filter(d => d !== department)
    }));
  };

  const addDealNature = () => {
    if (newDealNature.trim() && !systemConfig.dealBusinessNatures.includes(newDealNature.trim())) {
      setSystemConfigState(prev => ({
        ...prev,
        dealBusinessNatures: [...prev.dealBusinessNatures, newDealNature.trim()]
      }));
      setNewDealNature('');
    }
  };

  const removeDealNature = (nature: string) => {
    setSystemConfigState(prev => ({
      ...prev,
      dealBusinessNatures: prev.dealBusinessNatures.filter(n => n !== nature)
    }));
  };

  const addRealEstateNature = () => {
    if (newRealEstateNature.trim() && !systemConfig.realEstateBusinessNatures.includes(newRealEstateNature.trim())) {
      setSystemConfigState(prev => ({
        ...prev,
        realEstateBusinessNatures: [...prev.realEstateBusinessNatures, newRealEstateNature.trim()]
      }));
      setNewRealEstateNature('');
    }
  };

  const removeRealEstateNature = (nature: string) => {
    setSystemConfigState(prev => ({
      ...prev,
      realEstateBusinessNatures: prev.realEstateBusinessNatures.filter(n => n !== nature)
    }));
  };

  const addCityApproval = () => {
    if (newCityApproval.trim() && !systemConfig.cityApprovals.includes(newCityApproval.trim())) {
      setSystemConfigState(prev => ({
        ...prev,
        cityApprovals: [...prev.cityApprovals, newCityApproval.trim()]
      }));
      setNewCityApproval('');
    }
  };

  const removeCityApproval = (approval: string) => {
    setSystemConfigState(prev => ({
      ...prev,
      cityApprovals: prev.cityApprovals.filter(a => a !== approval)
    }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">Configure global system preferences</p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 transition-all transform hover:scale-105 flex items-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Mail className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Email Configuration</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="ml-3 text-sm text-gray-700">Enable email notifications</span>
            </label>

            {settings.emailEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                  <input
                    type="text"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                  <input
                    type="password"
                    value={settings.smtpPassword}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.forcePasswordChange}
                onChange={(e) => setSettings(prev => ({ ...prev, forcePasswordChange: e.target.checked }))}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="ml-3 text-sm text-gray-700">Force password change on first login</span>
            </label>
          </div>
        </div>

        {/* Legal Departments Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Scale className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Legal Departments Management</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add New Department</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDepartment()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter department name..."
                />
                <button
                  type="button"
                  onClick={addDepartment}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Departments</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {systemConfig.legalDepartments.map((department, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-900">{department}</span>
                    <button
                      type="button"
                      onClick={() => removeDepartment(department)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {systemConfig.legalDepartments.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No departments configured</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Bell className="w-6 h-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Feature Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Combined Kanban Boards</h4>
              <div className="space-y-2">
                {Object.entries(settings.combinedKanban).map(([section, enabled]) => (
                  <label key={section} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        combinedKanban: { ...prev.combinedKanban, [section]: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 capitalize">
                      {section === 'realEstate' ? 'Real Estate' : section}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Backup Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Backup & Data</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.backupEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, backupEnabled: e.target.checked }))}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="ml-3 text-sm text-gray-700">Enable automatic backups</span>
            </label>

            {settings.backupEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}