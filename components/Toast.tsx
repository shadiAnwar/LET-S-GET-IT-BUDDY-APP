import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'roast';
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-50 transform transition-all duration-300 animate-slide-up flex items-center gap-3 border-2 ${
      type === 'success' 
        ? 'bg-dark-800 border-brand-500 text-brand-300' 
        : 'bg-dark-800 border-red-500 text-red-400'
    }`}>
      <span className="text-2xl">{type === 'success' ? '🔥' : '💀'}</span>
      <span className="font-bold text-sm md:text-base tracking-wide">{message}</span>
    </div>
  );
};