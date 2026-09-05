import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Mail, UserPlus, UserMinus, Shield, Calendar, Trash2, Key, HelpCircle, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { useToast } from "../ToastContext";

interface CollaboratorManagerProps {
  invitations: any[];
  onSendInvitation: (email: string, permission: "view" | "edit") => Promise<void>;
  onRevokeInvitation: (id: string) => Promise<void>;
}

export const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({
  invitations,
  onSendInvitation,
  onRevokeInvitation,
}) => {
  const [activeTab, setActiveTab] = useState<"list" | "invite">("list");
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setLoading(true);
    try {
      await onSendInvitation(email.trim().toLowerCase(), permission);
      setEmail("");
      showToast(`Successfully invited ${email.trim().toLowerCase()}`, "success");
      setActiveTab("list"); // Auto-switch to active list to see of the result
    } catch (err: any) {
      // Error handled by parent toast, but capture to reset spinner
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return isoString;
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/40 to-slate-950/20 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-xl relative overflow-hidden space-y-8" id="collaborator-manager">
      {/* Decorative ambient background blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Symmetric Core Top-Centered Header */}
      <div className="flex flex-col items-center text-center space-y-4 pt-4 relative z-10">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-30 animate-pulse" />
          <div className="relative p-4 bg-slate-950 rounded-2xl border border-white/10 text-indigo-400">
            <Users className="h-7 w-7" />
          </div>
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-2xl font-black text-white tracking-tight sm:text-3xl">Collaborators & Access</h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            Invite and manage verified team collaborators with role-based access control.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl text-xs font-black uppercase tracking-wider border border-indigo-500/10">
          <Shield className="h-3.5 w-3.5" />
          SYSTEM ADMINISTRATION CONTROL
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex justify-center pt-2">
        <div className="p-1 bg-slate-950/80 rounded-2xl border border-white/5 flex gap-1 relative">
          <button
            onClick={() => setActiveTab("list")}
            className={`relative px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 z-10 ${
              activeTab === "list" ? "text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {activeTab === "list" && (
              <motion.div
                layoutId="active-tab-pill"
                className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg shadow-indigo-600/30"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <ShieldCheck className="h-4 w-4" />
            Active Collaborators ({invitations.length})
          </button>
          <button
            onClick={() => setActiveTab("invite")}
            className={`relative px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 z-10 ${
              activeTab === "invite" ? "text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {activeTab === "invite" && (
              <motion.div
                layoutId="active-tab-pill"
                className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg shadow-indigo-600/30"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Content Container with AnimatePresence for tab switching */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "invite" ? (
            <motion.div
              key="invite-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start"
            >
              <form onSubmit={handleSubmit} className="md:col-span-3 space-y-6 bg-slate-950/40 p-8 rounded-[2rem] border border-white/5 shadow-xl">
                <h3 className="text-base font-black text-white uppercase tracking-wider border-b border-white/5 pb-4 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-indigo-400" />
                  Issue New Credentials
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="collab-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Collaborator's Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 focus-within:text-indigo-400" />
                      <input
                        type="email"
                        id="collab-email"
                        placeholder="co-operator@company.com"
                        required
                        value={email}
                        disabled={loading}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-900/60 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="collab-permission" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Resource Permission Scope
                    </label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                      <select
                        id="collab-permission"
                        value={permission}
                        disabled={loading}
                        onChange={(e) => setPermission(e.target.value as "view" | "edit")}
                        className="w-full pl-12 pr-10 py-4 bg-slate-900/60 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none font-bold text-sm cursor-pointer"
                      >
                        <option value="view" className="bg-slate-900">VIEW ONLY (Read Dashboard & Stock)</option>
                        <option value="edit" className="bg-slate-900">WRITE ACCESS (Full Add / Edit / Delete)</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <ArrowRight className="h-4 w-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-900/20 transition-all text-xs"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {loading ? "Authorizing Member..." : "Grant System Access"}
                </motion.button>
              </form>

              <div className="md:col-span-2 space-y-6">
                <div className="bg-indigo-500/5 p-6 rounded-[2rem] border border-indigo-500/10 space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">How Access Works</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold mt-1">
                        We authenticate incoming connections dynamically. Once a user logs in with their Google account matching this exact email, they gain instant system privileges.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/20 p-6 rounded-[2rem] border border-white/5 space-y-3 text-[11px] text-slate-400 font-medium">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Security Protocols</span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Real-time identity verification checks</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Instant remote revocation controls</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>Strict database-enforced security rules</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl">
                {invitations.length > 0 ? (
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="min-w-[600px] w-full whitespace-nowrap border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-slate-900/60 text-slate-500">
                          <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest border-b border-white/5">Verified Email Address</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest border-b border-white/5">Access Rights</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest border-b border-white/5">Authorized Date</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest border-b border-white/5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <AnimatePresence>
                          {invitations.map((inv) => (
                            <motion.tr
                              layout
                              key={inv.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="hover:bg-white/5 transition-colors group text-sm"
                            >
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-white/5 rounded-xl text-slate-300">
                                    <Mail className="h-4 w-4" />
                                  </div>
                                  <span className="font-bold text-slate-200 truncate max-w-[200px] sm:max-w-[300px]">
                                    {inv.collaboratorEmail}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                    inv.permission === "edit"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                                      : "bg-indigo-500/10 text-indigo-400 border-indigo-500/10"
                                  }`}
                                >
                                  {inv.permission === "edit" ? "Edit & Write" : "View Only"}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-xs text-slate-500 font-bold font-mono">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(inv.createdAt)}
                                </div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <button
                                  onClick={() => {
                                    onRevokeInvitation(inv.id).then(() => {
                                      showToast("Access privileges revoked successfully.", "info");
                                    });
                                  }}
                                  className="text-slate-400 hover:text-rose-400 p-2.5 rounded-xl hover:bg-rose-400/10 transition-all inline-flex items-center"
                                  title="Revoke System Access"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="p-4 bg-slate-900/50 rounded-3xl border border-white/5 mb-4 text-slate-600 animate-pulse">
                      <UserMinus className="h-10 w-10" />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">No active collaborators yet</h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Issue custom credentials to allow others to safely access this console under your supervision.
                    </p>
                    <button
                      onClick={() => setActiveTab("invite")}
                      className="mt-6 px-5 py-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all text-xs font-black uppercase tracking-widest rounded-xl"
                    >
                      Invite Now
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
