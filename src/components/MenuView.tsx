import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MENU_ITEMS, MenuItem } from "../types";
import { Flame, Leaf, Snowflake, ShieldAlert, Sparkles, Filter, ChevronRight, ChevronLeft, Image as ImageIcon, X, CalendarCheck2 } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface MenuViewProps {
  onOpenReservation: () => void;
}

export default function MenuView({ onOpenReservation }: MenuViewProps) {
  // Menu Category selection
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [menuList, setMenuList] = useState<MenuItem[]>(MENU_ITEMS);
  const [catalogFields, setCatalogFields] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState<"published" | "draft">(() => {
    const saved = localStorage.getItem("ona_preview_mode");
    return (saved === "draft" || saved === "published") ? saved : "published";
  });
  
  // High-fidelity food detailed slideshow states
  const [selectedDishDetail, setSelectedDishDetail] = useState<MenuItem | null>(null);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState<number>(0);

  useEffect(() => {
    const handlePreviewChange = () => {
      const saved = localStorage.getItem("ona_preview_mode");
      if (saved === "draft" || saved === "published") {
        setPreviewMode(saved);
      }
    };
    window.addEventListener("ona_preview_mode_changed", handlePreviewChange);
    return () => window.removeEventListener("ona_preview_mode_changed", handlePreviewChange);
  }, []);

  useEffect(() => {
    // Read from draft or published document depending on active real-time previewMode setting
    const docId = previewMode === "draft" ? "content_catalog_draft" : "content_catalog_published";
    const docRef = doc(db, "admin_settings", docId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.records && data.records.menu_items) {
          const recordsList = data.records.menu_items;
          const mapped = recordsList.map((rec: any) => ({
            id: rec.id || String(Math.random()),
            name: rec.name || rec.title || "Dish",
            description: rec.description || "",
            price: rec.price || "₦0",
            categories: Array.isArray(rec.categories) 
              ? rec.categories 
              : (rec.categories ? String(rec.categories).split(",").map(c => c.trim()) : []),
            dietary: {
              isVegetarian: rec.isVegetarian || false,
              isKidsFriendly: rec.isKidsFriendly || false,
              isSpicy: rec.isSpicy || false,
              isMild: rec.isMild || false,
              isVegan: rec.isVegan || false,
              isGlutenFree: rec.isGlutenFree || false,
              hasNuts: rec.hasNuts || false
            },
            image: rec.image || "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
            ...rec
          }));
          setMenuList(mapped);
        }
        if (data && data.tables && data.tables.menu_items) {
          setCatalogFields(data.tables.menu_items.fields || []);
        }
      } else {
        // Fallback to local cached compiled structure
        const cached = localStorage.getItem("ona_mock_content_catalog");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.records && parsed.records.menu_items) {
            setMenuList(parsed.records.menu_items);
            if (parsed.tables && parsed.tables.menu_items) {
              setCatalogFields(parsed.tables.menu_items.fields || []);
            }
          }
        }
      }
    }, (error) => {
      console.warn("Could not load real-time content catalog:", error);
    });

    return () => unsubscribe();
  }, []);
  
  // Dietary requirement toggles
  const [onlySpicy, setOnlySpicy] = useState(false);
  const [onlyVegetarian, setOnlyVegetarian] = useState(false);
  const [onlyKidsFriendly, setOnlyKidsFriendly] = useState(false);
  const [onlyGlutenFree, setOnlyGlutenFree] = useState(false);

  const categories = [
    { id: "all", label: "All Curations" },
    { id: "starters", label: "Starters" },
    { id: "signatures", label: "Signatures" },
    { id: "seafood", label: "Sea Harvest" },
    { id: "grills", label: "Hardwood Grills" },
    { id: "vegetarian", label: "Vegetarian" },
    { id: "kids", label: "Kids Selection" },
    { id: "sunday", label: "Sunday Roast" },
    { id: "desserts", label: "Pâtisserie" },
    { id: "cocktails", label: "Cocktails" },
    { id: "mocktails", label: "Mocktails" },
    { id: "wine", label: "Wine & Cellar" },
  ];

  // Filtering logic
  const filteredItems = menuList.filter((item) => {
    // 1. Category matches
    if (selectedCategory !== "all" && !item.categories.includes(selectedCategory as any)) {
      return false;
    }
    // 2. Dietary requirements match
    if (onlySpicy && !item.dietary.isSpicy) return false;
    if (onlyVegetarian && !item.dietary.isVegetarian) return false;
    if (onlyKidsFriendly && !item.dietary.isKidsFriendly) return false;
    if (onlyGlutenFree && !item.dietary.isGlutenFree) return false;

    return true;
  });

  const clearFilters = () => {
    setOnlySpicy(false);
    setOnlyVegetarian(false);
    setOnlyKidsFriendly(false);
    setOnlyGlutenFree(false);
    setSelectedCategory("all");
  };

  return (
    <div id="culinary-menu-view" className="bg-[#050505] text-[#fbf9f4] pt-28 pb-20 relative min-h-screen">
      
      {/* Editorial Header */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-10 text-center relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-gold-400/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="space-y-4">
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-gold-400 block">La Carte d'Or</span>
          <h2 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-white">
            The Culinary Collections
          </h2>
          <p className="text-gray-400 font-sans text-xs uppercase tracking-widest max-w-lg mx-auto">
            Each recipe tells a story of West African landscape, slow-fired to perfection.
          </p>
          <div className="w-16 h-px bg-gold-400/50 mx-auto mt-4" />
        </div>
      </section>

      {/* Category Navigation - Sticky horizontal bar */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 mb-8">
        <div className="flex overflow-x-auto gap-3 pb-4 pointer-events-auto border-b border-white/5 scrollbar-thin scrollbar-thumb-gold-400/20 scrollbar-track-transparent">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-[11px] font-sans uppercase tracking-[0.2em] transition-all whitespace-nowrap cursor-pointer rounded-none border ${
                selectedCategory === cat.id
                  ? "bg-gold-500 text-black border-gold-400 font-medium"
                  : "bg-transparent text-gray-400 border-white/5 hover:border-gold-400/40 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Advanced Dietary Filters Bar */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 mb-10">
        <div className="bg-[#0f0f0f] border border-gold-400/10 p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gold-400" />
            <span className="font-sans text-xs uppercase tracking-widest text-[#fbf9f4] font-light">
              Filter by Culinary Needs
            </span>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Vegetarian preference */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-gray-400 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={onlyVegetarian}
                onChange={() => setOnlyVegetarian(!onlyVegetarian)}
                className="w-3.5 h-3.5 accent-gold-500 bg-black border-white/10"
              />
              <span className="flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-green-400" /> Vegetarian
              </span>
            </label>

            {/* Spicy preference */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-gray-400 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={onlySpicy}
                onChange={() => setOnlySpicy(!onlySpicy)}
                className="w-3.5 h-3.5 accent-gold-500 bg-black border-white/10"
              />
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-400" /> Spicy Rubs
              </span>
            </label>

            {/* Kids-Friendly / Mild */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-gray-400 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={onlyKidsFriendly}
                onChange={() => setOnlyKidsFriendly(!onlyKidsFriendly)}
                className="w-3.5 h-3.5 accent-gold-500 bg-black border-white/10"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Kids / Mild
              </span>
            </label>

            {/* Gluten Free */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-gray-400 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={onlyGlutenFree}
                onChange={() => setOnlyGlutenFree(!onlyGlutenFree)}
                className="w-3.5 h-3.5 accent-gold-500 bg-black border-white/10"
              />
              <span className="flex items-center gap-1">
                <Snowflake className="w-3.5 h-3.5 text-sky-400" /> Gluten Free
              </span>
            </label>

            {/* Clear filters trigger */}
            {(onlySpicy || onlyVegetarian || onlyKidsFriendly || onlyGlutenFree) && (
              <button
                onClick={clearFilters}
                className="text-[10px] text-gold-400 hover:underline uppercase tracking-widest pl-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Menu Grid Content */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id}
                  className="bg-black/40 border border-[#1b1b1b] hover:border-gold-400/30 transition-all duration-300 group flex flex-col justify-between"
                >
                  {/* Photo area with luxury badges */}
                  <div 
                    onClick={() => {
                      setSelectedDishDetail(item);
                      setActiveGalleryIdx(0);
                    }}
                    className="relative overflow-hidden aspect-[4/3] bg-neutral-900 shrink-0 cursor-pointer group/photo"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover/photo:scale-110"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80" />

                    {/* Gallery photos count banner if exists */}
                    {item.galleryImages && item.galleryImages.length > 0 && (
                      <div className="absolute bottom-3 left-4 bg-black/60 border border-white/10 px-2 py-1 text-[8px] uppercase tracking-wider text-white font-semibold rounded-xs backdrop-blur-xs flex items-center gap-1">
                        <ImageIcon className="w-2.5 h-2.5 text-[#C5A070]" />
                        <span>+{item.galleryImages.length} Plates</span>
                      </div>
                    )}

                    {/* Dietary Badges inside image block */}
                    <div className="absolute top-4 right-4 flex flex-col gap-1.5">
                      {item.dietary.isSpicy && (
                        <span className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-sans uppercase bg-black/80 border border-red-500/35 text-red-400 font-semibold tracking-wider">
                          <Flame className="w-3 h-3" /> Spicy
                        </span>
                      )}
                      {item.dietary.isVegetarian && (
                        <span className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-sans uppercase bg-black/80 border border-green-500/35 text-green-400 font-semibold tracking-wider">
                          <Leaf className="w-3 h-3" /> Green
                        </span>
                      )}
                      {item.dietary.isKidsFriendly && (
                        <span className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-sans uppercase bg-black/80 border border-gold-300/35 text-gold-300 font-semibold tracking-wider">
                          <Sparkles className="w-3 h-3" /> Kids Safe
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Text details */}
                  <div className="p-6 md:p-8 space-y-4 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2">
                        <h3 className="font-serif text-xl sm:text-2xl font-light text-[#fbf9f4] group-hover:text-gold-300 transition-colors">
                          {item.name}
                        </h3>
                        <span className="font-sans text-xs font-semibold text-gold-300 whitespace-nowrap pl-1">
                          {item.price}
                        </span>
                      </div>
                      <p className="font-sans text-xs sm:text-sm text-gray-400 font-light leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Allergy Advice micro disclaimer */}
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      <div className="flex flex-wrap gap-2 items-center text-[10px] text-gray-500 font-sans italic">
                        {item.dietary.hasNuts && (
                          <span className="text-amber-500 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Contains Groundnuts
                          </span>
                        )}
                        {item.dietary.isGlutenFree && (
                          <span className="text-sky-400/80">Gluten-Free</span>
                        )}
                        {item.dietary.isMild && (
                          <span className="text-gold-300/70">Extremely Mild Spice</span>
                        )}
                      </div>

                      {/* Dynamic custom columns added by Admin content builder */}
                      {catalogFields.filter(f => f.visibility === "show" && !["id", "name", "description", "price", "categories", "image", "isVegetarian", "isKidsFriendly", "isSpicy", "isMild"].includes(f.id)).map(field => {
                        const val = item[field.id];
                        if (val === undefined || val === null || val === "" || val === false) return null;
                        return (
                          <div 
                            key={field.id} 
                            className="flex justify-between items-center text-[10.5px] font-sans"
                            title={field.helpText || ""}
                          >
                            <span className="text-gray-500 uppercase tracking-widest font-normal text-[9px]">{field.label}:</span>
                            <span className="text-gold-300 font-semibold font-mono">
                              {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center space-y-4 max-w-sm mx-auto bg-[#0a0a0a] border border-white/5 p-8"
            >
              <X className="w-8 h-8 text-gold-400 mx-auto" />
              <p className="font-serif text-lg text-white">No Matched Curations</p>
              <p className="font-sans text-xs text-gray-400 leading-relaxed">
                We couldn't locate any dishes matching your current filter choices. Adjust your checkboxes to reveal other options.
              </p>
              <button
                onClick={clearFilters}
                className="text-xs uppercase font-sans tracking-widest text-gold-300 hover:text-white underline mt-2"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Advisory Note */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-8 mt-12 text-center text-[11px] text-gray-500 font-sans max-w-2xl">
        <p className="italic">
          * Allergy Notice: Our recipes utilize wild indigenous spices. Please inform your service host of severe allergies (especially tree nuts, seed oils, or seafood products) during reservation so Chef can customize your ingredients.
        </p>
      </section>

      {/* STICKY “Reserve a Table” CTA (Menu Specific Section Requirement) */}
      <div className="fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-md border-t border-gold-400/10 py-4.5 px-6 z-30 flex items-center justify-between shadow-[0_-4px_30px_rgba(0,0,0,0.8)]">
        <div className="hidden sm:flex flex-col text-left max-w-md pl-4">
          <p className="font-sans text-[10px] uppercase tracking-wider text-gold-400 font-light">Custom Gastronomies Available</p>
          <p className="text-xs text-gray-300 font-light truncate">Secure raw tables, family corners, or custom diet curation.</p>
        </div>
        <button
          onClick={onOpenReservation}
          className="cursor-pointer bg-gold-500 hover:bg-gold-600 border border-gold-400/30 text-black font-sans text-xs uppercase tracking-[0.2em] font-semibold py-3 px-8 w-full sm:w-auto text-center flex items-center justify-center gap-2"
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>Tailor Your Table</span>
        </button>
      </div>

      {/* DETAILED GLASS SLIDESHOW MODAL */}
      <AnimatePresence>
        {selectedDishDetail && (() => {
          const allImages = [selectedDishDetail.image, ...(selectedDishDetail.galleryImages || [])];
          const activeUrl = allImages[activeGalleryIdx] || selectedDishDetail.image;
          
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="relative w-full max-w-5xl h-auto max-h-[95vh] md:max-h-[90vh] bg-[#0c0c0c] border border-gold-400/20 text-[#fbf9f4] flex flex-col md:flex-row overflow-hidden shadow-2xl rounded-xs">
                
                {/* Close Button Trigger */}
                <button 
                  onClick={() => setSelectedDishDetail(null)}
                  className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black text-stone-300 hover:text-white rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Left side slider (7 cols display-wise) */}
                <div className="flex-1 min-h-[260px] md:min-h-[480px] bg-neutral-900 relative flex items-center justify-center">
                  <img
                    src={activeUrl}
                    alt={selectedDishDetail.name}
                    className="w-full h-full object-cover absolute inset-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                  {/* Arrow controllers */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() => {
                          setActiveGalleryIdx(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
                        }}
                        className="absolute left-4 z-10 p-2 bg-black/70 hover:bg-black border border-white/10 rounded-full text-white cursor-pointer hover:scale-105 transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveGalleryIdx(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
                        }}
                        className="absolute right-4 z-10 p-2 bg-black/70 hover:bg-black border border-white/10 rounded-full text-white cursor-pointer hover:scale-105 transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Bottom Index dots / indexer */}
                  <span className="absolute bottom-4 right-4 bg-black/70 px-2.5 py-1 text-[10px] font-mono tracking-widest text-[#C5A070] uppercase font-bold border border-[#C5A070]/25 rounded-xs">
                    IMAGE {activeGalleryIdx + 1} / {allImages.length}
                  </span>
                </div>

                {/* Right side narrative (5 cols details) */}
                <div className="w-full md:w-[380px] p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gold-400/15 overflow-y-auto max-h-[50vh] md:max-h-none text-left bg-[#080808]">
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A070] font-bold block mb-1">CULINARY MASTERPIECE</span>
                      <h3 className="font-serif text-2xl sm:text-3xl font-light tracking-wide text-white leading-tight">
                        {selectedDishDetail.name}
                      </h3>
                      <span className="text-sm font-semibold text-gold-300 block mt-2 font-mono">
                        {selectedDishDetail.price}
                      </span>
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-4">
                      <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block">Gourmet Narration</span>
                      <p className="text-gray-300 font-sans text-xs font-light leading-relaxed">
                        {selectedDishDetail.description || "Designed in modern sub-Saharan fine-dining style, combining indigenous organic ingredients with traditional clay-fired charcoal slow techniques."}
                      </p>
                    </div>

                    {/* Dietary markers list */}
                    <div className="space-y-2 border-t border-white/5 pt-4">
                      <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block">Sensory Alignments</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedDishDetail.dietary?.isSpicy && (
                          <span className="px-2 py-0.5 text-[8px] font-sans uppercase bg-red-950/40 border border-red-500/20 text-red-400 font-bold tracking-widest">
                            Spicy Selection
                          </span>
                        )}
                        {selectedDishDetail.dietary?.isVegetarian && (
                          <span className="px-2 py-0.5 text-[8px] font-sans uppercase bg-green-950/40 border border-green-500/20 text-green-400 font-bold tracking-widest">
                            Vegetarian
                          </span>
                        )}
                        {selectedDishDetail.dietary?.isVegan && (
                          <span className="px-2 py-0.5 text-[8px] font-sans uppercase bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-bold tracking-widest">
                            Vegan
                          </span>
                        )}
                        {selectedDishDetail.dietary?.isKidsFriendly && (
                          <span className="px-2 py-0.5 text-[8px] font-sans uppercase bg-amber-950/40 border border-gold-400/20 text-gold-400 font-bold tracking-widest">
                            Kids Friendly
                          </span>
                        )}
                        {selectedDishDetail.dietary?.isGlutenFree && (
                          <span className="px-2 py-0.5 text-[8px] font-sans uppercase bg-blue-950/40 border border-blue-500/20 text-blue-400 font-bold tracking-widest">
                            Gluten Free
                          </span>
                        )}
                        {selectedDishDetail.dietary?.hasNuts && (
                          <span className="px-2 py-0.5 text-[8px] font-sans uppercase bg-orange-950/40 border border-orange-500/20 text-orange-400 font-bold tracking-widest">
                            Contains Nuts
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Thumbnails row below */}
                    {allImages.length > 1 && (
                      <div className="space-y-2 border-t border-white/5 pt-4">
                        <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block">Deconstructed Plates</span>
                        <div className="grid grid-cols-4 gap-2 pt-1">
                          {allImages.map((u, idx) => (
                            <button
                              key={u + idx}
                              onClick={() => setActiveGalleryIdx(idx)}
                              className={`aspect-square border bg-neutral-900 overflow-hidden relative transition cursor-pointer ${
                                idx === activeGalleryIdx 
                                  ? "border-[#C5A070]" 
                                  : "border-white/10 hover:border-white/30"
                              }`}
                            >
                              <img src={u} alt="Plate facet" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  <button
                    onClick={() => {
                      setSelectedDishDetail(null);
                      onOpenReservation();
                    }}
                    className="w-full mt-8 bg-gold-500 hover:bg-gold-600 text-black py-3 uppercase tracking-widest font-sans text-[10px] font-black tracking-[0.2em] cursor-pointer"
                  >
                    Hold Placement
                  </button>
                </div>

              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
