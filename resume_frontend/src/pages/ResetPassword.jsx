import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaExclamationCircle, FaCheckCircle, FaEye, FaEyeSlash } from "react-icons/fa";

const CardCorners = () => (
  <>
    <div className="absolute -top-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -top-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -bottom-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -bottom-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
  </>
);

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorState, setErrorState] = useState(null); // 'expired', 'invalid', 'server', or null

  // Run initial link verification check
  useEffect(() => {
    if (!token || !email) {
      setErrorState("invalid");
      toast.error("Invalid reset link parameters");
    }
  }, [token, email]);

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "Too Short", color: "bg-[#DDD5C4]", text: "text-[#5A5347]" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/\d/.test(pwd)) score += 1; // contains numbers
    if (/[A-Z]/.test(pwd)) stroke = 1; // contains uppercase
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1; // contains special characters

    if (pwd.length < 6) {
      return { score: 0, label: "Too Short", color: "bg-[#E85D4E]", text: "text-[#E85D4E]" };
    }
    if (score <= 2) {
      return { score: 1, label: "Weak", color: "bg-[#E85D4E]", text: "text-[#E85D4E]" };
    }
    if (score <= 3) {
      return { score: 2, label: "Medium", color: "bg-[#DB9A3C]", text: "text-[#DB9A3C]" };
    }
    return { score: 3, label: "Strong", color: "bg-[#3F9F6B]", text: "text-[#3F9F6B]" };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !email) {
      toast.error("Missing password reset credentials in URL");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setErrorState(null);
    try {
      const result = await resetPassword(email, token, newPassword);
      if (result.success) {
        setIsSuccess(true);
        toast.success("Password changed successfully!");
      } else {
        const errMsg = result.error || "";
        if (errMsg.includes("expired") || errMsg.includes("Expired")) {
          setErrorState("expired");
        } else if (errMsg.includes("invalid") || errMsg.includes("Invalid")) {
          setErrorState("invalid");
        } else {
          setErrorState("server");
        }
        toast.error(result.error || "Password reset failed");
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
          {isSuccess ? (
            /* 1. Success confirmation state */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-8 font-sans"
            >
              <div className="w-20 h-20 rounded-full bg-[#3F9F6B]/10 border border-[#3F9F6B]/20 flex items-center justify-center mb-6">
                <FaCheckCircle className="text-[#3F9F6B] text-4xl" />
              </div>
              <h1 className="text-3xl font-semibold font-space mb-2 text-[#1B2A4A]">Password Changed Successfully</h1>
              <p className="text-sm text-[#5A5347] max-w-xs leading-relaxed mb-8">
                Your credentials have been securely updated. You can now use your new password to sign in.
              </p>
              <button
                onClick={() => navigate("/?login=true")}
                className="bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] px-8 py-3.5 transition-all border-0 cursor-pointer"
              >
                Go to Login
              </button>
            </motion.div>
          ) : errorState ? (
            /* 2. Error Screen */
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center py-4 font-sans"
            >
              <div className="w-16 h-16 rounded-full bg-[#E85D4E]/10 border border-[#E85D4E]/20 flex items-center justify-center mb-6">
                <FaExclamationCircle className="text-[#E85D4E] text-2xl" />
              </div>
              <h1 className="text-2xl font-semibold font-space mb-2 text-[#1B2A4A]">
                {errorState === "expired" ? "Reset Link Expired" : errorState === "invalid" ? "Invalid Reset Link" : "Server Connection Failure"}
              </h1>
              <p className="text-[#5A5347] text-sm max-w-sm mb-8 leading-relaxed">
                {errorState === "expired"
                  ? "This password reset request has expired. Reset links are only valid for 30 minutes for security."
                  : errorState === "invalid"
                  ? "The link credentials are invalid or have already been consumed. Please request a new link."
                  : "We failed to connect with the authentication servers. Please verify your connection status and try again."}
              </p>
              <button
                onClick={() => navigate("/forgot-password")}
                className="bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] px-8 py-3 transition-all border-0 cursor-pointer font-sans"
              >
                Request New Link
              </button>
            </motion.div>
          ) : (
            /* 3. Main Reset Password Form */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Back Link */}
              <button
                onClick={() => navigate("/")}
                className="absolute top-6 left-6 text-xs text-[#5A5347] hover:text-[#1B2A4A] flex items-center gap-1 bg-transparent border-0 cursor-pointer font-medium"
              >
                <FaChevronLeft size={10} /> Home
              </button>

              {/* Large premium SVG illustration */}
              <div className="flex justify-center mb-6">
                <svg className="w-28 h-28 text-[#1B2A4A]" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="44" stroke="#DDD5C4" strokeWidth="0.75" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="38" stroke="#DB9A3C" strokeWidth="0.5" opacity="0.3" />
                  
                  {/* Shield graphic for security */}
                  <path d="M50 22L72 30V50C72 63.5 62.5 73.5 50 78C37.5 73.5 28 63.5 28 50V30L50 22Z" fill="#FDFBF7" stroke="#1B2A4A" strokeWidth="1.5" strokeLinejoin="round" />
                  
                  {/* Checkmark inside shield */}
                  <path d="M42 49.5L47.5 55L58 44" stroke="#DB9A3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  
                  <circle cx="20" cy="62" r="2.5" fill="#DB9A3C" opacity="0.6" />
                  <circle cx="80" cy="30" r="1.5" fill="#1B2A4A" opacity="0.4" />
                </svg>
              </div>

              <h1 className="text-3xl font-semibold font-space mb-2 text-[#1B2A4A]">Reset Password</h1>
              <p className="text-sm text-[#5A5347] font-sans max-w-sm mx-auto mb-8 leading-relaxed">
                Define a strong, secure password for your account below.
              </p>

              <form onSubmit={handleSubmit} className="max-w-sm mx-auto text-left font-sans space-y-4">
                {/* Email Display (Readonly verification) */}
                <div className="bg-[#F4F0E8]/50 border border-[#DDD5C4]/60 rounded-[8px] p-2.5 flex justify-between items-center text-xs">
                  <span className="text-[#5A5347] font-medium">Resetting account:</span>
                  <span className="text-[#1B2A4A] font-semibold truncate max-w-[200px]">{email}</span>
                </div>

                {/* New Password Input */}
                <div className="relative">
                  <label htmlFor="new-pwd" className="block text-xs font-semibold text-[#5A5347] mb-1.5 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-pwd"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      disabled={isSubmitting}
                      className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-3 pr-10 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] transition-colors disabled:opacity-60"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-3.5 text-[#5A5347] hover:text-[#1B2A4A] bg-transparent border-0 cursor-pointer"
                    >
                      {showNew ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-2.5 font-sans space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#5A5347] font-medium">Password Strength:</span>
                        <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                      </div>
                      <div className="h-1 w-full bg-[#F4F0E8] rounded-full overflow-hidden flex">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{
                            width: strength.score === 0 ? "10%" : strength.score === 1 ? "33%" : strength.score === 2 ? "66%" : "100%"
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="relative">
                  <label htmlFor="confirm-pwd" className="block text-xs font-semibold text-[#5A5347] mb-1.5 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-pwd"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      disabled={isSubmitting}
                      className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-3 pr-10 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] transition-colors disabled:opacity-60"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-3.5 text-[#5A5347] hover:text-[#1B2A4A] bg-transparent border-0 cursor-pointer"
                    >
                      {showConfirm ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] py-3.5 transition-all border-0 cursor-pointer disabled:opacity-55 disabled:scale-100 flex items-center justify-center gap-2 font-sans pt-2"
                >
                  {isSubmitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Change Password
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResetPassword;
