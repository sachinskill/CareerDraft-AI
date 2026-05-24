import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { useResume } from "../context/ResumeContext";
import { useAuth } from "../context/AuthContext";
import { trackExport } from "../api/ResumeService";
import UpgradeModal from "./UpgradeModal";
import toast from "react-hot-toast";
import DefaultTemplate from "./Templates/DefaultTemplate";
import ModernTemplate from "./Templates/ModernTemplate";
import MinimalistTemplate from "./Templates/MinimalistTemplate";

const Resume = ({ data, selectedTemplate: propSelectedTemplate, showTemplateSelector = false }) => {
  const resumeRef = useRef(null);
  const { selectedTemplate: contextTemplate, updateTemplate } = useResume();
  const { user, refreshUser } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const currentTemplate = propSelectedTemplate || contextTemplate;

  const templates = [
    { id: "default", name: "Default" },
    { id: "modern", name: "Modern" },
    { id: "minimalist", name: "Minimalist" },
  ];

  // Text-based print/PDF — preserves selectable text, ATS-friendly
  const triggerPrint = useReactToPrint({ content: () => resumeRef.current });

  const handlePrintClick = async () => {
    if (!user) {
      toast.error("Please sign in or register to export your resume.");
      return;
    }
    const isPro = user.isPro || user.role === "ROLE_PRO";
    if (!isPro && user.exportCount >= 2) {
      setShowUpgradeModal(true);
      return;
    }
    const toastId = toast.loading("Processing export permission...");
    try {
      await trackExport();
      await refreshUser();
      toast.dismiss(toastId);
      triggerPrint();
    } catch (e) {
      toast.dismiss(toastId);
      const msg = e.response?.data?.error || e.message || "";
      if (msg.includes("Free limit") || msg.includes("limit reached")) {
        setShowUpgradeModal(true);
      } else {
        toast.error("Failed to track export: " + msg);
      }
    }
  };

  const renderTemplate = () => {
    switch (currentTemplate) {
      case "modern":     return <ModernTemplate data={data} />;
      case "minimalist": return <MinimalistTemplate data={data} />;
      default:           return <DefaultTemplate data={data} />;
    }
  };

  return (
    <div className="space-y-4">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {showTemplateSelector && (
        <div className="bg-base-200 p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-2 text-base-content/70">Template</h3>
          <div className="flex flex-wrap gap-2">
            {templates.map(t => (
              <button key={t.id} onClick={() => updateTemplate(t.id)}
                className={`btn btn-sm ${currentTemplate === t.id ? "btn-primary" : "btn-outline btn-primary"}`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button onClick={handlePrintClick} className="btn btn-sm btn-primary gap-1">
          Download PDF
        </button>
      </div>

      <div ref={resumeRef} className="bg-white shadow-lg mx-auto"
        style={{ width: "794px", minHeight: "1123px", maxWidth: "100%" }}>
        {renderTemplate()}
      </div>
    </div>
  );
};

export default Resume;
