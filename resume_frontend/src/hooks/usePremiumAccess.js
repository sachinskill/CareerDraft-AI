import { useAuth } from "../context/AuthContext";

export const usePremiumAccess = () => {
  const { user } = useAuth();
  
  const isPro = user?.isPro || user?.role === "ROLE_PRO";

  return {
    isPro,
    canCreateResume: (currentCount) => isPro || currentCount < 2, // Max 2 for free tier
    canAnalyzeATS: () => isPro || (user?.scanCount ?? 0) < 2, // Max 2 scans for free tier
    canUseAiEnhance: () => isPro, // Pro only (0 free uses)
    canDownloadPdf: () => true, // Unlimited downloads for all users
    canUseVersionRollback: () => isPro, // Pro only
    canAccessTemplate: (templateId) => {
      if (isPro) return true;
      if (!templateId) return true;
      const premiumLayouts = ["executive", "sidebar-modern", "elegant", "premium_executive"];
      return !premiumLayouts.includes(templateId.toLowerCase());
    }
  };
};
