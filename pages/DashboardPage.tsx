
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Plus, 
  Archive, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Search,
  XCircle,
  Calendar,
  BarChart3,
  ShoppingBag,
  Store
} from 'lucide-react';
import { SalesTable } from '../components/SalesTable';
import { ShopPerformance } from '../components/ShopPerformance';
import { DatePicker } from '../components/DatePicker';
import { ConfirmationModal } from '../components/ConfirmationModal';
import type { SaleRecord } from '../types';
import { useToast } from '../ToastContext';

interface SummaryData {
    totalBagsSold: number;
    totalRevenue: number;
    totalTransferred: number;
    totalDiscrepancy: number;
}

interface DashboardPageProps {
    sales: SaleRecord[];
    summaryData: SummaryData;
    shopOptions: string[];
    onEditSale: (sale: SaleRecord) => void;
    onDeleteSale: (sale: SaleRecord) => void;
    onOpenAddSale: () => void;
    onOpenInventory: () => void;
}

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass?: string; isCurrency?: boolean }> = ({ title, value, icon, colorClass = 'text-slate-100', isCurrency = false }) => (
    <motion.div 
      whileHover={{ y: -4 }}
      className="p-6 rounded-3xl bg-slate-900/50 border border-white/5 backdrop-blur-sm shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-indigo-500/10 rounded-2xl">
          <div className="text-indigo-400">{icon}</div>
        </div>
        {isCurrency && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">+8.2%</span>
        )}
      </div>
      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
      <h3 className={`text-3xl font-black tracking-tight ${colorClass}`}>
        {isCurrency ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value)) : value}
      </h3>
    </motion.div>
);
  
export const DashboardPage: React.FC<DashboardPageProps> = ({
    sales,
    summaryData,
    shopOptions,
    onEditSale,
    onDeleteSale,
    onOpenAddSale,
    onOpenInventory,
}) => {
    const [filters, setFilters] = useState({
        shopName: '',
        startDate: '',
        endDate: '',
    });
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportRange, setExportRange] = useState({ startDate: '', endDate: '' });
    const [saleToDelete, setSaleToDelete] = useState<SaleRecord | null>(null);
    const { showToast } = useToast();

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name: 'startDate' | 'endDate', date: string) => {
        setFilters(prev => ({...prev, [name]: date}));
    };

    const handleClearFilters = () => {
        setFilters({ shopName: '', startDate: '', endDate: '' });
    };

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const shopMatch = filters.shopName ? sale.shopName.toLowerCase().includes(filters.shopName.toLowerCase()) : true;
            const startDateMatch = filters.startDate ? sale.date >= filters.startDate : true;
            const endDateMatch = filters.endDate ? sale.date <= filters.endDate : true;
            return shopMatch && startDateMatch && endDateMatch;
        });
    }, [sales, filters]);

    const handleExportToExcel = (dataToExportOverride?: SaleRecord[]) => {
        const salesToExport = dataToExportOverride || filteredSales;
        
        if (salesToExport.length === 0) {
          showToast("No data available for the selected range to export.", 'error');
          return;
        }
    
        const header = [
            'Date', 'Shop Name', 'Stock Type', 'Bags Sold', 
            'Price per Bag (NGN)', 'Expected Revenue (NGN)', 'Amount Transferred (NGN)', 'Expenses (NGN)', 
            'Notes / Expense Details', 'Discrepancy (NGN)'
        ];
        const currencyColumns = [4, 5, 6, 7, 9];
        const notesColumn = 8;
        const dateColumn = 0;
    
        const formattedData = salesToExport.map(sale => {
            const expenseText = sale.expenses > 0 ? `[Exp: ₦${sale.expenses}] ` : '';
            const combinedNotes = `${expenseText}${sale.notes ?? ''}`.trim();
            
            return [
                new Date(sale.date + 'T00:00:00'),
                sale.shopName,
                sale.stockType,
                sale.bagsSold,
                sale.pricePerBag,
                sale.expectedRevenue,
                sale.totalTransfer,
                sale.expenses,
                combinedNotes,
                sale.discrepancy,
            ];
        }).reverse();
    
        const worksheet = XLSX.utils.aoa_to_sheet([header, ...formattedData]);
    
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F46E5" } }, // Indigo-600
            alignment: { horizontal: "center", vertical: "center" }
        };
        const oddRowStyle = { fill: { fgColor: { rgb: "FFFFFF" } } }; // White
        const evenRowStyle = { fill: { fgColor: { rgb: "F1F5F9" } } }; // slate-100
    
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                let cell = worksheet[cell_ref];
                if (!cell) continue;
    
                if (R === 0) {
                    cell.s = headerStyle;
                } else {
                    cell.s = (R % 2 === 0) ? evenRowStyle : oddRowStyle;
                    
                    if (C === dateColumn) {
                        cell.t = 'd';
                        cell.z = 'dd-mmm-yyyy';
                    } else if (currencyColumns.includes(C)) {
                        cell.t = 'n';
                        cell.z = '₦#,##0.00;[Red]-₦#,##0.00';
                    } else if (C === notesColumn && cell.v) {
                         cell.s.alignment = { wrapText: true, vertical: 'top' };
                    }
                }
            }
        }
    
        const columnWidths = header.map((h, i) => {
            const headerLength = h.length;
            const lengths = formattedData.map(row => {
                const value = row[i];
                if (i === notesColumn && typeof value === 'string') {
                    const longestLine = Math.max(...value.split('\n').map(l => l.length));
                    return Math.min(60, longestLine);
                }
                if (i === dateColumn) return 12;
                if (currencyColumns.includes(i)) return 18;
                return String(value ?? '').length;
            });
            const maxLength = Math.max(0, ...lengths);
            return { wch: Math.max(headerLength, maxLength) + 2 };
        });
        worksheet["!cols"] = columnWidths;
        
        worksheet['!autofilter'] = { ref: worksheet['!ref'] };
        worksheet['!view'] = { freeze: { ySplit: 1 } };
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
        const today = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `Sales_Report_${today}.xlsx`);
    };

    const handleOpenDeleteModal = (sale: SaleRecord) => {
        setSaleToDelete(sale);
    };

    const handleCloseDeleteModal = () => {
        setSaleToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (saleToDelete) {
            onDeleteSale(saleToDelete);
            setSaleToDelete(null);
        }
    };

    const formatDateForModal = (dateString: string | undefined) => {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    const handleRangeExport = () => {
        const rangeSales = sales.filter(sale => {
            const startMatch = exportRange.startDate ? sale.date >= exportRange.startDate : true;
            const endMatch = exportRange.endDate ? sale.date <= exportRange.endDate : true;
            return startMatch && endMatch;
        });
        handleExportToExcel(rangeSales);
        setIsExportModalOpen(false);
    };

    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Dashboard Overview</h2>
                <p className="text-slate-500 font-medium">Real-time performance metrics and inventory tracking.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={onOpenInventory} 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-slate-200 hover:bg-white/10 transition-all active:scale-95"
                >
                  <Archive className="h-5 w-5 text-indigo-400" />
                  <span>Inventory</span>
                </button>
                <button 
                  onClick={() => setIsExportModalOpen(true)} 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  <Download className="h-5 w-5" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard 
                  title="Total Bags Sold" 
                  value={summaryData.totalBagsSold} 
                  icon={<ShoppingBag className="h-6 w-6" />}
                />
                <SummaryCard 
                  title="Expected Revenue" 
                  value={summaryData.totalRevenue} 
                  isCurrency 
                  icon={<TrendingUp className="h-6 w-6" />}
                  colorClass="text-white"
                />
                <SummaryCard 
                  title="Total Transferred" 
                  value={summaryData.totalTransferred} 
                  isCurrency 
                  icon={<DollarSign className="h-6 w-6" />}
                  colorClass="text-indigo-400"
                />
            </div>
            
            <div className="bg-slate-900/30 rounded-[2.5rem] border border-white/5 overflow-hidden backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl">
                        <BarChart3 className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Sales Records</h2>
                        <p className="text-sm text-slate-500 font-medium">{filteredSales.length} transactions found</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                          type="text"
                          name="shopName"
                          value={filters.shopName}
                          onChange={handleFilterChange}
                          placeholder="Search shop..."
                          className="pl-12 pr-6 py-3 bg-slate-950 border border-white/5 rounded-2xl text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all w-full sm:w-56"
                        />
                      </div>
                      
                      <button 
                          onClick={() => setIsFilterVisible(!isFilterVisible)}
                          className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all text-sm font-bold ${isFilterVisible ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-white/5 text-slate-300 hover:bg-white/5'}`}
                      >
                          <Filter className="h-5 w-5" />
                          <span>Filters</span>
                      </button>
                    </div>
                </div>
                
                <div className="border-t border-white/5">
                    <AnimatePresence>
                      {isFilterVisible && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-slate-950/50 border-b border-white/5"
                        >
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                                    <DatePicker label="Start Date" value={filters.startDate} onChange={(date) => handleDateChange('startDate', date)} />
                                    <DatePicker label="End Date" value={filters.endDate} onChange={(date) => handleDateChange('endDate', date)} />
                                    <div className="flex gap-3">
                                        <button 
                                          onClick={handleClearFilters} 
                                          className="flex-1 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-bold transition-all border border-white/5"
                                        >
                                            Reset
                                        </button>
                                        <button 
                                          onClick={() => setIsFilterVisible(false)} 
                                          className="flex-1 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                                        >
                                            Apply Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                       <SalesTable sales={filteredSales} onEdit={onEditSale} onDelete={handleOpenDeleteModal} />
                    </div>
                </div>
            </div>
          
            <div className="bg-slate-900/30 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-md">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-amber-500/10 rounded-2xl">
                    <Store className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Shop Performance</h2>
                    <p className="text-sm text-slate-500 font-medium">Comparative analysis across all locations</p>
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    <ShopPerformance sales={filteredSales} shopOptions={shopOptions} />
                </div>
            </div>

            <ConfirmationModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onConfirm={handleRangeExport}
                title="Export Sales Report"
                message={
                  <div className="space-y-6">
                    <p className="text-slate-300">Select a date range for the Excel export. Leave blank to export all records.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DatePicker 
                            label="Start Date" 
                            value={exportRange.startDate} 
                            onChange={(date) => setExportRange(prev => ({ ...prev, startDate: date }))} 
                        />
                        <DatePicker 
                            label="End Date" 
                            value={exportRange.endDate} 
                            onChange={(date) => setExportRange(prev => ({ ...prev, endDate: date }))} 
                        />
                    </div>
                    <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            <span className="font-bold text-indigo-400">Note:</span> The exported file will include detailed expense notes combined with transaction remarks for better clarity.
                        </p>
                    </div>
                  </div>
                }
                confirmText="Generate Excel"
                type="info"
            />

            <ConfirmationModal
                isOpen={!!saleToDelete}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Delete Sale Record"
                message={
                  <div className="space-y-4">
                    <p className="text-slate-300">Are you sure you want to delete this sale record? This action will revert the inventory levels and cannot be undone.</p>
                    {saleToDelete && (
                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shop</span>
                          <span className="text-sm font-bold text-white">{saleToDelete.shopName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(saleToDelete.expectedRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</span>
                          <span className="text-sm font-bold text-slate-300">{formatDateForModal(saleToDelete.date)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                }
                confirmText="Delete Record"
                type="danger"
            />
        </div>
    );
};
