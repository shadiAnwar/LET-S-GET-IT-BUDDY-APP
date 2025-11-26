import React, { useState, useEffect, useCallback } from 'react';
import { Task, SubTask, FilterType } from './types';
import { TaskItem } from './components/TaskItem';
import { AddTask } from './components/AddTask';
import { BrainCircuitIcon } from './components/Icons';
import { generateTaskBreakdown } from './services/geminiService';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterType>(FilterType.ALL);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedTasks = localStorage.getItem('lets-get-it-buddy-tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lets-get-it-buddy-tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const addTask = (title: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: Date.now(),
      subtasks: [],
      isExpanded: false,
      aiLoading: false,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const handleExpand = (id: string) => {
      setTasks(prev => prev.map(task => 
          task.id === id ? { ...task, isExpanded: !task.isExpanded } : task
      ));
  }

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        subtasks: task.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )
      };
    }));
  };

  const handleMagicBreakdown = async (id: string) => {
    const taskToBreakdown = tasks.find(t => t.id === id);
    if (!taskToBreakdown || taskToBreakdown.aiLoading) return;

    // Set loading state
    setTasks(prev => prev.map(t => t.id === id ? { ...t, aiLoading: true } : t));

    try {
      const subtaskTitles = await generateTaskBreakdown(taskToBreakdown.title);
      
      const newSubtasks: SubTask[] = subtaskTitles.map(title => ({
        id: crypto.randomUUID(),
        title,
        completed: false
      }));

      setTasks(prev => prev.map(t => 
        t.id === id ? { 
          ...t, 
          subtasks: [...t.subtasks, ...newSubtasks],
          isExpanded: true,
          aiLoading: false 
        } : t
      ));
    } catch (error) {
      console.error("Breakdown failed", error);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, aiLoading: false } : t));
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === FilterType.ACTIVE) return !task.completed;
    if (filter === FilterType.COMPLETED) return task.completed;
    return true;
  });

  const activeCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 font-sans selection:bg-brand-500 selection:text-white pb-20">
      
      {/* Header Background Gradient */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 md:py-16">
        
        {/* Title Section */}
        <div className="flex items-center gap-3 mb-2 animate-fade-in">
            <div className="bg-gradient-to-tr from-fuchsia-600 via-orange-500 to-yellow-400 p-3 rounded-2xl shadow-lg shadow-orange-500/20">
                <BrainCircuitIcon className="text-white w-8 h-8" />
            </div>
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                    LET'S GET IT BUDDY
                </h1>
                <p className="text-slate-400 font-medium">Crush your goals, one step at a time.</p>
            </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-8 mb-6 text-sm">
            <div className="font-semibold text-slate-400">
                {activeCount === 0 && tasks.length > 0 
                    ? <span className="text-brand-400">All done! Great job! 🎉</span>
                    : <span>{activeCount} task{activeCount !== 1 ? 's' : ''} remaining</span>
                }
            </div>
            
            {/* Filter Pills */}
            <div className="flex bg-dark-800 p-1 rounded-lg">
                {(Object.keys(FilterType) as Array<keyof typeof FilterType>).map((key) => {
                    const type = FilterType[key];
                    const isActive = filter === type;
                    return (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                isActive 
                                    ? 'bg-brand-600 text-white shadow-md' 
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Input */}
        <AddTask onAdd={addTask} />

        {/* List */}
        <div className="space-y-1">
            {filteredTasks.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                    <p className="text-xl font-bold text-slate-600">No tasks here</p>
                    <p className="text-slate-700 mt-2">Time to add something awesome!</p>
                </div>
            ) : (
                filteredTasks.map(task => (
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onAddSubtasks={handleMagicBreakdown}
                        onToggleSubtask={toggleSubtask}
                        onExpand={handleExpand}
                    />
                ))
            )}
        </div>

      </div>
    </div>
  );
};

export default App;