
import React from 'react';
import { SalesForm } from '../components/SalesForm';
import { BackIcon } from '../components/Icons';
import type { SaleRecord, InventoryData, StockType } from '../types';

interface AddSalePageProps {
    onSubmit: (data: SaleRecord) => void;
    onCancel: () => void;
    editingSale: SaleRecord | null;
    inventory: InventoryData;
    shopOptions: string[];
    stockTypes: StockType[];
}

export const AddSalePage: React.FC<AddSalePageProps> = ({
    onSubmit,
    onCancel,
    editingSale,
    inventory,
    shopOptions,
    stockTypes,
}) => {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <button 
                    onClick={onCancel} 
                    className="flex items-center gap-2 px-3 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-colors"
                >
                    <BackIcon className="h-5 w-5" />
                    <span>Back to Dashboard</span>
                </button>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
                <h2 className="text-xl font-semibold mb-4 text-slate-100">
                    {editingSale ? 'Edit Sale Record' : 'Add New Sale Record'}
                </h2>
                <SalesForm
                    onSubmit={onSubmit}
                    onCancelEdit={onCancel}
                    editingSale={editingSale}
                    inventory={inventory}
                    shopOptions={shopOptions}
                    stockTypes={stockTypes}
                />
            </div>
        </div>
    );
};