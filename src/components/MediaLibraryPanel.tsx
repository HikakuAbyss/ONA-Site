import React, { useState, useEffect } from "react";
import { 
  FolderOpen, Search, Filter, Trash2, Edit3, Image as ImageIcon, Video as VideoIcon, 
  Upload, Sliders, Check, RefreshCw, Layers, Sparkles, AlertCircle, Play, Eye, 
  ArrowUp, ArrowDown, Clipboard, CheckSquare, Save, Undo, Plus, Trash
} from "lucide-react";
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_CMS } from "./WebsiteCustomizer";
import MediaPickerDialog from "./MediaPickerDialog";

interface MediaLibraryPanelProps {
  currentUser: {
    uid: string;
    email: string;
    role: string;
  };
}

export default function MediaLibraryPanel({ currentUser }: MediaLibraryPanelProps) {
  const [settings, setSettings] = useState<any>(DEFAULT_CMS);
  const [originalSettings, setOriginalSettings] = useState<any>(DEFAULT_CMS);
  const [loading, setLoading] = useState(true);
  
  // Tab within Media section
  const [subTab, setSubTab] = useState<"library" | "sections">("library");

  // Filter queries
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Selected detail item in Library
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Upload progress UI state  
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileCat, setFileCat] = useState("Food");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Section Image config selection state
  const [editingSectionId, setEditingSectionId] = useState<string>("about");
  
  // Media dialog helper
  const [pickerConfig, setPickerConfig] = useState<{
    isOpen: boolean;
    onSelect: (url: string) => void;
    allowMultiple: boolean;
    selectedUrls?: string[];
    onSelectMultiple?: (urls: string[]) => void;
  }>({
    isOpen: false,
    onSelect: () => {},
    allowMultiple: false
  });

  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    const docRef = doc(db, "admin_settings", "cms_draft");
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        // Fallback merge
        const merged = {
          ...DEFAULT_CMS,
          ...data,
          mediaLibrary: data.mediaLibrary || DEFAULT_CMS.mediaLibrary,
          homepageSections: data.homepageSections || DEFAULT_CMS.homepageSections
        };
        setSettings(merged);
        setOriginalSettings(merged);
        
        // Auto-select first item in database
        if (merged.mediaLibrary && merged.mediaLibrary.length > 0 && !selectedItem) {
          setSelectedItem(merged.mediaLibrary[0]);
        }
      } else {
        // Create draft if absolutely missing
        setDoc(docRef, DEFAULT_CMS).then(() => {
          setSettings(DEFAULT_CMS);
          setOriginalSettings(DEFAULT_CMS);
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore error reading cms_draft", error);
      // Fallback local persistence
      const saved = localStorage.getItem("ona_mock_cms_draft");
      if (saved) {
        setSettings(JSON.parse(saved));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const hasWritePermission = currentUser.role === "Super Admin" || currentUser.role === "Admin" || currentUser.role === "Manager" || currentUser.role === "Content Editor";
  const isSuperAdminOrAdmin = currentUser.role === "Super Admin" || currentUser.role === "Admin";

  const categories = [
    "All", "Food", "Drinks", "Interior", "Lifestyle", "Events", "Hero Images", "Gallery", "Promotions", "Staff"
  ];

  const filteredMedia = (settings.mediaLibrary || []).filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.caption && item.caption.toLowerCase().includes(search.toLowerCase())) ||
                          (item.alt && item.alt.toLowerCase().includes(search.toLowerCase()));
    
    if (selectedCategory === "All") return matchesSearch;
    
    const itemCat = (item.category || "Food").toLowerCase();
    const activeCat = selectedCategory.toLowerCase();
    
    if (activeCat === "hero images" && itemCat === "hero") return matchesSearch;
    return itemCat.includes(activeCat) || activeCat.includes(itemCat) && matchesSearch;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const mockFiles = [
      "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=800",
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=1000",
      "https://images.unsplash.com/photo-1566453983492-411db181e194?w=800"
    ];
    // Simulator random select
    const randomUrl = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setFileUrl(randomUrl);
    setFileName("Dropped Asset " + (settings.mediaLibrary.length + 1));
    showToast("File detected via drag-and-drop. Ingestion details filled below!");
  };

  // Upload item simulated progression
  const handleIngestAsset = async () => {
    if (!fileUrl.trim() || !fileName.trim()) return;
    setIsUploading(true);
    setProgress(5);

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 95) {
          clearInterval(interval);
          return 95;
        }
        return p + 15;
      });
    }, 100);

    setTimeout(async () => {
      clearInterval(interval);
      setProgress(100);

      const newAsset = {
        id: "m_" + Date.now(),
        url: fileUrl,
        name: fileName,
        type: fileUrl.toLowerCase().match(/\.(mp4|webm|mov|ogg)$/) ? "video" : "image",
        category: fileCat,
        date: new Date().toISOString().split("T")[0],
        alt: fileName,
        caption: `Artisanal capture depicting ${fileName}`,
        priority: "Medium",
        visible: true,
        dimensions: "1920 x 1080 (HD)"
      };

      const updatedLibrary = [newAsset, ...(settings.mediaLibrary || [])];
      
      try {
        const docRef = doc(db, "admin_settings", "cms_draft");
        await updateDoc(docRef, { mediaLibrary: updatedLibrary });
        
        // Match settings state
        setSettings((prev: any) => ({ ...prev, mediaLibrary: updatedLibrary }));
        setSelectedItem(newAsset);
        setFileUrl("");
        setFileName("");
        setIsUploading(false);
        setProgress(0);
        showToast("Dynamic asset added to media library!");
      } catch (err) {
        console.error(err);
        setIsUploading(false);
        setProgress(0);
        alert("Permissions boundary blocked writing library.");
      }
    }, 700);
  };

  // Delete media item from library
  const handleDeleteMedia = async (id: string) => {
    if (!isSuperAdminOrAdmin) {
      alert("Only Super Admins or Admins can purge media files.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this media asset?")) return;

    const filtered = (settings.mediaLibrary || []).filter((item: any) => item.id !== id);
    try {
      const docRef = doc(db, "admin_settings", "cms_draft");
      await updateDoc(docRef, { mediaLibrary: filtered });
      setSettings((prev: any) => ({ ...prev, mediaLibrary: filtered }));
      
      if (selectedItem?.id === id) {
        setSelectedItem(filtered[0] || null);
      }
      showToast("Media file purged from library.");
    } catch (err) {
      console.error(err);
      alert("Egress blocked by database security rules.");
    }
  };

  // Save selected item metadata adjustments
  const handleSaveMetadata = async () => {
    if (!selectedItem) return;
    const updatedLibrary = (settings.mediaLibrary || []).map((item: any) => {
      if (item.id === selectedItem.id) {
        return selectedItem;
      }
      return item;
    });

    try {
      const docRef = doc(db, "admin_settings", "cms_draft");
      await updateDoc(docRef, { mediaLibrary: updatedLibrary });
      setSettings((prev: any) => ({ ...prev, mediaLibrary: updatedLibrary }));
      showToast("Asset labels & alt text synchronized.");
    } catch (err) {
      console.error(err);
      alert("Error saving metadata to database draft.");
    }
  };

  // Draft/Publish Actions
  const handleSaveDraft = async () => {
    try {
      const docRef = doc(db, "admin_settings", "cms_draft");
      await setDoc(docRef, settings);
      localStorage.setItem("ona_mock_cms_draft", JSON.stringify(settings));
      showToast("Visual draft saved securely.");
    } catch (err) {
      console.error(err);
      alert("Could not commit draft.");
    }
  };

  const handlePublishChanges = async () => {
    if (!isSuperAdminOrAdmin) {
      alert("Access Blocked. Only Super Admins and Admins can publish draft styles to live production.");
      return;
    }
    if (!window.confirm("Publish all visual custom media to production live site now?")) return;
    
    try {
      await setDoc(doc(db, "admin_settings", "cms_config"), settings);
      await setDoc(doc(db, "admin_settings", "cms_draft"), settings);
      
      localStorage.setItem("ona_mock_cms_config", JSON.stringify(settings));
      localStorage.setItem("ona_mock_cms_draft", JSON.stringify(settings));
      
      // Dispatch refresh trigger
      window.dispatchEvent(new Event("ona_cms_updated"));
      showToast("Published! Live site now serves your chosen media.");
      setOriginalSettings(settings);
    } catch (err) {
      console.error(err);
      alert("Error writing configurations - check safety permissions.");
    }
  };

  const handleUndoLocal = () => {
    setSettings(originalSettings);
    showToast("Changes reverted to published checkout.");
  };

  const handleResetToDefault = () => {
    if (window.confirm("Revert your content catalog back to factory settings? All configurations will be reset upon publishing.")) {
      setSettings(DEFAULT_CMS);
      showToast("Visual settings loaded from defaults.");
    }
  };

  // Handle single section settings updates
  const updateSectionField = (id: string, field: string, value: any) => {
    setSettings((prev: any) => {
      const updatedSections = prev.homepageSections.map((sec: any) => {
        if (sec.id === id) {
          return { ...sec, [field]: value };
        }
        return sec;
      });
      return { ...prev, homepageSections: updatedSections };
    });
  };

  // Find active editing section details
  const activeSecObj = (settings.homepageSections || []).find((s: any) => s.id === editingSectionId) || {
    id: editingSectionId,
    name: "General Section",
    visible: true,
    heading: "",
    description: "",
    bgImage: "",
    mobileImage: "",
    backgroundVideo: "",
    overlayOpacity: 40,
    imagePosition: "center",
    imageFit: "cover",
    galleryImages: []
  };

  return (
    <div className="space-y-6 text-[#4A3518] leading-normal font-sans text-xs">
      
      {/* Toast Notification HUD */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#C5A070] text-white p-3 border border-white/20 shadow-2xl tracking-widest uppercase font-mono text-[9px] font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> {toastMessage}
        </div>
      )}

      {/* HEADER CONTROLS BAR */}
      <div className="bg-[#FAF6F0] p-4 border border-[#CBBDA9]/30 flex flex-col md:flex-row items-center justify-between gap-4 rounded-sm">
        <div className="text-left">
          <h2 className="font-serif text-lg tracking-[0.08em] uppercase font-bold text-[#3E301F]">
            Media Library &amp; Visual Content Engine
          </h2>
          <p className="text-[10px] text-gray-400 font-light mt-0.5 max-w-xl">
            Admin master dashboard to manage dynamic visual layers, food photography, homepage video loops, and responsive image fit alignment parameters.
          </p>
        </div>
        
        {/* Save Draft & Publish bar */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleSaveDraft}
            className="px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#F3EDE2] border border-[#CBBDA9]/60 text-[#8C6D4F] uppercase tracking-wider font-semibold text-[10px] cursor-pointer flex items-center gap-1"
          >
            <Undo className="w-3 h-3" /> Save Draft
          </button>
          <button 
            onClick={handlePublishChanges}
            disabled={!isSuperAdminOrAdmin}
            className="px-3.5 py-1.5 bg-[#C5A070] hover:bg-[#A98455] disabled:opacity-40 text-white uppercase tracking-wider font-bold text-[10px] cursor-pointer flex items-center gap-1.5 shadow-sm rounded-xs"
          >
            <Save className="w-3.5 h-3.5" /> Publish Changes
          </button>
          <button 
            onClick={handleUndoLocal}
            className="p-1.5 bg-[#FAF6F0] hover:bg-[#F3EDE2] border border-[#CBBDA9]/60 font-mono text-stone-500 rounded-sm cursor-pointer"
            title="Undo Local Modifies"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SUB PANELS TOGGLES */}
      <div className="flex border-b border-[#CBBDA9]/30 gap-1 pl-1">
        <button
          onClick={() => setSubTab("library")}
          className={`py-3 px-6 uppercase tracking-[0.15em] font-sans font-bold text-[10px] border-t-2 relative cursor-pointer ${
            subTab === "library"
              ? "bg-[#FAF6F0] border-[#3E301F] text-[#3E301F] font-black"
              : "bg-transparent border-transparent text-[#8C6D4F] hover:text-[#4A3518]"
          }`}
        >
          <span className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" /> Media Asset Library
          </span>
        </button>
        <button
          onClick={() => setSubTab("sections")}
          className={`py-3 px-6 uppercase tracking-[0.15em] font-sans font-bold text-[10px] border-t-2 relative cursor-pointer ${
            subTab === "sections"
              ? "bg-[#FAF6F0] border-[#3E301F] text-[#3E301F] font-black"
              : "bg-transparent border-transparent text-[#8C6D4F] hover:text-[#4A3518]"
          }`}
        >
          <span className="flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Homepage Section Media
          </span>
        </button>
      </div>

      {/* SUB PANEL 1: MASTER ASSET LIBRARY */}
      {subTab === "library" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main List Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-4 text-left">
            
            {/* Filtering parameters and Drop Zone Trigger */}
            <div className="bg-[#FAF6F0] p-4 border border-[#CBBDA9]/30 rounded-xs space-y-3">
              
              {/* Drop area */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#CBBDA9]/60 bg-white/50 p-6 text-center cursor-pointer hover:bg-white hover:border-[#C5A070]/60 transition duration-300 rounded-sm"
              >
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Upload className="w-7 h-7 stroke-[1.5] text-stone-400 mb-1" />
                  <span className="font-serif font-bold text-[#3E301F] text-xs">Drag &amp; Drop Image Files</span>
                  <span className="text-[9px] text-gray-400">Drops trigger immediate simulated asset ingestion</span>
                </div>
              </div>

              {/* Filtering indices */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                <div className="md:col-span-7 relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search library assets by name, caption, alt tags..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-[#FCFAF5] border border-[#CBBDA9] p-2 pl-9 text-xs focus:outline-none placeholder-stone-400"
                  />
                </div>
                <div className="md:col-span-5 flex items-center justify-end gap-1 overflow-x-auto">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#FCFAF5] border border-[#CBBDA9] p-2 text-xs text-[#4A3518] focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredMedia.map((item: any) => {
                const isActive = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`border rounded-sm p-1.5 cursor-pointer relative group transition-all transform hover:-translate-y-0.5 ${
                      isActive 
                        ? "bg-amber-50/50 border-[#C5A070] ring-1 ring-[#C5A070]/40" 
                        : "bg-[#FAF6F0]/20 border-[#CBBDA9]/20 hover:border-amber-700/50"
                    }`}
                  >
                    <div className="aspect-square bg-[#FAF6F0] overflow-hidden relative">
                      {item.type === "video" ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#4A3518]/10 text-[#C5A070]">
                          <Play className="w-7 h-7 block" />
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      {/* Top category label */}
                      <span className="absolute top-1.5 left-1.5 bg-black/70 px-1 py-0.5 rounded-xs text-[8px] text-white uppercase font-serif tracking-widest font-bold">
                        {item.category || "Food"}
                      </span>

                      {/* Size banner if featured */}
                      {item.isFeatured && (
                        <span className="absolute top-1.5 right-1.5 bg-[#C5A070] px-1 py-0.5 rounded-xs text-[8px] text-white uppercase font-sans font-bold shadow-xs">
                          FEAT
                        </span>
                      )}
                    </div>
                    {/* Caption row */}
                    <div className="pt-2">
                      <h4 className="font-serif font-bold text-[#3E301F] text-[11px] truncate">{item.name}</h4>
                      <p className="font-mono text-[9px] text-stone-400 mt-0.5">{item.date || "2026-05-26"}</p>
                    </div>
                  </div>
                );
              })}

              {filteredMedia.length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-400 bg-[#FAF6F0]/20 border border-dashed border-[#CBBDA9]/30 rounded-sm">
                  <span className="font-sans block text-sm">No corresponding assets found.</span>
                  <span className="text-[10px] block mt-1">Refine your active category list or keywords search query.</span>
                </div>
              )}
            </div>

          </div>

          {/* Asset Details & Form Column (4 cols) */}
          <div className="lg:col-span-4 bg-[#FAF6F0] border border-[#CBBDA9]/30 p-4 rounded-xs text-left space-y-4">
            
            {/* Ingest asset section */}
            <div className="border-b border-[#CBBDA9]/30 pb-4">
              <span className="font-serif font-bold text-[#3E301F] block uppercase tracking-wider text-[11px]">Direct Loader Ingestion</span>
              <p className="text-[10px] text-stone-400 font-sans mt-0.5">Quickly bind new URLs from image databases directly into the CMS.</p>
              
              <div className="space-y-3 mt-3">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-bold text-stone-500">Asset Label Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Suya Charcoal Plating Close"
                    value={fileName}
                    onChange={e => setFileName(e.target.value)}
                    className="w-full bg-white border border-[#CBBDA9]/50 p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-bold text-stone-500">Image/Video URL Source</label>
                  <input
                    type="text"
                    placeholder="Paste Unsplash/Cloud URL resource"
                    value={fileUrl}
                    onChange={e => setFileUrl(e.target.value)}
                    className="w-full bg-white border border-[#CBBDA9]/50 p-2 text-xs focus:outline-none text-[10px] font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-widest font-bold text-stone-500">Library Tab</label>
                    <select
                      value={fileCat}
                      onChange={e => setFileCat(e.target.value)}
                      className="w-full bg-white border border-[#CBBDA9]/50 p-2 text-xs text-[#4A3518]"
                    >
                      <option value="Food">Food Pictures</option>
                      <option value="Drinks">Cocktails/Drinks</option>
                      <option value="Interior">Interior Salon</option>
                      <option value="Lifestyle">Ona Lifestyle</option>
                      <option value="Events">Private Events</option>
                      <option value="Hero Images">Hero Images</option>
                      <option value="Gallery">Visual Gallery</option>
                      <option value="Promotions">Promotional</option>
                      <option value="Staff">Kitchen Staff</option>
                    </select>
                  </div>
                  <div className="self-end pb-0.5">
                    <button
                      onClick={handleIngestAsset}
                      disabled={!fileUrl.trim() || !fileName.trim() || isUploading}
                      className="w-full bg-[#3E301F] hover:bg-[#524434] disabled:opacity-35 text-white py-2 uppercase tracking-wide font-bold transition rounded-xs text-[10px] cursor-pointer"
                    >
                      Ingest Item
                    </button>
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-1 bg-white p-2 border rounded-xs">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span>Uploading to Library...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
                      <div className="bg-[#C5A070] h-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected item metadata manager */}
            {selectedItem ? (
              <div className="space-y-4">
                <div className="border-b border-[#CBBDA9]/30 pb-2 flex items-center justify-between">
                  <span className="font-serif font-bold text-[#3E301F] text-[11px] uppercase tracking-wider">Asset Metadata Registry</span>
                  {isSuperAdminOrAdmin && (
                    <button 
                      onClick={() => handleDeleteMedia(selectedItem.id)}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 transition"
                      title="Purge permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> <span className="text-[9px] uppercase font-bold">Purge</span>
                    </button>
                  )}
                </div>

                <div className="aspect-video w-full border bg-white relative rounded-xs overflow-hidden flex items-center justify-center">
                  {selectedItem.type === "video" ? (
                    <div className="w-full h-full flex items-center justify-center bg-[#4A3518]/10 text-[#C5A070]">
                      <Play className="w-10 h-10 stroke-1" />
                    </div>
                  ) : (
                    <img
                      src={selectedItem.url}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                {/* Diagnostics */}
                <div className="p-2.5 bg-white border border-[#CBBDA9]/20 font-mono text-[9px] text-[#8C6D4F] grid grid-cols-2 gap-2">
                  <span>ID: {selectedItem.id}</span>
                  <span>Category: {selectedItem.category || "Food"}</span>
                  <span className="col-span-2 truncate">URL: {selectedItem.url}</span>
                  <span className="col-span-2">Dimensions: {selectedItem.dimensions || "1600 x 1066 px (HD Optimized)"}</span>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-widest font-bold text-stone-500">Asset Title</label>
                    <input
                      type="text"
                      value={selectedItem.name}
                      onChange={e => setSelectedItem({...selectedItem, name: e.target.value})}
                      className="w-full bg-white border border-[#CBBDA9]/50 p-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-widest font-bold text-stone-500">Alt Text (Search Engine index &amp; accessibility)</label>
                    <input
                      type="text"
                      value={selectedItem.alt || ""}
                      onChange={e => setSelectedItem({...selectedItem, alt: e.target.value})}
                      className="w-full bg-white border border-[#CBBDA9]/50 p-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-widest font-bold text-stone-500">Captions / Narrative text</label>
                    <textarea
                      rows={2}
                      value={selectedItem.caption || ""}
                      onChange={e => setSelectedItem({...selectedItem, caption: e.target.value})}
                      className="w-full bg-white border border-[#CBBDA9]/50 p-2 text-xs focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#CBBDA9]/10">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selectedItem.isFeatured}
                        onChange={e => setSelectedItem({...selectedItem, isFeatured: e.target.checked})}
                        className="rounded-xs focus:ring-[#C5A070]"
                      />
                      <span className="font-bold text-stone-600 block text-[9px] uppercase tracking-wider">Featured Asset</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItem.visible !== false}
                        onChange={e => setSelectedItem({...selectedItem, visible: e.target.checked})}
                        className="rounded-xs focus:ring-[#C5A070]"
                      />
                      <span className="font-bold text-stone-600 block text-[9px] uppercase tracking-wider">Visible on Site</span>
                    </label>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[8px] uppercase tracking-widest font-bold text-stone-500">Render Priority</label>
                    <select
                      value={selectedItem.priority || "Medium"}
                      onChange={e => setSelectedItem({...selectedItem, priority: e.target.value})}
                      className="w-full bg-white border border-[#CBBDA9]/50 p-2 text-xs text-[#4A3518]"
                    >
                      <option value="High">High (Immediate Preload)</option>
                      <option value="Medium">Medium (Lazy Preload)</option>
                      <option value="Low">Low (Delayed load)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveMetadata}
                    className="w-full bg-[#8E8274] hover:bg-[#706558] text-white py-2 uppercase tracking-wide font-bold text-[10px] cursor-pointer"
                  >
                    Sync Registry Changes
                  </button>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 font-sans font-light">
                <span>Select an item in your media library to adjust searchable descriptors, alt metadata, and visibility tags.</span>
              </div>
            )}

          </div>

        </div>
      )}

      {/* SUB PANEL 2: SECTION-BY-SECTION VISUAL MANAGEMENT */}
      {subTab === "sections" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* List of Homepage sections picker (4 cols) */}
          <div className="lg:col-span-4 bg-[#FAF6F0] border border-[#CBBDA9]/30 p-4 rounded-xs text-left space-y-3">
            <span className="font-serif font-bold text-[#3E301F] text-xs uppercase tracking-wider block border-b border-[#CBBDA9]/30 pb-2">Website Layout Sections</span>
            <p className="text-[10px] text-gray-400 font-light font-sans leading-relaxed">Select a portal block to replace background imagery, add tablet banners, overlay opacity, and alignment metrics.</p>
            
            <div className="space-y-1.5 pt-2">
              {[
                { id: "hero", label: "Hero Welcome Banner" },
                { id: "about", label: "About Narrative Section" },
                { id: "dishes", label: "Featured Dishes Plate" },
                { id: "sunday", label: "Sunday Roast Carvings" },
                { id: "kids", label: "Junior Kids Dining" },
                { id: "cocktails", label: "Cocktails Mixology Room" },
                { id: "gallery", label: "Visual Gallery Previews" },
                { id: "testimonials", label: "Guest Endorsements" },
                { id: "lifestyle", label: "Ona Lifestyle Boutique" },
                { id: "events", label: "Private Events Booking" },
                { id: "footer", label: "Footer Background Arch" }
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setEditingSectionId(sec.id)}
                  className={`w-full text-left p-3 border rounded-xs font-sans text-xs uppercase tracking-wider transition relative cursor-pointer ${
                    editingSectionId === sec.id
                      ? "bg-white border-[#C5A070] text-[#3E301F] font-bold"
                      : "bg-[#FAF6F0]/50 border-[#CBBDA9]/30 text-[#8C6D4F] hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${editingSectionId === sec.id ? "bg-[#C5A070]" : "bg-stone-300"}`} />
                    {sec.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration sub-form (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#CBBDA9]/35 p-6 rounded-xs text-left space-y-6">
            
            <div className="border-b border-[#CBBDA9]/30 pb-3 flex items-center justify-between">
              <div>
                <span className="p-1 px-1.5 bg-[#C5A070]/10 border border-[#C5A070]/30 text-[#C5A070] text-[9px] uppercase tracking-wider font-bold rounded-xs inline-block">
                  CMS Section Context: {editingSectionId.toUpperCase()}
                </span>
                <h3 className="font-serif text-base tracking-[0.05em] font-bold text-[#3E301F] mt-1">
                  Adjusting {editingSectionId === "hero" ? "Hero Banner" : editingSectionId === "footer" ? "Footer" : (settings.homepageSections.find((s: any) => s.id === editingSectionId)?.name || editingSectionId)} Section Visuals
                </h3>
              </div>
              
              {/* Reset single section background */}
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to revert visuals of section '${editingSectionId}' back to default?`)) {
                    if (editingSectionId === "hero") {
                      setSettings((prev: any) => ({
                        ...prev,
                        hero: { ...prev.hero, backgroundImage: DEFAULT_CMS.hero.backgroundImage, backgroundVideo: "" }
                      }));
                    } else if (editingSectionId === "footer") {
                      setSettings((prev: any) => ({
                        ...prev,
                        footer: { ...prev.footer, bgImage: "" }
                      }));
                    } else {
                      const defVal = DEFAULT_CMS.homepageSections.find((s: any) => s.id === editingSectionId)?.bgImage || "";
                      updateSectionField(editingSectionId, "bgImage", defVal);
                    }
                    showToast("Section image layout reset.");
                  }
                }}
                className="text-stone-400 hover:text-stone-700 font-bold uppercase tracking-widest text-[9px] border border-stone-200 hover:bg-[#FAF6F0] px-2.5 py-1 rounded cursor-pointer transition-colors"
              >
                Reset Visuals
              </button>
            </div>

            {/* Layout settings fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-normal">
              
              {/* Left text column: Pickers */}
              <div className="space-y-4">
                
                {/* 1. Main General Desktop Image URL */}
                <div className="space-y-1.5">
                  <span className="font-bold text-stone-700 block text-[9.5px] uppercase tracking-wider">Main Desktop Background Image</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste static image URL or choose library"
                      value={
                        editingSectionId === "hero" 
                          ? settings.hero.backgroundImage 
                          : editingSectionId === "footer"
                          ? (settings.footer.bgImage || "")
                          : activeSecObj.bgImage || ""
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (editingSectionId === "hero") {
                          setSettings((prev: any) => ({ ...prev, hero: { ...prev.hero, backgroundImage: val } }));
                        } else if (editingSectionId === "footer") {
                          setSettings((prev: any) => ({ ...prev, footer: { ...prev.footer, bgImage: val } }));
                        } else {
                          updateSectionField(editingSectionId, "bgImage", val);
                        }
                      }}
                      className="flex-1 bg-[#FCFAF5] border border-[#CBBDA9] p-2 text-xs focus:outline-none text-[10px] font-mono truncate"
                    />
                    <button
                      onClick={() => setPickerConfig({
                        isOpen: true,
                        allowMultiple: false,
                        onSelect: (url) => {
                          if (editingSectionId === "hero") {
                            setSettings((prev: any) => ({ ...prev, hero: { ...prev.hero, backgroundImage: url } }));
                          } else if (editingSectionId === "footer") {
                            setSettings((prev: any) => ({ ...prev, footer: { ...prev.footer, bgImage: url } }));
                          } else {
                            updateSectionField(editingSectionId, "bgImage", url);
                          }
                          showToast("Dynamic desktop image bound.");
                        }
                      })}
                      className="px-3 bg-[#8E8274] hover:bg-[#6C6155] text-white uppercase text-[9px] tracking-wider font-bold transition rounded-xs cursor-pointer flex items-center gap-1"
                    >
                      Browse
                    </button>
                  </div>
                  <span className="text-[9px] text-gray-400 font-sans block">Primary high-resolution landscape photograph loaded for desktops &amp; laptops.</span>
                </div>

                {/* 2. Responsive Mobile Image version */}
                <div className="space-y-1.5">
                  <span className="font-bold text-stone-700 block text-[9.5px] uppercase tracking-wider">Mobile Centric Image Version (Portrait Crop)</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Portrait cropped URL link"
                      value={activeSecObj.mobileImage || ""}
                      onChange={e => updateSectionField(editingSectionId, "mobileImage", e.target.value)}
                      className="flex-1 bg-[#FCFAF5] border border-[#CBBDA9] p-2 text-xs focus:outline-none text-[10px] font-mono truncate"
                    />
                    <button
                      onClick={() => setPickerConfig({
                        isOpen: true,
                        allowMultiple: false,
                        onSelect: (url) => {
                          updateSectionField(editingSectionId, "mobileImage", url);
                          showToast("Mobile crop image bound.");
                        }
                      })}
                      className="px-3 bg-[#8E8274] hover:bg-[#6C6155] text-white uppercase text-[9px] tracking-wider font-bold transition rounded-xs cursor-pointer flex items-center gap-1"
                    >
                      Browse
                    </button>
                  </div>
                  <span className="text-[9px] text-gray-400 font-sans block">Optimized portrait crop specifically shown on iPhones, Pixels, &amp; tablets. Saves bandwidth on cellular connections.</span>
                </div>

                {/* 3. Optional Background Video loop */}
                <div className="space-y-1.5">
                  <span className="font-bold text-stone-700 block text-[9.5px] uppercase tracking-wider">Background Cinematic Video loop URL</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="MP4 or WebM video stream URL"
                      value={
                        editingSectionId === "hero" 
                          ? settings.hero.backgroundVideo 
                          : activeSecObj.backgroundVideo || ""
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (editingSectionId === "hero") {
                          setSettings((prev: any) => ({ ...prev, hero: { ...prev.hero, backgroundVideo: val } }));
                        } else {
                          updateSectionField(editingSectionId, "backgroundVideo", val);
                        }
                      }}
                      className="flex-1 bg-[#FCFAF5] border border-[#CBBDA9] p-2 text-xs focus:outline-none text-[10px] font-mono truncate"
                    />
                    <button
                      onClick={() => setPickerConfig({
                        isOpen: true,
                        allowMultiple: false,
                        onSelect: (url) => {
                          if (editingSectionId === "hero") {
                            setSettings((prev: any) => ({ ...prev, hero: { ...prev.hero, backgroundVideo: url } }));
                          } else {
                            updateSectionField(editingSectionId, "backgroundVideo", url);
                          }
                          showToast("Background video loop applied.");
                        }
                      })}
                      className="px-3 bg-[#8E8274] hover:bg-[#6C6155] text-white uppercase text-[9px] tracking-wider font-bold transition rounded-xs cursor-pointer flex items-center gap-1"
                    >
                      Browse
                    </button>
                  </div>
                  <span className="text-[9px] text-gray-400 font-sans block">Plays a silent, low-footprint video stream in background to establish deep sensory atmosphere. (e.g. MP4)</span>
                </div>

              </div>

              {/* Right column: Image attributes alignment, fit, darkness overlays */}
              <div className="space-y-4 bg-[#FAF6F0]/40 p-4 border border-[#CBBDA9]/20 rounded-xs">
                
                {/* 4. Overlay Darkness slider */}
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-stone-700 text-[9.5px] uppercase tracking-wider">
                    <span>Overlay darkness control</span>
                    <span className="font-mono text-[#C5A070]">{
                      editingSectionId === "hero" 
                        ? settings.hero.overlayOpacity 
                        : (activeSecObj.overlayOpacity !== undefined ? activeSecObj.overlayOpacity : 40)
                    }% Opacity</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={
                      editingSectionId === "hero" 
                        ? settings.hero.overlayOpacity 
                        : (activeSecObj.overlayOpacity !== undefined ? activeSecObj.overlayOpacity : 40)
                    }
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      if (editingSectionId === "hero") {
                        setSettings((prev: any) => ({ ...prev, hero: { ...prev.hero, overlayOpacity: val } }));
                      } else {
                        updateSectionField(editingSectionId, "overlayOpacity", val);
                      }
                    }}
                    className="w-full accent-[#C5A070] cursor-pointer"
                  />
                  <span className="text-[9px] text-gray-400 font-sans block">Darkens the background image/video, ensuring white headings remain perfectly eye-safe with massive contrast ratios.</span>
                </div>

                {/* 5. Image Position Alignment */}
                <div className="space-y-1.5">
                  <span className="font-bold text-stone-700 block text-[9.5px] uppercase tracking-wider">Image Center Position Alignment</span>
                  <select
                    value={activeSecObj.imagePosition || "center"}
                    onChange={e => updateSectionField(editingSectionId, "imagePosition", e.target.value)}
                    className="w-full bg-[#FCFAF5] border border-[#CBBDA9] p-2 text-xs focus:outline-none text-[#4A3518]"
                  >
                    <option value="center">Center-Center (Balanced Focus)</option>
                    <option value="top">Top Center (Prioritize background ceiling/elements)</option>
                    <option value="bottom">Bottom Center (Prioritize plates/floors)</option>
                    <option value="left">Left Center (Align left on wide displays)</option>
                    <option value="right">Right Center (Align right on wide displays)</option>
                  </select>
                </div>

                {/* 6. Image Fit setting */}
                <div className="space-y-1.5">
                  <span className="font-bold text-stone-700 block text-[9.5px] uppercase tracking-wider">Image Layout Fit Scale</span>
                  <select
                    value={activeSecObj.imageFit || "cover"}
                    onChange={e => updateSectionField(editingSectionId, "imageFit", e.target.value)}
                    className="w-full bg-[#FCFAF5] border border-[#CBBDA9] p-2 text-xs focus:outline-none text-[#4A3518]"
                  >
                    <option value="cover">Scale to Fill (Cover layout window dynamically)</option>
                    <option value="contain">Contain within Box (Full image visible, no outer crops)</option>
                  </select>
                </div>

                {/* 7. Display visibility option */}
                <div className="space-y-1.5 border-t border-[#CBBDA9]/20 pt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSectionId === "hero" || editingSectionId === "footer" || activeSecObj.visible !== false}
                      disabled={editingSectionId === "hero" || editingSectionId === "footer"}
                      onChange={e => updateSectionField(editingSectionId, "visible", e.target.checked)}
                      className="rounded bg-[#FCFAF5] text-[#C5A070] focus:ring-[#C5A070]"
                    />
                    <div>
                      <span className="font-bold text-stone-700 block text-[9.5px] uppercase tracking-wider">Display section on public grid</span>
                      <span className="text-[8px] text-stone-400 mt-0.5 font-light">Toggles this entire narrative module visibility block on our live index homepage.</span>
                    </div>
                  </label>
                </div>

              </div>

            </div>

            {/* LIVE INSTANTLY PREVIEW FRAME */}
            <div className="space-y-3 pt-4 border-t border-[#CBBDA9]/30">
              <span className="font-serif font-bold text-[#3E301F] text-xs uppercase tracking-wider block">Live Instant Section Mock Preview</span>
              
              <div 
                className="w-full h-[220px] bg-neutral-900 relative rounded border border-[#CBBDA9]/40 flex flex-col items-center justify-center p-6 text-center text-white bg-cover bg-center overflow-hidden"
                style={{
                  backgroundImage: `url(${
                    editingSectionId === "hero" 
                      ? settings.hero.backgroundImage 
                      : editingSectionId === "footer"
                      ? (settings.footer.bgImage || "https://images.unsplash.com/photo-1544025162-d76694265947?w=1000")
                      : (activeSecObj.bgImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800")
                  })`,
                  backgroundPosition: activeSecObj.imagePosition || "center",
                  backgroundSize: activeSecObj.imageFit || "cover"
                }}
              >
                {/* Active Opacity layer */}
                <div 
                  className="absolute inset-0 bg-black" 
                  style={{
                    opacity: (
                      editingSectionId === "hero" 
                        ? settings.hero.overlayOpacity 
                        : (activeSecObj.overlayOpacity !== undefined ? activeSecObj.overlayOpacity : 40)
                    ) / 100
                  }}
                />

                <div className="relative z-10 max-w-lg space-y-2">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A070] font-bold">
                    {editingSectionId === "hero" ? (settings.branding?.tagline || "La Maison") : activeSecObj.tagline || "La Maison Ona"}
                  </span>
                  
                  <h4 className="font-serif text-lg leading-tight font-light font-bold">
                    {editingSectionId === "hero" ? settings.hero.title : activeSecObj.heading || "Ancestral Hospitality"}
                  </h4>
                  
                  <p className="text-[9.5px] text-stone-300 font-sans font-light leading-relaxed max-w-sm mx-auto line-clamp-2">
                    {editingSectionId === "hero" ? settings.hero.subtitle : activeSecObj.description || "Every visual detail is meticulously curated to leave a lasting mark."}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* RENDER THE REUSABLE MODAL IN BACKGROUND */}
      <MediaPickerDialog
        isOpen={pickerConfig.isOpen}
        onClose={() => setPickerConfig(prev => ({ ...prev, isOpen: false }))}
        onSelect={pickerConfig.onSelect}
        allowMultiple={pickerConfig.allowMultiple}
        onSelectMultiple={pickerConfig.onSelectMultiple}
        selectedUrls={pickerConfig.selectedUrls}
      />

    </div>
  );
}
