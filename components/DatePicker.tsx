
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerProps {
    label: string;
    value: string; // YYYY-MM-DD or empty string
    onChange: (value: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value + 'T00:00:00') : null);
    const [viewDate, setViewDate] = useState(value ? new Date(value + 'T00:00:00') : new Date());
    const datePickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        const newDate = value ? new Date(value + 'T00:00:00') : null;
        setSelectedDate(newDate);
        if (newDate) {
            setViewDate(newDate);
        } else {
            setViewDate(new Date()); // Reset view to current month if date is cleared
        }
    }, [value]);

    const handleDateSelect = (day: number) => {
        const newSelectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const year = newSelectedDate.getFullYear();
        const month = (newSelectedDate.getMonth() + 1).toString().padStart(2, '0');
        const date = newSelectedDate.getDate().toString().padStart(2, '0');
        onChange(`${year}-${month}-${date}`);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
    };

    const changeMonth = (delta: number) => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = getFirstDayOfMonth(year, month);
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 z-50 bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/10 w-72"
            >
                <div className="flex justify-between items-center mb-4">
                    <button 
                        type="button" 
                        onClick={() => changeMonth(-1)} 
                        className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="font-bold text-white text-sm">{MONTH_NAMES[month]} {year}</div>
                    <button 
                        type="button" 
                        onClick={() => changeMonth(1)} 
                        className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {DAY_NAMES.map(day => (
                        <div key={day} className="font-bold text-slate-500 text-[10px] uppercase tracking-widest py-2">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {blanks.map((_, i) => <div key={`blank-${i}`} className="w-9 h-9"></div>)}
                    {days.map(day => {
                        const isSelected = selectedDate ? (selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year) : false;
                        const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                        
                        return (
                            <button 
                                type="button" 
                                key={day} 
                                onClick={() => handleDateSelect(day)}
                                className={`
                                    w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200
                                    ${isSelected 
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-110' 
                                        : isToday 
                                            ? 'text-indigo-400 hover:bg-white/5 border border-indigo-500/30' 
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        );
    };

    const formattedDate = selectedDate?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="relative group" ref={datePickerRef}>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                {label}
            </label>
            <div className="relative">
                <button
                    type="button" 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        flex items-center justify-between w-full px-4 py-3 bg-slate-900/50 border rounded-2xl transition-all duration-300 text-left outline-none
                        ${isOpen ? 'border-indigo-500/50 ring-4 ring-indigo-500/10' : 'border-white/5 hover:border-white/10'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <CalendarIcon className={`h-4 w-4 transition-colors ${selectedDate ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className={`text-sm font-bold transition-colors ${selectedDate ? "text-white" : "text-slate-500"}`}>
                            {formattedDate || 'Select Date'}
                        </span>
                    </div>
                </button>
                
                <AnimatePresence>
                    {selectedDate && (
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            type="button" 
                            onClick={handleClear} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X className="h-3.5 w-3.5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
            
            <AnimatePresence>
                {isOpen && renderCalendar()}
            </AnimatePresence>
        </div>
    );
};
