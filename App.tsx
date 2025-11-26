
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, SubTask, FilterType, Language } from './types';
import { TaskItem } from './components/TaskItem';
import { AddTask } from './components/AddTask';
import { RocketIcon, ChevronDownIcon } from './components/Icons';
import { Toast } from './components/Toast';
import { Confetti } from './components/Confetti';
import { generateTaskBreakdown } from './services/geminiService';
import { translations } from './translations';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterType>(FilterType.ALL);
  const [language, setLanguage] = useState<Language>('en');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  
  // Drag and Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Overdue Tracking Ref
  const overdueRef = useRef<Set<string>>(new Set());

  // Derived translations
  const t = translations[language];
  const isRTL = language === 'ar';

  const getBuddyMessage = (count: number): string => {
    if (count === 0) return t.buddyMessages[0];
    if (count < 3) return t.buddyMessages[3];
    if (count < 6) return t.buddyMessages[6];
    if (count < 10) return t.buddyMessages[10];
    return t.buddyMessages.max;
  };

  // Toast State
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'roast'; visible: boolean }>({
    msg: '',
    type: 'success',
    visible: false
  });

  const showToast = useCallback((type: 'success' | 'roast') => {
    const quotes = type === 'success' ? t.motivationalQuotes : t.roastQuotes;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setToast({ msg: randomQuote, type, visible: true });
  }, [t]);

  const closeToast = () => setToast(prev => ({ ...prev, visible: false }));

  // Sound Effects
  const playSuccessSound = useCallback(() => {
    // 1. Digital Chime (Web Audio API)
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        
        // Soft Major Chord Arpeggio (C E G)
        const notes = [523.25, 659.25, 783.99]; 
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = now + i * 0.05;

            osc.type = 'sine'; // Sine wave for a softer, supportive sound
            osc.frequency.value = freq;
            
            // Envelope
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.08, startTime + 0.05); 
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.6);
        });
    }

    // 2. Human "Yeah!" Sound
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2117/2117-preview.mp3');
        audio.volume = 0.6;
        audio.play().catch(e => {
            console.warn("Audio play blocked or failed", e);
        });
    } catch (e) {
        console.error("Audio initialization failed", e);
    }
  }, []);

  const playBooSound = useCallback(() => {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3');
        audio.volume = 0.6;
        audio.play().catch(e => {
            console.warn("Boo play blocked or failed", e);
        });
    } catch (e) {
        console.error("Audio initialization failed", e);
    }
  }, []);

  const triggerCelebration = () => {
    setIsCelebrating(true);
    playSuccessSound();
    setTimeout(() => setIsCelebrating(false), 3000);
  };

  // Load from local storage (tasks and language)
  useEffect(() => {
    const savedTasks = localStorage.getItem('lets-get-it-buddy-tasks');
    const savedLang = localStorage.getItem('lets-get-it-buddy-lang') as Language;
    
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        if (Array.isArray(parsedTasks)) {
            setTasks(parsedTasks);
        } else {
            console.warn("Saved tasks data is corrupted or not an array. Resetting.");
            setTasks([]);
        }
      } catch (e) {
        console.error("Failed to parse tasks", e);
        setTasks([]);
      }
    }
    
    if (savedLang && ['en', 'es', 'fr', 'ar', 'sv', 'pt'].includes(savedLang)) {
        setLanguage(savedLang);
    }

    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lets-get-it-buddy-tasks', JSON.stringify(tasks));
      localStorage.setItem('lets-get-it-buddy-lang', language);
    }
  }, [tasks, language, isLoaded]);

  // Check for Overdue Tasks to Trigger Boo
  useEffect(() => {
    const checkOverdue = () => {
        const now = Date.now();
        let shouldBoo = false;

        tasks.forEach(task => {
            const isOverdue = !task.completed && task.dueDate && task.dueDate < now;

            if (isOverdue) {
                // If this task just became overdue or we haven't booed it yet in this session
                if (!overdueRef.current.has(task.id)) {
                    overdueRef.current.add(task.id);
                    shouldBoo = true;
                }
            } else {
                // If it's no longer overdue (completed or date changed), remove from ref so we can boo it again if it fails later
                if (overdueRef.current.has(task.id)) {
                    overdueRef.current.delete(task.id);
                }
            }
        });

        if (shouldBoo) {
            playBooSound();
            showToast('roast');
        }
    };

    // Run check immediately on task updates
    checkOverdue();

    // Run check periodically
    const interval = setInterval(checkOverdue, 5000);
    return () => clearInterval(interval);
  }, [tasks, playBooSound, showToast]);

  const addTask = (title: string, dueDate?: number) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: Date.now(),
      dueDate: dueDate,
      subtasks: [],
      isExpanded: false,
      aiLoading: false,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task) {
        if (!task.completed) {
          showToast('success'); // Completing a task
          triggerCelebration();
        } else {
          showToast('roast'); // Unchecking a task
        }
      }
      return prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    });
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      showToast('roast'); // Deleting an incomplete task
    }
    setTasks(prev => prev.filter(t => t.id !== id));
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
      const subtaskTitles = await generateTaskBreakdown(taskToBreakdown.title, language);
      
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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragItem.current === null) return;
    
    dragOverItem.current = index;

    if (dragItem.current !== index) {
        const newTasks = [...tasks];
        const draggedItemContent = newTasks[dragItem.current];
        
        newTasks.splice(dragItem.current, 1);
        newTasks.splice(index, 0, draggedItemContent);
        
        dragItem.current = index;
        setTasks(newTasks);
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === FilterType.ACTIVE) return !task.completed;
    if (filter === FilterType.COMPLETED) return task.completed;
    return true;
  });

  const activeCount = tasks.filter(t => !t.completed).length;

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-dark-900 text-slate-100 font-sans selection:bg-brand-500 selection:text-white pb-20 overflow-x-hidden">
      
      {/* Celebration Effects */}
      {isCelebrating && <Confetti />}

      {/* Header Background Gradient */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none z-0"></div>

      {/* Language Switcher (Top Right) */}
      <div className="fixed top-4 end-4 z-50">
          <div className="relative">
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 bg-dark-800/80 backdrop-blur-md border border-dark-700 px-3 py-2 rounded-full cursor-pointer hover:border-brand-500 transition-all shadow-lg hover:shadow-brand-500/20"
              >
                  <span className="text-lg leading-none">{currentLang.flag}</span>
                  <span className="text-sm font-semibold text-slate-300 hidden md:inline">{currentLang.label}</span>
                  <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isLangMenuOpen && (
                <div className="absolute top-full end-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as Language);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-start px-4 py-3 flex items-center gap-3 hover:bg-dark-700 transition-colors ${
                        language === lang.code ? 'bg-brand-500/10 text-brand-400' : 'text-slate-300'
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="font-medium">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
          </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 md:py-16">
        
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2 animate-fade-in">
            <div className="flex items-center gap-4">
              {/* Animated Logo Container */}
              <div className="relative group cursor-default">
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                  <div className="relative bg-gradient-to-tr from-fuchsia-600 via-orange-500 to-yellow-400 p-3.5 rounded-2xl shadow-lg shadow-orange-500/20 shrink-0 transform transition-transform group-hover:scale-105 group-hover:rotate-6 duration-300">
                      <RocketIcon className="text-white w-9 h-9 drop-shadow-md" />
                  </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-sm">
                  {t.title}
              </h1>
            </div>
        </div>
        
        {/* Buddy Status Message */}
        <p className={`mt-2 text-sm font-medium transition-colors duration-500 ps-1 ${
          activeCount > 5 ? 'text-red-400' : 'text-slate-400'
        }`}>
          {getBuddyMessage(activeCount)}
        </p>

        {/* Status Bar & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 mb-6 gap-4">
            <div className="font-bold text-slate-400 ps-1">
                {activeCount === 0 && tasks.length > 0 
                    ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">{t.allDone}</span>
                    : <span>{activeCount} {t.remaining}</span>
                }
            </div>
            
            {/* Alive Filter Pills */}
            <div className="flex bg-dark-800/80 p-1.5 rounded-xl border border-dark-700/50 backdrop-blur-sm">
                {(Object.keys(FilterType) as Array<keyof typeof FilterType>).map((key) => {
                    const type = FilterType[key];
                    const isActive = filter === type;
                    return (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                                isActive 
                                    ? 'text-white shadow-lg shadow-indigo-500/25' 
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg -z-10"></div>
                            )}
                            {t.filters[type]}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Input */}
        <AddTask 
            onAdd={addTask} 
            placeholder={t.placeholder}
            buttonText={t.add}
        />

        {/* List */}
        <div className="space-y-3">
            {filteredTasks.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                    <p className="text-xl font-bold text-slate-600">{t.empty.default}</p>
                    <p className="text-slate-700 mt-2">
                      {filter === FilterType.COMPLETED 
                        ? t.empty.completed
                        : t.empty.active}
                    </p>
                </div>
            ) : (
                filteredTasks.map((task, index) => (
                    <TaskItem 
                        key={task.id} 
                        index={index}
                        task={task} 
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onAddSubtasks={handleMagicBreakdown}
                        onToggleSubtask={toggleSubtask}
                        onExpand={handleExpand}
                        lang={language}
                        translations={t.task}
                        // Only enable Drag and Drop if we are looking at the full list
                        isDraggable={filter === FilterType.ALL}
                        onDragStart={handleDragStart}
                        onDragEnter={handleDragEnter}
                        onDragEnd={handleDragEnd}
                    />
                ))
            )}
        </div>
      </div>

      {/* Toast Notification */}
      <Toast 
        message={toast.msg} 
        type={toast.type} 
        isVisible={toast.visible} 
        onClose={closeToast} 
      />
    </div>
  );
};

export default App;
