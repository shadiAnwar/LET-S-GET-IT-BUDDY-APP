import React, { useState } from 'react';
import { PlusIcon } from './Icons';

interface AddTaskProps {
  onAdd: (title: string) => void;
}

export const AddTask: React.FC<AddTaskProps> = ({ onAdd }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-8 group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <PlusIcon className="w-6 h-6 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="What's the plan, buddy?"
        className="w-full bg-dark-800 text-slate-100 placeholder-slate-500 rounded-2xl py-4 pl-12 pr-4 text-lg border-2 border-transparent focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-lg transition-all"
      />
      <button 
        type="submit"
        disabled={!inputValue.trim()}
        className="absolute right-2 top-2 bottom-2 bg-brand-600 text-white px-4 rounded-xl font-semibold hover:bg-brand-500 active:scale-95 disabled:opacity-0 disabled:scale-90 transition-all duration-200"
      >
        Add
      </button>
    </form>
  );
};