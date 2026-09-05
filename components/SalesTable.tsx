
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Edit2, 
    Trash2, 
    ChevronDown, 
    FileText, 
    DollarSign, 
    Package, 
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from 'lucide-react';
import type { SaleRecord } from '../types';

interface SalesTableProps {
  sales: SaleRecord[];
  onEdit: (sale: SaleRecord) => void;
  onDelete: (sale: SaleRecord) => void;
  isReadOnly?: boolean;
}

const CurrencyDisplay: React.FC<{ value: number }> = ({ value }) => (
    <span className="font-mono font-bold">
        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)}
    </span>
);

const DiscrepancyDisplay: React.FC<{ value: number }> = ({ value }) => {
    if (value === 0) return <span className="text-slate-500 font-mono font-bold">-</span>;
    
    const isNegative = value < 0;
    const colorClass = isNegative ? 'text-rose-400' : 'text-amber-400';
    const Icon = isNegative ? ArrowDownRight : ArrowUpRight;
  
    return (
        <div className={`flex items-center justify-end gap-1.5 ${colorClass}`}>
            <Icon className="h-3.5 w-3.5" />
            <CurrencyDisplay value={Math.abs(value)} />
        </div>
    );
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onEdit, onDelete, isReadOnly = false }) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const handleToggleRow = (saleId: string) => {
    setExpandedRowId(currentId => (currentId === saleId ? null : saleId));
  };

  if (sales.length === 0) {
    return (
      <div className="text-center py-20 px-6 bg-slate-950/50 rounded-[2rem] border border-white/5 border-dashed">
        <div className="inline-flex p-4 bg-slate-900 rounded-2xl mb-4">
            <FileText className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No sales records found</h3>
        <p className="text-slate-500 font-medium max-w-xs mx-auto">Start by adding a new sale record from the management menu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table View (Responsive scrolling container) */}
      <div className="block">
        <div className="sm:hidden flex items-center justify-between text-[11px] text-slate-400 font-medium px-2 py-1 mb-2">
          <span>↔ Swipe table horizontally to see all columns</span>
        </div>
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <table className="min-w-[800px] w-full whitespace-nowrap border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-500">
                <th className="sticky top-0 z-10 w-12 px-6 py-4"></th>
                <th className="sticky top-0 z-10 px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Transaction Details</th>
                <th className="sticky top-0 z-10 px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Quantity</th>
                <th className="sticky top-0 z-10 px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Revenue</th>
                <th className="sticky top-0 z-10 px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Discrepancy</th>
                {!isReadOnly && <th className="sticky top-0 z-10 px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => {
                const isExpanded = expandedRowId === sale.id;
                const brandBadgeStyle = sale.stockType === "DANGOTE"
                  ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20";

                return (
                  <React.Fragment key={sale.id}>
                    <motion.tr 
                      layout
                      onClick={() => handleToggleRow(sale.id)}
                      className={`group cursor-pointer transition-all duration-300 ${
                        isExpanded 
                          ? 'bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent' 
                          : 'bg-slate-900/40 hover:bg-slate-900/80'
                      }`}
                    >
                      <td className="px-6 py-5 rounded-l-2xl border-y border-l border-white/5">
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                              isExpanded ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-500 group-hover:text-indigo-400'
                            }`}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </motion.div>
                      </td>
                      <td className="px-6 py-5 border-y border-white/5">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{sale.shopName}</span>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${brandBadgeStyle}`}>
                                  {sale.stockType}
                                </span>
                                <span className="text-xs font-bold text-slate-500 font-mono flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(sale.date)}
                                </span>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 border-y border-white/5 text-right">
                        <span className="text-sm font-black text-slate-300 font-mono">{sale.bagsSold} bags</span>
                      </td>
                      <td className="px-6 py-5 border-y border-white/5 text-right">
                        <div className="text-sm font-black text-white">
                            <CurrencyDisplay value={sale.expectedRevenue} />
                        </div>
                      </td>
                      <td className={`px-6 py-5 border-y border-white/5 text-right ${isReadOnly ? 'rounded-r-2xl border-r' : ''}`}>
                        <DiscrepancyDisplay value={sale.discrepancy} />
                      </td>
                      {!isReadOnly && (
                        <td className="px-6 py-5 rounded-r-2xl border-y border-r border-white/5 text-right">
                          <div className="flex items-center justify-end gap-2">
                              <button 
                                  onClick={(e) => { e.stopPropagation(); onEdit(sale); }} 
                                  className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all hover:scale-105 duration-200"
                                  title="Edit record"
                              >
                                  <Edit2 className="h-4.5 w-4.5" />
                              </button>
                              <button 
                                  onClick={(e) => { e.stopPropagation(); onDelete(sale); }} 
                                  className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-rose-600 hover:text-white transition-all hover:scale-105 duration-200"
                                  title="Delete record"
                              >
                                  <Trash2 className="h-4.5 w-4.5" />
                              </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={isReadOnly ? 5 : 6} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mx-6 mb-3 p-8 rounded-3xl bg-slate-900/50 border border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price per Bag</p>
                                    <p className="text-sm font-bold text-white"><CurrencyDisplay value={sale.pricePerBag} /></p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Transferred</p>
                                    <p className="text-sm font-bold text-indigo-400"><CurrencyDisplay value={sale.totalTransfer} /></p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Expenses</p>
                                    <p className="text-sm font-bold text-rose-400"><CurrencyDisplay value={sale.expenses} /></p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Net Profit</p>
                                    <p className="text-sm font-bold text-emerald-400"><CurrencyDisplay value={sale.totalTransfer - sale.expenses} /></p>
                                </div>
                                
                                {sale.notes && (
                                  <div className="sm:col-span-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="h-4 w-4 text-slate-500" />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transaction Notes</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 text-sm text-slate-400 leading-relaxed italic">
                                        "{sale.notes}"
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
