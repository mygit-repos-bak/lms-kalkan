import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { Plus, Grid3x3 as Grid3X3, Filter, Users, Tag as TagIcon, Layers } from 'lucide-react';
import { db } from '../../lib/database';
import { toast } from 'react-hot-toast';
import { Task, Stage, User, Tag } from '../../types/database';
import { TaskModal } from '../tasks/TaskModal';
import TaskDetailModal from '../tasks/TaskDetailModal';
import clsx from 'clsx';

interface KanbanBoardProps {
  itemId?: string;
  sectionId: string;
  showCombined?: boolean;
}

export function KanbanBoard({ itemId, sectionId, showCombined = false }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [defaultStage, setDefaultStage] = useState<string>('');
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'none' | 'assignee' | 'item'>('none');
  const [viewMode, setViewMode] = useState<'single' | 'combined'>(showCombined ? 'combined' : 'single');
  
  const [filters, setFilters] = useState({
    assignees: [] as string[],
    tags: [] as string[],
    priorities: [] as string[],
    items: [] as string[]
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  useEffect(() => {
    fetchTasks();
    fetchStages();
    fetchUsers();
    fetchTags();
  }, [itemId, sectionId, viewMode]);

  const fetchTasks = async () => {
    try {
      let tasks = await db.getTasks();
      
      if (itemId && viewMode === 'single') {
        tasks = tasks.filter(t => t.item_id === itemId);
      } else if (viewMode === 'combined') {
        const sectionItems = await db.getItems(sectionId);
        const itemIds = sectionItems.map(item => item.id);
        tasks = tasks.filter(t => itemIds.includes(t.item_id));
      }

      setTasks(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      
      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('Cannot connect to database')) {
          toast.error('Cannot connect to database. Please check your internet connection.');
        } else if (error.message.includes('Supabase configuration missing')) {
          toast.error('Database configuration error. Please contact support.');
        } else {
          toast.error(`Failed to load tasks: ${error.message}`);
        }
      } else {
        toast.error('Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const stages = (await db.getStages()).filter(s => s.is_global || s.section_id === sectionId);
      setStages(stages);
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
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

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setDraggedTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStage = over.id as string;
    const task = tasks.find(t => t.id === taskId);

    if (!task || task.stage === newStage) return;

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, stage: newStage } : t
    ));

    try {
      await db.updateTask(taskId, { stage: newStage });

      // Log activity
      await db.logActivity({
        action: 'moved',
        target_type: 'task',
        target_id: taskId,
        before_data: { stage: task.stage },
        after_data: { stage: newStage },
        metadata: { item_id: task.item_id }
      });

      toast.success('Task moved successfully');
    } catch (error) {
      // Revert optimistic update
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, stage: task.stage } : t
      ));
      
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
    }
  };

  const openTaskModal = (stage?: string, task?: Task) => {
    setDefaultStage(stage || '');
    setSelectedTask(task);
    setParentTaskForSubtask('');
    setShowTaskModal(true);
  };

  const openSubtaskModal = (parentTask: Task) => {
    setDefaultStage(parentTask.stage);
    setSelectedTask(undefined);
    setParentTaskForSubtask(parentTask.id);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Are you sure you want to delete "${task.title}"? This will also delete all subtasks.`)) {
      return;
    }

    try {
      await db.deleteTask(task.id);
      
      // Remove from local state
      setTasks(prev => prev.filter(t => t.id !== task.id && t.parent_task_id !== task.id));
      
      // Log activity
      await db.logActivity({
        action: 'deleted',
        target_type: 'task',
        target_id: task.id,
        before_data: task,
        after_data: null,
        metadata: { item_id: task.item_id }
      });

      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const openTaskDetailModal = (task: Task) => {
    setViewingTask(task);
    setShowTaskDetailModal(true);
  };

  const handleViewModeToggle = () => {
    const newMode = viewMode === 'single' ? 'combined' : 'single';
    setViewMode(newMode);
  };

  const getItemIdForTaskCreation = () => {
    if (viewMode === 'single' && itemId) {
      return itemId;
    }
    // For combined view, return empty string - will be handled in TaskModal
    return '';
  };
  const filteredTasks = tasks.filter(task => {
    // Don't filter out tasks based on hierarchy - show all tasks in their respective stages
    if (filters.assignees.length > 0) {
      const hasAssignee = task.assignees?.some(a => filters.assignees.includes(a.id));
      if (!hasAssignee) return false;
    }

    if (filters.tags.length > 0) {
      const hasTag = task.tags?.some(t => filters.tags.includes(t.id));
      if (!hasTag) return false;
    }

    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
      return false;
    }

    if (filters.items.length > 0 && !filters.items.includes(task.item_id)) {
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Grid3X3 className="w-6 h-6 mr-3 text-gray-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {viewMode === 'combined' ? `All ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} Tasks` : 'Task Board'}
            </h2>
            <p className="text-sm text-gray-600">{filteredTasks.length} tasks</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          {!itemId && (
            <div className="flex items-center bg-white border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('single')}
                className={clsx(
                  'px-3 py-2 text-sm font-medium rounded-l-lg transition-colors',
                  viewMode === 'single' 
                    ? 'bg-amber-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Single Project
              </button>
              <button
                onClick={() => setViewMode('combined')}
                className={clsx(
                  'px-3 py-2 text-sm font-medium rounded-r-lg transition-colors',
                  viewMode === 'combined' 
                    ? 'bg-amber-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                All Projects
              </button>
            </div>
          )}

          {viewMode === 'combined' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Group by:</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="none">None</option>
                <option value="item">Item</option>
                <option value="assignee">Assignee</option>
              </select>
            </div>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center px-3 py-2 border rounded-lg transition-colors text-sm',
              showFilters 
                ? 'border-amber-300 bg-amber-50 text-amber-700' 
                : 'border-gray-300 hover:bg-gray-50'
            )}
            title={showFilters ? "Hide Filters" : "Show Filters"}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>

          <button
            onClick={() => openTaskModal(stages[0]?.name)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all transform hover:scale-105"
            title="Create new task"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assignees</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {users.map(user => (
                  <label key={user.id} className="flex items-center text-sm">
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
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-gray-700">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {tags.map(tag => (
                  <label key={tag.id} className="flex items-center text-sm">
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
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span 
                      className="ml-2 px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="space-y-1">
                {['urgent', 'high', 'normal', 'low'].map(priority => (
                  <label key={priority} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filters.priorities.includes(priority)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, priorities: [...prev.priorities, priority] }));
                        } else {
                          setFilters(prev => ({ ...prev, priorities: prev.priorities.filter(p => p !== priority) }));
                        }
                      }}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-gray-700 capitalize">{priority}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ assignees: [], tags: [], priorities: [], items: [] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stages.map((stage) => {
            // Show all tasks in this stage, regardless of hierarchy
            const stageTasks = filteredTasks.filter(task => task.stage === stage.name);
            
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                tasks={stageTasks}
                onAddTask={() => openTaskModal(stage.name)}
                onEditTask={(task) => openTaskModal(undefined, task)}
                onViewTask={(task) => openTaskDetailModal(task)}
                onCreateSubtask={(task) => openSubtaskModal(task)}
                onDeleteTask={(task) => handleDeleteTask(task)}
                showCombined={viewMode === 'combined'}
                groupBy={groupBy}
              />
            );
          })}
        </div>

        <DragOverlay>
          {draggedTask ? <TaskCard task={draggedTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(undefined);
          setDefaultStage('');
          setParentTaskForSubtask('');
        }}
        itemId={getItemIdForTaskCreation()}
        task={selectedTask}
        defaultStage={defaultStage}
        parentTaskId={parentTaskForSubtask}
        onTaskSaved={() => {
          fetchTasks();
          setShowTaskModal(false);
          setSelectedTask(undefined);
          setDefaultStage('');
          setParentTaskForSubtask('');
        }}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={showTaskDetailModal}
        onClose={() => {
          setShowTaskDetailModal(false);
          setViewingTask(undefined);
        }}
        task={viewingTask || null}
        onEdit={() => {
          if (viewingTask) {
            setShowTaskDetailModal(false);
            openTaskModal(undefined, viewingTask);
            setViewingTask(undefined);
          }
        }}
        onDelete={(task) => {
          handleDeleteTask(task);
          setShowTaskDetailModal(false);
          setViewingTask(undefined);
        }}
      />
    </div>
  );
}