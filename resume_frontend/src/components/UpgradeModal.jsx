import { useState } from "react";
import { FaCrown, FaCheckCircle, FaTimes, FaRocket, FaHistory, FaFileAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import { createPaymentOrder, verifyPayment } from "../api/ResumeService";
import { useAuth } from "../context/AuthContext";

const UpgradeModal = ({ isOpen, onClose, customTitle, customSubtitle }) => {
  const { user, refreshUser } = useAuth();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

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
              await refreshUser();
              toast.success("🎉 Welcome to Pro! Your account has been upgraded successfully.");
              setUpgradeSuccess(true);
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
          color: "#E8A33D", // Amber matching brand design tokens
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

  if (upgradeSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A4A]/50 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-md overflow-hidden bg-[#FFFFFF] border border-[#D3D1C7] rounded-[12px] p-8 text-center shadow-none">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-[#3F9F6B]/10 rounded-full mb-4">
            <FaCheckCircle className="text-[#3F9F6B] text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B2A4A] font-space tracking-tight mb-2">
            🎉 Welcome to CareerDraft Pro!
          </h2>
          <p className="text-sm text-[#4A5568] font-sans mb-6">
            Your payment was verified. All premium features are now unlocked for lifetime!
          </p>

          <div className="bg-[#EDEFF2]/40 border border-[#D3D1C7] rounded-[8px] p-5 text-left mb-6 space-y-3.5 font-sans">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-[#1B2A4A]">
              <span className="text-[#3F9F6B] font-bold text-sm">✓</span> Unlimited Resume Drafts Unlocked
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-[#1B2A4A]">
              <span className="text-[#3F9F6B] font-bold text-sm">✓</span> Unlimited ATS Analysis Unlocked
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-[#1B2A4A]">
              <span className="text-[#3F9F6B] font-bold text-sm">✓</span> Premium Templates Unlocked
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-[#1B2A4A]">
              <span className="text-[#3F9F6B] font-bold text-sm">✓</span> AI Enhancements Unlocked
            </div>
          </div>

          <button
            onClick={() => {
              setUpgradeSuccess(false);
              onClose();
            }}
            className="w-full bg-[#E8A33D] hover:bg-[#d69430] active:scale-95 text-[#14213B] font-bold py-3.5 rounded-[8px] text-sm transition-all border-0 cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A4A]/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden bg-[#FFFFFF] border border-[#D3D1C7] rounded-[12px] shadow-none">
        
        {/* Header area */}
        <div className="bg-[#EDEFF2] border-b border-[#D3D1C7] p-6 text-center relative">
          {/* Close Button */}
          <button 
            onClick={onClose} 
            disabled={isProcessingPayment}
            className="absolute right-4 top-4 text-[#4A5568] hover:text-[#1B2A4A] transition-colors"
          >
            <FaTimes size={16} />
          </button>

          {/* Flat Amber Crown Icon */}
          <div className="mx-auto flex items-center justify-center mb-2">
            <FaCrown className="text-[#E8A33D] text-3xl" />
          </div>
          
          <h2 className="text-xl md:text-2xl font-semibold text-[#1B2A4A] font-space tracking-tight">
            {customTitle || "Upgrade to Pro"}
          </h2>
          <p className="mt-1 text-[#4A5568] text-xs md:text-sm font-sans max-w-sm mx-auto">
            {customSubtitle || "Unlock recruiter-grade optimization tools and stand out."}
          </p>
        </div>

        <div className="p-6 text-center bg-[#FFFFFF]">
          {/* Pricing Plan details */}
          <div className="bg-[#EDEFF2]/40 border border-[#D3D1C7] rounded-[8px] p-5 text-left">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#D3D1C7]">
              <div>
                <h3 className="font-semibold text-[#1B2A4A] font-space text-base">Lifetime Pro Access</h3>
                <p className="text-xs text-[#4A5568] font-sans">Zero subscriptions. Pay once, use forever.</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono-score text-[#1B2A4A]">₹49</span>
                <span className="text-[10px] text-[#4A5568] block font-sans font-semibold uppercase tracking-wider">one-time</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-[#3F9F6B] mt-1 shrink-0 text-sm" />
                <div>
                  <h4 className="font-semibold text-[#1B2A4A] font-space text-sm">Unlimited ATS Scans</h4>
                  <p className="text-xs text-[#4A5568] font-sans">Scan and align unlimited resumes against target descriptions to bypass automatic filters.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-[#3F9F6B] mt-1 shrink-0 text-sm" />
                <div>
                  <h4 className="font-semibold text-[#1B2A4A] font-space text-sm">Priority AI Enhancements</h4>
                  <p className="text-xs text-[#4A5568] font-sans">Instant AI optimizations for experience metrics, action verbs, and keyword density.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-[#3F9F6B] mt-1 shrink-0 text-sm" />
                <div>
                  <h4 className="font-semibold text-[#1B2A4A] font-space text-sm">Resume Version Rollback</h4>
                  <p className="text-xs text-[#4A5568] font-sans">Compare and restore historical drafts seamlessly as you tailor your resume for different roles.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-[#3F9F6B] mt-1 shrink-0 text-sm" />
                <div>
                  <h4 className="font-semibold text-[#1B2A4A] font-space text-sm">Premium Templates & PDFs</h4>
                  <p className="text-xs text-[#4A5568] font-sans">Access all layout templates, visual themes, fonts, and enjoy high-speed PDF downloads.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpgradePayment}
            disabled={isProcessingPayment}
            className="w-full mt-5 bg-[#E8A33D] hover:bg-[#d69430] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[8px] py-3.5 transition-all font-sans border-0 flex items-center justify-center gap-2"
          >
            <FaCrown />
            {isProcessingPayment ? "Redirecting to Payment..." : "Upgrade Now — ₹49"}
          </button>
          
          <button 
            onClick={onClose} 
            disabled={isProcessingPayment}
            className="mt-3 text-sm text-[#4A5568] hover:text-[#1B2A4A] font-medium transition-colors font-sans"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
