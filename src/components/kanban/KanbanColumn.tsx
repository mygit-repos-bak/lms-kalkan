import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { Plus, Layers } from 'lucide-react';
import { Task, Stage } from '../../types/database';
import clsx from 'clsx';

interface KanbanColumnProps {
  stage: Stage;
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  onCreateSubtask?: (parentTask: Task) => void;
  onDeleteTask?: (task: Task) => void;
  showCombined?: boolean;
  groupBy?: 'none' | 'assignee' | 'item';
}

export function KanbanColumn({ stage, tasks, onAddTask, onEditTask, onViewTask, onCreateSubtask, onDeleteTask, showCombined, groupBy }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.name,
  });

  const getStageColor = (stageName: string) => {
    switch (stageName.toLowerCase()) {
      case 'planning': return 'border-blue-200 bg-blue-50';
      case 'work in progress': return 'border-yellow-200 bg-yellow-50';
      case 'pending review': return 'border-orange-200 bg-orange-50';
      case 'completed': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const groupTasks = () => {
    if (!showCombined || groupBy === 'none') {
      return [{ key: 'all', title: null, tasks }];
    }

    if (groupBy === 'item') {
      const grouped = tasks.reduce((acc, task) => {
        const key = task.item?.title || 'Unknown Project';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {} as Record<string, Task[]>);

      return Object.entries(grouped).map(([title, tasks]) => ({
        key: title,
        title,
        tasks
      }));
    }

    if (groupBy === 'assignee') {
      const grouped = tasks.reduce((acc, task) => {
        const key = task.assignees?.[0]?.name || 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {} as Record<string, Task[]>);

      return Object.entries(grouped).map(([name, tasks]) => ({
        key: name,
        title: name,
        tasks
      }));
    }

    return [{ key: 'all', title: null, tasks }];
  };

  const groupedTasks = groupTasks();

  const renderTaskHierarchy = (tasks: Task[]) => {
    // Build hierarchy
    const taskMap = new Map<string, Task & { children: Task[] }>();
    const rootTasks: (Task & { children: Task[] })[] = [];

    // Initialize all tasks with children array
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] });
    });

    // Build parent-child relationships
    tasks.forEach(task => {
      const taskWithChildren = taskMap.get(task.id)!;
      if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
        const parent = taskMap.get(task.parent_task_id)!;
        parent.children.push(taskWithChildren);
      } else {
        rootTasks.push(taskWithChildren);
      }
    });

    // Sort by task_order
    const sortTasks = (tasks: (Task & { children: Task[] })[]) => {
      tasks.sort((a, b) => a.task_order - b.task_order);
      tasks.forEach(task => {
        if (task.children.length > 0) {
          sortTasks(task.children);
        }
      });
    };
    sortTasks(rootTasks);

    // Render hierarchy
    const renderTask = (task: Task & { children: Task[] }, level: number = 0): React.ReactNode => {
      return (
        <div key={task.id}>
          <div style={{ marginLeft: `${level * 16}px` }}>
            <TaskCard 
              task={task} 
              onEdit={() => onEditTask(task)}
              onClick={() => onViewTask(task)}
              onCreateSubtask={onCreateSubtask ? () => onCreateSubtask(task) : undefined}
              onDelete={onDeleteTask ? () => onDeleteTask(task) : undefined}
              showItemInfo={showCombined}
            />
          </div>
          {task.children.map(child => renderTask(child, level + 1))}
        </div>
      );
    };

    return rootTasks.map(task => renderTask(task));
  };

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'bg-white rounded-lg border-2 transition-all duration-200',
        isOver ? 'border-amber-400 shadow-lg bg-amber-50' : getStageColor(stage.name),
        'min-h-[500px]'
      )}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium">
            {tasks.length}
          </span>
        </div>
        
        <button 
          onClick={onAddTask}
          className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </button>
      </div>

      <div className="p-4 space-y-4">
        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
          {groupedTasks.map(group => (
            <div key={group.key}>
              {group.title && (
                <div className="mb-2 pb-2 border-b border-gray-100">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {group.title}
                  </h4>
                </div>
              )}
              
              <div className="space-y-3">
                {renderTaskHierarchy(group.tasks)}
              </div>
            </div>
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-sm">No tasks in this stage</p>
            <p className="text-xs mt-1">Click "Add Task" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}