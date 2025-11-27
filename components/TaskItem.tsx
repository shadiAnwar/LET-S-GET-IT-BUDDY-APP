
import React from 'react';
import { Task, SubTask } from '../types';
import { CheckIcon, TrashIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon, GripVerticalIcon } from './Icons';

interface TaskItemProps {
  task: Task;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubtasks: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onExpand: (id: string) => void;
  lang: string;
  translations: any;
  isDraggable: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  index,
  onToggle, 
  onDelete, 
  onAddSubtasks,
  onToggleSubtask,
  onExpand,
  lang,
  translations,
  isDraggable,
  onDragStart,
  onDragEnter,
  onDragEnd
}) => {
  const isCompleted = task.completed;
  const isOverdue = task.dueDate ? Date.now() > task.dueDate && !isCompleted : false;
  
  const formatDueDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    // Construct locale code string like 'en-US' or 'es-ES' if needed
    const locale = lang; 

    if (isToday) {
        return `${translations.todayAt} ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCreatedDate = (timestamp: number) => {
     return new Date(timestamp).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
        draggable={isDraggable}
        onDragStart={(e) => onDragStart(e, index)}
        onDragEnter={(e) => onDragEnter(e, index)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => e.preventDefault()}
        className={`group relative bg-bg-800 border ${
            isCompleted 
                ? 'border-bg-700 bg-bg-800/50' 
                : isOverdue
                    ? 'border-red-500/30 hover:border-red-500/50 bg-red-900/5'
                    : 'border-bg-700 hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-900/20'
        } rounded-2xl p-4 transition-all duration-300 mb-0 animate-slide-up ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      
      {/* Main Task Row */}
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        {isDraggable && (
          <div className="mt-1 text-text-500 group-hover:text-text-300 transition-colors">
            <GripVerticalIcon className="w-5 h-5" />
          </div>
        )}

        {/* Alive Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 shadow-sm ${
            isCompleted 
              ? 'bg-gradient-to-br from-primary-500 to-secondary-500 scale-105' 
              : 'border-2 border-text-500 hover:border-primary-400 hover:bg-primary-500/10'
          }`}
          aria-label="Toggle task completion"
        >
          {isCompleted && <CheckIcon className="text-white w-3.5 h-3.5" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className={`text-lg font-medium transition-all duration-300 break-words leading-tight ${
            isCompleted ? 'text-text-500 line-through decoration-text-500/50' : 'text-text-100'
          }`}>
            {task.title}
          </p>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2.5">
            
            {/* Due Date Indicator - Aesthetic Colors */}
            {task.dueDate && (
                <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    isCompleted 
                        ? 'text-text-500 bg-bg-700 border-bg-700'
                        : isOverdue 
                            ? 'text-red-300 bg-red-900/30 border-red-500/20' 
                            : 'text-secondary-400 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20'
                }`}>
                    <ClockIcon className={`w-3 h-3 ${!isCompleted && !isOverdue ? 'text-secondary-400' : ''}`} />
                    <span>{isOverdue && !isCompleted ? translations.overdue : ''}{formatDueDate(task.dueDate)}</span>
                </div>
            )}

            {/* AI Breakdown Trigger - Alive Style */}
            {!isCompleted && task.subtasks.length === 0 && (
              <button 
                onClick={() => onAddSubtasks(task.id)}
                disabled={task.aiLoading}
                className="group/ai flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md text-primary-400 bg-primary-900/20 border border-primary-500/20 hover:bg-primary-900/40 hover:border-primary-500/40 transition-all disabled:opacity-50"
              >
                 <SparklesIcon className={`w-3 h-3 ${task.aiLoading ? 'animate-spin' : 'group-hover/ai:text-primary-300'}`} />
                 {task.aiLoading ? translations.thinking : translations.breakDown}
              </button>
            )}

            {/* Subtask Toggle/Count */}
            {task.subtasks.length > 0 && (
                <button 
                    onClick={() => onExpand(task.id)}
                    className="flex items-center gap-1 text-xs text-text-500 hover:text-text-300 transition-colors bg-bg-700/50 px-2 py-0.5 rounded-md"
                >
                    {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} {translations.subtasks}
                    {task.isExpanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                </button>
            )}
            
            {/* Created At */}
            {!task.dueDate && (
                <span className="text-xs text-text-500 font-medium">
                    {translations.created} {formatCreatedDate(task.createdAt)}
                </span>
            )}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(task.id)}
          className="text-text-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 -me-2"
          aria-label="Delete task"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Subtasks List */}
      {task.isExpanded && task.subtasks.length > 0 && (
        <div className="mt-4 ps-10 space-y-2">
            <div className="relative">
                <div className="absolute top-0 bottom-0 start-[-1.25rem] w-px bg-bg-700"></div>
                {task.subtasks.map((subtask: SubTask) => (
                    <div key={subtask.id} className="flex items-center gap-3 animate-fade-in py-1">
                    <button
                        onClick={() => onToggleSubtask(task.id, subtask.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${
                        subtask.completed 
                            ? 'bg-text-500 border-text-500' 
                            : 'border-text-500 hover:border-text-300'
                        }`}
                    >
                        {subtask.completed && <CheckIcon className="text-white w-3 h-3" />}
                    </button>
                    <span className={`text-sm ${subtask.completed ? 'text-text-500 line-through' : 'text-text-300'}`}>
                        {subtask.title}
                    </span>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
