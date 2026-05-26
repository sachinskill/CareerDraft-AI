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
// Templates use flex/percentage layouts so they render cleanly at any width.
// At 420px canvas in a ~300px card, scale ≈ 0.71 → 10px font becomes 7px (readable!).
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
        <div className="absolute top-2.5 right-2.5 z-30 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg ring-2 ring-white">
          <FaCheck className="text-primary-content" size={10} />
        </div>
      )}

      {/* Paper sheet — realistic A4 proportions */}
      <div 
        ref={cardRef} 
        className={`relative w-full overflow-hidden rounded-md bg-white transition-all duration-300
          shadow-[0_2px_8px_rgba(0,0,0,0.08)] 
          group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.16)]
          group-hover:-translate-y-1 border border-black/[0.06]
          ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
        style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
      >
        <div 
          className="origin-top-left absolute top-0 left-0 pointer-events-none" 
          style={{ width: `${CANVAS_W}px`, height: `${CANVAS_H}px`, transform: `scale(${scale})` }}
        >
          <DynamicTemplate data={PREVIEW_DATA} config={template} />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300 flex items-center justify-center pointer-events-none">
          <span className="opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 bg-primary text-primary-content text-[11px] font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-1.5 pointer-events-auto">
            Use Template <FaArrowRight size={9} />
          </span>
        </div>
      </div>

      {/* Compact footer */}
      <div className="mt-2.5 px-0.5">
        <h4 className="font-bold text-base-content text-[13px] group-hover:text-primary transition-colors truncate">
          {template.name}
        </h4>
        <p className="text-[11px] text-base-content/45 truncate mt-0.5">
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
