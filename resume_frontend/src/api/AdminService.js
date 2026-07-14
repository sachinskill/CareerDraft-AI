/**
 * AdminService.js — CareerDraft AI Operations Dashboard API layer.
 * Reuses the existing axiosInstance (withCredentials: true for httpOnly cookie auth).
 * All endpoints are secured at the backend by ROLE_ADMIN.
 */
import { axiosInstance } from "./ResumeService";

// ── Module 1 — Overview ───────────────────────────────────────────────────────

export const getAdminOverview = async () => {
  const { data } = await axiosInstance.get("/api/admin/overview");
  return data;
};

// ── Module 2 — Users ──────────────────────────────────────────────────────────

export const getAdminUsers = async (search = "", page = 0, size = 20) => {
  const { data } = await axiosInstance.get("/api/admin/users", {
    params: { search, page, size },
  });
  return data;
};

export const getAdminUserDetail = async (id) => {
  const { data } = await axiosInstance.get(`/api/admin/users/${id}`);
  return data;
};

export const adminGrantPro = async (id) => {
  const { data } = await axiosInstance.post(`/api/admin/users/${id}/grant-pro`);
  return data;
};

export const adminRevokePro = async (id) => {
  const { data } = await axiosInstance.post(`/api/admin/users/${id}/revoke-pro`);
  return data;
};

export const adminDisableUser = async (id) => {
  const { data } = await axiosInstance.post(`/api/admin/users/${id}/disable`);
  return data;
};

export const adminEnableUser = async (id) => {
  const { data } = await axiosInstance.post(`/api/admin/users/${id}/enable`);
  return data;
};

// ── Module 3 — Payments ───────────────────────────────────────────────────────

export const getAdminPayments = async (search = "", page = 0, size = 20) => {
  const { data } = await axiosInstance.get("/api/admin/payments", {
    params: { search, page, size },
  });
  return data;
};
