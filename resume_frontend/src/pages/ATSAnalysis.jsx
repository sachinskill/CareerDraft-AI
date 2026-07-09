import { useState, useRef, useEffect } from "react";
import {
  FaUpload, FaFileAlt, FaTrash, FaChartLine, FaBrain,
  FaExclamationTriangle, FaTools, FaCrown, FaTimes,
  FaCheckCircle, FaLightbulb, FaFire, FaPen, FaShieldAlt,
  FaTachometerAlt, FaArrowUp, FaBolt,
} from "react-icons/fa";
import { BiCloudUpload } from "react-icons/bi";
import toast from "react-hot-toast";
import { uploadResumeForATS, createPaymentOrder, verifyPayment, parseResumeText } from "../api/ResumeService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UpgradeModal from "../components/UpgradeModal";

// ── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = (s) => s >= 80 ? "#3F9F6B" : s >= 60 ? "#DB9A3C" : "#E85D4E";
const scoreBadgeStyle = (s) => {
  if (s >= 80) return "bg-[#3F9F6B]/10 text-[#3F9F6B] border border-[#3F9F6B]/20";
  if (s >= 60) return "bg-[#DB9A3C]/10 text-[#c4862f] border border-[#DB9A3C]/20";
  return "bg-[#E85D4E]/10 text-[#E85D4E] border border-[#E85D4E]/20";
};

const CardCorners = () => (
  <>
    <div className="absolute -top-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -top-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -bottom-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -bottom-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
  </>
);

const ScoreBar = ({ label, icon, value, max, reason }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = pct >= 70 ? "#3F9F6B" : pct >= 45 ? "#DB9A3C" : "#E85D4E";
  return (
    <div className="mb-4 text-left">
      <div className="flex justify-between mb-1 text-sm font-sans">
        <span className="font-medium text-[#1B2A4A]">{icon} {label}</span>
        <span className="font-mono-score font-bold text-[#1B2A4A]">{value}<span className="text-[#5A5347]/60">/{max}</span></span>
      </div>
      <div className="w-full bg-[#F4F0E8] rounded-full h-2 mb-1">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {reason && <p className="text-xs text-[#5A5347] mt-1 font-sans leading-normal">{reason}</p>}
    </div>
  );
};

const GuestAuthPrompt = () => {
  const { login, register, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    const fn = mode === "login" ? login : register;
    const result = await fn(email, password);
    if (result.success) {
      toast.success(mode === "login" ? "Welcome back!" : "Account created successfully!");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="w-full text-left font-sans">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-xs font-semibold text-[#1B2A4A] font-sans">Email Address</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-2.5 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] font-sans"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-semibold text-[#1B2A4A] font-sans">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-2.5 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] font-sans"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#DB9A3C] hover:bg-[#c4862f] text-[#1B2A4A] font-semibold text-sm rounded-[8px] py-3 transition-all font-sans border-0 flex items-center justify-center gap-2 mt-2 cursor-pointer"
        >
          {isLoading && <span className="loading loading-spinner loading-sm" />}
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-[#DDD5C4]" />
        <span className="text-xs text-[#5A5347] uppercase font-semibold">or</span>
        <div className="flex-1 h-px bg-[#DDD5C4]" />
      </div>
      <p className="text-center text-sm text-[#5A5347] font-sans">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          className="text-[#DB9A3C] font-bold hover:underline bg-transparent border-0 cursor-pointer"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
};

const SkeletonLoader = () => {
  return (
    <div className="space-y-8 animate-pulse mt-6 text-left">
      <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#DDD5C4]">
          <div className="h-6 w-48 bg-[#F4F0E8] rounded"></div>
          <div className="h-5 w-24 bg-[#F4F0E8] rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px]">
            <div className="w-32 h-32 rounded-full border-[9px] border-[#F4F0E8] flex items-center justify-center">
              <div className="w-16 h-8 bg-[#F4F0E8] rounded"></div>
            </div>
            <div className="h-4 w-20 bg-[#F4F0E8] rounded mt-4"></div>
            <div className="h-3 w-32 bg-[#F4F0E8] rounded mt-2"></div>
          </div>
          <div className="space-y-4 flex flex-col justify-between">
            <div className="p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px] flex-1 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-[#F4F0E8] rounded"></div>
                <div className="h-4 w-20 bg-[#F4F0E8] rounded-full"></div>
              </div>
              <div className="h-4 w-28 bg-[#F4F0E8] rounded"></div>
              <div className="h-3 w-full bg-[#F4F0E8] rounded"></div>
            </div>
            <div className="p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px] flex-1 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-[#F4F0E8] rounded"></div>
                <div className="h-4 w-20 bg-[#F4F0E8] rounded-full"></div>
              </div>
              <div className="h-4 w-24 bg-[#F4F0E8] rounded"></div>
              <div className="h-3 w-full bg-[#F4F0E8] rounded"></div>
            </div>
          </div>
          <div className="space-y-4 flex flex-col justify-between">
            <div className="p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px] flex-1 space-y-3">
              <div className="h-3 w-24 bg-[#F4F0E8] rounded"></div>
              <div className="h-8 w-16 bg-[#F4F0E8] rounded"></div>
              <div className="h-3 w-full bg-[#F4F0E8] rounded"></div>
            </div>
            <div className="p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px] flex-1 space-y-3">
              <div className="h-3 w-28 bg-[#F4F0E8] rounded"></div>
              <div className="h-2 w-full bg-[#F4F0E8] rounded mt-1"></div>
              <div className="h-3 w-32 bg-[#F4F0E8] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingProgress = ({ stages, activeIndex }) => {
  return (
    <div className="bg-[#FDFBF7] border border-[#DDD5C4] shadow-none p-6 rounded-[12px] max-w-md mx-auto relative overflow-hidden mt-6 animate-fadeIn text-left font-sans">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-[8px] bg-[#F4F0E8] border border-[#DDD5C4] text-[#1B2A4A] flex items-center justify-center mb-3">
          <FaBrain className="text-xl animate-bounce text-[#1B2A4A]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1B2A4A] font-space">Analyzing Your Resume</h3>
        <p className="text-xs text-[#5A5347] mt-0.5">Please wait while our algorithms process your data...</p>
      </div>
      <div className="space-y-3.5">
        {stages.map((stage, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <div key={i} className={`flex items-center gap-3 text-xs transition-all duration-300 ${isDone ? "text-[#1B2A4A] font-medium" : isActive ? "text-[#DB9A3C] font-bold scale-[1.01]" : "text-[#5A5347] opacity-60"}`}>
              <div className="flex items-center justify-center shrink-0">
                {isDone ? (
                  <FaCheckCircle className="text-[#3F9F6B] text-sm animate-fadeIn" />
                ) : isActive ? (
                  <div className="w-4 h-4 border-2 border-[#DB9A3C] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-[#DDD5C4]" />
                )}
              </div>
              <span className={isActive ? "animate-pulse" : ""}>{stage}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ATSAnalysis = () => {
  const navigate = useNavigate();
  const { user, login, register, refreshUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [includeAiFeedback, setIncludeAiFeedback] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showLoadingStages, setShowLoadingStages] = useState(false);
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [remainingScans, setRemainingScans] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const fileInputRef = useRef(null);

  // Pre-auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [triggerAnalysisAfterAuth, setTriggerAnalysisAfterAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Auto-run scan when authentication is completed successfully
  useEffect(() => {
    if (user && triggerAnalysisAfterAuth) {
      setTriggerAnalysisAfterAuth(false);
      setShowAuthModal(false);
      setTimeout(() => {
        handleAnalyze();
      }, 200);
    }
  }, [user, triggerAnalysisAfterAuth]);

  const validateFile = (file) => {
    const ok = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!ok.includes(file.type)) { toast.error("PDF or DOCX only"); return false; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 MB"); return false; }
    return true;
  };
  const handleFileSelect = (f) => { if (validateFile(f)) { setSelectedFile(f); setAtsResult(null); } };
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]); };
  const clearFile = () => { setSelectedFile(null); setAtsResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const fmt = (b) => { if (!b) return '0 B'; const k=1024,s=['B','KB','MB','GB'],i=Math.floor(Math.log(b)/Math.log(k)); return parseFloat((b/Math.pow(k,i)).toFixed(1))+' '+s[i]; };

  const handleAnalyze = async () => {
    if (!selectedFile) { toast.error("Please select a resume file"); return; }
    if (!jobDescription.trim()) { toast.error("Please enter a job description"); return; }
    
    // Intercept if not logged in
    if (!user) {
      setTriggerAnalysisAfterAuth(true);
      setShowAuthModal(true);
      return;
    }

    // Proactively check limits for logged in free users
    const isPro = user.isPro || user.role === "ROLE_PRO";
    if (!isPro && user.scanCount >= 2) {
      setShowUpgradeModal(true);
      return;
    }

    const STAGES = [
      "Parsing Resume",
      "Extracting Keywords",
      "Matching Against Job Description",
      "Calculating ATS Score",
      "Generating Recruiter Insights",
      "Preparing Optimization Plan"
    ];

    try {
      setIsAnalyzing(true);
      setShowLoadingStages(true);
      setActiveStageIdx(0);
      setAtsResult(null);

      // Increment active loader stage index every 900ms progressively
      const interval = setInterval(() => {
        setActiveStageIdx(prev => {
          if (prev < STAGES.length - 1) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 950);

      const result = await uploadResumeForATS(selectedFile, jobDescription, includeAiFeedback);
      
      clearInterval(interval);
      setActiveStageIdx(STAGES.length); // Mark all stages completed

      if (!result?.atsAnalysis) throw new Error("Invalid analysis result received");
      if (result.remainingScans != null) setRemainingScans(result.remainingScans);
      
      setTimeout(() => {
        setShowLoadingStages(false);
        toast.success("Analysis complete!");
        setAtsResult(result);
        refreshUser();
      }, 600);
      
    } catch (error) {
      setShowLoadingStages(false);
      const msg = error.response?.data?.error || error.message || "";
      if (msg.includes("Free limit") || msg.includes("Upgrade")) { setShowUpgradeModal(true); return; }
      toast.error(msg || "Failed to analyse resume. Please try again.");
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) { toast.error("Please fill in all fields"); return; }
    if (authPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    
    try {
      setIsAuthLoading(true);
      const fn = authMode === "login" ? login : register;
      const result = await fn(authEmail, authPassword);
      if (result.success) {
        toast.success(authMode === "login" ? "Welcome back!" : "Account created successfully!");
      } else {
        toast.error(result.error || "Authentication failed");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleFixResume = async () => {
    if (!atsResult?.extractedText) {
      toast.error("No resume text found to optimize.");
      return;
    }
    const a = atsResult.atsAnalysis;
    try {
      setIsTransitioning(true);
      const toastId = toast.loading("Analyzing and mapping your resume structure...");
      const structured = await parseResumeText(atsResult.extractedText);
      localStorage.setItem('atsContext', JSON.stringify({
        jobDescription,
        missingSkills: [...(a.missingCriticalSkills || []), ...(a.missingCoreSkills || [])],
        currentScore: a.atsScore,
        potentialScore: a.potentialScore || a.atsScore,
        structuredResume: structured,
        atsAnalysis: a,
      }));
      toast.success("Taking you to the ATS Optimization Workspace!", { id: toastId });
      navigate('/generate-resume');
    } catch (err) {
      toast.error("Failed to map resume structure: " + (err.response?.data?.error || err.message));
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleUpgradePayment = async () => {
    try {
      setIsProcessingPayment(true);
      if (!user) { toast.error("Please login to upgrade"); return; }
      const toastId = toast.loading("Preparing payment…");
      const orderData = await createPaymentOrder();
      toast.dismiss(toastId);
      const options = {
        key: orderData.keyId, amount: orderData.amount, currency: orderData.currency || "INR",
        name: "Resume AI Pro", description: "Lifetime Pro — Unlimited ATS Scans",
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const vid = toast.loading("Verifying payment…");
            const res = await verifyPayment({ razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature });
            toast.dismiss(vid);
            if (res.success) { toast.success("🎉 " + res.message); setShowUpgradeModal(false); setTimeout(() => window.location.reload(), 1500); }
            else toast.error("Payment verification failed.");
          } catch (e) { toast.error("Verification error: " + (e.response?.data?.error || e.message)); }
        },
        prefill: { name: "", email: user?.email || "", contact: "" },
        theme: { color: "#DB9A3C" },
        modal: { ondismiss: () => setIsProcessingPayment(false) },
      };
      new window.Razorpay(options).open();
    } catch (e) { toast.error(e.response?.data?.error || e.message || "Payment failed"); }
    finally { setIsProcessingPayment(false); }
  };

  const rawA = atsResult?.atsAnalysis;
  const isPro = user?.isPro || user?.role === "ROLE_PRO";
  const a = rawA;

  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    if (a?.atsScore != null) {
      let start = 0;
      const end = a.atsScore;
      if (start === end) {
        setAnimatedScore(end);
        return;
      }
      const duration = 1200; // ms
      let startTime = null;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const progressPercentage = Math.min(progress / duration, 1);
        const easeProgress = progressPercentage * (2 - progressPercentage); // easeOutQuad
        const current = Math.floor(easeProgress * end);
        setAnimatedScore(current);
        if (progress < duration) {
          requestAnimationFrame(animate);
        } else {
          setAnimatedScore(end);
        }
      };
      requestAnimationFrame(animate);
    } else {
      setAnimatedScore(0);
    }
  }, [a?.atsScore]);

  // Extract skills and calculate locked/visible items
  const matchedKeywords = a?.matchedKeywords || [];
  const missingKeywords = a?.missingKeywords || a?.categorizedMissingSkills || [];
  const improvements = a?.improvements || [];

  const visibleStrongSkills = isPro ? matchedKeywords : matchedKeywords.slice(0, 2);
  const lockedStrongCount = isPro ? 0 : Math.max(0, matchedKeywords.length - 2);

  const visibleMissingSkills = isPro ? missingKeywords : missingKeywords.slice(0, 2);
  const lockedMissingCount = isPro ? 0 : Math.max(0, missingKeywords.length - 2);

  const visibleImprovements = isPro ? improvements : improvements.slice(0, 2);

  // Visual meters logic based on score
  const getInterviewChance = (score) => {
    if (score >= 80) return { label: "Excellent Chance", pct: 85, colorClass: "text-[#3F9F6B] bg-[#3F9F6B]/10 border-[#3F9F6B]/20", desc: "Your resume matches the core requirements. Highly likely to get selected." };
    if (score >= 60) return { label: "Average Likelihood", pct: 50, colorClass: "text-[#DB9A3C] bg-[#DB9A3C]/10 border-[#DB9A3C]/20", desc: "Moderate fit. Aligning missing critical keywords will unlock top screening chances." };
    return { label: "Low Match Rate", pct: 15, colorClass: "text-[#E85D4E] bg-[#E85D4E]/10 border-[#E85D4E]/20", desc: "Your resume is missing several high-priority skills recruiters are actively filtering for." };
  };

  const getAttentionMeter = (score) => {
    if (score >= 80) return { label: "Strong Retention", time: "6.8s", color: "bg-[#3F9F6B]", desc: "Strong impact metrics hook recruiter focus immediately." };
    if (score >= 60) return { label: "Moderate Retention", time: "4.2s", color: "bg-[#DB9A3C]", desc: "Vague action phrasing limits first-look readability." };
    return { label: "Critical Rejection Risk", time: "1.8s", color: "bg-[#E85D4E]", desc: "Your resume formatting may reduce recruiter engagement during the first 6-second scan." };
  };

  const chance = a ? getInterviewChance(a.atsScore) : null;
  const attention = a ? getAttentionMeter(a.atsScore) : null;

  return (
    <div className="container mx-auto p-6 max-w-6xl min-h-screen bg-transparent transition-colors duration-200">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-semibold mb-3 tracking-tight text-[#1B2A4A] font-space">
          ATS Resume Analyser
        </h1>
        <p className="text-[#5A5347] font-sans text-sm">
          Explainable 6-dimensional scoring — every score has a proven reason
        </p>
      </div>

      {/* Soft limit banner */}
      {remainingScans === 0 && !showUpgradeModal && user && !isPro && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-[#DB9A3C]/10 border border-[#DB9A3C]/25 border-l-[4px] border-l-[#DB9A3C] rounded-[8px] mb-6 shadow-none">
          <div className="flex items-start gap-3">
            <FaCrown className="text-2xl text-[#DB9A3C] shrink-0 mt-0.5" />
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-[#1B2A4A] font-space text-sm">Last Free Scan Used!</h3>
              <p className="text-xs text-[#5A5347] font-sans">Unlock unlimited ATS optimization for just ₹49 (one-time).</p>
            </div>
          </div>
          <button 
            onClick={() => setShowUpgradeModal(true)} 
            className="bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-xs rounded-[6px] px-4 py-2 transition-all font-sans border-0 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <FaCrown /> Upgrade to Pro
          </button>
        </div>
      )}

      {/* Upgrade modal */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* ━━━━━━━━━━━━━━━━━━ RESULTS / SKELETONS / FORM ━━━━━━━━━━━━━━━━━━ */}
      {showLoadingStages && (
        <div className="space-y-8 mt-6">
          <LoadingProgress stages={[
            "Parsing Resume",
            "Extracting Keywords",
            "Matching Against Job Description",
            "Calculating ATS Score",
            "Generating Recruiter Insights",
            "Preparing Optimization Plan"
          ]} activeIndex={activeStageIdx} />
          <SkeletonLoader />
        </div>
      )}

      {!a && !showLoadingStages && (
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Upload */}
          <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none text-left relative">
            <CardCorners />
            <h2 className="text-base font-semibold text-[#1B2A4A] font-space mb-4 flex items-center gap-2">
              <FaUpload className="text-[#1B2A4A]" /> Upload Your Resume
            </h2>
            <div className={`border-2 border-dashed rounded-[8px] p-8 text-center transition-all cursor-pointer ${dragActive ? "border-[#DB9A3C] bg-[#DB9A3C]/5" : "border-[#DDD5C4] hover:border-[#DB9A3C]/50"}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}>
              {selectedFile ? (
                <div className="flex items-center justify-center gap-4">
                  <FaFileAlt className="text-4xl text-[#DB9A3C]" />
                  <div className="text-left">
                    <p className="font-semibold text-[#1B2A4A] truncate max-w-xs font-sans">{selectedFile.name}</p>
                    <p className="text-xs text-[#5A5347] font-sans">{fmt(selectedFile.size)}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); clearFile(); }} className="text-[#E85D4E] hover:bg-[#E85D4E]/10 p-1.5 rounded-full transition-all border-0 bg-transparent cursor-pointer"><FaTrash size={14} /></button>
                </div>
              ) : (
                <div>
                  <BiCloudUpload className="text-5xl text-[#1B2A4A] mx-auto mb-4" />
                  <p className="text-[#1B2A4A] font-semibold mb-1 font-sans">Drag & drop or click to upload</p>
                  <p className="text-[#5A5347] text-xs mb-4 font-sans">PDF or DOCX, max 10 MB</p>
                  <button className="bg-[#DB9A3C] hover:bg-[#c4862f] text-[#1B2A4A] font-semibold text-xs rounded-[6px] px-5 py-2 transition-all font-sans border-0 cursor-pointer">Choose File</button>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
          </div>

          {/* Job description */}
          <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none text-left relative">
            <CardCorners />
            <h2 className="text-base font-semibold text-[#1B2A4A] font-space mb-4 flex items-center gap-2">
              <FaFileAlt className="text-[#1B2A4A]" /> Job Description
            </h2>
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-32 text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-3 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] font-sans resize-none"
              placeholder="Paste the target job description here. Include details about tech stack, requirements, and preferred qualifications…" />
            <div className="form-control mt-3">
              <label className="flex items-center justify-start gap-3 py-1 cursor-pointer">
                <input type="checkbox" checked={includeAiFeedback} onChange={(e) => setIncludeAiFeedback(e.target.checked)} className="checkbox accent-[#DB9A3C] checkbox-xs rounded border-[#DDD5C4]" />
                <span className="text-xs text-[#5A5347] flex items-center gap-1.5 font-sans"><FaBrain className="text-[#1B2A4A]" />Include AI-powered feedback & rewritten experience bullets</span>
              </label>
            </div>
          </div>

          {/* Action button */}
          <div className="text-center">
            <button onClick={handleAnalyze} disabled={isAnalyzing || !selectedFile || !jobDescription.trim()} className="bg-[#DB9A3C] hover:bg-[#c4862f] text-[#1B2A4A] font-semibold text-sm rounded-[8px] px-8 py-3.5 transition-all font-sans border-0 active:scale-95 flex items-center gap-2 justify-center mx-auto shadow-none cursor-pointer">
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-xs" />
                  Analyzing Resume…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FaChartLine /> Analyse Resume
                </span>
              )}
            </button>
          </div>

          {/* Trust Elements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none relative">
            <CardCorners />
            <div className="flex flex-col items-center p-2">
              <FaShieldAlt className="text-[#1B2A4A] mb-2 text-lg" />
              <h4 className="text-xs font-semibold text-[#1B2A4A] font-space mb-1">100% Privacy Encrypted</h4>
              <p className="text-[10px] text-[#5A5347] leading-relaxed font-sans">Your resume is parsed locally and never shared with third parties.</p>
            </div>
            <div className="flex flex-col items-center p-2 border-y sm:border-y-0 sm:border-x border-[#DDD5C4]">
              <FaTachometerAlt className="text-[#1B2A4A] mb-2 text-lg" />
              <h4 className="text-xs font-semibold text-[#1B2A4A] font-space mb-1">Deterministic Scoring</h4>
              <p className="text-[10px] text-[#5A5347] leading-relaxed font-sans">Powered by standardized ATS indexing rules — not random AI guesses.</p>
            </div>
            <div className="flex flex-col items-center p-2">
              <FaBolt className="text-[#1B2A4A] mb-2 text-lg" />
              <h4 className="text-xs font-semibold text-[#1B2A4A] font-space mb-1">The 6-Second Rule</h4>
              <p className="text-[10px] text-[#5A5347] leading-relaxed font-sans">Recruiters spend 6–8 seconds on first pass. We optimize for immediate visual retention.</p>
            </div>
          </div>

        </div>
      )}

      {a && !showLoadingStages && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* STEP 2 — FREE HOOK REPORT */}
          <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 relative overflow-hidden shadow-none mb-6 text-left animate-fadeIn">
            <CardCorners />
            <div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#DDD5C4]">
                <h2 className="text-lg font-semibold text-[#1B2A4A] font-space flex items-center gap-2">
                  <FaChartLine className="text-[#1B2A4A]" /> ATS Compatibility Scorecard
                </h2>
                {!isPro && (
                  <span className="text-[10px] font-bold text-[#1B2A4A] bg-[#F4F0E8] border border-[#DDD5C4] px-2.5 py-1 rounded-full uppercase tracking-wider font-sans">
                    Basic Preview
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Score Circle & Verdict */}
                <div className="flex flex-col items-center justify-center p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px] text-center">
                  <div className="relative w-32 h-32 animate-scaleIn">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="9" fill="transparent" className="text-[#F4F0E8]" />
                      <circle cx="64" cy="64" r="54" stroke={scoreColor(a.atsScore)} strokeWidth="9" fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - animatedScore / 100)}`}
                        strokeLinecap="round" className="transition-all duration-100 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold font-mono-score transition-all duration-300" style={{ color: scoreColor(a.atsScore) }}>{animatedScore}</span>
                      <span className="text-[10px] text-[#5A5347] uppercase tracking-widest mt-0.5 font-sans">Score</span>
                    </div>
                  </div>
                  <div className={`mt-4 px-3.5 py-1 text-xs font-semibold rounded-[4px] shadow-none ${scoreBadgeStyle(a.atsScore)}`}>
                    {a.atsVerdict || "Good Match"}
                  </div>
                  <p className="text-[11px] text-center text-[#5A5347] mt-3 max-w-[200px] leading-relaxed font-sans">
                    {a.verdictExplanation || "Solid resume base with targeted keyword improvement fields."}
                  </p>
                </div>

                {/* 2. Recruiter Attention & Interview Chance */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px] flex-1 flex flex-col justify-between transition-all duration-200">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-[#5A5347] uppercase tracking-wider font-sans">Interview Rate</span>
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                          a.atsScore >= 80 ? "bg-[#3F9F6B]/10 text-[#3F9F6B] border-[#3F9F6B]/20" : a.atsScore >= 60 ? "bg-[#DB9A3C]/10 text-[#c4862f] border-[#DB9A3C]/20" : "bg-[#E85D4E]/10 text-[#E85D4E] border-[#E85D4E]/20"
                        }`}>
                          {chance.label}
                        </span>
                      </div>
                      <div className="w-full bg-[#F4F0E8] border border-[#DDD5C4]/65 rounded-full h-2 mb-1.5 overflow-hidden">
                        <div className={`h-2 rounded-full ${a.atsScore >= 80 ? "bg-[#3F9F6B]" : a.atsScore >= 60 ? "bg-[#DB9A3C]" : "bg-[#E85D4E]"} transition-all duration-1000`} style={{ width: `${chance.pct}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-[#5A5347] leading-normal font-sans">
                      {chance.desc}
                    </p>
                  </div>

                  <div className="p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px] flex-1 flex flex-col justify-between transition-all duration-200">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-[#5A5347] uppercase tracking-wider font-sans">Recruiter Attention</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          a.atsScore >= 80 ? "bg-[#3F9F6B]/10 text-[#3F9F6B] border-[#3F9F6B]/20" : a.atsScore >= 60 ? "bg-[#DB9A3C]/10 text-[#c4862f] border-[#DB9A3C]/20" : "bg-[#E85D4E]/10 text-[#E85D4E] border-[#E85D4E]/20"
                        }`}>
                          {attention.time}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#1B2A4A] font-space mb-2">{attention.label}</h4>
                      
                      <div className="w-full bg-[#F4F0E8] rounded-full h-2 mb-2 relative overflow-hidden">
                        <div className={`h-full rounded-full ${a.atsScore >= 80 ? "bg-[#3F9F6B]" : a.atsScore >= 60 ? "bg-[#DB9A3C]" : "bg-[#E85D4E]"} transition-all duration-1000`}
                          style={{ width: a.atsScore >= 80 ? "90%" : a.atsScore >= 60 ? "55%" : "20%" }} />
                      </div>
                      <div className="flex justify-between text-[8px] text-[#5A5347] font-bold uppercase tracking-wider mb-2 font-mono-score">
                        <span>Risk (1.8s)</span>
                        <span>Average (4.2s)</span>
                        <span>Friendly (6.8s)</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#5A5347] mt-1 leading-normal font-sans">
                      {attention.desc}
                    </p>
                  </div>
                </div>

                {/* 3. Semantic similarity & Keywords Count */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px] flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#5A5347] uppercase tracking-wider block mb-1 font-sans">Semantic Similarity</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold font-mono-score text-[#1B2A4A]">
                          {a.semanticSimilarity ? Math.round(a.semanticSimilarity * 100) : Math.round(a.keywordMatchPercentage || 65)}%
                        </span>
                        <span className="text-[10px] text-[#5A5347] font-bold uppercase font-sans">alignment</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#5A5347] mt-1 leading-normal font-sans">
                      Measures contextual fit of responsibilities rather than simple keyword stuffing.
                    </p>
                  </div>

                  {/* Before vs After Slider Preview */}
                  <div className="p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px] flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#5A5347] uppercase tracking-wider block mb-2 font-sans">Improvement potential</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-[#E85D4E] font-mono-score">{a.atsScore}</span>
                        <div className="flex-1 bg-[#F4F0E8] h-1.5 rounded-full overflow-hidden relative">
                          <div className={`absolute left-0 top-0 h-full ${
                            (a.potentialScore || a.atsScore) >= 85 ? "bg-[#3F9F6B]" : (a.potentialScore || a.atsScore) >= 60 ? "bg-[#DB9A3C]" : "bg-[#E85D4E]"
                          }`} style={{ width: `${a.potentialScore || a.atsScore}%` }} />
                        </div>
                        <span className="text-xs font-bold text-[#3F9F6B] font-mono-score">{a.potentialScore || a.atsScore}</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-semibold text-[#3F9F6B] mt-1 font-sans">
                      Gain +{a.potentialImprovement || 0} pts with optimization suggestions
                    </div>
                  </div>
                </div>

              </div>

              {/* Skills snapshots & Preview Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-[#DDD5C4]">
                {/* 2 Matched Skills */}
                <div className="p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px]">
                  <span className="text-[10px] font-bold text-[#5A5347] uppercase tracking-wider block mb-2 font-sans">Strong Matched Skills (2 Visible)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleStrongSkills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-[4px] text-[11px] font-medium bg-[#3F9F6B]/10 text-[#2e7d51] border border-[#3F9F6B]/20 font-sans">{s}</span>
                    ))}
                    {lockedStrongCount > 0 && (
                      <span className="px-2.5 py-1 rounded-[4px] text-[10px] font-bold bg-[#F4F0E8] text-[#1B2A4A] border border-[#DDD5C4] font-sans">
                        +{lockedStrongCount} more locked
                      </span>
                    )}
                  </div>
                </div>

                {/* 2 Missing Skills */}
                <div className="p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px]">
                  <span className="text-[10px] font-bold text-[#5A5347] uppercase tracking-wider block mb-2 flex items-center gap-1 font-sans">
                    Missing Keywords ({a.categorizedMissingSkills?.length || a.missingKeywords?.length || 0} total)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleMissingSkills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-[4px] text-[11px] font-medium bg-[#E85D4E]/10 text-[#b83a2c] border border-[#E85D4E]/20 font-sans">
                        {typeof s === 'string' ? s : s.name}
                      </span>
                    ))}
                    {lockedMissingCount > 0 && (
                      <span className="px-2.5 py-1 rounded-[4px] text-[10px] font-bold bg-[#E85D4E]/10 text-[#b83a2c] border border-[#E85D4E]/20 font-sans">
                        +{lockedMissingCount} critical keys locked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tiny Preview of improvements */}
              {visibleImprovements.length > 0 && (
                <div className="mt-4 p-4 bg-[#F4F0E8]/40 border border-[#DDD5C4] rounded-[8px]">
                  <span className="text-[10px] font-bold text-[#5A5347] uppercase tracking-wider block mb-2 font-sans">Priority Improvement Actions</span>
                  <div className="space-y-2">
                    {visibleImprovements.map((imp, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-sans">
                        <span className="px-1.5 py-0.5 bg-[#DB9A3C]/10 text-[#c4862f] border border-[#DB9A3C]/25 rounded-[4px] text-[9px] font-mono-score font-bold">+{imp.impact}</span>
                        <span className="text-[#1B2A4A]">{imp.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DETAILED REPORT SECTION */}
          <div className="relative">
            <div className="space-y-6">
              
              {/* 2. Explainable breakdown */}
              {a.breakdown && (
                <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none relative">
                  <CardCorners />
                  <h3 className="text-base font-semibold text-[#1B2A4A] font-space mb-4 flex items-center gap-2">
                    <FaTachometerAlt className="text-[#1B2A4A]" /> Score Breakdown — Why You Got This Score
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    {a.breakdown.skills && <ScoreBar icon="🔍" label="Skill Match" value={a.breakdown.skills.score} max={a.breakdown.skills.maxScore} reason={a.breakdown.skills.reason} />}
                    {a.breakdown.experience && <ScoreBar icon="🏆" label="Experience Match" value={a.breakdown.experience.score} max={a.breakdown.experience.maxScore} reason={a.breakdown.experience.reason} />}
                    {a.breakdown.sections && <ScoreBar icon="📋" label="Section Completeness" value={a.breakdown.sections.score} max={a.breakdown.sections.maxScore} reason={a.breakdown.sections.reason} />}
                    {a.breakdown.impact && <ScoreBar icon="📈" label="Impact & Metrics" value={a.breakdown.impact.score} max={a.breakdown.impact.maxScore} reason={a.breakdown.impact.reason} />}
                    {a.breakdown.readability && <ScoreBar icon="✍️" label="Readability" value={a.breakdown.readability.score} max={a.breakdown.readability.maxScore} reason={a.breakdown.readability.reason} />}
                    {a.breakdown.education && <ScoreBar icon="🎓" label="Education / Summary" value={a.breakdown.education.score} max={a.breakdown.education.maxScore} reason={a.breakdown.education.reason} />}
                  </div>
                </div>
              )}

              {/* 3. Full Improvement plan */}
              {a.improvements?.length > 0 && (
                <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none relative">
                  <CardCorners />
                  <h3 className="text-base font-semibold text-[#1B2A4A] font-space mb-4 flex items-center gap-2"><FaBolt className="text-[#DB9A3C]" /> Actionable Improvement Plan</h3>
                  <p className="text-xs text-[#5A5347] font-sans mb-4">
                    Completing these actions could raise your score from <span className="font-bold text-[#E85D4E] font-mono-score">{a.atsScore}</span> to <span className="font-bold text-[#3F9F6B] font-mono-score">{a.potentialScore || a.atsScore}</span>
                  </p>
                  <div className="space-y-2">
                    {a.improvements.map((imp, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-[#F4F0E8]/40 border border-[#DDD5C4]/60 rounded-xl text-xs text-left">
                        <span className="px-1.5 py-0.5 bg-[#DB9A3C]/10 text-[#c4862f] border border-[#DB9A3C]/25 rounded-[4px] text-[10px] font-mono-score font-bold">+{imp.impact}</span>
                        <span className="flex-1 text-[#1B2A4A] font-sans font-medium">{imp.action}</span>
                        <span className="px-1.5 py-0.5 bg-[#F4F0E8] border border-[#DDD5C4] text-[#1B2A4A] rounded-[4px] text-[9px] font-sans font-medium">{imp.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Impact & bullets */}
              <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none relative">
                <CardCorners />
                <h3 className="text-base font-semibold text-[#1B2A4A] font-space mb-4 flex items-center gap-2"><FaFire className="text-[#E85D4E]" /> Impact & Quantification</h3>
                {a.impactMessage ? (
                  <p className="text-xs text-[#5A5347] font-sans mb-3 text-left">{a.impactMessage}</p>
                ) : a.totalBullets > 0 ? (
                  <p className="text-xs text-[#5A5347] font-sans mb-3 text-left">{a.quantifiedBullets} of {a.totalBullets} bullets contain measurable results</p>
                ) : (
                  <p className="text-xs text-[#DB9A3C] font-sans mb-3 font-semibold text-left">No measurable achievements found — add bullet points with numbers, %, or scale</p>
                )}
                {a.totalBullets > 0 && (
                  <div className="w-full bg-[#F4F0E8] rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full bg-[#DB9A3C] transition-all duration-700"
                      style={{ width: `${Math.round((a.quantifiedBullets / a.totalBullets) * 100)}%` }} />
                  </div>
                )}
              </div>

              {/* 5. Weakness flags */}
              {a.weaknessFlags?.length > 0 && (
                <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none relative">
                  <CardCorners />
                  <h3 className="text-base font-semibold text-[#DB9A3C] font-space mb-4 flex items-center gap-2"><FaShieldAlt /> Writing Quality Flags</h3>
                  <div className="space-y-2">
                    {a.weaknessFlags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-[#DB9A3C]/10 border border-[#DB9A3C]/25 rounded-xl text-xs text-left">
                        <FaExclamationTriangle className="text-[#DB9A3C] shrink-0 mt-0.5" />
                        <span className="text-[#1B2A4A] font-sans">{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Missing skills by severity */}
              {a.categorizedMissingSkills?.length > 0 && (
                <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none relative">
                  <CardCorners />
                  <h3 className="text-base font-semibold text-[#1B2A4A] font-space mb-4 flex items-center gap-2"><FaExclamationTriangle className="text-[#E85D4E]" /> Missing Skills — by Priority</h3>
                  {["CRITICAL","IMPORTANT","NICE_TO_HAVE"].map(sev => {
                    const skills = a.categorizedMissingSkills.filter(s => s.severity === sev);
                    if (!skills.length) return null;
                    const meta = {
                      CRITICAL:    { label: "🔴 Critical — Required in Job Description", badgeStyle: "bg-[#E85D4E]/10 text-[#b83a2c] border border-[#E85D4E]/20",   note: "Add these immediately — they are explicitly required." },
                      IMPORTANT:   { label: "🟡 Important — Core Responsibilities",       badgeStyle: "bg-[#DB9A3C]/10 text-[#c4862f] border border-[#DB9A3C]/20", note: "Add these if you have experience with them." },
                      NICE_TO_HAVE:{ label: "🔵 Nice to Have — Preferred/Bonus",          badgeStyle: "bg-[#F4F0E8] text-[#1B2A4A] border border-[#DDD5C4]",    note: "Adding these gives you a competitive edge." },
                    }[sev];
                    return (
                      <div key={sev} className="mb-4 text-left">
                        <h4 className="text-xs font-semibold mb-2 text-[#1B2A4A] font-sans">{meta.label}</h4>
                        <div className="flex flex-wrap gap-2 mb-1">
                          {skills.map((s, i) => (
                            <span key={i} className={`px-2.5 py-1 rounded-[4px] text-[11px] font-medium ${meta.badgeStyle} font-sans`}>
                              {s.name}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-[#5A5347] mt-1 font-sans">{meta.note}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 9. Tailoring tips */}
              {a.tailoringTips?.length > 0 && (
                <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none relative">
                  <CardCorners />
                  <h3 className="text-base font-semibold text-[#1B2A4A] font-space mb-4 flex items-center gap-2"><FaLightbulb className="text-[#DB9A3C]" /> Role-Specific Tailoring Tips</h3>
                  <div className="space-y-3 text-left">
                    {a.tailoringTips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-[#F4F0E8]/40 border border-[#DDD5C4]/50 rounded-xl">
                        <span className="px-1.5 py-0.5 bg-[#1B2A4A] text-white rounded-[4px] text-[10px] font-mono-score font-bold mt-0.5">{i + 1}</span>
                        <p className="text-xs text-[#1B2A4A] font-sans leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. AI Feedback */}
              {a.aiFeedback && (
                <div className="bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none relative">
                  <CardCorners />
                  <h3 className="text-base font-semibold text-[#1B2A4A] font-space mb-4 flex items-center gap-2"><FaBrain className="text-[#1B2A4A]" /> AI-Powered Expert Feedback</h3>
                  
                  {!isPro ? (
                    <div className="relative">
                      {/* Blurred placeholder text for feedback */}
                      <div className="filter blur-[4px] select-none pointer-events-none opacity-25 space-y-4 text-xs font-sans text-left">
                        <div>
                          <h4 className="font-bold text-slate-700 mb-2 font-space">📊 Overall Assessment</h4>
                          <p className="leading-relaxed">This is a placeholder for the overall assessment of your resume which contains detailed insights on your engineering profile alignment.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-700 mb-2 font-space">💼 Experience Section</h4>
                          <p className="leading-relaxed">Your experience section is highly detailed but lacks quantitative impact metrics which recruiters look for.</p>
                        </div>
                      </div>

                      {/* Inline Upgrade Card */}
                      <div className="mt-6 border-t-[3px] border-[#DB9A3C] bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 text-center shadow-none">
                        <h3 className="text-base font-semibold text-[#1B2A4A] font-space leading-tight mb-2">
                          Get AI-rewritten bullets and unlimited scans
                        </h3>
                        <p className="text-xs text-[#5A5347] font-sans mb-4 max-w-sm mx-auto leading-relaxed">
                          Unlock expert AI analysis, rewritten bullet points with metrics, and optimize your resume for specific job descriptions.
                        </p>
                        <button 
                          onClick={() => setShowUpgradeModal(true)}
                          className="bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-xs rounded-[6px] px-5 py-2.5 transition-all font-sans border-0 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <FaCrown /> Upgrade to Pro
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 text-xs font-sans text-left">
                      {(a.aiFeedback.overallSummary || a.aiFeedback.atsSummaryExplanation) && (
                        <div>
                          <h4 className="font-bold text-[#1B2A4A] mb-2 font-space">📊 Overall Assessment</h4>
                          <p className="text-[#5A5347] leading-relaxed">{a.aiFeedback.overallSummary || a.aiFeedback.atsSummaryExplanation}</p>
                        </div>
                      )}
                      {a.aiFeedback.experienceFeedback && (
                        <div>
                          <h4 className="font-bold text-[#1B2A4A] mb-2 font-space">💼 Experience Section</h4>
                          <p className="text-[#5A5347] leading-relaxed">{a.aiFeedback.experienceFeedback}</p>
                        </div>
                      )}
                      {a.aiFeedback.skillsFeedback && (
                        <div>
                          <h4 className="font-bold text-[#1B2A4A] mb-2 font-space">⚡ Skills Analysis</h4>
                          <p className="text-[#5A5347] leading-relaxed">{a.aiFeedback.skillsFeedback}</p>
                        </div>
                      )}
                      {a.aiFeedback.rewrittenBullets?.length > 0 && (
                        <div>
                          <h4 className="font-bold text-[#1B2A4A] mb-3 font-space"><FaPen className="inline mr-1" />Rewritten Bullet Examples</h4>
                          <div className="space-y-3">
                            {a.aiFeedback.rewrittenBullets.map((bullet, i) => {
                              const parts = bullet.split("→");
                              return (
                                <div key={i} className="p-3 bg-white border border-[#DDD5C4] rounded-xl text-left">
                                  {parts.length >= 2 ? (
                                    <>
                                      <p className="text-[#E85D4E] line-through opacity-70 font-sans">{parts[0].replace(/Original:\s*/i, "").trim()}</p>
                                      <p className="text-[#3F9F6B] font-semibold mt-1 font-sans">✓ {parts[1].replace(/Improved:\s*/i, "").trim()}</p>
                                    </>
                                  ) : <p className="font-sans text-[#1B2A4A]">{bullet}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 11. CTA */}
              {a.atsScore < 80 && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-[#E85D4E]/10 border border-[#E85D4E]/25 rounded-[12px] mb-6 shadow-none text-left relative">
                  <CardCorners />
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-2xl text-[#E85D4E] shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs font-sans">
                      <h3 className="font-semibold text-[#1B2A4A] font-space text-sm">You're Losing Interviews</h3>
                      <p className="text-[#5A5347] mt-1 leading-relaxed">
                        Score of {a.atsScore} means many ATS systems will auto-reject your resume.
                        <span className="font-semibold text-[#3F9F6B]"> Fixing the gaps could raise your score by {a.potentialImprovement || 0} points.</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleFixResume} 
                    disabled={isTransitioning} 
                    className="bg-[#DB9A3C] hover:bg-[#c4862f] text-[#1B2A4A] font-semibold text-xs rounded-[6px] px-4 py-2 transition-all font-sans border-0 flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {isTransitioning ? <span className="loading loading-spinner loading-xs" /> : <FaTools />}
                    Fix My Resume
                  </button>
                </div>
              )}

              {/* 12. Technical details */}
              <div className="collapse collapse-arrow bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] shadow-none text-left">
                <input type="checkbox" />
                <div className="collapse-title font-semibold text-sm text-[#1B2A4A] font-space">🔬 Technical Details</div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs font-sans">
                    {a.matchedKeywords?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-[#3F9F6B] mb-2 font-space">✅ Matched ({a.matchedKeywords.length})</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {a.matchedKeywords.map((k, i) => (
                            <span key={i} className="px-2 py-1 rounded-[4px] bg-[#3F9F6B]/10 text-[#2e7d51] border border-[#3F9F6B]/20 font-sans font-medium text-[10px]">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {a.missingKeywords?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-[#E85D4E] mb-2 font-space">❌ Missing ({a.missingKeywords.length})</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {a.missingKeywords.map((k, i) => (
                            <span key={i} className="px-2 py-1 rounded-[4px] bg-[#E85D4E]/10 text-[#b83a2c] border border-[#E85D4E]/20 font-sans font-medium text-[10px]">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-center gap-4 pb-8 mt-6">
            <button 
              onClick={() => { setAtsResult(null); clearFile(); setJobDescription(""); }} 
              className="bg-[#FDFBF7] border border-[#DDD5C4] hover:bg-[#F4F0E8] text-[#1B2A4A] font-semibold text-xs rounded-[6px] px-5 py-2.5 transition-all font-sans cursor-pointer"
            >
              Analyse Another Resume
            </button>
          </div>

        </div>
      )}

      {/* Pre-auth Authentication Modal Gate */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A4A]/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md overflow-hidden bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-6 shadow-none">
            <CardCorners />
            
            {/* Close Button */}
            <button
              onClick={() => { setShowAuthModal(false); setTriggerAnalysisAfterAuth(false); }}
              disabled={isAuthLoading}
              className="absolute right-4 top-4 text-[#5A5347] hover:text-[#1B2A4A] transition-colors bg-transparent border-0 cursor-pointer"
            >
              <FaTimes size={16} />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center w-12 h-12 bg-[#F4F0E8] border border-[#DDD5C4] text-[#1B2A4A] rounded-[8px] mb-4">
                <FaShieldAlt size={22} className="animate-pulse text-[#1B2A4A]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1B2A4A] font-space">Analyze Resume</h3>
              <p className="text-xs text-[#5A5347] mt-1 max-w-[280px] mx-auto font-sans">
                Create a free account or sign in to proceed with your detailed ATS compatibility scan.
              </p>
            </div>

            {/* Tab Swapping */}
            <div className="flex border-b border-[#DDD5C4] mb-5 font-sans">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all cursor-pointer bg-transparent border-0 ${authMode === "login" ? "border-b-[#DB9A3C] text-[#1B2A4A]" : "border-b-transparent text-[#5A5347] hover:text-[#1B2A4A]"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all cursor-pointer bg-transparent border-0 ${authMode === "register" ? "border-b-[#DB9A3C] text-[#1B2A4A]" : "border-b-transparent text-[#5A5347] hover:text-[#1B2A4A]"}`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4 font-sans text-left">
              <div>
                <label className="block mb-1 text-xs font-semibold text-[#1B2A4A] font-sans">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-2.5 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] font-sans"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-[#1B2A4A] font-sans">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-2.5 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] font-sans"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-[#DB9A3C] hover:bg-[#c4862f] text-[#1B2A4A] font-semibold text-sm rounded-[8px] py-3.5 transition-all font-sans border-0 flex items-center justify-center gap-2 mt-5 cursor-pointer"
              >
                {isAuthLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs" />
                    Connecting...
                  </span>
                ) : (
                  <span>{authMode === "login" ? "Sign In & Analyze" : "Create Account & Analyze"}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ATSAnalysis;
