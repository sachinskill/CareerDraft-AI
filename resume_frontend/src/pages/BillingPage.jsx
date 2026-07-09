import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FaCrown, FaCheck, FaChartBar, FaFileAlt, FaMagic, FaDownload, FaRocket } from "react-icons/fa";
import UpgradeModal from "../components/UpgradeModal";

const LimitProgress = ({ title, icon: Icon, current, max, colorClass }) => {
  const pct = max === "Unlimited" ? 100 : Math.min(100, Math.round((current / max) * 100));
  const isLimitReached = max !== "Unlimited" && current >= max;

  return (
    <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none flex flex-col justify-between text-left font-sans">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-[8px] ${isLimitReached ? 'bg-[#E85D4E]/10 text-[#E85D4E]' : 'bg-[#1B2A4A]/10 text-[#1B2A4A]'}`}>
              <Icon size={18} />
            </div>
            <h3 className="font-semibold text-[#1B2A4A] font-space text-sm">{title}</h3>
          </div>
          <span className="text-xs font-semibold text-[#5A5347]">
            {current} / {max}
          </span>
        </div>

        <div className="w-full bg-[#F4F0E8] rounded-full h-2 mb-2">
          <div 
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: isLimitReached ? '#E85D4E' : colorClass }} 
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#5A5347]">
          {max === "Unlimited" 
            ? "No restrictions applied" 
            : isLimitReached 
              ? "Limit reached! Upgrade to unlock." 
              : `${max - current} remaining`}
        </span>
        {isLimitReached && (
          <span className="text-[10px] font-bold text-[#E85D4E] bg-[#E85D4E]/10 px-2 py-0.5 rounded border border-[#E85D4E]/20">
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
  
  return (
    <div className="min-h-screen bg-[#F4F0E8] transition-colors duration-200 text-left font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Upgrade Modal */}
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

        {/* Page Header */}
        <div className="mb-10 pb-6 border-b border-[#DDD5C4]">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1B2A4A] font-space tracking-tight">
            Plans & Limits
          </h1>
          <p className="text-[#5A5347] mt-2 text-sm">
            Monitor your quota status metrics and unlock professional upgrades.
          </p>
        </div>

        {/* Subscription Info Card */}
        <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-8 shadow-none mb-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <span className="text-xs font-bold text-[#5A5347] uppercase tracking-widest block mb-1">
                Current Plan
              </span>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#1B2A4A] font-space">
                  {isPro ? "CareerDraft Pro" : "Free Plan"}
                </h2>
                {isPro ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#DB9A3C] bg-[#DB9A3C]/10 px-3 py-1 rounded-full border border-[#DB9A3C]/20 animate-pulse font-sans">
                    <FaCrown size={11} /> Pro Tier
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5A5347] bg-[#F4F0E8] px-3 py-1 rounded-full border border-[#DDD5C4] font-sans">
                    Basic Tier
                  </span>
                )}
              </div>
              <p className="text-[#5A5347] text-sm mt-3 max-w-lg leading-relaxed">
                {isPro 
                  ? "Thank you for upgrading! You have unlimited access to ATS analyzer scans, AI suggestions, custom layout versions, and PDF exports."
                  : "You are currently on the freemium basic plan. Review your quota metrics below or upgrade to access unrestricted tools."}
              </p>
            </div>

            {!isPro && (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] px-6 py-3.5 transition-all font-sans border-0 flex items-center gap-2 shrink-0 shadow-none"
              >
                <FaCrown /> Upgrade to Pro — ₹49
              </button>
            )}
          </div>
        </div>

        {/* Limits Grid */}
        <h3 className="text-lg font-semibold text-[#1B2A4A] font-space mb-6 flex items-center gap-2">
          <FaChartBar className="text-[#1B2A4A]" /> Quota Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <LimitProgress 
            title="ATS Analyzer Scans"
            icon={FaChartBar}
            current={scanCount}
            max={scanLimit}
            colorClass="#1B2A4A"
          />

          <LimitProgress 
            title="AI Expert Enhancements"
            icon={FaMagic}
            current={enhanceCount}
            max={enhanceLimit}
            colorClass="#DB9A3C"
          />

          <LimitProgress 
            title="Resume Exports"
            icon={FaDownload}
            current={exportCount}
            max={exportLimit}
            colorClass="#1B2A4A"
          />

          <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-[8px] bg-[#1B2A4A]/10 text-[#1B2A4A]">
                    <FaFileAlt size={18} />
                  </div>
                  <h3 className="font-semibold text-[#1B2A4A] font-space text-sm">Resume Management</h3>
                </div>
                <span className="text-xs font-semibold text-[#5A5347]">
                  {isPro ? "Unlimited" : "1 Active Draft"}
                </span>
              </div>
              <p className="text-xs text-[#5A5347] font-sans leading-relaxed">
                {isPro 
                  ? "Create and manage as many resumes and layout structures as you need."
                  : "Limited to 1 active resume draft. Free version snapshots are available."}
              </p>
            </div>
            <div className="mt-3 border-t border-[#DDD5C4] pt-3 font-sans">
              <span className="text-[11px] font-semibold text-[#DB9A3C]">
                {isPro ? "All slots unlocked" : "Upgrade to save multiple drafts"}
              </span>
            </div>
          </div>
        </div>

        {/* Plan Comparisons */}
        {!isPro && (
          <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-8 shadow-none flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="space-y-4">
              <h4 className="text-xl font-semibold text-[#1B2A4A] font-space flex items-center gap-2">
                <FaRocket className="text-[#DB9A3C] animate-bounce" /> Supercharge Your Job Search
              </h4>
              <ul className="space-y-2.5 text-sm text-[#5A5347] font-sans">
                <li className="flex items-center gap-2">
                  <FaCheck className="text-[#3F9F6B] shrink-0" />
                  <span><strong>Unlimited Scans:</strong> Continuous matching optimization against multiple JDs.</span>
                </li>
                <li className="flex items-center gap-2">
                  <FaCheck className="text-[#3F9F6B] shrink-0" />
                  <span><strong>AI Expert Assistant:</strong> Rewritten resume summary paragraphs & customized bullets.</span>
                </li>
                <li className="flex items-center gap-2">
                  <FaCheck className="text-[#3F9F6B] shrink-0" />
                  <span><strong>Git-Style Version Control:</strong> Snapshots history to compare layout enhancements.</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] px-6 py-3.5 transition-all font-sans border-0 flex items-center gap-2 shrink-0 shadow-none"
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
