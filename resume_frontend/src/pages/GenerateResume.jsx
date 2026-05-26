import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaBrain, FaMagic, FaPlus, FaTrash, FaChevronRight,
  FaChevronLeft, FaPrint, FaEye, FaCheck,
  FaSpinner, FaLightbulb, FaUser, FaCode, FaBriefcase,
  FaGraduationCap, FaFolderOpen, FaFileAlt,
  FaExclamationTriangle, FaCheckCircle, FaCrown, FaShieldAlt,
  FaTimes, FaChevronDown
} from "react-icons/fa";
import { 
  generateResume, 
  enhanceResume, 
  enhanceBullet,
  getResumeById,
  updateResume,
  createResume,
  getMyResumes,
  trackExport,
  analyzeStructuredResume
} from "../api/ResumeService";
import { useResume } from "../context/ResumeContext";
import { useAuth } from "../context/AuthContext";
import { useReactToPrint } from "react-to-print";
import UpgradeModal from "../components/UpgradeModal";
import DefaultTemplate from "../components/Templates/DefaultTemplate";
import ModernTemplate from "../components/Templates/ModernTemplate";
import MinimalistTemplate from "../components/Templates/MinimalistTemplate";
import DynamicTemplate, { SAMPLE_DATA } from "../templates/DynamicTemplate";
import { getTemplate, TEMPLATES, THEMES, FONTS } from "../templates/templateConfig";
import { PREVIEW_DATA } from "../templates/templatePreviewData";


const EMPTY = {
  personalInformation: {
    fullName: "",
    email: "",
    phoneNumber: "",
    location: "",
    targetJobTitle: "",
    profilePhoto: "",
    links: []
  },
  sections: [
    { id: "summary", type: "summary", title: "Professional Summary", data: "", order: 0, visible: true },
    { id: "skills", type: "skills", title: "Skills", data: [], order: 1, visible: true },
    { id: "experience", type: "experience", title: "Work Experience", data: [], order: 2, visible: true },
    { id: "education", type: "education", title: "Education", data: [], order: 3, visible: true },
    { id: "projects", type: "projects", title: "Projects", data: [], order: 4, visible: true }
  ]
};

const syncResumeData = (d) => {
  if (!d) return d;
  const updatedDraft = { ...d };
  
  if (!Array.isArray(updatedDraft.sections)) {
    updatedDraft.sections = [];
  }
  
  const coreTypes = ["summary", "skills", "experience", "education", "projects"];
  coreTypes.forEach(type => {
    let sec = updatedDraft.sections.find(s => s.type === type);
    if (!sec) {
      const maxOrder = updatedDraft.sections.length > 0 
        ? Math.max(...updatedDraft.sections.map(s => s.order ?? 0)) + 1 
        : 0;
      sec = {
        id: type,
        type,
        title: type === "summary" ? "Professional Summary" : 
               type === "skills" ? "Skills" : 
               type === "experience" ? "Work Experience" : 
               type === "education" ? "Education" : 
               type === "projects" ? "Projects" : type,
        data: updatedDraft[type] || (type === "summary" ? "" : []),
        order: maxOrder,
        visible: true
      };
      updatedDraft.sections.push(sec);
    } else {
      sec.data = updatedDraft[type];
    }
  });

  updatedDraft.sections.forEach(sec => {
    if (sec.type) {
      updatedDraft[sec.type] = sec.data;
    }
  });

  updatedDraft.sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return updatedDraft;
};

const normalizeResumeData = (d) => {
  if (!d) return EMPTY;
  
  const pi = d.personalInformation || {};
  const links = Array.isArray(pi.links) ? [...pi.links] : [];
  if (links.length === 0) {
    if (pi.linkedIn) links.push({ platform: "LinkedIn", url: pi.linkedIn });
    if (pi.gitHub) links.push({ platform: "GitHub", url: pi.gitHub });
    if (pi.portfolio) links.push({ platform: "Portfolio", url: pi.portfolio });
  }

  const personalInformation = {
    fullName: pi.fullName || "",
    email: pi.email || "",
    phoneNumber: pi.phoneNumber || "",
    location: pi.location || "",
    targetJobTitle: pi.targetJobTitle || "",
    profilePhoto: pi.profilePhoto || "",
    links
  };

  let sections = [];
  if (Array.isArray(d.sections) && d.sections.length > 0) {
    sections = d.sections.map((s, idx) => {
      return {
        id: s.id || s.type || `section_${idx}`,
        type: s.type || "custom",
        title: s.title || "Section",
        data: s.data,
        order: s.order ?? idx,
        visible: s.visible !== false
      };
    });
  } else {
    // Generate sections from legacy keys
    let order = 0;
    
    // Summary
    sections.push({ 
      id: "summary", 
      type: "summary", 
      title: "Professional Summary", 
      data: d.summary || "", 
      order: order++, 
      visible: true 
    });

    // Skills
    const skills = Array.isArray(d.skills) ? d.skills.map(s => {
      if (typeof s === "string") return { title: s, level: "Intermediate" };
      return { title: s.title || s.name || "", level: s.level || "Intermediate" };
    }) : [];
    sections.push({ id: "skills", type: "skills", title: "Skills", data: skills, order: order++, visible: true });

    // Experience
    const experience = Array.isArray(d.experience) ? d.experience.map(e => {
      return {
        title: e.title || e.jobTitle || "",
        company: e.company || "",
        startDate: e.startDate || e.duration || "",
        endDate: e.endDate || "",
        description: e.description || e.responsibility || e.responsibilities || ""
      };
    }) : [];
    sections.push({ id: "experience", type: "experience", title: "Work Experience", data: experience, order: order++, visible: true });

    // Education
    const education = Array.isArray(d.education) ? d.education.map(edu => {
      return {
        degree: edu.degree || "",
        institution: edu.institution || edu.university || "",
        startDate: edu.startDate || "",
        endDate: edu.endDate || edu.graduationYear || "",
        description: edu.description || ""
      };
    }) : [];
    sections.push({ id: "education", type: "education", title: "Education", data: education, order: order++, visible: true });

    // Projects
    const projects = Array.isArray(d.projects) ? d.projects.map(p => {
      return {
        title: p.title || "",
        description: p.description || "",
        link: p.link || p.githubLink || ""
      };
    }) : [];
    sections.push({ id: "projects", type: "projects", title: "Projects", data: projects, order: order++, visible: true });

    // Certifications
    if (Array.isArray(d.certifications) && d.certifications.length > 0) {
      const certifications = d.certifications.map(c => ({
        title: c.title || "", issuer: c.issuer || "", issueDate: c.issueDate || ""
      }));
      sections.push({ id: "certifications", type: "certifications", title: "Certifications", data: certifications, order: order++, visible: true });
    }
    // Languages
    if (Array.isArray(d.languages) && d.languages.length > 0) {
      const languages = d.languages.map(l => ({
        language: l.language || l.name || "", proficiency: l.proficiency || "Professional working proficiency"
      }));
      sections.push({ id: "languages", type: "languages", title: "Languages", data: languages, order: order++, visible: true });
    }
    // Interests
    if (Array.isArray(d.interests) && d.interests.length > 0) {
      const interests = d.interests.map(i => ({ interest: i.interest || i.name || "" }));
      sections.push({ id: "interests", type: "interests", title: "Interests", data: interests, order: order++, visible: true });
    }
  }

  // Ensure sections are sorted
  sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const result = {
    personalInformation,
    sections,
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: []
  };

  // Sync sections to top-level keys for backward-compatibility
  sections.forEach(s => {
    result[s.type] = s.data;
  });

  return syncResumeData(result);
};

// ── Steps config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: "basics",     label: "Personal Info",  icon: FaUser,         desc: "Name, contact, links" },
  { id: "summary",    label: "Summary",        icon: FaFileAlt,      desc: "Professional headline" },
  { id: "skills",     label: "Skills",         icon: FaCode,         desc: "Technical & soft skills" },
  { id: "experience", label: "Experience",     icon: FaBriefcase,    desc: "Work history" },
  { id: "education",  label: "Education",      icon: FaGraduationCap, desc: "Degrees & courses" },
  { id: "projects",   label: "Projects",       icon: FaFolderOpen,   desc: "Portfolio & side projects" },
];

// ── AI Improve button dropdown ─────────────────────────────────────────────────
const AIDropdown = ({ onSelect, loading, small = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = [
    { key: "optimize", label: "Auto-Optimize", desc: "General ATS rewrite", icon: "✨" },
    { key: "impact", label: "Increase Impact", desc: "Focus on action verbs", icon: "🚀" },
    { key: "metrics", label: "Add Metrics", desc: "Focus on quantification", icon: "📊" },
    { key: "ats", label: "ATS Keyword Align", desc: "Align with Job Description", icon: "🎯" }
  ];
  return (
    <div className="relative inline-block text-left">
      <div>
        <button 
          type="button" 
          onClick={() => setIsOpen(p => !p)} 
          disabled={loading}
          className={`inline-flex items-center gap-1.5 rounded-lg font-semibold text-indigo-650 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150/40 transition-all active:scale-95 disabled:opacity-50
            ${small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs"}`}
        >
          {loading ? <FaSpinner className="animate-spin" size={10} /> : <FaMagic size={10} />}
          {!small && "AI Enhance"}
          <span className="text-[8px] opacity-70">▼</span>
        </button>
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl z-30 py-1 divide-y divide-slate-100 dark:divide-slate-850 animate-fadeIn text-left">
            {options.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => { onSelect(opt.key); setIsOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-950 flex items-start gap-2 transition-colors border-0"
              >
                <span className="text-sm mt-0.5">{opt.icon}</span>
                <div>
                  <span className="block text-xs font-bold text-slate-805 dark:text-slate-200">{opt.label}</span>
                  <span className="block text-[9px] text-slate-400">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Score ring ────────────────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="-rotate-90 w-16 h-16 absolute">
        <circle cx="32" cy="32" r={r} stroke="#e5e7eb" strokeWidth="5" fill="none" />
        <circle cx="32" cy="32" r={r} stroke={color} strokeWidth="5" fill="none"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="text-sm font-bold relative z-10" style={{ color }}>{score}</span>
    </div>
  );
};

// ── Step: Basics ──────────────────────────────────────────────────────────────
const StepBasics = ({ data, onChange }) => {
  const pi = data.personalInformation || {};
  const set = (field, val) => onChange({ ...data, personalInformation: { ...pi, [field]: val } });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Crop & resize to a standard 120x120px square
        const size = 120;
        canvas.width = size;
        canvas.height = size;
        
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const croppedBase64 = canvas.toDataURL("image/jpeg", 0.8);
        set("profilePhoto", croppedBase64);
        toast.success("Profile photo uploaded and optimized!");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    set("profilePhoto", "");
    toast.success("Profile photo removed.");
  };

  const addLink = () => {
    const links = Array.isArray(pi.links) ? [...pi.links] : [];
    links.push({ platform: "LinkedIn", url: "" });
    set("links", links);
  };

  const removeLink = (idx) => {
    const links = Array.isArray(pi.links) ? pi.links.filter((_, i) => i !== idx) : [];
    set("links", links);
  };

  const updateLink = (idx, field, val) => {
    const links = Array.isArray(pi.links) ? [...pi.links] : [];
    links[idx] = { ...links[idx], [field]: val };
    set("links", links);
  };

  const PLATFORMS = [
    "LinkedIn", "GitHub", "Portfolio", "Website", "Behance", 
    "Dribbble", "Medium", "Kaggle", "ResearchGate", "StackOverflow", "Other"
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Personal Information
          {(!pi.fullName || !pi.email) ? (
            <span className="badge badge-warning text-[10px] gap-1 font-bold py-2"><FaExclamationTriangle size={8} /> Needs Contact Info</span>
          ) : (
            <span className="badge badge-success text-[10px] gap-1 font-bold py-2"><FaCheck size={8} className="text-white" /> Complete</span>
          )}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Your contact details, profile photo and professional links</p>
      </div>

      {/* Profile Photo Uploader */}
      <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-4">
        {pi.profilePhoto ? (
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500 shrink-0">
            <img src={pi.profilePhoto} alt="Profile Preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-500 shrink-0 border border-dashed border-indigo-200">
            <FaUser size={20} />
          </div>
        )}
        <div className="space-y-1.5">
          <span className="block text-xs font-bold text-gray-700">Profile Image (Optional)</span>
          <div className="flex gap-2">
            <label className="btn btn-xs btn-outline btn-primary px-3 py-1 cursor-pointer h-7 min-h-7 rounded-lg text-[10px] font-bold">
              Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            {pi.profilePhoto && (
              <button type="button" onClick={removePhoto} className="btn btn-xs btn-outline btn-error px-3 py-1 h-7 min-h-7 rounded-lg text-[10px] font-bold">
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Target Job Title */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target Job Title</label>
        <input 
          type="text" 
          value={pi.targetJobTitle || ""} 
          onChange={e => set("targetJobTitle", e.target.value)}
          className="input-light" 
          placeholder="e.g. Java Developer, Business Analyst, Teacher" 
        />
      </div>

      {/* Contact Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          ["fullName", "Full Name", "text", !pi.fullName, "Please enter your name"],
          ["email", "Email", "email", !pi.email, "Required for recruiter contact"],
          ["phoneNumber", "Phone", "tel", false],
          ["location", "Location", "text", false],
        ].map(([field, label, type, isWarning, warningText]) => (
          <div key={field} className={isWarning ? "p-1 rounded-xl ring-2 ring-amber-500/10 bg-amber-500/5 transition-all duration-300" : ""}>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex justify-between">
              <span>{label}</span>
              {isWarning && <span className="text-[9px] text-amber-650 font-bold flex items-center gap-1"><FaExclamationTriangle size={8} /> {warningText}</span>}
            </label>
            <input type={type} value={pi[field] || ""} onChange={e => set(field, e.target.value)}
              className={`input-light ${isWarning ? "border-amber-300 focus:border-amber-500 focus:ring-amber-500/20" : ""}`} placeholder={label} />
          </div>
        ))}
      </div>

      {/* Professional Links */}
      <div className="space-y-3.5 border-t border-gray-100 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Professional Links</span>
          <button type="button" onClick={addLink} className="btn btn-xs btn-primary gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg">
            <FaPlus size={8} /> Add Link
          </button>
        </div>

        <div className="space-y-2">
          {Array.isArray(pi.links) && pi.links.map((link, idx) => (
            <div key={idx} className="flex gap-2 items-center animate-fadeIn">
              <select 
                value={link.platform} 
                onChange={e => updateLink(idx, "platform", e.target.value)}
                className="input-light w-36 cursor-pointer text-xs"
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input 
                type="url" 
                value={link.url || ""} 
                onChange={e => updateLink(idx, "url", e.target.value)}
                placeholder="https://..." 
                className="input-light flex-1 text-xs"
              />
              <button 
                type="button" 
                onClick={() => removeLink(idx)} 
                className="text-gray-300 hover:text-red-500 transition-colors p-2"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
          {(!Array.isArray(pi.links) || pi.links.length === 0) && (
            <p className="text-xs text-gray-400 py-1">No professional links added yet. Click 'Add Link' above.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Step: Summary ─────────────────────────────────────────────────────────────
const StepSummary = ({ data, onChange, user, setShowUpgradeModal, refreshUser, rewriteCount = 0, setRewriteCount, setShowLimitUpgrade }) => {
  const [improving, setImproving] = useState(false);
  const improve = async (enhanceType) => {
    if (!user) {
      toast.error("Please sign in or register to use AI features.");
      return;
    }
    const isPro = user.isPro || user.role === "ROLE_PRO";
    if (!isPro && rewriteCount >= 3) {
      if (setShowLimitUpgrade) {
        setShowLimitUpgrade(true);
      } else {
        setShowUpgradeModal(true);
      }
      return;
    }
    if (!data.summary.trim()) { toast.error("Write a summary first"); return; }
    setImproving(true);
    try {
      let context = "professional summary";
      if (enhanceType === "impact") {
        context = "professional summary: focus on strong action verbs, leadership tone and high-impact phrasing";
      } else if (enhanceType === "metrics") {
        context = "professional summary: focus on adding measurable business metrics, team size, budget responsibilities, and scale";
      } else if (enhanceType === "ats") {
        context = "professional summary: optimize alignment against standard resume indexing requirements and keyword density";
      }

      const improved = await enhanceBullet(data.summary, context);
      onChange({ ...data, summary: improved });
      toast.success("Summary improved!");
      if (setRewriteCount) setRewriteCount(p => p + 1);
      refreshUser();
    } catch { toast.error("AI improvement failed"); }
    finally { setImproving(false); }
  };
  
  const isWeak = !data.summary || data.summary.length < 100 || !/\d+/.test(data.summary);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Professional Summary
            {isWeak ? (
              <span className="badge badge-warning text-[10px] font-bold py-2"><FaExclamationTriangle size={8} /> Needs Metrics</span>
            ) : (
              <span className="badge badge-success text-[10px] font-bold py-2"><FaCheck size={8} className="text-white" /> High Impact</span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">2-3 sentences about your experience and achievements</p>
        </div>
        <AIDropdown onSelect={improve} loading={improving} />
      </div>
      <div className={isWeak ? "p-1.5 rounded-2xl ring-2 ring-amber-500/10 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.15)] transition-all duration-300" : ""}>
        {isWeak && (
          <p className="text-[10px] text-amber-700 font-bold mb-2 flex items-center gap-1 px-1">
            <FaExclamationTriangle size={9} /> 
            {!data.summary 
              ? "Summary is empty. AI needs text to enhance it." 
              : data.summary.length < 100 
                ? "Lacks depth. Make it longer (Aim for 200-400 chars)." 
                : "Missing metrics: Add numbers, percentages, or scale."}
          </p>
        )}
        <textarea value={data.summary} onChange={e => onChange({ ...data, summary: e.target.value })}
          className={`textarea-light h-32 ${isWeak ? "border-amber-300 focus:border-amber-500 focus:ring-amber-500/20" : ""}`}
          placeholder="e.g. Full-stack developer with 3 years of experience building scalable web applications using Java and React..." />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{data.summary.length} characters</span>
        <span className={data.summary.length >= 200 && data.summary.length <= 400 ? "text-green-500 font-bold" : ""}>
          Aim for 200–400 chars
        </span>
      </div>
    </div>
  );
};

// ── Step: Skills ──────────────────────────────────────────────────────────────
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const StepSkills = ({ data, onChange, atsContext }) => {
  const [input, setInput] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const add = () => {
    if (!input.trim()) return;
    if (data.skills.some(s => s.title.toLowerCase() === input.trim().toLowerCase())) {
      toast.error("Skill already exists");
      return;
    }
    onChange({ ...data, skills: [...data.skills, { title: input.trim(), level }] });
    setInput("");
  };
  const remove = (i) => onChange({ ...data, skills: data.skills.filter((_, idx) => idx !== i) });
  
  const addSkillInstant = (skillName) => {
    if (data.skills.some(s => s.title.toLowerCase() === skillName.toLowerCase())) {
      toast.error("Skill already exists");
      return;
    }
    onChange({ ...data, skills: [...data.skills, { title: skillName, level: "Intermediate" }] });
    toast.success(`Added "${skillName}" to skills!`);
  };

  const missingSkills = atsContext?.missingSkills || atsContext?.atsAnalysis?.categorizedMissingSkills || atsContext?.atsAnalysis?.missingKeywords || [];
  const unaddedMissing = missingSkills.filter(
    ms => {
      const skillName = typeof ms === "string" ? ms : ms?.name || "";
      if (!skillName) return false;
      return !data.skills.some(s => s.title.toLowerCase() === skillName.toLowerCase());
    }
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Skills
          {unaddedMissing.length > 0 ? (
            <span className="badge badge-warning text-[10px] font-bold py-2"><FaExclamationTriangle size={8} /> {unaddedMissing.length} Target Gaps</span>
          ) : (
            <span className="badge badge-success text-[10px] font-bold py-2"><FaCheck size={8} className="text-white" /> Optimised Match</span>
          )}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Add your technical and professional skills</p>
      </div>

      {unaddedMissing.length > 0 && (
        <div className="p-4 bg-amber-50/60 dark:bg-slate-900/30 border border-amber-100 rounded-2xl animate-fadeIn">
          <p className="text-xs font-bold text-amber-850 mb-2 flex items-center gap-1.5">
            <FaLightbulb className="text-amber-500 animate-pulse" /> Add missing critical keywords from Job Description:
          </p>
          <div className="flex flex-wrap gap-2">
            {unaddedMissing.slice(0, 10).map(s => {
              const skillName = typeof s === "string" ? s : s?.name || "";
              return (
                <button 
                  key={skillName} 
                  type="button"
                  onClick={() => addSkillInstant(skillName)}
                  className="badge bg-amber-100 text-amber-700 hover:bg-indigo-500 hover:text-white border border-amber-200/50 hover:border-indigo-500 font-semibold px-3 py-2 cursor-pointer transition-all flex items-center gap-1 text-xs"
                >
                  + {skillName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          className="input-light flex-1" placeholder="e.g. React, Spring Boot, Docker…" />
        <select value={level} onChange={e => setLevel(e.target.value)}
          className="input-light w-32 cursor-pointer">
          {SKILL_LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
        <button onClick={add}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:shadow-brand transition-all active:scale-95 shrink-0">
          <FaPlus size={12} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {data.skills.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-3 py-1.5 text-sm font-medium animate-fadeIn">
            {s.title}
            <span className="text-xs text-indigo-400 bg-white rounded-full px-1.5 py-0.5 border border-indigo-100">{s.level}</span>
            <button onClick={() => remove(i)} className="text-indigo-300 hover:text-red-400 transition-colors ml-0.5">
              <FaTrash size={9} />
            </button>
          </span>
        ))}
        {data.skills.length === 0 && (
          <p className="text-sm text-gray-400 py-2">No skills added yet — type a skill and press Enter</p>
        )}
      </div>
    </div>
  );
};

// ── Step: Experience ──────────────────────────────────────────────────────────
const StepExperience = ({ data, onChange, user, setShowUpgradeModal, refreshUser, rewriteCount = 0, setRewriteCount, setShowLimitUpgrade }) => {
  const [improving, setImproving] = useState({});
  const add = () => onChange({ ...data, experience: [...data.experience, { title: "", company: "", startDate: "", endDate: "", description: "" }] });
  const remove = (i) => onChange({ ...data, experience: data.experience.filter((_, idx) => idx !== i) });
  const update = (i, field, val) => {
    const exp = [...data.experience];
    exp[i] = { ...exp[i], [field]: val };
    onChange({ ...data, experience: exp });
  };
  const improve = async (i, enhanceType) => {
    if (!user) {
      toast.error("Please sign in or register to use AI features.");
      return;
    }
    const isPro = user.isPro || user.role === "ROLE_PRO";
    if (!isPro && rewriteCount >= 3) {
      if (setShowLimitUpgrade) {
        setShowLimitUpgrade(true);
      } else {
        setShowUpgradeModal(true);
      }
      return;
    }
    const desc = data.experience[i].description;
    if (!desc.trim()) { toast.error("Write a description first"); return; }
    setImproving(p => ({ ...p, [i]: true }));
    try {
      let context = `${data.experience[i].title} at ${data.experience[i].company}`;
      if (enhanceType === "impact") {
        context = `professional experience: focus on strong action verbs, leadership tone and high-impact phrasing for ${context}`;
      } else if (enhanceType === "metrics") {
        context = `professional experience: focus on adding measurable business metrics, cost/time saved, and scale for ${context}`;
      } else if (enhanceType === "ats") {
        context = `professional experience: optimize keyword matching density for ${context}`;
      }

      const improved = await enhanceBullet(desc, context);
      
      let currentText = "";
      const words = improved.split(" ");
      let wordIdx = 0;
      const interval = setInterval(() => {
        if (wordIdx < words.length) {
          currentText += (wordIdx === 0 ? "" : " ") + words[wordIdx];
          update(i, "description", currentText);
          wordIdx++;
        } else {
          clearInterval(interval);
          setImproving(p => ({ ...p, [i]: false }));
          toast.success("Description improved!");
          if (setRewriteCount) setRewriteCount(p => p + 1);
          refreshUser();
        }
      }, 30);
    } catch { 
      toast.error("AI improvement failed"); 
      setImproving(p => ({ ...p, [i]: false }));
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Work Experience
            {data.experience.some(e => !e.description || !/\d+/.test(e.description)) ? (
              <span className="badge badge-warning text-[10px] font-bold py-2"><FaExclamationTriangle size={8} /> Needs Metrics</span>
            ) : (
              <span className="badge badge-success text-[10px] font-bold py-2"><FaCheck size={8} className="text-white" /> Optimized</span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Add your professional history</p>
        </div>
        <button onClick={add} className="btn-brand flex items-center gap-1.5 text-xs px-3 py-2">
          <FaPlus size={10} /> Add
        </button>
      </div>
      {data.experience.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
          <FaBriefcase className="text-3xl mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No experience added yet</p>
        </div>
      )}
      {data.experience.map((exp, i) => {
        const hasNoMetrics = !exp.description || !/\d+/.test(exp.description);
        return (
          <div key={i} className={`bg-white rounded-2xl border shadow-card p-5 space-y-3 transition-all duration-300 ${hasNoMetrics ? "border-amber-250 ring-2 ring-amber-500/10 bg-amber-50/5 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : "border-gray-100"}`}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                Position {i + 1}
                {hasNoMetrics && (
                  <span className="text-[9px] text-amber-600 font-bold bg-amber-100/50 px-2 py-0.5 rounded flex items-center gap-0.5">
                    <FaExclamationTriangle size={7} /> Missing metrics/numbers
                  </span>
                )}
              </span>
              <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                <FaTrash size={12} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={exp.title} onChange={e => update(i, "title", e.target.value)}
                className="input-light" placeholder="Job Title" />
              <input value={exp.company} onChange={e => update(i, "company", e.target.value)}
                className="input-light" placeholder="Company" />
              <input value={exp.startDate} onChange={e => update(i, "startDate", e.target.value)}
                className="input-light" placeholder="Start (e.g. Jan 2022)" />
              <input value={exp.endDate} onChange={e => update(i, "endDate", e.target.value)}
                className="input-light" placeholder="End (or Present)" />
            </div>
            <div className="relative">
              <textarea value={exp.description} onChange={e => update(i, "description", e.target.value)}
                disabled={improving[i]}
                className={`textarea-light h-24 pr-28 transition-all duration-300 ${improving[i] ? "opacity-60 pointer-events-none" : ""} ${hasNoMetrics ? "border-amber-300 focus:border-amber-500 focus:ring-amber-500/20" : ""}`}
                placeholder="Describe your responsibilities and achievements. Use action verbs and numbers." />
              <div className="absolute top-2.5 right-2.5">
                <AIDropdown onSelect={(type) => improve(i, type)} loading={!!improving[i]} small />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Step: Education ───────────────────────────────────────────────────────────
const StepEducation = ({ data, onChange }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const add = () => onChange({ ...data, education: [...data.education, { degree: "", institution: "", startDate: "", endDate: "", description: "" }] });
  const remove = (i) => onChange({ ...data, education: data.education.filter((_, idx) => idx !== i) });
  const update = (i, field, val) => {
    const edu = [...data.education];
    edu[i] = { ...edu[i], [field]: val };
    onChange({ ...data, education: edu });
  };

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Education</h2>
          <p className="text-sm text-gray-500 mt-0.5">Degrees, diplomas, and courses</p>
        </div>
        <button onClick={add} className="btn-brand flex items-center gap-1.5 text-xs px-3 py-2">
          <FaPlus size={10} /> Add
        </button>
      </div>
      {data.education.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
          <FaGraduationCap className="text-3xl mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No education added yet</p>
        </div>
      )}
      {data.education.map((edu, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Degree {i + 1}</span>
            <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
              <FaTrash size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={edu.degree} onChange={e => update(i, "degree", e.target.value)}
              className="input-light" placeholder="Degree (e.g. B.Tech Computer Science)" />
            <input value={edu.institution} onChange={e => update(i, "institution", e.target.value)}
              className="input-light" placeholder="Institution" />
            <input value={edu.startDate} onChange={e => update(i, "startDate", e.target.value)}
              className="input-light" placeholder="Start Year" />
            <input value={edu.endDate} onChange={e => update(i, "endDate", e.target.value)}
              className="input-light" placeholder="End Year (or Present)" />
          </div>

          <div className="pt-1.5">
            <button
              type="button"
              onClick={() => toggleExpand(i)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
            >
              {expandedIndex === i ? "▼" : "▶"} [ Optional Details ]
            </button>
            {expandedIndex === i && (
              <div className="mt-2.5 animate-fadeIn">
                <textarea
                  value={edu.description || ""}
                  onChange={e => update(i, "description", e.target.value)}
                  className="textarea-light h-24"
                  placeholder="coursework, thesis, GPA explanation, achievements, academic projects, honors"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Step: Projects ────────────────────────────────────────────────────────────
const StepProjects = ({ data, onChange, user, setShowUpgradeModal, refreshUser }) => {
  const [improving, setImproving] = useState({});
  const add = () => onChange({ ...data, projects: [...data.projects, { title: "", description: "", link: "" }] });
  const remove = (i) => onChange({ ...data, projects: data.projects.filter((_, idx) => idx !== i) });
  const update = (i, field, val) => {
    const proj = [...data.projects];
    proj[i] = { ...proj[i], [field]: val };
    onChange({ ...data, projects: proj });
  };
  const improve = async (i, enhanceType) => {
    if (!user) {
      toast.error("Please sign in or register to use AI features.");
      return;
    }
    const isPro = user.isPro || user.role === "ROLE_PRO";
    if (!isPro && user.enhanceCount >= 2) {
      setShowUpgradeModal(true);
      return;
    }
    const desc = data.projects[i].description;
    if (!desc.trim()) { toast.error("Write a description first"); return; }
    setImproving(p => ({ ...p, [i]: true }));
    try {
      let context = `project: ${data.projects[i].title}`;
      if (enhanceType === "impact") {
        context = `professional project description: focus on strong action verbs, technical leadership, and high-impact wording for ${context}`;
      } else if (enhanceType === "metrics") {
        context = `professional project description: focus on adding measurable metrics, number of active users, query time reductions, or scale for ${context}`;
      } else if (enhanceType === "ats") {
        context = `professional project description: optimize for keyword density alignment for ${context}`;
      }

      const improved = await enhanceBullet(desc, context);
      update(i, "description", improved);
      toast.success("Description improved!");
      refreshUser();
    } catch { toast.error("AI improvement failed"); }
    finally { setImproving(p => ({ ...p, [i]: false })); }
  };
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500 mt-0.5">Showcase your portfolio and side projects</p>
        </div>
        <button onClick={add} className="btn-brand flex items-center gap-1.5 text-xs px-3 py-2">
          <FaPlus size={10} /> Add
        </button>
      </div>
      {data.projects.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
          <FaFolderOpen className="text-3xl mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No projects added yet</p>
        </div>
      )}
      {data.projects.map((proj, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Project {i + 1}</span>
            <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
              <FaTrash size={12} />
            </button>
          </div>
          <input value={proj.title} onChange={e => update(i, "title", e.target.value)}
            className="input-light" placeholder="Project Title" />
          <input value={proj.link} onChange={e => update(i, "link", e.target.value)}
            className="input-light" placeholder="GitHub / Live URL (optional)" />
          <div className="relative">
            <textarea value={proj.description} onChange={e => update(i, "description", e.target.value)}
              className="textarea-light h-20 pr-28 animate-fadeIn"
              placeholder="What did you build? What tech did you use? What was the impact?" />
            <div className="absolute top-2.5 right-2.5">
              <AIDropdown onSelect={(type) => improve(i, type)} loading={!!improving[i]} small />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Resume preview (right panel) ──────────────────────────────────────────────
const ResumePreview = ({ data, template, onTemplateChange, printRef }) => {
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const { selectedTheme, selectedFont, updateTheme, updateFont } = useResume();

  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.getBoundingClientRect().width;
      // 595px is the standard A4 unscaled layout width. We leave a 32px padding/margin.
      const newScale = Math.min(1, (width - 32) / 595);
      setScale(newScale);
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const renderTemplate = () => {
    if (!data?.personalInformation?.fullName && !data?.summary) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3 py-20 bg-white dark:bg-slate-900 rounded-xl">
          <FaFileAlt className="text-5xl" />
          <p className="text-sm font-medium">Start filling in your details</p>
          <p className="text-xs">Your resume preview appears here in real-time</p>
        </div>
      );
    }
    const baseConfig = getTemplate(template);
    const config = {
      ...baseConfig,
      theme: selectedTheme || "slate",
      font: selectedFont || "inter"
    };
    return <DynamicTemplate data={data} config={config} />;
  };

  const currentConfig = getTemplate(template);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl shadow-card p-4 relative">
      {/* Header with customization controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800 shrink-0">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Layout Style</span>
          <span className="text-xs font-black text-slate-850 dark:text-slate-100">
            {currentConfig?.name || template}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Font selection */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Font:</span>
            <select
              value={selectedFont}
              onChange={(e) => updateFont(e.target.value)}
              className="select select-bordered select-xs text-[10px] bg-slate-50 dark:bg-slate-800 border-gray-200 focus:outline-none h-7 min-h-7"
            >
              {Object.keys(FONTS).map(fontId => (
                <option key={fontId} value={fontId}>{FONTS[fontId].name}</option>
              ))}
            </select>
          </div>

          {/* Color dot picker */}
          <div className="flex items-center gap-1">
            {Object.keys(THEMES).map(themeId => {
              const tColor = THEMES[themeId];
              const isSel = selectedTheme === themeId;
              return (
                <button
                  key={themeId}
                  onClick={() => updateTheme(themeId)}
                  title={tColor.name}
                  className={`w-3.5 h-3.5 rounded-full border transition-all active:scale-90
                    ${isSel ? "ring-2 ring-primary ring-offset-1 border-transparent scale-110" : "border-gray-200 dark:border-slate-700 hover:scale-105"}`}
                  style={{ backgroundColor: tColor.primary }}
                />
              );
            })}
          </div>

          {/* Change template layout trigger */}
          <button 
            onClick={() => setShowModal(true)}
            className="btn btn-xs btn-outline btn-primary py-1 px-3 h-7 min-h-7 text-[10px] font-bold rounded-lg hover:scale-105 transition-all"
          >
            Change Layout
          </button>
        </div>
      </div>

      {/* A4 preview */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-950 p-4 flex justify-center items-start border border-slate-150 dark:border-slate-850" ref={containerRef}>
        <div 
          className="shadow-2xl ring-1 ring-black/5 bg-white text-black text-[11px] shrink-0 animate-fade-in" 
          ref={printRef}
          style={{ 
            width: "595px", 
            minHeight: "842px", 
            height: "fit-content",
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            marginBottom: `${842 * (scale - 1)}px`
          }}
        >
          {renderTemplate()}
        </div>
      </div>

      {/* Inline Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-250 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-lg text-slate-805 dark:text-white">Change Layout Design</h3>
                <p className="text-xs text-gray-500">Pick any template. Your content will swap layouts instantly.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-circle">
                <FaTimes size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-955">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {TEMPLATES.map(t => {
                  const isSel = template === t.id;
                  const currentThemeObj = THEMES[selectedTheme || "slate"];
                  const currentFontObj = FONTS[selectedFont || "inter"];
                  return (
                    <div 
                      key={t.id}
                      onClick={() => {
                        onTemplateChange(t.id);
                        setShowModal(false);
                        toast.success(`Switched to ${t.name} layout!`);
                      }}
                      className={`group relative bg-white dark:bg-slate-900 rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-305 hover:-translate-y-1 hover:shadow-lg flex flex-col
                        ${isSel ? "border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-none" : "border-gray-200 dark:border-slate-800"}`}
                    >
                      <div className="relative overflow-hidden bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-805 shrink-0" style={{ height: "185px" }}>
                        <div className="absolute inset-0 flex items-start justify-center pt-2 px-2">
                          <div className="shadow bg-white overflow-hidden origin-top scale-[0.3]" style={{ width: "595px", height: "842px" }}>
                            <DynamicTemplate data={PREVIEW_DATA} config={{ ...t, theme: selectedTheme, font: selectedFont }} />
                          </div>
                        </div>
                        {isSel && (
                          <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow">
                            <FaCheck className="text-white" size={8} />
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-slate-850 dark:text-slate-200 truncate group-hover:text-indigo-650 transition-colors">{t.name}</h4>
                          <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{t.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800">
                          <span className="text-[9px] font-bold tracking-wider uppercase bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">{currentFontObj.name}</span>
                          <span className="text-[10px] font-bold" style={{ color: currentThemeObj.primary }}>{currentThemeObj.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── ATS hint panel helpers ───────────────────────────────────────────────────
const calculateResumeStrength = (data) => {
  if (!data) return { pct: 0, label: "Beginner", color: "text-red-550 font-bold", colorBg: "bg-red-500" };
  let score = 0;
  
  // 1. Personal Info (Max 10 pts)
  const pi = data.personalInformation || {};
  if (pi.fullName) score += 5;
  if (pi.email) score += 2.5;
  if (pi.phoneNumber) score += 2.5;

  // 2. Summary (Max 20 pts)
  if (data.summary?.trim()) {
    score += 10;
    if (data.summary.trim().length >= 150) score += 5;
    if (/\d+/.test(data.summary)) score += 5;
  }

  // 3. Skills (Max 20 pts)
  const skillCount = data.skills?.length || 0;
  if (skillCount > 0) {
    score += 10;
    if (skillCount >= 4) score += 5;
    if (skillCount >= 8) score += 5;
  }

  // 4. Experience (Max 30 pts)
  const exp = data.experience || [];
  if (exp.length > 0) {
    score += 15;
    const hasDesc = exp.some(e => e.description && e.description.trim().length > 0);
    if (hasDesc) score += 5;
    
    const withMetrics = exp.filter(e => e.description && /\d+/.test(e.description)).length;
    const ratio = exp.length > 0 ? withMetrics / exp.length : 0;
    score += Math.round(ratio * 10);
  }

  // 5. Projects (Max 10 pts)
  const proj = data.projects || [];
  if (proj.length > 0) {
    score += 5;
    const hasDesc = proj.some(p => p.description && p.description.trim().length > 0);
    if (hasDesc) score += 5;
  }

  // 6. Optimization Quality (Max 10 pts)
  if (pi.linkedIn) score += 4;
  if (pi.gitHub || pi.portfolio) score += 3;
  
  const expCount = exp.length;
  if (expCount > 0) {
    const allQuantified = exp.every(e => e.description && /\d+/.test(e.description));
    if (allQuantified) score += 3;
  } else {
    if (data.summary && /\d+/.test(data.summary)) score += 3;
  }

  score = Math.min(100, score);

  let label = "Beginner";
  let color = "text-red-550 font-bold";
  let colorBg = "bg-red-500";
  if (score >= 90) {
    label = "Recruiter Ready (Elite)";
    color = "text-emerald-500 font-black animate-pulse";
    colorBg = "bg-emerald-500";
  } else if (score >= 70) {
    label = "Optimized (Excellent)";
    color = "text-indigo-550 font-bold";
    colorBg = "bg-indigo-500";
  } else if (score >= 40) {
    label = "Developing (Strong)";
    color = "text-amber-500 font-bold";
    colorBg = "bg-amber-500";
  }
  
  return { pct: score, label, color, colorBg };
};

// ── ATS hint panel ────────────────────────────────────────────────────────────
const AtsHintPanel = ({ atsContext, setAtsContext, resumeData, setDraft, setStep, recalculating, strength, steps }) => {
  const a = atsContext?.atsAnalysis;
  const initialScore = atsContext?.currentScore || 0;
  const currentScore = a?.atsScore || initialScore;
  const potentialScore = atsContext?.potentialScore || initialScore;
  
  const hasSummary = useMemo(() => !!resumeData?.summary?.trim(), [resumeData?.summary]);
  const hasSkills = useMemo(() => !!resumeData?.skills?.length, [resumeData?.skills]);
  const hasExperience = useMemo(() => !!(resumeData?.experience?.length && resumeData.experience.some(e => e.description?.trim())), [resumeData?.experience]);

  const state = useMemo(() => {
    if (hasSummary && hasSkills && hasExperience) return 3; // STATE 3 - Full Analysis
    if (hasSummary || hasSkills || hasExperience) return 2; // STATE 2 - Partial Analysis
    return 1; // STATE 1 - Empty / Insufficient Data
  }, [hasSummary, hasSkills, hasExperience]);

  const currentStrength = useMemo(() => strength || calculateResumeStrength(resumeData), [strength, resumeData]);

  const heatmap = useMemo(() => {
    if (!resumeData) return [];
    
    // Summary Profile
    let summaryScore = null;
    let summaryDesc = "Not enough content to evaluate.";
    if (hasSummary) {
      const charCount = resumeData.summary.trim().length;
      const hasMetrics = /\d+/.test(resumeData.summary);
      if (charCount >= 200 && hasMetrics) {
        summaryScore = 95;
        summaryDesc = "Strong summary profile with quantification.";
      } else if (charCount >= 120) {
        summaryScore = 75;
        summaryDesc = "Good length, but consider adding metrics.";
      } else {
        summaryScore = 50;
        summaryDesc = "Summary is brief. Add more context.";
      }
    }

    // Skills Alignment
    let skillsScore = null;
    let skillsDesc = "Not enough content to evaluate.";
    if (hasSkills) {
      const skillCount = resumeData.skills.length;
      const missingSkillsCount = atsContext?.missingSkills?.length || 0;
      if (skillCount >= 8 && missingSkillsCount === 0) {
        skillsScore = 95;
        skillsDesc = "Elite skills match against industry standards.";
      } else if (skillCount >= 5) {
        skillsScore = 80;
        skillsDesc = "Good skill coverage, add missing target keywords.";
      } else {
        skillsScore = 55;
        skillsDesc = "Add more relevant tools, libraries, and languages.";
      }
    }

    // Experience Metrics
    let expScore = null;
    let expDesc = "Not enough content to evaluate.";
    if (hasExperience) {
      const expCount = resumeData.experience.length;
      const withMetrics = resumeData.experience.filter(e => e.description && /\d+/.test(e.description)).length;
      const ratio = expCount > 0 ? withMetrics / expCount : 0;
      if (ratio >= 0.75) {
        expScore = 95;
        expDesc = "Strong quantified achievements and action verbs.";
      } else if (ratio >= 0.3) {
        expScore = 70;
        expDesc = "Some quantification. Try to quantify more accomplishments.";
      } else {
        expScore = 40;
        expDesc = "Lacks metrics. Use numbers and percentages to show impact.";
      }
    }

    // Overall Readability
    let readabilityScore = null;
    let readabilityDesc = "Not enough content to evaluate.";
    const totalWords = (resumeData.summary || "").split(/\s+/).filter(Boolean).length +
                       resumeData.experience.map(e => e.description || "").join(" ").split(/\s+/).filter(Boolean).length;
    if (totalWords >= 40) {
      const pi = resumeData.personalInformation || {};
      let checks = 0;
      if (pi.fullName) checks += 1;
      if (pi.email) checks += 1;
      if (pi.phoneNumber) checks += 1;
      if (pi.linkedIn || (Array.isArray(pi.links) && pi.links.some(l => l.platform.toLowerCase() === "linkedin"))) checks += 1;
      
      readabilityScore = Math.min(100, 60 + (checks * 10));
      readabilityDesc = checks >= 3 ? "Excellent format and parsing structure." : "Improve formatting and contact details.";
    }

    return [
      { name: "Summary Profile", score: summaryScore, desc: summaryDesc },
      { name: "Skills Alignment", score: skillsScore, desc: skillsDesc },
      { name: "Experience Metrics", score: expScore, desc: expDesc },
      { name: "Overall Readability", score: readabilityScore, desc: readabilityDesc }
    ];
  }, [resumeData, hasSummary, hasSkills, hasExperience, atsContext]);

  const attention = useMemo(() => {
    if (state !== 3) return null;
    if (currentScore >= 80) return { label: "Strong Retention", time: "6.8s", color: "bg-emerald-500", desc: "Strong impact metrics hook recruiter focus immediately." };
    if (currentScore >= 60) return { label: "Moderate Retention", time: "4.2s", color: "bg-amber-500", desc: "Vague action phrasing limits first-look readability." };
    return { label: "Critical Rejection Risk", time: "1.8s", color: "bg-red-500", desc: "Your resume formatting may reduce recruiter engagement during the first 6-second scan." };
  }, [state, currentScore]);

  const suggestions = useMemo(() => {
    if (state === 1) return []; // Empty suggestions in State 1

    const list = [];
    
    // Summary Suggestion
    if (!resumeData.summary?.trim()) {
      list.push({
        id: "summary-empty",
        category: "Summary Profile",
        reason: "Your professional summary is empty. AI needs text to enhance it.",
        pts: 12,
        actionLabel: "Write Summary",
        execute: () => {
          const idx = steps?.findIndex(s => s.id === "summary");
          setStep(idx !== -1 ? idx : 1);
        }
      });
    } else {
      if (resumeData.summary.trim().length < 120) {
        list.push({
          id: "summary-short",
          category: "Summary Profile",
          reason: "Your summary is too brief. Expand it to 2-3 sentences to capture recruiter focus.",
          pts: 5,
          actionLabel: "Expand Summary",
          execute: () => {
            const idx = steps?.findIndex(s => s.id === "summary");
            setStep(idx !== -1 ? idx : 1);
          }
        });
      }
      if (!/\d+/.test(resumeData.summary)) {
        list.push({
          id: "summary-metrics",
          category: "Summary Profile",
          reason: "Your summary lacks impact numbers or scope metrics.",
          pts: 6,
          actionLabel: "Add Metrics",
          execute: () => {
            const idx = steps?.findIndex(s => s.id === "summary");
            setStep(idx !== -1 ? idx : 1);
          }
        });
      }
    }

    // Work Experience Suggestion
    const expCount = resumeData.experience?.length || 0;
    if (expCount === 0) {
      list.push({
        id: "exp-empty",
        category: "Experience Alignment",
        reason: "No work history found. Add at least one position to validate your career.",
        pts: 25,
        actionLabel: "Add Job",
        execute: () => {
          const idx = steps?.findIndex(s => s.id === "experience");
          setStep(idx !== -1 ? idx : 3);
          if (setDraft) {
            setDraft(prev => ({
              ...prev,
              experience: [...prev.experience, { title: "", company: "", startDate: "", endDate: "", description: "" }]
            }));
          }
        }
      });
    } else {
      const missingMetricsIndices = [];
      resumeData.experience.forEach((e, i) => {
        if (!e.description || !/\d+/.test(e.description)) {
          missingMetricsIndices.push(i);
        }
      });
      if (missingMetricsIndices.length > 0) {
        list.push({
          id: "exp-metrics",
          category: "Experience Alignment",
          reason: `Role ${missingMetricsIndices[0] + 1} (${resumeData.experience[missingMetricsIndices[0]].title || 'Job'}): Bullet points lack quantification.`,
          pts: 10,
          actionLabel: "Quantify",
          execute: () => {
            const idx = steps?.findIndex(s => s.id === "experience");
            setStep(idx !== -1 ? idx : 3);
          }
        });
      }
    }

    // Missing skills
    const missing = atsContext?.missingSkills || atsContext?.atsAnalysis?.categorizedMissingSkills || atsContext?.atsAnalysis?.missingKeywords || [];
    if (missing.length > 0) {
      missing.slice(0, 4).forEach((skill) => {
        const skillName = typeof skill === "string" ? skill : skill.name;
        const severity = typeof skill === "string" ? "IMPORTANT" : skill.severity;
        const pts = severity === "CRITICAL" ? 8 : severity === "IMPORTANT" ? 5 : 3;
        
        const exists = resumeData.skills?.some(s => s.title.toLowerCase() === skillName.toLowerCase());
        if (!exists) {
          list.push({
            id: `skill-${skillName}`,
            category: "Skills & Keywords",
            reason: `Add critical skill: "${skillName}"`,
            pts,
            actionLabel: "Add Skill",
            execute: () => {
              if (setDraft) {
                setDraft(prev => {
                  const skills = [...prev.skills, { title: skillName, level: "Intermediate" }];
                  const updatedSections = prev.sections.map(sec => {
                    if (sec.type === "skills") {
                      return { ...sec, data: skills };
                    }
                    return sec;
                  });
                  return {
                    ...prev,
                    skills,
                    sections: updatedSections
                  };
                });
                toast.success(`Added "${skillName}" to skills!`);
              }
            }
          });
        }
      });
    }

    // Personal Info
    const pi = resumeData.personalInformation || {};
    const hasLinkedIn = pi.linkedIn || (Array.isArray(pi.links) && pi.links.some(l => l.platform.toLowerCase() === "linkedin"));
    if (!hasLinkedIn) {
      list.push({
        id: "info-linkedin",
        category: "Readability",
        reason: "Missing LinkedIn Profile URL",
        pts: 4,
        actionLabel: "Add LinkedIn",
        execute: () => {
          const idx = steps?.findIndex(s => s.id === "basics");
          setStep(idx !== -1 ? idx : 0);
        }
      });
    }

    return list;
  }, [resumeData, state, atsContext, setDraft, setStep, steps]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Live ATS Optimizer Card */}
      {state !== 3 ? (
        <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-805 p-4 shadow-sm opacity-75">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Live ATS Optimizer</span>
            <span className="text-[9px] font-bold text-slate-455 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full">Muted</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center py-2 bg-slate-100/50 dark:bg-slate-950/20 rounded-xl mb-3 border border-slate-150/50 dark:border-slate-850">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Before</span>
              <span className="text-xl font-extrabold text-slate-300 dark:text-slate-700">--</span>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Current Score</span>
              <span className="text-xl font-extrabold text-slate-300 dark:text-slate-700">--</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>Progress: --</span>
              <span>Target: --</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden relative">
              <div className="absolute left-0 top-0 h-full bg-slate-200 dark:bg-slate-700" style={{ width: "0%" }} />
            </div>
            <p className="text-[9px] text-slate-450 font-semibold mt-1">
              {state === 1 
                ? "Complete more resume sections to unlock ATS insights."
                : "Add Summary, Skills, and Experience to begin ATS optimization."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800 p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-405 uppercase tracking-wider">Live ATS Optimizer</span>
            {recalculating && (
              <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                Recalculating
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-center py-2 bg-slate-50 dark:bg-slate-955/40 rounded-xl mb-3 border border-slate-100 dark:border-slate-850">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Before</span>
              <span className="text-xl font-extrabold text-red-500">{initialScore}</span>
            </div>
            <div className="border-l border-gray-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-indigo-550 uppercase tracking-widest block">Current Score</span>
              <span className="text-2xl font-black text-emerald-500">{currentScore}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-gray-400">
              <span>Progress: {currentScore}%</span>
              <span>Target: {potentialScore}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden relative">
              <div className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500" style={{ width: `${currentScore}%` }} />
              <div className="absolute top-0 bottom-0 w-0.5 bg-indigo-500/80" style={{ left: `${potentialScore}%` }} title="Target Score" />
            </div>
            <p className="text-[9px] text-emerald-600 font-semibold mt-1">
              {currentScore === 0 
                ? "Complete more sections to begin ATS optimization." 
                : (currentScore >= potentialScore ? "Target reached! Excellent job." : `Gain +${potentialScore - currentScore} pts to hit optimized target`)}
            </p>
          </div>
        </div>
      )}

      {/* 2. Resume Strength Indicator */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800 p-4 shadow-card hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resume Strength</span>
          <span className={`text-[10px] uppercase tracking-wider ${currentStrength.color}`}>
            {currentStrength.label}
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-1.5 relative">
          <div className={`h-full transition-all duration-700 ${currentStrength.colorBg}`} style={{ width: `${currentStrength.pct}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-gray-400 font-semibold">
          <span>Score: {currentStrength.pct}/100</span>
          <span>Goal: Recruiter Ready (90+)</span>
        </div>
      </div>

      {/* 3. Recruiter Attention Meter Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800 p-4 shadow-card">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recruiter Attention</span>
          {state === 3 ? (
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">
              {attention?.time}
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-405 dark:text-slate-400">
              {state === 2 ? "Locked" : "--"}
            </span>
          )}
        </div>
        
        {state === 3 ? (
          <>
            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-1.5 relative">
              <div className={`h-full transition-all duration-700 ${attention?.color}`} style={{ width: currentScore >= 80 ? "90%" : currentScore >= 60 ? "60%" : "30%" }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 font-semibold">
              <span>{attention?.label}</span>
              <span>Goal: 6s+ Retention</span>
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5">{attention?.desc}</p>
          </>
        ) : (
          <>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-1.5 relative">
              <div className="h-full bg-slate-200 dark:bg-slate-705" style={{ width: "0%" }} />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
              <span>{state === 2 ? "Not enough data yet." : "Not enough content to evaluate."}</span>
              <span>Goal: 6s+ Retention</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5 italic">
              {state === 2 
                ? "Add experience entries to calculate first-look retention." 
                : "Add Summary, Skills, and Experience to begin recruiter analysis."}
            </p>
          </>
        )}
      </div>

      {/* 4. Recruiter Heatmap */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800 p-4 shadow-card">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Recruiter Heatmap</span>
        {state === 1 ? (
          <div className="py-6 px-2 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center mx-auto text-slate-400">
              <FaEye size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Heatmap Locked</p>
            <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto">
              Add Summary, Skills, and Experience to begin recruiter analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {heatmap.map(item => {
              const hasScore = item.score !== null;
              const color = hasScore ? (item.score >= 80 ? "bg-emerald-500" : item.score >= 60 ? "bg-amber-500" : "bg-red-500") : "bg-slate-100 dark:bg-slate-800";
              const textColor = hasScore ? (item.score >= 80 ? "text-emerald-600" : item.score >= 60 ? "text-amber-600" : "text-red-600") : "text-slate-405";
              return (
                <div key={item.name} className={`text-xs ${!hasScore ? "opacity-60" : ""}`}>
                  <div className="flex justify-between font-bold text-gray-700 dark:text-slate-350 mb-1">
                    <span>{item.name}</span>
                    <span className={textColor}>{hasScore ? `${item.score}%` : "--"}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${hasScore ? item.score : 0}%` }} />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {hasScore ? item.desc : "Not enough data yet."}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Live AI Coach Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800 p-4 shadow-card">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Live AI Coach</span>
        {state === 1 ? (
          <div className="py-6 px-2 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center mx-auto text-slate-400">
              <FaLightbulb size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">AI Coaching Paused</p>
            <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto">
              Complete more resume sections to unlock ATS insights.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {suggestions.map(s => (
              <div key={s.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/70 border border-slate-150 dark:border-slate-850 rounded-xl flex items-start justify-between gap-2 transition-all">
                <div className="min-w-0">
                  <span className="inline-block text-[9px] font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/45 dark:text-indigo-400 px-1.5 py-0.5 rounded uppercase mb-1">
                    +{s.pts} Pts
                  </span>
                  <p className="text-xs font-semibold text-slate-805 dark:text-slate-205 leading-snug">{s.reason}</p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{s.category}</span>
                </div>
                <button 
                  type="button" 
                  onClick={s.execute}
                  className="btn btn-primary btn-xs rounded-lg px-2 shrink-0 cursor-pointer font-bold animate-pulse text-[10px]"
                >
                  {s.actionLabel}
                </button>
              </div>
            ))}
            {suggestions.length === 0 && (
              <p className="text-xs text-slate-450 text-center py-4">🎉 No remaining weaknesses found! Your resume is fully optimized.</p>
            )}
          </div>
        )}
      </div>

      {/* 6. Trust Indicators */}
      <div className="bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl p-3 border border-slate-150/40 dark:border-slate-800 text-[10px] text-slate-400 space-y-1.5 font-medium leading-relaxed">
        <div className="flex items-center gap-1.5">
          <FaShieldAlt className="text-indigo-500 shrink-0" size={11} />
          <span>Encrypted. Data parsed locally.</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FaCheckCircle className="text-emerald-500 shrink-0" size={11} />
          <span>Rule-based ATS scoring.</span>
        </div>
      </div>
    </div>
  );
};

// ── Step: Generic Section (Optional / Custom) ─────────────────────────────────
const StepGenericSection = ({ section, onChange }) => {
  const dataList = Array.isArray(section.data) ? section.data : [];

  const addEntry = () => {
    let newEntry = {};
    if (section.type === "languages") {
      newEntry = { language: "", proficiency: "Full professional proficiency" };
    } else if (section.type === "interests" || section.type === "hobbies") {
      newEntry = { name: "" };
    } else if (section.type === "certifications") {
      newEntry = { title: "", issuer: "", issueDate: "" };
    } else if (section.type === "courses" || section.type === "training") {
      newEntry = { title: "", institution: "", startDate: "", endDate: "", description: "" };
    } else if (["volunteering", "extracurricular", "additional_experience", "research", "affiliations"].includes(section.type)) {
      newEntry = { title: "", company: "", startDate: "", endDate: "", description: "" };
    } else {
      // Custom / generic entries
      newEntry = { title: "", subtitle: "", date: "", description: "" };
    }
    onChange([...dataList, newEntry]);
  };

  const removeEntry = (i) => {
    onChange(dataList.filter((_, idx) => idx !== i));
  };

  const updateEntry = (i, field, val) => {
    const copy = [...dataList];
    copy[i] = { ...copy[i], [field]: val };
    onChange(copy);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
          <p className="text-sm text-gray-550 mt-0.5">Manage entries for your {section.title.toLowerCase()} section</p>
        </div>
        {section.type !== "interests" && section.type !== "hobbies" && (
          <button onClick={addEntry} className="btn-brand flex items-center gap-1.5 text-xs px-3 py-2">
            <FaPlus size={10} /> Add Item
          </button>
        )}
      </div>

      {section.type === "interests" || section.type === "hobbies" ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              id={`tag-input-${section.id}`}
              type="text" 
              className="input-light flex-1" 
              placeholder="e.g. Hiking, Photography, Chess…" 
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = e.target.value.trim();
                  if (val) {
                    if (dataList.some(item => (item.interest || item.name || item).toLowerCase() === val.toLowerCase())) {
                      toast.error("Already exists");
                      return;
                    }
                    onChange([...dataList, { name: val }]);
                    e.target.value = "";
                  }
                }
              }}
            />
            <button 
              type="button"
              onClick={() => {
                const el = document.getElementById(`tag-input-${section.id}`);
                const val = el.value.trim();
                if (val) {
                  onChange([...dataList, { name: val }]);
                  el.value = "";
                }
              }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:shadow-brand transition-all active:scale-95 shrink-0"
            >
              <FaPlus size={12} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {dataList.map((item, i) => {
              const name = item.interest || item.name || (typeof item === "string" ? item : "");
              return (
                <span key={i} className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-3 py-1.5 text-sm font-medium animate-fadeIn">
                  {name}
                  <button onClick={() => removeEntry(i)} className="text-indigo-300 hover:text-red-400 transition-colors ml-0.5">
                    <FaTrash size={9} />
                  </button>
                </span>
              );
            })}
            {dataList.length === 0 && (
              <p className="text-sm text-gray-400 py-2">No items added yet — type and press Enter</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {dataList.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
              <FaFileAlt className="text-3xl mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No entries added yet</p>
            </div>
          )}
          {dataList.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Item {i + 1}</span>
                <button onClick={() => removeEntry(i)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                  <FaTrash size={12} />
                </button>
              </div>

              {section.type === "languages" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    value={item.language || ""} 
                    onChange={e => updateEntry(i, "language", e.target.value)}
                    className="input-light" 
                    placeholder="Language (e.g. English, French)" 
                  />
                  <select 
                    value={item.proficiency || "Professional working proficiency"} 
                    onChange={e => updateEntry(i, "proficiency", e.target.value)}
                    className="input-light cursor-pointer text-xs"
                  >
                    <option>Native / Bilingual</option>
                    <option>Full professional proficiency</option>
                    <option>Professional working proficiency</option>
                    <option>Limited working proficiency</option>
                    <option>Elementary proficiency</option>
                  </select>
                </div>
              ) : section.type === "certifications" ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input 
                    value={item.title || ""} 
                    onChange={e => updateEntry(i, "title", e.target.value)}
                    className="input-light" 
                    placeholder="Certification Name" 
                  />
                  <input 
                    value={item.issuer || ""} 
                    onChange={e => updateEntry(i, "issuer", e.target.value)}
                    className="input-light" 
                    placeholder="Issuing Organization" 
                  />
                  <input 
                    value={item.issueDate || ""} 
                    onChange={e => updateEntry(i, "issueDate", e.target.value)}
                    className="input-light" 
                    placeholder="Date / Year" 
                  />
                </div>
              ) : ["volunteering", "extracurricular", "additional_experience", "research", "affiliations"].includes(section.type) ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input 
                      value={item.title || ""} 
                      onChange={e => updateEntry(i, "title", e.target.value)}
                      className="input-light" 
                      placeholder="Role / Title" 
                    />
                    <input 
                      value={item.company || ""} 
                      onChange={e => updateEntry(i, "company", e.target.value)}
                      className="input-light" 
                      placeholder="Organization / Institution" 
                    />
                    <input 
                      value={item.startDate || ""} 
                      onChange={e => updateEntry(i, "startDate", e.target.value)}
                      className="input-light" 
                      placeholder="Start (e.g. Jan 2022)" 
                    />
                    <input 
                      value={item.endDate || ""} 
                      onChange={e => updateEntry(i, "endDate", e.target.value)}
                      className="input-light" 
                      placeholder="End (or Present)" 
                    />
                  </div>
                  <textarea 
                    value={item.description || ""} 
                    onChange={e => updateEntry(i, "description", e.target.value)}
                    className="textarea-light h-20" 
                    placeholder="Describe your responsibilities, duties and achievements..." 
                  />
                </div>
              ) : (
                // Custom / licenses / awards / patents / conferences / publications / references / generic
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input 
                      value={item.title || ""} 
                      onChange={e => updateEntry(i, "title", e.target.value)}
                      className="input-light" 
                      placeholder="Title / Name" 
                    />
                    <input 
                      value={item.subtitle || ""} 
                      onChange={e => updateEntry(i, "subtitle", e.target.value)}
                      className="input-light" 
                      placeholder="Subtitle / Organization / Issuer" 
                    />
                    <input 
                      value={item.date || ""} 
                      onChange={e => updateEntry(i, "date", e.target.value)}
                      className="input-light" 
                      placeholder="Date / Duration" 
                    />
                  </div>
                  <textarea 
                    value={item.description || ""} 
                    onChange={e => updateEntry(i, "description", e.target.value)}
                    className="textarea-light h-20" 
                    placeholder="Provide additional details or descriptions..." 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Step: Manage Sections ─────────────────────────────────────────────────────
const StepManageSections = ({ data, onChange }) => {
  const sections = Array.isArray(data.sections) ? [...data.sections] : [];

  const OPTIONAL_SECTIONS = [
    { type: "certifications", label: "Certifications" },
    { type: "courses", label: "Courses" },
    { type: "licenses", label: "Licenses" },
    { type: "awards", label: "Awards" },
    { type: "languages", label: "Languages" },
    { type: "volunteering", label: "Volunteering" },
    { type: "conferences", label: "Conferences" },
    { type: "publications", label: "Publications" },
    { type: "hobbies", label: "Hobbies" },
    { type: "interests", label: "Interests" },
    { type: "references", label: "References" },
    { type: "research", label: "Research" },
    { type: "training", label: "Training" },
    { type: "extracurricular", label: "Extracurricular Activities" },
    { type: "additional_experience", label: "Additional Experience" },
    { type: "affiliations", label: "Affiliations" },
    { type: "patents", label: "Patents" },
    { type: "custom", label: "Custom Section" },
  ];

  const addSection = (type, label) => {
    let finalLabel = label;
    if (type === "custom") {
      const customTitle = window.prompt("Enter a title for your custom section:", "Achievements");
      if (!customTitle) return;
      finalLabel = customTitle;
    }
    
    // Check if section type already exists (except custom section which can be multiple!)
    if (type !== "custom" && sections.some(s => s.type === type)) {
      toast.error(`"${label}" section is already added.`);
      return;
    }

    const newSec = {
      id: type === "custom" ? `custom_${Date.now()}` : type,
      type,
      title: finalLabel,
      data: (type === "summary") ? "" : [],
      order: sections.length,
      visible: true
    };

    const newSections = [...sections, newSec];
    onChange({ ...data, sections: newSections });
    toast.success(`Added "${finalLabel}" section!`);
  };

  const removeSection = (id, title) => {
    if (["summary", "skills", "experience", "education", "projects"].includes(id)) {
      toast.error("Core sections cannot be deleted, but you can hide them instead.");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete the "${title}" section?`)) {
      return;
    }
    const newSections = sections.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx }));
    onChange({ ...data, sections: newSections });
    toast.success(`Removed "${title}" section.`);
  };

  const toggleVisibility = (id) => {
    const newSections = sections.map(s => {
      if (s.id === id) return { ...s, visible: !s.visible };
      return s;
    });
    onChange({ ...data, sections: newSections });
  };

  const moveSection = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    
    const copy = [...sections];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    
    // Reset order properties
    const reordered = copy.map((s, idx) => ({ ...s, order: idx }));
    onChange({ ...data, sections: reordered });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Manage Resume Sections</h2>
        <p className="text-sm text-gray-500 mt-0.5">Add, reorder, show/hide, or delete sections of your resume</p>
      </div>

      {/* Active sections list */}
      <div className="space-y-2 border-b border-gray-100 pb-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Active Sections Layout</h3>
        {sections.map((s, idx) => {
          const isCore = ["summary", "skills", "experience", "education", "projects"].includes(s.id);
          return (
            <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all
              ${s.visible ? "bg-white border-gray-150 shadow-card" : "bg-gray-50 border-gray-100 opacity-60"}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-5">#{idx + 1}</span>
                <div>
                  <span className="text-xs font-extrabold text-gray-805">{s.title}</span>
                  <span className="block text-[9px] text-gray-405 uppercase tracking-wider">{s.type}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Move buttons */}
                <button 
                  type="button"
                  disabled={idx === 0} 
                  onClick={() => moveSection(idx, -1)}
                  className="btn btn-xs btn-ghost btn-circle disabled:opacity-20"
                  title="Move Up"
                >
                  ▲
                </button>
                <button 
                  type="button"
                  disabled={idx === sections.length - 1} 
                  onClick={() => moveSection(idx, 1)}
                  className="btn btn-xs btn-ghost btn-circle disabled:opacity-20"
                  title="Move Down"
                >
                  ▼
                </button>
                
                {/* Hide/Show Toggle */}
                <button 
                  type="button"
                  onClick={() => toggleVisibility(s.id)}
                  className="btn btn-xs btn-ghost btn-circle text-gray-500 hover:text-indigo-650"
                  title={s.visible ? "Hide Section" : "Show Section"}
                >
                  {s.visible ? "👁️" : "🙈"}
                </button>

                {/* Delete button (only optional sections) */}
                <button 
                  type="button"
                  disabled={isCore}
                  onClick={() => removeSection(s.id, s.title)}
                  className="btn btn-xs btn-ghost btn-circle text-gray-400 hover:text-red-500 disabled:opacity-10"
                  title="Delete Section"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Available sections to add */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Add Optional Sections</h3>
        <div className="grid grid-cols-2 gap-2">
          {OPTIONAL_SECTIONS.map(opt => {
            const alreadyAdded = opt.type !== "custom" && sections.some(s => s.type === opt.type);
            return (
              <button
                key={opt.type}
                type="button"
                disabled={alreadyAdded}
                onClick={() => addSection(opt.type, opt.label)}
                className={`btn btn-xs text-[10px] py-2 h-auto text-left justify-start rounded-lg border font-semibold transition-all
                  ${alreadyAdded 
                    ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" 
                    : "bg-white hover:bg-indigo-50/50 text-gray-700 border-gray-200 hover:border-indigo-200 active:scale-95"}`}
              >
                + {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const GenerateResume = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const resumeId = searchParams.get("id");
  const templateParam = searchParams.get("template");
  const modeParam = searchParams.get("mode");
  const { resumeData, selectedTemplate, updateResumeData, updateTemplate, clearResumeData } = useResume();
  const printRef = useRef(null);

  // States
  const [step, setStep] = useState(0);

  // Decide initial showAiPrompt and draft value
  const initialShowAiPrompt = useMemo(() => {
    if (resumeId) return false;
    if (modeParam === "scratch") return false;
    if (modeParam === "ai") return true;
    return !resumeData || !resumeData.personalInformation?.fullName;
  }, [resumeId, modeParam, resumeData]);

  const initialDraft = useMemo(() => {
    const raw = resumeId ? resumeData || EMPTY : (modeParam === "scratch" ? EMPTY : resumeData || EMPTY);
    return normalizeResumeData(raw);
  }, [resumeId, modeParam, resumeData]);

  const [draft, setDraftReal] = useState(initialDraft);
  
  const setDraft = (val) => {
    setDraftReal(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      return syncResumeData(next);
    });
  };

  const [atsContext, setAtsContext] = useState(null);
  const [showPreview, setShowPreview] = useState(false); // mobile toggle
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false); // mobile overlay
  const [showAtsDrawer, setShowAtsDrawer] = useState(false); // right sliding panel
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(initialShowAiPrompt);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Dynamic steps config driven by draft.sections
  const steps = useMemo(() => {
    const list = [
      { id: "basics", label: "Personal Info", icon: FaUser, desc: "Name, contact, links" },
      { id: "manage_sections", label: "Manage Sections", icon: FaMagic, desc: "Add & reorder sections" }
    ];
    
    const sections = Array.isArray(draft.sections) ? draft.sections : [];
    sections.forEach(sec => {
      let Icon = FaFileAlt;
      if (sec.type === "summary") Icon = FaFileAlt;
      else if (sec.type === "skills") Icon = FaCode;
      else if (sec.type === "experience") Icon = FaBriefcase;
      else if (sec.type === "education") Icon = FaGraduationCap;
      else if (sec.type === "projects") Icon = FaFolderOpen;
      else if (sec.type === "certifications") Icon = FaCrown;
      else if (sec.type === "courses") Icon = FaGraduationCap;
      else if (sec.type === "languages") Icon = FaBrain;
      else if (sec.type === "volunteering") Icon = FaBriefcase;
      else if (sec.type === "interests" || sec.type === "hobbies") Icon = FaLightbulb;
      
      list.push({
        id: sec.id,
        type: sec.type,
        label: sec.title,
        icon: Icon,
        desc: `Manage ${sec.title.toLowerCase()}`,
        section: sec
      });
    });
    
    return list;
  }, [draft.sections]);

  // Clamp step if dynamic sections list shrinks
  useEffect(() => {
    if (step >= steps.length) {
      setStep(Math.max(0, steps.length - 1));
    }
  }, [steps, step]);

  // Handle URL modeParam / templateParam onboarding
  useEffect(() => {
    if (!resumeId) {
      if (modeParam === "scratch") {
        clearResumeData();
        const initialEmpty = normalizeResumeData(EMPTY);
        setDraft(initialEmpty);
        updateResumeData(initialEmpty);
      }
    }
    if (templateParam) {
      updateTemplate(templateParam);
    }
  }, [resumeId, modeParam, templateParam]);

  // Sync draft -> context on every change (debounced via useEffect)
  useEffect(() => {
    const t = setTimeout(() => updateResumeData(draft), 400);
    return () => clearTimeout(t);
  }, [draft]);

  // Sync context changes to draft (e.g. on loading from backend)
  useEffect(() => {
    if (resumeData && resumeId) {
      setDraft(normalizeResumeData(resumeData));
    }
  }, [resumeData, resumeId]);

  // Load resume by ID from backend if present
  useEffect(() => {
    if (resumeId && user) {
      const loadResume = async () => {
        try {
          const res = await getResumeById(resumeId);
          const content = res.currentStatus === "ORIGINAL" 
            ? JSON.parse(res.originalJson || "{}") 
            : JSON.parse(res.improvedJson || "{}");
          const normalized = normalizeResumeData(content);
          updateResumeData(normalized);
          updateTemplate(res.selectedTemplate || "default");
          setDraft(normalized);
          setShowAiPrompt(false);
        } catch (e) {
          toast.error("Failed to load resume: " + (e.response?.data?.error || e.message));
        }
      };
      loadResume();
    }
  }, [resumeId, user]);

  // Load ATS context from analysis page
  useEffect(() => {
    const stored = localStorage.getItem("atsContext");
    if (stored) {
      try { setAtsContext(JSON.parse(stored)); } catch {}
      localStorage.removeItem("atsContext");
    }
  }, []);

  const handleSaveResume = async () => {
    if (!user) {
      toast.error("Please sign in or register to save your resume to the cloud.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving resume to cloud...");
    try {
      if (resumeId) {
        // Update existing
        const versionDesc = window.prompt("Enter version details / description (optional):") || "Updated resume details";
        await updateResume(resumeId, {
          originalJson: draft,
          improvedJson: draft,
          currentStatus: "ORIGINAL",
          selectedTemplate,
          versionDescription: versionDesc,
        });
        toast.success("Resume saved successfully & new version pushed!", { id: toastId });
      } else {
        // Create new
        const isPro = user?.isPro || user?.role === "ROLE_PRO";
        const existingResumes = await getMyResumes();
        if (!isPro && existingResumes.length >= 1) {
          toast.dismiss(toastId);
          toast.error("Free limit reached. Upgrade to Pro to save multiple resumes.");
          return;
        }

        const newResume = await createResume({
          originalJson: draft,
          improvedJson: draft,
          currentStatus: "ORIGINAL",
          selectedTemplate,
        });
        toast.success("Resume saved to your dashboard!", { id: toastId });
        setSearchParams({ id: newResume.id });
      }
    } catch (e) {
      toast.error("Failed to save resume: " + (e.response?.data?.error || e.message), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const triggerPrint = useReactToPrint({ content: () => printRef.current });

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
      const msg = e.response?.data?.error || e.message;
      if (msg.includes("Free limit") || msg.includes("limit reached")) {
        setShowUpgradeModal(true);
      } else {
        toast.error("Failed to track export: " + msg);
      }
    }
  };

  // AI generate from prompt
  const handleAiGenerate = async () => {
    if (!user) {
      toast.error("Please sign in or register to use AI features.");
      return;
    }
    if (!aiPrompt.trim()) { toast.error("Describe yourself first"); return; }
    setAiLoading(true);
    const tid = toast.loading("Generating your resume…");
    try {
      const res = await generateResume(aiPrompt);
      if (!res?.data) throw new Error("Invalid response");
      const normalized = normalizeResumeData(res.data);
      setDraft(normalized);
      toast.success("Resume generated!", { id: tid });
      setShowAiPrompt(false);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || "Generation failed", { id: tid });
    } finally { setAiLoading(false); }
  };

  // AI enhance whole resume
  const handleEnhanceAll = async () => {
    if (!user) {
      toast.error("Please sign in or register to use AI features.");
      return;
    }
    const isPro = user.isPro || user.role === "ROLE_PRO";
    if (!isPro && user.enhanceCount >= 2) {
      setShowUpgradeModal(true);
      return;
    }
    setAiLoading(true);
    const tid = toast.loading("Enhancing your resume…");
    try {
      const res = await enhanceResume(draft);
      if (res?.data) { 
        const normalized = normalizeResumeData({ ...draft, ...res.data });
        setDraft(normalized); 
        toast.success("Resume enhanced!", { id: tid }); 
        refreshUser();
      }
      else toast.dismiss(tid);
    } catch (e) {
      toast.error(e.message || "Enhancement failed", { id: tid });
    } finally { setAiLoading(false); }
  };

  const currentStepId = steps[step]?.id;

  const renderStep = () => {
    const activeStep = steps[step];
    if (!activeStep) return null;

    switch (activeStep.id) {
      case "basics":
        return <StepBasics data={draft} onChange={setDraft} />;
      case "manage_sections":
        return <StepManageSections data={draft} onChange={setDraft} />;
      default:
        // This is a section from draft.sections
        const secId = activeStep.id;
        const secIdx = draft.sections.findIndex(s => s.id === secId);
        if (secIdx === -1) return null;
        const sec = draft.sections[secIdx];
        
        if (sec.type === "summary") {
          return (
            <StepSummary 
              data={draft} 
              onChange={setDraft} 
              user={user} 
              setShowUpgradeModal={setShowUpgradeModal} 
              refreshUser={refreshUser} 
            />
          );
        } else if (sec.type === "skills") {
          return (
            <StepSkills 
              data={draft} 
              onChange={setDraft} 
              atsContext={atsContext} 
            />
          );
        } else if (sec.type === "experience") {
          return (
            <StepExperience 
              data={draft} 
              onChange={setDraft} 
              user={user} 
              setShowUpgradeModal={setShowUpgradeModal} 
              refreshUser={refreshUser} 
            />
          );
        } else if (sec.type === "education") {
          return (
            <StepEducation 
              data={draft} 
              onChange={setDraft} 
            />
          );
        } else if (sec.type === "projects") {
          return (
            <StepProjects 
              data={draft} 
              onChange={setDraft} 
              user={user} 
              setShowUpgradeModal={setShowUpgradeModal} 
              refreshUser={refreshUser} 
            />
          );
        } else {
          return (
            <StepGenericSection 
              section={sec} 
              onChange={(updatedData) => {
                const updatedSections = [...draft.sections];
                updatedSections[secIdx] = { ...sec, data: updatedData };
                setDraft({ ...draft, sections: updatedSections });
              }}
            />
          );
        }
    }
  };

  // Memoized strength score based on debounced resumeData
  const strength = useMemo(() => calculateResumeStrength(resumeData || EMPTY), [resumeData]);

  // ── AI prompt screen ────────────────────────────────────────────────────────
  if (showAiPrompt) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-5 shadow-brand">
              <FaBrain className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Build Your Resume</h1>
            <p className="text-gray-555 text-sm">Let AI generate a professional draft in seconds, or build manually</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Describe your background
            </label>
            <p className="text-xs text-gray-400 mb-3">AI will structure this into a complete resume</p>
            <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              className="textarea-light h-36 mb-4"
              placeholder="e.g. I'm a Java developer with 2 years of experience in Spring Boot and React. I've built e-commerce platforms, worked with PostgreSQL and Docker, and have a B.Tech in Computer Science from VIT..." />
            <button onClick={handleAiGenerate} disabled={aiLoading || !aiPrompt.trim()}
              className="btn-brand w-full flex items-center justify-center gap-2 py-3">
              {aiLoading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating your resume…</>
                : <><FaBrain /> Generate with AI</>
              }
            </button>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-405">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <button onClick={() => setShowAiPrompt(false)}
              className="btn-soft w-full text-center">
              Start from Scratch
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            Your data stays private and is never stored without your consent
          </p>
        </div>
      </div>
    );
  }

  // ── Main builder layout ─────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">

      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => { clearResumeData(); setShowAiPrompt(true); setDraft(EMPTY); }}
            className="btn-ghost-light text-sm">← New</button>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
              {draft.personalInformation?.fullName || "Untitled Resume"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleEnhanceAll} disabled={aiLoading}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-indigo-650 bg-indigo-55 hover:bg-indigo-100 transition-all disabled:opacity-50">
            {aiLoading ? <FaSpinner className="animate-spin" size={11} /> : <FaMagic size={11} />}
            Enhance All
          </button>
          {user ? (
            <button onClick={handleSaveResume} disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all disabled:opacity-50">
              {isSaving ? <FaSpinner className="animate-spin" size={11} /> : <FaCheck size={11} />}
              {resumeId ? "Save Changes" : "Save to Cloud"}
            </button>
          ) : (
            <button onClick={() => toast.error("Please sign in or register to save your resume drafts to the cloud.")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all">
              <FaCheck size={11} /> Save to Cloud
            </button>
          )}
          <button onClick={handlePrintClick} className="btn-ghost-light flex items-center gap-1.5 text-sm">
            <FaPrint size={13} /><span className="hidden sm:inline">Print</span>
          </button>
          <button onClick={() => navigate("/resume-view")} className="btn-brand flex items-center gap-1.5 text-sm">
            <FaEye size={13} /><span className="hidden sm:inline">Full Preview</span>
          </button>
          <button onClick={() => setMobilePreviewOpen(true)} className="btn-ghost-light lg:hidden text-sm">
            Preview
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Col 1: Sidebar ── */}
        <aside className="w-56 xl:w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto hidden lg:flex">
          <div className="px-4 pt-5 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Sections</p>
          </div>
          <nav className="flex-1 px-3 pb-3 space-y-0.5">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <button key={s.id} onClick={() => setStep(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                    ${active
                      ? "bg-gradient-to-r from-indigo-55 to-purple-55 text-indigo-700 border border-indigo-100/60"
                      : done ? "text-gray-700 hover:bg-gray-50"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
                    ${active ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm"
                      : done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                    {done ? <FaCheck size={9} /> : <Icon size={10} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight">{s.label}</div>
                    <div className={`text-xs leading-tight truncate ${active ? "text-indigo-505" : "text-gray-400"}`}>{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Completeness</span>
              <ScoreRing score={strength.pct} />
            </div>
          </div>
        </aside>

        {/* ── Col 2: Form ── */}
        <div className="flex flex-col bg-white border-r border-gray-100 w-full lg:w-[420px] xl:w-[480px] shrink-0">
          <div className="flex-1 overflow-y-auto p-6">{renderStep()}</div>
          <div className="border-t border-gray-100 px-5 py-3.5 flex justify-between items-center shrink-0 bg-white">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="btn-ghost-light flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed">
              <FaChevronLeft size={11} /> Back
            </button>
            <span className="text-xs text-gray-300 font-mono">{step + 1} / {steps.length}</span>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-brand flex items-center gap-1.5 text-sm px-4 py-2">
                Next <FaChevronRight size={11} />
              </button>
            ) : (
              <button onClick={() => navigate("/resume-view")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-md transition-all active:scale-95">
                <FaEye size={11} /> Preview
              </button>
            )}
          </div>
        </div>

        {/* ── Col 3: Preview ── */}
        <div className="flex-1 p-4 overflow-hidden hidden lg:flex flex-col">
          <ResumePreview data={draft} template={selectedTemplate} onTemplateChange={updateTemplate} printRef={printRef} />
        </div>

      </div>

      {/* Floating ATS Coach Badge */}
      <div className="fixed right-4 bottom-24 z-40">
        <button
          onClick={() => setShowAtsDrawer(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all border border-indigo-400/20 cursor-pointer"
        >
          <FaBrain className="animate-pulse text-indigo-200" />
          <span className="text-[10px] tracking-wider uppercase font-bold">ATS Coach</span>
          <span className="bg-white text-indigo-700 px-2 py-0.5 rounded-full text-xs font-black shadow-inner ml-1">
            {strength.pct}
          </span>
        </button>
      </div>

      {/* Collapsible Sliding ATS Drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[90vw] bg-white dark:bg-slate-900 shadow-2xl border-l border-gray-200 dark:border-slate-855 flex flex-col transition-all duration-300 ease-in-out transform
        ${showAtsDrawer ? "translate-x-0" : "translate-x-full"}`}>
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FaBrain className="text-indigo-600" />
            <span className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">ATS Live Coach</span>
          </div>
          <button 
            onClick={() => setShowAtsDrawer(false)}
            className="btn btn-sm btn-ghost btn-circle"
          >
            <FaTimes size={16} />
          </button>
        </div>
        
        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/20">
          <AtsHintPanel 
            atsContext={atsContext} 
            resumeData={resumeData || EMPTY} 
            strength={strength} 
            setDraft={setDraft} 
            setStep={setStep} 
            steps={steps}
          />
        </div>
      </div>
      
      {/* Drawer Overlay */}
      {showAtsDrawer && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-all duration-300"
          onClick={() => setShowAtsDrawer(false)}
        />
      )}

      {/* Mobile Floating Action Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button         onClick={() => setMobilePreviewOpen(true)}
          className="btn btn-primary shadow-2xl flex items-center gap-2 rounded-full px-5 py-3 h-auto"
        >
          <FaEye /> Preview Resume
        </button>
      </div>

      {/* Fullscreen Mobile Slide-Up Preview Sheet */}
      {mobilePreviewOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 w-full h-[90vh] rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Sheet Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-150 dark:border-slate-800 shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Preview</span>
                <span className="text-sm font-bold text-slate-805 dark:text-slate-200">{draft.personalInformation?.fullName || "Your Resume"}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handlePrintClick} className="btn btn-xs btn-ghost btn-circle">
                  <FaPrint size={14} />
                </button>
                <button onClick={() => setMobilePreviewOpen(false)} className="btn btn-sm btn-ghost btn-circle">
                  <FaTimes size={16} />
                </button>
              </div>
            </div>
            
            {/* Sheet Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4">
              <ResumePreview data={draft} template={selectedTemplate} onTemplateChange={updateTemplate} printRef={printRef} />
            </div>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};

export default GenerateResume;
