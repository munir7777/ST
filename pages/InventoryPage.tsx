
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Archive, BarChart3 } from 'lucide-react';
import { InventoryManager } from '../components/InventoryManager';
import type { InventoryData, StockType } from '../types';

interface InventoryPageProps {
    inventory: InventoryData;
    shopOptions: string[];
    onAddDelivery: (shopName: string, quantity: number, date: string, stockType: StockType) => void;
    onDeleteDelivery: (shopName: string, deliveryId: string) => void;
    onNavigateBack: () => void;
    stockTypes: StockType[];
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
    inventory,
    shopOptions,
    onAddDelivery,
    onDeleteDelivery,
    onNavigateBack,
    stockTypes,
}) => {
    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <button 
                    onClick={onNavigateBack} 
                    className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95 group"
                    title="Back to Dashboard"
                >
                    <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2">Inventory Control</h2>
                  <p className="text-slate-500 font-medium">Manage stock levels and delivery history across all shops.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="px-5 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
                    <Archive className="h-5 w-5 text-indigo-400" />
                    <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Stock Management</span>
                </div>
              </div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/30 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-md"
            >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl">
                    <BarChart3 className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Inventory Manager</h2>
                    <p className="text-sm text-slate-500 font-medium">Update stock and view delivery logs</p>
                  </div>
                </div>
                
                <InventoryManager
                    inventory={inventory}
                    shopOptions={shopOptions}
                    onAddDelivery={onAddDelivery}
                    onDeleteDelivery={onDeleteDelivery}
                    stockTypes={stockTypes}
                />
            </motion.div>
        </div>
    );
};
