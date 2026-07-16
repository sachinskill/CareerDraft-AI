import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaRocket, FaBrain, FaFileAlt, FaUpload,
  FaCheckCircle, FaArrowRight,
} from "react-icons/fa";

const STEPS = [
  { n: "1", title: "Describe Yourself", desc: "Tell our AI about your experience, skills, and career goals in plain English." },
  { n: "2", title: "AI Builds Your Resume", desc: "Groq AI structures your input into a professionally formatted, ATS-optimized resume." },
  { n: "3", title: "Analyze & Download", desc: "Check your ATS score against any job description, then download as PDF." },
];

const STATS = [
  { value: "90%", label: "of resumes rejected by ATS before a human reads them" },
  { value: "6x", label: "more interview callbacks with an ATS-optimized resume" },
  { value: "30s", label: "to get your full ATS score and improvement plan" },
];

const SCORE_BARS = [
  { label: "Keyword Match", pct: 80 },
  { label: "Section Quality", pct: 75 },
  { label: "Impact Score", pct: 60 },
  { label: "Experience Alignment", pct: 90 },
  { label: "Readability", pct: 70 },
  { label: "Summary Quality", pct: 40 },
];

const CHECK_ITEMS = [
  "Keyword match with severity tiers (Critical / Important / Nice-to-have)",
  "Impact & quantification analysis on every bullet point",
  "Experience alignment vs. job requirements",
  "Readability flags — weak verbs, first-person, overlong bullets",
  "AI-rewritten bullet examples you can copy directly",
  "Role-specific tailoring tips",
];

const CardCorners = () => (
  <>
    <div className="absolute -top-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -top-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -bottom-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    <div className="absolute -bottom-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
  </>
);

const Step1Mockup = () => (
  <div className="w-full h-full bg-[#FFFFFF] border border-[#DDD5C4] rounded-[8px] p-4 text-left font-sans flex flex-col shadow-sm">
    <div className="text-[10px] text-[#5A5347] uppercase tracking-wider mb-2 font-semibold font-space">
      Job Description / Experience Input
    </div>
    <div className="flex-1 bg-[#F4F0E8]/40 rounded-[6px] border border-[#DDD5C4] p-3 text-[10px] text-[#1B2A4A] font-mono leading-relaxed overflow-y-auto">
      <span className="text-[#DB9A3C] font-bold">{"// Describe your background"}</span>
      <p className="mt-1">5 years experience as a Java Backend Engineer.</p>
      <p>Led a team of 4 developers to build scalable microservices using Spring Boot.</p>
      <p>Optimized SQL queries, reducing database load by 35%.</p>
      <span className="animate-pulse">|</span>
    </div>
  </div>
);

const Step2Mockup = () => (
  <div className="w-full h-full bg-[#FFFFFF] border border-[#DDD5C4] rounded-[8px] p-4 text-left flex flex-col font-sans shadow-sm">
    <div className="w-full bg-[#1B2A4A] text-white rounded-[4px] py-1.5 px-3 text-center mb-3">
      <div className="font-semibold text-[10px] font-space tracking-wide">Alex Mercer</div>
      <div className="text-[7px] opacity-75 font-mono">alex.mercer@email.com | San Francisco, CA</div>
    </div>
    <div className="space-y-3 flex-1 overflow-hidden">
      <div>
        <div className="h-2 w-16 bg-[#1B2A4A] rounded mb-1.5" />
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-[#F4F0E8] rounded" />
          <div className="h-1.5 w-[90%] bg-[#F4F0E8] rounded" />
        </div>
      </div>
      <div>
        <div className="h-2 w-20 bg-[#1B2A4A] rounded mb-1.5" />
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-[#F4F0E8] rounded" />
          <div className="h-1.5 w-[85%] bg-[#F4F0E8] rounded" />
        </div>
      </div>
    </div>
  </div>
);

const Step3Mockup = () => (
  <div className="w-full h-full bg-[#FFFFFF] border border-[#DDD5C4] rounded-[8px] p-4 text-left flex flex-col justify-center font-sans shadow-sm">
    <div className="flex justify-between items-center mb-3">
      <div className="text-[10px] font-semibold text-[#1B2A4A] font-space">Overall ATS Score</div>
      <div className="text-xs font-bold text-[#DB9A3C] font-mono-score">78%</div>
    </div>
    <div className="space-y-2">
      <div>
        <div className="flex justify-between text-[8px] text-[#5A5347] mb-0.5">
          <span>Keyword Match</span>
          <span className="font-mono-score font-semibold">80%</span>
        </div>
        <div className="w-full bg-[#F4F0E8] rounded-full h-1.5">
          <div className="bg-[#3F9F6B] h-1.5 rounded-full" style={{ width: "80%" }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[8px] text-[#5A5347] mb-0.5">
          <span>Experience Alignment</span>
          <span className="font-mono-score font-semibold">90%</span>
        </div>
        <div className="w-full bg-[#F4F0E8] rounded-full h-1.5">
          <div className="bg-[#3F9F6B] h-1.5 rounded-full" style={{ width: "90%" }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[8px] text-[#5A5347] mb-0.5">
          <span>Impact Score</span>
          <span className="font-mono-score font-semibold">60%</span>
        </div>
        <div className="w-full bg-[#F4F0E8] rounded-full h-1.5">
          <div className="bg-[#DB9A3C] h-1.5 rounded-full" style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const [activeStep, setActiveStep] = React.useState(0);

  // Section animation config
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  return (
    <div className="bg-[var(--paper)] min-h-screen relative overflow-hidden">
      
      {/* Dynamic Scanning Grid Background for Hero */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{
          height: "85vh",
          backgroundImage: `
            linear-gradient(to right, rgba(219, 154, 60, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(219, 154, 60, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "45px 45px"
        }}
      />

      {/* Hero */}
      <motion.section 
        {...fadeInUp}
        className="min-h-[85vh] flex items-center bg-transparent py-16 md:py-24 border-b border-[var(--border-hairline)] relative z-10"
      >
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Column */}
            <div className="text-left flex flex-col justify-center">
              <div className="text-[var(--signal-amber)] font-mono-score text-xs uppercase tracking-[0.05em] mb-3">
                ATS-FIRST RESUME BUILDER
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[var(--ink-navy)] font-space leading-tight mb-4">
                Built to pass the scan.<br />
                Written to get the call.
              </h1>
              <p className="text-sm font-sans text-[var(--text-secondary)] leading-relaxed mb-8 max-w-[420px]">
                Every resume is scored against real ATS parsing rules before you send it — not after a rejection.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <Link to="/templates?mode=ai" className="bg-[var(--signal-amber)] text-[var(--ink-navy)] font-semibold text-sm rounded-[8px] px-6 py-3.5 transition-all hover:bg-[#c4862f] active:scale-95 font-sans">
                  Generate with AI
                </Link>
                <Link to="/templates?mode=scratch" className="bg-transparent border border-[var(--border-hairline)] text-[var(--ink-navy)] font-semibold text-sm rounded-[8px] px-6 py-3.5 transition-all hover:bg-[var(--paper)]/55 active:scale-95 font-sans">
                  Start from Scratch
                </Link>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] font-sans mt-3">
                Free — no credit card required
              </p>
            </div>

            {/* Right Column: High-Fidelity Product UI Screenshot inside Browser Frame */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-lg bg-gradient-to-b from-[var(--paper-white)] to-white border border-[var(--border-hairline)] rounded-[12px] overflow-hidden shadow-[0_12px_40px_rgba(27,42,74,0.08)] relative group">
                <CardCorners />
                {/* Browser top bar */}
                <div className="bg-[var(--paper)] border-b border-[var(--border-hairline)] px-4 py-2.5 flex items-center gap-1.5 select-none">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E85D4E]/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E8A33D]/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3F9F6B]/60" />
                  <div className="ml-4 bg-white/70 border border-[var(--border-hairline)]/40 rounded-[4px] text-[9px] text-[var(--text-secondary)] px-4 py-0.5 w-44 text-center truncate">
                    app.resumemaker.com/ats-score
                  </div>
                </div>
                {/* Screenshot */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--paper)]">
                  {/* Scanning scan line overlaying the image */}
                  <div className="absolute left-0 right-0 h-[2px] bg-[var(--signal-amber)] animate-scan pointer-events-none z-10" />
                  <img 
                    src="/images/resume_ats_dashboard.png" 
                    alt="CareerDraft Dashboard Overview" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section 
        {...fadeInUp}
        className="py-12 bg-[var(--ink-navy)] text-white border-b border-[var(--border-hairline)]"
      >
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-4 text-center">
            {/* Stat 1 */}
            <div className="flex-1">
              <div className="font-mono-score font-semibold text-4xl text-white mb-2">{STATS[0].value}</div>
              <p className="font-sans text-[12px] text-[#B8C2D4] max-w-xs mx-auto">{STATS[0].label}</p>
            </div>
            {/* Stat 2 (Emphasized) */}
            <div className="flex-1 md:scale-105">
              <div className="font-mono-score font-semibold text-[56px] text-[var(--signal-amber)] mb-1.5 leading-none">{STATS[1].value}</div>
              <p className="font-sans text-sm font-medium text-white max-w-xs mx-auto">{STATS[1].label}</p>
            </div>
            {/* Stat 3 */}
            <div className="flex-1">
              <div className="font-mono-score font-semibold text-4xl text-white mb-2">{STATS[2].value}</div>
              <p className="font-sans text-[12px] text-[#B8C2D4] max-w-xs mx-auto">{STATS[2].label}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features - Bento Workspace */}
      <motion.section 
        {...fadeInUp}
        className="py-20 bg-[var(--paper-white)] relative"
      >
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl font-semibold text-center text-[var(--ink-navy)] font-space mb-3">Everything you need</h2>
          <p className="text-center text-[var(--text-secondary)] font-sans mb-16">One tool to build, analyze, and optimize your resume.</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Core Card: ATS Score Analysis (Animated Radial Score) */}
            <div className="lg:col-span-2 relative bg-gradient-to-b from-[var(--paper-white)] to-white border border-[var(--border-hairline)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.05)] rounded-[12px] p-8 flex flex-col md:flex-row gap-8 items-center text-left self-start w-full min-h-[220px]">
              <CardCorners />
              
              {/* Mockup visual */}
              <div className="w-full md:w-[45%] shrink-0 flex flex-col items-center justify-center bg-[var(--paper)] rounded-[8px] border border-[var(--border-hairline)] p-4 relative aspect-[4/3] sm:aspect-auto">
                <div className="relative w-24 h-24 mb-2">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-[#DDD5C4]" />
                    <motion.circle 
                      cx="48" 
                      cy="48" 
                      r="38" 
                      stroke="#3F9F6B" 
                      strokeWidth="6" 
                      fill="transparent"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "238", strokeDashoffset: "238" }}
                      whileInView={{ strokeDashoffset: `${238 * (1 - 0.8)}` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold font-mono-score text-[#3F9F6B]">80%</span>
                    <span className="text-[7px] text-[var(--text-secondary)] font-mono uppercase">Keywords</span>
                  </div>
                </div>
                {/* Numerical ticks */}
                <div className="w-full flex justify-between text-[8px] font-mono text-[var(--text-secondary)] px-2 select-none">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              {/* Text content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-space font-semibold text-xl text-[var(--ink-navy)] mb-3">ATS Score Analysis</h3>
                <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  6-dimensional scoring — keyword match, impact, readability, experience alignment, and more.
                </p>
              </div>
            </div>

            {/* Right Column with other 3 cards stacked */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              
              {/* Card 2: AI Suggestions (IDE Diff Highlights) */}
              <div className="relative bg-gradient-to-b from-[var(--paper-white)] to-white border border-[var(--border-hairline)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-4 text-left">
                <CardCorners />
                
                {/* IDE Window block */}
                <div className="w-full bg-[#1B2A4A] rounded-[8px] overflow-hidden border border-[#2C3E5E] shadow-sm flex flex-col">
                  {/* IDE header tab */}
                  <div className="w-full bg-[#14213B] px-3 py-1.5 text-[8px] font-mono text-[#9AA7BE] flex justify-between items-center border-b border-[#2C3E5E]">
                    <span>ai_suggestions.diff</span>
                    <span className="text-[var(--signal-amber)] bg-[var(--signal-amber)]/10 px-1.5 py-0.5 rounded-[3px] font-bold text-[7px] tracking-wider uppercase">REWRITE ENGINE</span>
                  </div>
                  {/* IDE Content */}
                  <div className="p-3 text-[8.5px] font-mono leading-relaxed space-y-1.5 text-left bg-[#1E2E4F]">
                    <div className="bg-[#E85D4E]/15 text-[#E85D4E] px-2 py-1 rounded border border-[#E85D4E]/25">
                      - Worked on backend APIs
                    </div>
                    <div className="bg-[#3F9F6B]/15 text-[#3F9F6B] px-2 py-1 rounded border border-[#3F9F6B]/25">
                      + Architected 12 Spring Boot REST APIs handling 50k daily requests
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-space font-semibold text-base text-[var(--ink-navy)] mb-1.5">AI-Powered Suggestions</h3>
                  <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                    Groq AI tells you exactly how to improve your resume for each specific job posting.
                  </p>
                </div>
              </div>

              {/* Card 3: Templates (Staggered Hover Spread) */}
              <div className="relative bg-gradient-to-b from-[var(--paper-white)] to-white border border-[var(--border-hairline)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-4 text-left">
                <CardCorners />
                
                <motion.div 
                  className="w-full h-[80px] bg-[var(--paper)] rounded-[8px] border border-[var(--border-hairline)] p-2 flex items-center justify-center gap-2 overflow-hidden relative cursor-pointer"
                  whileHover="hover"
                  initial="rest"
                >
                  <motion.div 
                    variants={{ rest: { x: 0, rotate: 0 }, hover: { x: -14, rotate: -8 } }} 
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-[38px] h-[52px] bg-white border border-[var(--border-hairline)] rounded-[3px] relative overflow-hidden shadow-sm shrink-0"
                  >
                    <div className="w-full h-1 bg-[var(--ink-navy)]" />
                    <div className="p-1 space-y-0.5">
                      <div className="w-6 h-0.5 bg-[var(--paper)]" />
                      <div className="w-4 h-0.5 bg-[var(--paper)]" />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    variants={{ rest: { y: 0, scale: 1 }, hover: { y: -4, scale: 1.05 } }} 
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-[42px] h-[58px] bg-white border-2 border-[var(--signal-amber)] rounded-[4px] relative overflow-hidden shadow-md z-10 shrink-0"
                  >
                    <div className="w-full h-1.5 bg-[var(--signal-amber)]" />
                    <div className="p-1 space-y-0.5">
                      <div className="w-6 h-0.5 bg-[var(--paper)]" />
                      <div className="w-7 h-0.5 bg-[var(--paper)]" />
                      <div className="w-5 h-0.5 bg-[var(--paper)]" />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    variants={{ rest: { x: 0, rotate: 0 }, hover: { x: 14, rotate: 8 } }} 
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-[38px] h-[52px] bg-white border border-[var(--border-hairline)] rounded-[3px] relative overflow-hidden shadow-sm shrink-0"
                  >
                    <div className="w-full h-1 bg-[#3F9F6B]" />
                    <div className="p-1 space-y-0.5">
                      <div className="w-3 h-0.5 bg-[var(--paper)]" />
                      <div className="w-4 h-0.5 bg-[var(--paper)]" />
                    </div>
                  </motion.div>
                </motion.div>

                <div>
                  <h3 className="font-space font-semibold text-base text-[var(--ink-navy)] mb-1.5">Professional Templates</h3>
                  <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                    Three ATS-friendly templates — Default, Modern, and Minimalist — switch instantly.
                  </p>
                </div>
              </div>

              {/* Card 4: Upload (Animated Active Progress) */}
              <div className="relative bg-gradient-to-b from-[var(--paper-white)] to-white border border-[var(--border-hairline)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.05)] rounded-[12px] p-6 flex flex-col gap-4 text-left">
                <CardCorners />
                
                <div className="w-full bg-[var(--paper)] rounded-[8px] border border-[var(--border-hairline)] p-3 flex flex-col justify-between overflow-hidden gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaFileAlt className="text-[var(--ink-navy)] text-base shrink-0" />
                      <div className="text-left">
                        <div className="text-[10px] font-semibold text-[var(--ink-navy)] truncate max-w-[120px]">resume_draft.pdf</div>
                        <div className="text-[8px] text-[var(--text-secondary)] font-mono">142 KB | PDF DOCUMENT</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center p-1.5 rounded-[4px] bg-white border border-[var(--border-hairline)] shadow-sm">
                      <FaUpload className="text-[10px] text-[var(--ink-navy)]" />
                    </div>
                  </div>
                  
                  {/* Processing Metric Row with animated width */}
                  <div className="pt-2 border-t border-[var(--border-hairline)]/65 space-y-1">
                    <div className="w-full bg-white rounded-full h-1 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
                        className="h-full bg-[var(--signal-amber)]"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-mono text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3F9F6B] animate-pulse" /> PARSED OK</span>
                      <span className="text-[var(--signal-amber)]">SCAN RATIO 1:1</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-space font-semibold text-base text-[var(--ink-navy)] mb-1.5">Upload & Analyze</h3>
                  <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                    Upload your existing PDF or DOCX resume and get a detailed score in seconds.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </motion.section>

      {/* How it works */}
      <motion.section 
        {...fadeInUp}
        className="py-20 bg-[var(--paper)] border-t border-[var(--border-hairline)]"
      >
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-semibold text-center text-[var(--ink-navy)] font-space mb-3">How it works</h2>
          <p className="text-center text-[var(--text-secondary)] font-sans mb-12">Three steps from zero to interview-ready.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-[45fr_55fr] gap-8 items-stretch">
            
            {/* Left Column: Vertical Stepper */}
            <div className="flex flex-col gap-2">
              {STEPS.map((s, idx) => {
                const isActive = activeStep === idx;
                const stepNum = `0${s.n}`;
                
                return (
                  <div
                    key={s.n}
                    role="button"
                    tabIndex={0}
                    onMouseEnter={() => {
                      if (window.innerWidth >= 768) {
                        setActiveStep(idx);
                      }
                    }}
                    onClick={() => setActiveStep(idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveStep(idx);
                      }
                    }}
                    className={`text-left p-4 pl-5 border-l-[3px] transition-all duration-200 cursor-pointer rounded-[6px] outline-none focus:ring-1 focus:ring-[var(--signal-amber)]/50 relative ${
                      isActive 
                        ? "bg-gradient-to-b from-[var(--paper-white)] to-white border-[var(--border-hairline)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.05)] border-t border-r border-b border-[var(--border-hairline)] border-l-[var(--signal-amber)]" 
                        : "bg-transparent border-transparent hover:bg-white/40 hover:border-[var(--signal-amber)]/40"
                    }`}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`font-mono-score text-xs font-semibold ${
                        isActive ? "text-[var(--signal-amber)]" : "text-[var(--text-secondary)]"
                      }`}>
                        {stepNum}
                      </span>
                      <h3 className="font-space font-semibold text-base text-[var(--ink-navy)]">
                        {s.title}
                      </h3>
                    </div>
                    <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      {s.desc}
                    </p>
                    
                    {/* Inline mobile preview - shown only when active on mobile */}
                    <div className={`mt-4 md:hidden transition-all duration-300 overflow-hidden ${
                      isActive ? "max-h-[350px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}>
                      <div className="border border-[var(--border-hairline)] rounded-[8px] bg-white p-4 h-[240px]">
                        {idx === 0 && <Step1Mockup />}
                        {idx === 1 && <Step2Mockup />}
                        {idx === 2 && <Step3Mockup />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Preview Panel (Desktop only) */}
            <div className="hidden md:block relative h-[300px] bg-gradient-to-b from-[var(--paper-white)] to-white border border-[var(--border-hairline)] rounded-[12px] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.05)] overflow-hidden">
              <CardCorners />
              
              {/* Step 1 Preview */}
              <div 
                className={`absolute inset-6 transition-opacity duration-200 ease-out flex flex-col ${
                  activeStep === 0 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <Step1Mockup />
              </div>

              {/* Step 2 Preview */}
              <div 
                className={`absolute inset-6 transition-opacity duration-200 ease-out flex flex-col ${
                  activeStep === 1 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <Step2Mockup />
              </div>

              {/* Step 3 Preview */}
              <div 
                className={`absolute inset-6 transition-opacity duration-200 ease-out flex flex-col ${
                  activeStep === 2 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <Step3Mockup />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Score preview - Linear Accents Grid */}
      <motion.section 
        {...fadeInUp}
        className="bg-[var(--paper-white)] border-t border-[var(--border-hairline)] relative"
      >
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--ink-navy)] font-space mb-4">A complete ATS report, not just a score</h2>
              <p className="text-[var(--text-secondary)] font-sans text-sm mb-6 leading-relaxed">
                Our 6-dimensional analysis goes beyond a simple percentage. You get actionable insights on every aspect of your resume.
              </p>
              <ul className="space-y-3">
                {CHECK_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-sans text-[var(--text-secondary)]">
                    <FaCheckCircle className="text-[#3F9F6B] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Progress breakdown preview card */}
            <div className="bg-gradient-to-b from-[var(--paper-white)] to-white border border-[var(--border-hairline)] rounded-[12px] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.05)] relative">
              <CardCorners />
              
              <div className="flex items-center justify-between mb-6">
                <span className="font-semibold text-[var(--ink-navy)] font-sans">ATS Score</span>
                <span className="font-mono-score font-bold px-3.5 py-1 text-sm bg-[var(--signal-amber)] text-[var(--ink-navy)] rounded-[4px]">{78}%</span>
              </div>
              {SCORE_BARS.map((bar) => {
                const barColor = bar.pct < 60 ? "bg-[#E85D4E]" : bar.pct < 80 ? "bg-[var(--signal-amber)]" : "bg-[#3F9F6B]";
                return (
                  <div key={bar.label} className="mb-5 block relative">
                    <div className="flex justify-between text-xs font-sans text-[var(--ink-navy)] mb-2 leading-normal">
                      <span className="font-medium">{bar.label}</span>
                      <span className="font-mono-score font-semibold">{bar.pct}%</span>
                    </div>
                    <div className="w-full bg-[var(--paper)] rounded-full h-2 overflow-hidden">
                      {/* Animated sliding metrics bar */}
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${bar.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-2 rounded-full ${barColor}`} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section 
        {...fadeInUp}
        className="py-16 px-4 bg-[var(--ink-navy)] text-white text-center border-t-3 border-[var(--signal-amber)]" 
        style={{ borderTop: '3.5px solid var(--signal-amber)' }}
      >
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-4xl font-semibold font-space tracking-tight mb-4 text-white">Ready to land more interviews?</h2>
          <p className="text-[#B8C2D4] font-sans mb-8 text-sm max-w-xl mx-auto leading-relaxed">
            Upload your resume now and see your ATS score in 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/templates?mode=ai" className="bg-[var(--signal-amber)] text-[var(--ink-navy)] font-semibold text-sm rounded-[8px] px-6 py-3.5 transition-all hover:bg-[#c4862f] active:scale-95 font-sans">
              Generate with AI
            </Link>
            <Link to="/templates?mode=scratch" className="bg-transparent border border-white text-white font-semibold text-sm rounded-[8px] px-6 py-3.5 transition-all hover:bg-white/10 active:scale-95 font-sans">
              Start from Scratch
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-10 bg-[var(--paper)] text-[var(--ink-navy)] border-t border-[var(--border-hairline)] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div>
              <span className="font-space font-medium text-lg text-[var(--ink-navy)]">CareerDraft</span>
              <p className="text-xs text-[var(--text-secondary)] font-sans mt-2 leading-relaxed">
                Build, analyze, and optimize your resume with AI.
              </p>
            </div>
            <div>
              <span className="font-space font-medium text-xs uppercase tracking-wider text-[var(--ink-navy)]">Quick Links</span>
              <div className="flex flex-col gap-1.5 mt-2">
                <Link to="/generate-resume" className="hover:underline text-xs font-sans text-[var(--ink-navy)]/80 hover:text-[var(--ink-navy)]">Build Resume</Link>
                <Link to="/ats-analysis" className="hover:underline text-xs font-sans text-[var(--ink-navy)]/80 hover:text-[var(--ink-navy)]">ATS Analysis</Link>
                <Link to="/about" className="hover:underline text-xs font-sans text-[var(--ink-navy)]/80 hover:text-[var(--ink-navy)]">About</Link>
              </div>
            </div>
            <div>
              <span className="font-space font-medium text-xs uppercase tracking-wider text-[var(--ink-navy)]">Legal</span>
              <div className="flex flex-col gap-1.5 mt-2">
                <a href="#" className="hover:underline text-xs font-sans text-[var(--ink-navy)]/80 hover:text-[var(--ink-navy)]">Privacy Policy</a>
                <a href="#" className="hover:underline text-xs font-sans text-[var(--ink-navy)]/80 hover:text-[var(--ink-navy)]">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-[var(--border-hairline)] text-xs text-[var(--text-secondary)] text-center font-sans">
            {new Date().getFullYear()} CareerDraft. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
