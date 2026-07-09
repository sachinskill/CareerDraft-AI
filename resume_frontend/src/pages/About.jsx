import React from 'react';
import { motion } from "framer-motion";

function About() {
  const CardCorners = () => (
    <>
      <div className="absolute -top-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
      <div className="absolute -top-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
      <div className="absolute -bottom-1.5 -left-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
      <div className="absolute -bottom-1.5 -right-1.5 text-xs text-[#DDD5C4] font-mono select-none pointer-events-none">+</div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F4F0E8] py-16 px-6 text-left">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative bg-gradient-to-b from-[#FDFBF7] to-white border border-[#DDD5C4] rounded-[12px] p-8 sm:p-12 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.05)]"
        >
          <CardCorners />
          <span className="text-[#DB9A3C] font-mono-score text-xs uppercase tracking-wider mb-2 block">Our Mission</span>
          <h1 className="text-3xl font-semibold text-[#1B2A4A] font-space tracking-tight mb-6">About AI Resume Maker</h1>
          <p className="text-sm font-sans text-[#5A5347] leading-relaxed mb-6">
            We believe the recruitment process should be transparent. Millions of qualified job seekers are filtered out by automated Application Tracking Systems (ATS) before a human recruiter ever sees their credentials. 
          </p>
          <p className="text-sm font-sans text-[#5A5347] leading-relaxed mb-6">
            Our platform provides state-of-the-art parsing intelligence, allowing professionals to score, optimize, and build layout structures that excel in scans while presenting a highly polished design to human eyes.
          </p>
          <div className="h-px bg-[#DDD5C4] my-6" />
          <div className="flex gap-8 text-xs text-[#5A5347] font-mono">
            <div>
              <span className="block text-lg font-bold text-[#1B2A4A] font-space">80%+</span>
              <span>Average Match Rate</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-[#1B2A4A] font-space">6x</span>
              <span>Callback Increase</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-[#1B2A4A] font-space">100%</span>
              <span>ATS Compliant Layouts</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default About;