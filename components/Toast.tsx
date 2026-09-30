
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 2500);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />,
    error: <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-400" />,
    info: <Info className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />,
  };

  const styles = {
    success: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100 shadow-emerald-950/50',
    error: 'bg-rose-950/90 border-rose-500/30 text-rose-100 shadow-rose-950/50',
    info: 'bg-indigo-950/90 border-indigo-500/30 text-indigo-100 shadow-indigo-950/50',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className={`
        flex items-center gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border backdrop-blur-xl shadow-xl w-full sm:min-w-[280px] sm:max-w-md
        ${styles[type]}
      `}
    >
      <div className="flex-shrink-0 p-1.5 bg-white/10 rounded-lg">{icons[type]}</div>
      <div className="flex-grow text-xs sm:text-sm font-semibold text-white leading-snug">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: { id: string; message: string; type?: ToastType }[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[1000] flex flex-col gap-2 pointer-events-none max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
