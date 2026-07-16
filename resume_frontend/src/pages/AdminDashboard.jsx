import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  FaUsers, FaCrown, FaUserSlash, FaUserCheck, FaChartBar,
  FaMoneyBillWave, FaSearch, FaSpinner, FaShieldAlt,
  FaChevronLeft, FaChevronRight, FaUserCog, FaRegCalendarAlt,
  FaCheck, FaTimes
} from "react-icons/fa";
import {
  getAdminOverview,
  getAdminUsers,
  adminGrantPro,
  adminRevokePro,
  adminDisableUser,
  adminEnableUser,
  getAdminPayments,
} from "../api/AdminService";

// ── Design tokens matching ResumeDashboard ────────────────────────────────────
const BG = "#14213B";
const CARD = "#1E2E4F";
const BORDER = "#2C3E5E";
const TEXT = "#F1F3F6";
const MUTED = "#9AA7BE";
const AMBER = "#E8A33D";
const GREEN = "#3F9F6B";
const RED = "#E85D4E";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtAmount = (a) => `₹${(a ?? 0).toFixed(2)}`;

// ── Stat card (Module 1) ──────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = AMBER }) => (
  <div
    style={{ background: CARD, border: `1px solid ${BORDER}` }}
    className="rounded-[12px] p-5 flex items-center gap-4"
  >
    <div
      className="w-11 h-11 rounded-[8px] flex items-center justify-center shrink-0"
      style={{ background: `${color}18` }}
    >
      <Icon style={{ color }} size={18} />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
      <p className="text-2xl font-bold mt-0.5" style={{ color: TEXT }}>{value}</p>
    </div>
  </div>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ children, color }) => (
  <span
    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
    style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
  >
    {children}
  </span>
);

// ── Confirm dialog ────────────────────────────────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div
      className="w-full max-w-sm rounded-[12px] p-6 shadow-2xl"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}
    >
      <p className="text-sm font-semibold mb-5" style={{ color: TEXT }}>{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-[6px] text-sm font-bold transition-all active:scale-95"
          style={{ background: AMBER, color: BG, border: "none", cursor: "pointer" }}
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-[6px] text-sm font-bold transition-all active:scale-95"
          style={{ background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPrev, onNext }) => (
  <div className="flex items-center justify-between mt-4 px-1">
    <span className="text-xs font-semibold" style={{ color: MUTED }}>
      Page {page + 1} of {Math.max(totalPages, 1)}
    </span>
    <div className="flex gap-2">
      <button
        disabled={page === 0}
        onClick={onPrev}
        className="px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all active:scale-95 disabled:opacity-30"
        style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER}`, cursor: page === 0 ? "not-allowed" : "pointer" }}
      >
        <FaChevronLeft size={10} />
      </button>
      <button
        disabled={page + 1 >= totalPages}
        onClick={onNext}
        className="px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all active:scale-95 disabled:opacity-30"
        style={{ background: CARD, color: TEXT, border: `1px solid ${BORDER}`, cursor: page + 1 >= totalPages ? "not-allowed" : "pointer" }}
      >
        <FaChevronRight size={10} />
      </button>
    </div>
  </div>
);

// ── Search bar ────────────────────────────────────────────────────────────────
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative w-full max-w-xs">
    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: MUTED }} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-8 pr-3 py-2 rounded-[8px] text-sm outline-none transition-all"
      style={{
        background: BG, border: `1px solid ${BORDER}`, color: TEXT,
        fontFamily: "sans-serif",
      }}
    />
  </div>
);

// ── Tab button ────────────────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-sm font-semibold rounded-[8px] transition-all active:scale-95"
    style={{
      background: active ? AMBER : "transparent",
      color: active ? BG : MUTED,
      border: active ? "none" : `1px solid ${BORDER}`,
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const AdminDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ROLE_ADMIN";

  // ── Access guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      toast.error("Access denied. Admin only.");
      navigate("/");
    }
  }, [user, authLoading, isAdmin, navigate]);

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("overview"); // overview | users | payments

  // ── Overview state ─────────────────────────────────────────────────────────
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // ── Users state ────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  // ── Payments state ─────────────────────────────────────────────────────────
  const [payments, setPayments] = useState([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(0);
  const [paymentsSearch, setPaymentsSearch] = useState("");
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // ── Confirm dialog state ───────────────────────────────────────────────────
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }

  // ── Load overview ──────────────────────────────────────────────────────────
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (e) {
      toast.error("Failed to load overview: " + (e.response?.data?.error || e.message));
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  // ── Load users ─────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async (search, page) => {
    setUsersLoading(true);
    try {
      const data = await getAdminUsers(search, page, 20);
      setUsers(data.users || []);
      setUsersTotal(data.totalElements || 0);
      setUsersTotalPages(data.totalPages || 0);
    } catch (e) {
      toast.error("Failed to load users: " + (e.response?.data?.error || e.message));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // ── Load payments ──────────────────────────────────────────────────────────
  const loadPayments = useCallback(async (search, page) => {
    setPaymentsLoading(true);
    try {
      const data = await getAdminPayments(search, page, 20);
      setPayments(data.payments || []);
      setPaymentsTotal(data.totalElements || 0);
      setPaymentsTotalPages(data.totalPages || 0);
    } catch (e) {
      toast.error("Failed to load payments: " + (e.response?.data?.error || e.message));
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "overview") loadOverview();
  }, [activeTab, isAdmin, loadOverview]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "users") loadUsers(usersSearch, usersPage);
  }, [activeTab, usersSearch, usersPage, isAdmin, loadUsers]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "payments") loadPayments(paymentsSearch, paymentsPage);
  }, [activeTab, paymentsSearch, paymentsPage, isAdmin, loadPayments]);

  // Search debounce — reset to page 0 on new search
  useEffect(() => {
    setUsersPage(0);
  }, [usersSearch]);

  useEffect(() => {
    setPaymentsPage(0);
  }, [paymentsSearch]);

  // ── User actions ───────────────────────────────────────────────────────────
  const doAction = (message, action) => {
    setConfirm({
      message,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await action();
          toast.success(res.message || "Done.");
          loadUsers(usersSearch, usersPage);
        } catch (e) {
          toast.error(e.response?.data?.error || e.message || "Action failed.");
        }
      },
    });
  };

  const handleGrantPro = (u) =>
    doAction(`Grant Pro access to ${u.email}?`, () => adminGrantPro(u.id));

  const handleRevokePro = (u) =>
    doAction(`Revoke Pro access from ${u.email}?`, () => adminRevokePro(u.id));

  const handleDisable = (u) =>
    doAction(`Disable account for ${u.email}? They will not be able to log in.`, () => adminDisableUser(u.id));

  const handleEnable = (u) =>
    doAction(`Re-enable account for ${u.email}?`, () => adminEnableUser(u.id));

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <FaSpinner className="animate-spin text-4xl" style={{ color: AMBER }} />
      </div>
    );
  }

  if (!isAdmin) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-left" style={{ background: BG }}>
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6"
          style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0"
              style={{ background: `${AMBER}18`, border: `1px solid ${AMBER}30` }}>
              <FaShieldAlt style={{ color: AMBER }} size={16} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: TEXT }}>
                Operations Dashboard
              </h1>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                Admin only — CareerDraft AI
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: `${AMBER}15`, color: AMBER, border: `1px solid ${AMBER}25` }}>
            ROLE_ADMIN: {user?.email}
          </span>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <TabBtn active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
            <FaChartBar className="inline mr-1.5" size={11} />Overview
          </TabBtn>
          <TabBtn active={activeTab === "users"} onClick={() => setActiveTab("users")}>
            <FaUsers className="inline mr-1.5" size={11} />Users
          </TabBtn>
          <TabBtn active={activeTab === "payments"} onClick={() => setActiveTab("payments")}>
            <FaMoneyBillWave className="inline mr-1.5" size={11} />Payments
          </TabBtn>
        </div>

        {/* ================================================================
            MODULE 1 — OVERVIEW
            ================================================================ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: TEXT }}>Dashboard Overview</h2>
              <button
                onClick={loadOverview}
                disabled={overviewLoading}
                className="text-xs px-3 py-1.5 rounded-[6px] font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: CARD, color: MUTED, border: `1px solid ${BORDER}`, cursor: "pointer" }}
              >
                {overviewLoading ? <FaSpinner className="animate-spin inline" /> : "Refresh"}
              </button>
            </div>

            {overviewLoading ? (
              <div className="flex justify-center py-16">
                <FaSpinner className="animate-spin text-3xl" style={{ color: AMBER }} />
              </div>
            ) : overview ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard icon={FaUsers} label="Total Users" value={fmt(overview.totalUsers)} color={AMBER} />
                <StatCard icon={FaCrown} label="Pro Users" value={fmt(overview.proUsers)} color={GREEN} />
                <StatCard icon={FaUsers} label="Free Users" value={fmt(overview.freeUsers)} color={MUTED} />
                <StatCard icon={FaRegCalendarAlt} label="Today's Registrations" value={fmt(overview.todayRegistrations)} color="#60A5FA" />
                <StatCard icon={FaMoneyBillWave} label="Total Revenue" value={`₹${(overview.totalRevenue ?? 0).toFixed(2)}`} color={GREEN} />
              </div>
            ) : (
              <div className="text-center py-16" style={{ color: MUTED }}>
                <FaChartBar size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No data available.</p>
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            MODULE 2 — USERS
            ================================================================ */}
        {activeTab === "users" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style={{ color: TEXT }}>User Management</h2>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                  {fmt(usersTotal)} total users
                </p>
              </div>
              <SearchBar
                value={usersSearch}
                onChange={setUsersSearch}
                placeholder="Search by email…"
              />
            </div>

            <div className="rounded-[12px] overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1fr_80px_70px_80px_80px_120px_180px] gap-0 px-4 py-3 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${CARD}`, color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                <span>Email</span>
                <span>Role / Plan</span>
                <span>Verified</span>
                <span>Resumes</span>
                <span>ATS Used</span>
                <span>Scans</span>
                <span>Registered</span>
                <span className="text-right">Actions</span>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-12" style={{ background: CARD }}>
                  <FaSpinner className="animate-spin text-2xl" style={{ color: AMBER }} />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12" style={{ background: CARD, color: MUTED }}>
                  <FaUsers size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No users found.</p>
                </div>
              ) : (
                users.map((u, idx) => (
                  <div
                    key={u.id}
                    className="grid grid-cols-[1fr_1fr_80px_70px_80px_80px_120px_180px] gap-0 px-4 py-3.5 items-center text-sm transition-colors"
                    style={{
                      background: idx % 2 === 0 ? CARD : `${CARD}CC`,
                      borderBottom: `1px solid ${BORDER}`,
                    }}
                  >
                    {/* Email */}
                    <span className="truncate text-xs font-semibold" style={{ color: TEXT }}>
                      {u.email}
                    </span>

                    {/* Role / Plan */}
                    <span>
                      {u.isPro ? (
                        <Badge color={AMBER}>PRO</Badge>
                      ) : u.role === "ROLE_ADMIN" ? (
                        <Badge color="#60A5FA">ADMIN</Badge>
                      ) : (
                        <Badge color={MUTED}>FREE</Badge>
                      )}
                    </span>

                    {/* Verified (enabled) */}
                    <span>
                      {u.enabled ? (
                        <FaCheck size={12} style={{ color: GREEN }} />
                      ) : (
                        <FaTimes size={12} style={{ color: RED }} />
                      )}
                    </span>

                    {/* Resume count */}
                    <span className="text-xs font-semibold" style={{ color: MUTED }}>
                      {u.resumeCount ?? 0}
                    </span>

                    {/* Enhance count */}
                    <span className="text-xs font-semibold" style={{ color: MUTED }}>
                      {u.enhanceCount ?? 0}
                    </span>

                    {/* Scan count */}
                    <span className="text-xs font-semibold" style={{ color: MUTED }}>
                      {u.scanCount ?? 0}
                    </span>

                    {/* Registered */}
                    <span className="text-[10px]" style={{ color: MUTED }}>
                      {fmtDate(u.createdAt)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {u.role !== "ROLE_ADMIN" && (
                        <>
                          {u.isPro ? (
                            <ActionBtn color={RED} onClick={() => handleRevokePro(u)}>
                              Revoke Pro
                            </ActionBtn>
                          ) : (
                            <ActionBtn color={GREEN} onClick={() => handleGrantPro(u)}>
                              Grant Pro
                            </ActionBtn>
                          )}
                          {u.enabled ? (
                            <ActionBtn color={RED} onClick={() => handleDisable(u)}>
                              Disable
                            </ActionBtn>
                          ) : (
                            <ActionBtn color={GREEN} onClick={() => handleEnable(u)}>
                              Enable
                            </ActionBtn>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <Pagination
              page={usersPage}
              totalPages={usersTotalPages}
              onPrev={() => setUsersPage(p => Math.max(0, p - 1))}
              onNext={() => setUsersPage(p => p + 1)}
            />
          </div>
        )}

        {/* ================================================================
            MODULE 3 — PAYMENTS
            ================================================================ */}
        {activeTab === "payments" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style={{ color: TEXT }}>Payment History</h2>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                  {fmt(paymentsTotal)} total transactions · Read-only
                </p>
              </div>
              <SearchBar
                value={paymentsSearch}
                onChange={setPaymentsSearch}
                placeholder="Search by email, ID, status…"
              />
            </div>

            <div className="rounded-[12px] overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px_120px] gap-0 px-4 py-3 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: CARD, color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                <span>User</span>
                <span>Payment ID</span>
                <span>Order ID</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Date</span>
              </div>

              {paymentsLoading ? (
                <div className="flex justify-center py-12" style={{ background: CARD }}>
                  <FaSpinner className="animate-spin text-2xl" style={{ color: AMBER }} />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12" style={{ background: CARD, color: MUTED }}>
                  <FaMoneyBillWave size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No payments found.</p>
                </div>
              ) : (
                payments.map((p, idx) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px_120px] gap-0 px-4 py-3.5 items-center"
                    style={{
                      background: idx % 2 === 0 ? CARD : `${CARD}CC`,
                      borderBottom: `1px solid ${BORDER}`,
                    }}
                  >
                    {/* User email */}
                    <span className="text-xs font-semibold truncate" style={{ color: TEXT }}>
                      {p.userEmail}
                    </span>

                    {/* Payment ID */}
                    <span className="text-[10px] font-mono truncate" style={{ color: MUTED }}>
                      {p.paymentId || "—"}
                    </span>

                    {/* Order ID */}
                    <span className="text-[10px] font-mono truncate" style={{ color: MUTED }}>
                      {p.orderId || "—"}
                    </span>

                    {/* Amount */}
                    <span className="text-xs font-bold" style={{ color: GREEN }}>
                      {fmtAmount(p.amount)}
                    </span>

                    {/* Status */}
                    <span>
                      <Badge color={
                        p.status === "SUCCESS" ? GREEN :
                        p.status === "FAILED" ? RED : AMBER
                      }>
                        {p.status}
                      </Badge>
                    </span>

                    {/* Date */}
                    <span className="text-[10px]" style={{ color: MUTED }}>
                      {fmtDate(p.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <Pagination
              page={paymentsPage}
              totalPages={paymentsTotalPages}
              onPrev={() => setPaymentsPage(p => Math.max(0, p - 1))}
              onNext={() => setPaymentsPage(p => p + 1)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ── Small action button helper ─────────────────────────────────────────────────
const ActionBtn = ({ onClick, color, children }) => (
  <button
    onClick={onClick}
    className="px-2 py-1 rounded-[5px] text-[10px] font-bold transition-all active:scale-95"
    style={{
      background: `${color}18`,
      color,
      border: `1px solid ${color}30`,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </button>
);

export default AdminDashboard;
