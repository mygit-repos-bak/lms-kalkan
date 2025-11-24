import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Link, FileText, Check } from 'lucide-react';
import { db } from '../../lib/database';
import { toast } from 'react-hot-toast';
import { Item, User, Tag } from '../../types/database';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionName: string;
  item?: Item;
  allowSectionSelection?: boolean;
  initialStartDate?: string;
  initialEndDate?: string;
  onItemSaved: () => void;
}

const jurisdictions = ['Federal District', 'Circuit Appeals', 'Bankruptcy Court', 'State Court'];

export default function ItemModal({
  isOpen,
  onClose,
  sectionId,
  sectionName,
  item,
  allowSectionSelection,
  initialStartDate,
  initialEndDate,
  onItemSaved
}: ItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const { user } = useAuth();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');
  const [showNewDepartmentForm, setShowNewDepartmentForm] = useState(false);
  const [newJurisdiction, setNewJurisdiction] = useState('');
  const [showNewJurisdictionForm, setShowNewJurisdictionForm] = useState(false);
  const [systemConfig, setSystemConfig] = useState<any>({
    legalDepartments: [],
    dealBusinessNatures: [],
    realEstateBusinessNatures: [],
    cityApprovals: []
  });
  const [currentSectionId, setCurrentSectionId] = useState(sectionId);
  const [currentSectionName, setCurrentSectionName] = useState(sectionName);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal' as const,
    start_date: '',
    due_date: '',
    status: 'active',
    assignees: [] as string[],
    tags: [] as string[],
    external_links: [''],
    // Section-specific fields
    legal: {
      department: '',
      jurisdictions: [] as string[],
      case_numbers: [''],
      docket_monitoring: false,
      parties: {
        appellants: [''],
        appellees: [''],
        plaintiffs: [''],
        defendants: ['']
      }
    },
    deals: {
      deal_name: '',
      involved_parties: [''],
      business_nature: '',
      proposed_activities: ''
    },
    real_estate: {
      contact_persons: [''],
      business_nature: '',
      city_approvals: [] as string[]
    }
  });

  const handleSectionChange = (newSectionId: string) => {
    setCurrentSectionId(newSectionId);
    const sectionNames = {
      'legal': 'Legal Fights',
      'deals': 'Business Deals',
      'real-estate': 'Real Estate',
      'others': 'Others'
    };
    setCurrentSectionName(sectionNames[newSectionId as keyof typeof sectionNames] || 'Others');
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchTags();
      fetchSystemConfig();
      
      if (item) {
        setFormData({
          title: item.title,
          description: item.description,
          priority: item.priority,
          start_date: item.start_date ? item.start_date.split('T')[0] : '',
          due_date: item.due_date ? item.due_date.split('T')[0] : '',
          status: item.status,
          assignees: item.assignee_ids || [],
          tags: item.tag_ids || [],
          external_links: item.external_links.length > 0 ? item.external_links : [''],
          legal: {
            department: item.legal_meta?.department || '',
            jurisdictions: item.legal_meta?.jurisdictions || [],
            case_numbers: item.legal_meta?.case_numbers?.length > 0 ? item.legal_meta.case_numbers : [''],
            docket_monitoring: item.legal_meta?.docket_monitoring || false,
            parties: {
              appellants: item.legal_meta?.parties?.appellants?.length > 0 ? item.legal_meta.parties.appellants : [''],
              appellees: item.legal_meta?.parties?.appellees?.length > 0 ? item.legal_meta.parties.appellees : [''],
              plaintiffs: item.legal_meta?.parties?.plaintiffs?.length > 0 ? item.legal_meta.parties.plaintiffs : [''],
              defendants: item.legal_meta?.parties?.defendants?.length > 0 ? item.legal_meta.parties.defendants : ['']
            }
          },
          deals: {
            deal_name: item.deal_meta?.deal_name || '',
            involved_parties: item.deal_meta?.involved_parties?.length > 0 ? item.deal_meta.involved_parties : [''],
            business_nature: item.deal_meta?.business_nature || '',
            proposed_activities: item.deal_meta?.proposed_activities || ''
          },
          real_estate: {
            contact_persons: item.real_estate_meta?.contact_persons?.length > 0 ? item.real_estate_meta.contact_persons : [''],
            business_nature: item.real_estate_meta?.business_nature || '',
            city_approvals: item.real_estate_meta?.city_approvals || []
          }
        });
        // Set the current section from the item
        setCurrentSectionId(item.section_id);
        setCurrentSectionName(getSectionName(item.section_id));
      } else {
        // For new items, ensure we have a valid section
        if (!currentSectionId || currentSectionId.trim() === '') {
          setCurrentSectionId(sectionId || 'legal');
          setCurrentSectionName(getSectionName(sectionId || 'legal'));
        }
      }
    }
  }, [isOpen, item]);

  const createNewTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const tagData = {
        name: newTagName.trim(),
        color: newTagColor
      };

      const data = await db.createTag(tagData);

      // Add to local tags list
      setTags(prev => [...prev, data]);
      
      // Add to selected tags
      setFormData(prev => ({ ...prev, tags: [...prev.tags, data.id] }));
      
      // Reset form
      setNewTagName('');
      setNewTagColor('#3b82f6');
      setShowNewTagForm(false);
      
      toast.success('Tag created successfully');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    }
  };

  const addNewDepartment = () => {
    if (!newDepartment.trim()) {
      toast.error('Department name is required');
      return;
    }

    const departmentName = newDepartment.trim();
    
    if (systemConfig.legalDepartments.includes(departmentName)) {
      toast.error('Department already exists');
      return;
    }

    // Add to system config
    setSystemConfig(prev => ({
      ...prev,
      legalDepartments: [...prev.legalDepartments, departmentName]
    }));

    // Set as selected department
    setFormData(prev => ({ 
      ...prev, 
      legal: { ...prev.legal, department: departmentName } 
    }));

    // Reset form
    setNewDepartment('');
    setShowNewDepartmentForm(false);
    
    toast.success('Department added successfully');
  };

  const addNewJurisdiction = () => {
    if (!newJurisdiction.trim()) {
      toast.error('Jurisdiction name is required');
      return;
    }

    const jurisdictionName = newJurisdiction.trim();
    
    if (formData.legal.jurisdictions.includes(jurisdictionName)) {
      toast.error('Jurisdiction already selected');
      return;
    }

    // Add to selected jurisdictions
    setFormData(prev => ({ 
      ...prev, 
      legal: { 
        ...prev.legal, 
        jurisdictions: [...prev.legal.jurisdictions, jurisdictionName] 
      } 
    }));

    // Reset form
    setNewJurisdiction('');
    setShowNewJurisdictionForm(false);
    
    toast.success('Jurisdiction added successfully');
  };

  const getSectionName = (sectionId: string) => {
    const sectionNames = {
      'legal': 'Legal Fights',
      'deals': 'Business Deals',
      'real-estate': 'Real Estate',
      'others': 'Others'
    };
    return sectionNames[sectionId as keyof typeof sectionNames] || 'Others';
  };

  const fetchUsers = async () => {
    try {
      const users = await db.getUsers();
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const tags = await db.getTags();
      setTags(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const config = await db.getSystemConfig();
      setSystemConfig(config);
    } catch (error) {
      console.error('Error fetching system config:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      // Create or update item
      const itemData = {
        section_id: currentSectionId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        status: formData.status,
        external_links: formData.external_links.filter(link => link.trim() !== ''),
        attachments: [],
        custom_fields: {},
        assignee_ids: formData.assignees,
        tag_ids: formData.tags
      };

      let savedItem;
      if (item) {
        savedItem = await db.updateItem(item.id, itemData);
      } else {
        savedItem = await db.createItem(itemData);
      }

      // Handle section-specific metadata
      if (currentSectionId === 'legal' && savedItem) {
        const legalMeta = {
          item_id: savedItem.id,
          department: formData.legal.department || null,
          jurisdictions: formData.legal.jurisdictions,
          case_numbers: formData.legal.case_numbers.filter(num => num.trim() !== ''),
          docket_monitoring: formData.legal.docket_monitoring,
          parties: formData.legal.parties,
          critical_dates: [],
          document_workflow: []
        };
        
        // Save legal metadata (this would need to be implemented in db.js)
        try {
          await db.saveLegalMeta(legalMeta);
        } catch (error) {
          console.warn('Legal metadata not saved:', error);
        }
      }

      if (currentSectionId === 'deals' && savedItem) {
        const dealMeta = {
          item_id: savedItem.id,
          deal_name: formData.deals.deal_name || null,
          involved_parties: formData.deals.involved_parties.filter(party => party.trim() !== ''),
          business_nature: formData.deals.business_nature || null,
          contact_details: {},
          proposed_activities: formData.deals.proposed_activities || null
        };
        
        try {
          await db.saveDealMeta(dealMeta);
        } catch (error) {
          console.warn('Deal metadata not saved:', error);
        }
      }

      if (currentSectionId === 'real-estate' && savedItem) {
        const realEstateMeta = {
          item_id: savedItem.id,
          contact_persons: formData.real_estate.contact_persons.filter(person => person.trim() !== ''),
          business_nature: formData.real_estate.business_nature || null,
          city_approvals: formData.real_estate.city_approvals,
          contact_details: {},
          documents: []
        };
        
        try {
          await db.saveRealEstateMeta(realEstateMeta);
        } catch (error) {
          console.warn('Real estate metadata not saved:', error);
        }
      }

      // Log activity
      await db.logActivity({
        action: item ? 'updated' : 'created',
        target_type: 'item',
        target_id: savedItem!.id,
        before_data: item ? item : null,
        after_data: savedItem,
        metadata: { section: currentSectionId }
      });

      toast.success(item ? 'Item updated successfully' : 'Item created successfully');
      onItemSaved();
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const addArrayField = (path: string[], index?: number) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      const field = path[path.length - 1];
      if (typeof index === 'number') {
        current[field] = [...current[field]];
        current[field].splice(index + 1, 0, '');
      } else {
        current[field] = [...current[field], ''];
      }
      
      return newData;
    });
  };

  const removeArrayField = (path: string[], index: number) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      const field = path[path.length - 1];
      current[field] = current[field].filter((_: any, i: number) => i !== index);
      
      return newData;
    });
  };

  const updateArrayField = (path: string[], index: number, value: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      const field = path[path.length - 1];
      current[field] = [...current[field]];
      current[field][index] = value;
      
      return newData;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex max-h-[90vh] flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {item ? 'Edit' : 'Create'} {currentSectionName.slice(0, -1)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Selection (for calendar) */}
        {allowSectionSelection && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Section
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'legal', name: 'Legal Fights', color: 'bg-red-100 text-red-800 border-red-200' },
                { id: 'deals', name: 'Business Deals', color: 'bg-green-100 text-green-800 border-green-200' },
                { id: 'real-estate', name: 'Real Estate', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                { id: 'others', name: 'Others', color: 'bg-purple-100 text-purple-800 border-purple-200' }
              ].map(section => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionChange(section.id)}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                    currentSectionId === section.id 
                      ? section.color 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {section.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form id="item-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter title..."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  placeholder="Enter detailed description..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignees
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {users.map(user => (
                  <label key={user.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.assignees.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, assignees: [...prev.assignees, user.id] }));
                        } else {
                          setFormData(prev => ({ ...prev, assignees: prev.assignees.filter(id => id !== user.id) }));
                        }
                      }}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{user.name} ({user.role})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {tags.map(tag => (
                  <label key={tag.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, tags: [...prev.tags, tag.id] }));
                        } else {
                          setFormData(prev => ({ ...prev, tags: prev.tags.filter(id => id !== tag.id) }));
                        }
                      }}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span 
                      className="ml-2 text-sm px-2 py-1 rounded"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  </label>
                ))}
                
                {/* Add New Tag Form */}
                {showNewTagForm ? (
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Tag name..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={newTagColor}
                          onChange={(e) => setNewTagColor(e.target.value)}
                          className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={createNewTag}
                          className="flex items-center px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewTagForm(false);
                            setNewTagName('');
                            setNewTagColor('#3b82f6');
                          }}
                          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewTagForm(true)}
                    className="flex items-center text-sm text-amber-600 hover:text-amber-700 transition-colors mt-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add New Tag
                  </button>
                )}
              </div>
            </div>

            {/* External Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                External Links
              </label>
              <div className="space-y-2">
                {formData.external_links.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Link className="w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updateArrayField(['external_links'], index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="https://example.com or file://path/to/file"
                    />
                    {formData.external_links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField(['external_links'], index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField(['external_links'])}
                  className="flex items-center text-sm text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Link
                </button>
              </div>
            </div>

            {/* Section-specific fields */}
            {currentSectionId === 'legal' && (
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Legal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <div className="space-y-2">
                      <select
                        value={formData.legal.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, legal: { ...prev.legal, department: e.target.value } }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      >
                        <option value="">Select department...</option>
                        {systemConfig.legalDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      
                      {/* Add New Department Form */}
                      {showNewDepartmentForm ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newDepartment}
                            onChange={(e) => setNewDepartment(e.target.value)}
                            placeholder="New department name..."
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={addNewDepartment}
                            className="flex items-center px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewDepartmentForm(false);
                              setNewDepartment('');
                            }}
                            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowNewDepartmentForm(true)}
                          className="flex items-center text-sm text-amber-600 hover:text-amber-700 transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add New Department
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jurisdictions
                    </label>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="space-y-1 max-h-24 overflow-y-auto mb-3">
                        {jurisdictions.map(jurisdiction => (
                          <label key={jurisdiction} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.legal.jurisdictions.includes(jurisdiction)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    legal: { 
                                      ...prev.legal, 
                                      jurisdictions: [...prev.legal.jurisdictions, jurisdiction] 
                                    } 
                                  }));
                                } else {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    legal: { 
                                      ...prev.legal, 
                                      jurisdictions: prev.legal.jurisdictions.filter(j => j !== jurisdiction) 
                                    } 
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">{jurisdiction}</span>
                          </label>
                        ))}
                        
                        {/* Show selected custom jurisdictions */}
                        {formData.legal.jurisdictions
                          .filter(j => !jurisdictions.includes(j))
                          .map(jurisdiction => (
                            <label key={jurisdiction} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={() => {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    legal: { 
                                      ...prev.legal, 
                                      jurisdictions: prev.legal.jurisdictions.filter(j => j !== jurisdiction) 
                                    } 
                                  }));
                                }}
                                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                              />
                              <span className="ml-2 text-sm text-gray-700 font-medium">{jurisdiction} (Custom)</span>
                            </label>
                          ))}
                      </div>
                      
                      {/* Add New Jurisdiction Form */}
                      {showNewJurisdictionForm ? (
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={newJurisdiction}
                              onChange={(e) => setNewJurisdiction(e.target.value)}
                              placeholder="New jurisdiction name..."
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={addNewJurisdiction}
                              className="flex items-center px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewJurisdictionForm(false);
                                setNewJurisdiction('');
                              }}
                              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowNewJurisdictionForm(true)}
                          className="flex items-center text-sm text-amber-600 hover:text-amber-700 transition-colors border-t border-gray-200 pt-3"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add New Jurisdiction
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Case Numbers
                  </label>
                  <div className="space-y-2">
                    {formData.legal.case_numbers.map((num, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={num}
                          onChange={(e) => updateArrayField(['legal', 'case_numbers'], index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="Enter case number..."
                        />
                        {formData.legal.case_numbers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayField(['legal', 'case_numbers'], index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayField(['legal', 'case_numbers'])}
                      className="flex items-center text-sm text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Case Number
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentSectionId === 'deals' && (
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Deal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deal Name
                    </label>
                    <input
                      type="text"
                      value={formData.deals.deal_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, deals: { ...prev.deals, deal_name: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Enter deal name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Nature
                    </label>
                    <select
                      value={formData.deals.business_nature}
                      onChange={(e) => setFormData(prev => ({ ...prev, deals: { ...prev.deals, business_nature: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Select nature...</option>
                      {systemConfig.dealBusinessNatures.map(nature => (
                        <option key={nature} value={nature}>{nature}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Involved Parties
                  </label>
                  <div className="space-y-2">
                    {formData.deals.involved_parties.map((party, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={party}
                          onChange={(e) => updateArrayField(['deals', 'involved_parties'], index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="Enter party name..."
                        />
                        {formData.deals.involved_parties.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayField(['deals', 'involved_parties'], index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayField(['deals', 'involved_parties'])}
                      className="flex items-center text-sm text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Party
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentSectionId === 'real-estate' && (
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Real Estate Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Nature
                    </label>
                    <select
                      value={formData.real_estate.business_nature}
                      onChange={(e) => setFormData(prev => ({ ...prev, real_estate: { ...prev.real_estate, business_nature: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Select nature...</option>
                      {systemConfig.realEstateBusinessNatures.map(nature => (
                        <option key={nature} value={nature}>{nature}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City Approvals
                    </label>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {systemConfig.cityApprovals.map(approval => (
                        <label key={approval} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.real_estate.city_approvals.includes(approval)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  real_estate: { 
                                    ...prev.real_estate, 
                                    city_approvals: [...prev.real_estate.city_approvals, approval] 
                                  } 
                                }));
                              } else {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  real_estate: { 
                                    ...prev.real_estate, 
                                    city_approvals: prev.real_estate.city_approvals.filter(a => a !== approval) 
                                  } 
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{approval}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Persons
                  </label>
                  <div className="space-y-2">
                    {formData.real_estate.contact_persons.map((person, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={person}
                          onChange={(e) => updateArrayField(['real_estate', 'contact_persons'], index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="Enter contact person..."
                        />
                        {formData.real_estate.contact_persons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayField(['real_estate', 'contact_persons'], index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayField(['real_estate', 'contact_persons'])}
                      className="flex items-center text-sm text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Contact
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

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
            disabled={loading || !formData.title.trim() || !formData.description.trim()}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {loading ? 'Saving...' : (item ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}