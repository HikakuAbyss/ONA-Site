import { useState, useEffect } from "react";
import { Menu, X, Phone, CalendarRange, User, LogOut, Settings, Globe } from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenReservation: () => void;
  cms?: any;
  currentUser?: any;
  userRole?: string;
  onSignOut?: () => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  onOpenReservation,
  cms,
  currentUser,
  userRole,
  onSignOut
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Determine if guest status
  const isGuest = userRole === "Guest" || !currentUser;

  const navLinks = [
    { id: "home", label: "La Maison" },
    { id: "about", label: "Our Story" },
    { id: "menu", label: "The Menu" },
    { id: "kids-dietary", label: "Family & Dietary" },
    { id: "ona-lifestyle", label: "Lifestyle" },
    { id: "events", label: "Private Events" },
    { id: "gallery", label: "Gallery" },
    { id: "contact", label: "Contact & Hours" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getInitials = () => {
    if (!currentUser) return "O";
    if (currentUser.displayName) {
      const parts = currentUser.displayName.split(" ");
      return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
    }
    return currentUser.email ? currentUser.email[0].toUpperCase() : "U";
  };

  return (
    <>
      <header
        id="master-navigation"
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ${
          isScrolled
            ? "bg-[#FAF6F0]/90 backdrop-blur-md py-4 border-b border-gold-400/20 shadow-[0_4px_30px_rgba(74,53,24,0.06)]"
            : "bg-gradient-to-b from-[#FAF6F0]/90 to-transparent py-6 border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Brand Logo - Elegant Serif */}
          <button
            onClick={() => handleLinkClick("home")}
            className="group flex flex-col items-start focus:outline-none cursor-pointer text-left"
          >
            {cms?.branding?.logoUrl ? (
              <img
                src={cms.branding.logoUrl}
                alt={cms?.branding?.brandName || "ONA LAGOS"}
                referrerPolicy="no-referrer"
                className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02] duration-300"
              />
            ) : (
              <span className="font-serif text-2xl md:text-3xl font-light tracking-[0.15em] text-[#4a3518] group-hover:text-gold-300 transition-colors">
                {cms?.branding?.brandName?.split(" ")[0] || "ONA"}<span className="text-gold-400 font-sans text-xs align-super ml-1 tracking-normal">{cms?.branding?.brandName?.split(" ").slice(1).join(" ") || "LAGOS"}</span>
              </span>
            )}
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`relative font-sans text-[10px] xl:text-xs uppercase tracking-[0.2em] font-light py-2 cursor-pointer focus:outline-none transition-colors duration-300 ${
                  currentTab === link.id
                    ? "text-gold-300 font-semibold"
                    : "text-gray-500 hover:text-[#4a3518]"
                }`}
              >
                {link.label}
                {currentTab === link.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-400 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Desktop Call/Reserve & Authentication Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <a
              href="tel:+2348000ONALAGOS"
              className="text-gray-500 hover:text-gold-300 transition-colors flex items-center gap-1.5 focus:outline-none text-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="font-sans text-[10px] tracking-wider font-light">+234 (0) 90 ONA LAGOS</span>
            </a>

            {/* Dynamic Auth display row */}
            {isGuest ? (
              <div className="flex items-center gap-3 border-l border-gold-400/25 pl-4 py-1">
                <button
                  onClick={() => handleLinkClick("login")}
                  className="text-gray-500 hover:text-[#4a3518] font-sans text-[10px] uppercase tracking-widest font-light transition-colors py-1 pointer-events-auto cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleLinkClick("signup")}
                  className="bg-[#4a3518] hover:bg-gold-500/10 border border-[#4a3518] text-white hover:text-[#4a3518] font-sans text-[9px] uppercase tracking-wider py-1.5 px-3 transition-all duration-300 cursor-pointer"
                >
                  Join Society
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 border-l border-gold-400/25 pl-4 py-1">
                {/* Admin Quick Switch Trigger */}
                {["Super Admin", "Admin", "Manager"].includes(userRole || "") && (
                  <button
                    onClick={() => handleLinkClick("admin")}
                    className="flex items-center gap-1 bg-gold-500/10 border border-gold-400/30 text-gold-300 hover:bg-gold-500 hover:text-black font-sans text-[9px] uppercase tracking-widest py-1.5 px-3 transition-colors duration-300 font-bold cursor-pointer"
                    title="Access secure administration core"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Admin Panel</span>
                  </button>
                )}

                {/* Profile Circle with initials and role badge */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#4a3518] text-white rounded-full flex items-center justify-center font-serif text-[11px] border border-gold-400/30 font-bold shadow-md select-none" title={`${currentUser.displayName || currentUser.email} (${userRole})`}>
                    {getInitials()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-gray-700 font-serif leading-tight max-w-[80px] truncate">
                      {currentUser.displayName || "Patron"}
                    </span>
                    <span className="text-[8px] text-[#A89C8F] uppercase tracking-wider leading-none font-bold">
                      {userRole}
                    </span>
                  </div>
                  
                  {/* Exit */}
                  <button
                    onClick={onSignOut}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                    title="De-authenticate session"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={onOpenReservation}
              className="cursor-pointer bg-transparent hover:bg-gold-500/10 border border-gold-400 text-gold-300 hover:text-[#4a3518] font-sans text-xs uppercase tracking-[0.18em] py-2.5 px-5 transition-all duration-300"
            >
              Reserve
            </button>
          </div>

          {/* Mobile Right Corner UI */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Minimal Mobile Dashboard indicator */}
            {!isGuest && ["Super Admin", "Admin", "Manager"].includes(userRole || "") && (
              <button
                onClick={() => handleLinkClick("admin")}
                className="bg-gold-500 text-black p-1.5 rounded-sm"
                title="Admin Control Core"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* If fully custom user list available */}
            {!isGuest && (
              <div className="w-6 h-6 bg-[#4a3518] text-white rounded-full flex items-center justify-center font-serif text-[10px] border border-gold-400/20 font-bold" title={`${currentUser.displayName} (${userRole})`}>
                {getInitials()}
              </div>
            )}

            <button
              onClick={onOpenReservation}
              className="cursor-pointer bg-gold-400 hover:bg-gold-500 text-white font-sans text-[10px] uppercase font-semibold tracking-wider py-2 px-3"
            >
              Reserve
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-[#4a3518] focus:outline-none py-1 px-1.5 border border-gold-400/20 bg-gold-100/10 cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <div
          className={`fixed inset-y-0 right-0 w-72 bg-[#FCFAF7] border-l border-gold-400/20 z-50 transform transition-transform duration-500 ease-in-out lg:hidden h-screen flex flex-col justify-between ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gold-400/10 pb-4">
              {cms?.branding?.mobileLogoUrl || cms?.branding?.logoUrl ? (
                <img
                  src={cms.branding.mobileLogoUrl || cms.branding.logoUrl}
                  alt={cms?.branding?.brandName || "ONA LAGOS"}
                  referrerPolicy="no-referrer"
                  className="h-9 w-auto object-contain"
                />
              ) : (
                <span className="font-serif text-xl font-light tracking-widest text-[#4a3518]">
                  {cms?.branding?.brandName?.split(" ")[0] || "ONA"} <span className="text-gold-400 text-xs font-sans">{cms?.branding?.brandName?.split(" ").slice(1).join(" ") || "LAGOS"}</span>
                </span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gold-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`text-left font-sans text-xs uppercase tracking-[0.22em] font-light py-2 border-b border-gold-400/10 ${
                    currentTab === link.id ? "text-gold-500 font-semibold pl-2 border-gold-400/30" : "text-gray-500 hover:text-gold-600"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Drawer Footer controls */}
          <div className="p-6 border-t border-gold-400/10 bg-[#F3EDE2] space-y-3">
            {isGuest ? (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => handleLinkClick("login")}
                  className="bg-[#4a3518] text-white text-[10px] font-sans font-medium uppercase tracking-widest text-center py-2 px-1 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleLinkClick("signup")}
                  className="border border-[#4a3518] text-[#4a3518] text-[10px] font-sans font-medium uppercase tracking-widest text-center py-2 px-1 cursor-pointer"
                >
                  Join Society
                </button>
              </div>
            ) : (
              <div className="bg-[#FAF6F0] p-3 border border-gold-400/10 rounded-sm mb-2 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#4a3518] text-white rounded-full flex items-center justify-center font-serif text-[9px] font-bold">
                    {getInitials()}
                  </div>
                  <div>
                    <h5 className="font-serif text-[11px] font-medium leading-tight max-w-[150px] truncate text-[#4a3518]">{currentUser.displayName || currentUser.email}</h5>
                    <p className="font-sans text-[8px] uppercase font-bold text-[#A89C8F] tracking-widest mt-0.5">{userRole}</p>
                  </div>
                </div>
                
                <div className="flex gap-2.5 pt-1.5 border-t border-gold-400/10">
                  {["Super Admin", "Admin", "Manager"].includes(userRole || "") && (
                    <button
                      onClick={() => handleLinkClick("admin")}
                      className="text-gold-400 text-[8px] uppercase tracking-wider font-bold hover:text-gold-500"
                    >
                      Admin Panel
                    </button>
                  )}
                  <button
                    onClick={onSignOut}
                    className="text-red-500 text-[8px] uppercase tracking-wider font-bold ml-auto"
                  >
                    Logout session
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenReservation();
              }}
              className="w-full text-center bg-gold-400 hover:bg-gold-500 text-white font-sans text-xs uppercase font-medium tracking-[0.15em] py-3 cursor-pointer"
            >
              Book Table
            </button>
            <a
              href="tel:+2348000ONALAGOS"
              className="text-gray-500 text-center hover:text-gold-600 block text-xs font-light"
            >
              +234 (0) 90 ONA LAGOS
            </a>
          </div>
        </div>
      </header>

      {/* Floating Action Button for Mobile Reservations & Contact */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden flex flex-col gap-3">
        {/* Floating Reserve Button */}
        <button
          onClick={onOpenReservation}
          className="cursor-pointer bg-gold-400 text-white p-3.5 rounded-full shadow-[0_4px_20px_rgba(181,137,75,0.3)] flex items-center justify-center border border-gold-400/20 active:scale-95 transition-transform"
          aria-label="Direct Reservation"
        >
          <CalendarRange className="w-5 h-5" />
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-[#4a3518]/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
