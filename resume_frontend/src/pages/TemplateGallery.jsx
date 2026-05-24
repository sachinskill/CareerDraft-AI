import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useResume } from "../context/ResumeContext";
import { TEMPLATES } from "../templates/templateConfig";
import DynamicTemplate, { SAMPLE_DATA } from "../templates/DynamicTemplate";
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

// ── Template card ─────────────────────────────────────────────────────────────
const TemplateCard = ({ template, isSelected, onSelect }) => {
  const cardRef = useRef(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    if (!cardRef.current) return;
    const handleResize = () => {
      if (!cardRef.current) return;
      const width = cardRef.current.getBoundingClientRect().width;
      // Fit the 595px A4 width inside card width dynamically
      const newScale = Math.min(0.6, width / 595);
      setScale(newScale);
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`group relative bg-base-100 rounded-2xl border-2 overflow-hidden cursor-pointer
      transition-all duration-305 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full
      ${isSelected ? "border-primary shadow-lg shadow-primary/10" : "border-base-200 shadow-md"}`}
      onClick={() => onSelect(template)}>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 z-20 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
          <FaCheck className="text-primary-content" size={10} />
        </div>
      )}

      {/* Thumbnail — scaled-down full A4 page live preview */}
      <div ref={cardRef} className="relative overflow-hidden bg-base-200/30 border-b border-base-200 flex items-start justify-center" style={{ height: `${842 * scale}px` }}>
        <div className="shadow-sm rounded bg-white overflow-hidden origin-top" style={{ width: "595px", height: "842px", transform: `scale(${scale})` }}>
          <DynamicTemplate data={SAMPLE_DATA} config={template} />
        </div>
        {/* Subtle blur hover overlay with CTA */}
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all duration-300 flex items-center justify-center backdrop-blur-0 group-hover:backdrop-blur-[2px]">
          <span className="opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 bg-primary text-primary-content text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg border border-primary/20 flex items-center gap-2">
            Use {template.name} <FaArrowRight size={10} />
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-base-content text-sm mb-1 group-hover:text-primary transition-colors">{template.name}</h3>
          <p className="text-xs text-base-content/50 leading-relaxed line-clamp-2">{template.description}</p>
        </div>
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
    <div className="min-h-screen bg-base-100">
      {/* Page header */}
      <div className="border-b border-base-200 bg-gradient-to-b from-base-200/50 to-base-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <FaMagic className="animate-pulse" />
              <span>{TEMPLATES.length} Curated Layout Designs</span>
            </div>
            <h1 className="text-4xl font-extrabold text-base-content tracking-tight mb-3 animate-fade-in">
              Select Your Resume Template
            </h1>
            <p className="text-base-content/60 text-lg">
              {mode === "ai" 
                ? "Choose a layout structure. Our AI will automatically organize and structure your content." 
                : "Select a professional layout to start building your resume draft."}
            </p>
          </div>

          {/* Search + filters */}
          <div className="mt-10 max-w-4xl mx-auto space-y-4">
            <div className="relative max-w-md mx-auto">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" size={14} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search template layout..."
                className="input input-bordered pl-10 w-full focus:outline-none focus:border-primary bg-base-100"
              />
            </div>
            
            {/* Category filter tabs */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {CATEGORY_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border
                    ${activeFilter === f.id
                      ? "bg-primary text-primary-content border-primary shadow-md"
                      : "bg-base-100 text-base-content/70 border-base-200 hover:border-primary/50 hover:bg-base-200"}`}>
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
          <div className="text-center py-20 text-base-content/40">
            <p className="text-lg font-medium">No templates match your filters or search query</p>
            <button onClick={() => { setSearch(""); setActiveFilter("all"); }}
              className="mt-3 btn btn-sm btn-ghost text-primary">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm font-semibold text-base-content/60">Showing {filtered.length} layout designs</p>
              <div className="text-xs text-base-content/40">Mode: <span className="font-bold text-primary uppercase">{mode}</span></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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

        {/* Sticky/Bottom selected continuation CTA */}
        {selectedTemplate && (
          <div className="mt-16 text-center animate-fade-in">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-base-200/80 backdrop-blur-md rounded-2xl border border-base-300 p-6 shadow-xl max-w-2xl mx-auto">
              <div className="text-left shrink-0">
                <p className="text-xs text-base-content/50 uppercase font-bold tracking-wider">Active Design Selected</p>
                <p className="text-sm font-bold text-base-content mt-0.5">
                  {TEMPLATES.find(t => t.id === selectedTemplate)?.name ?? selectedTemplate}
                </p>
              </div>
              <div className="h-px sm:h-8 w-full sm:w-px bg-base-300" />
              <button 
                onClick={() => navigate(`/generate-resume?template=${selectedTemplate}&mode=${mode}`)}
                className="btn btn-primary flex items-center gap-2 shadow-lg w-full sm:w-auto">
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
