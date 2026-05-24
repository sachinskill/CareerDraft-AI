import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

export const axiosInstance = axios.create({
  baseURL,
  timeout: 60000,
  withCredentials: true,
});

// Normalize network errors into readable messages
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.message = "Request timed out. The server took too long to respond.";
    } else if (error.code === "ERR_NETWORK" || !error.response) {
      error.message = "Cannot connect to server. Please ensure the backend is running on port 8081.";
    }
    return Promise.reject(error);
  }
);

// ── Resume generation ─────────────────────────────────────────────────────────

export const generateResume = async (description) => {
  if (!description?.trim()) throw new Error("Description cannot be empty");
  const { data } = await axiosInstance.post("/api/v1/resume/generate", {
    userDescription: description.trim(),
  });
  return data;
};

export const enhanceResume = async (resumeData) => {
  if (!resumeData) throw new Error("Resume data is required");
  const { data } = await axiosInstance.post("/api/v1/resume/enhance", resumeData);
  return data;
};

/**
 * Improve a single bullet point using the dedicated enhance-bullet endpoint.
 * Returns the improved text string directly.
 * Falls back to the original text if the AI response is unusable.
 */
export const enhanceBullet = async (text, context = "professional resume") => {
  if (!text?.trim()) throw new Error("Text is required");
  try {
    const { data } = await axiosInstance.post("/api/v1/resume/enhance-bullet", {
      text: text.trim(),
      context,
    });
    return data?.improved || text;
  } catch {
    // If the dedicated endpoint fails, fall back gracefully
    return text;
  }
};

// ── ATS analysis ──────────────────────────────────────────────────────────────

export const uploadResumeForATS = async (file, jobDescription, includeAiFeedback = true) => {
  if (!file) throw new Error("File is required");
  if (!jobDescription?.trim()) throw new Error("Job description is required");

  const formData = new FormData();
  formData.append("resumeFile", file);
  formData.append("jobDescription", jobDescription.trim());
  formData.append("includeAiFeedback", String(includeAiFeedback));

  const { data } = await axiosInstance.post("/api/v1/ats/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 90000,
  });
  return data;
};

// ── Payments ──────────────────────────────────────────────────────────────────

/** Create a Razorpay order for Pro upgrade. */
export const createPaymentOrder = async () => {
  const { data } = await axiosInstance.post(
    "/api/payment/create-order",
    {}
  );
  return data;
};

/** Verify a Razorpay payment and upgrade the user to Pro. */
export const verifyPayment = async (paymentData) => {
  const { data } = await axiosInstance.post("/api/payment/verify", paymentData);
  return data;
};

// ── Resume persistent management (SaaS CRUD & Versioning) ──────────────────────

export const getMyResumes = async () => {
  const { data } = await axiosInstance.get("/api/resumes");
  return data;
};

export const getResumeById = async (id) => {
  const { data } = await axiosInstance.get(`/api/resumes/${id}`);
  return data;
};

export const createResume = async (payload) => {
  const { data } = await axiosInstance.post("/api/resumes", payload);
  return data;
};

export const updateResume = async (id, payload) => {
  const { data } = await axiosInstance.put(`/api/resumes/${id}`, payload);
  return data;
};

export const deleteResume = async (id) => {
  const { data } = await axiosInstance.delete(`/api/resumes/${id}`);
  return data;
};

export const getResumeVersions = async (id) => {
  const { data } = await axiosInstance.get(`/api/resumes/${id}/versions`);
  return data;
};

export const rollbackResume = async (id, versionId) => {
  const { data } = await axiosInstance.post(`/api/resumes/${id}/rollback/${versionId}`);
  return data;
};

export const trackExport = async () => {
  const { data } = await axiosInstance.post("/api/v1/resume/track-export");
  return data;
};

export const parseResumeText = async (text) => {
  if (!text?.trim()) throw new Error("Text is required");
  const { data } = await axiosInstance.post("/api/v1/resume/parse-text", { text });
  return data;
};

export const analyzeStructuredResume = async (resumeData, jobDescription, includeAiFeedback = false) => {
  if (!resumeData) throw new Error("Resume data is required");
  if (!jobDescription?.trim()) throw new Error("Job description is required");
  const { data } = await axiosInstance.post("/api/v1/ats/analyze", {
    resumeData,
    jobDescription: jobDescription.trim(),
    includeAiFeedback,
  });
  return data;
};
