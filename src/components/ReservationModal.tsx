import React, { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Check,
  Calendar,
  Users,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Clock,
  User,
  UtensilsCrossed,
  Layers,
  Heart,
  MessageSquare,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: string;
}

export default function ReservationModal({ isOpen, onClose, initialType = "Dinner" }: ReservationModalProps) {
  // Operational Settings (specifically WhatsApp number) state from admin portal
  const [whatsappNumber, setWhatsappNumber] = useState("+234 90 6000 ONA");

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [prefDate, setPrefDate] = useState("");
  const [prefTime, setPrefTime] = useState("");
  const [guestsCount, setGuestsCount] = useState("2 Guests");
  const [diningPreference, setDiningPreference] = useState(
    initialType === "Sunday Roast & Brunch" 
      ? "Sunday Roast" 
      : initialType || "Dinner"
  );
  const [occasion, setOccasion] = useState("Date Night");
  const [dietary, setDietary] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync state variables when initialType prop updates
  useEffect(() => {
    if (initialType) {
      if (initialType === "Sunday Roast & Brunch") {
        setDiningPreference("Sunday Roast");
      } else {
        const allowedTypes = ["Lunch", "Dinner", "Sunday Roast", "Private Event"];
        if (allowedTypes.includes(initialType)) {
          setDiningPreference(initialType);
        } else {
          setDiningPreference("Dinner");
        }
      }
    }
  }, [initialType]);

  // Subscribe to real-time configuration settings (for WhatsApp Dispatch changes)
  useEffect(() => {
    // 1. Check local storage fallback
    const savedLocalSettings = localStorage.getItem("ona_mock_operational_settings");
    if (savedLocalSettings) {
      try {
        const parsed = JSON.parse(savedLocalSettings);
        if (parsed.whatsappNumber) setWhatsappNumber(parsed.whatsappNumber);
      } catch (e) {
        console.warn("Could not read local operational settings cache:", e);
      }
    }

    // 2. Listen block to Firebase database
    try {
      const docRef = doc(db, "admin_settings", "operational");
      const unsub = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          if (cloudData.whatsappNumber) {
            setWhatsappNumber(cloudData.whatsappNumber);
          }
        }
      }, (err) => {
        console.warn("Bypassed dynamic Firebase operational settings subscribe:", err.message);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Firebase not configured or initialized:", e);
    }
  }, []);

  const handleNextStep = () => {
    setErrorMsg("");
    // Ensure dining details are specified
    if (!prefDate) {
      setErrorMsg("Please determine your dining coordinate date.");
      return;
    }
    if (!prefTime) {
      setErrorMsg("Please determine your desired check-in seating hour.");
      return;
    }
    setStep(2);
  };

  const handleSubmitReservation = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validate inputs
    if (!fullName.trim()) {
      setErrorMsg("Please provide your Full Name coordinates.");
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg("A contact Phone Number is required to dispatch confirmation tokens.");
      return;
    }
    if (!emailAddress.trim()) {
      setErrorMsg("Please provide your Email Address coordinates.");
      return;
    }

    setLoading(true);

    // Build the exact formatted message requested
    const formattedSpecialRequest = (specialRequest.trim() || dietary.trim()) 
      ? `${specialRequest.trim()}${dietary.trim() ? " (Allergies: " + dietary.trim() + ")" : ""}` 
      : "None";

    const whatsappMessage = `Hello Ona Lagos, I would like to make a reservation.

Name: ${fullName.trim()}
Phone: ${phoneNumber.trim()}
Email: ${emailAddress.trim()}
Date: ${prefDate}
Time: ${prefTime}
Number of Guests: ${guestsCount}
Dining Preference: ${diningPreference}
Occasion: ${occasion}
Special Request / Dietary Requirement: ${formattedSpecialRequest}

Thank you.`;

    // Process WhatsApp link redirect cleanly
    // Clean up the WhatsApp number string (removing spaces, plus, dashes, converting ONA characters to digits if needed, etc.)
    let digits = whatsappNumber.replace(/[^a-zA-Z0-9]/g, "");
    
    // Replace letters in phone word ONA if still custom
    digits = digits.replace(/ONA/gi, "662");
    
    if (digits.startsWith("0")) {
      digits = "234" + digits.substring(1);
    } else if (!digits.startsWith("234") && digits.length === 10) {
      digits = "234" + digits;
    }

    // fallback
    if (!digits) digits = "234906000662";

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const destinationLink = `https://wa.me/${digits}?text=${encodedMessage}`;

    // Show luxurious submission success state before opening WhatsApp
    setTimeout(() => {
      window.open(destinationLink, "_blank", "noopener,noreferrer");
      setLoading(false);
      resetReservationForm();
    }, 1500);
  };

  const resetReservationForm = () => {
    setStep(1);
    setFullName("");
    setPhoneNumber("");
    setEmailAddress("");
    setPrefDate("");
    setPrefTime("");
    setGuestsCount("2 Guests");
    setDiningPreference("Dinner");
    setOccasion("Date Night");
    setDietary("");
    setSpecialRequest("");
    setErrorMsg("");
    onClose();
  };

  // Populate times list
  const timeOptions = [
    // Lunch block
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM",
    // Dinner block
    "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM"
  ];

  const guestOptions = [
    "1 Guest", "2 Guests", "3 Guests", "4 Guests", "5 Guests", "6 Guests", 
    "7 Guests", "8 Guests", "9 Guests", "10 Guests", "11 Guests", "12 Guests", 
    "13+ Guests (Private Event)"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="reservation-coordinator-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
          {/* Close click on backdrop */}
          <div className="absolute inset-0" onClick={resetReservationForm} />

          <motion.div
            id="reservation-panel"
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-xl overflow-hidden rounded-none border border-gold-400/20 bg-[#070707] text-[#fbf9f4] shadow-[0_10px_50px_rgba(197,160,112,0.15)] z-10"
          >
            {/* Top decorative gradient line */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#C5A070] to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-gold-400/5 rounded-full blur-[90px] pointer-events-none" />

            {/* Header section with Close Button */}
            <div className="flex items-center justify-between border-b border-white/5 p-5 md:px-6">
              <div>
                <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#C5A070] font-bold block mb-1">
                  On-Site Booking System
                </span>
                <h3 className="font-serif text-lg tracking-wide text-white font-light">
                  Direct Table Reservation
                </h3>
              </div>
              <button
                onClick={resetReservationForm}
                className="text-gray-500 hover:text-[#C5A070] transition-colors p-1.5 bg-white/5 border border-white/5 hover:border-[#C5A070]/30 cursor-pointer"
                aria-label="Close Reservation Form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message Panel */}
            {errorMsg && (
              <div className="mx-5 md:mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2 font-sans font-light">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step Indicators */}
            <div className="flex border-b border-white/5 font-sans">
              <div className={`flex-1 py-3 text-center text-[10px] tracking-widest uppercase border-b ${step === 1 ? "border-[#C5A070] text-[#C5A070]" : "border-transparent text-gray-500"}`}>
                1. Dining Curation
              </div>
              <div className={`flex-1 py-3 text-center text-[10px] tracking-widest uppercase border-b ${step === 2 ? "border-[#C5A070] text-[#C5A070]" : "border-transparent text-gray-500"}`}>
                2. Guest Information
              </div>
            </div>

            {/* Form Scrollable Frame */}
            <div className="max-h-[70vh] overflow-y-auto p-5 md:p-6 space-y-5">
              
              {step === 1 ? (
                /* STEP 1: DINING OPTIONS */
                <div className="space-y-4">
                  
                  {/* Row: Selections */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Number of Guests */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-bold">
                        <Users className="w-3.5 h-3.5 text-[#C5A070]" /> Number of Guests
                      </label>
                      <select
                        value={guestsCount}
                        onChange={(e) => setGuestsCount(e.target.value)}
                        className="w-full bg-[#111] border border-white/5 px-3 py-2 text-xs text-[#fbf9f4] focus:outline-none focus:border-[#C5A070]/50"
                      >
                        {guestOptions.map((opt) => (
                          <option key={opt} value={opt} className="bg-black text-[#fbf9f4]">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dining Preference type */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-bold">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-[#C5A070]" /> Dining Preference
                      </label>
                      <select
                        value={diningPreference}
                        onChange={(e) => setDiningPreference(e.target.value)}
                        className="w-full bg-[#111] border border-white/5 px-3 py-2 text-xs text-[#fbf9f4] focus:outline-none focus:border-[#C5A070]/50"
                      >
                        <option value="Dinner" className="bg-black text-[#fbf9f4]">Dinner Experience</option>
                        <option value="Lunch" className="bg-black text-[#fbf9f4]">Lunch Experience</option>
                        <option value="Sunday Roast" className="bg-black text-[#fbf9f4]">Sunday Roast & Brunch</option>
                        <option value="Private Event" className="bg-black text-[#fbf9f4]">Private Custom Event</option>
                      </select>
                    </div>
                  </div>

                  {/* Row: Date and Time selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date Picker */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[#C5A070]" /> Preferred Date
                      </label>
                      <input
                        required
                        type="date"
                        value={prefDate}
                        onChange={(e) => setPrefDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full bg-[#111] border border-white/5 px-3 py-2 text-xs text-[#fbf9f4] focus:outline-none focus:border-[#C5A070]/50"
                      />
                    </div>

                    {/* Preferred Time */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5 text-[#C5A070]" /> Seating Seance Hour
                      </label>
                      <select
                        required
                        value={prefTime}
                        onChange={(e) => setPrefTime(e.target.value)}
                        className="w-full bg-[#111] border border-white/5 px-3 py-2 text-xs text-[#fbf9f4] focus:outline-none focus:border-[#C5A070]/50"
                      >
                        <option value="">Choose seating hour...</option>
                        {timeOptions.map((tm) => (
                          <option key={tm} value={tm} className="bg-black text-[#fbf9f4]">
                            {tm}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Occasions selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-bold">
                      <Heart className="w-3.5 h-3.5 text-[#C5A070]" /> Celebration Occasion
                    </label>
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full bg-[#111] border border-white/5 px-3 py-2 text-xs text-[#fbf9f4] focus:outline-none focus:border-[#C5A070]/50"
                    >
                      <option value="Date Night" className="bg-black text-[#fbf9f4]">Date Night Celebration</option>
                      <option value="Birthday" className="bg-black text-[#fbf9f4]">Birthday Celebration</option>
                      <option value="Anniversary" className="bg-black text-[#fbf9f4]">Anniversary Celebration</option>
                      <option value="Business" className="bg-black text-[#fbf9f4]">Corporate Business Meal</option>
                      <option value="Other" className="bg-black text-[#fbf9f4]">Special Dinner / Other</option>
                    </select>
                  </div>

                  {/* Dietary Requirements */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                      Dietary Requirements & Spice Allergies (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="E.g., Crustacean allergy, gluten sensitivity, fine heat adaptation..."
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                      className="w-full bg-[#111] border border-white/5 px-3 py-2 text-xs text-[#fbf9f4] focus:outline-none focus:border-[#C5A070]/50 placeholder:text-gray-700"
                    />
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                      Special Requests / Host Instructions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="E.g., Requesting a quiet candle-lit window booth, pre-selecting wine arrangements..."
                      value={specialRequest}
                      onChange={(e) => setSpecialRequest(e.target.value)}
                      className="w-full bg-[#111] border border-white/5 px-3 py-2 text-xs text-[#fbf9f4] focus:outline-none focus:border-[#C5A070]/50 placeholder:text-gray-700 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full mt-2 cursor-pointer bg-gold-500 hover:bg-[#8e734e] text-black font-sans text-xs uppercase tracking-[0.2em] py-3.5 text-center font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Contact coordinates</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                </div>
              ) : (
                /* STEP 2: GUEST CONTACT INFO */
                <form onSubmit={handleSubmitReservation} className="space-y-4">
                  
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-bold">
                      <User className="w-3.5 h-3.5 text-[#C5A070]" /> Full Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Enter your name coordinates..."
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#111] border border-white/5 px-3 py-2 text-xs text-[#fbf9f4] focus:outline-none focus:border-[#C5A070]/50 placeholder:text-gray-700"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-bold">
                      <Phone className="w-3.5 h-3.5 text-[#C5A070]" /> Contact Phone
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="+234 (0) 90 6000 ONA"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#111] border border-white/5 px-3 py-2 text-xs text-[#fbf9f4] focus:outline-none focus:border-[#C5A070]/50 placeholder:text-gray-700"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-bold">
                      <Mail className="w-3.5 h-3.5 text-[#C5A070]" /> Email Address
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="clientele@domain.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="w-full bg-[#111] border border-white/5 px-3 py-2 text-xs text-[#fbf9f4] focus:outline-none focus:border-[#C5A070]/50 placeholder:text-gray-700"
                    />
                  </div>

                  {/* Curation breakdown banner */}
                  <div className="p-3 bg-gold-400/5 border border-[#C5A070]/15 space-y-1.5">
                    <div className="text-[9px] uppercase tracking-widest text-[#C5A070] font-bold">
                      Reservation Summary Index
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-400 font-sans">
                      <div><span className="text-gray-600">Guests:</span> {guestsCount}</div>
                      <div><span className="text-gray-600">Taste:</span> {diningPreference}</div>
                      <div><span className="text-gray-600">Occasion:</span> {occasion}</div>
                      <div><span className="text-gray-600">Target Seating:</span> {prefDate} @ {prefTime}</div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 border border-white/5 hover:border-[#C5A070]/30 hover:text-[#C5A070] text-gray-400 text-xs font-sans uppercase tracking-widest py-3 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 cursor-pointer bg-[#C5A070] hover:bg-[#8e734e] text-black font-sans text-xs uppercase tracking-[0.2em] font-black py-3.5 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4.5 h-4.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Transmit via WhatsApp</span>
                          <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}

            </div>

            {/* Bottom concierge footer text */}
            <div className="p-4 border-t border-white/5 bg-[#12110e] text-center">
              <p className="text-[9px] text-gray-500 font-sans tracking-wide leading-relaxed">
                This secure session forwards your customized reservation ledger index onto <span className="text-[#C5A070]">{whatsappNumber}</span> for instant manual seat assignment confirmation. No third-party ticketing platforms are involved.
              </p>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
