import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Archive,
  Filter,
  TrendingUp,
  DollarSign,
  Package,
  Search,
  XCircle,
  Calendar,
  BarChart3,
  ShoppingBag,
  Store,
  Download,
  Users,
} from "lucide-react";
import { SalesTable } from "../components/SalesTable";
import { ShopPerformance } from "../components/ShopPerformance";
import { DatePicker } from "../components/DatePicker";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { CollaboratorManager } from "../components/CollaboratorManager";
import type { SaleRecord } from "../types";
import { useToast } from "../ToastContext";

interface SummaryData {
  totalBagsSold: number;
  totalRevenue: number;
  totalTransferred: number;
  totalDiscrepancy: number;
}

interface DashboardPageProps {
  sales: SaleRecord[];
  summaryData: SummaryData;
  shopOptions: string[];
  onEditSale: (sale: SaleRecord) => void;
  onDeleteSale: (sale: SaleRecord) => void;
  isReadOnly?: boolean;
  isUserPrincipal?: boolean;
  invitations?: any[];
  onSendInvitation?: (email: string, permission: "view" | "edit") => Promise<void>;
  onRevokeInvitation?: (id: string) => Promise<void>;
  filters: { shopName: string; startDate: string; endDate: string };
  filteredSales: SaleRecord[];
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDateChange: (name: "startDate" | "endDate", date: string) => void;
  onClearFilters: () => void;
}

const SummaryCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
  isCurrency?: boolean;
}> = ({
  title,
  value,
  icon,
  colorClass = "text-slate-50",
  isCurrency = false,
}) => {
  // Determine distinct visual theme for each card to provide maximum elegance
  const cardTheme = useMemo(() => {
    if (title.includes("Bags")) {
      return {
        glow: "from-indigo-500/15 via-indigo-500/0 to-transparent",
        iconBg: "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20",
        pills: "text-indigo-400 bg-indigo-400/10",
      };
    }
    if (title.includes("Revenue")) {
      return {
        glow: "from-emerald-500/15 via-emerald-500/0 to-transparent",
        iconBg: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
        pills: "text-emerald-400 bg-emerald-400/10",
      };
    }
    return {
      glow: "from-purple-500/15 via-purple-500/0 to-transparent",
      iconBg: "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20",
      pills: "text-purple-400 bg-purple-400/10",
    };
  }, [title]);

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2, ease: "easeOut" } }}
      className="p-6 sm:p-8 rounded-2xl bg-[#121418] border border-white/5 shadow-2xl relative overflow-hidden group"
    >
      {/* Dynamic ambient hover glow */}
      <div className={`absolute -right-16 -top-16 w-36 h-36 bg-gradient-to-br ${cardTheme.glow} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className={`p-3 rounded-xl ${cardTheme.iconBg} transition-transform group-hover:scale-110 duration-300`}>
          {icon}
        </div>
        {isCurrency && (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${cardTheme.pills}`}>
            Verified
          </span>
        )}
      </div>

      <div className="relative z-10 space-y-1.5">
        <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest leading-none">
          {title}
        </p>
        <h3 className={`text-3xl font-display font-medium tracking-tight leading-none text-gradient ${colorClass}`}>
          {isCurrency
            ? new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: "NGN",
                maximumFractionDigits: 0,
              }).format(Number(value))
            : value}
        </h3>
      </div>
    </motion.div>
  );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  sales,
  summaryData,
  shopOptions,
  onEditSale,
  onDeleteSale,
  isReadOnly = false,
  isUserPrincipal = false,
  invitations = [],
  onSendInvitation,
  onRevokeInvitation,
  filters,
  filteredSales,
  onFilterChange,
  onDateChange,
  onClearFilters,
}) => {
  const [activeTab, setActiveTab] = useState<"sales" | "performance" | "team">("sales");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<SaleRecord | null>(null);
  const { showToast } = useToast();

  const handleOpenDeleteModal = (sale: SaleRecord) => {
    setSaleToDelete(sale);
  };

  const handleCloseDeleteModal = () => {
    setSaleToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (saleToDelete) {
      onDeleteSale(saleToDelete);
      setSaleToDelete(null);
    }
  };

  const formatDateForModal = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-medium text-white tracking-tight mb-2">
            Dashboard Overview
          </h2>
          <p className="text-[#A1A1AA] font-medium">
            Real-time performance metrics and inventory tracking.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Bags Sold"
          value={summaryData.totalBagsSold}
          icon={<ShoppingBag className="h-6 w-6" />}
        />
        <SummaryCard
          title="Expected Revenue"
          value={summaryData.totalRevenue}
          isCurrency
          icon={<TrendingUp className="h-6 w-6" />}
          colorClass="text-white"
        />
        <SummaryCard
          title="Total Transferred"
          value={summaryData.totalTransferred}
          isCurrency
          icon={<DollarSign className="h-6 w-6" />}
          colorClass="text-indigo-400"
        />
        <SummaryCard
          title="Total Discrepancy"
          value={summaryData.totalDiscrepancy}
          isCurrency
          icon={<DollarSign className="h-6 w-6" />}
          colorClass={
            summaryData.totalDiscrepancy === 0 
              ? "text-emerald-400" 
              : summaryData.totalDiscrepancy < 0 
                ? "text-rose-400" 
                : "text-amber-400"
          }
        />
      </div>

      <div className="flex p-1.5 bg-[#121418] border border-white/5 rounded-xl overflow-x-auto no-scrollbar gap-1 mb-2">
        <button
          onClick={() => setActiveTab("sales")}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all active:scale-[0.98] ${
            activeTab === "sales"
              ? "bg-white/10 text-white shadow-sm"
              : "text-[#A1A1AA] hover:text-white hover:bg-white/5"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Sales Records</span>
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all active:scale-[0.98] ${
            activeTab === "performance"
              ? "bg-white/10 text-white shadow-sm"
              : "text-[#A1A1AA] hover:text-white hover:bg-white/5"
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Shop Performance</span>
        </button>
        {isUserPrincipal && onSendInvitation && onRevokeInvitation && (
          <button
            onClick={() => setActiveTab("team")}
            className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all active:scale-[0.98] ${
              activeTab === "team"
                ? "bg-white/10 text-white shadow-sm"
                : "text-[#A1A1AA] hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Team & Access</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "sales" && (
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#121418] rounded-2xl border border-white/5 overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 sm:p-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <BarChart3 className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Sales Records
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {filteredSales.length} transactions found
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative group w-full sm:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                name="shopName"
                value={filters.shopName}
                onChange={onFilterChange}
                placeholder="Search shop..."
                className="pl-12 pr-6 py-3 bg-slate-950 border border-white/5 rounded-2xl text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all w-full sm:w-56"
              />
            </div>

            <div className="w-full sm:w-auto">
              <button
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border transition-all text-sm font-bold ${isFilterVisible ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15" : "bg-slate-950 border-white/5 text-slate-300 hover:bg-white/5"}`}
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5">
          <AnimatePresence>
            {isFilterVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-slate-950/50 border-b border-white/5"
              >
                <div className="p-4 sm:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-end">
                    <DatePicker
                      label="Start Date"
                      value={filters.startDate}
                      onChange={(date) => onDateChange("startDate", date)}
                    />
                    <DatePicker
                      label="End Date"
                      value={filters.endDate}
                      onChange={(date) => onDateChange("endDate", date)}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={onClearFilters}
                        className="flex-1 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-bold transition-all border border-white/5"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setIsFilterVisible(false)}
                        className="flex-1 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-3 sm:p-6 lg:p-8 max-h-[520px] overflow-y-auto custom-scrollbar">
            <SalesTable
              sales={filteredSales}
              onEdit={onEditSale}
              onDelete={handleOpenDeleteModal}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>
      </motion.div>
      )}

      {activeTab === "performance" && (
      <motion.div 
        key="performance"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="bg-[#121418] rounded-2xl border border-white/5 p-4 sm:p-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-amber-500/10 rounded-2xl">
            <Store className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Shop Performance
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Comparative analysis across all locations
            </p>
          </div>
        </div>
        <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
          <ShopPerformance sales={filteredSales} shopOptions={shopOptions} />
        </div>
      </motion.div>
      )}

      {activeTab === "team" && isUserPrincipal && onSendInvitation && onRevokeInvitation && (
        <motion.div
          key="team"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <CollaboratorManager
            invitations={invitations}
            onSendInvitation={onSendInvitation}
            onRevokeInvitation={onRevokeInvitation}
          />
        </motion.div>
      )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!saleToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Sale Record"
        message={
          <div className="space-y-4">
            <p className="text-slate-300">
              Are you sure you want to delete this sale record? This action will
              revert the inventory levels and cannot be undone.
            </p>
            {saleToDelete && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Shop
                  </span>
                  <span className="text-sm font-bold text-white">
                    {saleToDelete.shopName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Amount
                  </span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(saleToDelete.expectedRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Date
                  </span>
                  <span className="text-sm font-bold text-slate-300">
                    {formatDateForModal(saleToDelete.date)}
                  </span>
                </div>
              </div>
            )}
          </div>
        }
        confirmText="Delete Record"
        type="danger"
      />
    </div>
  );
};
