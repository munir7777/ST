
import React, { useState, useMemo, useCallback, useEffect, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Plus, 
  Package, 
  Menu as MenuIcon, 
  TrendingUp, 
  ShoppingBag, 
  Store, 
  DollarSign, 
  LogOut, 
  LogIn, 
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { SaleRecord, InventoryData, StockType, DeliveryRecord } from './types';
import { DashboardPage } from './pages/DashboardPage';
import { SideMenu } from './components/SideMenu';
import { ToastProvider, useToast } from './ToastContext';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  FirebaseUser,
  handleFirestoreError,
  OperationType
} from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch,
  getDoc
} from 'firebase/firestore';

const shopOptions = Array.from({ length: 10 }, (_, i) => `Shop ${i + 1}`);
const stockTypes: StockType[] = ['DANGOTE', 'ASHAKA'];

const initialInventory: InventoryData = shopOptions.reduce((acc, shopName) => {
  acc[shopName] = { 
    currentStock: { DANGOTE: 0, ASHAKA: 0 }, 
    deliveries: [] 
  };
  return acc;
}, {} as InventoryData);

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
            <div className="inline-flex p-4 bg-rose-500/10 rounded-2xl">
              <AlertTriangle className="h-10 w-10 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Something went wrong</h2>
              <p className="text-slate-400 font-medium">
                {this.state.error?.message?.startsWith('{') 
                  ? "A database error occurred. Please check your permissions." 
                  : "An unexpected error occurred while running the application."}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all active:scale-95"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryData>(initialInventory);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [activeMenu, setActiveMenu] = useState<'sales' | 'inventory' | null>(null);
  const { showToast } = useToast();

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        // Initialize user profile in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        getDoc(userRef).then(docSnap => {
          if (!docSnap.exists()) {
            setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: 'user'
            }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`));
          }
        });
      } else {
        setSales([]);
        setInventory(initialInventory);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const salesQuery = query(
      collection(db, 'users', user.uid, 'sales'),
      orderBy('date', 'desc')
    );

    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SaleRecord[];
      setSales(salesData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/sales`));

    const unsubscribeInventory = onSnapshot(collection(db, 'users', user.uid, 'inventory'), (snapshot) => {
      const invData: InventoryData = { ...initialInventory };
      snapshot.docs.forEach(doc => {
        const data = doc.data() as any;
        // Self-heal logic: recalculate currentStock from deliveries to ensure consistency
        const syncedData = syncStockWithDeliveries(data);
        invData[doc.id] = syncedData;
      });
      setInventory(invData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/inventory`));

    return () => {
      unsubscribeSales();
      unsubscribeInventory();
    };
  }, [user, isAuthReady]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Signed in successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to sign in with Google.', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out successfully.', 'info');
    } catch (error) {
      console.error(error);
      showToast('Failed to sign out.', 'error');
    }
  };

  const syncStockWithDeliveries = (shopInventory: any) => {
    if (!shopInventory) return shopInventory;
    if (!shopInventory.deliveries) {
      shopInventory.deliveries = [];
    }
    
    const updatedStock = { DANGOTE: 0, ASHAKA: 0 };
    shopInventory.deliveries.forEach((d: any) => {
      // Logic for backward compatibility: if remainingQuantity is missing, use quantity
      if (d.remainingQuantity === undefined || d.remainingQuantity === null) {
        d.remainingQuantity = d.quantity || 0;
      }
      
      if (d.stockType === 'DANGOTE') updatedStock.DANGOTE += Number(d.remainingQuantity) || 0;
      if (d.stockType === 'ASHAKA') updatedStock.ASHAKA += Number(d.remainingQuantity) || 0;
    });
    
    shopInventory.currentStock = updatedStock;
    return shopInventory;
  };

  const handleAddSale = async (data: SaleRecord) => {
    if (!user) return;

    const shopInv = inventory[data.shopName];
    const delivery = shopInv?.deliveries.find(d => d.id === data.deliveryId);

    if (!delivery) {
      showToast(`Error: Selected delivery not found.`, 'error');
      return;
    }

    if (data.bagsSold > delivery.remainingQuantity) {
      showToast(`Error: Not enough stock in this delivery. Only ${delivery.remainingQuantity} bags left.`, 'error');
      return;
    }

    const expectedRevenue = data.bagsSold * data.pricePerBag;
    const discrepancy = expectedRevenue - (data.totalTransfer + data.expenses);

    try {
      const batch = writeBatch(db);
      
      // Add sale record
      const saleRef = doc(collection(db, 'users', user.uid, 'sales'));
      batch.set(saleRef, {
        date: data.date,
        shopName: data.shopName,
        stockType: data.stockType,
        bagsSold: data.bagsSold,
        pricePerBag: data.pricePerBag,
        totalTransfer: data.totalTransfer,
        expenses: data.expenses,
        deliveryId: data.deliveryId,
        notes: data.notes || '',
        expectedRevenue,
        discrepancy,
        authorUid: user.uid
      });

      // Update inventory
      const shopRef = doc(db, 'users', user.uid, 'inventory', data.shopName);
      let updatedShop = JSON.parse(JSON.stringify(inventory[data.shopName])); // Deep clone
      
      // Deduct from specific delivery
      const targetDelivery = updatedShop.deliveries.find((d: DeliveryRecord) => d.id === data.deliveryId);
      if (targetDelivery) {
        targetDelivery.remainingQuantity -= data.bagsSold;
      }
      
      // Sync total stock
      updatedShop = syncStockWithDeliveries(updatedShop);

      updatedShop.authorUid = user.uid;
      updatedShop.shopName = data.shopName;
      
      batch.set(shopRef, updatedShop);

      await batch.commit();
      setActiveMenu(null);
      showToast('Sale record added successfully.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/sales`);
    }
  };

  const handleUpdateSale = async (saleData: SaleRecord) => {
    if (!user) return;
    const originalSale = sales.find(s => s.id === saleData.id);
    if (!originalSale) return;

    const shopInv = inventory[saleData.shopName];
    const delivery = shopInv?.deliveries.find(d => d.id === saleData.deliveryId);

    if (!delivery) {
      showToast(`Error: Selected delivery not found.`, 'error');
      return;
    }

    // Calculate effective remaining quantity if it's the same delivery
    let effectiveRemaining = delivery.remainingQuantity;
    if (saleData.deliveryId === originalSale.deliveryId) {
      effectiveRemaining += originalSale.bagsSold;
    }

    if (saleData.bagsSold > effectiveRemaining) {
        showToast(`Error: Not enough stock in this delivery. Only ${effectiveRemaining} bags available.`, 'error');
        return;
    }

    const expectedRevenue = saleData.bagsSold * saleData.pricePerBag;
    const discrepancy = expectedRevenue - (saleData.totalTransfer + saleData.expenses);

    try {
      const batch = writeBatch(db);
      
      // Update sale record
      const saleRef = doc(db, 'users', user.uid, 'sales', saleData.id);
      batch.update(saleRef, {
        ...saleData,
        expectedRevenue,
        discrepancy,
        authorUid: user.uid
      });

      // Revert original stock
      const shopOrigRef = doc(db, 'users', user.uid, 'inventory', originalSale.shopName);
      let shopOrig = JSON.parse(JSON.stringify(inventory[originalSale.shopName]));
      const origDelivery = shopOrig.deliveries.find((d: DeliveryRecord) => d.id === originalSale.deliveryId);
      if (origDelivery) {
        origDelivery.remainingQuantity += originalSale.bagsSold;
      }
      shopOrig = syncStockWithDeliveries(shopOrig);
      batch.set(shopOrigRef, shopOrig);

      // Apply new stock
      const shopNewRef = doc(db, 'users', user.uid, 'inventory', saleData.shopName);
      let shopNew = (saleData.shopName === originalSale.shopName) ? shopOrig : JSON.parse(JSON.stringify(inventory[saleData.shopName]));
      
      const newDelivery = shopNew.deliveries.find((d: DeliveryRecord) => d.id === saleData.deliveryId);
      if (newDelivery) {
        newDelivery.remainingQuantity -= saleData.bagsSold;
      }
      shopNew = syncStockWithDeliveries(shopNew);

      shopNew.authorUid = user.uid;
      shopNew.shopName = saleData.shopName;
      batch.set(shopNewRef, shopNew);

      await batch.commit();
      setEditingSale(null);
      setActiveMenu(null);
      showToast('Sale record updated successfully.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sales/${saleData.id}`);
    }
  };

  const handleDeleteSale = async (saleToDelete: SaleRecord) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // Delete sale
      const saleRef = doc(db, 'users', user.uid, 'sales', saleToDelete.id);
      batch.delete(saleRef);

      // Revert stock
      const shopRef = doc(db, 'users', user.uid, 'inventory', saleToDelete.shopName);
      let shopInventory = JSON.parse(JSON.stringify(inventory[saleToDelete.shopName]));
      const delivery = shopInventory.deliveries.find((d: DeliveryRecord) => d.id === saleToDelete.deliveryId);
      if (delivery) {
        delivery.remainingQuantity += saleToDelete.bagsSold;
      }
      shopInventory = syncStockWithDeliveries(shopInventory);
      batch.set(shopRef, shopInventory);

      await batch.commit();
      showToast('Sale record deleted.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/sales/${saleToDelete.id}`);
    }
  };
  
  const handleAddDelivery = async (shopName: string, quantity: number, date: string, stockType: StockType) => {
    if (!user) return;
    try {
      const shopRef = doc(db, 'users', user.uid, 'inventory', shopName);
      let shopData = inventory[shopName] 
        ? JSON.parse(JSON.stringify(inventory[shopName]))
        : { currentStock: { DANGOTE: 0, ASHAKA: 0 }, deliveries: [] };
      
      const newDelivery: DeliveryRecord = {
        id: Math.random().toString(36).substring(2, 15),
        date,
        quantity,
        remainingQuantity: quantity,
        stockType,
      };

      shopData.deliveries = [...shopData.deliveries, newDelivery];
      shopData = syncStockWithDeliveries(shopData);
      shopData.authorUid = user.uid;
      shopData.shopName = shopName;

      await setDoc(shopRef, shopData);
      showToast(`Delivery of ${quantity} bags added to ${shopName}.`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/inventory/${shopName}`);
    }
  };

  const handleDeleteDelivery = async (shopName: string, deliveryId: string) => {
    if (!user) return;
    try {
      let shopInventory = JSON.parse(JSON.stringify(inventory[shopName]));
      const deliveryToDelete = shopInventory.deliveries.find((d: DeliveryRecord) => d.id === deliveryId);
      if (!deliveryToDelete) return;

      if (deliveryToDelete.remainingQuantity < deliveryToDelete.quantity) {
        showToast(`Cannot delete this delivery. Some bags from this delivery have already been sold.`, 'error');
        return;
      }

      shopInventory.deliveries = shopInventory.deliveries.filter((d: DeliveryRecord) => d.id !== deliveryId);
      shopInventory = syncStockWithDeliveries(shopInventory);

      const shopRef = doc(db, 'users', user.uid, 'inventory', shopName);
      await setDoc(shopRef, shopInventory);
      showToast('Delivery record removed.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/inventory/${shopName}`);
    }
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

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Initializing Secure Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
          
          <div className="space-y-4">
            <div className="inline-flex p-4 bg-indigo-500/10 rounded-3xl">
              <ShieldCheck className="h-12 w-12 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white tracking-tight">Cement Sales Tracker</h1>
              <p className="text-slate-400 font-medium leading-relaxed">Securely manage your shop inventory and sales records with real-time cloud backup.</p>
            </div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-white text-slate-950 font-black rounded-2xl transition-all hover:bg-slate-100 active:scale-95 shadow-xl shadow-white/5"
          >
            <img src="https://www.gstatic.com/firebase/anonymous-scan.png" className="h-6 w-6 hidden" alt="" />
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise Grade Security Enabled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-300 selection:bg-indigo-500/30">
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-black tracking-tight text-white">SalesTracker</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enterprise Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 mr-2">
                {user.photoURL ? (
                  <img src={user.photoURL} className="h-8 w-8 rounded-full border border-white/10" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.displayName}</span>
                  <span className="text-[10px] font-medium text-slate-500 truncate max-w-[120px]">{user.email}</span>
                </div>
              </div>

              <button 
                onClick={handleOpenAddSale}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Plus className="h-5 w-5" />
                <span>New Sale</span>
              </button>

              <button 
                onClick={handleSignOut}
                className="p-2.5 rounded-2xl bg-white/5 text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 transition-all border border-white/5 group"
                title="Sign Out"
              >
                <LogOut className="h-6 w-6 group-hover:translate-x-0.5 transition-transform" />
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
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
