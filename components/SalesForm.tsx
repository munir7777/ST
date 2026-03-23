
import React, { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { 
    Calendar as CalendarIcon, 
    Store, 
    Package, 
    Hash, 
    DollarSign, 
    CreditCard, 
    Receipt, 
    FileText,
    Plus,
    Save,
    X
} from 'lucide-react';
import type { SaleRecord, InventoryData, StockType } from '../types';
import { DatePicker } from './DatePicker';
import { useToast } from '../ToastContext';

interface InputFieldProps {
  label: string;
  name: string;
  type: string;
  value: string | number;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  suffix?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, type, value, required = true, onChange, icon, placeholder, suffix }) => (
  <div className="space-y-1.5">
    <label htmlFor={name} className="block text-sm font-medium text-slate-400 ml-1">
      {label}
    </label>
    <div className="relative group">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
          {icon}
        </div>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? '0' : undefined}
        className={`block w-full ${icon ? 'pl-11' : 'px-4'} ${suffix ? 'pr-12' : 'pr-4'} py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium`}
        placeholder={placeholder || (type === 'number' ? '0' : '')}
      />
      {suffix && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold uppercase tracking-wider">
          {suffix}
        </div>
      )}
    </div>
  </div>
);

interface SalesFormProps {
  onSubmit: (data: SaleRecord) => void;
  editingSale: SaleRecord | null;
  onCancelEdit: () => void;
  inventory: InventoryData;
  shopOptions: string[];
  stockTypes: StockType[];
}

const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const initialFormState = {
  date: getLocalDate(),
  shopName: '',
  stockType: 'DANGOTE' as StockType,
  bagsSold: '',
  pricePerBag: '',
  totalTransfer: '',
  expenses: '',
  notes: '',
};

export const SalesForm: React.FC<SalesFormProps> = ({ onSubmit, editingSale, onCancelEdit, inventory, shopOptions, stockTypes }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [expectedRevenue, setExpectedRevenue] = useState(0);
  const [calculatedDiscrepancy, setCalculatedDiscrepancy] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    if (editingSale) {
      setFormData({
        date: editingSale.date,
        shopName: editingSale.shopName,
        stockType: editingSale.stockType,
        bagsSold: String(editingSale.bagsSold),
        pricePerBag: String(editingSale.pricePerBag),
        totalTransfer: String(editingSale.totalTransfer),
        expenses: String(editingSale.expenses || ''),
        notes: String(editingSale.notes || ''),
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingSale]);
  
  useEffect(() => {
    const bags = parseFloat(formData.bagsSold) || 0;
    const price = parseFloat(formData.pricePerBag) || 0;
    const revenue = bags * price;
    setExpectedRevenue(revenue);

    const transfer = parseFloat(formData.totalTransfer) || 0;
    const expenses = parseFloat(formData.expenses) || 0;
    const discrepancy = revenue - (transfer + expenses);
    setCalculatedDiscrepancy(discrepancy);
  }, [formData.bagsSold, formData.pricePerBag, formData.totalTransfer, formData.expenses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.shopName === '') {
      showToast('Please select a shop.', 'error');
      return;
    }

    const submissionData = {
      ...formData,
      id: editingSale?.id, // Pass id if editing
      bagsSold: parseFloat(formData.bagsSold) || 0,
      pricePerBag: parseFloat(formData.pricePerBag) || 0,
      totalTransfer: parseFloat(formData.totalTransfer) || 0,
      expenses: parseFloat(formData.expenses) || 0,
    } as unknown as SaleRecord; // Cast to SaleRecord, parent will recalculate fields
    
    onSubmit(submissionData);
    if (!editingSale) {
      setFormData(initialFormState);
      showToast('Sale record added successfully!', 'success');
    } else {
      showToast('Sale record updated successfully!', 'success');
    }
  };
  
  const currentStock = formData.shopName && formData.stockType
    ? (inventory[formData.shopName]?.currentStock[formData.stockType] || 0)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <DatePicker
          label="Sale Date"
          value={formData.date}
          onChange={(date) => setFormData(prev => ({ ...prev, date }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline ml-1">
              <label htmlFor="shopName" className="block text-sm font-medium text-slate-400">
                Shop Name
              </label>
              {formData.shopName && (
                 <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    Stock: {currentStock}
                 </span>
              )}
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <Store className="h-4 w-4" />
              </div>
              <select
                id="shopName"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                required
                className="block w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium appearance-none"
              >
                <option value="" disabled>Select a shop</option>
                {shopOptions.map(shop => <option key={shop} value={shop}>{shop}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <Plus className="h-4 w-4 rotate-45" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="stockType" className="block text-sm font-medium text-slate-400 ml-1">
                Stock Type
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <Package className="h-4 w-4" />
              </div>
              <select
                  id="stockType"
                  name="stockType"
                  value={formData.stockType}
                  onChange={handleChange}
                  required
                  className="block w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium appearance-none"
              >
                  {stockTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <Plus className="h-4 w-4 rotate-45" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="Bags Sold" 
            name="bagsSold" 
            type="number" 
            value={formData.bagsSold} 
            onChange={handleChange} 
            icon={<Hash className="h-4 w-4" />}
            suffix="Bags"
          />
          <InputField 
            label="Price per Bag" 
            name="pricePerBag" 
            type="number" 
            value={formData.pricePerBag} 
            onChange={handleChange} 
            icon={<DollarSign className="h-4 w-4" />}
            suffix="NGN"
          />
        </div>
        
        <motion.div 
            layout
            className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex justify-between items-center"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Receipt className="h-5 w-5 text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-slate-400">Expected Revenue</p>
            </div>
            <p className="text-xl font-bold text-indigo-400 font-mono">
                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(expectedRevenue)}
            </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="Total Transfer" 
            name="totalTransfer" 
            type="number" 
            value={formData.totalTransfer} 
            onChange={handleChange} 
            icon={<CreditCard className="h-4 w-4" />}
            suffix="NGN"
          />
          <InputField 
            label="Expenses" 
            name="expenses" 
            type="number" 
            value={formData.expenses} 
            onChange={handleChange} 
            required={false} 
            icon={<Receipt className="h-4 w-4" />}
            suffix="NGN"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-400 ml-1">
              Notes / Expense Details
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
              <FileText className="h-4 w-4" />
            </div>
            <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="block w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                placeholder="e.g., Transport costs, loading fees..."
            />
          </div>
        </div>

        <motion.div 
            layout
            className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3"
        >
            <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Deductions:</span>
                <span className="font-bold text-slate-300 font-mono">
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format((parseFloat(formData.totalTransfer) || 0) + (parseFloat(formData.expenses) || 0))}
                </span>
            </div>
            <div className="h-px bg-white/5 w-full" />
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-400">Calculated Discrepancy:</span>
                <span className={`text-lg font-bold font-mono ${calculatedDiscrepancy < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(calculatedDiscrepancy)}
                </span>
            </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-3 pt-2">
          <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98]"
          >
              {editingSale ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingSale ? 'Update Record' : 'Add Sale Record'}
          </button>
          {editingSale && (
              <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold border border-white/5 transition-all active:scale-[0.98]"
                  title="Cancel editing"
              >
                  <X className="h-5 w-5" />
              </button>
          )}
      </div>
    </form>
  );
};