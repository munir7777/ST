
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
        <div className="overflow-x-auto no-scrollbar">
            <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                    <tr className="text-slate-500">
                        <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">Shop Location</th>
                        <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">Bags Sold</th>
                        <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">Revenue</th>
                        <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">Transferred</th>
                        <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">Expenses</th>
                        <th className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">Discrepancy</th>
                    </tr>
                </thead>
                <tbody>
                    {performanceData.map(shop => (
                        <motion.tr 
                            layout
                            key={shop.shopName} 
                            className="bg-slate-950/50 hover:bg-white/5 transition-all duration-300 group"
                        >
                            <td className="px-6 py-5 rounded-l-2xl border-y border-l border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                        <Store className="h-4 w-4 text-indigo-400" />
                                    </div>
                                    <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{shop.shopName}</span>
                                </div>
                            </td>
                            <td className="px-6 py-5 border-y border-white/5 text-right">
                                <span className="text-sm font-bold text-slate-300">{shop.totalBagsSold} bags</span>
                            </td>
                            <td className="px-6 py-5 border-y border-white/5 text-right">
                                <div className="text-sm text-white">
                                    <CurrencyDisplay value={shop.totalRevenue} />
                                </div>
                            </td>
                            <td className="px-6 py-5 border-y border-white/5 text-right">
                                <div className="text-sm text-emerald-400">
                                    <CurrencyDisplay value={shop.totalTransferred} />
                                </div>
                            </td>
                            <td className="px-6 py-5 border-y border-white/5 text-right">
                                <div className="text-sm text-rose-400">
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
    );
};
