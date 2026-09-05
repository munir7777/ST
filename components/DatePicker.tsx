
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(true);
    const [desktopCoords, setDesktopCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const buttonRef = useRef<HTMLButtonElement>(null);
    const calendarCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const updateDesktopPosition = useCallback(() => {
        if (buttonRef.current && window.innerWidth >= 640) {
            const rect = buttonRef.current.getBoundingClientRect();
            const calendarWidth = 320;
            const spaceBelow = window.innerHeight - rect.bottom;
            const fitsBelow = spaceBelow >= 360;
            const top = fitsBelow ? rect.bottom + 8 : Math.max(16, rect.top - 368);
            const left = Math.min(Math.max(16, rect.left), window.innerWidth - calendarWidth - 16);
            setDesktopCoords({ top, left });
        }
    }, []);

    const handleToggle = () => {
        if (!isOpen) {
            updateDesktopPosition();
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    // Close on Escape or click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node;
            if (
                buttonRef.current && !buttonRef.current.contains(target) &&
                calendarCardRef.current && !calendarCardRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        const handleScrollOrResize = () => {
            if (window.innerWidth >= 640) {
                updateDesktopPosition();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        // Lock body scroll on mobile so tapping calendar doesn't scroll page behind
        let originalOverflow = '';
        if (window.innerWidth < 640) {
            originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
            if (window.innerWidth < 640 && originalOverflow !== undefined) {
                document.body.style.overflow = originalOverflow;
            }
        };
    }, [isOpen, updateDesktopPosition]);

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

        const handleSelectToday = () => {
            const today = new Date();
            const y = today.getFullYear();
            const m = (today.getMonth() + 1).toString().padStart(2, '0');
            const d = today.getDate().toString().padStart(2, '0');
            onChange(`${y}-${m}-${d}`);
            setIsOpen(false);
        };

        const calendarCard = (
            <motion.div 
                ref={calendarCardRef}
                initial={{ opacity: 0, y: isMobile ? 20 : 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: isMobile ? 20 : 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[320px] bg-slate-900/98 backdrop-blur-2xl p-4 rounded-3xl shadow-2xl border border-white/10 select-none sm:w-80"
            >
                <div className="flex justify-between items-center mb-3">
                    <button 
                        type="button" 
                        onClick={() => changeMonth(-1)} 
                        className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors active:scale-95"
                        aria-label="Previous Month"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="font-bold text-white text-sm tracking-wide">
                        {MONTH_NAMES[month]} {year}
                    </div>
                    <button 
                        type="button" 
                        onClick={() => changeMonth(1)} 
                        className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors active:scale-95"
                        aria-label="Next Month"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {DAY_NAMES.map(day => (
                        <div key={day} className="font-bold text-slate-500 text-[11px] uppercase tracking-wider py-1">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-3">
                    {blanks.map((_, i) => (
                        <div key={`blank-${i}`} className="w-full aspect-square" />
                    ))}
                    {days.map(day => {
                        const isSelected = selectedDate 
                            ? (selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year) 
                            : false;
                        const todayDate = new Date();
                        const isToday = todayDate.getDate() === day && todayDate.getMonth() === month && todayDate.getFullYear() === year;
                        
                        return (
                            <button 
                                type="button" 
                                key={day} 
                                onClick={() => handleDateSelect(day)}
                                className={`
                                    w-full aspect-square flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 active:scale-95
                                    ${isSelected 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105' 
                                        : isToday 
                                            ? 'text-indigo-400 hover:bg-white/5 border border-indigo-500/40 bg-indigo-500/5' 
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white active:bg-white/10'
                                    }
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <button
                        type="button"
                        onClick={handleSelectToday}
                        className="px-3 py-1.5 rounded-xl text-indigo-400 hover:bg-indigo-500/10 font-bold transition-colors active:scale-95"
                    >
                        Today
                    </button>
                    <div className="flex items-center gap-1">
                        {value && (
                            <button
                                type="button"
                                onClick={() => { onChange(''); setIsOpen(false); }}
                                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-semibold transition-colors active:scale-95"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 hover:text-white font-semibold transition-colors active:scale-95"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </motion.div>
        );

        if (!mounted || typeof document === 'undefined') return null;

        return createPortal(
            <AnimatePresence>
                {isOpen && (
                    <>
                        {isMobile ? (
                            /* Mobile: Fullscreen centered modal backdrop placed directly on document.body */
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                                onClick={() => setIsOpen(false)}
                            >
                                {calendarCard}
                            </motion.div>
                        ) : (
                            /* Tablet & Desktop: Floating dropdown positioned relative to button without container clipping */
                            <div className="fixed inset-0 z-[99998]" onClick={() => setIsOpen(false)}>
                                <div 
                                    style={{ 
                                        position: 'fixed', 
                                        top: `${desktopCoords.top}px`, 
                                        left: `${desktopCoords.left}px`,
                                        zIndex: 99999
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {calendarCard}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </AnimatePresence>,
            document.body
        );
    };

    const formattedDate = selectedDate?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="relative group">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                {label}
            </label>
            <div className="relative">
                <button
                    ref={buttonRef}
                    type="button" 
                    onClick={handleToggle}
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
            
            {renderCalendar()}
        </div>
    );
};

