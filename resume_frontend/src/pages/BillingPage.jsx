import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FaCrown, FaCheck, FaChartBar, FaFileAlt, FaMagic, FaDownload, FaRocket } from "react-icons/fa";
import UpgradeModal from "../components/UpgradeModal";

const LimitProgress = ({ title, icon: Icon, current, max, colorClass }) => {
  const pct = max === "Unlimited" ? 100 : Math.min(100, Math.round((current / max) * 100));
  const isLimitReached = max !== "Unlimited" && current >= max;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl ${isLimitReached ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'}`}>
              <Icon size={18} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{title}</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {current} / {max}
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${colorClass}`}
            style={{ width: `${pct}%` }} 
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {max === "Unlimited" 
            ? "No restrictions applied" 
            : isLimitReached 
              ? "Limit reached! Upgrade to unlock." 
              : `${max - current} remaining`}
        </span>
        {isLimitReached && (
          <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">
            LOCKED
          </span>
        )}
      </div>
    </div>
  );
};

const BillingPage = () => {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isPro = user?.isPro || user?.role === "ROLE_PRO";

  // Limits config
  const scanLimit = isPro ? "Unlimited" : 2;
  const resumeLimit = isPro ? "Unlimited" : 1;
  const enhanceLimit = isPro ? "Unlimited" : 2;
  const exportLimit = isPro ? "Unlimited" : 2;

  // We read counts from user state
  const scanCount = user?.scanCount || 0;
  const enhanceCount = user?.enhanceCount || 0;
  const exportCount = user?.exportCount || 0;
  // Fallback for resumes count since it requires API, but we can default or show status
  // We will assume 1 if they have resumes or 0 if they don't, or let the user view dashboard for resume count
  // In dynamic dashboard we know resumes.length, here we'll represent general status
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Upgrade Modal */}
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

        {/* Page Header */}
        <div className="mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Plans & Limits
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Monitor your SaaS quotas and upgrade subscription status.
          </p>
        </div>

        {/* Subscription Info Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-8 shadow-card mb-10 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Current Plan
              </span>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                  {isPro ? "CareerDraft Pro" : "Free Plan"}
                </h2>
                {isPro ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900 animate-pulse">
                    <FaCrown size={11} /> Pro Tier
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-850 dark:text-slate-400 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-850">
                    Basic Tier
                  </span>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 max-w-lg">
                {isPro 
                  ? "Thank you for upgrading! You have unlimited access to ATS analyzer scans, AI suggestions, custom layout versions, and PDF exports."
                  : "You are currently on the freemium basic plan. Review your quota metrics below or upgrade to access unrestricted tools."}
              </p>
            </div>

            {!isPro && (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="btn-brand flex items-center gap-2 font-bold px-6 py-3 shrink-0"
              >
                <FaCrown /> Upgrade to Pro — ₹49
              </button>
            )}
          </div>
        </div>

        {/* Limits Grid */}
        <h3 className="text-xl font-extrabold text-slate-850 dark:text-slate-200 mb-6 flex items-center gap-2">
          <FaChartBar className="text-indigo-500" /> Quota Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <LimitProgress 
            title="ATS Analyzer Scans"
            icon={FaChartBar}
            current={scanCount}
            max={scanLimit}
            colorClass="bg-gradient-to-r from-blue-500 to-indigo-500"
          />

          <LimitProgress 
            title="AI Expert Enhancements"
            icon={FaMagic}
            current={enhanceCount}
            max={enhanceLimit}
            colorClass="bg-gradient-to-r from-indigo-500 to-purple-500"
          />

          <LimitProgress 
            title="Resume Exports"
            icon={FaDownload}
            current={exportCount}
            max={exportLimit}
            colorClass="bg-gradient-to-r from-purple-500 to-pink-500"
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400">
                    <FaFileAlt size={18} />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Resume Management</h3>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {isPro ? "Unlimited" : "1 Active Draft"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isPro 
                  ? "Create and manage as many resumes and layout structures as you need."
                  : "Limited to 1 active resume draft. Free version snapshots are available."}
              </p>
            </div>
            <div className="mt-3 border-t border-slate-50 dark:border-slate-850 pt-3">
              <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                {isPro ? "All slots unlocked" : "Upgrade to save multiple drafts"}
              </span>
            </div>
          </div>
        </div>

        {/* Plan Comparisons */}
        {!isPro && (
          <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/25 border border-indigo-150/40 dark:border-indigo-900/40 rounded-3xl p-8 shadow-card flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="space-y-4">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FaRocket className="text-amber-500 animate-bounce" /> Supercharge Your Job Search
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <FaCheck className="text-emerald-500 shrink-0" />
                  <strong>Unlimited Scans:</strong> Continuous matching optimization against multiple JDs.
                </li>
                <li className="flex items-center gap-2">
                  <FaCheck className="text-emerald-500 shrink-0" />
                  <strong>AI Expert Assistant:</strong> Rewritten resume summary paragraphs & customized bullets.
                </li>
                <li className="flex items-center gap-2">
                  <FaCheck className="text-emerald-500 shrink-0" />
                  <strong>Git-Style Version Control:</strong> Snapshots history to compare layout enhancements.
                </li>
              </ul>
            </div>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="btn-brand font-bold py-3.5 px-8 flex items-center gap-2 text-base shadow-brand shrink-0"
            >
              <FaCrown /> Get Pro Access
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BillingPage;
