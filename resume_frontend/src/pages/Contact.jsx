import React from "react";
import { motion } from "framer-motion";

function Contact() {
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
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative bg-gradient-to-b from-[#FDFBF7] to-white border border-[#DDD5C4] rounded-[12px] p-8 sm:p-12 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.05)]"
        >
          <CardCorners />
          <span className="text-[#DB9A3C] font-mono-score text-xs uppercase tracking-wider mb-2 block">Get in Touch</span>
          <h1 className="text-3xl font-semibold text-[#1B2A4A] font-space tracking-tight mb-6">Contact Us</h1>
          <p className="text-sm font-sans text-[#5A5347] leading-relaxed mb-6">
            Have questions about our ATS analysis API, enterprise resume subscriptions, or bulk discounts? Feel free to contact our support team.
          </p>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
              <div>
                <label className="block text-xs font-semibold text-[#1B2A4A] mb-1.5 font-space">Name</label>
                <input type="text" placeholder="John Doe" className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-2.5 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] font-sans" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1B2A4A] mb-1.5 font-space">Email</label>
                <input type="email" placeholder="john@example.com" className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-2.5 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] font-sans" />
              </div>
            </div>
            <div className="font-sans">
              <label className="block text-xs font-semibold text-[#1B2A4A] mb-1.5 font-space">Message</label>
              <textarea rows={4} placeholder="How can we help?" className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] p-2.5 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] font-sans resize-none" />
            </div>
            <button className="bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] px-6 py-2.5 transition-all font-sans border-0 cursor-pointer">
              Send Message
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default Contact;
