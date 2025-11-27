
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, SubTask, FilterType, Language, Theme } from './types';
import { TaskItem } from './components/TaskItem';
import { AddTask } from './components/AddTask';
import { RocketIcon, ChevronDownIcon, PaletteIcon, DownloadIcon, MenuIcon, XIcon, UserIcon, MailIcon, LogOutIcon } from './components/Icons';
import { Toast } from './components/Toast';
import { Confetti } from './components/Confetti';
import { ThemeSelector } from './components/ThemeSelector';
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
  const [theme, setTheme] = useState<Theme>('sunset');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth State (Mock)
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  
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

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Auth Functions
  const handleSignUp = (e: React.FormEvent) => {
      e.preventDefault();
      if (emailInput.trim()) {
          setUserEmail(emailInput);
          localStorage.setItem('lets-get-it-buddy-user', emailInput);
          setEmailInput('');
          showToast('success'); // Reusing success toast for positive feedback
      }
  };

  const handleSignOut = () => {
      setUserEmail(null);
      localStorage.removeItem('lets-get-it-buddy-user');
  };

  // Load from local storage (tasks, language, theme, user)
  useEffect(() => {
    const savedTasks = localStorage.getItem('lets-get-it-buddy-tasks');
    const savedLang = localStorage.getItem('lets-get-it-buddy-lang') as Language;
    const savedTheme = localStorage.getItem('lets-get-it-buddy-theme') as Theme;
    const savedUser = localStorage.getItem('lets-get-it-buddy-user');
    
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

    if (savedTheme && ['sunset', 'ocean', 'forest', 'dream'].includes(savedTheme)) {
        setTheme(savedTheme);
    }

    if (savedUser) {
        setUserEmail(savedUser);
    }

    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lets-get-it-buddy-tasks', JSON.stringify(tasks));
      localStorage.setItem('lets-get-it-buddy-lang', language);
      localStorage.setItem('lets-get-it-buddy-theme', theme);
    }
  }, [tasks, language, theme, isLoaded]);

  // Apply Theme to Body
  useEffect(() => {
    // Remove all theme classes first
    document.body.classList.remove('theme-sunset', 'theme-ocean', 'theme-forest', 'theme-dream');
    // Add current theme class
    if (theme !== 'sunset') {
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

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
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-bg-900 text-text-100 font-sans selection:bg-primary-500 selection:text-white pb-20 overflow-x-hidden transition-colors duration-500">
      
      {/* Celebration Effects */}
      {isCelebrating && <Confetti />}

      {/* Header Background Gradient */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary-900/20 to-transparent pointer-events-none z-0"></div>

      {/* Menu Button - Left */}
      <div className="fixed top-4 start-4 z-50">
        <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-800/80 backdrop-blur-md border border-bg-700 shadow-lg text-text-300 hover:text-primary-500 hover:border-primary-500 transition-all"
        >
            <MenuIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar Drawer */}
      <div className={`fixed top-0 bottom-0 start-0 w-80 bg-bg-900/95 backdrop-blur-xl border-e border-bg-700 shadow-2xl z-[70] transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full p-6">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-tr from-primary-600 to-secondary-500 p-2 rounded-xl">
                          <RocketIcon className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight">Buddy</h2>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="text-text-500 hover:text-white transition-colors">
                      <XIcon className="w-6 h-6" />
                  </button>
              </div>

              {/* User / Auth Section */}
              <div className="mb-8">
                  {userEmail ? (
                      <div className="bg-bg-800 rounded-2xl p-5 border border-bg-700/50">
                          <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                                  <UserIcon className="w-5 h-5" />
                              </div>
                              <div>
                                  <p className="text-xs text-text-500">{t.sidebar.welcome}</p>
                                  <p className="font-semibold text-text-100 truncate w-40">{userEmail}</p>
                              </div>
                          </div>
                          <button 
                             onClick={handleSignOut}
                             className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 py-2 rounded-lg transition-colors"
                          >
                              <LogOutIcon className="w-4 h-4" />
                              {t.sidebar.signOut}
                          </button>
                      </div>
                  ) : (
                      <div className="bg-bg-800 rounded-2xl p-5 border border-bg-700/50">
                          <h3 className="font-bold mb-4 flex items-center gap-2">
                             <span className="w-2 h-6 bg-secondary-500 rounded-full"></span>
                             {t.sidebar.signUp}
                          </h3>
                          <form onSubmit={handleSignUp} className="space-y-4">
                              <div>
                                  <label className="block text-xs font-medium text-text-500 mb-1">{t.sidebar.email}</label>
                                  <div className="relative">
                                      <MailIcon className="absolute start-3 top-3 w-4 h-4 text-text-500" />
                                      <input 
                                        type="email" 
                                        required
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        className="w-full bg-bg-900 border border-bg-700 rounded-lg py-2.5 ps-9 pe-3 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                                        placeholder="hello@example.com" 
                                      />
                                  </div>
                              </div>
                              <button 
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-500 hover:to-secondary-400 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary-500/20"
                              >
                                  {t.sidebar.signUpBtn}
                              </button>
                          </form>
                      </div>
                  )}
              </div>
            
              <div className="flex-1"></div>

              {/* Install App Section (Only if available) */}
              {deferredPrompt && (
                  <div className="mt-auto bg-gradient-to-br from-bg-800 to-bg-700 p-5 rounded-2xl border border-bg-600 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <RocketIcon className="w-24 h-24 text-white transform rotate-45 translate-x-4 -translate-y-4" />
                      </div>
                      
                      <div className="relative z-10">
                          <h4 className="font-bold text-lg mb-1">{t.sidebar.install}</h4>
                          <p className="text-xs text-text-300 mb-4 leading-relaxed">{t.sidebar.installDesc}</p>
                          <button 
                            onClick={handleInstallClick}
                            className="w-full flex items-center justify-center gap-2 bg-white text-bg-900 font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                          >
                              <DownloadIcon className="w-4 h-4" />
                              {t.sidebar.install}
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Controls: Theme, Language (Top Right) */}
      <div className="fixed top-4 end-4 z-50 flex items-center gap-2">
          
          {/* Theme Switcher */}
          <div className="relative">
             <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="flex items-center justify-center bg-bg-800/80 backdrop-blur-md border border-bg-700 w-10 h-10 rounded-full cursor-pointer hover:border-primary-500 transition-all shadow-lg hover:shadow-primary-500/20 text-text-300 hover:text-primary-500"
                aria-label="Change Theme"
             >
                <PaletteIcon className="w-5 h-5" />
             </button>
             <ThemeSelector 
                currentTheme={theme} 
                onThemeChange={setTheme} 
                isOpen={isThemeMenuOpen} 
                onClose={() => setIsThemeMenuOpen(false)} 
             />
          </div>

          {/* Language Switcher */}
          <div className="relative">
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 bg-bg-800/80 backdrop-blur-md border border-bg-700 px-3 py-2 rounded-full cursor-pointer hover:border-primary-500 transition-all shadow-lg hover:shadow-primary-500/20"
              >
                  <span className="text-lg leading-none">{currentLang.flag}</span>
                  <span className="text-sm font-semibold text-text-300 hidden md:inline">{currentLang.label}</span>
                  <ChevronDownIcon className={`w-4 h-4 text-text-500 transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isLangMenuOpen && (
                <div className="absolute top-full end-0 mt-2 w-48 bg-bg-800 border border-bg-700 rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as Language);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-start px-4 py-3 flex items-center gap-3 hover:bg-bg-700 transition-colors ${
                        language === lang.code ? 'bg-primary-500/10 text-primary-400' : 'text-text-300'
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
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-secondary-500 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                  <div className="relative bg-gradient-to-tr from-primary-600 via-secondary-500 to-primary-400 p-3.5 rounded-2xl shadow-lg shadow-secondary-500/20 shrink-0 transform transition-transform group-hover:scale-105 group-hover:rotate-6 duration-300">
                      <RocketIcon className="text-white w-9 h-9 drop-shadow-md" />
                  </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-text-300 to-text-500 drop-shadow-sm">
                  {t.title}
              </h1>
            </div>
        </div>
        
        {/* Buddy Status Message */}
        <p className={`mt-2 text-sm font-medium transition-colors duration-500 ps-1 ${
          activeCount > 5 ? 'text-red-400' : 'text-text-500'
        }`}>
          {getBuddyMessage(activeCount)}
        </p>

        {/* Status Bar & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 mb-6 gap-4">
            <div className="font-bold text-text-500 ps-1">
                {activeCount === 0 && tasks.length > 0 
                    ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">{t.allDone}</span>
                    : <span>{activeCount} {t.remaining}</span>
                }
            </div>
            
            {/* Alive Filter Pills */}
            <div className="flex bg-bg-800/80 p-1.5 rounded-xl border border-bg-700/50 backdrop-blur-sm">
                {(Object.keys(FilterType) as Array<keyof typeof FilterType>).map((key) => {
                    const type = FilterType[key];
                    const isActive = filter === type;
                    return (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                                isActive 
                                    ? 'text-white shadow-lg shadow-primary-500/25' 
                                    : 'text-text-500 hover:text-text-300 hover:bg-white/5'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg -z-10"></div>
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
                    <p className="text-xl font-bold text-text-500">{t.empty.default}</p>
                    <p className="text-text-500 mt-2">
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
