
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
  RefreshCw,
  Users,
  Shield,
  UserPlus,
  UserMinus,
  Mail,
  Trash2
} from 'lucide-react';
import { SaleRecord, InventoryData, StockType, DeliveryRecord } from './types';
import { DashboardPage } from './pages/DashboardPage';
import { NavMenu } from './components/NavMenu';
import { SalesForm } from './components/SalesForm';
import { InventoryManager } from './components/InventoryManager';
import { handleDownloadCSV } from './utils/csvExport';
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
  getDoc,
  where
} from 'firebase/firestore';

const DEFAULT_SHOPS = [
  'Abbakar',
  'Bala',
  'Zone 3',
  'Lakare',
  'Dandu',
  'Hamid',
  'Dauda',
  'Husseini',
  'Bibi',
  'BEATRICE'
];
const stockTypes: StockType[] = ['DANGOTE', 'ASHAKA'];

const initialInventory: InventoryData = DEFAULT_SHOPS.reduce((acc, shopName) => {
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
  const [currentView, setCurrentView] = useState<'dashboard' | 'new-sale' | 'inventory'>('dashboard');
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [filters, setFilters] = useState({ shopName: "", startDate: "", endDate: "" });
  const { showToast } = useToast();

  const shopOptions = DEFAULT_SHOPS;

  // Collaborators & Access State
  const principalEmailAddress = 'muniribraheemiya1142@gmail.com';
  const [targetUid, setTargetUid] = useState<string | null>(null);
  const [myAccess, setMyAccess] = useState<{ principalUid: string; permission: 'view' | 'edit'; principalEmail: string } | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [invitations, setInvitations] = useState<any[]>([]);

  // Invitation fields for Principal's management UI
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'view' | 'edit'>('view');
  const [isInviting, setIsInviting] = useState(false);

  const isUserPrincipal = user?.email?.toLowerCase() === principalEmailAddress.toLowerCase();
  const hasEditPermission = isUserPrincipal || (myAccess?.permission === 'edit');

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
              role: currentUser.email?.toLowerCase() === principalEmailAddress.toLowerCase() ? 'admin' : 'user'
            }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`));
          }
        });
      } else {
        setSales([]);
        setInventory(initialInventory);
        setTargetUid(null);
        setMyAccess(null);
        setCheckingAccess(true);
        setInvitations([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Access and Invitations Listener
  useEffect(() => {
    if (!user) {
      setCheckingAccess(false);
      return;
    }

    setCheckingAccess(true);

    if (isUserPrincipal) {
      // The Principal always has access to their own data
      setTargetUid(user.uid);
      setMyAccess({
        principalUid: user.uid,
        permission: 'edit',
        principalEmail: user.email || ''
      });
      setCheckingAccess(false);

      // Listen to invitations sent by the Principal
      const q = query(collection(db, 'invitations'), where('principalUid', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInvitations(list);
      }, (err) => console.error("Error fetching invitations:", err));

      return () => unsubscribe();
    } else {
      // Collaborator access check: find incoming invitations
      const collaboratorEmailLower = (user.email || '').toLowerCase();
      const q = query(
        collection(db, 'invitations'),
        where('collaboratorEmail', '==', collaboratorEmailLower)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setMyAccess({
            principalUid: docData.principalUid,
            permission: docData.permission as 'view' | 'edit',
            principalEmail: docData.principalEmail
          });
          setTargetUid(docData.principalUid);
        } else {
          setMyAccess(null);
          setTargetUid(null);
        }
        setCheckingAccess(false);
      }, (err) => {
        console.error("Error checking permissions:", err);
        setCheckingAccess(false);
      });

      return () => unsubscribe();
    }
  }, [user, isUserPrincipal]);

  // Firestore Sales & Inventory Listeners
  useEffect(() => {
    if (!user || !isAuthReady || !targetUid) {
      setSales([]);
      setInventory(initialInventory);
      return;
    }

    const salesQuery = query(
      collection(db, 'users', targetUid, 'sales'),
      orderBy('date', 'desc')
    );

    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SaleRecord[];
      setSales(salesData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${targetUid}/sales`));

    const unsubscribeInventory = onSnapshot(collection(db, 'users', targetUid, 'inventory'), (snapshot) => {
      const invData: InventoryData = { ...initialInventory };
      snapshot.docs.forEach(doc => {
        const data = doc.data() as any;
        // Self-heal logic: recalculate currentStock from deliveries to ensure consistency
        const syncedData = syncStockWithDeliveries(data);
        invData[doc.id] = syncedData;
      });
      setInventory(invData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${targetUid}/inventory`));

    return () => {
      unsubscribeSales();
      unsubscribeInventory();
    };
  }, [user, isAuthReady, targetUid]);

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
    if (!user || !targetUid) return;

    const hasEditPermission = isUserPrincipal || (myAccess?.permission === 'edit');
    if (!hasEditPermission) {
      showToast('Error: You only have View-Only permissions. Actions are disabled.', 'error');
      return;
    }

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
      const timestamp = Date.now();
      const randomPart = Math.random().toString(36).substring(2, 8);
      const saleId = `${timestamp}_${randomPart}`;
      const saleRef = doc(db, 'users', targetUid, 'sales', saleId);
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
      const shopRef = doc(db, 'users', targetUid, 'inventory', data.shopName);
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
      setCurrentView('dashboard');
      showToast('Sale record added successfully.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}/sales`);
    }
  };

  const handleUpdateSale = async (saleData: SaleRecord) => {
    if (!user || !targetUid) return;

    const hasEditPermission = isUserPrincipal || (myAccess?.permission === 'edit');
    if (!hasEditPermission) {
      showToast('Error: You only have View-Only permissions. Actions are disabled.', 'error');
      return;
    }

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
      const saleRef = doc(db, 'users', targetUid, 'sales', saleData.id);
      batch.update(saleRef, {
        ...saleData,
        expectedRevenue,
        discrepancy,
        authorUid: user.uid
      });

      // Revert original stock
      const shopOrigRef = doc(db, 'users', targetUid, 'inventory', originalSale.shopName);
      let shopOrig = JSON.parse(JSON.stringify(inventory[originalSale.shopName]));
      const origDelivery = shopOrig.deliveries.find((d: DeliveryRecord) => d.id === originalSale.deliveryId);
      if (origDelivery) {
        origDelivery.remainingQuantity += originalSale.bagsSold;
      }
      shopOrig = syncStockWithDeliveries(shopOrig);
      batch.set(shopOrigRef, shopOrig);

      // Apply new stock
      const shopNewRef = doc(db, 'users', targetUid, 'inventory', saleData.shopName);
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
      setCurrentView('dashboard');
      showToast('Sale record updated successfully.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}/sales/${saleData.id}`);
    }
  };

  const handleDeleteSale = async (saleToDelete: SaleRecord) => {
    if (!user || !targetUid) return;

    const hasEditPermission = isUserPrincipal || (myAccess?.permission === 'edit');
    if (!hasEditPermission) {
      showToast('Error: You only have View-Only permissions. Actions are disabled.', 'error');
      return;
    }

    try {
      const batch = writeBatch(db);
      
      // Delete sale
      const saleRef = doc(db, 'users', targetUid, 'sales', saleToDelete.id);
      batch.delete(saleRef);

      // Revert stock
      const shopRef = doc(db, 'users', targetUid, 'inventory', saleToDelete.shopName);
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
      handleFirestoreError(err, OperationType.DELETE, `users/${targetUid}/sales/${saleToDelete.id}`);
    }
  };
  
  const handleAddDelivery = async (shopName: string, quantity: number, date: string, stockType: StockType) => {
    if (!user || !targetUid) return;

    const hasEditPermission = isUserPrincipal || (myAccess?.permission === 'edit');
    if (!hasEditPermission) {
      showToast('Error: You only have View-Only permissions. Actions are disabled.', 'error');
      return;
    }

    try {
      const shopRef = doc(db, 'users', targetUid, 'inventory', shopName);
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
      handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}/inventory/${shopName}`);
    }
  };

  const handleDeleteDelivery = async (shopName: string, deliveryId: string) => {
    if (!user || !targetUid) return;

    const hasEditPermission = isUserPrincipal || (myAccess?.permission === 'edit');
    if (!hasEditPermission) {
      showToast('Error: You only have View-Only permissions. Actions are disabled.', 'error');
      return;
    }

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

      const shopRef = doc(db, 'users', targetUid, 'inventory', shopName);
      await setDoc(shopRef, shopInventory);
      showToast('Delivery record removed.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}/inventory/${shopName}`);
    }
  };

  const handleSendInvitation = async (email: string, permission: "view" | "edit") => {
    if (!user) return;
    try {
      const emailLower = email.trim().toLowerCase();
      const invId = `${user.uid}_${emailLower}`;
      const invRef = doc(db, "invitations", invId);
      await setDoc(invRef, {
        principalUid: user.uid,
        principalEmail: user.email || "",
        collaboratorEmail: emailLower,
        permission: permission,
        createdAt: new Date().toISOString(),
        invitedAt: new Date().toISOString(),
      });
      showToast("Invitation sent successfully.", "success");
    } catch (err: any) {
      console.error(err);
      showToast(`Error sending invitation: ${err.message || err}`, "error");
      throw err;
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const invRef = doc(db, "invitations", invitationId);
      await deleteDoc(invRef);
      showToast("Invitation revoked.", "info");
    } catch (err: any) {
      console.error(err);
      showToast(`Error revoking invitation: ${err.message || err}`, "error");
      throw err;
    }
  };

  const handleEditSale = (sale: SaleRecord) => { 
    setEditingSale(sale);
    setCurrentView('new-sale');
  };
  const handleCancelEdit = () => { 
    setEditingSale(null);
    setCurrentView('dashboard');
  };

  const handleOpenAddSale = () => {
    setEditingSale(null);
    setCurrentView('new-sale');
  };

  const handleOpenInventory = () => {
    setEditingSale(null);
    setCurrentView('inventory');
  };
  
  const handleToggleAccordion = (accordion: 'sales' | 'inventory') => {
    setCurrentView(accordion === 'sales' ? 'new-sale' : 'inventory');
  };

  const filteredSales = useMemo(() => {
    const list = sales.filter((sale) => {
      const shopMatch = filters.shopName
        ? sale.shopName.toLowerCase().includes(filters.shopName.toLowerCase())
        : true;
      const startDateMatch = filters.startDate
        ? sale.date >= filters.startDate
        : true;
      const endDateMatch = filters.endDate
        ? sale.date <= filters.endDate
        : true;
      return shopMatch && startDateMatch && endDateMatch;
    });
    // Sort logic to prioritize recent sales from top to bottom
    return list.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      
      const aTimeMatch = a.id.match(/^(\d{13})_/);
      const bTimeMatch = b.id.match(/^(\d{13})_/);
      const aTime = aTimeMatch ? parseInt(aTimeMatch[1], 10) : 0;
      const bTime = bTimeMatch ? parseInt(bTimeMatch[1], 10) : 0;
      
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      return b.id.localeCompare(a.id);
    });
  }, [sales, filters]);

  const onExportCSV = () => {
    handleDownloadCSV(filteredSales, filters, showToast);
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
      <div className="min-h-screen bg-[#090A0C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-[#A1A1AA] font-mono text-xs uppercase tracking-widest">Initializing Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-100"></div>
        
        <div className="relative w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl mb-6 shadow-2xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-display font-medium text-white mb-3">System Access</h1>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Authenticate to access the enterprise sales tracker and inventory management portal.
            </p>
          </div>
          
          <div className="bg-[#121418] border border-white/5 rounded-2xl p-2 shadow-2xl">
            <button 
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-white hover:bg-gray-100 text-[#090A0C] rounded-xl font-medium transition-all active:scale-[0.98]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
          
          <p className="text-center text-[10px] text-[#52525B] mt-8 uppercase tracking-widest font-mono">
            Secure Environment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0C] font-sans text-[#A1A1AA] selection:bg-white/20">
      <header className="bg-[#090A0C]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsNavMenuOpen(true)}
                className="p-1.5 rounded-lg text-[#A1A1AA] hover:bg-white/5 hover:text-white transition-all active:scale-95"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <div className="p-1.5 bg-white/5 border border-white/10 rounded-lg shadow-sm hidden sm:block">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-display font-medium text-white leading-none tracking-tight">SalesTracker</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-[#121418] rounded-xl border border-white/5 mr-2">
                {user.photoURL ? (
                  <img src={user.photoURL} className="h-6 w-6 rounded-full border border-white/10" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                    <UserIcon className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white truncate max-w-[120px]">{user.displayName}</span>
                </div>
              </div>

              <button 
                onClick={handleSignOut}
                className="p-2 rounded-lg bg-[#121418] text-[#A1A1AA] hover:bg-rose-500/10 hover:text-rose-400 transition-all border border-white/5 active:scale-95"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
               </button>
            </div>
          </div>
        </div>
      </header>

      <NavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        currentView={currentView}
        onNavigate={(v) => { setCurrentView(v); setIsNavMenuOpen(false); }}
        onExportCSV={onExportCSV}
        hasSalesToExport={filteredSales.length > 0}
        isReadOnly={!hasEditPermission}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <DashboardPage
                sales={sales}
                summaryData={summaryData}
                shopOptions={shopOptions}
                onEditSale={handleEditSale}
                onDeleteSale={handleDeleteSale}
                isReadOnly={!hasEditPermission}
                isUserPrincipal={isUserPrincipal}
                invitations={invitations}
                onSendInvitation={handleSendInvitation}
                onRevokeInvitation={handleRevokeInvitation}
                filters={filters}
                filteredSales={filteredSales}
                onFilterChange={(e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                onDateChange={(name, date) => setFilters(prev => ({ ...prev, [name]: date }))}
                onClearFilters={() => setFilters({ shopName: "", startDate: "", endDate: "" })}
              />
            </motion.div>
          )}

          {currentView === 'new-sale' && (
            <motion.div
              key="new-sale"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-[#121418] rounded-2xl border border-white/5 p-6 sm:p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-display font-medium text-white mb-2">
                    {editingSale ? 'Edit Sale Record' : 'New Sale Record'}
                  </h2>
                  <p className="text-[#A1A1AA]">
                    {editingSale ? 'Update the details for this sale.' : 'Enter the details for a new sale transaction.'}
                  </p>
                </div>
                <SalesForm
                  onSubmit={editingSale ? handleUpdateSale : handleAddSale}
                  onCancelEdit={handleCancelEdit}
                  editingSale={editingSale}
                  inventory={inventory}
                  shopOptions={shopOptions}
                  stockTypes={stockTypes}
                />
              </div>
            </motion.div>
          )}

          {currentView === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-[#121418] rounded-2xl border border-white/5 p-6 sm:p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-display font-medium text-white mb-2">
                    Inventory Management
                  </h2>
                  <p className="text-[#A1A1AA]">
                    Manage stock deliveries and track current inventory levels across all shops.
                  </p>
                </div>
                <InventoryManager
                  inventory={inventory}
                  shopOptions={shopOptions}
                  onAddDelivery={handleAddDelivery}
                  onDeleteDelivery={handleDeleteDelivery}
                  stockTypes={stockTypes}
                  isReadOnly={!hasEditPermission}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
