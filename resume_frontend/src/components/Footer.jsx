import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin, FaCode } from "react-icons/fa";

const SOCIAL_LINKS = [
  {
    href: "https://github.com/sachinskill",
    label: "GitHub",
    icon: FaGithub,
    title: "Sachin Gupta on GitHub",
  },
  {
    href: "https://www.linkedin.com/in/sachin-legacy/",
    label: "LinkedIn",
    icon: FaLinkedin,
    title: "Sachin Gupta on LinkedIn",
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#FDFBF7] text-[#1B2A4A] border-t border-[#DDD5C4] relative z-10 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">

          {/* Brand */}
          <div>
            <span className="font-space font-semibold text-lg text-[#1B2A4A]">CareerDraft</span>
            <p className="text-xs text-[#5A5347] font-sans mt-2 leading-relaxed">
              Build, analyze, and optimize your resume with AI.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <span className="font-space font-medium text-xs uppercase tracking-wider text-[#1B2A4A]">
              Quick Links
            </span>
            <div className="flex flex-col gap-1.5 mt-3">
              <Link
                to="/generate-resume"
                className="text-xs font-sans text-[#1B2A4A]/80 hover:text-[#DB9A3C] hover:underline transition-colors"
              >
                Build Resume
              </Link>
              <Link
                to="/ats-analysis"
                className="text-xs font-sans text-[#1B2A4A]/80 hover:text-[#DB9A3C] hover:underline transition-colors"
              >
                ATS Analysis
              </Link>
              <Link
                to="/templates"
                className="text-xs font-sans text-[#1B2A4A]/80 hover:text-[#DB9A3C] hover:underline transition-colors"
              >
                Templates
              </Link>
              <Link
                to="/about"
                className="text-xs font-sans text-[#1B2A4A]/80 hover:text-[#DB9A3C] hover:underline transition-colors"
              >
                About
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <span className="font-space font-medium text-xs uppercase tracking-wider text-[#1B2A4A]">
              Legal
            </span>
            <div className="flex flex-col gap-1.5 mt-3">
              <a
                href="#"
                className="text-xs font-sans text-[#1B2A4A]/80 hover:text-[#DB9A3C] hover:underline transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-xs font-sans text-[#1B2A4A]/80 hover:text-[#DB9A3C] hover:underline transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Divider + credits bar */}
        <div className="mt-8 pt-5 border-t border-[#DDD5C4] flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Copyright */}
          <p className="text-xs text-[#5A5347] font-sans order-2 sm:order-1">
            &copy; {new Date().getFullYear()} CareerDraft. All rights reserved.
          </p>

          {/* Developer credit — the permanent identity stamp */}
          <div className="flex items-center gap-3 order-1 sm:order-2">
            <span className="flex items-center gap-1.5 text-xs text-[#5A5347] font-sans">
              <FaCode size={11} className="text-[#DB9A3C]" />
              Designed &amp; Developed by{" "}
              <span className="font-semibold text-[#1B2A4A]">Sachin Gupta</span>
            </span>

            {/* Social icon links */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#DDD5C4]">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon, title }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={title}
                  aria-label={title}
                  className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-[#DDD5C4] bg-white text-[#1B2A4A] hover:border-[#DB9A3C] hover:text-[#DB9A3C] transition-all"
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
