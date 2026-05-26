import { useEffect } from "react";
import { THEMES, FONTS } from "./templateConfig";
import { 
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe, FaLink, 
  FaLinkedin, FaGithub, FaBehance, FaDribbble, FaMedium, FaStackOverflow, FaBrain, FaGraduationCap, FaFlask 
} from "react-icons/fa";

// ── Font loader ───────────────────────────────────────────────────────────────
const useFontLoader = (fontId) => {
  useEffect(() => {
    const font = FONTS[fontId];
    if (!font?.googleUrl) return;
    const id = `font-${fontId}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = font.googleUrl;
    document.head.appendChild(link);
  }, [fontId]);
};

// Helper for mapping platform names to FaIcons
const getPlatformIcon = (platform) => {
  const p = (platform || "").toLowerCase();
  if (p === "linkedin") return <FaLinkedin className="inline mr-1" />;
  if (p === "github") return <FaGithub className="inline mr-1" />;
  if (p === "portfolio" || p === "website") return <FaGlobe className="inline mr-1" />;
  if (p === "behance") return <FaBehance className="inline mr-1" />;
  if (p === "dribbble") return <FaDribbble className="inline mr-1" />;
  if (p === "medium") return <FaMedium className="inline mr-1" />;
  if (p === "stackoverflow") return <FaStackOverflow className="inline mr-1" />;
  if (p === "kaggle") return <FaBrain className="inline mr-1" />;
  if (p === "researchgate") return <FaGraduationCap className="inline mr-1" />;
  return <FaLink className="inline mr-1" />;
};

// Helper to format/render all contact details + dynamic links
const renderContactLinks = (pi, size = 8) => {
  const items = [];
  if (pi.email) items.push({ icon: <FaEnvelope size={size} />, text: pi.email });
  if (pi.phoneNumber) items.push({ icon: <FaPhone size={size} />, text: pi.phoneNumber });
  if (pi.location) items.push({ icon: <FaMapMarkerAlt size={size} />, text: pi.location });

  if (Array.isArray(pi.links) && pi.links.length > 0) {
    pi.links.forEach(l => {
      if (l.url) {
        items.push({ icon: getPlatformIcon(l.platform), text: l.url });
      }
    });
  } else {
    // Fallback to legacy fields
    if (pi.linkedIn) items.push({ icon: <FaLinkedin size={size} />, text: pi.linkedIn });
    if (pi.gitHub) items.push({ icon: <FaGithub size={size} />, text: pi.gitHub });
    if (pi.portfolio) items.push({ icon: <FaGlobe size={size} />, text: pi.portfolio });
  }
  return items;
};

// Helper to extract & sort active visible sections, falling back to legacy keys
const getNormalizedSections = (data) => {
  if (!data) return [];
  if (Array.isArray(data.sections) && data.sections.length > 0) {
    return data.sections.filter(s => s.visible !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  
  // Legacy migration layout structure
  const sections = [];
  if (data.summary) {
    sections.push({ id: "summary", type: "summary", title: "Professional Summary", data: data.summary });
  }
  if (Array.isArray(data.experience) && data.experience.length > 0) {
    sections.push({ id: "experience", type: "experience", title: "Work Experience", data: data.experience });
  }
  if (Array.isArray(data.education) && data.education.length > 0) {
    sections.push({ id: "education", type: "education", title: "Education", data: data.education });
  }
  if (Array.isArray(data.skills) && data.skills.length > 0) {
    sections.push({ id: "skills", type: "skills", title: "Skills", data: data.skills });
  }
  if (Array.isArray(data.projects) && data.projects.length > 0) {
    sections.push({ id: "projects", type: "projects", title: "Projects", data: data.projects });
  }
  if (Array.isArray(data.certifications) && data.certifications.length > 0) {
    sections.push({ id: "certifications", type: "certifications", title: "Certifications", data: data.certifications });
  }
  if (Array.isArray(data.languages) && data.languages.length > 0) {
    sections.push({ id: "languages", type: "languages", title: "Languages", data: data.languages });
  }
  if (Array.isArray(data.interests) && data.interests.length > 0) {
    sections.push({ id: "interests", type: "interests", title: "Interests", data: data.interests });
  }
  return sections;
};

// Helper to render section data depending on type & template layout details
const renderSectionData = (sec, layoutType, t) => {
  if (!sec.data) return null;

  switch (sec.type) {
    case "summary":
      return (
        <p className={`text-gray-650 text-justify leading-relaxed ${layoutType === "elegant" ? "italic text-center" : ""}`}>
          {sec.data}
        </p>
      );

    case "skills":
      if (layoutType === "sidebar-modern") {
        return (
          <div className="space-y-1.5">
            {sec.data.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-[8px] mb-0.5">
                  <span className="truncate">{s.title}</span>
                </div>
                <div className="h-1 rounded-full w-full bg-gray-200">
                  <div className="h-1 rounded-full" style={{ backgroundColor: t.primary, width: s.level === "Expert" ? "95%" : s.level === "Advanced" ? "80%" : "60%" }} />
                </div>
              </div>
            ))}
          </div>
        );
      }
      if (layoutType === "corporate") {
        return (
          <div className="flex flex-wrap gap-1">
            {sec.data.map((s, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-[8.5px] font-semibold" style={{ backgroundColor: t.light, color: t.text }}>
                {s.title}
              </span>
            ))}
          </div>
        );
      }
      if (layoutType === "elegant") {
        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {sec.data.map((s, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-[8.5px] italic text-gray-700 bg-gray-50 border border-gray-200">
                {s.title}
              </span>
            ))}
          </div>
        );
      }
      if (layoutType === "technical") {
        return (
          <div className="grid grid-cols-3 gap-y-1 text-[8.5px]">
            {sec.data.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: t.primary }} />
                <span className="font-semibold text-gray-750">{s.title}</span>
              </div>
            ))}
          </div>
        );
      }
      if (layoutType === "minimal-ats" || layoutType === "compact-ats") {
        return (
          <p className="text-gray-650 text-[9.5px]">
            {sec.data.map(s => s.title).join(" • ")}
          </p>
        );
      }
      // default / executive
      return (
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9.5px]">
          {sec.data.map((s, i) => (
            <div key={i} className="flex items-center gap-1 text-gray-700">
              <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: t.primary }} />
              <span className="truncate">{s.title}</span>
            </div>
          ))}
        </div>
      );

    case "experience":
    case "volunteering":
    case "extracurricular":
    case "additional_experience":
    case "research":
      return (
        <div className="space-y-3">
          {sec.data.map((exp, i) => (
            <div key={i} className="text-[10px]">
              <div className="flex justify-between items-baseline font-bold text-gray-850">
                <span>{exp.title} {exp.company ? `— ${exp.company}` : ""}</span>
                <span className="text-gray-400 font-normal text-[8.5px]">
                  {exp.startDate} {exp.endDate ? `– ${exp.endDate}` : ""}
                </span>
              </div>
              <p className="text-gray-650 text-justify leading-relaxed mt-0.5 whitespace-pre-wrap">{exp.description}</p>
            </div>
          ))}
        </div>
      );

    case "education":
    case "courses":
    case "training":
      return (
        <div className="space-y-2.5">
          {sec.data.map((edu, i) => (
            <div key={i} className="text-[9.5px]">
              <div className="flex justify-between items-baseline font-bold text-gray-850">
                <span>{edu.degree || edu.title}</span>
                <span className="text-gray-400 font-normal text-[8.5px]">
                  {edu.startDate} {edu.endDate ? `– ${edu.endDate}` : ""}
                </span>
              </div>
              {edu.institution && <div className="text-gray-555 italic text-[9px]">{edu.institution}</div>}
              {edu.description && (
                <p className="text-gray-600 text-justify mt-1 leading-relaxed text-[8.5px] border-l-2 border-gray-150 pl-2 whitespace-pre-wrap">
                  {edu.description}
                </p>
              )}
            </div>
          ))}
        </div>
      );

    case "languages":
      return (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px]">
          {sec.data.map((l, i) => (
            <span key={i} className="text-gray-700">
              <span className="font-semibold">{l.language}</span> ({l.proficiency})
            </span>
          ))}
        </div>
      );

    case "interests":
    case "hobbies":
      return (
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-gray-600">
          {sec.data.map((item, i) => (
            <span key={i} className="bg-gray-100 px-2 py-0.5 rounded">
              {item.interest || item.name || (typeof item === "string" ? item : "")}
            </span>
          ))}
        </div>
      );

    case "projects":
      return (
        <div className="space-y-2">
          {sec.data.map((p, i) => (
            <div key={i} className="text-[9.5px]">
              <div className="flex justify-between items-baseline font-bold text-gray-850">
                <span>{p.title}</span>
                {p.link && <span className="text-indigo-600 font-mono font-normal text-[8px]">{p.link}</span>}
              </div>
              <p className="text-gray-600 mt-0.5 text-justify whitespace-pre-wrap">{p.description}</p>
            </div>
          ))}
        </div>
      );

    // Certifications, licenses, awards, patents, conferences, publications, references, custom
    default:
      return (
        <div className="space-y-2.5">
          {sec.data.map((item, i) => (
            <div key={i} className="text-[9.5px]">
              <div className="flex justify-between items-baseline font-bold text-gray-850">
                <span>{item.title || item.name}</span>
                <span className="text-gray-400 font-normal text-[8.5px]">
                  {item.date || item.issueDate || item.year}
                </span>
              </div>
              {(item.subtitle || item.issuer || item.organization) && (
                <div className="text-gray-550 text-[9px] italic">{item.subtitle || item.issuer || item.organization}</div>
              )}
              {item.description && <p className="text-gray-600 text-justify mt-0.5 leading-relaxed whitespace-pre-wrap">{item.description}</p>}
            </div>
          ))}
        </div>
      );
  }
};

// ── Unified Sample Dataset for Gallery ────────────────────────────────────────
export const SAMPLE_DATA = {
  personalInformation: {
    fullName: "Arthur Sherman",
    email: "arthur.sherman@example.com",
    phoneNumber: "+1 (555) 765-4321",
    location: "New York, NY",
    targetJobTitle: "Lead Systems Architect",
    profilePhoto: "",
    links: [
      { platform: "LinkedIn", url: "linkedin.com/in/arthursherman" },
      { platform: "GitHub", url: "github.com/arthursherman" },
      { platform: "Portfolio", url: "arthursherman.dev" }
    ]
  },
  sections: [
    {
      id: "summary",
      type: "summary",
      title: "Professional Summary",
      data: "Distinguished Systems Architect and Lead Engineer with over 8 years of experience spearheading distributed systems design, cloud-native deployments, and cross-functional engineering teams. Proven track record of scaling API architectures, cutting operational latency by 45%, and architecting mission-critical platforms in high-compliance SaaS environments.",
      order: 0,
      visible: true
    },
    {
      id: "experience",
      type: "experience",
      title: "Work Experience",
      data: [
        {
          title: "Principal Software Architect",
          company: "Apex Enterprise Solutions",
          startDate: "Oct 2022",
          endDate: "Present",
          description: "Lead architectural design for high-throughput messaging system serving 1.2M active users. Migrated monolithic services to containerized Go microservices, reducing AWS infrastructure spend by 30% and improving endpoint request latency from 250ms to 40ms. Spearheaded Kubernetes orchestrations across multi-region clusters."
        },
        {
          title: "Senior Lead Engineer",
          company: "SaaS Systems Corp",
          startDate: "Mar 2019",
          endDate: "Sep 2022",
          description: "Managed a team of 6 engineers building cloud storage APIs. Implemented advanced Redis caching strategies, yielding a 55% load reduction on core databases. Formulated automated integration pipelines using Jenkins and Terraform, trimming release cycles from weekly to bi-daily."
        }
      ],
      order: 1,
      visible: true
    },
    {
      id: "education",
      type: "education",
      title: "Education",
      data: [
        {
          degree: "M.S. in Computer Science",
          institution: "Stanford University",
          startDate: "2017",
          endDate: "2019",
          description: "Specialized in Distributed Systems and Cloud Computing. Graduate Assistant researcher."
        },
        {
          degree: "B.S. in Software Engineering",
          institution: "University of Illinois",
          startDate: "2013",
          endDate: "2017",
          description: "Graduated Magna Cum Laude."
        }
      ],
      order: 2,
      visible: true
    },
    {
      id: "skills",
      type: "skills",
      title: "Skills",
      data: [
        { title: "Java & Spring Boot", level: "Expert" },
        { title: "Go (Golang)", level: "Expert" },
        { title: "React & TypeScript", level: "Advanced" },
        { title: "PostgreSQL & Redis", level: "Expert" },
        { title: "Docker & Kubernetes", level: "Expert" },
        { title: "AWS Cloud Infrastructure", level: "Advanced" }
      ],
      order: 3,
      visible: true
    },
    {
      id: "projects",
      type: "projects",
      title: "Projects",
      data: [
        {
          title: "OpenTelemetry Scaler",
          description: "Automated auto-scaling operator for telemetry ingestion clusters. Adopted by over 12 large enterprise teams.",
          link: "github.com/telemetry-scaler"
        }
      ],
      order: 4,
      visible: true
    },
    {
      id: "certifications",
      type: "certifications",
      title: "Certifications",
      data: [
        {
          title: "AWS Solutions Architect Professional",
          issuer: "Amazon Web Services",
          issueDate: "2023"
        }
      ],
      order: 5,
      visible: true
    },
    {
      id: "languages",
      type: "languages",
      title: "Languages",
      data: [
        { language: "English", proficiency: "Native" },
        { language: "German", proficiency: "Conversational" }
      ],
      order: 6,
      visible: true
    }
  ]
};

// ── Executive Layout (executive) ──────────────────────────────────────────────
const ExecutiveLayout = ({ data, theme, fontStack }) => {
  const t = THEMES[theme];
  const sections = getNormalizedSections(data);

  return (
    <div style={{ fontFamily: fontStack, fontSize: "10.5px", lineHeight: "1.5" }} className="p-8 bg-white min-h-full flex flex-col justify-between">
      <div>
        {/* Name and Title with Photo */}
        <div className="flex justify-between items-center pb-4 mb-4" style={{ borderBottom: `2.5px double ${t.primary}` }}>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-wide text-gray-805 uppercase" style={{ fontFamily: "'Merriweather', Georgia, serif" }}>
              {data.personalInformation.fullName}
            </h1>
            {data.personalInformation.targetJobTitle && (
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">
                {data.personalInformation.targetJobTitle}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[9px] text-gray-550">
              {renderContactLinks(data.personalInformation, 8).map((link, idx) => (
                <span key={idx} className="flex items-center gap-1">{link.icon} {link.text}</span>
              ))}
            </div>
          </div>
          {data.personalInformation.profilePhoto && (
            <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 shrink-0 ml-4 shadow-sm">
              <img src={data.personalInformation.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Dynamic Sections rendering */}
        <div className="space-y-4">
          {sections.map(sec => (
            <div key={sec.id} className="animate-fade-in">
              {sec.type !== "summary" && (
                <h2 className="text-[11px] font-bold uppercase tracking-wider mb-2 pb-1" style={{ color: t.primary, borderBottom: `1px solid ${t.light}` }}>
                  {sec.title}
                </h2>
              )}
              {renderSectionData(sec, "executive", t)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Minimal ATS Layout (minimal-ats) ──────────────────────────────────────────
const MinimalAtsLayout = ({ data, fontStack }) => {
  const sections = getNormalizedSections(data);

  return (
    <div style={{ fontFamily: fontStack, fontSize: "10px", lineHeight: "1.4" }} className="p-8 bg-white min-h-full flex flex-col justify-between text-gray-850">
      <div>
        {/* Header */}
        <div className="mb-4 border-b pb-2">
          <h1 className="text-xl font-bold tracking-tight text-black">{data.personalInformation.fullName}</h1>
          {data.personalInformation.targetJobTitle && (
            <p className="text-[10.5px] font-bold text-gray-700 uppercase tracking-wide mt-0.5">
              {data.personalInformation.targetJobTitle}
            </p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[9px] text-gray-500 font-mono">
            {renderContactLinks(data.personalInformation, 8).map((link, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {link.icon} {link.text}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic Sections rendering */}
        <div className="space-y-4">
          {sections.map(sec => (
            <div key={sec.id} className="animate-fade-in">
              {sec.type !== "summary" && (
                <h2 className="text-[10px] font-bold uppercase tracking-wider border-b border-gray-900 pb-0.5 mb-2 text-black">
                  {sec.title}
                </h2>
              )}
              {renderSectionData(sec, "minimal-ats", null)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Corporate Layout (corporate) ──────────────────────────────────────────────
const CorporateLayout = ({ data, theme, fontStack }) => {
  const t = THEMES[theme];
  const sections = getNormalizedSections(data);

  return (
    <div style={{ fontFamily: fontStack, fontSize: "10px", lineHeight: "1.4" }} className="bg-white min-h-full flex flex-col justify-between">
      <div>
        {/* Banner header with Photo */}
        <div className="p-6 text-white flex justify-between items-center" style={{ backgroundColor: t.primary }}>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">{data.personalInformation.fullName}</h1>
            {data.personalInformation.targetJobTitle && (
              <p className="text-[9px] uppercase tracking-widest opacity-80 mt-0.5 font-bold">
                {data.personalInformation.targetJobTitle}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 mt-2 text-[9px] opacity-90">
              {renderContactLinks(data.personalInformation, 9).map((link, idx) => (
                <span key={idx} className="flex items-center gap-1">{link.icon} {link.text}</span>
              ))}
            </div>
          </div>
          {data.personalInformation.profilePhoto && (
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/20 shrink-0 ml-4 bg-white/10 shadow-inner">
              <img src={data.personalInformation.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          {/* Dynamic Sections rendering */}
          {sections.map(sec => (
            <div key={sec.id} className="animate-fade-in">
              {sec.type !== "summary" && (
                <h2 className="text-[10px] font-bold uppercase tracking-widest border-b-2 pb-0.5 mb-2" style={{ color: t.primary, borderColor: t.primary }}>
                  {sec.title}
                </h2>
              )}
              {renderSectionData(sec, "corporate", t)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Sidebar Modern Layout (sidebar-modern) ─────────────────────────────────────
const SidebarModernLayout = ({ data, theme, fontStack }) => {
  const t = THEMES[theme];
  const sections = getNormalizedSections(data);
  
  // Categorize sections
  const sidebarSectionTypes = ["skills", "languages", "interests", "hobbies"];
  const sidebarSections = sections.filter(sec => sidebarSectionTypes.includes(sec.type));
  const mainSections = sections.filter(sec => !sidebarSectionTypes.includes(sec.type));

  return (
    <div style={{ fontFamily: fontStack, fontSize: "9.5px", lineHeight: "1.4" }} className="flex min-h-full bg-white text-gray-700">
      {/* Left Sidebar */}
      <div className="w-[33%] p-5 shrink-0 flex flex-col justify-between" style={{ backgroundColor: t.light, borderRight: `1px solid ${t.primary}20` }}>
        <div>
          {data.personalInformation.profilePhoto ? (
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 mb-4 shadow bg-white">
              <img src={data.personalInformation.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white mb-4 shadow" style={{ backgroundColor: t.primary }}>
              {data.personalInformation.fullName?.charAt(0) || "A"}
            </div>
          )}
          <h1 className="text-sm font-bold text-gray-900 leading-tight">{data.personalInformation.fullName}</h1>
          {data.personalInformation.targetJobTitle && (
            <p className="text-[8px] text-gray-500 uppercase tracking-wider mt-0.5 font-bold">
              {data.personalInformation.targetJobTitle}
            </p>
          )}

          <div className="mt-6 space-y-2 text-[8px] text-gray-650">
            <h3 className="font-bold uppercase tracking-widest text-[8.5px] mb-1.5" style={{ color: t.primary }}>Contact</h3>
            {renderContactLinks(data.personalInformation, 8.5).map((link, idx) => (
              <div key={idx} className="flex items-center gap-1 truncate">
                {link.icon} <span className="truncate">{link.text}</span>
              </div>
            ))}
          </div>

          {/* Dynamic Sidebar Sections */}
          <div className="mt-6 space-y-5">
            {sidebarSections.map(sec => (
              <div key={sec.id} className="animate-fade-in">
                <h3 className="font-bold uppercase tracking-widest text-[8.5px] mb-2" style={{ color: t.primary }}>{sec.title}</h3>
                {renderSectionData(sec, "sidebar-modern", t)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 p-5 space-y-4">
        {/* Dynamic Main Body Sections */}
        {mainSections.map(sec => (
          <div key={sec.id} className="animate-fade-in">
            {sec.type !== "summary" && (
              <h2 className="text-[9px] font-bold uppercase tracking-wider mb-1.5 border-b pb-0.5" style={{ color: t.primary, borderColor: `${t.primary}20` }}>
                {sec.title}
              </h2>
            )}
            {renderSectionData(sec, "sidebar-modern", t)}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Elegant Layout (elegant) ───────────────────────────────────────────────
const ElegantLayout = ({ data, theme, fontStack }) => {
  const t = THEMES[theme];
  const sections = getNormalizedSections(data);

  return (
    <div style={{ fontFamily: fontStack, fontSize: "10px", lineHeight: "1.5" }} className="p-8 bg-white min-h-full flex flex-col justify-between text-gray-800">
      <div>
        {/* Centered Elegant Header with optional photo */}
        <div className="text-center mb-6 flex flex-col items-center">
          {data.personalInformation.profilePhoto && (
            <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-150 mb-3 shadow-sm">
              <img src={data.personalInformation.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="text-2xl font-normal tracking-wide text-gray-900 font-serif mb-1" style={{ fontFamily: "'Merriweather', Georgia, serif" }}>
            {data.personalInformation.fullName}
          </h1>
          {data.personalInformation.targetJobTitle && (
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-bold">
              {data.personalInformation.targetJobTitle}
            </p>
          )}
          <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-[8.5px] italic text-gray-550">
            {renderContactLinks(data.personalInformation, 8.5).map((link, idx) => (
              <span key={idx} className="flex items-center gap-1">{link.icon} {link.text}</span>
            ))}
          </div>
        </div>

        {/* Dynamic Sections rendering */}
        <div className="space-y-4">
          {sections.map(sec => (
            <div key={sec.id} className="animate-fade-in">
              {sec.type !== "summary" && (
                <h2 className="text-[10px] font-bold text-center tracking-widest uppercase border-b pb-1 mb-3 text-gray-900" style={{ borderColor: t.primary }}>
                  {sec.title}
                </h2>
              )}
              {renderSectionData(sec, "elegant", t)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Technical Layout (technical) ─────────────────────────────────────────────
const TechnicalLayout = ({ data, theme, fontStack }) => {
  const t = THEMES[theme];
  const sections = getNormalizedSections(data);
  
  // Isolate skills block to render in the custom layout block at the top if present
  const skillsSection = sections.find(sec => sec.type === "skills");
  const nonSkillsSections = sections.filter(sec => sec.type !== "skills");

  return (
    <div style={{ fontFamily: fontStack, fontSize: "9.5px", lineHeight: "1.4" }} className="p-8 bg-white min-h-full flex flex-col justify-between text-gray-800">
      <div>
        {/* Left aligned technical header */}
        <div className="flex justify-between items-start mb-4 border-b-2 pb-3" style={{ borderColor: t.primary }}>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">{data.personalInformation.fullName}</h1>
            {data.personalInformation.targetJobTitle && (
              <p className="text-[9px] text-gray-500 font-mono mt-0.5 font-bold uppercase tracking-wider">
                {data.personalInformation.targetJobTitle}
              </p>
            )}
          </div>
          <div className="text-right text-[8.5px] font-mono text-gray-650 space-y-0.5 flex flex-col items-end">
            {renderContactLinks(data.personalInformation, 8.5).map((link, idx) => (
              <div key={idx} className="flex items-center gap-1 justify-end">
                {link.icon} {link.text}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Skills Block AT TOP */}
        {skillsSection && (
          <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h2 className="text-[9px] font-bold uppercase tracking-wider mb-1.5 text-gray-900">{skillsSection.title}</h2>
            {renderSectionData(skillsSection, "technical", t)}
          </div>
        )}

        {/* Dynamic Sections rendering */}
        <div className="space-y-4">
          {nonSkillsSections.map(sec => (
            <div key={sec.id} className="animate-fade-in">
              {sec.type !== "summary" && (
                <h2 className="text-[9.5px] font-bold uppercase tracking-wider mb-2 text-gray-900 border-b pb-0.5" style={{ borderColor: `${t.primary}30` }}>
                  {sec.title}
                </h2>
              )}
              {renderSectionData(sec, "technical", t)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Compact ATS Layout (compact-ats) ─────────────────────────────────────────
const CompactAtsLayout = ({ data, fontStack }) => {
  const sections = getNormalizedSections(data);

  return (
    <div style={{ fontFamily: fontStack, fontSize: "8.5px", lineHeight: "1.3" }} className="p-5 bg-white min-h-full flex flex-col justify-between text-gray-800">
      <div>
        {/* Dense compact header */}
        <div className="text-center pb-2 mb-2 border-b border-gray-300">
          <h1 className="text-sm font-bold text-black uppercase tracking-tight">{data.personalInformation.fullName}</h1>
          {data.personalInformation.targetJobTitle && (
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">
              {data.personalInformation.targetJobTitle}
            </p>
          )}
          <div className="flex justify-center flex-wrap gap-x-2 text-[7.5px] text-gray-500 font-mono mt-0.5">
            {renderContactLinks(data.personalInformation, 7.5).map((link, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {link.icon} {link.text}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic Sections rendering */}
        <div className="space-y-3">
          {sections.map(sec => (
            <div key={sec.id} className="animate-fade-in">
              {sec.type !== "summary" && (
                <h2 className="text-[8px] font-bold uppercase border-b border-gray-300 pb-0.5 mb-1.5 text-black tracking-wide">
                  {sec.title}
                </h2>
              )}
              {renderSectionData(sec, "compact-ats", null)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────
const DynamicTemplate = ({ data, config }) => {
  const theme = config?.theme ?? "slate";
  const font = config?.font ?? "inter";
  const layout = config?.layout ?? "executive";
  const fontStack = FONTS[font]?.stack ?? FONTS.inter.stack;

  useFontLoader(font);

  const props = { data: data ?? SAMPLE_DATA, theme, fontStack };

  switch (layout) {
    case "minimal-ats":    return <MinimalAtsLayout {...props} />;
    case "corporate":      return <CorporateLayout {...props} />;
    case "sidebar-modern": return <SidebarModernLayout {...props} />;
    case "elegant":        return <ElegantLayout {...props} />;
    case "technical":      return <TechnicalLayout {...props} />;
    case "compact-ats":    return <CompactAtsLayout {...props} />;
    case "executive":
    default:               return <ExecutiveLayout {...props} />;
  }
};

export default DynamicTemplate;
