import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaUser, FaCrown, FaBars, FaTimes } from "react-icons/fa";

// ── Auth Modal ────────────────────────────────────────────────────────────────
const AuthModal = ({ mode, onClose }) => {
  const { login, register, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentMode, setCurrentMode] = useState(mode);
  const [unverifiedEmailError, setUnverifiedEmailError] = useState(false);
  const [formError, setFormError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !password) { setFormError("Please fill in all fields"); return; }
    if (password.length < 6) { setFormError("Password must be at least 6 characters"); return; }
    const fn = currentMode === "login" ? login : register;
    const result = await fn(email, password);
    if (result.success) {
      if (currentMode === "register") {
        toast.success("Registration successful! Check your email.");
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        onClose();
      } else {
        toast.success("Welcome back!");
        onClose();
      }
    } else {
      if (currentMode === "login" && result.error === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmailError(true);
      } else {
        setFormError(result.error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1B2A4A]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#FDFBF7] rounded-[12px] shadow-lg w-full max-w-sm border border-[#DDD5C4] relative text-left">
        <button onClick={onClose}
          className="absolute right-4 top-4 text-[#5A5347] hover:text-[#1B2A4A] transition-colors bg-transparent border-0 cursor-pointer">
          <FaTimes size={14} />
        </button>
        <div className="p-8">
          {/* Brand mark */}
          <div className="w-10 h-10 rounded-[6px] bg-[#1B2A4A] flex items-center justify-center mb-5">
            <FaUser className="text-white text-sm" />
          </div>
          <h2 className="text-2xl font-semibold text-[#1B2A4A] font-space mb-1">
            {currentMode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-[#5A5347] text-xs font-sans mb-6">
            {currentMode === "login"
              ? "Sign in to access your resumes and Pro features"
              : "Free account — 2 ATS scans included"}
          </p>

          {unverifiedEmailError && (
            <div className="bg-[#E85D4E]/10 border border-[#E85D4E]/20 text-[#E85D4E] rounded-[8px] p-3 text-xs font-sans mb-4 flex justify-between items-center">
              <span>Your email is not verified.</span>
              <button
                type="button"
                onClick={() => {
                  navigate(`/verify-email?email=${encodeURIComponent(email)}`);
                  onClose();
                }}
                className="text-[#DB9A3C] font-semibold hover:underline bg-transparent border-0 cursor-pointer"
              >
                Verify Now
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 font-sans">
            <input type="email" placeholder="Email address" value={email}
              onChange={e => { setEmail(e.target.value); setUnverifiedEmailError(false); setFormError(null); }}
              className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-2.5 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] font-sans" required />
            <input type="password" placeholder="Password" value={password}
              onChange={e => { setPassword(e.target.value); setFormError(null); }}
              className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-2.5 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] font-sans" required minLength={6} />
            
            {currentMode === "login" && (
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/forgot-password");
                    onClose();
                  }}
                  className="text-xs text-[#DB9A3C] hover:underline bg-transparent border-0 cursor-pointer font-sans"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {formError && (
              <div className="text-[#E85D4E] text-xs font-semibold mt-1 font-sans">
                {formError}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] py-3 transition-all font-sans border-0 flex items-center justify-center gap-2 mt-2 cursor-pointer">
              {isLoading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {currentMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#DDD5C4]" />
            <span className="text-xs text-[#5A5347] font-sans">or</span>
            <div className="flex-1 h-px bg-[#DDD5C4]" />
          </div>
          <p className="text-center text-sm text-[#5A5347] font-sans">
            {currentMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button className="text-[#DB9A3C] font-semibold hover:underline bg-transparent border-0 cursor-pointer"
              onClick={() => { 
                setCurrentMode(currentMode === "login" ? "register" : "login"); 
                setUnverifiedEmailError(false); 
                setFormError(null); 
              }}>
              {currentMode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const [authModal, setAuthModal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "true") {
      setAuthModal("login");
      navigate(window.location.pathname, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/");
    setDropdownOpen(false);
  };

  const navLinks = [
    ...(isLoggedIn ? [{ to: "/dashboard", label: "Dashboard" }] : []),
    { to: "/templates",       label: "Templates" },
    { to: "/generate-resume", label: "Build Resume" },
    { to: "/ats-analysis",    label: "ATS Analysis" },
    { to: "/about",           label: "About" },
    { to: "/services",        label: "Services" },
    { to: "/contact",         label: "Contact" },
    // Admin link — only rendered for ROLE_ADMIN users
    ...(user?.role === "ROLE_ADMIN" ? [{ to: "/admin", label: "⚙ Admin" }] : []),
  ];

  return (
    <>
      {/* Main navbar */}
      <nav className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#DDD5C4] font-sans text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg text-[#1B2A4A] bg-transparent hover:bg-[#F4F0E8] border-0 cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
            </button>
            <Link to="/" className="flex items-center group">
              <img 
                src="/images/Career-Draft.png" 
                alt="CareerDraft Logo" 
                className="h-9 w-auto object-contain" 
              />
            </Link>
          </div>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="px-3.5 py-2 text-sm font-medium text-[#1B2A4A]/80 hover:text-[#1B2A4A] transition-all font-sans">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2 font-sans">
            {isLoggedIn ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[#DDD5C4] bg-[#FDFBF7] hover:bg-[#F4F0E8] transition-all text-sm font-sans cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-[#1B2A4A] flex items-center justify-center">
                    <FaUser className="text-white text-xs" />
                  </div>
                  <span className="hidden sm:block text-[#1B2A4A] font-semibold max-w-[120px] truncate">
                    {user?.email?.split("@")[0]}
                  </span>
                  {(user?.isPro || user?.role === "ROLE_PRO") && (
                    <span className="bg-[#E8A33D] text-[#14213B] text-[8px] font-extrabold px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider scale-95 shrink-0">
                      PRO
                    </span>
                  )}
                </button>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#FDFBF7] rounded-[8px] border border-[#DDD5C4] z-20 overflow-hidden font-sans shadow-md text-left">
                      <div className="px-4 py-3 border-b border-[#DDD5C4]">
                        <p className="text-xs text-[#5A5347] truncate">{user?.email}</p>
                        {user?.isPro || user?.role === "ROLE_PRO" ? (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-[#1B2A4A] bg-[#F4F0E8] border border-[#DDD5C4] px-2 py-0.5 rounded-full">
                            <FaCrown size={9} /> Pro
                          </span>
                        ) : (
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[10px] text-[#5A5347]">
                              Scans: {user?.scanCount || 0}/2
                            </span>
                            <Link to="/billing" onClick={() => setDropdownOpen(false)} className="text-[10px] text-[#DB9A3C] hover:underline font-bold">
                              Upgrade
                            </Link>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm text-[#1B2A4A] hover:bg-[#F4F0E8] transition-colors font-semibold">
                          Dashboard
                        </Link>
                        <Link to="/generate-resume" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm text-[#1B2A4A] hover:bg-[#F4F0E8] transition-colors font-semibold">
                          Build Resume
                        </Link>
                        <Link to="/ats-analysis" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm text-[#1B2A4A] hover:bg-[#F4F0E8] transition-colors font-semibold">
                          ATS Analysis
                        </Link>
                        <Link to="/billing" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm text-[#1B2A4A] hover:bg-[#F4F0E8] transition-colors font-semibold">
                          Billing & Limits
                        </Link>
                        {user?.role === "ROLE_ADMIN" && (
                          <Link to="/admin" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm text-[#1B2A4A] hover:bg-[#F4F0E8] transition-colors font-semibold">
                            ⚙ Admin Dashboard
                          </Link>
                        )}
                        <div className="h-px bg-[#DDD5C4] my-1" />
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm text-[#E85D4E] hover:bg-[#E85D4E]/10 border-0 bg-transparent transition-colors font-semibold text-left cursor-pointer">
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => setAuthModal("login")}
                  className="hidden sm:flex text-sm font-semibold text-[#1B2A4A]/80 hover:text-[#1B2A4A] hover:underline px-4 py-2 transition-all font-sans bg-transparent border-0 cursor-pointer">
                  Sign In
                </button>
                <button onClick={() => setAuthModal("register")}
                  className="bg-[#DB9A3C] hover:bg-[#c4862f] text-[#1B2A4A] font-semibold text-sm rounded-[6px] px-5 py-2.5 flex items-center justify-center gap-1.5 transition-all active:scale-95 font-sans border-0 cursor-pointer">
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-[#FDFBF7] border-b border-[#DDD5C4] font-sans text-left">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-[6px] text-sm font-semibold text-[#1B2A4A] hover:bg-[#F4F0E8] transition-colors">
                {link.label}
              </Link>
            ))}
            {!isLoggedIn && (
              <div className="pt-2 flex gap-2">
                <button onClick={() => { setAuthModal("login"); setMenuOpen(false); }}
                  className="flex-1 bg-white border border-[#DDD5C4] rounded-[6px] py-2 text-center text-sm font-semibold text-[#1B2A4A] cursor-pointer">Sign In</button>
                <button onClick={() => { setAuthModal("register"); setMenuOpen(false); }}
                  className="flex-1 bg-[#DB9A3C] hover:bg-[#c4862f] rounded-[6px] py-2 text-center text-sm font-semibold text-[#1B2A4A] border-0 cursor-pointer">Get Started</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal Gate */}
      {authModal && (
        <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />
      )}
    </>
  );
}

export default Navbar;
