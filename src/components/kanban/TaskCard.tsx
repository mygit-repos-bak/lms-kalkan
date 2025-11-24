import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, GripVertical, AlertCircle, Clock, CheckSquare, Eye, CreditCard as Edit3, ExternalLink, Move, Plus, Layers, Trash2 } from 'lucide-react';
import { Task } from '../../types/database';
import clsx from 'clsx';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onEdit?: () => void;
  onClick?: () => void;
  onCreateSubtask?: () => void;
  onDelete?: () => void;
  showItemInfo?: boolean;
}

export function TaskCard({ task, isDragging = false, onEdit, onClick, onCreateSubtask, onDelete, showItemInfo }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Debug logging
  if (task.task_level > 0) {
    console.log('Subtask card:', {
      title: task.title,
      level: task.task_level,
      parent_task_id: task.parent_task_id,
      parent: task.parent,
      hasParent: !!task.parent
    });
  }

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

  const getTaskLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-white border-gray-200'; // Parent tasks - white
      case 1: return 'bg-blue-50 border-blue-200'; // Subtasks - light blue
      case 2: return 'bg-green-50 border-green-200'; // Sub-subtasks - light green
      default: return 'bg-purple-50 border-purple-200'; // Deeper levels - light purple
    }
  };

  const getTaskLevelAccent = (level: number) => {
    switch (level) {
      case 0: return getPriorityColor(task.priority); // Parent tasks use priority color
      case 1: return 'border-l-blue-500 bg-blue-50'; // Subtasks - blue accent
      case 2: return 'border-l-green-500 bg-green-50'; // Sub-subtasks - green accent
      default: return 'border-l-purple-500 bg-purple-50'; // Deeper levels - purple accent
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={clsx(
        'group rounded-lg border border-l-4 p-4 shadow-sm transition-all cursor-pointer relative overflow-hidden',
        task.task_level === 0 ? getTaskLevelColor(task.task_level) : getTaskLevelColor(task.task_level),
        getTaskLevelAccent(task.task_level),
        isDragging || isSortableDragging ? 'opacity-90 shadow-xl scale-105 z-50 bg-white border-2 border-amber-400' : 'hover:shadow-md',
        isOverdue && 'ring-2 ring-red-200'
      )}
      onClick={onClick}
    >
      {/* Task Level Indicator for subtasks */}
      {task.task_level > 0 && task.parent && (
        <div className={clsx(
          "absolute -left-2 top-4 px-2 py-1 rounded flex items-center justify-center text-white text-xs font-medium max-w-[150px] truncate",
          task.task_level === 1 ? 'bg-blue-500' :
          task.task_level === 2 ? 'bg-green-500' :
          'bg-purple-500'
        )} title={task.parent.title}>
          <span className="truncate">{task.parent.title}</span>
        </div>
      )}

      {/* Parent Task Info for Subtasks - Moved to top */}
      {task.task_level > 0 && task.parent && (
        <div className="mb-2 p-2 bg-white bg-opacity-60 rounded text-xs border border-gray-200">
          <span className="font-semibold text-gray-700">{task.parent.title}</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
          <h4 className={clsx(
            "font-medium text-sm leading-tight",
            task.task_level === 0 ? 'text-gray-900' :
            task.task_level === 1 ? 'text-blue-900' :
            task.task_level === 2 ? 'text-green-900' :
            'text-purple-900'
          )}>
            {task.task_level > 0 && '├─ '}
            {task.title}
          </h4>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onCreateSubtask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateSubtask();
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Create subtask"
            >
              <Plus className="w-3 h-3 text-gray-400" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
             className="p-1 hover:bg-gray-100 rounded transition-colors"
             title="Edit task"
            >
              <Edit3 className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <div
            {...listeners}
           className="p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition-colors"
            onClick={(e) => e.stopPropagation()}
           title="Move task"
          >
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>
        </div>
      </div>

      {showItemInfo && task.item && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <span className="font-medium">{task.item.title}</span>
        </div>
      )}

      {task.description && (
        <p className={clsx(
          "text-xs mb-3 line-clamp-2",
          task.task_level === 0 ? 'text-gray-600' :
          task.task_level === 1 ? 'text-blue-700' :
          task.task_level === 2 ? 'text-green-700' :
          'text-purple-700'
        )}>{task.description}</p>
      )}

      <div className="space-y-2">
        {task.due_date && (
          <div className={clsx(
            'flex items-center text-xs',
            isOverdue ? 'text-red-600' : 'text-gray-600'
          )}>
            <Calendar className="w-3 h-3 mr-1" />
            {isOverdue && <AlertCircle className="w-3 h-3 mr-1" />}
            {new Date(task.due_date).toLocaleDateString()}
          </div>
        )}

        {task.estimate_hours && (
          <div className="flex items-center text-xs text-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            {task.estimate_hours}h estimated
          </div>
        )}

        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-600">
              <User className="w-3 h-3 mr-1" />
              <div className="flex -space-x-1">
                {task.assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee.id}
                    className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium border border-white"
                    title={assignee.name}
                  >
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border border-white">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
            </div>

            {task.external_links.length > 0 && (
              <ExternalLink className="w-3 h-3 text-blue-500" />
            )}
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick && onClick();
          }}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="View task details"
        >
          <Eye className="w-3 h-3" />
        </button>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}