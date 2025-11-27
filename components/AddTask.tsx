
import React, { useState, useRef } from 'react';
import { PlusIcon, CalendarIcon } from './Icons';

interface AddTaskProps {
  onAdd: (title: string, dueDate?: number) => void;
  placeholder: string;
  buttonText: string;
}

export const AddTask: React.FC<AddTaskProps> = ({ onAdd, placeholder, buttonText }) => {
  const [inputValue, setInputValue] = useState('');
  const [dueDateStr, setDueDateStr] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      let dueDateTimestamp: number | undefined = undefined;
      
      if (dueDateStr) {
        dueDateTimestamp = new Date(dueDateStr).getTime();
      }

      onAdd(inputValue.trim(), dueDateTimestamp);
      
      // Reset
      setInputValue('');
      setDueDateStr('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-8 group z-20">
      {/* Glow Effect behind input */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 rounded-2xl blur opacity-20 group-focus-within:opacity-60 transition duration-500 animate-pulse"></div>
      
      <div className="relative flex items-center bg-bg-800 rounded-2xl border border-bg-700 shadow-2xl overflow-hidden transition-colors group-focus-within:border-primary-500/50">
          <div className="ps-4 text-text-500 group-focus-within:text-primary-500 transition-colors">
            <PlusIcon className="w-6 h-6" />
          </div>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-text-100 placeholder-text-500 py-5 ps-3 pe-40 text-lg focus:outline-none"
          />

          {/* Actions Container */}
          <div className="absolute end-2 flex items-center gap-2">
            
            {/* Aesthetic Date Trigger */}
            <div className="relative group/date">
                {/* Visual Container (formerly button) */}
                <div
                    className={`relative p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center border overflow-hidden cursor-pointer ${
                        dueDateStr 
                        ? 'border-transparent text-white shadow-lg shadow-primary-500/30' 
                        : 'bg-bg-700/50 border-transparent text-text-500 hover:bg-bg-700 hover:text-primary-400'
                    }`}
                >
                    {/* Active Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-tr from-primary-600 to-secondary-500 transition-opacity duration-300 ${dueDateStr ? 'opacity-100' : 'opacity-0'}`}></div>

                    <CalendarIcon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${dueDateStr ? 'scale-110' : 'group-hover/date:scale-110'}`} />
                    
                    {/* Visual Dot if date is set */}
                    {dueDateStr && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75 z-10"></span>
                    )}
                </div>
                
                {/* Native Input: Colored and Dark Mode - Z-Index 20 ensures it sits ON TOP of the icon */}
                <input 
                    type="datetime-local" 
                    ref={dateInputRef}
                    value={dueDateStr}
                    onChange={(e) => setDueDateStr(e.target.value)}
                    aria-label="Due Date"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer accent-primary-500 z-20"
                    style={{ colorScheme: 'dark' }}
                />
            </div>

            {/* Alive Add Button */}
            <button 
                type="submit"
                disabled={!inputValue.trim()}
                className="bg-gradient-to-r from-primary-600 to-secondary-500 text-white px-6 py-2.5 rounded-xl font-bold tracking-wide hover:from-primary-500 hover:to-secondary-400 active:scale-95 disabled:opacity-0 disabled:translate-x-4 transition-all duration-300 shadow-lg shadow-secondary-500/20 hover:shadow-secondary-500/40"
            >
                {buttonText}
            </button>
          </div>
      </div>
    </form>
  );
};
