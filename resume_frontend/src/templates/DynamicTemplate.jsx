import { useEffect } from "react";
import { THEMES, FONTS } from "./templateConfig";
import { FaEnvelope, FaPhone, FaGithub, FaLinkedin, FaMapMarkerAlt, FaGlobe } from "react-icons/fa";

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

// ── Unified Sample Dataset for Gallery ────────────────────────────────────────
export const SAMPLE_DATA = {
  personalInformation: {
    fullName: "Arthur Sherman",
    email: "arthur.sherman@example.com",
    phoneNumber: "+1 (555) 765-4321",
    location: "New York, NY",
    linkedIn: "linkedin.com/in/arthursherman",
    gitHub: "github.com/arthursherman",
    portfolio: "arthursherman.dev"
  },
  summary:
    "Distinguished Systems Architect and Lead Engineer with over 8 years of experience spearheading distributed systems design, cloud-native deployments, and cross-functional engineering teams. Proven track record of scaling API architectures, cutting operational latency by 45%, and architecting mission-critical platforms in high-compliance SaaS environments.",
  skills: [
    { title: "Java & Spring Boot", level: "Expert" },
    { title: "Go (Golang)", level: "Expert" },
    { title: "React & TypeScript", level: "Advanced" },
    { title: "PostgreSQL & Redis", level: "Expert" },
    { title: "Docker & Kubernetes", level: "Expert" },
    { title: "AWS Cloud Infrastructure", level: "Advanced" },
    { title: "Distributed Systems Design", level: "Expert" },
    { title: "CI/CD & Jenkins", level: "Advanced" }
  ],
  experience: [
    {
      title: "Principal Software Architect",
      company: "Apex Enterprise Solutions",
      startDate: "Oct 2022",
      endDate: "Present",
      description:
        "Lead architectural design for high-throughput messaging system serving 1.2M active users. Migrated monolithic services to containerized Go microservices, reducing AWS infrastructure spend by 30% and improving endpoint request latency from 250ms to 40ms. Spearheaded Kubernetes orchestrations across multi-region clusters."
    },
    {
      title: "Senior Lead Engineer",
      company: "SaaS Systems Corp",
      startDate: "Mar 2019",
      endDate: "Sep 2022",
      description:
        "Managed a team of 6 engineers building cloud storage APIs. Implemented advanced Redis caching strategies, yielding a 55% load reduction on core databases. Formulated automated integration pipelines using Jenkins and Terraform, trimming release cycles from weekly to bi-daily."
    }
  ],
  education: [
    {
      degree: "M.S. in Computer Science",
      institution: "Stanford University",
      startDate: "2017",
      endDate: "2019"
    },
    {
      degree: "B.S. in Software Engineering",
      institution: "University of Illinois",
      startDate: "2013",
      endDate: "2017"
    }
  ],
  projects: [
    {
      title: "OpenTelemetry Scaler",
      description: "Automated auto-scaling operator for telemetry ingestion clusters. Adopted by over 12 large enterprise teams.",
      link: "github.com/telemetry-scaler"
    }
  ],
  certifications: [
    {
      title: "AWS Solutions Architect Professional",
      issuer: "Amazon Web Services",
      issueDate: "2023"
    }
  ],
  languages: [
    { language: "English", proficiency: "Native" },
    { language: "German", proficiency: "Conversational" }
  ],
  interests: []
};

// ── Executive Layout (executive) ──────────────────────────────────────────────
const ExecutiveLayout = ({ data, theme, fontStack }) => {
  const t = THEMES[theme];
  return (
    <div style={{ fontFamily: fontStack, fontSize: "10.5px", lineHeight: "1.5" }} className="p-8 bg-white min-h-full flex flex-col justify-between">
      <div>
        {/* Name and Title */}
        <div className="text-center pb-4 mb-4" style={{ borderBottom: `2.5px double ${t.primary}` }}>
          <h1 className="text-xl font-bold tracking-wide text-gray-800 uppercase" style={{ fontFamily: "'Merriweather', Georgia, serif" }}>
            {data.personalInformation.fullName}
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Lead Systems Architect</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-[9px] text-gray-550">
            {data.personalInformation.email && <span className="flex items-center gap-1"><FaEnvelope size={8} /> {data.personalInformation.email}</span>}
            {data.personalInformation.phoneNumber && <span className="flex items-center gap-1"><FaPhone size={8} /> {data.personalInformation.phoneNumber}</span>}
            {data.personalInformation.location && <span className="flex items-center gap-1"><FaMapMarkerAlt size={8} /> {data.personalInformation.location}</span>}
            {data.personalInformation.linkedIn && <span className="flex items-center gap-1"><FaLinkedin size={8} /> {data.personalInformation.linkedIn}</span>}
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <div className="mb-4">
            <p className="text-gray-650 text-justify leading-relaxed italic">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        <div className="mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider mb-2 pb-1" style={{ color: t.primary, borderBottom: `1px solid ${t.light}` }}>
            Professional Experience
          </h2>
          <div className="space-y-3">
            {data.experience?.slice(0, 2).map((exp, i) => (
              <div key={i} className="text-[10px]">
                <div className="flex justify-between items-baseline font-bold text-gray-850">
                  <span>{exp.title}</span>
                  <span className="text-gray-400 font-normal">{exp.startDate} – {exp.endDate || "Present"}</span>
                </div>
                <div className="flex justify-between text-[9.5px] italic text-gray-600 mb-1">
                  <span>{exp.company}</span>
                </div>
                <p className="text-gray-600 text-justify leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom grid (Skills and Education) */}
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider mb-2 pb-1" style={{ color: t.primary, borderBottom: `1px solid ${t.light}` }}>
              Expertise & Skills
            </h2>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9.5px]">
              {data.skills?.slice(0, 8).map((s, i) => (
                <div key={i} className="flex items-center gap-1 text-gray-700">
                  <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: t.primary }} />
                  <span className="truncate">{s.title}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider mb-2 pb-1" style={{ color: t.primary, borderBottom: `1px solid ${t.light}` }}>
              Education
            </h2>
            <div className="space-y-2">
              {data.education?.slice(0, 2).map((edu, i) => (
                <div key={i} className="text-[9.5px]">
                  <div className="font-bold text-gray-850">{edu.degree}</div>
                  <div className="text-gray-600">{edu.institution}</div>
                  <div className="text-gray-450 text-[8.5px]">{edu.endDate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Minimal ATS Layout (minimal-ats) ──────────────────────────────────────────
const MinimalAtsLayout = ({ data, fontStack }) => {
  return (
    <div style={{ fontFamily: fontStack, fontSize: "10px", lineHeight: "1.4" }} className="p-8 bg-white min-h-full flex flex-col justify-between text-gray-850">
      <div>
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold tracking-tight text-black">{data.personalInformation.fullName}</h1>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[9px] text-gray-500 font-mono">
            {data.personalInformation.email && <span>{data.personalInformation.email}</span>}
            {data.personalInformation.phoneNumber && <span>| {data.personalInformation.phoneNumber}</span>}
            {data.personalInformation.location && <span>| {data.personalInformation.location}</span>}
            {data.personalInformation.linkedIn && <span>| {data.personalInformation.linkedIn}</span>}
            {data.personalInformation.gitHub && <span>| {data.personalInformation.gitHub}</span>}
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <div className="mb-4">
            <p className="text-gray-600 text-justify">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        <div className="mb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-wider border-b border-gray-900 pb-0.5 mb-2 text-black">
            Experience
          </h2>
          <div className="space-y-3">
            {data.experience?.slice(0, 2).map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between font-bold text-[9.5px]">
                  <span>{exp.title} — {exp.company}</span>
                  <span className="font-normal text-gray-500">{exp.startDate} – {exp.endDate || "Present"}</span>
                </div>
                <p className="text-gray-600 mt-1 text-justify">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-wider border-b border-gray-900 pb-0.5 mb-2 text-black">
            Technical Skills
          </h2>
          <p className="text-gray-650 text-[9.5px]">
            <span className="font-bold">Core Technologies: </span>
            {data.skills?.map(s => s.title).join(", ")}
          </p>
        </div>

        {/* Education */}
        <div className="mb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-wider border-b border-gray-900 pb-0.5 mb-2 text-black">
            Education
          </h2>
          <div className="space-y-2">
            {data.education?.map((edu, i) => (
              <div key={i} className="flex justify-between text-[9.5px]">
                <span><span className="font-bold">{edu.degree}</span>, {edu.institution}</span>
                <span className="text-gray-500">{edu.endDate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Corporate Layout (corporate) ──────────────────────────────────────────────
const CorporateLayout = ({ data, theme, fontStack }) => {
  const t = THEMES[theme];
  return (
    <div style={{ fontFamily: fontStack, fontSize: "10px", lineHeight: "1.4" }} className="bg-white min-h-full flex flex-col justify-between">
      <div>
        {/* Banner header */}
        <div className="p-6 text-white" style={{ backgroundColor: t.primary }}>
          <h1 className="text-xl font-bold tracking-tight">{data.personalInformation.fullName}</h1>
          <p className="text-[9px] uppercase tracking-widest opacity-80 mt-0.5">Enterprise Systems Architect</p>
          <div className="flex flex-wrap gap-x-4 mt-2 text-[9px] opacity-90">
            {data.personalInformation.email && <span>{data.personalInformation.email}</span>}
            {data.personalInformation.phoneNumber && <span>{data.personalInformation.phoneNumber}</span>}
            {data.personalInformation.location && <span>{data.personalInformation.location}</span>}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Summary */}
          {data.summary && (
            <div>
              <p className="text-gray-600 leading-relaxed text-justify">{data.summary}</p>
            </div>
          )}

          {/* Work History */}
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest border-b-2 pb-0.5 mb-2" style={{ color: t.primary, borderColor: t.primary }}>
              Employment History
            </h2>
            <div className="space-y-3">
              {data.experience?.slice(0, 2).map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline font-bold text-gray-800">
                    <span>{exp.title} at {exp.company}</span>
                    <span className="text-gray-400 font-normal text-[8.5px]">{exp.startDate} – {exp.endDate || "Present"}</span>
                  </div>
                  <p className="text-gray-600 mt-1 leading-relaxed text-justify">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skills / Education split */}
          <div className="grid grid-cols-2 gap-6 pt-1">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest border-b-2 pb-0.5 mb-2" style={{ color: t.primary, borderColor: t.primary }}>
                Skills Grid
              </h2>
              <div className="flex flex-wrap gap-1">
                {data.skills?.slice(0, 6).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[8.5px] font-semibold" style={{ backgroundColor: t.light, color: t.text }}>
                    {s.title}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest border-b-2 pb-0.5 mb-2" style={{ color: t.primary, borderColor: t.primary }}>
                Education
              </h2>
              <div className="space-y-2">
                {data.education?.slice(0, 2).map((edu, i) => (
                  <div key={i} className="text-[9px]">
                    <div className="font-bold text-gray-800">{edu.degree}</div>
                    <div className="text-gray-500">{edu.institution} ({edu.endDate})</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sidebar Modern Layout (sidebar-modern) ─────────────────────────────────────
const SidebarModernLayout = ({ data, theme, fontStack }) => {
  const t = THEMES[theme];
  return (
    <div style={{ fontFamily: fontStack, fontSize: "9.5px", lineHeight: "1.4" }} className="flex min-h-full bg-white text-gray-700">
      {/* Left Sidebar */}
      <div className="w-[33%] p-5 shrink-0 flex flex-col justify-between" style={{ backgroundColor: t.light, borderRight: `1px solid ${t.primary}20` }}>
        <div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white mb-4 shadow" style={{ backgroundColor: t.primary }}>
            {data.personalInformation.fullName?.charAt(0) || "A"}
          </div>
          <h1 className="text-sm font-bold text-gray-900 leading-tight">{data.personalInformation.fullName}</h1>
          <p className="text-[8px] text-gray-500 uppercase tracking-wider mt-0.5">Systems Architect</p>

          <div className="mt-6 space-y-2 text-[8px] text-gray-600">
            <h3 className="font-bold uppercase tracking-widest text-[8.5px] mb-1.5" style={{ color: t.primary }}>Contact</h3>
            {data.personalInformation.email && <div className="truncate">{data.personalInformation.email}</div>}
            {data.personalInformation.phoneNumber && <div>{data.personalInformation.phoneNumber}</div>}
            {data.personalInformation.location && <div>{data.personalInformation.location}</div>}
            {data.personalInformation.linkedIn && <div className="truncate">{data.personalInformation.linkedIn}</div>}
          </div>

          <div className="mt-6">
            <h3 className="font-bold uppercase tracking-widest text-[8.5px] mb-2" style={{ color: t.primary }}>Skills</h3>
            <div className="space-y-1.5">
              {data.skills?.slice(0, 6).map((s, i) => (
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
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 p-5 space-y-4">
        {data.summary && (
          <div>
            <h2 className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.primary }}>Summary</h2>
            <p className="leading-relaxed text-justify">{data.summary}</p>
          </div>
        )}

        <div>
          <h2 className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: t.primary }}>Professional History</h2>
          <div className="space-y-3">
            {data.experience?.slice(0, 2).map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between font-bold text-gray-800 text-[9px]">
                  <span>{exp.title}</span>
                  <span className="text-gray-400 font-normal text-[8px]">{exp.startDate} – {exp.endDate || "Present"}</span>
                </div>
                <div className="text-[8.5px] font-semibold text-gray-500 mb-0.5">{exp.company}</div>
                <p className="leading-relaxed text-justify">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: t.primary }}>Education</h2>
          <div className="space-y-2">
            {data.education?.slice(0, 2).map((edu, i) => (
              <div key={i} className="text-[8.5px]">
                <span className="font-bold text-gray-800">{edu.degree}</span> · {edu.institution}
                <span className="text-gray-400 ml-1">({edu.endDate})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Elegant Layout (elegant) ───────────────────────────────────────────────
const ElegantLayout = ({ data, theme, fontStack }) => {
  const t = THEMES[theme];
  return (
    <div style={{ fontFamily: fontStack, fontSize: "10px", lineHeight: "1.5" }} className="p-8 bg-white min-h-full flex flex-col justify-between text-gray-800">
      <div>
        {/* Centered Elegant Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-normal tracking-wide text-gray-900 font-serif mb-1" style={{ fontFamily: "'Merriweather', Georgia, serif" }}>
            {data.personalInformation.fullName}
          </h1>
          <div className="flex justify-center flex-wrap gap-x-4 text-[8.5px] italic text-gray-500">
            {data.personalInformation.email && <span>{data.personalInformation.email}</span>}
            {data.personalInformation.phoneNumber && <span>{data.personalInformation.phoneNumber}</span>}
            {data.personalInformation.location && <span>{data.personalInformation.location}</span>}
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <div className="mb-5 text-center px-4">
            <p className="leading-relaxed text-gray-600 italic text-justify">{data.summary}</p>
          </div>
        )}

        {/* History */}
        <div className="mb-5">
          <h2 className="text-[10px] font-bold text-center tracking-widest uppercase border-b pb-1 mb-3 text-gray-900" style={{ borderColor: t.primary }}>
            Professional Background
          </h2>
          <div className="space-y-4">
            {data.experience?.slice(0, 2).map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between font-serif text-[10px] font-bold text-gray-850">
                  <span>{exp.title}</span>
                  <span className="font-normal italic text-gray-400">{exp.startDate} – {exp.endDate || "Present"}</span>
                </div>
                <div className="text-[9px] italic text-gray-600 mb-1">{exp.company}</div>
                <p className="text-gray-650 leading-relaxed text-justify">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Education & Skills */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-[9px] font-bold tracking-widest uppercase border-b pb-1 mb-2 text-gray-900" style={{ borderColor: t.primary }}>
              Academic Degrees
            </h2>
            <div className="space-y-2">
              {data.education?.slice(0, 2).map((edu, i) => (
                <div key={i} className="text-[9px]">
                  <div className="font-serif font-bold text-gray-850">{edu.degree}</div>
                  <div className="text-gray-600">{edu.institution} ({edu.endDate})</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-[9px] font-bold tracking-widest uppercase border-b pb-1 mb-2 text-gray-900" style={{ borderColor: t.primary }}>
              Technical Skills
            </h2>
            <div className="flex flex-wrap gap-1">
              {data.skills?.slice(0, 6).map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[8.5px] italic text-gray-700 bg-gray-50 border border-gray-200">
                  {s.title}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Technical Layout (technical) ─────────────────────────────────────────────
const TechnicalLayout = ({ data, theme, fontStack }) => {
  const t = THEMES[theme];
  return (
    <div style={{ fontFamily: fontStack, fontSize: "9.5px", lineHeight: "1.4" }} className="p-8 bg-white min-h-full flex flex-col justify-between text-gray-800">
      <div>
        {/* Left aligned technical header */}
        <div className="flex justify-between items-start mb-4 border-b-2 pb-3" style={{ borderColor: t.primary }}>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">{data.personalInformation.fullName}</h1>
            <p className="text-[9px] text-gray-500 font-mono mt-0.5">Software Architect / Engineer</p>
          </div>
          <div className="text-right text-[8.5px] font-mono text-gray-650 space-y-0.5">
            {data.personalInformation.email && <div>{data.personalInformation.email}</div>}
            {data.personalInformation.phoneNumber && <div>{data.personalInformation.phoneNumber}</div>}
            {data.personalInformation.location && <div>{data.personalInformation.location}</div>}
          </div>
        </div>

        {/* Category Skills Block AT TOP */}
        <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <h2 className="text-[9px] font-bold uppercase tracking-wider mb-1.5 text-gray-900">Core Technologies</h2>
          <div className="grid grid-cols-3 gap-y-1 text-[8.5px]">
            {data.skills?.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: t.primary }} />
                <span className="font-semibold text-gray-750">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="mb-4">
          <h2 className="text-[9.5px] font-bold uppercase tracking-wider mb-2 text-gray-900">Experience</h2>
          <div className="space-y-3">
            {data.experience?.slice(0, 2).map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between font-semibold text-gray-850">
                  <span>{exp.title} — <span style={{ color: t.primary }}>{exp.company}</span></span>
                  <span className="font-normal text-gray-400 font-mono text-[8px]">{exp.startDate} – {exp.endDate || "Present"}</span>
                </div>
                <p className="leading-relaxed text-justify mt-0.5">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="mb-4">
          <h2 className="text-[9.5px] font-bold uppercase tracking-wider mb-2 text-gray-900">Education</h2>
          <div className="space-y-2">
            {data.education?.slice(0, 2).map((edu, i) => (
              <div key={i} className="flex justify-between text-[9px]">
                <span><span className="font-bold">{edu.degree}</span>, {edu.institution}</span>
                <span className="font-mono text-gray-400 text-[8px]">{edu.endDate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Compact ATS Layout (compact-ats) ─────────────────────────────────────────
const CompactAtsLayout = ({ data, fontStack }) => {
  return (
    <div style={{ fontFamily: fontStack, fontSize: "8.5px", lineHeight: "1.3" }} className="p-5 bg-white min-h-full flex flex-col justify-between text-gray-800">
      <div>
        {/* Dense compact header */}
        <div className="text-center pb-2 mb-2 border-b border-gray-300">
          <h1 className="text-sm font-bold text-black uppercase tracking-tight">{data.personalInformation.fullName}</h1>
          <div className="flex justify-center flex-wrap gap-x-2 text-[7.5px] text-gray-500 font-mono mt-0.5">
            {data.personalInformation.email && <span>{data.personalInformation.email}</span>}
            {data.personalInformation.phoneNumber && <span>• {data.personalInformation.phoneNumber}</span>}
            {data.personalInformation.location && <span>• {data.personalInformation.location}</span>}
            {data.personalInformation.linkedIn && <span>• {data.personalInformation.linkedIn}</span>}
          </div>
        </div>

        {/* Dense summary */}
        {data.summary && (
          <div className="mb-2">
            <p className="text-gray-650 text-justify leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* Dense experience */}
        <div className="mb-2">
          <h2 className="text-[8px] font-bold uppercase border-b border-gray-300 pb-0.5 mb-1.5 text-black tracking-wide">
            Professional Experience
          </h2>
          <div className="space-y-2">
            {data.experience?.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between font-bold text-[8px]">
                  <span>{exp.title} ({exp.company})</span>
                  <span className="font-normal text-gray-500">{exp.startDate} – {exp.endDate || "Present"}</span>
                </div>
                <p className="text-gray-650 text-justify mt-0.5">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dense skills */}
        <div className="mb-2">
          <h2 className="text-[8px] font-bold uppercase border-b border-gray-300 pb-0.5 mb-1 text-black tracking-wide">
            Technical Competencies
          </h2>
          <p className="text-gray-650">
            {data.skills?.map(s => s.title).join(" • ")}
          </p>
        </div>

        {/* Dense education */}
        <div className="mb-2">
          <h2 className="text-[8px] font-bold uppercase border-b border-gray-300 pb-0.5 mb-1 text-black tracking-wide">
            Education
          </h2>
          <div className="space-y-1">
            {data.education?.map((edu, i) => (
              <div key={i} className="flex justify-between text-[8px]">
                <span><span className="font-bold">{edu.degree}</span> — {edu.institution}</span>
                <span className="text-gray-500">{edu.endDate}</span>
              </div>
            ))}
          </div>
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
