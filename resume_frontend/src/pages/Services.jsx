import React from "react";
import { motion } from "framer-motion";
import { FaRocket, FaBrain, FaFileAlt } from "react-icons/fa";

function Services() {
  const CardCorners = () => (
    <>
      <div className="absolute -top-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
      <div className="absolute -top-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
      <div className="absolute -bottom-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
      <div className="absolute -bottom-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    </>
  );

  const items = [
    {
      icon: <FaRocket className="text-xl text-[#DB9A3C]" />,
      title: "ATS Scanners",
      desc: "Instant matching and severity-tier checks based on real corporate parsing guidelines."
    },
    {
      icon: <FaBrain className="text-xl text-[#3F9F6B]" />,
      title: "AI Optimizations",
      desc: "Tailor and rewrite bullet items automatically to match missing job competencies."
    },
    {
      icon: <FaFileAlt className="text-xl text-[#1B2A4A]" />,
      title: "Professional Builders",
      desc: "Organize layout styles into clean, parse-ready output documents instantaneously."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F0E8] py-16 px-6 text-left">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center max-w-xl mx-auto">
          <span className="text-[#DB9A3C] font-mono-score text-xs uppercase tracking-wider mb-2 block">Our Offerings</span>
          <h1 className="text-3xl font-semibold text-[#1B2A4A] font-space tracking-tight mb-3">Our Core Services</h1>
          <p className="text-[#5A5347] font-sans text-sm">
            Everything you need to craft high-impact, parsed-compliant profiles and resumes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
              className="relative bg-gradient-to-b from-[#FDFBF7] to-white border border-[#DDD5C4] rounded-[12px] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.05)]"
            >
              <CardCorners />
              <div className="w-10 h-10 rounded-[6px] bg-[#F4F0E8] border border-[#DDD5C4] flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="font-space font-semibold text-base text-[#1B2A4A] mb-2">{item.title}</h3>
              <p className="font-sans text-xs text-[#5A5347] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Services;
