
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

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onEdit, onDelete }) => {
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
    <div className="overflow-x-auto no-scrollbar">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-slate-500">
            <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md w-12 px-6 py-4"></th>
            <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-left text-xs font-bold uppercase tracking-widest">Transaction Details</th>
            <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">Quantity</th>
            <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">Revenue</th>
            <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">Discrepancy</th>
            <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(sale => {
            const isExpanded = expandedRowId === sale.id;
            return (
              <React.Fragment key={sale.id}>
                <motion.tr 
                  layout
                  onClick={() => handleToggleRow(sale.id)}
                  className={`group cursor-pointer transition-all duration-300 ${isExpanded ? 'bg-indigo-600/10' : 'bg-slate-950/50 hover:bg-white/5'}`}
                >
                  <td className="px-6 py-5 rounded-l-2xl border-y border-l border-white/5">
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="text-slate-500 group-hover:text-indigo-400 transition-colors"
                    >
                        <ChevronDown className="h-5 w-5" />
                    </motion.div>
                  </td>
                  <td className="px-6 py-5 border-y border-white/5">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{sale.shopName}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-1.5 py-0.5 rounded-md">{sale.stockType}</span>
                            <span className="text-xs font-medium text-slate-500">{formatDate(sale.date)}</span>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 border-y border-white/5 text-right">
                    <span className="text-sm font-bold text-slate-300">{sale.bagsSold} bags</span>
                  </td>
                  <td className="px-6 py-5 border-y border-white/5 text-right">
                    <div className="text-sm text-white">
                        <CurrencyDisplay value={sale.expectedRevenue} />
                    </div>
                  </td>
                  <td className="px-6 py-5 border-y border-white/5 text-right">
                    <DiscrepancyDisplay value={sale.discrepancy} />
                  </td>
                  <td className="px-6 py-5 rounded-r-2xl border-y border-r border-white/5 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(sale); }} 
                            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all"
                            title="Edit record"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(sale); }} 
                            className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-rose-600 hover:text-white transition-all"
                            title="Delete record"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                  </td>
                </motion.tr>
                
                <AnimatePresence>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="p-0">
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
  );
};
