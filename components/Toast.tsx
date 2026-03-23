
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
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400" />,
    info: <Info className="h-5 w-5 text-indigo-400" />,
  };

  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
    error: 'bg-rose-500/10 border-rose-500/20 shadow-rose-500/10',
    info: 'bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/10',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`
        flex items-center gap-4 p-5 rounded-2xl border backdrop-blur-xl shadow-2xl min-w-[320px] max-w-md
        ${styles[type]}
      `}
    >
      <div className="flex-shrink-0 p-2 bg-white/5 rounded-xl">{icons[type]}</div>
      <div className="flex-grow text-sm font-bold text-white leading-tight">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"
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
    <div className="fixed bottom-8 right-8 z-[1000] flex flex-col gap-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};
