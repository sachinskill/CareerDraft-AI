import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FaUser, FaCrown, FaBars, FaTimes } from "react-icons/fa";

// ── Auth Modal ────────────────────────────────────────────────────────────────
const AuthModal = ({ mode, onClose }) => {
  const { login, register, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentMode, setCurrentMode] = useState(mode);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    const fn = currentMode === "login" ? login : register;
    const result = await fn(email, password);
    if (result.success) {
      toast.success(currentMode === "login" ? "Welcome back!" : "Account created!");
      onClose();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 relative">
        <button onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">
          <FaTimes size={14} />
        </button>
        <div className="p-8">
          {/* Brand mark */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5">
            <FaUser className="text-white text-sm" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {currentMode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {currentMode === "login"
              ? "Sign in to access your resumes and Pro features"
              : "Free account — 2 ATS scans included"}
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-light" required />
            <input type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-light" required minLength={6} />
            <button type="submit" disabled={isLoading} className="btn-brand w-full flex items-center justify-center gap-2 mt-1">
              {isLoading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {currentMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <p className="text-center text-sm text-gray-500">
            {currentMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button className="text-indigo-600 font-semibold hover:underline"
              onClick={() => setCurrentMode(currentMode === "login" ? "register" : "login")}>
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
  ];

  return (
    <>
      {/* Main navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <button className="lg:hidden btn-ghost-light p-2 rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <span className="font-bold text-gray-900 text-base hidden sm:block group-hover:text-indigo-600 transition-colors">
                Resume Maker
              </span>
            </Link>
          </div>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all text-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <FaUser className="text-white text-xs" />
                  </div>
                  <span className="hidden sm:block text-gray-700 font-medium max-w-[120px] truncate">
                    {user?.email?.split("@")[0]}
                  </span>
                  {(user?.isPro || user?.role === "ROLE_PRO") && <FaCrown className="text-amber-500 text-xs" />}
                </button>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        {user?.isPro || user?.role === "ROLE_PRO" ? (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <FaCrown size={9} /> Pro
                          </span>
                        ) : (
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400">
                              Scans: {user?.scanCount || 0}/2
                            </span>
                            <Link to="/billing" onClick={() => setDropdownOpen(false)} className="text-[10px] text-indigo-600 hover:underline font-bold">
                              Upgrade
                            </Link>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                          Dashboard
                        </Link>
                        <Link to="/generate-resume" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                          Build Resume
                        </Link>
                        <Link to="/ats-analysis" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                          ATS Analysis
                        </Link>
                        <Link to="/billing" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                          Billing & Limits
                        </Link>
                        <div className="h-px bg-gray-100 my-1" />
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors font-medium">
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
                  className="btn-ghost-light hidden sm:flex">
                  Sign In
                </button>
                <button onClick={() => setAuthModal("register")}
                  className="btn-brand flex items-center gap-1.5">
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-100 shadow-sm">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                {link.label}
              </Link>
            ))}
            {!isLoggedIn && (
              <div className="pt-2 flex gap-2">
                <button onClick={() => { setAuthModal("login"); setMenuOpen(false); }}
                  className="btn-soft flex-1 text-center">Sign In</button>
                <button onClick={() => { setAuthModal("register"); setMenuOpen(false); }}
                  className="btn-brand flex-1 text-center">Get Started</button>
              </div>
            )}
          </div>
        </div>
      )}

      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />}
    </>
  );
}

export default Navbar;
