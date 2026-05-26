import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { useResume } from "../context/ResumeContext";
import { useAuth } from "../context/AuthContext";
import { trackExport } from "../api/ResumeService";
import UpgradeModal from "./UpgradeModal";
import toast from "react-hot-toast";
import DynamicTemplate from "../templates/DynamicTemplate";
import { getTemplate, TEMPLATES } from "../templates/templateConfig";

const Resume = ({ data, selectedTemplate: propSelectedTemplate, showTemplateSelector = false }) => {
  const resumeRef = useRef(null);
  const { selectedTemplate: contextTemplate, updateTemplate, selectedTheme, selectedFont } = useResume();
  const { user, refreshUser } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const currentTemplate = propSelectedTemplate || contextTemplate;

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
    const baseConfig = getTemplate(currentTemplate);
    const config = {
      ...baseConfig,
      theme: selectedTheme || "slate",
      font: selectedFont || "inter"
    };
    return <DynamicTemplate data={data} config={config} />;
  };

  return (
    <div className="space-y-4">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {showTemplateSelector && (
        <div className="bg-base-200 p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-2 text-base-content/70">Template Layout Design</h3>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(t => (
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

      <div ref={resumeRef} className="bg-white shadow-lg mx-auto overflow-hidden"
        style={{ width: "595px", minHeight: "842px", maxWidth: "100%" }}>
        {renderTemplate()}
      </div>
    </div>
  );
};

export default Resume;
