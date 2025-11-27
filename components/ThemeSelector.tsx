
import React from 'react';
import { Theme } from '../types';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  isOpen: boolean;
  onClose: () => void;
}

const themes: { id: Theme; name: string; colors: string }[] = [
  { id: 'sunset', name: 'Sunset', colors: 'from-fuchsia-500 to-orange-500' },
  { id: 'ocean', name: 'Ocean', colors: 'from-cyan-500 to-blue-500' },
  { id: 'forest', name: 'Forest', colors: 'from-green-500 to-lime-500' },
  { id: 'dream', name: 'Dream', colors: 'from-purple-500 to-pink-500' },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-48 bg-bg-800 border border-bg-700 rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
      <div className="p-2 space-y-1">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => {
              onThemeChange(theme.id);
              onClose();
            }}
            className={`w-full text-start px-3 py-2 flex items-center gap-3 rounded-lg transition-colors ${
              currentTheme === theme.id 
                ? 'bg-primary-500/10 text-primary-500' 
                : 'text-text-300 hover:bg-bg-700'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${theme.colors}`}></div>
            <span className="font-medium text-sm">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
