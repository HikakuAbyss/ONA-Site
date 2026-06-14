import React, { useState, useEffect } from "react";
import { Search, Filter, X, Image as ImageIcon, Video as VideoIcon, Plus, Check, Play } from "lucide-react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_CMS } from "./WebsiteCustomizer";

interface MediaPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  onSelectMultiple?: (urls: string[]) => void;
  title?: string;
  allowMultiple?: boolean;
  selectedUrls?: string[];
}

export default function MediaPickerDialog({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  title = "Select Asset from Media Library",
  allowMultiple = false,
  selectedUrls = []
}: MediaPickerDialogProps) {
  const [mediaLibrary, setMediaLibrary] = useState<any[]>(DEFAULT_CMS.mediaLibrary);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedList, setSelectedList] = useState<string[]>(selectedUrls);
  
  // Upload properties on-the-fly
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Food");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setSelectedList(selectedUrls);
  }, [selectedUrls, isOpen]);

  // Load latest mediaLibrary from database cms_draft
  useEffect(() => {
    if (!isOpen) return;
    const docRef = doc(db, "admin_settings", "cms_draft");
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.mediaLibrary) {
          setMediaLibrary(data.mediaLibrary);
        }
      }
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    "All", "Food", "Drinks", "Interior", "Lifestyle", "Events", "Hero Images", "Gallery", "Promotions", "Staff"
  ];

  // Map category keywords for fuzzy classification
  const filteredMedia = mediaLibrary.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.caption && item.caption.toLowerCase().includes(search.toLowerCase())) ||
                          (item.alt && item.alt.toLowerCase().includes(search.toLowerCase()));
    
    if (activeCategory === "All") return matchesSearch;
    
    // Fuzzy category mapping
    const itemCat = (item.category || "Food").toLowerCase();
    const activeCat = activeCategory.toLowerCase();
    
    if (activeCat === "hero images" && itemCat === "hero") return matchesSearch;
    return itemCat.includes(activeCat) || activeCat.includes(itemCat) && matchesSearch;
  });

  const handleToggleSelect = (url: string) => {
    if (allowMultiple) {
      if (selectedList.includes(url)) {
        setSelectedList(prev => prev.filter(u => u !== url));
      } else {
        setSelectedList(prev => [...prev, url]);
      }
    } else {
      onSelect(url);
      onClose();
    }
  };

  const handleConfirmMultiple = () => {
    if (onSelectMultiple) {
      onSelectMultiple(selectedList);
    }
    onClose();
  };

  const handleAddMediaOnFly = async () => {
    if (!newUrl.trim() || !newName.trim()) return;
    setIsUploading(true);
    setUploadProgress(10);
    
    // Simulate luxury smooth rendering ticker
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 20;
      });
    }, 150);

    setTimeout(async () => {
      clearInterval(interval);
      setUploadProgress(100);

      const newAsset = {
        id: "m_" + Date.now(),
        url: newUrl,
        name: newName,
        type: newUrl.toLowerCase().match(/\.(mp4|webm|mov|ogg)$/) ? "video" : "image",
        category: newCategory,
        date: new Date().toISOString().split("T")[0],
        alt: newName,
        caption: `Artisanal depiction of ${newName}`,
        priority: "Medium",
        visible: true
      };

      try {
        const docRef = doc(db, "admin_settings", "cms_draft");
        const updatedLibrary = [newAsset, ...mediaLibrary];
        await updateDoc(docRef, { mediaLibrary: updatedLibrary });
        setMediaLibrary(updatedLibrary);
        
        // Reset fields
        setNewUrl("");
        setNewName("");
        setIsUploading(false);
        setUploadProgress(0);
        
        // Auto-select newly uploaded asset
        handleToggleSelect(newAsset.url);
      } catch (err) {
        console.error("Error updating media library", err);
        setIsUploading(false);
        setUploadProgress(0);
        alert("Egress blocked by permissions or network state.");
      }
    }, 850);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF6F0] border-2 border-[#C5A070] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden rounded-xs text-[#4A3518]">
        
        {/* Header bar */}
        <div className="bg-[#F3EDE2] border-b border-[#CBBDA9]/40 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#C5A070] rounded-full animate-pulse" />
            <h3 className="font-serif text-base tracking-[0.1em] text-[#3E301F] uppercase font-bold">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#FAF6F0] rounded cursor-pointer transition-colors text-stone-500 hover:text-stone-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body split */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 leading-normal">
          
          {/* Left panel index grid (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {/* Search and category list */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Query by asset name, tags, caption narrative..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#FCFAF5] border border-[#CBBDA9] p-2 pl-9 text-xs focus:outline-none placeholder-stone-400"
                />
              </div>

              {/* Slider list of categories */}
              <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 font-sans text-[10px] uppercase tracking-wider transition-all cursor-pointer rounded-xs border ${
                      activeCategory === cat
                        ? "bg-[#C5A070] text-white border-[#C5A070] font-semibold"
                        : "bg-[#FCFAF5] hover:bg-[#F3EDE2] text-[#8C6D4F] border-[#CBBDA9]/40"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Grid */}
            <div className="flex-1 bg-white border border-[#CBBDA9]/35 min-h-[320px] max-h-[460px] overflow-y-auto p-3 relative rounded-sm">
              {filteredMedia.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 space-y-2">
                  <ImageIcon className="w-10 h-10 stroke-1 block text-stone-300" />
                  <p className="font-sans text-[11px] font-light">No corresponding assets match constraints.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredMedia.map(item => {
                    const isSelected = selectedList.includes(item.url);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleSelect(item.url)}
                        className={`border rounded-sm p-1 cursor-pointer relative group transition-all transform hover:-translate-y-0.5 ${
                          isSelected 
                            ? "bg-amber-50 border-[#C5A070] ring-1 ring-[#C5A070]/30" 
                            : "bg-[#FAF6F0]/40 border-[#CBBDA9]/30 hover:border-amber-700/60"
                        }`}
                      >
                        <div className="aspect-square w-full bg-[#FAF6F0] overflow-hidden relative">
                          {item.type === "video" ? (
                            <div className="w-full h-full flex items-center justify-center bg-[#4A3518]/10">
                              <Play className="w-6 h-6 text-gold-400" />
                            </div>
                          ) : (
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}

                          {/* Top right type pill */}
                          <span className="absolute top-1 left-1 bg-black/60 px-1 py-0.5 rounded-xs text-[8px] uppercase tracking-wider text-white font-mono font-bold">
                            {item.category || "Food"}
                          </span>

                          {/* Selected overlay border indicator */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#C5A070]/20 flex items-center justify-center">
                              <span className="p-1 px-2 border border-white bg-[#C5A070] text-white text-[9px] uppercase tracking-widest font-bold flex items-center gap-1 rounded-sm shadow-md">
                                <Check className="w-3 h-3 block stroke-[3px]" /> Selected
                              </span>
                            </div>
                          )}

                          {/* Hover visual label name */}
                          {!isSelected && (
                            <div className="absolute inset-x-0 bottom-0 bg-stone-900/70 p-1 text-[9px] text-white font-semibold truncate transform translate-y-full group-hover:translate-y-0 transition duration-300">
                              {item.name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right quick adding panel (4 cols) */}
          <div className="lg:col-span-4 bg-[#F5ECE0]/60 p-4 border border-[#CBBDA9]/30 rounded-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-[#CBBDA9]/30 pb-2">
                <span className="font-serif font-bold text-[#3E301F] block text-xs uppercase tracking-wider">On-The-Fly Uploader</span>
                <p className="text-[10px] text-gray-500 font-sans font-light mt-0.5 leading-relaxed">Directly ingest external visual media (Unsplash URLs or online references) into your assets library instantly.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-bold text-stone-500">Asset Label Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Suya Short Ribs Close"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-[#CBBDA9] p-1.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-bold text-stone-500">Image/Video URL Source</label>
                  <textarea
                    rows={3}
                    placeholder="Paste URL (e.g. https://images.unsplash.com/...)"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-[#CBBDA9] p-1.5 text-xs focus:outline-none text-[9px] font-mono leading-tight resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-bold text-stone-500">Categorization Library</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-[#CBBDA9] p-1.5 text-xs focus:outline-none text-[#4A3518]"
                  >
                    <option value="Food">Food</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Interior">Interior</option>
                    <option value="Lifestyle">Ona Lifestyle</option>
                    <option value="Events">Private Events</option>
                    <option value="Hero Images">Hero Backgrounds</option>
                    <option value="Gallery">Gallery Previews</option>
                    <option value="Promotions">Promotional Offers</option>
                    <option value="Staff">Kitchen & Masters Staff</option>
                  </select>
                </div>

                {isUploading && (
                  <div className="bg-[#FAF6F0] p-2 border border-[#CBBDA9]/20 rounded-xs">
                    <div className="flex justify-between text-[9px] uppercase tracking-wider font-mono font-bold mb-1">
                      <span>Ingesting Asset...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#C5A070] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!newUrl.trim() || !newName.trim() || isUploading}
                  onClick={handleAddMediaOnFly}
                  className="w-full text-center bg-[#3E301F] hover:bg-[#524434] disabled:opacity-30 disabled:cursor-not-allowed text-white uppercase font-sans text-[10px] tracking-widest font-semibold py-2 transition-all cursor-pointer"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Direct Ingest to Library
                  </span>
                </button>
              </div>
            </div>

            {allowMultiple && (
              <div className="pt-4 border-t border-[#CBBDA9]/30 mt-4">
                <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-xs mb-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-700 block tracking-wider">Multi-Select Array Mode</span>
                  <span className="text-[9px] font-mono text-gold-600 block mt-0.5">{selectedList.length} items flagged for output.</span>
                </div>
                <button
                  onClick={handleConfirmMultiple}
                  className="w-full text-center bg-[#C5A070] hover:bg-[#8D7048] text-white uppercase font-serif text-xs tracking-wider py-2 font-bold cursor-pointer"
                >
                  Confirm Group Batch Select
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer info bar */}
        <div className="bg-[#F3EDE2] border-t border-[#CBBDA9]/40 p-3 pr-4 flex items-center justify-between text-[10px] text-gray-500 text-left">
          <span>Ona Lagos Media Library asset sync. Select any photo or video row to assign instantly.</span>
          <span>{mediaLibrary.length} catalog items</span>
        </div>

      </div>
    </div>
  );
}
