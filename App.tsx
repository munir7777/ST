
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Plus, Package, Menu as MenuIcon, TrendingUp, ShoppingBag, Store, DollarSign } from 'lucide-react';
import { SaleRecord, InventoryData, StockType, DeliveryRecord } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DashboardPage } from './pages/DashboardPage';
import { SideMenu } from './components/SideMenu';
import { ToastProvider, useToast } from './ToastContext';

const shopOptions = Array.from({ length: 10 }, (_, i) => `Shop ${i + 1}`);
const stockTypes: StockType[] = ['DANGOTE', 'ASHAKA'];

const initialInventory: InventoryData = shopOptions.reduce((acc, shopName) => {
  acc[shopName] = { currentStock: { DANGOTE: 0, ASHAKA: 0 }, deliveries: [] };
  return acc;
}, {} as InventoryData);

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const AppContent: React.FC = () => {
  const [sales, setSales] = useLocalStorage<SaleRecord[]>('salesData', []);
  const [inventory, setInventory] = useLocalStorage<InventoryData>('inventoryData', initialInventory);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [activeMenu, setActiveMenu] = useState<'sales' | 'inventory' | null>(null);
  const { showToast } = useToast();

  // Ensure all shopOptions are initialized in inventory data
  React.useEffect(() => {
    const missingShops = shopOptions.filter(shop => !inventory[shop]);
    if (missingShops.length > 0) {
      setInventory(prev => {
        const updated = { ...prev };
        missingShops.forEach(shop => {
          if (!updated[shop]) {
            updated[shop] = { currentStock: { DANGOTE: 0, ASHAKA: 0 }, deliveries: [] };
          }
        });
        return updated;
      });
    }
  }, [inventory, setInventory]);

  const handleAddSale = (data: SaleRecord) => {
    const stock = inventory[data.shopName]?.currentStock[data.stockType] || 0;
    if (data.bagsSold > stock) {
      showToast(`Error: Not enough ${data.stockType} stock. Only ${stock} bags available at ${data.shopName}.`, 'error');
      return;
    }

    const expectedRevenue = data.bagsSold * data.pricePerBag;
    const discrepancy = expectedRevenue - (data.totalTransfer + data.expenses);

    const newSale: SaleRecord = {
      id: generateId(),
      date: data.date,
      shopName: data.shopName,
      stockType: data.stockType,
      bagsSold: data.bagsSold,
      pricePerBag: data.pricePerBag,
      totalTransfer: data.totalTransfer,
      expenses: data.expenses,
      notes: data.notes,
      expectedRevenue,
      discrepancy,
    };
    
    setSales(prevSales => [newSale, ...prevSales]);
    setInventory(prevInv => ({
      ...prevInv,
      [data.shopName]: {
        ...prevInv[data.shopName],
        currentStock: {
          ...prevInv[data.shopName].currentStock,
          [data.stockType]: prevInv[data.shopName].currentStock[data.stockType] - data.bagsSold,
        }
      }
    }));
    setActiveMenu(null);
    showToast('Sale record added successfully.', 'success');
  };

  const handleUpdateSale = (saleData: SaleRecord) => {
    const originalSale = sales.find(s => s.id === saleData.id);
    if (!originalSale) return;

    // Calculate effective stock if we revert the original sale
    const currentStock = inventory[saleData.shopName]?.currentStock[saleData.stockType] || 0;
    const effectiveStock = (saleData.shopName === originalSale.shopName && saleData.stockType === originalSale.stockType)
      ? currentStock + originalSale.bagsSold
      : currentStock;

    if (saleData.bagsSold > effectiveStock) {
        showToast(`Error: Not enough ${saleData.stockType} stock to make this change. Only ${effectiveStock} bags available.`, 'error');
        return;
    }

    const expectedRevenue = saleData.bagsSold * saleData.pricePerBag;
    const discrepancy = expectedRevenue - (saleData.totalTransfer + saleData.expenses);
    const finalSale: SaleRecord = { ...saleData, expectedRevenue, discrepancy };

    setSales(prevSales => prevSales.map(s => s.id === finalSale.id ? finalSale : s));
    
    setInventory(prevInv => {
        const newInv = { ...prevInv };
        
        // Revert original sale stock
        const shopOrig = { ...newInv[originalSale.shopName] };
        shopOrig.currentStock = { ...shopOrig.currentStock };
        shopOrig.currentStock[originalSale.stockType] += originalSale.bagsSold;
        newInv[originalSale.shopName] = shopOrig;

        // Apply new sale stock
        const shopNew = { ...newInv[finalSale.shopName] };
        shopNew.currentStock = { ...shopNew.currentStock };
        shopNew.currentStock[finalSale.stockType] -= finalSale.bagsSold;
        newInv[finalSale.shopName] = shopNew;

        return newInv;
    });

    setEditingSale(null);
    setActiveMenu(null);
    showToast('Sale record updated successfully.', 'success');
  };

  const handleDeleteSale = (saleToDelete: SaleRecord) => {
    setInventory(prevInv => {
      const shopInventory = prevInv[saleToDelete.shopName];
      if (!shopInventory) return prevInv;
      
      return {
        ...prevInv,
        [saleToDelete.shopName]: {
          ...shopInventory,
          currentStock: {
            ...shopInventory.currentStock,
            [saleToDelete.stockType]: shopInventory.currentStock[saleToDelete.stockType] + saleToDelete.bagsSold,
          }
        }
      };
    });
    setSales(prevSales => prevSales.filter(sale => sale.id !== saleToDelete.id));
    showToast('Sale record deleted.', 'info');
  };
  
  const handleAddDelivery = (shopName: string, quantity: number, date: string, stockType: StockType) => {
    setInventory(prevInv => {
      const shopData = prevInv[shopName];
      const newDelivery: DeliveryRecord = {
        id: generateId(),
        date,
        quantity,
        stockType,
      };
      return {
        ...prevInv,
        [shopName]: {
          ...shopData,
          currentStock: {
            ...shopData.currentStock,
            [stockType]: shopData.currentStock[stockType] + quantity,
          },
          deliveries: [...shopData.deliveries, newDelivery]
        }
      }
    });
    showToast(`Delivery of ${quantity} bags added to ${shopName}.`, 'success');
  };

  const handleDeleteDelivery = (shopName: string, deliveryId: string) => {
    setInventory(prevInv => {
      const shopInventory = prevInv[shopName];
      if (!shopInventory) return prevInv;

      const deliveryToDelete = shopInventory.deliveries.find(d => d.id === deliveryId);
      if (!deliveryToDelete) return prevInv;

      if (shopInventory.currentStock[deliveryToDelete.stockType] < deliveryToDelete.quantity) {
        showToast(`Cannot delete this delivery. It would result in negative stock.`, 'error');
        return prevInv;
      }

      const updatedDeliveries = shopInventory.deliveries.filter(d => d.id !== deliveryId);
      const updatedStock = shopInventory.currentStock[deliveryToDelete.stockType] - deliveryToDelete.quantity;

      return {
        ...prevInv,
        [shopName]: {
          ...shopInventory,
          currentStock: {
            ...shopInventory.currentStock,
            [deliveryToDelete.stockType]: updatedStock,
          },
          deliveries: updatedDeliveries,
        }
      };
    });
    showToast('Delivery record removed.', 'info');
  };

  const handleEditSale = (sale: SaleRecord) => { 
    setEditingSale(sale);
    setActiveMenu('sales');
  };
  const handleCancelEdit = () => { 
    setEditingSale(null);
    setActiveMenu(null);
  };

  const handleOpenAddSale = () => {
    setEditingSale(null);
    setActiveMenu('sales');
  };

  const handleOpenInventory = () => {
    setEditingSale(null);
    setActiveMenu('inventory');
  };
  
  const handleToggleAccordion = (accordion: 'sales' | 'inventory') => {
    setActiveMenu(prev => (prev === accordion ? null : accordion));
  };

  const summaryData = useMemo(() => {
    const totalBagsSold = sales.reduce((sum, s) => sum + s.bagsSold, 0);
    const totalRevenue = sales.reduce((sum, s) => sum + s.expectedRevenue, 0);
    const totalTransferred = sales.reduce((sum, s) => sum + s.totalTransfer, 0);
    const totalDiscrepancy = sales.reduce((sum, s) => sum + s.discrepancy, 0);
    return { totalBagsSold, totalRevenue, totalTransferred, totalDiscrepancy };
  }, [sales]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-300 selection:bg-indigo-500/30">
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">SalesTracker</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enterprise Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleOpenAddSale}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Plus className="h-5 w-5" />
                <span>New Sale</span>
              </button>
              <button 
                onClick={() => setActiveMenu('sales')}
                className="p-2.5 rounded-2xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all border border-white/5"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <SideMenu
        isOpen={activeMenu !== null}
        onClose={() => setActiveMenu(null)}
        editingSale={editingSale}
        onCancelEdit={handleCancelEdit}
        onAddSale={handleAddSale}
        onUpdateSale={handleUpdateSale}
        inventory={inventory}
        shopOptions={shopOptions}
        stockTypes={stockTypes}
        onAddDelivery={handleAddDelivery}
        onDeleteDelivery={handleDeleteDelivery}
        activeAccordion={activeMenu}
        onToggleAccordion={handleToggleAccordion}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <DashboardPage
            sales={sales}
            summaryData={summaryData}
            shopOptions={shopOptions}
            onEditSale={handleEditSale}
            onDeleteSale={handleDeleteSale}
            onOpenAddSale={handleOpenAddSale}
            onOpenInventory={handleOpenInventory}
          />
        </motion.div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
