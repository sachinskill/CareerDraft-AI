import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useResume } from "../context/ResumeContext";
import { TEMPLATES } from "../templates/templateConfig";
import DynamicTemplate from "../templates/DynamicTemplate";
import { PREVIEW_DATA } from "../templates/templatePreviewData";
import { FaCheck, FaSearch, FaArrowRight, FaMagic } from "react-icons/fa";

// ── Category Filters ─────────────────────────────────────────────────────────
const CATEGORY_FILTERS = [
  { id: "all",          label: "All Designs" },
  { id: "ats-friendly", label: "ATS Friendly" },
  { id: "modern",       label: "Modern" },
  { id: "minimal",      label: "Minimal" },
  { id: "creative",     label: "Creative" },
  { id: "professional", label: "Professional" },
  { id: "executive",    label: "Executive" },
];

// Virtual canvas size — smaller than full A4 (595×842) to improve scale ratio.
const CANVAS_W = 420;
const CANVAS_H = 594; // maintains exact A4 ratio (1:1.414)

// ── Template card ─────────────────────────────────────────────────────────────
const TemplateCard = ({ template, isSelected, onSelect }) => {
  const cardRef = useRef(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (!cardRef.current) return;
    const handleResize = () => {
      if (!cardRef.current) return;
      const width = cardRef.current.getBoundingClientRect().width;
      setScale(width / CANVAS_W);
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className="group relative flex flex-col cursor-pointer"
      onClick={() => onSelect(template)}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2.5 right-2.5 z-30 w-6 h-6 rounded-full bg-[#DB9A3C] flex items-center justify-center shadow-md border border-white">
          <FaCheck className="text-[#1B2A4A]" size={10} />
        </div>
      )}

      {/* Paper sheet — realistic A4 proportions */}
      <div 
        ref={cardRef} 
        className={`relative w-full overflow-hidden rounded-[8px] bg-white transition-all duration-300
          shadow-[0_2px_8px_rgba(27,42,74,0.06)] 
          group-hover:shadow-[0_12px_32px_rgba(27,42,74,0.12)]
          group-hover:-translate-y-1 border border-[#DDD5C4]
          ${isSelected ? "ring-2 ring-[#DB9A3C] ring-offset-2 ring-offset-[#F4F0E8]" : ""}`}
        style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
      >
        <div 
          className="origin-top-left absolute top-0 left-0 pointer-events-none" 
          style={{ width: `${CANVAS_W}px`, height: `${CANVAS_H}px`, transform: `scale(${scale})` }}
        >
          <DynamicTemplate data={PREVIEW_DATA} config={template} />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#1B2A4A]/0 group-hover:bg-[#1B2A4A]/10 transition-all duration-300 flex items-center justify-center pointer-events-none">
          <span className="opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-300 bg-[#DB9A3C] text-[#1B2A4A] text-xs font-semibold px-4 py-2.5 rounded-[6px] shadow-lg flex items-center gap-1.5 pointer-events-auto">
            Use Template <FaArrowRight size={9} />
          </span>
        </div>
      </div>

      {/* Compact footer */}
      <div className="mt-3 px-0.5 text-left">
        <h4 className="font-semibold text-[#1B2A4A] font-space text-sm group-hover:text-[#DB9A3C] transition-colors truncate">
          {template.name}
        </h4>
        <p className="text-xs text-[#5A5347] font-sans truncate mt-0.5">
          {template.description.split('.')[0]}
        </p>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const TemplateGallery = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "scratch"; // 'ai' or 'scratch'
  const { selectedTemplate, updateTemplate } = useResume();

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = TEMPLATES.filter(t => {
    const matchesCategory = activeFilter === "all" || (t.categories && t.categories.includes(activeFilter));
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      t.name.toLowerCase().includes(q) ||
      t.layout.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleSelect = (template) => {
    updateTemplate(template.id);
    navigate(`/generate-resume?template=${template.id}&mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-left">
      {/* Page header */}
      <div className="border-b border-[#DDD5C4] bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#FDFBF7] border border-[#DDD5C4] text-[#1B2A4A] text-xs font-semibold px-3 py-1.5 rounded-[6px] mb-4 font-mono-score">
              <FaMagic className="animate-pulse text-[#DB9A3C]" />
              <span>{TEMPLATES.length} Curated Layout Designs</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#1B2A4A] font-space tracking-tight mb-3">
              Select Your Resume Template
            </h1>
            <p className="text-[#5A5347] font-sans text-sm max-w-2xl leading-relaxed">
              {mode === "ai" 
                ? "Choose a layout structure. Our AI will automatically organize and structure your content." 
                : "Select a professional layout to start building your resume draft."}
            </p>
          </div>

          {/* Search + filters */}
          <div className="mt-8 max-w-4xl space-y-4">
            <div className="relative max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5347]" size={14} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search template layout..."
                className="w-full text-sm bg-white border border-[#DDD5C4] rounded-[8px] pl-10 pr-4 py-2.5 outline-none focus:border-[#DB9A3C] text-[#1B2A4A] font-sans transition-all"
              />
            </div>
            
            {/* Category filter tabs */}
            <div className="flex flex-wrap gap-2 pt-2">
              {CATEGORY_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border font-sans cursor-pointer
                    ${activeFilter === f.id
                      ? "bg-[#1B2A4A] text-[#FDFBF7] border-[#1B2A4A] shadow-sm"
                      : "bg-white text-[#5A5347] border-[#DDD5C4] hover:border-[#DB9A3C]/50 hover:bg-[#F4F0E8]"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-[#5A5347] font-sans">
            <p className="text-lg font-medium">No templates match your filters or search query</p>
            <button onClick={() => { setSearch(""); setActiveFilter("all"); }}
              className="mt-3 text-xs font-semibold text-[#DB9A3C] hover:underline bg-transparent border-0 cursor-pointer">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8 font-sans">
              <p className="text-sm font-medium text-[#5A5347]">Showing {filtered.length} layout designs</p>
              <div className="text-xs text-[#5A5347]">Mode: <span className="font-bold text-[#DB9A3C] uppercase">{mode}</span></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate === template.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </>
        )}

        {/* Selected continuation CTA */}
        {selectedTemplate && (
          <div className="mt-16 text-center animate-fadeIn font-sans">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-[#FDFBF7] backdrop-blur-md rounded-[12px] border border-[#DDD5C4] p-6 shadow-lg max-w-2xl mx-auto text-left">
              <div className="text-left shrink-0">
                <p className="text-xs text-[#5A5347] uppercase font-bold tracking-wider font-mono-score">Active Design Selected</p>
                <p className="text-sm font-bold text-[#1B2A4A] font-space mt-0.5">
                  {TEMPLATES.find(t => t.id === selectedTemplate)?.name ?? selectedTemplate}
                </p>
              </div>
              <div className="h-px sm:h-8 w-full sm:w-px bg-[#DDD5C4]" />
              <button 
                onClick={() => navigate(`/generate-resume?template=${selectedTemplate}&mode=${mode}`)}
                className="bg-[#DB9A3C] hover:bg-[#c4862f] active:scale-95 text-[#1B2A4A] font-semibold text-sm rounded-[6px] px-5 py-2.5 transition-all font-sans border-0 flex items-center gap-2 shadow-none cursor-pointer">
                Continue with Selection <FaArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateGallery;
