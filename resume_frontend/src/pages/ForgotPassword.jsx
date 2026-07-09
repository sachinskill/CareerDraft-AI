import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaExclamationCircle, FaCheckCircle } from "react-icons/fa";

const CardCorners = () => (
  <>
    <div className="absolute -top-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -top-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -bottom-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -bottom-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
  </>
);

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorState, setErrorState] = useState(null); // 'server' or null

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setIsSubmitting(true);
    setErrorState(null);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setIsSubmitted(true);
        toast.success("Reset request processed");
      } else {
        setErrorState("server");
        toast.error(result.error || "Failed to process password reset request");
      }
    } catch (err) {
      setErrorState("server");
      toast.error("A network or server error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F4F0E8] flex items-center justify-center py-16 px-4 font-sans text-[#1B2A4A]">
      <div className="w-full max-w-xl bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-8 md:p-12 relative shadow-lg text-center overflow-hidden">
        <CardCorners />

        <AnimatePresence mode="wait">
          {isSubmitted ? (
            /* 1. Beautiful confirmation state */
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-8 font-sans"
            >
              <div className="w-20 h-20 rounded-full bg-[#3F9F6B]/10 border border-[#3F9F6B]/20 flex items-center justify-center mb-6">
                <FaCheckCircle className="text-[#3F9F6B] text-4xl" />
              </div>
              <h1 className="text-3xl font-semibold font-space mb-3 text-[#1B2A4A]">Request Received</h1>
              <p className="text-sm text-[#5A5347] max-w-sm leading-relaxed mb-8">
                If an account exists for <span className="font-semibold text-[#1B2A4A] break-all">{email}</span>, we have sent a secure password reset link to it. Please check your inbox.
              </p>
              <button
                onClick={() => navigate("/")}
                className="bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] px-8 py-3 transition-all border-0 cursor-pointer"
              >
                Return to Home
              </button>
            </motion.div>
          ) : errorState ? (
            /* 2. Error Screen */
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-[#E85D4E]/10 border border-[#E85D4E]/20 flex items-center justify-center mb-6">
                <FaExclamationCircle className="text-[#E85D4E] text-2xl" />
              </div>
              <h1 className="text-2xl font-semibold font-space mb-2 text-[#1B2A4A]">Connection Failure</h1>
              <p className="text-[#5A5347] text-sm max-w-sm mb-8 leading-relaxed">
                We encountered an issue communicating with the authentication servers. Please verify your connection parameters and try again.
              </p>
              <button
                onClick={() => setErrorState(null)}
                className="bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] px-8 py-3 transition-all border-0 cursor-pointer"
              >
                Try Again
              </button>
            </motion.div>
          ) : (
            /* 3. Main Form Screen */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Back to Home helper link */}
              <button
                onClick={() => navigate("/")}
                className="absolute top-6 left-6 text-xs text-[#5A5347] hover:text-[#1B2A4A] flex items-center gap-1 bg-transparent border-0 cursor-pointer font-medium"
              >
                <FaChevronLeft size={10} /> Home
              </button>

              {/* Large premium SVG illustration */}
              <div className="flex justify-center mb-6">
                <svg className="w-28 h-28 text-[#1B2A4A]" viewBox="0 0 100 100" fill="none">
                  {/* Decorative mesh rings */}
                  <circle cx="50" cy="50" r="44" stroke="#DDD5C4" strokeWidth="0.75" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="38" stroke="#DB9A3C" strokeWidth="0.5" opacity="0.3" />
                  
                  {/* Lock body */}
                  <rect x="33" y="44" width="34" height="26" rx="4" fill="#FDFBF7" stroke="#1B2A4A" strokeWidth="1.5" />
                  {/* Lock shackle */}
                  <path d="M40 44V34C40 28.5 44.5 24 50 24C55.5 24 60 28.5 60 34V44" stroke="#1B2A4A" strokeWidth="1.5" strokeLinecap="round" />
                  
                  {/* Keyhole details */}
                  <circle cx="50" cy="54" r="2.5" fill="#1B2A4A" />
                  <path d="M50 56V62" stroke="#1B2A4A" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Rising question mark indicators */}
                  <path d="M78 30C78 27.5 76 25.5 73.5 25.5C71 25.5 69 27.5 69 30C69 31.5 70 32.5 71 33C72 33.5 72.5 34.5 72.5 35.5V36.5" stroke="#DB9A3C" strokeWidth="1.25" strokeLinecap="round" />
                  <circle cx="72.5" cy="40" r="0.75" fill="#DB9A3C" />

                  <circle cx="24" cy="28" r="2" fill="#DB9A3C" opacity="0.6" />
                  <circle cx="82" cy="62" r="1.5" fill="#1B2A4A" opacity="0.4" />
                </svg>
              </div>

              <h1 className="text-3xl font-semibold font-space mb-2 text-[#1B2A4A]">Forgot Password?</h1>
              <p className="text-sm text-[#5A5347] font-sans max-w-sm mx-auto mb-8 leading-relaxed">
                Enter the email address associated with your account. We will send you a secure link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="max-w-sm mx-auto text-left font-sans space-y-5">
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-semibold text-[#5A5347] mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isSubmitting}
                    className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-3 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] transition-colors disabled:opacity-60"
                    required
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] py-3.5 transition-all border-0 cursor-pointer disabled:opacity-55 disabled:scale-100 flex items-center justify-center gap-2 font-sans"
                >
                  {isSubmitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Send Reset Link
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ForgotPassword;
