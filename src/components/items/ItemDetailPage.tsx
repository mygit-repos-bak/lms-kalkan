import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard as Edit3, Trash2, ExternalLink, FileText, MessageSquare, Activity, Calendar, User, Tag as TagIcon, MoreVertical } from 'lucide-react';
import { db } from '../../lib/database';
import { toast } from 'react-hot-toast';
import { Item } from '../../types/database';
import { KanbanBoard } from '../kanban/KanbanBoard';
import { CommentSection } from '../comments/CommentSection';
import { ActivityFeed } from '../activity/ActivityFeed';
import ItemModal from './ItemModal';
import clsx from 'clsx';
import { usePermissions } from '../../hooks/usePermissions';

export function ItemDetailPage() {
  const { sectionId, itemId } = useParams<{ sectionId: string; itemId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'kanban' | 'comments' | 'activity'>('kanban');
  const { canEditItem, canDeleteItem } = usePermissions();

  useEffect(() => {
    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  const fetchItem = async () => {
    if (!itemId) return;

    try {
      setLoading(true);
      
      const items = await db.getItems();
      const foundItem = items.find(i => i.id === itemId);
      
      if (!foundItem) {
        throw new Error('Item not found');
      }
      
      setItem(foundItem);
    } catch (error) {
      console.error('Error fetching item:', error);
      toast.error('Failed to load item');
      navigate(`/${sectionId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await db.deleteItem(item.id);

      toast.success('Item deleted successfully');
      navigate(`/${sectionId}`);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const getSectionInfo = (sectionId: string) => {
    switch (sectionId) {
      case 'legal': return { name: 'Legal Fights', color: 'text-red-600' };
      case 'deals': return { name: 'Business Deals', color: 'text-green-600' };
      case 'real-estate': return { name: 'Real Estate', color: 'text-blue-600' };
      case 'others': return { name: 'Others', color: 'text-purple-600' };
      default: return { name: 'Unknown', color: 'text-gray-600' };
    }
  };

  const canEdit = item ? canEditItem(item) : false;
  const canDelete = item ? canDeleteItem(item) : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Item not found</p>
        <Link
          to={`/${sectionId}`}
          className="text-amber-600 hover:text-amber-700 transition-colors"
        >
          Go back to {getSectionInfo(sectionId || '').name}
        </Link>
      </div>
    );
  }

  const sectionInfo = getSectionInfo(sectionId || '');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/${sectionId}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back to section"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className={clsx('text-sm font-medium', sectionInfo.color)}>
                  {sectionInfo.name}
                </span>
                <span className="text-gray-400">•</span>
                <span className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  item.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  item.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                )}>
                  {item.priority}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">{item.title}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit item"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
            
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"  title="More options">
             
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Item Info Bar */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            <span>Unassigned</span>
          </div>

          {item.due_date && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Due {new Date(item.due_date).toLocaleDateString()}
            </div>
          )}

          {false && (
            <div className="flex items-center space-x-1">
              <TagIcon className="w-4 h-4" />
              <div className="flex space-x-1">
                No tags
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'kanban', name: 'Task Board', icon: Calendar },
              { id: 'comments', name: 'Comments', icon: MessageSquare },
              { id: 'activity', name: 'Activity', icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'kanban' && (
              <KanbanBoard itemId={itemId} sectionId={sectionId || ''} showCombined={false} />
            )}
            {activeTab === 'comments' && (
              <CommentSection parentType="item" parentId={itemId || ''} />
            )}
            {activeTab === 'activity' && (
              <ActivityFeed targetType="item" targetId={itemId || ''} />
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-auto">
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.description}</p>
              </div>

              {/* External Links */}
              {item.external_links.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">External Links</h3>
                  <div className="space-y-2">
                    {item.external_links.map((link, index) => (
                      <div key={index} className="flex items-center">
                        <ExternalLink className="w-4 h-4 text-gray-400 mr-2" />
                        {link.startsWith('http') ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors truncate"
                          >
                            {link}
                          </a>
                        ) : (
                          <button
                            onClick={() => navigator.clipboard.writeText(link)}
                            className="text-sm text-gray-600 hover:text-gray-800 transition-colors truncate"
                            title="Click to copy path"
                          >
                            {link}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section-specific metadata */}
              {false && sectionId === 'legal' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Legal Details</h3>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-500">Legal metadata simplified for demo</p>
                  </div>
                </div>
              )}

              {false && sectionId === 'deals' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Deal Details</h3>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-500">Deal metadata simplified for demo</p>
                  </div>
                </div>
              )}

              {false && sectionId === 'real-estate' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Real Estate Details</h3>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-500">Real estate metadata simplified for demo</p>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-900">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>
                    <span className="ml-2 text-gray-900">{new Date(item.updated_at).toLocaleDateString()}</span>
                  </div>
                  {item.start_date && (
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <span className="ml-2 text-gray-900">{new Date(item.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {item.due_date && (
                    <div>
                      <span className="text-gray-500">Due Date:</span>
                      <span className="ml-2 text-gray-900">{new Date(item.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ItemModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        sectionId={sectionId || ''}
        sectionName={sectionInfo.name}
        item={item}
        onItemSaved={() => {
          fetchItem();
          setShowEditModal(false);
        }}
      />
    </div>
  );
}