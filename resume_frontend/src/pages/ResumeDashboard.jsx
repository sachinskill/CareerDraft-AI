import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useResume } from "../context/ResumeContext";
import {
  getMyResumes,
  createResume,
  deleteResume,
  getResumeVersions,
  rollbackResume
} from "../api/ResumeService";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaHistory,
  FaCrown,
  FaUndo,
  FaSpinner,
  FaFileAlt,
  FaArrowLeft,
  FaTimes
} from "react-icons/fa";
import toast from "react-hot-toast";
import UpgradeModal from "../components/UpgradeModal";
import { usePremiumAccess } from "../hooks/usePremiumAccess";

const ResumeDashboard = () => {
  const { user } = useAuth();
  const { updateResumeData, updateTemplate } = useResume();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeContext, setUpgradeContext] = useState({ title: "", subtitle: "" });
  const { canCreateResume, isPro } = usePremiumAccess();
  
  // Version history state
  const [selectedResumeForHistory, setSelectedResumeForHistory] = useState(null);
  const [versions, setVersions] = useState([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/");
      toast.error("Please sign in to access your dashboard.");
      return;
    }
    loadResumes();
  }, [user]);

  const loadResumes = async () => {
    setIsLoading(true);
    try {
      const data = await getMyResumes();
      setResumes(data);
    } catch (e) {
      toast.error("Failed to load resumes: " + (e.response?.data?.error || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateResume = async () => {
    // Check free limit
    if (!canCreateResume(resumes.length)) {
      setUpgradeContext({
        title: "Unlock Unlimited Resumes",
        subtitle: "Free accounts support 2 active resume drafts. Upgrade to design unlimited versions."
      });
      setShowUpgradeModal(true);
      return;
    }

    try {
      const emptyPayload = {
        originalJson: {
          personalInformation: { fullName: "", email: "", phoneNumber: "", location: "", linkedIn: "", gitHub: "", portfolio: "" },
          summary: "",
          skills: [],
          experience: [],
          education: [],
          projects: [],
          certifications: [],
          languages: [],
          interests: [],
        },
        currentStatus: "ORIGINAL",
        selectedTemplate: "default",
        selectedTheme: "indigo",
        selectedFont: "inter"
      };

      const newResume = await createResume(emptyPayload);
      toast.success("New resume draft created!");
      
      // Load it into context
      updateResumeData(newResume.originalJson ? JSON.parse(newResume.originalJson) : emptyPayload.originalJson);
      updateTemplate(newResume.selectedTemplate || "default");
      
      // Go to builder
      navigate(`/generate-resume?id=${newResume.id}`);
    } catch (e) {
      toast.error("Failed to create resume: " + (e.response?.data?.error || e.message));
    }
  };

  const handleEditResume = (resume) => {
    try {
      const content = resume.currentStatus === "ORIGINAL" 
        ? JSON.parse(resume.originalJson || "{}") 
        : JSON.parse(resume.improvedJson || "{}");
      
      updateResumeData(content);
      updateTemplate(resume.selectedTemplate || "default");
      navigate(`/generate-resume?id=${resume.id}`);
    } catch (e) {
      toast.error("Error parsing resume data.");
    }
  };

  const handleDeleteResume = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this resume? All version history will be lost.")) {
      return;
    }

    try {
      await deleteResume(id);
      toast.success("Resume deleted successfully");
      loadResumes();
      if (selectedResumeForHistory?.id === id) {
        setSelectedResumeForHistory(null);
      }
    } catch (e) {
      toast.error("Failed to delete resume: " + (e.response?.data?.error || e.message));
    }
  };

  const handleViewHistory = async (resume, e) => {
    e.stopPropagation();
    setSelectedResumeForHistory(resume);
    setIsLoadingVersions(true);
    try {
      const historyData = await getResumeVersions(resume.id);
      setVersions(historyData);
    } catch (e) {
      toast.error("Failed to load versions: " + (e.response?.data?.error || e.message));
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleRollback = async (versionId) => {
    if (!selectedResumeForHistory) return;
    if (!window.confirm("Are you sure you want to rollback to this version? This will restore this layout and data.")) {
      return;
    }

    try {
      const updated = await rollbackResume(selectedResumeForHistory.id, versionId);
      toast.success("Rolled back successfully!");
      
      // Reload lists
      loadResumes();
      
      // Close version panel or reload its history
      setSelectedResumeForHistory(null);
    } catch (e) {
      toast.error("Failed to rollback: " + (e.response?.data?.error || e.message));
    }
  };

  const getResumeName = (resume) => {
    try {
      const json = JSON.parse(resume.originalJson || "{}");
      return json.personalInformation?.fullName || "Untitled Resume";
    } catch {
      return "Untitled Resume";
    }
  };

  return (
    <div className="min-h-screen bg-[#14213B] transition-colors duration-200 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 pb-6 border-b border-[#2C3E5E]">
          <div>
            <h1 className="text-3xl font-semibold text-[#F1F3F6] font-space tracking-tight">
              My Resumes
            </h1>
            <p className="text-[#9AA7BE] font-sans mt-2 text-sm">
              Manage your resumes, track ATS performance, and rollback versions.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isPro ? (
              <span className="text-xs font-semibold bg-[#E8A33D]/10 text-[#E8A33D] px-3 py-1.5 rounded-full border border-[#E8A33D]/20 font-sans flex items-center gap-1.5">
                <FaCrown /> CareerDraft PRO • Unlimited
              </span>
            ) : (
              <span className="text-xs font-semibold bg-[#1E2E4F] text-[#E8A33D] px-3 py-1.5 rounded-full border border-[#2C3E5E] font-sans">
                Resumes: {resumes.length}/2 drafts
              </span>
            )}
            <button
              onClick={handleCreateResume}
              className="bg-[#E8A33D] hover:bg-[#d69430] active:scale-95 text-[#14213B] font-semibold text-sm rounded-[6px] px-5 py-2.5 transition-all font-sans flex items-center gap-2 border-0"
            >
              <FaPlus /> Create Resume
            </button>
          </div>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal 
          isOpen={showUpgradeModal} 
          onClose={() => setShowUpgradeModal(false)} 
          customTitle={upgradeContext.title}
          customSubtitle={upgradeContext.subtitle}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Resumes Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FaSpinner className="animate-spin text-4xl text-[#E8A33D] mb-4" />
                <p className="text-[#9AA7BE] text-sm font-sans">Loading your resume dashboard...</p>
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center bg-[#1E2E4F] border border-[#2C3E5E] rounded-[12px] p-12 shadow-none">
                <div className="w-16 h-16 bg-[#14213B] border border-[#2C3E5E] rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaFileAlt className="text-2xl text-[#9AA7BE]" />
                </div>
                <h3 className="text-xl font-semibold text-[#F1F3F6] font-space mb-2">No resumes yet</h3>
                <p className="text-[#9AA7BE] text-sm font-sans max-w-sm mx-auto mb-6">
                  Create your first resume with AI help to start optimizing for job interviews.
                </p>
                <button
                  onClick={handleCreateResume}
                  className="bg-[#E8A33D] hover:bg-[#d69430] active:scale-95 text-[#14213B] font-semibold text-sm rounded-[6px] px-5 py-2.5 transition-all font-sans flex items-center gap-2 border-0 mx-auto"
                >
                  <FaPlus /> Create Resume
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                
                {resumes.map((resume) => {
                  const name = getResumeName(resume);
                  const template = resume.selectedTemplate || "default";
                  
                  return (
                    <div 
                      key={resume.id}
                      onClick={() => handleEditResume(resume)}
                      className="group cursor-pointer bg-[#1E2E4F] border border-[#2C3E5E] rounded-[12px] p-6 transition-all hover:border-[#E8A33D]/50 flex flex-col justify-between min-h-[300px]"
                    >
                      <div>
                        {/* Resume preview card viewport */}
                        <div className="h-40 rounded-[8px] bg-[#14213B] border border-[#2C3E5E] flex items-center justify-center p-4 mb-4 relative overflow-hidden group-hover:bg-[#14213B]/80 transition-colors">
                          
                          {/* Mini document page thumbnail */}
                          <div className="w-[110px] h-[135px] bg-[#FFFFFF] border border-[#D3D1C7] rounded-[2px] shadow-sm flex flex-col p-2 relative shrink-0">
                            {/* Header stripe based on template */}
                            <div className={`h-2.5 w-full rounded-[1px] mb-2 shrink-0 ${
                              template === "modern" ? "bg-[#3B82F6]" : template === "minimal" ? "bg-[#1B2A4A]" : "bg-[#E8A33D]"
                            }`} />
                            
                            {/* Lines representing text */}
                            <div className="space-y-1">
                              <div className="h-1 w-2/3 bg-[#EDEFF2] rounded-[1px]" />
                              <div className="h-1 w-full bg-[#EDEFF2] rounded-[1px]" />
                              <div className="h-1 w-5/6 bg-[#EDEFF2] rounded-[1px]" />
                              <div className="h-1 w-3/4 bg-[#EDEFF2] rounded-[1px]" />
                              <div className="h-1 w-1/2 bg-[#EDEFF2] rounded-[1px]" />
                            </div>
                            
                            {/* Template Tag */}
                            <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[6px] font-bold font-mono text-[#4A5568] uppercase bg-[#EDEFF2] px-1 py-0.5 rounded-[1px] text-center truncate">
                              {template} template
                            </span>
                          </div>

                          {/* Top-Right corner Score Badge inside card preview */}
                          {resume.atsScoreSnapshot && (
                            <span className="absolute top-2.5 right-2.5 text-[10px] font-bold bg-[#3F9F6B]/15 text-[#3F9F6B] px-2 py-0.5 rounded-full border border-[#3F9F6B]/25 font-sans">
                              Score: {resume.atsScoreSnapshot}
                            </span>
                          )}

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-[#14213B]/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <span className="bg-[#E8A33D] text-[#14213B] text-xs font-semibold px-3.5 py-2 rounded-[6px] flex items-center gap-1.5 active:scale-95 transition-all">
                              <FaEdit /> Edit Draft
                            </span>
                          </div>
                        </div>

                        <h3 className="font-semibold text-[#F1F3F6] font-space text-base group-hover:text-[#E8A33D] transition-colors truncate">
                          {name}
                        </h3>
                        <p className="text-[#9AA7BE] font-sans text-xs mt-1">
                          Last updated: {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#2C3E5E] mt-6 pt-4">
                        <button
                          onClick={(e) => handleViewHistory(resume, e)}
                          className="flex items-center gap-1.5 text-xs text-[#E8A33D] hover:text-[#d69430] font-semibold transition-colors bg-transparent border-0 cursor-pointer"
                        >
                          <FaHistory /> Versions
                        </button>
                        <button
                          onClick={(e) => handleDeleteResume(resume.id, e)}
                          className="text-xs text-[#E85D4E] hover:text-[#b83a2c] font-semibold transition-colors bg-transparent border-0 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add New Resume Placeholder Card */}
                <div 
                  onClick={handleCreateResume}
                  className="group cursor-pointer bg-transparent border-2 border-dashed border-[#2C3E5E] hover:border-[#E8A33D]/50 rounded-[12px] p-6 transition-all flex flex-col items-center justify-center text-center min-h-[300px]"
                >
                  <div className="w-12 h-12 bg-[#1E2E4F] border border-[#2C3E5E] rounded-full flex items-center justify-center mb-4 group-hover:border-[#E8A33D]/50 transition-all">
                    <FaPlus className="text-lg text-[#E8A33D]" />
                  </div>
                  <span className="text-sm font-semibold text-[#9AA7BE] font-space group-hover:text-[#F1F3F6] transition-colors">
                    Create another resume
                  </span>
                </div>

              </div>
            )}
          </div>

          {/* Version history panel */}
          {selectedResumeForHistory && (
            <div className="w-full lg:w-96 shrink-0 bg-[#1E2E4F] border border-[#2C3E5E] rounded-[12px] p-6 shadow-none h-fit animate-slideIn">
              <div className="flex items-center justify-between pb-4 border-b border-[#2C3E5E] mb-4">
                <div className="flex items-center gap-2">
                  <FaHistory className="text-[#E8A33D]" />
                  <h3 className="font-semibold text-[#F1F3F6] font-space text-lg">
                    Version History
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedResumeForHistory(null)}
                  className="text-[#9AA7BE] hover:text-[#F1F3F6] transition-colors bg-transparent border-0 cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-xs text-[#9AA7BE] font-sans">
                  Showing historical versions for:
                </p>
                <p className="text-sm font-semibold text-[#F1F3F6] font-space truncate">
                  {getResumeName(selectedResumeForHistory)}
                </p>
              </div>

              {isLoadingVersions ? (
                <div className="flex justify-center py-10">
                  <FaSpinner className="animate-spin text-2xl text-[#E8A33D]" />
                </div>
              ) : versions.length === 0 ? (
                <p className="text-center text-[#9AA7BE] text-sm py-10 font-sans">No versions found.</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {versions.map((ver) => (
                    <div 
                      key={ver.id}
                      className="bg-[#14213B] p-4 rounded-xl border border-[#2C3E5E] hover:border-[#E8A33D]/30 transition-all flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-[#E8A33D] bg-[#1E2E4F] border border-[#2C3E5E] px-2.5 py-0.5 rounded-full">
                          v{ver.versionNumber}
                        </span>
                        {ver.atsScoreSnapshot && (
                          <span className="text-[10px] font-bold bg-[#3F9F6B]/15 text-[#3F9F6B] px-1.5 py-0.5 rounded border border-[#3F9F6B]/25">
                            Score: {ver.atsScoreSnapshot}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm font-semibold text-[#F1F3F6] font-space mb-2">
                        {ver.description || "Auto-saved update"}
                      </p>
                      
                      <p className="text-[10px] text-[#9AA7BE] mt-1 font-sans">
                        {new Date(ver.createdAt).toLocaleString()}
                      </p>

                      <button
                        onClick={() => handleRollback(ver.id)}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-[#1E2E4F] hover:bg-[#1E2E4F]/85 text-xs font-semibold text-[#F1F3F6] border border-[#2C3E5E] rounded-lg transition-colors cursor-pointer"
                      >
                        <FaUndo size={10} /> Rollback to this Version
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResumeDashboard;
