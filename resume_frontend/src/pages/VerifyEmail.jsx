import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaExclamationCircle } from "react-icons/fa";

const CardCorners = () => (
  <>
    <div className="absolute -top-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -top-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -bottom-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -bottom-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
  </>
);

const VerifyEmail = () => {
  const { verifyEmail, resendOtp } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorState, setErrorState] = useState(null); // 'invalid', 'expired', 'server', or null
  const [isVerified, setIsVerified] = useState(false);

  // Timer: 60 seconds
  const [timeLeft, setTimeLeft] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus the first input on load
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (val && isNaN(val)) return; // Only allow numbers

    const newOtp = [...otp];
    // Take only the last character if multiple are inserted (e.g. key repeat)
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    setErrorState(null);

    // Auto-focus next input
    if (newOtp[index] !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (otp[index] === "") {
        // If current is empty, focus previous and clear it
        if (index > 0) {
          newOtp[index - 1] = "";
          setOtp(newOtp);
          inputRefs.current[index - 1].focus();
        }
      } else {
        // Just clear current
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const splitOtp = pasteData.split("");
      setOtp(splitOtp);
      inputRefs.current[5].focus();
      // Auto submit pasted code
      submitCode(splitOtp.join(""));
    } else {
      toast.error("Please paste a valid 6-digit numeric code");
    }
  };

  const submitCode = async (codeString) => {
    if (!email) {
      toast.error("Email address is required to verify");
      return;
    }
    setIsSubmitting(true);
    setErrorState(null);
    try {
      const result = await verifyEmail(email, codeString);
      if (result.success) {
        setIsVerified(true);
        toast.success("Email verified successfully!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        const errMsg = result.error || "";
        if (errMsg.includes("expired") || errMsg.includes("Expired")) {
          setErrorState("expired");
        } else if (errMsg.includes("invalid") || errMsg.includes("Invalid")) {
          setErrorState("invalid");
        } else {
          setErrorState("server");
        }
        toast.error(result.error || "Email verification failed");
      }
    } catch (err) {
      setErrorState("server");
      toast.error("A network or server error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const codeString = otp.join("");
    if (codeString.length < 6) {
      toast.error("Please fill in all 6 verification digits");
      return;
    }
    submitCode(codeString);
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Please enter your email to request a new code");
      return;
    }
    setResendLoading(true);
    setErrorState(null);
    try {
      const result = await resendOtp(email);
      if (result.success) {
        toast.success("New verification code sent.");
        setTimeLeft(60); // Restart countdown timer
        setOtp(["", "", "", "", "", ""]);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } else {
        toast.error(result.error || "Failed to resend verification code");
      }
    } catch (err) {
      toast.error("Failed to request code. Check your network connection.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F4F0E8] flex items-center justify-center py-16 px-4 font-sans text-[#1B2A4A]">
      <div className="w-full max-w-xl bg-[#FDFBF7] border border-[#DDD5C4] rounded-[12px] p-8 md:p-12 relative shadow-lg text-center overflow-hidden">
        <CardCorners />

        <AnimatePresence mode="wait">
          {/* 1. Account verified success screen */}
          {isVerified ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-8"
            >
              {/* Checkmark scaling animation */}
              <div className="w-20 h-20 rounded-full bg-[#3F9F6B]/10 border border-[#3F9F6B]/20 flex items-center justify-center mb-6">
                <motion.svg
                  className="w-10 h-10 text-[#3F9F6B]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </div>
              <h1 className="text-3xl font-semibold font-space mb-2 text-[#1B2A4A]">Email Verified</h1>
              <p className="text-[#5A5347] text-sm max-w-xs">
                Your email has been confirmed. Redirecting you to the dashboard...
              </p>
              <div className="mt-6 flex gap-1 justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3F9F6B] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3F9F6B] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#3F9F6B] animate-bounce" />
              </div>
            </motion.div>
          ) : errorState ? (
            /* 2. Error State Screen */
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center py-4"
            >
              {/* Warning/Error Icon */}
              <div className="w-16 h-16 rounded-full bg-[#E85D4E]/10 border border-[#E85D4E]/20 flex items-center justify-center mb-6">
                <FaExclamationCircle className="text-[#E85D4E] text-2xl" />
              </div>

              <h1 className="text-2xl font-semibold font-space mb-2 text-[#1B2A4A]">
                {errorState === "expired" ? "Verification Link Expired" : errorState === "invalid" ? "Invalid Verification Code" : "Server Connection Failure"}
              </h1>

              <p className="text-[#5A5347] text-sm max-w-sm mb-8 leading-relaxed">
                {errorState === "expired"
                  ? "The verification code has expired. Codes are only valid for 10 minutes from request."
                  : errorState === "invalid"
                  ? "The numeric code entered does not match our records. Please verify the code and try again."
                  : "We encountered an issue connecting with the security servers. Please check your network and try again."}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <button
                  onClick={() => {
                    setErrorState(null);
                    setOtp(["", "", "", "", "", ""]);
                    setTimeout(() => {
                      if (inputRefs.current[0]) inputRefs.current[0].focus();
                    }, 50);
                  }}
                  className="flex-1 bg-transparent border border-[#DDD5C4] hover:bg-[#F4F0E8] text-[#1B2A4A] font-semibold text-sm rounded-[6px] py-2.5 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  onClick={handleResend}
                  disabled={resendLoading || timeLeft > 0}
                  className="flex-1 bg-[#DB9A3C] hover:bg-[#c4862f] disabled:opacity-50 text-[#1B2A4A] font-semibold text-sm rounded-[6px] py-2.5 transition-colors border-0 cursor-pointer"
                >
                  {resendLoading ? "Requesting..." : "Resend Code"}
                </button>
              </div>
            </motion.div>
          ) : (
            /* 3. Standard Verification Screen */
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

              {/* Large premium animated SVG illustration */}
              <div className="flex justify-center mb-6">
                <svg className="w-28 h-28 text-[#1B2A4A]" viewBox="0 0 100 100" fill="none">
                  {/* Decorative mesh rings */}
                  <circle cx="50" cy="50" r="44" stroke="#DDD5C4" strokeWidth="0.75" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="38" stroke="#DB9A3C" strokeWidth="0.5" opacity="0.3" />
                  
                  {/* Envelope body */}
                  <rect x="25" y="32" width="50" height="36" rx="4" fill="#FDFBF7" stroke="#1B2A4A" strokeWidth="1.5" />
                  <path d="M25 36L48.2 51.5C49.3 52.2 50.7 52.2 51.8 51.5L75 36" stroke="#1B2A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M25 64L41 51" stroke="#1B2A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                  <path d="M75 64L59 51" stroke="#1B2A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />

                  {/* Tiny rising signals */}
                  <circle cx="50" cy="18" r="3" fill="#DB9A3C" className="animate-ping" style={{ transformOrigin: '50px 18px' }} />
                  <circle cx="20" cy="45" r="2" fill="#DB9A3C" opacity="0.6" />
                  <circle cx="80" cy="50" r="2.5" fill="#1B2A4A" opacity="0.4" />
                </svg>
              </div>

              <h1 className="text-3xl font-semibold font-space mb-2 text-[#1B2A4A]">Verify your Email</h1>
              <p className="text-sm text-[#5A5347] font-sans max-w-sm mx-auto mb-8 leading-relaxed">
                We've sent a 6-digit verification code to
                <span className="block font-semibold text-[#1B2A4A] mt-1 break-all select-all">
                  {email || "your email address"}
                </span>
              </p>

              {/* Email field pre-fill input if URL parameters are missing */}
              {!emailParam && (
                <div className="max-w-xs mx-auto mb-6 text-left font-sans">
                  <label htmlFor="email-input" className="block text-xs font-semibold text-[#5A5347] mb-1.5 uppercase tracking-wider">
                    Confirm Email Address
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registration email"
                    className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-2.5 outline-none focus:border-[#DB9A3C] text-[#1B2A4A]"
                    required
                  />
                </div>
              )}

              {/* 6 Individual boxes */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex gap-2.5 justify-center max-w-md mx-auto" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      ref={(el) => (inputRefs.current[index] = el)}
                      disabled={isSubmitting}
                      aria-label={`Digit ${index + 1}`}
                      className="w-12 h-14 md:w-14 md:h-16 text-center text-xl font-bold bg-white border border-[#DDD5C4] rounded-[8px] focus:border-[#DB9A3C] focus:ring-1 focus:ring-[#DB9A3C] outline-none text-[#1B2A4A] font-mono transition-all disabled:opacity-60"
                    />
                  ))}
                </div>

                <div className="max-w-xs mx-auto space-y-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || otp.some((d) => d === "")}
                    className="w-full bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] py-3.5 transition-all border-0 cursor-pointer disabled:opacity-55 disabled:scale-100 flex items-center justify-center gap-2 font-sans"
                  >
                    {isSubmitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                    Verify Account
                  </button>

                  <div className="pt-2 text-sm text-[#5A5347] font-sans">
                    {timeLeft > 0 ? (
                      <p>Resend code in <span className="font-semibold font-mono">{timeLeft}s</span></p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="text-[#DB9A3C] font-semibold hover:underline bg-transparent border-0 cursor-pointer flex items-center gap-1.5 mx-auto"
                      >
                        {resendLoading && <span className="w-3.5 h-3.5 border-2 border-[#DB9A3C]/40 border-t-[#DB9A3C] rounded-full animate-spin" />}
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VerifyEmail;
