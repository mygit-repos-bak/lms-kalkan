import React from 'react';
import { X, Calendar, User, Clock, CheckSquare, ExternalLink, AlertCircle, CreditCard as Edit3, Layers, Trash2 } from 'lucide-react';
import { Task } from '../../types/database';
import clsx from 'clsx';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit?: () => void;
  onDelete?: (task: Task) => void;
}

export default function TaskDetailModal({ isOpen, onClose, task, onEdit, onDelete }: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'normal': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  const childrenCount = task.children?.length || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex max-h-[90vh] flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={clsx('w-1 h-8 rounded-full', 
              task.priority === 'urgent' ? 'bg-red-500' :
              task.priority === 'high' ? 'bg-orange-500' :
              task.priority === 'normal' ? 'bg-blue-500' : 'bg-gray-500'
            )} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={clsx(
                  'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                  task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  task.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                )}>
                  {task.priority} priority
                </span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">{task.stage}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit task"
              >
                <Edit3 className="w-5 h-5 text-gray-600" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this task?')) {
                    onDelete(task);
                    onClose();
                  }
                }}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Description */}
            {task.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {task.description}
                </p>
              </div>
            )}

            {/* Key Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className={clsx('w-5 h-5', isOverdue ? 'text-red-600' : 'text-gray-600')} title="Due date" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Due Date</div>
                    <div className={clsx('text-sm flex items-center', isOverdue ? 'text-red-600' : 'text-gray-600')}>
                      {isOverdue && <AlertCircle className="w-4 h-4 mr-1" title="Overdue" />}
                      {new Date(task.due_date).toLocaleDateString()}
                      {isOverdue && ' (Overdue)'}
                    </div>
                  </div>
                </div>
              )}

              {/* Time Estimate */}
              {task.estimate_hours && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600" title="Time estimate" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Time Estimate</div>
                    <div className="text-sm text-gray-600">
                      {task.estimate_hours}h estimated
                      {task.actual_hours && ` • ${task.actual_hours}h actual`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Assignees */}
            {task.assignees && task.assignees.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Assignees</h3>
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map((assignee) => (
                    <div key={assignee.id} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                      <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {assignee.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-900">{assignee.name}</span>
                      <span className="text-xs text-gray-500">({assignee.role})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex px-3 py-1 text-sm font-medium rounded-full"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks */}
            {childrenCount > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Subtasks</h3>
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-gray-600" title="Subtasks" />
                    <span className="text-sm text-gray-600">
                      {childrenCount} subtask{childrenCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {task.children?.map((child) => (
                    <div key={child.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <Layers className="w-4 h-4 text-gray-400" />
                      <span className="text-sm flex-1 text-gray-900">
                        {child.title}
                      </span>
                      <span className={clsx(
                        'text-xs px-2 py-1 rounded-full',
                        child.status === 'completed' ? 'bg-green-100 text-green-800' :
                        child.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {child.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            {task.external_links && task.external_links.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">External Links</h3>
                <div className="space-y-2">
                  {task.external_links.map((link, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <ExternalLink className="w-4 h-4 text-gray-400" title="External link" />
                      {link.startsWith('http') ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors truncate flex-1"
                        >
                          {link}
                        </a>
                      ) : (
                        <button
                          onClick={() => navigator.clipboard.writeText(link)}
                          className="text-sm text-gray-600 hover:text-gray-800 transition-colors truncate flex-1 text-left"
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

            {/* Project Information */}
            {task.item && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Project</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">{task.item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{task.item.description}</div>
                </div>
              </div>
            )}

            {/* Parent Task Information */}
            {task.parent && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Parent Task</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">{task.parent.title}</div>
                  <div className="text-xs text-gray-500 mt-1">Level {task.parent.task_level}</div>
                </div>
              </div>
            )}
            {/* Timestamps */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Created:</span>
                  <div>{new Date(task.created_at).toLocaleDateString()} at {new Date(task.created_at).toLocaleTimeString()}</div>
                </div>
                <div>
                  <span className="font-medium">Updated:</span>
                  <div>{new Date(task.updated_at).toLocaleDateString()} at {new Date(task.updated_at).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}