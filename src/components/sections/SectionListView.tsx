import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Grid3x3 as Grid3X3, List, MoreVertical, Calendar, User, Tag, AlertCircle, Download, Upload, ChevronDown, Edit, Trash2 } from 'lucide-react';
import { db } from '../../lib/database';
import { toast } from 'react-hot-toast';
import { Item, User as UserType, Tag as TagType } from '../../types/database';
import ItemModal from '../items/ItemModal';
import { KanbanBoard } from '../kanban/KanbanBoard';
import clsx from 'clsx';
import { usePermissions } from '../../hooks/usePermissions';

interface SectionListViewProps {
  sectionId: string;
  sectionName: string;
  icon: React.ComponentType<any>;
  color: string;
}

export function SectionListView({ sectionId, sectionName, icon: Icon, color }: SectionListViewProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<UserType[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const [systemConfig, setSystemConfig] = useState<any>({
    legalDepartments: [],
    dealBusinessNatures: [],
    realEstateBusinessNatures: [],
    cityApprovals: []
  });
  const { canCreateItem } = usePermissions();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    assignees: [] as string[],
    tags: [] as string[],
    selectedTag: '' as string, // For dashboard tag buttons
    selectedDepartment: '' as string, // For dashboard department buttons
    selectedAssignee: '' as string, // For dashboard assignee buttons
    dateRange: { start: '', end: '' }
  });

  useEffect(() => {
    fetchItems();
    fetchUsers();
    fetchTags();
    fetchSystemConfig();
  }, [sectionId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (openMenuId && !target.closest('.dropdown-menu')) {
        setOpenMenuId(null);
      }

      if (showExportMenu && !target.closest('.export-menu')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId, showExportMenu]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      const items = await db.getItems(sectionId);
      setItems(items);
      console.log(`📊 Loaded ${items.length} items for section ${sectionId}`);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items from database');
      setItems([]); // Set empty array if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await db.getUsers();
      setUsers(users);
      console.log(`👥 Loaded ${users.length} users`);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]); // Set empty array if fetch fails
    }
  };

  const fetchTags = async () => {
    try {
      const tags = await db.getTags();
      setTags(tags);
      console.log(`🏷️ Loaded ${tags.length} tags`);
    } catch (error) {
      console.error('Error fetching tags:', error);
      // Set empty array if fetch fails and show user-friendly message
      setTags([]);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error('Unable to connect to database. Please check your connection and try again.');
      } else {
        toast.error('Failed to load tags');
      }
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const config = await db.getSystemConfig();
      setSystemConfig(config);
    } catch (error) {
      console.error('Error fetching system config:', error);
      // Keep default empty config if fetch fails
    }
  };

  const filteredItems = items.filter(item => {
    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesText = 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.assignees?.some(a => a.name.toLowerCase().includes(query)) ||
        item.tags?.some(t => t.name.toLowerCase().includes(query));
      
      if (!matchesText) return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(item.status)) {
      return false;
    }

    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(item.priority)) {
      return false;
    }

    // Assignee filter
    if (filters.assignees.length > 0) {
      const hasAssignee = item.assignees?.some(a => filters.assignees.includes(a.id));
      if (!hasAssignee) return false;
    }

    // Tag filter
    if (filters.tags.length > 0) {
      const hasTag = item.tags?.some(t => filters.tags.includes(t.id));
      if (!hasTag) return false;
    }

    // Dashboard tag button filter (single tag selection)
    if (filters.selectedTag) {
      const hasSelectedTag = item.tags?.some(t => t.id === filters.selectedTag);
      if (!hasSelectedTag) return false;
    }

    // Dashboard department filter (for legal section)
    if (filters.selectedDepartment && sectionId === 'legal') {
      const hasDepartment = item.legal_meta?.department === filters.selectedDepartment;
      if (!hasDepartment) return false;
    }

    // Dashboard assignee filter (single assignee selection)
    if (filters.selectedAssignee) {
      const hasSelectedAssignee = item.assignees?.some(a => a.id === filters.selectedAssignee);
      if (!hasSelectedAssignee) return false;
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const itemDate = new Date(item.created_at);
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
      
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
    }

    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await db.deleteItem(itemId);
      toast.success('Item deleted successfully');
      fetchItems();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Assignees', 'Due Date', 'Tags'];
    const rows = filteredItems.map(item => [
      item.title,
      item.description,
      item.status,
      item.priority,
      item.assignees?.map(a => a.name).join(', ') || '',
      item.due_date ? new Date(item.due_date).toLocaleDateString() : '',
      item.tags?.map(t => t.name).join(', ') || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sectionName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportMenu(false);
    toast.success('Exported to CSV');
  };

  const exportToExcel = () => {
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Assignees', 'Due Date', 'Tags'];
    const rows = filteredItems.map(item => [
      item.title,
      item.description,
      item.status,
      item.priority,
      item.assignees?.map(a => a.name).join(', ') || '',
      item.due_date ? new Date(item.due_date).toLocaleDateString() : '',
      item.tags?.map(t => t.name).join(', ') || ''
    ]);

    let html = '<table><thead><tr>';
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sectionName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportMenu(false);
    toast.success('Exported to Excel');
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${sectionName} - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1f2937; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: 600; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .priority-urgent { color: #dc2626; font-weight: 600; }
            .priority-high { color: #ea580c; font-weight: 600; }
            .priority-normal { color: #2563eb; }
            .priority-low { color: #6b7280; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${sectionName}</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Items:</strong> ${filteredItems.length}</p>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignees</th>
                <th>Due Date</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.map(item => `
                <tr>
                  <td><strong>${item.title}</strong></td>
                  <td>${item.description}</td>
                  <td>${item.status}</td>
                  <td class="priority-${item.priority}">${item.priority}</td>
                  <td>${item.assignees?.map(a => a.name).join(', ') || 'Unassigned'}</td>
                  <td>${item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No deadline'}</td>
                  <td>${item.tags?.map(t => t.name).join(', ') || 'No tags'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setShowExportMenu(false);
    toast.success('Opening print dialog for PDF export');
  };

  const canCreate = canCreateItem(sectionId);

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
          <Icon className={clsx('w-8 h-8 mr-3', color)} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sectionName}</h1>
            <p className="text-gray-600">{filteredItems.length} items</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all transform hover:scale-105 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New {sectionName.slice(0, -1)}
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center px-4 py-2 border rounded-lg transition-colors',
              showFilters 
                ? 'border-amber-300 bg-amber-50 text-amber-700' 
                : 'border-gray-300 hover:bg-gray-50'
            )}
            title={showFilters ? "Hide Filters" : "Show Filters"}
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            <ChevronDown className={clsx('w-4 h-4 ml-2 transition-transform', showFilters && 'rotate-180')} />
          </button>

          <div className="flex items-center bg-white border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'p-2 rounded-l-lg transition-colors',
                viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
              )}
              title="Table View"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 transition-colors border-x border-gray-200',
                viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
              )}
              title="Grid View"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={clsx(
                'p-2 rounded-r-lg transition-colors',
                viewMode === 'kanban' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
              )}
              title="Kanban View"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${sectionName.toLowerCase()}... (title, description, assignees, tags)`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="relative export-menu">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Export data"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
            <ChevronDown className={clsx('w-4 h-4 ml-2 transition-transform', showExportMenu && 'rotate-180')} />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={exportToPDF}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </button>
              <button
                onClick={exportToExcel}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as Excel
              </button>
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                multiple
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  status: Array.from(e.target.selectedOptions, option => option.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                multiple
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  priority: Array.from(e.target.selectedOptions, option => option.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assignees</label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {users.map(user => (
                  <label key={user.id} className="flex items-center text-sm mb-1">
                    <input
                      type="checkbox"
                      checked={filters.assignees.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, assignees: [...prev.assignees, user.id] }));
                        } else {
                          setFilters(prev => ({ ...prev, assignees: prev.assignees.filter(id => id !== user.id) }));
                        }
                      }}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 mr-2"
                    />
                    {user.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {tags.map(tag => (
                  <label key={tag.id} className="flex items-center text-sm mb-1">
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, tags: [...prev.tags, tag.id] }));
                        } else {
                          setFilters(prev => ({ ...prev, tags: prev.tags.filter(id => id !== tag.id) }));
                        }
                      }}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 mr-2"
                    />
                    <span 
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, start: e.target.value } 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, end: e.target.value } 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="End date"
                />
              </div>

              <button
                onClick={() => setFilters({
                  status: [],
                  priority: [],
                  assignees: [],
                  tags: [],
                  selectedTag: '',
                  selectedDepartment: '',
                  selectedAssignee: '',
                  dateRange: { start: '', end: '' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm mt-2"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Tag Buttons (for Legal Fights) */}
      {sectionId === 'legal' && (tags.length > 0 || systemConfig.legalDepartments.length > 0 || users.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Quick Filters</h3>
            <button
              onClick={() => setShowQuickFilters(!showQuickFilters)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronDown className={clsx('w-4 h-4 text-gray-500 transition-transform', !showQuickFilters && 'rotate-180')} />
            </button>
          </div>
          
          <div className={clsx(
            'overflow-hidden transition-all duration-300 ease-in-out',
            showQuickFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}>
            {/* Tags Section */}
            {tags.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, selectedTag: '' }))}
                    className={clsx(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      !filters.selectedTag 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    All Cases
                  </button>
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        selectedTag: prev.selectedTag === tag.id ? '' : tag.id 
                      }))}
                      className={clsx(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                        filters.selectedTag === tag.id
                          ? 'text-white border-transparent'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                      style={{
                        backgroundColor: filters.selectedTag === tag.id ? tag.color : 'transparent',
                        color: filters.selectedTag === tag.id ? 'white' : tag.color
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Departments Section */}
            {systemConfig.legalDepartments.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Departments</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, selectedDepartment: '' }))}
                    className={clsx(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      !filters.selectedDepartment 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    All Departments
                  </button>
                  {systemConfig.legalDepartments.map(dept => (
                    <button
                      key={dept}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        selectedDepartment: prev.selectedDepartment === dept ? '' : dept 
                      }))}
                      className={clsx(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                        filters.selectedDepartment === dept
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                      )}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* People Section */}
            {users.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Assigned People</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, selectedAssignee: '' }))}
                    className={clsx(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      !filters.selectedAssignee 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    All People
                  </button>
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        selectedAssignee: prev.selectedAssignee === user.id ? '' : user.id 
                      }))}
                      className={clsx(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center',
                        filters.selectedAssignee === user.id
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
                      )}
                    >
                      <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Icon className={clsx('w-16 h-16 mx-auto mb-4 opacity-30', color)} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f)
              ? 'No matching results'
              : `No ${sectionName.toLowerCase()} found`}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f)
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first item.'}
          </p>
          {canCreate && !searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create {sectionName.slice(0, -1)}
            </button>
          )}
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Task Management</h3>
                <p className="text-sm text-gray-600">
                  Click on any {sectionName.toLowerCase().slice(0, -1)} to open its dedicated task board, or view all tasks combined below.
                </p>
              </div>
            </div>
          </div>
          <KanbanBoard sectionId={sectionId} showCombined={true} />
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(filteredItems.map(i => i.id)));
                      } else {
                        setSelectedItems(new Set());
                      }
                    }}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedItems);
                        if (e.target.checked) {
                          newSelected.add(item.id);
                        } else {
                          newSelected.delete(item.id);
                        }
                        setSelectedItems(newSelected);
                      }}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/${sectionId}/${item.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-amber-600 transition-colors"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                      item.status === 'completed' ? 'bg-green-100 text-green-800' :
                      item.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx('inline-flex px-2 py-1 text-xs font-medium rounded-full border', getPriorityColor(item.priority))}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-1">
                      {item.assignees && item.assignees.length > 0 ? (
                        <div className="flex -space-x-1">
                          {item.assignees.slice(0, 3).map((assignee) => (
                            <div
                              key={assignee.id}
                              className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium border border-white"
                              title={assignee.name}
                            >
                              {assignee.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {item.assignees.length > 3 && (
                            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border border-white">
                              +{item.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.due_date ? (
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(item.due_date).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-400">No deadline</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.tags && item.tags.length > 0 ? (
                        item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex px-2 py-1 text-xs font-medium rounded"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No tags</span>
                      )}
                      {item.tags && item.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative dropdown-menu">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenuId === item.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all relative"
            >
              <Link to={`/${sectionId}/${item.id}`} className="block">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                  <span className={clsx('inline-flex px-2 py-1 text-xs font-medium rounded-full border', getPriorityColor(item.priority))}>
                    {item.priority}
                  </span>
                </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>

              <div className="space-y-3">
                {item.due_date && (
                  <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="w-4 h-4 mr-2" />
                    Due {new Date(item.due_date).toLocaleDateString()}
                  </div>
                )}

                {item.assignees && item.assignees.length > 0 && (
                  <div className="flex items-center text-sm text-gray-700">
                    <User className="w-4 h-4 mr-2" />
                    <div className="flex -space-x-1">
                      {item.assignees.slice(0, 2).map((assignee) => (
                        <div
                          key={assignee.id}
                          className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium border border-white"
                          title={assignee.name}
                        >
                          {assignee.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {item.assignees.length > 2 && (
                        <span className="ml-2 text-xs text-gray-500">+{item.assignees.length - 2}</span>
                      )}
                    </div>
                  </div>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex px-2 py-1 text-xs font-medium rounded"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{item.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              </Link>
              <div className="absolute top-4 right-4 dropdown-menu">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === item.id ? null : item.id);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openMenuId === item.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditItem(item);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 flex items-center space-x-4">
          <span className="text-sm text-gray-700">{selectedItems.size} items selected</span>
          <div className="h-4 w-px bg-gray-300"></div>
          <button className="text-sm text-amber-600 hover:text-amber-700 transition-colors">
            Bulk Assign
          </button>
          <button className="text-sm text-amber-600 hover:text-amber-700 transition-colors">
            Add Tags
          </button>
          <button className="text-sm text-amber-600 hover:text-amber-700 transition-colors">
            Export Selected
          </button>
        </div>
      )}

      {/* Create Modal */}
      <ItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        sectionId={sectionId}
        sectionName={sectionName}
        onItemSaved={() => {
          fetchItems();
          setShowCreateModal(false);
        }}
      />

      {/* Edit Modal */}
      {editingItem && (
        <ItemModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(undefined);
          }}
          sectionId={sectionId}
          sectionName={sectionName}
          item={editingItem}
          onItemSaved={() => {
            fetchItems();
            setShowEditModal(false);
            setEditingItem(undefined);
          }}
        />
      )}
    </div>
  );
}