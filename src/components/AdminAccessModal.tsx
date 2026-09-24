import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  X,
  CheckCircle,
  Crown,
  ExternalLink,
  Copy,
  Check,
  Code2,
  Globe,
  Database,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  fetchAllAccessRequests,
  setAccessStatus,
  AccessRequestRecord,
  ADMIN_EMAILS,
} from '../services/accessControlService';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminAccessModal({ isOpen, onClose }: AdminAccessModalProps) {
  const [activeTab, setActiveTab] = useState<'aistudio' | 'users'>('aistudio');
  const [requests, setRequests] = useState<AccessRequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const APPLET_ID = '156f758e-36a8-4f5a-9174-14a7424d7f43';
  const DEV_URL = 'https://ais-dev-6qhmeuoh4jdjfanszztyyl-158620435447.asia-southeast1.run.app';
  const SHARED_URL = 'https://ais-pre-6qhmeuoh4jdjfanszztyyl-158620435447.asia-southeast1.run.app';
  const FIRESTORE_DB = 'ai-studio-feasibilityxxx-156f758e-36a8-4f5a-9174-14a7424d7f43';

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchAllAccessRequests();
      setRequests(data);
    } catch (e) {
      console.error('Error loading requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleUpdateStatus = async (email: string, status: 'approved' | 'rejected') => {
    try {
      await setAccessStatus(email, status);
      setActionMessage(
        status === 'approved'
          ? `Granted access to ${email}! They can now use and install the website.`
          : `Revoked access for ${email}.`
      );
      setTimeout(() => setActionMessage(null), 4000);
      loadRequests();
    } catch (err: any) {
      alert(`Failed to update status: ${err?.message || err}`);
    }
  };

  if (!isOpen) return null;

  const filteredRequests = requests.filter(
    (r) =>
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Owner &amp; Admin Control Hub</h2>
              <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Full Control
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Authorized Owner: <span className="font-semibold text-slate-800">John Joebert Suarez</span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 mb-4 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('aistudio')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'aistudio'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Studio &amp; Code Management</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>User Access Approvals</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Action feedback banner */}
        {actionMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* TAB 1: AI STUDIO & CODE CONTROL */}
        {activeTab === 'aistudio' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-700">
            {/* Owner Authority Notice */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white border border-indigo-500/40 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Verified Owner Privileges</span>
                    <span className="text-[9px] bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded">
                      Active
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    You have complete master control over NoBSFeasibility. When signed in with your authorized admin account,
                    you can inspect the codebase, direct the AI model, approve users, and publish website updates directly from Google AI Studio.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Studio Direct Launch Card */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    Google AI Studio Workspace
                  </span>
                </div>
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                >
                  <span>Open Google AI Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    AI Studio Applet ID
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-800 truncate block select-all">
                    {APPLET_ID}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(APPLET_ID, 'appletId')}
                  className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded flex items-center gap-1 cursor-pointer transition shrink-0"
                >
                  {copiedField === 'appletId' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                <h5 className="font-bold text-slate-800 text-[11px]">
                  How to edit code &amp; publish using your Google AI Studio account:
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    Open <span className="font-semibold text-indigo-700">aistudio.google.com</span> and sign in with your authorized Google account.
                  </li>
                  <li>
                    Navigate to your <span className="font-semibold text-slate-800">Build</span> workspace to access this applet.
                  </li>
                  <li>
                    Type instructions in natural language or review code files directly in the editor to modify features, formulas, or styles.
                  </li>
                  <li>
                    Click the <span className="font-semibold text-emerald-700">Share / Publish</span> button in AI Studio to deploy changes instantly to your public preview URL.
                  </li>
                </ol>
              </div>
            </div>

            {/* Cloud & Live URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Public Shared Preview URL</span>
                </div>
                <a
                  href={SHARED_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-indigo-600 hover:underline truncate block"
                >
                  {SHARED_URL}
                </a>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Firestore Cloud Database</span>
                </div>
                <span className="font-mono text-[10px] text-slate-600 truncate block">
                  {FIRESTORE_DB}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER ACCESS APPROVALS */}
        {activeTab === 'users' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Search & Refresh */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={loadRequests}
                disabled={loading}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* List of Requests */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                  <span>Loading registered access requests...</span>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No user access requests found.
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div
                    key={req.email}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {req.photoURL ? (
                        <img
                          src={req.photoURL}
                          alt={req.displayName}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {req.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-2">
                          <span>{req.displayName}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              req.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {req.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{req.email}</div>
                        <div className="text-[10px] text-slate-400">
                          Requested: {new Date(req.requestedAt).toLocaleDateString()}{' '}
                          {new Date(req.requestedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {req.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req.email, 'approved')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Approve Access</span>
                        </button>
                      )}

                      {req.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req.email, 'rejected')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>John Joebert Suarez &bull; NoBSFeasibility Master Admin</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
