import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    icon?: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ 
    title, 
    children, 
    isOpen, 
    onToggle,
    icon 
}) => {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-white/20">
            <button
                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
                onClick={onToggle}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {icon && <div className="text-indigo-400">{icon}</div>}
                    <span className="text-lg font-bold text-slate-100 tracking-tight">{title}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="text-slate-400"
                >
                    <ChevronDown className="h-5 w-5" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                        <div className="border-t border-white/5 p-6 bg-slate-900/20">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};