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

const ResumeDashboard = () => {
  const { user } = useAuth();
  const { updateResumeData, updateTemplate } = useResume();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
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
    const isPro = user?.isPro || user?.role === "ROLE_PRO";
    if (!isPro && resumes.length >= 1) {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Resumes
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Manage your resumes, track ATS performance, and rollback versions.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {!user?.isPro && (
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                Resumes: {resumes.length}/1 draft
              </span>
            )}
            <button
              onClick={handleCreateResume}
              className="btn-brand flex items-center gap-2 font-semibold"
            >
              <FaPlus /> Create Resume
            </button>
          </div>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Resumes Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
                <p className="text-slate-500 text-sm">Loading your resume dashboard...</p>
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center bg-white dark:bg-slate-900 rounded-3xl p-12 shadow-card border border-slate-100 dark:border-slate-800/80">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaFileAlt className="text-2xl text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No resumes yet</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-6">
                  Create your first resume with AI help to start optimizing for job interviews.
                </p>
                <button
                  onClick={handleCreateResume}
                  className="btn-brand flex items-center gap-2 mx-auto font-semibold"
                >
                  <FaPlus /> Create Resume
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {resumes.map((resume) => {
                  const name = getResumeName(resume);
                  const status = resume.currentStatus || "ORIGINAL";
                  const template = resume.selectedTemplate || "default";
                  
                  return (
                    <div 
                      key={resume.id}
                      onClick={() => handleEditResume(resume)}
                      className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Resume preview card placeholder */}
                        <div className="h-40 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between p-4 mb-4 relative overflow-hidden group-hover:bg-slate-100/50 dark:group-hover:bg-slate-900/50 transition-colors">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
                              {template} template
                            </span>
                            {resume.atsScoreSnapshot && (
                              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                                ATS Score: {resume.atsScoreSnapshot}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-2 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                          </div>

                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <FaEdit /> Edit Draft
                          </div>
                        </div>

                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg group-hover:text-indigo-600 transition-colors truncate">
                          {name}
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">
                          Last updated: {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 mt-6 pt-4">
                        <button
                          onClick={(e) => handleViewHistory(resume, e)}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors"
                        >
                          <FaHistory /> Versions
                        </button>
                        <button
                          onClick={(e) => handleDeleteResume(resume.id, e)}
                          className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Version history panel */}
          {selectedResumeForHistory && (
            <div className="w-full lg:w-96 shrink-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-card h-fit animate-slideIn">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <FaHistory className="text-indigo-600" />
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">
                    Version History
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedResumeForHistory(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-400">
                  Showing historical versions for:
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                  {getResumeName(selectedResumeForHistory)}
                </p>
              </div>

              {isLoadingVersions ? (
                <div className="flex justify-center py-10">
                  <FaSpinner className="animate-spin text-2xl text-indigo-600" />
                </div>
              ) : versions.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-10">No versions found.</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {versions.map((ver) => (
                    <div 
                      key={ver.id}
                      className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-750 transition-all flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                          v{ver.versionNumber}
                        </span>
                        {ver.atsScoreSnapshot && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                            Score: {ver.atsScoreSnapshot}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {ver.description || "Auto-saved update"}
                      </p>
                      
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(ver.createdAt).toLocaleString()}
                      </p>

                      <button
                        onClick={() => handleRollback(ver.id)}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
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
