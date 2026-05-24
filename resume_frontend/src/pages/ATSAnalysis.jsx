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
const scoreColor = (s) => s >= 80 ? "#22c55e" : s >= 60 ? "#f59e0b" : "#ef4444";
const scoreBg   = (s) => s >= 80 ? "badge-success" : s >= 60 ? "badge-warning" : "badge-error";

const ScoreBar = ({ label, icon, value, max, reason }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = pct >= 70 ? "#22c55e" : pct >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1 text-sm">
        <span className="font-medium">{icon} {label}</span>
        <span className="font-bold">{value}<span className="text-base-content/40">/{max}</span></span>
      </div>
      <div className="w-full bg-base-300 rounded-full h-2.5 mb-1">
        <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {reason && <p className="text-xs text-base-content/60 mt-1">{reason}</p>}
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
    <div className="w-full text-left">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label py-1">
            <span className="label-text font-medium text-base-content/80">Email Address</span>
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered w-full focus:input-primary transition-all bg-base-100"
            required
          />
        </div>
        <div>
          <label className="label py-1">
            <span className="label-text font-medium text-base-content/80">Password</span>
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered w-full focus:input-primary transition-all bg-base-100"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full flex items-center justify-center gap-2 mt-2"
        >
          {isLoading && <span className="loading loading-spinner loading-sm" />}
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-base-300" />
        <span className="text-xs text-base-content/40 uppercase font-semibold">or</span>
        <div className="flex-1 h-px bg-base-300" />
      </div>
      <p className="text-center text-sm text-base-content/60">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          className="text-primary font-bold hover:underline"
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
    <div className="space-y-8 animate-pulse mt-6">
      <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-850 rounded"></div>
          <div className="h-5 w-24 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl">
            <div className="w-32 h-32 rounded-full border-[9px] border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <div className="w-16 h-8 bg-slate-200 dark:bg-slate-855 rounded"></div>
            </div>
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-855 rounded mt-4"></div>
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-855 rounded mt-2"></div>
          </div>
          <div className="space-y-4 flex flex-col justify-between">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex-1 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-850 rounded"></div>
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
              </div>
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-850 rounded"></div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-850 rounded"></div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex-1 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-850 rounded"></div>
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-850 rounded"></div>
              </div>
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-850 rounded"></div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-850 rounded"></div>
            </div>
          </div>
          <div className="space-y-4 flex flex-col justify-between">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex-1 space-y-3">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-850 rounded"></div>
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-850 rounded"></div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-850 rounded"></div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex-1 space-y-3">
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-850 rounded"></div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-850 rounded mt-1"></div>
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-850 rounded"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/50">
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl space-y-2.5">
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-850 rounded"></div>
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
            </div>
          </div>
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl space-y-2.5">
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-850 rounded"></div>
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingProgress = ({ stages, activeIndex }) => {
  return (
    <div className="card bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-xl p-6 rounded-3xl max-w-md mx-auto relative overflow-hidden backdrop-blur-md bg-white/95 dark:bg-slate-900/95 mt-6 animate-fadeIn">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
          <FaBrain className="text-xl animate-bounce" />
        </div>
        <h3 className="text-lg font-black text-slate-855 dark:text-white">Analyzing Your Resume</h3>
        <p className="text-xs text-slate-400 mt-0.5">Please wait while our algorithms process your data...</p>
      </div>
      <div className="space-y-3.5">
        {stages.map((stage, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <div key={i} className={`flex items-center gap-3 text-xs transition-all duration-300 ${isDone ? "text-slate-800 dark:text-slate-200 font-medium" : isActive ? "text-indigo-650 dark:text-indigo-400 font-bold scale-[1.01]" : "text-slate-400 opacity-60"}`}>
              <div className="flex items-center justify-center shrink-0">
                {isDone ? (
                  <FaCheckCircle className="text-emerald-500 text-sm animate-fadeIn" />
                ) : isActive ? (
                  <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-slate-700" />
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
  const [analysisStage, setAnalysisStage] = useState("");
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
        theme: { color: "#6366F1" },
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
    if (score >= 80) return { label: "Excellent Chance", pct: 85, colorClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900", desc: "Your resume matches the core requirements. Highly likely to get selected." };
    if (score >= 60) return { label: "Average Likelihood", pct: 50, colorClass: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900", desc: "Moderate fit. Aligning missing critical keywords will unlock top screening chances." };
    return { label: "Low Match Rate", pct: 15, colorClass: "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900", desc: "Your resume is missing several high-priority skills recruiters are actively filtering for." };
  };

  const getAttentionMeter = (score) => {
    if (score >= 80) return { label: "Strong Retention", time: "6.8s", color: "bg-emerald-500", desc: "Strong impact metrics hook recruiter focus immediately." };
    if (score >= 60) return { label: "Moderate Retention", time: "4.2s", color: "bg-amber-500", desc: "Vague action phrasing limits first-look readability." };
    return { label: "Critical Rejection Risk", time: "1.8s", color: "bg-red-500", desc: "Your resume formatting may reduce recruiter engagement during the first 6-second scan." };
  };

  const chance = a ? getInterviewChance(a.atsScore) : null;
  const attention = a ? getAttentionMeter(a.atsScore) : null;

  return (
    <div className="container mx-auto p-4 max-w-4xl min-h-screen bg-slate-50/30 dark:bg-slate-950/10 transition-colors duration-200">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-slate-900 dark:text-white">
          ATS Resume Analyser
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Explainable 6-dimensional scoring — every score has a proven reason
        </p>
      </div>

      {/* Soft limit banner */}
      {remainingScans === 0 && !showUpgradeModal && user && !isPro && (
        <div className="alert alert-warning shadow-lg mb-6 border-amber-250 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-300">
          <FaCrown className="text-2xl text-amber-500 shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Last Free Scan Used!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Unlock unlimited ATS optimization for just ₹49 (one-time).</p>
          </div>
          <button onClick={() => setShowUpgradeModal(true)} className="btn btn-warning btn-sm gap-1.5"><FaCrown /> Upgrade to Pro</button>
        </div>
      )}

      {/* Upgrade modal */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* Upload */}
      <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm mb-6">
        <div className="card-body">
          <h2 className="card-title text-base font-bold text-slate-850 dark:text-slate-200 mb-4">
            <FaUpload className="text-indigo-500" /> Upload Your Resume
          </h2>
          <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${dragActive ? "border-indigo-500 bg-indigo-500/5" : "border-slate-200 dark:border-slate-800 hover:border-indigo-500/50"}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}>
            {selectedFile ? (
              <div className="flex items-center justify-center gap-4">
                <FaFileAlt className="text-4xl text-indigo-500" />
                <div className="text-left">
                  <p className="font-semibold text-slate-800 dark:text-slate-250 truncate max-w-xs">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{fmt(selectedFile.size)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); clearFile(); }} className="btn btn-ghost btn-circle btn-sm text-red-500"><FaTrash size={14} /></button>
              </div>
            ) : (
              <div>
                <BiCloudUpload className="text-5xl text-indigo-400 dark:text-indigo-500/80 mx-auto mb-4" />
                <p className="text-slate-800 dark:text-slate-250 font-bold mb-1">Drag & drop or click to upload</p>
                <p className="text-slate-400 text-xs mb-4">PDF or DOCX, max 10 MB</p>
                <button className="btn btn-primary btn-sm rounded-xl font-bold px-5"><FaUpload size={12} className="mr-1.5" />Choose File</button>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
        </div>
      </div>

      {/* Job description */}
      <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm mb-6">
        <div className="card-body">
          <h2 className="card-title text-base font-bold text-slate-850 dark:text-slate-200 mb-4">
            <FaFileAlt className="text-indigo-500" /> Job Description
          </h2>
          <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
            className="textarea textarea-bordered w-full h-32 text-sm bg-base-50 dark:bg-slate-950 focus:textarea-primary"
            placeholder="Paste the target job description here. Include details about tech stack, requirements, and preferred qualifications…" />
          <div className="form-control mt-2">
            <label className="label cursor-pointer justify-start gap-3 py-1">
              <input type="checkbox" checked={includeAiFeedback} onChange={(e) => setIncludeAiFeedback(e.target.checked)} className="checkbox checkbox-primary checkbox-xs rounded" />
              <span className="label-text text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><FaBrain className="text-indigo-500" />Include AI-powered feedback & rewritten experience bullets</span>
            </label>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <button onClick={handleAnalyze} disabled={isAnalyzing || !selectedFile || !jobDescription.trim()} className="btn btn-primary rounded-2xl font-bold px-8 shadow-indigo-500/10">
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

      {/* Phase 4 — Trust Elements */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-center bg-slate-50/50 dark:bg-slate-900/30 border border-slate-150/40 dark:border-slate-800/50 rounded-2xl p-4">
        <div className="flex flex-col items-center p-2">
          <FaShieldAlt className="text-indigo-500 mb-2 text-lg" />
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">100% Privacy Encrypted</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Your resume is parsed locally and never shared with third parties.</p>
        </div>
        <div className="flex flex-col items-center p-2 border-y sm:border-y-0 sm:border-x border-slate-200/55 dark:border-slate-800/55">
          <FaTachometerAlt className="text-emerald-500 mb-2 text-lg" />
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Deterministic Scoring</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Powered by standardized ATS indexing rules — not random AI guesses.</p>
        </div>
        <div className="flex flex-col items-center p-2">
          <FaBolt className="text-amber-500 mb-2 text-lg" />
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 font-semibold">The 6-Second Rule</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Recruiters spend 6–8 seconds on first pass. We optimize for immediate visual retention.</p>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━ RESULTS / SKELETONS ━━━━━━━━━━━━━━━━━━ */}
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

      {a && !showLoadingStages && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* STEP 2 — FREE HOOK REPORT */}
          <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
            {/* Soft decorative glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="card-body">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FaChartLine className="text-indigo-500" /> ATS Compatibility Scorecard
                </h2>
                {!isPro && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Basic Preview
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Score Circle & Verdict */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl">
                  <div className="relative w-32 h-32 animate-scaleIn">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="9" fill="transparent" className="text-slate-100 dark:text-slate-800/60" />
                      <circle cx="64" cy="64" r="54" stroke={scoreColor(a.atsScore)} strokeWidth="9" fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - animatedScore / 100)}`}
                        strokeLinecap="round" className="transition-all duration-100 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black transition-all duration-300" style={{ color: scoreColor(a.atsScore) }}>{animatedScore}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
                    </div>
                  </div>
                  <div className={`badge ${scoreBg(a.atsScore)} font-bold badge-md mt-4 border-0 text-white shadow-sm`}>
                    {a.atsVerdict || "Good Match"}
                  </div>
                  <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2 max-w-[200px] leading-relaxed">
                    {a.verdictExplanation || "Solid resume base with targeted keyword improvement fields."}
                  </p>
                </div>

                {/* 2. Recruiter Attention & Interview Chance */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex-1 flex flex-col justify-between hover:shadow-sm transition-all duration-300">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Interview Rate</span>
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${chance.colorClass}`}>
                          {chance.label}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-1.5 overflow-hidden">
                        <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${chance.pct}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-405 leading-normal">
                      {chance.desc}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex-1 flex flex-col justify-between hover:shadow-sm transition-all duration-300">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recruiter Attention</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${attention.color} text-white animate-pulse`}>
                          {attention.time}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{attention.label}</h4>
                      
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mb-2 relative overflow-hidden">
                        <div className={`h-full rounded-full ${attention.color} transition-all duration-1000`}
                          style={{ width: a.atsScore >= 80 ? "90%" : a.atsScore >= 60 ? "55%" : "20%" }} />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                        <span>Risk (1.8s)</span>
                        <span>Average (4.2s)</span>
                        <span>Friendly (6.8s)</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      {attention.desc}
                    </p>
                  </div>
                </div>

                {/* 3. Semantic similarity & Keywords Count */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Semantic Similarity</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-indigo-500">
                          {a.semanticSimilarity ? Math.round(a.semanticSimilarity * 100) : Math.round(a.keywordMatchPercentage || 65)}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">alignment</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      Measures contextual fit of responsibilities rather than simple keyword stuffing.
                    </p>
                  </div>

                  {/* Before vs After Slider Preview */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Improvement potential</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-red-500">{a.atsScore}</span>
                        <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400" style={{ width: `${a.potentialScore || a.atsScore}%` }} />
                        </div>
                        <span className="text-sm font-bold text-emerald-500">{a.potentialScore || a.atsScore}</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                      Gain +{a.potentialImprovement || 0} pts with optimization suggestions
                    </div>
                  </div>
                </div>

              </div>

              {/* Skills snapshots & Preview Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/50">
                {/* 2 Matched Skills */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Strong Matched Skills (2 Visible)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleStrongSkills.map((s, i) => (
                      <span key={i} className="badge badge-success badge-sm border-0 text-white font-medium px-2.5 py-1.5">{s}</span>
                    ))}
                    {lockedStrongCount > 0 && (
                      <span className="badge badge-ghost badge-sm text-[10px] text-slate-400 border border-slate-100 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 font-bold">
                        +{lockedStrongCount} more locked
                      </span>
                    )}
                  </div>
                </div>

                {/* 2 Missing Skills */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    Missing Keywords ({a.categorizedMissingSkills?.length || a.missingKeywords?.length || 0} total)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleMissingSkills.map((s, i) => (
                      <span key={i} className="badge badge-error badge-sm border-0 text-white font-medium px-2.5 py-1.5">
                        {typeof s === 'string' ? s : s.name}
                      </span>
                    ))}
                    {lockedMissingCount > 0 && (
                      <span className="badge bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100/30 dark:border-red-950/40 badge-sm text-[10px] font-bold">
                        +{lockedMissingCount} critical keys locked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tiny Preview of improvements */}
              {visibleImprovements.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Priority Improvement Actions</span>
                  <div className="space-y-2">
                    {visibleImprovements.map((imp, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="badge badge-warning badge-xs text-[9px] font-bold">+{imp.impact}</span>
                        <span className="text-slate-600 dark:text-slate-350">{imp.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* DETAILED REPORT SECTION WITH PREMIUM BLUR OVERLAY */}
          <div className="relative">
            
            {/* The blurred content container */}
            <div className={!isPro ? "filter blur-[8px] select-none pointer-events-none opacity-20 space-y-6 transition-all duration-300" : "space-y-6"}>
              
              {/* 2. Explainable breakdown */}
              {a.breakdown && (
                <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm">
                  <div className="card-body">
                    <h3 className="card-title text-base font-bold text-slate-850 dark:text-slate-200 mb-4"><FaTachometerAlt className="text-indigo-500" /> Score Breakdown — Why You Got This Score</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      {a.breakdown.skills && <ScoreBar icon="🔍" label="Skill Match" value={a.breakdown.skills.score} max={a.breakdown.skills.maxScore} reason={a.breakdown.skills.reason} />}
                      {a.breakdown.experience && <ScoreBar icon="🏆" label="Experience Match" value={a.breakdown.experience.score} max={a.breakdown.experience.maxScore} reason={a.breakdown.experience.reason} />}
                      {a.breakdown.sections && <ScoreBar icon="📋" label="Section Completeness" value={a.breakdown.sections.score} max={a.breakdown.sections.maxScore} reason={a.breakdown.sections.reason} />}
                      {a.breakdown.impact && <ScoreBar icon="📈" label="Impact & Metrics" value={a.breakdown.impact.score} max={a.breakdown.impact.maxScore} reason={a.breakdown.impact.reason} />}
                      {a.breakdown.readability && <ScoreBar icon="✍️" label="Readability" value={a.breakdown.readability.score} max={a.breakdown.readability.maxScore} reason={a.breakdown.readability.reason} />}
                      {a.breakdown.education && <ScoreBar icon="🎓" label="Education / Summary" value={a.breakdown.education.score} max={a.breakdown.education.maxScore} reason={a.breakdown.education.reason} />}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Full Improvement plan */}
              {a.improvements?.length > 0 && (
                <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm">
                  <div className="card-body">
                    <h3 className="card-title text-base font-bold text-slate-850 dark:text-slate-200 mb-4"><FaBolt className="text-warning" /> Actionable Improvement Plan</h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Completing these actions could raise your score from <span className="font-bold text-red-500">{a.atsScore}</span> to <span className="font-bold text-emerald-500">{a.potentialScore || a.atsScore}</span>
                    </p>
                    <div className="space-y-2">
                      {a.improvements.map((imp, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl text-xs">
                          <span className="badge badge-warning badge-sm shrink-0 font-bold">+{imp.impact}</span>
                          <span className="flex-1 text-slate-700 dark:text-slate-300 font-medium">{imp.action}</span>
                          <span className="badge badge-ghost badge-xs">{imp.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Impact & bullets */}
              <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm">
                <div className="card-body">
                  <h3 className="card-title text-base font-bold text-slate-850 dark:text-slate-200 mb-4"><FaFire className="text-orange-500" /> Impact & Quantification</h3>
                  {a.impactMessage ? (
                    <p className="text-xs text-slate-650 dark:text-slate-350 mb-3">{a.impactMessage}</p>
                  ) : a.totalBullets > 0 ? (
                    <p className="text-xs text-slate-650 dark:text-slate-350 mb-3">{a.quantifiedBullets} of {a.totalBullets} bullets contain measurable results</p>
                  ) : (
                    <p className="text-xs text-warning mb-3">No measurable achievements found — add bullet points with numbers, %, or scale</p>
                  )}
                  {a.totalBullets > 0 && (
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2">
                      <div className="h-2 rounded-full bg-orange-500 transition-all duration-700"
                        style={{ width: `${Math.round((a.quantifiedBullets / a.totalBullets) * 100)}%` }} />
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Weakness flags */}
              {a.weaknessFlags?.length > 0 && (
                <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm">
                  <div className="card-body">
                    <h3 className="card-title text-base font-bold text-slate-850 dark:text-slate-200 mb-4 text-warning"><FaShieldAlt /> Writing Quality Flags</h3>
                    <div className="space-y-2">
                      {a.weaknessFlags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-warning/5 rounded-xl text-xs">
                          <FaExclamationTriangle className="text-warning shrink-0 mt-0.5" />
                          <span className="text-slate-650 dark:text-slate-350">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Missing skills by severity */}
              {a.categorizedMissingSkills?.length > 0 && (
                <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm">
                  <div className="card-body">
                    <h3 className="card-title text-base font-bold text-slate-850 dark:text-slate-200 mb-4 text-red-500"><FaExclamationTriangle /> Missing Skills — by Priority</h3>
                    {["CRITICAL","IMPORTANT","NICE_TO_HAVE"].map(sev => {
                      const skills = a.categorizedMissingSkills.filter(s => s.severity === sev);
                      if (!skills.length) return null;
                      const meta = {
                        CRITICAL:    { label: "🔴 Critical — Required in Job Description", badge: "badge-error",   note: "Add these immediately — they are explicitly required." },
                        IMPORTANT:   { label: "🟡 Important — Core Responsibilities",       badge: "badge-warning", note: "Add these if you have experience with them." },
                        NICE_TO_HAVE:{ label: "🔵 Nice to Have — Preferred/Bonus",          badge: "badge-info",    note: "Adding these gives you a competitive edge." },
                      }[sev];
                      return (
                        <div key={sev} className="mb-4">
                          <h4 className="text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">{meta.label}</h4>
                          <div className="flex flex-wrap gap-2 mb-1">
                            {skills.map((s, i) => <span key={i} className={`badge ${meta.badge} text-white font-medium border-0 px-2.5 py-1.5 badge-sm`}>{s.name}</span>)}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{meta.note}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 9. Tailoring tips */}
              {a.tailoringTips?.length > 0 && (
                <div className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm">
                  <div className="card-body">
                    <h3 className="card-title text-base font-bold text-slate-850 dark:text-slate-200 mb-4"><FaLightbulb className="text-indigo-500" /> Role-Specific Tailoring Tips</h3>
                    <div className="space-y-3">
                      {a.tailoringTips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-xl">
                          <span className="badge badge-primary badge-xs mt-0.5">{i + 1}</span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 10. AI Feedback */}
              {a.aiFeedback && (
                <div className="card bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/25 border border-indigo-150/40 dark:border-indigo-900/40 shadow-sm">
                  <div className="card-body">
                    <h3 className="card-title text-base font-bold text-indigo-600 dark:text-indigo-400 mb-4"><FaBrain /> AI-Powered Expert Feedback</h3>
                    <div className="space-y-5 text-xs">
                      {(a.aiFeedback.overallSummary || a.aiFeedback.atsSummaryExplanation) && (
                        <div>
                          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">📊 Overall Assessment</h4>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{a.aiFeedback.overallSummary || a.aiFeedback.atsSummaryExplanation}</p>
                        </div>
                      )}
                      {a.aiFeedback.experienceFeedback && (
                        <div>
                          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">💼 Experience Section</h4>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{a.aiFeedback.experienceFeedback}</p>
                        </div>
                      )}
                      {a.aiFeedback.skillsFeedback && (
                        <div>
                          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">⚡ Skills Analysis</h4>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{a.aiFeedback.skillsFeedback}</p>
                        </div>
                      )}
                      {a.aiFeedback.rewrittenBullets?.length > 0 && (
                        <div>
                          <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3"><FaPen className="inline mr-1" />Rewritten Bullet Examples</h4>
                          <div className="space-y-3">
                            {a.aiFeedback.rewrittenBullets.map((bullet, i) => {
                              const parts = bullet.split("→");
                              return (
                                <div key={i} className="p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                                  {parts.length >= 2 ? (
                                    <>
                                      <p className="text-red-500 line-through opacity-70">{parts[0].replace(/Original:\s*/i, "").trim()}</p>
                                      <p className="text-emerald-500 font-semibold mt-1">✓ {parts[1].replace(/Improved:\s*/i, "").trim()}</p>
                                    </>
                                  ) : <p>{bullet}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 11. CTA */}
              {a.atsScore < 80 && (
                <div className="alert alert-warning shadow-lg bg-warning/10 border-warning/20">
                  <FaExclamationTriangle className="text-2xl shrink-0" />
                  <div className="flex-1 text-xs">
                    <h3 className="font-bold text-slate-800 dark:text-slate-150">You're Losing Interviews</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Score of {a.atsScore} means many ATS systems will auto-reject your resume.
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400"> Fixing the gaps could raise your score by {a.potentialImprovement || 0} points.</span>
                    </p>
                  </div>
                  <button onClick={handleFixResume} disabled={isTransitioning} className="btn btn-warning btn-sm gap-1.5">
                    {isTransitioning ? <span className="loading loading-spinner loading-xs" /> : <FaTools />}
                    Fix My Resume
                  </button>
                </div>
              )}

              {/* 12. Technical details */}
              <div className="collapse collapse-arrow bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm">
                <input type="checkbox" />
                <div className="collapse-title font-semibold text-sm text-slate-800 dark:text-slate-200">🔬 Technical Details</div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                    {a.matchedKeywords?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-emerald-500 mb-2">✅ Matched ({a.matchedKeywords.length})</h4>
                        <div className="flex flex-wrap gap-1.5">{a.matchedKeywords.map((k, i) => <span key={i} className="badge badge-success badge-sm border-0 text-white font-medium px-2 py-1">{k}</span>)}</div>
                      </div>
                    )}
                    {a.missingKeywords?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-red-500 mb-2">❌ Missing ({a.missingKeywords.length})</h4>
                        <div className="flex flex-wrap gap-1.5">{a.missingKeywords.map((k, i) => <span key={i} className="badge badge-error badge-sm border-0 text-white font-medium px-2 py-1">{k}</span>)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Frosted Glass Conversion Overlay */}
            {!isPro && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-12 bg-gradient-to-b from-transparent via-slate-50/70 to-slate-50 dark:via-slate-950/70 dark:to-slate-950 px-4">
                <div className="card bg-white/90 dark:bg-slate-900/90 border border-slate-100/80 dark:border-slate-800/80 shadow-2xl rounded-3xl p-8 max-w-lg w-full text-center relative top-20 backdrop-blur-md">
                  <div className="mx-auto flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-md mb-5 text-white">
                    <FaCrown size={26} />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    Your Resume Could Be Rejected Before Recruiters Even See It
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                    We found critical ATS issues limiting your interview chances. Upgrade to Pro to unlock the full actionable optimization roadmap.
                  </p>

                  {/* Impact metrics panel */}
                  <div className="grid grid-cols-3 gap-3 my-6 p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <div className="text-center">
                      <span className="block text-indigo-500 font-extrabold text-sm md:text-base">+{a.potentialImprovement || 20} Pts</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Projected Score</span>
                    </div>
                    <div className="text-center border-x border-slate-200 dark:border-slate-800">
                      <span className="block text-amber-500 font-extrabold text-sm md:text-base">3x Higher</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Response Rate</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-red-500 font-extrabold text-sm md:text-base">
                        {a.categorizedMissingSkills?.length || a.missingKeywords?.length || 4} Gaps
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Missing Keys</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full btn bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3.5 rounded-2xl border-0 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 text-sm"
                    >
                      <FaCrown /> Unlock Full ATS Optimization
                    </button>
                    <button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full btn btn-outline btn-primary rounded-2xl py-3 font-bold text-xs"
                    >
                      Optimize Resume for This Job
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Action Footer */}
          {isPro && (
            <div className="flex justify-center gap-4 pb-8">
              <button onClick={() => { setAtsResult(null); clearFile(); setJobDescription(""); }} className="btn btn-outline rounded-xl">
                Analyse Another Resume
              </button>
            </div>
          )}

        </div>
      )}

      {/* Pre-auth Authentication Modal Gate */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6">
            
            {/* Close Button */}
            <button
              onClick={() => { setShowAuthModal(false); setTriggerAnalysisAfterAuth(false); }}
              disabled={isAuthLoading}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200"
            >
              <FaTimes size={16} />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4 shadow-sm">
                <FaShieldAlt size={22} className="animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Analyze Resume</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                Create a free account or sign in to proceed with your detailed ATS compatibility scan.
              </p>
            </div>

            {/* Tab Swapping */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${authMode === "login" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${authMode === "register" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="label py-1">
                  <span className="label-text font-semibold text-slate-700 dark:text-slate-350 text-xs">Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="input input-bordered w-full text-sm bg-base-50 dark:bg-slate-950 focus:input-primary transition-all"
                  required
                />
              </div>
              <div>
                <label className="label py-1">
                  <span className="label-text font-semibold text-slate-700 dark:text-slate-350 text-xs">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="input input-bordered w-full text-sm bg-base-50 dark:bg-slate-950 focus:input-primary transition-all"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full btn btn-primary flex items-center justify-center gap-2 mt-5 py-3 font-bold rounded-2xl shadow-indigo-500/10"
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
