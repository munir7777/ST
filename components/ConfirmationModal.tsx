
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md sm:max-w-lg my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col bg-[#121418] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 pb-3 sm:pb-4 flex items-center justify-between border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 sm:p-2.5 ${colors.bg} rounded-xl shrink-0`}>
                  <AlertTriangle className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {message || children}
            </div>
            
            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-white/5 bg-[#0e1014] shrink-0 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl border border-white/5 text-xs sm:text-sm transition-all active:scale-[0.98]"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`w-full sm:flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] ${colors.button}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
