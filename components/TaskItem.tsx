import React from 'react';
import { Task, SubTask } from '../types';
import { CheckIcon, TrashIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubtasks: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onExpand: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggle, 
  onDelete, 
  onAddSubtasks,
  onToggleSubtask,
  onExpand
}) => {
  const isCompleted = task.completed;
  
  return (
    <div className={`group relative bg-dark-800 border ${isCompleted ? 'border-dark-700' : 'border-dark-700 hover:border-brand-500'} rounded-xl p-4 transition-all duration-300 shadow-sm mb-3 animate-slide-up`}>
      
      {/* Main Task Row */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            isCompleted 
              ? 'bg-brand-500 border-brand-500' 
              : 'border-slate-500 hover:border-brand-400'
          }`}
          aria-label="Toggle task completion"
        >
          {isCompleted && <CheckIcon className="text-white w-4 h-4" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-lg font-medium transition-all duration-200 break-words ${
            isCompleted ? 'text-slate-500 line-through' : 'text-slate-100'
          }`}>
            {task.title}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            {/* AI Breakdown Trigger */}
            {!isCompleted && task.subtasks.length === 0 && (
              <button 
                onClick={() => onAddSubtasks(task.id)}
                disabled={task.aiLoading}
                className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
              >
                 <SparklesIcon className={`w-3 h-3 ${task.aiLoading ? 'animate-spin' : ''}`} />
                 {task.aiLoading ? 'Thinking...' : 'Break it down'}
              </button>
            )}

            {/* Subtask Toggle/Count */}
            {task.subtasks.length > 0 && (
                <button 
                    onClick={() => onExpand(task.id)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                    {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                    {task.isExpanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                </button>
            )}
            
            <span className="text-xs text-slate-600 ml-auto">
                {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(task.id)}
          className="text-slate-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Delete task"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Subtasks List */}
      {task.isExpanded && task.subtasks.length > 0 && (
        <div className="mt-4 pl-9 space-y-2 border-l-2 border-dark-700 ml-3">
          {task.subtasks.map((subtask: SubTask) => (
            <div key={subtask.id} className="flex items-center gap-3 animate-fade-in">
              <button
                onClick={() => onToggleSubtask(task.id, subtask.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${
                  subtask.completed 
                    ? 'bg-slate-500 border-slate-500' 
                    : 'border-slate-500 hover:border-slate-300'
                }`}
              >
                {subtask.completed && <CheckIcon className="text-white w-3 h-3" />}
              </button>
              <span className={`text-sm ${subtask.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};