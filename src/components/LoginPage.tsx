import React, { useState } from 'react';
import { signInWithGoogle, logOut, type User } from '../firebase';
import {
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  FileSpreadsheet,
  BarChart3,
  Layers,
  Download,
  AlertCircle,
  Lock,
  Clock,
  Crown,
  ArrowRight,
  X,
  AlertTriangle,
  Eye,
  Sparkles,
} from 'lucide-react';
import { ADMIN_EMAIL, ADMIN_EMAILS, checkIsAdmin } from '../services/accessControlService';

interface LoginPageProps {
  onSuccessLogin: (user: {
    email: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  }) => void;
  onStartDemo?: () => void;
  inactivityNotice?: boolean;
}

export default function LoginPage({
  onSuccessLogin,
  onStartDemo,
  inactivityNotice = false,
}: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [directAccessLoading, setDirectAccessLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInstallWarning, setShowInstallWarning] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [showEmailField, setShowEmailField] = useState(false);

  // Direct access denial notification state
  const [directAccessNotice, setDirectAccessNotice] = useState<{
    showModal: boolean;
    email: string;
    message: string;
  } | null>(null);

  // Standard Google sign-in (allows any Google account to log in and request access)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    setDirectAccessNotice(null);
    try {
      const user = await signInWithGoogle();
      if (!user) {
        // User closed or dismissed the popup
        setErrorMessage(
          'Google sign-in window was closed. Click "Continue with Google Account" to try again, or enter your Google email below.'
        );
        setShowEmailField(true);
        return;
      }
      onSuccessLogin(user);
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        setErrorMessage(
          'Your browser blocked the popup. Please allow popups or enter your Google email below.'
        );
        setShowEmailField(true);
      } else if (err?.code === 'auth/network-request-failed') {
        setErrorMessage('Network error. Please check your internet connection and try again.');
      } else {
        setErrorMessage(
          err?.message || 'Unable to complete sign-in. You can enter your Google email below.'
        );
        setShowEmailField(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Direct Access handler:
  // ONLY accounts whose Google email is suarezjohnjoebert@gmail.com or suarezjohnjoebertcpa@gmail.com
  // are permitted. Any other Google account will trigger the notification saying:
  // "You have no direct access to the website"
  const handleDirectAccessSignIn = async (targetAccountHint?: string) => {
    setDirectAccessLoading(true);
    setErrorMessage(null);
    setDirectAccessNotice(null);

    try {
      const user = await signInWithGoogle();
      if (!user) {
        // User dismissed the popup
        return;
      }

      const email = (user.email || '').toLowerCase().trim();
      const isAuthorizedDirect = checkIsAdmin(email);

      if (isAuthorizedDirect) {
        // Authorized owner/admin account: grant direct instant access
        onSuccessLogin({
          email: user.email,
          displayName:
            user.displayName ||
            (email.includes('cpa') ? 'John Joebert Suarez, CPA (Admin)' : 'John Joebert Suarez (Owner & Admin)'),
          photoURL: user.photoURL,
        });
      } else {
        // Unauthorized Google account attempted direct access:
        // Immediately terminate session and display the denial notification
        await logOut();
        setDirectAccessNotice({
          showModal: true,
          email: user.email || 'This Google Account',
          message: 'You have no direct access to the website',
        });
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        // Dismissed popup
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setErrorMessage(
          'Your browser blocked the popup window. Please allow popups to verify your Google account for direct access.'
        );
      } else {
        setErrorMessage(
          err?.message || 'Unable to authenticate with Google. Please try again.'
        );
      }
    } finally {
      setDirectAccessLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid Google account email address.');
      return;
    }

    setErrorMessage(null);

    // If an administrator email is entered, verify Google account authentication directly
    if (checkIsAdmin(cleanEmail)) {
      await handleDirectAccessSignIn(cleanEmail);
      return;
    }

    // Standard non-admin Google user request
    onSuccessLogin({
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      photoURL: null,
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-lg flex items-center justify-center">
            <img src="/icon.svg" alt="Logo" className="w-full h-full rounded-[10px]" />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block">
              NoBS<span className="text-indigo-400">Feasibility</span>
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Professional Financial Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onStartDemo && (
            <button
              type="button"
              onClick={onStartDemo}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/60 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Explore Demo Guest Profile (No owner approval needed)"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-200" />
              <span>Demo Guest Profile</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowInstallWarning(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Install / Download App</span>
          </button>
        </div>
      </header>

      {/* Inactivity Logout Notice */}
      {inactivityNotice && (
        <div className="w-full max-w-2xl mx-auto px-4 z-20 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-3.5 rounded-2xl bg-amber-950/90 border border-amber-600/80 text-amber-200 text-xs font-medium flex items-center gap-3 shadow-xl">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-amber-100">Session Expired (3 Hours of Inactivity):</span>{' '}
              For your data protection, the website automatically logged out. Please sign in with your Google account to resume your work.
            </div>
          </div>
        </div>
      )}

      {/* Main Hero & Sign-in Gate */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 z-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Product Value Highlights */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Owner Approval Required &bull; Protected Access</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Build rigorous, bank-ready{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400">
                feasibility studies
              </span>{' '}
              without the spreadsheet chaos.
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
              Automatic 5-year Income Statements, Balance Sheets, Cash Flows, Working Capital,
              Break-Even Points, and NPV/IRR evaluations with 1-page A4 landscape PDF reporting.
            </p>

            {/* Feature Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200">5-Year Financial Statements</h3>
                  <p className="text-[11px] text-slate-400">Clean, interconnected GAAP statements.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Financial Ratios &amp; Verdict</h3>
                  <p className="text-[11px] text-slate-400">ROI, Payback, NPV, IRR &amp; Solvency.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Manufacturing Costing</h3>
                  <p className="text-[11px] text-slate-400">BOM, direct labor, and factory overhead.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <TrendingUp className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200">1-Page A4 PDF Downloads</h3>
                  <p className="text-[11px] text-slate-400">Highlightable text &amp; single-page layout.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Google Login Box */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 relative backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-700/40 flex items-center justify-center mb-5 text-indigo-400">
                <Lock className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold text-white mb-1.5">Sign In to Continue</h2>
              <p className="text-xs text-slate-400 mb-5">
                Please log in with your Google account. Access and installation are granted upon administrator approval.
              </p>

              {/* Instant Demo Access (Pre-existing data, read-only) */}
              {onStartDemo && (
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-emerald-950/70 border-2 border-indigo-500/70 shadow-xl shadow-indigo-950/40 relative overflow-hidden group">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Demo Guest Profile
                    </span>
                    <span className="text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/50 px-2 py-0.5 rounded-full">
                      No Owner Approval Needed
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onStartDemo}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    <Eye className="w-4 h-4 text-slate-950" />
                    <span>Enter as Demo Guest</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-0.5">
                    <span className="text-emerald-400 font-medium">Instant demo access</span>
                    <span className="text-slate-400 font-medium">No sign in or owner approval required</span>
                  </div>
                </div>
              )}

              <div className="relative flex py-1 items-center mb-4">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">or sign in with google</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Direct Access Denied Notification Banner */}
              {directAccessNotice && (
                <div className="mb-5 p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-600/90 text-rose-100 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-900 border border-rose-500/60 flex items-center justify-center shrink-0 mt-0.5 text-rose-300">
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-rose-200 tracking-tight flex items-center justify-between">
                        <span>You have no direct access to the website</span>
                        <button
                          type="button"
                          onClick={() => setDirectAccessNotice(null)}
                          className="text-rose-400 hover:text-rose-200 transition p-0.5 rounded cursor-pointer"
                          title="Dismiss notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-rose-200/90 mt-1.5 leading-relaxed">
                        The Google account <span className="font-mono font-semibold text-white px-1.5 py-0.5 rounded bg-rose-900/60 border border-rose-700/60 break-all">{directAccessNotice.email}</span> does not have direct access permissions. Direct access is strictly reserved for:
                      </p>
                      <ul className="text-xs text-rose-300 list-disc list-inside mt-1.5 space-y-0.5 font-medium">
                        <li>suarezjohnjoebert@gmail.com</li>
                        <li>suarezjohnjoebertcpa@gmail.com</li>
                      </ul>
                      <div className="mt-3 pt-2.5 border-t border-rose-800/80 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDirectAccessNotice(null);
                            handleDirectAccessSignIn();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow-xs transition cursor-pointer"
                        >
                          Switch Google Account
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDirectAccessNotice(null);
                            handleGoogleSignIn();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition cursor-pointer"
                        >
                          Submit Access Request
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert if any */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || directAccessLoading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{loading ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
              </button>

              {/* Dedicated Direct Admin / Owner Access Portal */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Website Owner &amp; Admin Access
                  </span>
                  <span className="text-[9px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-1.5 py-0.5 rounded">
                    Admin Google Required
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDirectAccessSignIn('suarezjohnjoebert@gmail.com')}
                  disabled={loading || directAccessLoading}
                  className="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 hover:from-indigo-900 hover:to-indigo-900 border-2 border-indigo-500/70 hover:border-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Direct Entry for Authorized Google Accounts (suarezjohnjoebert@gmail.com / suarezjohnjoebertcpa@gmail.com)"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
                      {directAccessLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-white font-bold text-xs group-hover:text-indigo-200 transition-colors">
                        Direct Admin &amp; Owner Access
                      </span>
                      {directAccessLoading && (
                        <span className="block text-[10px] text-indigo-300/90 font-medium">
                          Verifying Google Account...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-300 group-hover:text-white transition-colors shrink-0">
                    <span className="text-[10px] font-bold hidden xs:inline">Enter</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                <div className="flex items-center justify-end gap-2 mt-2 px-1">
                  <button
                    type="button"
                    onClick={() => handleDirectAccessSignIn('suarezjohnjoebertcpa@gmail.com')}
                    disabled={loading || directAccessLoading}
                    className="text-[10px] text-indigo-400 hover:text-indigo-200 underline cursor-pointer disabled:opacity-50"
                  >
                    Secondary CPA Access
                  </button>
                </div>
              </div>

              {/* Alternative Google Account Email Input */}
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                {!showEmailField ? (
                  <button
                    type="button"
                    onClick={() => setShowEmailField(true)}
                    className="w-full text-center text-xs text-slate-400 hover:text-indigo-300 transition py-1 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Having trouble with popups? Enter Google Email</span>
                  </button>
                ) : (
                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-300">
                      Enter your Google Account Email:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition cursor-pointer shrink-0"
                      >
                        Enter
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      If your account is already approved, you will enter instantly. Otherwise, John Joebert Suarez will be notified for approval.
                    </p>
                  </form>
                )}
              </div>


            </div>
          </div>
        </div>
      </main>

      {/* Modal notification for unauthorized direct access */}
      {directAccessNotice?.showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-rose-600/90 rounded-3xl max-w-md w-full p-6 sm:p-7 text-center space-y-4 shadow-2xl shadow-rose-950/50 animate-in zoom-in-95 duration-200 relative">
            <button
              type="button"
              onClick={() =>
                setDirectAccessNotice((prev) => (prev ? { ...prev, showModal: false } : null))
              }
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-rose-950/90 border border-rose-600/60 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-7 h-7 text-rose-400" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
                Direct Access Restricted
              </span>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                You have no direct access to the website
              </h3>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-2 text-left leading-relaxed">
              <p>
                You attempted direct access with Google account:{' '}
                <span className="font-mono text-white font-semibold break-all">
                  {directAccessNotice.email}
                </span>
              </p>
              <p className="text-slate-400">
                Direct access is only permitted for users whose Google account is one of these two:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 font-mono text-[11px] text-indigo-300 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="text-emerald-300 font-semibold">suarezjohnjoebert@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="text-emerald-300 font-semibold">suarezjohnjoebertcpa@gmail.com</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                If you are a student, researcher, or team member, please use the standard Google sign-in to submit an access request to John Joebert Suarez, CPA.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDirectAccessNotice(null);
                  handleDirectAccessSignIn();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Switch to Authorized Google Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDirectAccessNotice(null);
                  handleGoogleSignIn();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
              >
                Continue with Standard Google Sign-In
              </button>

              <button
                type="button"
                onClick={() =>
                  setDirectAccessNotice((prev) => (prev ? { ...prev, showModal: false } : null))
                }
                className="w-full py-1.5 text-slate-400 hover:text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-login Install Attempt Warning Modal */}
      {showInstallWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-600/50 text-amber-400 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Google Account Required to Install</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Before you can install or download the website to your phone or computer, you must first sign in with your Google account and receive approval from the administrator.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowInstallWarning(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
              >
                Sign In with Google First
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-900 z-10 gap-2">
        <p>&copy; 2026 NoBSFeasibility. All financial formulas comply with standard GAAP / PFRS methodology.</p>
        <p className="flex items-center gap-2">
          <span>Manufacturing Industry Profile</span>
          <span>&bull;</span>
          <span>5-Year Forecast</span>
        </p>
      </footer>
    </div>
  );
}
