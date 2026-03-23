
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu, ShoppingCart, Package, ChevronRight } from 'lucide-react';
import { SalesForm } from './SalesForm';
import { InventoryManager } from './InventoryManager';
import { Accordion } from './Accordion';
import type { SaleRecord, InventoryData, StockType } from '../types';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    editingSale: SaleRecord | null;
    onCancelEdit: () => void;
    onAddSale: (data: SaleRecord) => void;
    onUpdateSale: (data: SaleRecord) => void;
    inventory: InventoryData;
    shopOptions: string[];
    onAddDelivery: (shopName: string, quantity: number, date: string, stockType: StockType) => void;
    onDeleteDelivery: (shopName: string, deliveryId: string) => void;
    stockTypes: StockType[];
    activeAccordion: 'sales' | 'inventory' | null;
    onToggleAccordion: (accordion: 'sales' | 'inventory') => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
    isOpen,
    onClose,
    editingSale,
    onCancelEdit,
    onAddSale,
    onUpdateSale,
    inventory,
    shopOptions,
    onAddDelivery,
    onDeleteDelivery,
    stockTypes,
    activeAccordion,
    onToggleAccordion,
}) => {
    // Close menu on escape key press
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    
    const isSalesFormOpen = activeAccordion === 'sales';
    const isInventoryOpen = activeAccordion === 'inventory';

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeAccordion && scrollContainerRef.current) {
            const accordionElement = scrollContainerRef.current.querySelector(`[data-accordion-id="${activeAccordion}"]`);
            if (accordionElement) {
                accordionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [activeAccordion]);

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>
            
            {/* Side Menu Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 h-full w-full max-w-md bg-slate-900 border-r border-white/10 shadow-2xl z-50 flex flex-col"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-xl">
                                    <Menu className="h-5 w-5 text-indigo-400" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-100 tracking-tight">Management Menu</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all"
                                aria-label="Close menu"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div 
                            ref={scrollContainerRef}
                            className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar"
                        >
                            <div data-accordion-id="sales">
                                <Accordion
                                    title={editingSale ? 'Edit Sale Record' : 'Add New Sale'}
                                    isOpen={isSalesFormOpen}
                                    onToggle={() => onToggleAccordion('sales')}
                                    icon={<ShoppingCart className="h-5 w-5" />}
                                >
                                    <SalesForm
                                        onSubmit={editingSale ? onUpdateSale : onAddSale}
                                        onCancelEdit={onCancelEdit}
                                        editingSale={editingSale}
                                        inventory={inventory}
                                        shopOptions={shopOptions}
                                        stockTypes={stockTypes}
                                    />
                                </Accordion>
                            </div>
                            
                            <div data-accordion-id="inventory">
                                <Accordion
                                    title="Inventory Management"
                                    isOpen={isInventoryOpen}
                                    onToggle={() => onToggleAccordion('inventory')}
                                    icon={<Package className="h-5 w-5" />}
                                >
                                    <InventoryManager
                                        inventory={inventory}
                                        shopOptions={shopOptions}
                                        onAddDelivery={onAddDelivery}
                                        onDeleteDelivery={onDeleteDelivery}
                                        stockTypes={stockTypes}
                                    />
                                </Accordion>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-slate-900/50">
                            <p className="text-xs text-center text-slate-500 font-medium">
                                Sales Tracker v2.0 • Professional Edition
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
