import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutDashboard, Plus, Archive, Download } from 'lucide-react';

interface NavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'dashboard' | 'new-sale' | 'inventory';
  onNavigate: (view: 'dashboard' | 'new-sale' | 'inventory') => void;
  onExportCSV: () => void;
  hasSalesToExport: boolean;
  isReadOnly: boolean;
}

export const NavMenu: React.FC<NavMenuProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  onExportCSV,
  hasSalesToExport,
  isReadOnly
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#090A0C]/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[280px] bg-[#121418] border-r border-white/5 shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <span className="text-sm font-display font-medium text-white tracking-widest uppercase">Menu</span>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[#A1A1AA] hover:bg-white/5 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 py-6 px-4 space-y-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-white/10 text-white'
                    : 'text-[#A1A1AA] hover:bg-white/5 hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </button>

              {!isReadOnly && (
                <button
                  onClick={() => onNavigate('new-sale')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentView === 'new-sale'
                      ? 'bg-white/10 text-white'
                      : 'text-[#A1A1AA] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>New Sale</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('inventory')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'inventory'
                    ? 'bg-white/10 text-white'
                    : 'text-[#A1A1AA] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Archive className="h-4 w-4" />
                <span>Inventory</span>
              </button>
            </div>

            <div className="p-4 border-t border-white/5">
              <button
                onClick={() => {
                  onExportCSV();
                  onClose();
                }}
                disabled={!hasSalesToExport}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  !hasSalesToExport
                    ? 'opacity-50 cursor-not-allowed text-[#52525B]'
                    : 'text-[#A1A1AA] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
