import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Link, Clock } from 'lucide-react';
import { db } from '../../lib/database';
import { toast } from 'react-hot-toast';
import { Task, User, Tag, Stage } from '../../types/database';
import { useAuth } from '../../hooks/useAuth';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  task?: Task;
  defaultStage?: string;
  parentTaskId?: string;
  onTaskSaved: () => void;
}

export function TaskModal({ isOpen, onClose, itemId, task, defaultStage, parentTaskId, onTaskSaved }: TaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stage: '',
    parent_task_id: '',
    priority: 'normal' as const,
    status: 'active',
    start_date: '',
    due_date: '',
    estimate_hours: '',
    assignees: [] as string[],
    tags: [] as string[],
    external_links: ['']
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchTags();
      fetchStages();
      fetchAvailableTasks();
      
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          stage: task.stage,
          parent_task_id: task.parent_task_id || '',
          priority: task.priority,
          status: task.status,
          start_date: task.start_date ? task.start_date.split('T')[0] : '',
          due_date: task.due_date ? task.due_date.split('T')[0] : '',
          estimate_hours: task.estimate_hours?.toString() || '',
          assignees: task.assignees?.map(a => a.id) || [],
          tags: task.tags?.map(t => t.id) || [],
          external_links: task.external_links && task.external_links.length > 0 ? task.external_links : ['']
        });
      } else {
        // Reset form data for new tasks
        setFormData({
          title: '',
          description: '',
          stage: defaultStage || '',
          parent_task_id: parentTaskId || '',
          priority: 'normal' as const,
          status: 'active',
          start_date: '',
          due_date: '',
          estimate_hours: '',
          assignees: [] as string[],
          tags: [] as string[],
          external_links: ['']
        });
      }
    }
  }, [isOpen, task, defaultStage, parentTaskId]);

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

  const fetchStages = async () => {
    try {
      const stages = (await db.getStages()).filter(s => s.is_global);
      setStages(stages);
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      const tasks = await db.getTasks(itemId);
      // Filter out the current task and its descendants to prevent circular references
      const availableTasks = tasks.filter(t => {
        if (task && t.id === task.id) return false;
        // TODO: Add logic to filter out descendants
        return true;
      });
      setAvailableTasks(availableTasks);
    } catch (error) {
      console.error('Error fetching available tasks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that we have an itemId
    if (!itemId) {
      toast.error('Please select a project first');
      return;
    }
    setLoading(true);

    try {
      const taskData = {
        item_id: itemId,
        parent_task_id: formData.parent_task_id || null,
        title: formData.title,
        description: formData.description || null,
        stage: formData.stage,
        priority: formData.priority,
        status: formData.status,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        estimate_hours: formData.estimate_hours ? parseFloat(formData.estimate_hours) : null,
        actual_hours: null,
        external_links: formData.external_links.filter(link => link.trim() !== ''),
        attachments: [],
        dependencies: [],
        archived: false,
        assignee_ids: formData.assignees,
        tag_ids: formData.tags
      };

      let savedTask;
      if (task) {
        savedTask = await db.updateTask(task.id, taskData);
      } else {
        savedTask = await db.createTask(taskData);
      }

      // Log activity
      await db.logActivity({
        action: task ? 'updated' : 'created',
        target_type: 'task',
        target_id: savedTask!.id,
        before_data: task ? task : null,
        after_data: savedTask,
        metadata: { item_id: itemId }
      });

      toast.success(task ? 'Task updated successfully' : 'Task created successfully');
      onTaskSaved();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const getTaskHierarchyDisplay = (task: Task, level: number = 0): string => {
    const indent = '  '.repeat(level);
    const prefix = level === 0 ? '' : level === 1 ? '├─ ' : '└─ ';
    return `${indent}${prefix}${task.title}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex max-h-[90vh] flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : parentTaskId ? 'Create Subtask' : 'Create Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form id="task-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter task title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                placeholder="Enter task description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Task (Optional)
              </label>
              <select
                value={formData.parent_task_id}
                onChange={(e) => setFormData(prev => ({ ...prev, parent_task_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">No parent (Root task)</option>
                {availableTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {getTaskHierarchyDisplay(task, task.task_level)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a parent task to create a subtask
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Estimate (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.estimate_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimate_hours: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
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
                      onChange={(e) => {
                        const newLinks = [...formData.external_links];
                        newLinks[index] = e.target.value;
                        setFormData(prev => ({ ...prev, external_links: newLinks }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      placeholder="https://example.com or file://path/to/file"
                    />
                    {formData.external_links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newLinks = formData.external_links.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, external_links: newLinks }));
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, external_links: [...prev.external_links, ''] }))}
                  className="flex items-center text-sm text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Link
                </button>
              </div>
            </div>
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
            type="submit"
            form="task-form"
            disabled={loading || !formData.title.trim() || !formData.stage}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {loading ? 'Saving...' : (task ? 'Update Task' : parentTaskId ? 'Create Subtask' : 'Create Task')}
          </button>
        </div>
      </div>
    </div>
  );
}