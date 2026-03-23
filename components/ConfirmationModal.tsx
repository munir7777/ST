
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: React.ReactNode;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  const colorMap = {
    danger: {
      bg: 'bg-rose-500/10',
      icon: 'text-rose-400',
      button: 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20',
      border: 'border-rose-500/20'
    },
    warning: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20',
      border: 'border-amber-500/20'
    },
    info: {
      bg: 'bg-indigo-500/10',
      icon: 'text-indigo-400',
      button: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20',
      border: 'border-indigo-500/20'
    }
  };

  const colors = colorMap[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 sm:p-10">
              <div className="flex items-start gap-6">
                <div className={`flex-shrink-0 p-4 ${colors.bg} rounded-2xl`}>
                  <AlertTriangle className={`h-8 w-8 ${colors.icon}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
                    <button 
                      onClick={onClose}
                      className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="text-slate-400 font-medium leading-relaxed">
                    {message || children}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-10">
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`flex-1 py-4 px-6 rounded-2xl text-white font-bold shadow-lg transition-all active:scale-[0.98] ${colors.button}`}
                >
                  {confirmText}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl border border-white/5 transition-all active:scale-[0.98]"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
