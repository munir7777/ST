
import React, { useState, FormEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDown, 
    Trash2, 
    Plus, 
    History, 
    Package, 
    Filter,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Truck,
    Store,
    AlertCircle
} from 'lucide-react';
import type { InventoryData, StockType, DeliveryRecord } from '../types';
import { DatePicker } from './DatePicker';
import { ConfirmationModal } from './ConfirmationModal';
import { useToast } from '../ToastContext';

interface InventoryManagerProps {
    inventory: InventoryData;
    shopOptions: string[];
    onAddDelivery: (shopName: string, quantity: number, date: string, stockType: StockType) => void;
    onDeleteDelivery: (shopName: string, deliveryId: string) => void;
    stockTypes: StockType[];
}

const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const initialDeliveryState = {
    shopName: '',
    quantity: '',
    date: getLocalDate(),
    stockType: 'DANGOTE' as StockType,
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

type SortKey = 'date' | 'stockType' | 'quantity' | 'remainingQuantity';
type SortDirection = 'ascending' | 'descending';

const SortButton: React.FC<{
    sortKey: SortKey,
    sortConfig: { key: SortKey; direction: SortDirection };
    requestSort: (key: SortKey) => void;
    children: React.ReactNode;
    className?: string;
}> = ({ sortKey, sortConfig, requestSort, children, className }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
        <button 
            type="button"
            onClick={() => requestSort(sortKey)} 
            className={`flex items-center gap-1.5 hover:text-indigo-400 transition-colors ${className}`}
        >
            <span>{children}</span>
            {isSorted ? (
                sortConfig.direction === 'ascending' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
            ) : (
                <ArrowUpDown className="h-3 w-3 opacity-30" />
            )}
        </button>
    );
};

const DeliveryHistoryTable: React.FC<{
    deliveries: DeliveryRecord[],
    stockTypes: StockType[],
    shopName: string,
    onDelete: (delivery: DeliveryRecord) => void,
}> = ({ deliveries, stockTypes, shopName, onDelete }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'descending' });
    const [filterType, setFilterType] = useState<StockType | 'All'>('All');

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const processedDeliveries = useMemo(() => {
        let items = [...deliveries];
        if (filterType !== 'All') {
            items = items.filter(d => d.stockType === filterType);
        }
        items.sort((a, b) => {
            if (sortConfig.key === 'date') {
                const valA = new Date(a.date).getTime();
                const valB = new Date(b.date).getTime();
                return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
            }
            if (sortConfig.key === 'quantity') {
                return sortConfig.direction === 'ascending' ? a.quantity - b.quantity : b.quantity - a.quantity;
            }
            // stockType
            return sortConfig.direction === 'ascending' 
                ? a.stockType.localeCompare(b.stockType) 
                : b.stockType.localeCompare(a.stockType);
        });
        return items;
    }, [deliveries, filterType, sortConfig]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Filter className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Filter By Type</span>
                    </div>
                    <select 
                        id={`filter-stockType-${shopName}`} 
                        value={filterType} 
                        onChange={e => setFilterType(e.target.value as StockType | 'All')} 
                        className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs font-bold transition-all"
                    >
                        <option value="All">All Types</option>
                        {stockTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2 text-indigo-400">
                    <History className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Delivery History</span>
                </div>
            </div>
            
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/30">
                <table className="min-w-full border-separate border-spacing-0">
                    <thead className="bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <SortButton sortKey="date" sortConfig={sortConfig} requestSort={requestSort}>Date</SortButton>
                            </th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <SortButton sortKey="stockType" sortConfig={sortConfig} requestSort={requestSort}>Type</SortButton>
                            </th>
                            <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <SortButton sortKey="quantity" sortConfig={sortConfig} requestSort={requestSort} className="justify-end">Quantity</SortButton>
                            </th>
                            <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <SortButton sortKey="remainingQuantity" sortConfig={sortConfig} requestSort={requestSort} className="justify-end">Remaining</SortButton>
                            </th>
                            <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {processedDeliveries.length > 0 ? (
                            processedDeliveries.map((delivery) => (
                                <motion.tr 
                                    layout
                                    key={delivery.id}
                                    className="hover:bg-white/5 transition-colors group"
                                >
                                    <td className="px-6 py-4 text-sm font-medium text-slate-300">{formatDate(delivery.date)}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                            delivery.stockType === 'DANGOTE' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                                        }`}>
                                            {delivery.stockType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white text-right font-mono font-bold">{delivery.quantity} bags</td>
                                    <td className="px-6 py-4 text-sm text-right font-mono font-bold">
                                        <span className={delivery.remainingQuantity === 0 ? 'text-slate-600' : 'text-indigo-400'}>
                                            {delivery.remainingQuantity} bags
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center">
                                        <button 
                                            onClick={() => onDelete(delivery)} 
                                            className="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-400/10 transition-all" 
                                            title="Delete delivery"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2 text-slate-600">
                                        <AlertCircle className="h-8 w-8 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No matching records</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, shopOptions, onAddDelivery, onDeleteDelivery, stockTypes }) => {
    const [deliveryData, setDeliveryData] = useState(initialDeliveryState);
    const [expandedShop, setExpandedShop] = useState<string | null>(null);
    const [deliveryToDelete, setDeliveryToDelete] = useState<{shopName: string, delivery: DeliveryRecord} | null>(null);
    const { showToast } = useToast();
    
    const handleToggleExpand = (shopName: string) => {
        setExpandedShop(prev => (prev === shopName ? null : shopName));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDeliveryData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const quantity = parseInt(deliveryData.quantity, 10);
        if (!deliveryData.shopName || !quantity || quantity <= 0) {
            showToast('Please select a shop and enter a valid quantity.', 'error');
            return;
        }
        onAddDelivery(deliveryData.shopName, quantity, deliveryData.date, deliveryData.stockType);
        setDeliveryData(initialDeliveryState);
        showToast('Delivery added successfully!', 'success');
    };

    const handleOpenDeleteModal = (shopName: string, delivery: DeliveryRecord) => {
        setDeliveryToDelete({ shopName, delivery });
    };

    const handleCloseDeleteModal = () => {
        setDeliveryToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (deliveryToDelete) {
            onDeleteDelivery(deliveryToDelete.shopName, deliveryToDelete.delivery.id);
            setDeliveryToDelete(null);
            showToast('Delivery record deleted.', 'success');
        }
    };

    return (
        <div className="space-y-10">
            {/* Add Delivery Form */}
            <section className="bg-slate-950/50 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Truck className="h-24 w-24" />
                </div>
                
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                        <Plus className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">New Delivery</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Restock Inventory</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                        <DatePicker
                            label="Delivery Date"
                            value={deliveryData.date}
                            onChange={(date) => setDeliveryData(prev => ({ ...prev, date }))}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="delivery-shopName" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Destination Shop</label>
                        <div className="relative">
                            <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <select
                                id="delivery-shopName"
                                name="shopName"
                                value={deliveryData.shopName}
                                onChange={handleChange}
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none font-bold text-sm"
                            >
                                <option value="" disabled>Select shop</option>
                                {shopOptions.map(shop => <option key={shop} value={shop}>{shop}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="delivery-stockType" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Product Type</label>
                        <div className="relative">
                            <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <select
                                id="delivery-stockType"
                                name="stockType"
                                value={deliveryData.stockType}
                                onChange={handleChange}
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none font-bold text-sm"
                            >
                                {stockTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                        <label htmlFor="delivery-quantity" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Quantity (Bags)</label>
                        <div className="relative">
                            <input
                                type="number"
                                id="delivery-quantity"
                                name="quantity"
                                value={deliveryData.quantity}
                                onChange={handleChange}
                                required
                                min="1"
                                placeholder="0"
                                className="w-full pl-6 pr-16 py-4 bg-slate-900 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono font-black text-lg"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-black uppercase tracking-widest">Bags</div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        className="sm:col-span-2 mt-4 w-full flex items-center justify-center gap-3 py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all"
                    >
                        <Plus className="h-5 w-5" />
                        Confirm Delivery
                    </motion.button>
                </form>
            </section>

            {/* Inventory Table */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                        <Package className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Stock Inventory</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time levels</p>
                    </div>
                </div>

                <div className="bg-slate-950/50 rounded-[2rem] border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="min-w-full border-separate border-spacing-0">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shop Location</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dangote</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ashaka</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {shopOptions.map(shopName => {
                                    const shopData = inventory[shopName];
                                    const isExpanded = expandedShop === shopName;

                                    return (
                                        <React.Fragment key={shopName}>
                                            <tr 
                                                onClick={() => handleToggleExpand(shopName)} 
                                                className={`group cursor-pointer transition-all duration-300 ${isExpanded ? 'bg-indigo-600/10' : 'hover:bg-white/5'}`}
                                            >
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{shopName}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-black text-indigo-400 font-mono">
                                                            {shopData?.currentStock?.DANGOTE || 0}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                                            From {(shopData?.deliveries || []).filter(d => d.stockType === 'DANGOTE' && d.remainingQuantity > 0).length} Batches
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-black text-emerald-400 font-mono">
                                                            {shopData?.currentStock?.ASHAKA || 0}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                                            From {(shopData?.deliveries || []).filter(d => d.stockType === 'ASHAKA' && d.remainingQuantity > 0).length} Batches
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <motion.div 
                                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                                        className={`inline-flex p-2 rounded-xl transition-all ${isExpanded ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 group-hover:text-white'}`}
                                                    >
                                                        <ChevronDown className="h-5 w-5" />
                                                    </motion.div>
                                                </td>
                                            </tr>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={4} className="p-0 bg-slate-900/30">
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="p-8">
                                                                    {(shopData?.deliveries?.length || 0) > 0 ? (
                                                                        <DeliveryHistoryTable 
                                                                            deliveries={shopData.deliveries} 
                                                                            stockTypes={stockTypes} 
                                                                            shopName={shopName}
                                                                            onDelete={(delivery) => handleOpenDeleteModal(shopName, delivery)}
                                                                        />
                                                                    ) : (
                                                                        <div className="flex flex-col items-center justify-center py-12 text-slate-600 bg-slate-950/50 rounded-3xl border border-dashed border-white/5">
                                                                            <History className="h-10 w-10 mb-3 opacity-10" />
                                                                            <p className="text-[10px] font-bold uppercase tracking-widest">No delivery history</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <ConfirmationModal
                isOpen={!!deliveryToDelete}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Delete Delivery Record"
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                        <AlertCircle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-rose-200 leading-relaxed">
                            Are you sure you want to delete this delivery record? This will automatically decrease the current stock level for this shop.
                        </p>
                    </div>
                    
                    <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shop Location</span>
                            <span className="text-sm font-bold text-white">{deliveryToDelete?.shopName}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Delivery Date</span>
                            <span className="text-sm font-bold text-white">{formatDate(deliveryToDelete?.delivery.date ?? '')}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product Type</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                deliveryToDelete?.delivery.stockType === 'DANGOTE' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                                {deliveryToDelete?.delivery.stockType}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quantity</span>
                            <span className="text-sm font-black text-white font-mono">{deliveryToDelete?.delivery.quantity} bags</span>
                        </div>
                    </div>
                    
                    <p className="text-[10px] text-center font-bold text-slate-600 uppercase tracking-widest">
                        This action cannot be undone
                    </p>
                </div>
            </ConfirmationModal>
        </div>
    );
};
