import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import About from "./pages/About";
import Home from "./pages/Home";
import Root from "./pages/Root";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import GenerateResume from "./pages/GenerateResume";
import ResumeView from "./pages/ResumeView";
import ATSAnalysis from "./pages/ATSAnalysis";
import TemplateGallery from "./pages/TemplateGallery";
import ResumeDashboard from "./pages/ResumeDashboard";
import BillingPage from "./pages/BillingPage";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { Toaster } from "react-hot-toast";
import { ResumeProvider } from "./context/ResumeContext";
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
    <ResumeProvider>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/" element={<Root />}>
            <Route path="" element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Services />} />
            <Route path="contact" element={<Contact />} />
            <Route path="generate-resume" element={<GenerateResume />} />
            <Route path="resume-view" element={<ResumeView />} />
            <Route path="ats-analysis" element={<ATSAnalysis />} />
            <Route path="templates" element={<TemplateGallery />} />
            <Route path="dashboard" element={<ResumeDashboard />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ResumeProvider>
    </AuthProvider>
  </StrictMode>
);
