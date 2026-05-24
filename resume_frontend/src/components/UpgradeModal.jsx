import { useState } from "react";
import { FaCrown, FaCheckCircle, FaTimes, FaRocket, FaHistory, FaFileAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import { createPaymentOrder, verifyPayment } from "../api/ResumeService";
import { useAuth } from "../context/AuthContext";

const UpgradeModal = ({ isOpen, onClose, customTitle, customSubtitle }) => {
  const { user } = useAuth();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  if (!isOpen) return null;

  const handleUpgradePayment = async () => {
    try {
      setIsProcessingPayment(true);
      if (!user) {
        toast.error("Please sign in or register to upgrade to Pro.");
        return;
      }
      
      const toastId = toast.loading("Preparing payment request...");
      const orderData = await createPaymentOrder();
      toast.dismiss(toastId);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "CareerDraft AI Pro",
        description: "Lifetime Pro Upgrade — CareerDraft AI",
        order_id: orderData.orderId,
        handler: async (response) => {
          const verificationToast = toast.loading("Verifying payment transaction...");
          try {
            const res = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.dismiss(verificationToast);
            if (res.success) {
              toast.success("🎉 Welcome to Pro! Your account has been upgraded successfully.");
              onClose();
              setTimeout(() => window.location.reload(), 1200);
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch (e) {
            toast.dismiss(verificationToast);
            toast.error("Verification error: " + (e.response?.data?.error || e.message));
          }
        },
        prefill: {
          email: user?.email || "",
          name: user?.email ? user.email.split("@")[0] : "",
        },
        theme: {
          color: "#4f46e5", // Indigo-600 matching brand guidelines
        },
        modal: {
          ondismiss: () => setIsProcessingPayment(false),
        },
      };

      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        toast.error("Payment gateway failed to load. Please check your internet connection.");
      }
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || "Payment setup failed.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl">
        
        {/* Header background gradient blob */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90" />
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          disabled={isProcessingPayment}
          className="absolute right-4 top-4 z-10 flex items-center justify-center w-8 h-8 text-white hover:bg-white/20 rounded-full transition-all duration-150"
        >
          <FaTimes size={16} />
        </button>

        <div className="relative px-6 pt-16 pb-8 text-center">
          {/* Badge icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-900 border-4 border-indigo-400 rounded-full shadow-lg -mt-10">
            <FaCrown className="text-amber-500 text-2xl animate-pulse" />
          </div>
          <h2 className="mt-4 text-2xl md:text-3xl font-black text-white px-2 tracking-tight leading-tight">
            {customTitle || "Upgrade to Pro"}
          </h2>
          <p className="mt-2 text-indigo-100 text-xs md:text-sm font-semibold opacity-90 max-w-sm mx-auto">
            {customSubtitle || "Unlock recruiter-grade optimization tools and stand out."}
          </p>
          
          {/* Pricing Plan details */}
          <div className="mt-8 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 text-left border border-slate-100 dark:border-slate-800/80 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Lifetime Pro Access</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Zero subscriptions. Pay once, use forever.</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">₹49</span>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">one-time</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-emerald-500 mt-1 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Unlimited ATS Scans</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Scan and align unlimited resumes against target descriptions to bypass automatic filters.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaRocket className="text-indigo-500 mt-1 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Priority AI Enhancements</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Instant AI optimizations for experience metrics, action verbs, and keyword density.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaHistory className="text-purple-500 mt-1 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Resume Version Rollback</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Compare and restore historical drafts seamlessly as you tailor your resume for different roles.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaFileAlt className="text-pink-500 mt-1 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Premium Templates & PDFs</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Access all layout templates, visual themes, fonts, and enjoy high-speed PDF downloads.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpgradePayment}
            disabled={isProcessingPayment}
            className="w-full mt-6 btn-brand py-3.5 flex items-center justify-center gap-2 font-bold text-base"
          >
            <FaCrown />
            {isProcessingPayment ? "Redirecting to Payment..." : "Upgrade Now — ₹49"}
          </button>
          
          <button 
            onClick={onClose} 
            disabled={isProcessingPayment}
            className="mt-3 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
