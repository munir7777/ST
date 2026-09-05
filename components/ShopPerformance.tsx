
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, 
    TrendingDown, 
    Minus, 
    Store, 
    Package, 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownRight,
    AlertCircle
} from 'lucide-react';
import type { SaleRecord } from '../types';

interface ShopPerformanceProps {
  sales: SaleRecord[];
  shopOptions: string[];
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

export const ShopPerformance: React.FC<ShopPerformanceProps> = ({ sales, shopOptions }) => {
    
    const performanceData = useMemo(() => {
        if (!shopOptions) return [];
        return shopOptions.map(shopName => {
            const shopSales = sales.filter(sale => sale.shopName === shopName);
            
            if (shopSales.length === 0) {
                return null;
            }

            const totalBagsSold = shopSales.reduce((sum, sale) => sum + sale.bagsSold, 0);
            const totalRevenue = shopSales.reduce((sum, sale) => sum + sale.expectedRevenue, 0);
            const totalTransferred = shopSales.reduce((sum, sale) => sum + sale.totalTransfer, 0);
            const totalExpenses = shopSales.reduce((sum, sale) => sum + sale.expenses, 0);
            const netDiscrepancy = shopSales.reduce((sum, sale) => sum + sale.discrepancy, 0);

            return {
                shopName,
                totalBagsSold,
                totalRevenue,
                totalTransferred,
                totalExpenses,
                netDiscrepancy,
            };
        }).filter((data): data is NonNullable<typeof data> => data !== null);
    }, [sales, shopOptions]);

    if (performanceData.length === 0) {
        return (
            <div className="text-center py-20 px-6 bg-slate-950/50 rounded-[2rem] border border-white/5 border-dashed">
                <div className="inline-flex p-4 bg-slate-900 rounded-2xl mb-4">
                    <AlertCircle className="h-8 w-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Performance Data</h3>
                <p className="text-slate-500 font-medium max-w-xs mx-auto">Add sales records to see how each shop location is performing.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="sm:hidden flex items-center justify-between text-[11px] text-slate-400 font-medium px-2 py-1 mb-2">
                <span>↔ Swipe table horizontally to see all metrics</span>
            </div>
            <div className="overflow-x-auto custom-scrollbar pb-2">
                <table className="min-w-[800px] w-full whitespace-nowrap border-separate border-spacing-y-3">
                <thead>
                    <tr className="text-slate-500">
                        <th className="sticky top-0 z-10 px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Shop Location</th>
                        <th className="sticky top-0 z-10 px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Bags Sold</th>
                        <th className="sticky top-0 z-10 px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Revenue</th>
                        <th className="sticky top-0 z-10 px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Transferred</th>
                        <th className="sticky top-0 z-10 px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Expenses</th>
                        <th className="sticky top-0 z-10 px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Discrepancy</th>
                    </tr>
                </thead>
                <tbody>
                    {performanceData.map(shop => (
                        <motion.tr 
                            layout
                            key={shop.shopName} 
                            className="bg-slate-900/40 hover:bg-slate-900/80 transition-all duration-300 group"
                        >
                            <td className="px-6 py-5 rounded-l-2xl border-y border-l border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors border border-indigo-500/10">
                                        <Store className="h-4.5 w-4.5 text-indigo-400 animate-pulse-slow" />
                                    </div>
                                    <span className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">{shop.shopName}</span>
                                </div>
                            </td>
                            <td className="px-6 py-5 border-y border-white/5 text-right">
                                <span className="text-sm font-black text-slate-300 font-mono">{shop.totalBagsSold} bags</span>
                            </td>
                            <td className="px-6 py-5 border-y border-white/5 text-right">
                                <div className="text-sm font-black text-white">
                                    <CurrencyDisplay value={shop.totalRevenue} />
                                </div>
                            </td>
                            <td className="px-6 py-5 border-y border-white/5 text-right">
                                <div className="text-sm font-black text-emerald-400">
                                    <CurrencyDisplay value={shop.totalTransferred} />
                                </div>
                            </td>
                            <td className="px-6 py-5 border-y border-white/5 text-right">
                                <div className="text-sm font-bold text-rose-400 font-mono">
                                    <CurrencyDisplay value={shop.totalExpenses} />
                                </div>
                            </td>
                            <td className="px-6 py-5 rounded-r-2xl border-y border-r border-white/5 text-right">
                                <DiscrepancyDisplay value={shop.netDiscrepancy} />
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
    );
};
