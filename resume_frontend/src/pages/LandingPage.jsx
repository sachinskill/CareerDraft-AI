import { Link } from "react-router-dom";
import {
  FaRocket, FaBrain, FaFileAlt, FaUpload,
  FaCheckCircle, FaArrowRight,
} from "react-icons/fa";

const FEATURES = [
  {
    icon: <FaRocket className="text-3xl text-primary" />,
    title: "ATS Score Analysis",
    desc: "6-dimensional scoring — keyword match, impact, readability, experience alignment, and more.",
  },
  {
    icon: <FaBrain className="text-3xl text-secondary" />,
    title: "AI-Powered Suggestions",
    desc: "Groq AI tells you exactly how to improve your resume for each specific job posting.",
  },
  {
    icon: <FaFileAlt className="text-3xl text-accent" />,
    title: "Professional Templates",
    desc: "Three ATS-friendly templates — Default, Modern, and Minimalist — switch instantly.",
  },
  {
    icon: <FaUpload className="text-3xl text-info" />,
    title: "Upload & Analyze",
    desc: "Upload your existing PDF or DOCX resume and get a detailed score in seconds.",
  },
];

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
  { label: "Keyword Match", pct: 80, color: "bg-success" },
  { label: "Section Quality", pct: 75, color: "bg-info" },
  { label: "Impact Score", pct: 60, color: "bg-warning" },
  { label: "Experience Alignment", pct: 90, color: "bg-success" },
  { label: "Readability", pct: 70, color: "bg-info" },
  { label: "Summary Quality", pct: 40, color: "bg-error" },
];

const CHECK_ITEMS = [
  "Keyword match with severity tiers (Critical / Important / Nice-to-have)",
  "Impact & quantification analysis on every bullet point",
  "Experience alignment vs. job requirements",
  "Readability flags — weak verbs, first-person, overlong bullets",
  "AI-rewritten bullet examples you can copy directly",
  "Role-specific tailoring tips",
];

const LandingPage = () => {
  return (
    <div className="bg-base-100">

      {/* Hero */}
      <section className="hero min-h-[90vh] bg-gradient-to-br from-base-200 to-base-100">
        <div className="hero-content text-center max-w-3xl">
          <div>
            <div className="badge badge-primary badge-outline mb-4 gap-2 py-3 px-4 text-sm">
              <FaBrain /> Powered by Groq AI
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Beat ATS Systems.<br />
              <span className="text-primary">Land More Interviews.</span>
            </h1>
            <p className="text-lg text-base-content/70 mb-8 max-w-xl mx-auto">
              90% of resumes get rejected before a human sees them. Our AI analyzes job descriptions
              and optimizes your resume to pass ATS filters in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/templates?mode=ai" className="btn btn-primary btn-lg gap-2 shadow-lg hover:scale-105 transition-all">
                <FaBrain /> Generate with AI
              </Link>
              <Link to="/templates?mode=scratch" className="btn btn-outline btn-lg gap-2 hover:scale-105 transition-all">
                <FaRocket /> Start from Scratch
              </Link>
            </div>
            <p className="text-xs text-base-content/40 mt-4">Free — no credit card required</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-primary text-primary-content">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.value}>
                <div className="text-5xl font-extrabold mb-2">{s.value}</div>
                <p className="text-primary-content/80 text-sm max-w-xs mx-auto">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-3">Everything you need</h2>
          <p className="text-center text-base-content/60 mb-12">One tool to build, analyze, and optimize your resume.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card bg-base-200 shadow-md hover:shadow-xl transition-shadow">
                <div className="card-body items-center text-center">
                  <div className="mb-3">{f.icon}</div>
                  <h3 className="card-title text-base">{f.title}</h3>
                  <p className="text-sm text-base-content/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-base-200">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-3">How it works</h2>
          <p className="text-center text-base-content/60 mb-12">Three steps from zero to interview-ready.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="card bg-base-100 shadow-md text-center">
                <div className="card-body items-center">
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-extrabold mb-3">
                    {s.n}
                  </div>
                  <h3 className="card-title">{s.title}</h3>
                  <p className="text-sm text-base-content/70">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Score preview */}
      <section className="py-20 bg-base-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4">A complete ATS report, not just a score</h2>
              <p className="text-base-content/70 mb-6">
                Our 6-dimensional analysis goes beyond a simple percentage. You get actionable
                insights on every aspect of your resume.
              </p>
              <ul className="space-y-3">
                {CHECK_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <FaCheckCircle className="text-success shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">ATS Score</span>
                  <span className="badge badge-success badge-lg text-lg font-bold px-4">78</span>
                </div>
                {SCORE_BARS.map((bar) => (
                  <div key={bar.label} className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{bar.label}</span>
                      <span className="font-semibold">{bar.pct}%</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                      <div className={`h-2 rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-content text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">Ready to land more interviews?</h2>
          <p className="text-primary-content/80 mb-8 text-lg max-w-xl mx-auto">
            Upload your resume now and see your ATS score in 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/templates?mode=ai" className="btn btn-lg btn-primary gap-2 shadow-lg hover:scale-105 transition-all">
              <FaBrain /> Generate with AI
            </Link>
            <Link to="/templates?mode=scratch" className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary gap-2 hover:scale-105 transition-all">
              <FaRocket /> Start from Scratch
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-base-200 text-base-content">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <span className="font-bold text-lg">AI Resume Maker</span>
              <p className="text-sm text-base-content/70 mt-2">
                Build, analyze, and optimize your resume with AI.
              </p>
            </div>
            <div>
              <span className="font-semibold text-sm uppercase tracking-wider">Quick Links</span>
              <div className="flex flex-col gap-1 mt-2">
                <Link to="/generate-resume" className="link link-hover text-sm">Build Resume</Link>
                <Link to="/ats-analysis" className="link link-hover text-sm">ATS Analysis</Link>
                <Link to="/about" className="link link-hover text-sm">About</Link>
              </div>
            </div>
            <div>
              <span className="font-semibold text-sm uppercase tracking-wider">Legal</span>
              <div className="flex flex-col gap-1 mt-2">
                <a href="#" className="link link-hover text-sm">Privacy Policy</a>
                <a href="#" className="link link-hover text-sm">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-base-300 text-xs text-base-content/40 text-center">
            {new Date().getFullYear()} AI Resume Maker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
