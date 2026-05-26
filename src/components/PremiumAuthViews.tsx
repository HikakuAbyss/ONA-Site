import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Sparkles,
  Chrome,
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  ArrowLeft,
  CalendarDays,
  Utensils,
  Award,
  Globe
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

interface AuthProps {
  isSignUpInitial?: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any, role: string) => void;
  cms?: any;
}

export default function PremiumAuthViews({ isSignUpInitial = false, onClose, onAuthSuccess, cms }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(isSignUpInitial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [forgotMode, setForgotMode] = useState(false);

  // Elite quotes for cinematic luxury vibe
  const luxuryQuotes = [
    {
      txt: "A symphony of ancient smoke, rich soil, and Atlantic tides. Traditional gastronomy curated for contemporary royalty.",
      author: "Ade Adeyemi — founding Chef De Cuisine, Ona"
    },
    {
      txt: "The ultimate meeting of Lagosian high society, traditional visual tapestries, and experimental fine dining.",
      author: "Vogue Dining Review"
    },
    {
      txt: "Every plate tells a historic story. Every glass represents cultural celebration. Welcome to La Maison Ona.",
      author: "The Sommelier Ledger"
    }
  ];

  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);

  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setActiveQuoteIdx((prev) => (prev + 1) % luxuryQuotes.length);
    }, 6000);
    return () => clearInterval(quoteTimer);
  }, []);

  useEffect(() => {
    // Populate remembered email
    const savedEmail = localStorage.getItem("ona_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const bootstrappedEmails = ["officialdananj@gmail.com", "officialdiodan@gmail.com"];

  const handleAuthError = (err: any) => {
    console.error("Auth error details:", err);
    if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
      setError("Invalid credential index. Please check your credentials.");
    } else if (err.code === "auth/email-already-in-use") {
      setError("This email coordinate is already logged in our registry.");
    } else if (err.code === "auth/weak-password") {
      setError("Password strength insufficient. Minimum 6 luxury characters required.");
    } else if (err.code === "auth/invalid-email") {
      setError("Syntactical error in email coordinates.");
    } else {
      setError(err.message || "An exception has occurred in the secure gateway.");
    }
  };

  const syncUserWorkspace = async (fbUser: any) => {
    if (!fbUser) return "User";
    
    const userRef = doc(db, "users", fbUser.uid);
    let assignedRole = "User";

    // Auto-promote bootstrapped email as Super Admin
    if (fbUser.email && bootstrappedEmails.includes(fbUser.email.trim().toLowerCase())) {
      assignedRole = "Super Admin";
    }

    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        if (existingData.status === "Suspended") {
          throw new Error("This secure coordinate has been administrative-suspended by command center.");
        }
        return existingData.role || "User";
      } else {
        const profileObj = {
          id: fbUser.uid,
          name: fullName || fbUser.displayName || fbUser.email?.split("@")[0] || "Ona Patron",
          email: fbUser.email,
          role: assignedRole,
          status: "Active",
          addedAt: new Date().toISOString()
        };
        await setDoc(userRef, profileObj);
        return assignedRole;
      }
    } catch (e: any) {
      console.warn("Firestore sync bypassed, using token rule configuration:", e);
      return assignedRole;
    }
  };

  const handleFormAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const checkEmail = email.trim().toLowerCase();

    // Reset password flow
    if (forgotMode) {
      if (!email.trim()) {
        setError("Please define valid email coordinate coordinates first.");
        setLoading(false);
        return;
      }

      if (checkEmail === "admin@gmail.com") {
        setSuccessMsg("Demo credentials bypass. No reset link necessary.");
        setLoading(false);
        return;
      }

      try {
        await sendPasswordResetEmail(auth, checkEmail);
        setSuccessMsg("Credential recovery dispatch sent to your inbox. Secure new keys there.");
        setTimeout(() => {
          setForgotMode(false);
        }, 4000);
      } catch (err: any) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (rememberMe) {
      localStorage.setItem("ona_remembered_email", checkEmail);
    } else {
      localStorage.removeItem("ona_remembered_email");
    }

    // INTERCEPT: Demo Admin Protocol
    if (checkEmail === "admin@gmail.com") {
      if (password === "admin1234") {
        const mockUser = {
          uid: "demo_admin",
          email: "admin@gmail.com",
          displayName: "Demo Admin (Super)",
          isMock: true
        };
        localStorage.setItem("ona_mock_user", JSON.stringify(mockUser));
        localStorage.setItem("ona_mock_role", "Super Admin");
        
        setSuccessMsg("System verify. Welcome to command deck, Administrator!");
        setTimeout(() => {
          onAuthSuccess(mockUser, "Super Admin");
        }, 1200);
        return;
      } else {
        setError("Bypass denied. Password check fail.");
        setLoading(false);
        return;
      }
    }

    // Mock Offline Session Storage Sandbox Fallback
    const savedMockUsers = localStorage.getItem("ona_mock_users_db");
    const usersList = savedMockUsers ? JSON.parse(savedMockUsers) : [];

    if (isSignUp) {
      if (!fullName.trim()) {
        setError("Please input name coordinates for secure membership tracking.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Credential validation mismatch. Password coordinates do not align.");
        setLoading(false);
        return;
      }

      const existing = usersList.find((u: any) => u.email === checkEmail);
      if (existing) {
        setError("This account coordinate is already locked.");
        setLoading(false);
        return;
      }

      // Sync user profile object in Client persistence Sandbox
      const newUserObj = {
        fullName,
        email: checkEmail,
        password,
        role: "User",
        addedAt: new Date().toISOString()
      };
      usersList.push(newUserObj);
      localStorage.setItem("ona_mock_users_db", JSON.stringify(usersList));

      const mockUser = {
        uid: "mock_" + fullName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase(),
        email: checkEmail,
        displayName: fullName,
        isMock: true
      };
      localStorage.setItem("ona_mock_user", JSON.stringify(mockUser));
      localStorage.setItem("ona_mock_role", "User");

      setSuccessMsg(`Welcome, ${fullName}! Session authenticated successfully.`);
      setTimeout(() => {
        onAuthSuccess(mockUser, "User");
      }, 1200);
    } else {
      // Login Check matches mock Sandbox
      const matched = usersList.find((u: any) => u.email === checkEmail && u.password === password);
      if (matched) {
        const mockUser = {
          uid: "mock_" + matched.fullName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase(),
          email: checkEmail,
          displayName: matched.fullName,
          isMock: true
        };
        localStorage.setItem("ona_mock_user", JSON.stringify(mockUser));
        localStorage.setItem("ona_mock_role", matched.role || "User");

        setSuccessMsg(`Access granted. Welcome, ${matched.fullName}.`);
        setTimeout(() => {
          onAuthSuccess(mockUser, matched.role || "User");
        }, 1200);
        return;
      }

      // Real Firebase Security Portal Auth attempt
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = userCredential.user;
        const role = await syncUserWorkspace(fbUser);
        
        setSuccessMsg("Verified by Firebase Secure Sockets. Welcome back to Ona.");
        setTimeout(() => {
          onAuthSuccess(fbUser, role);
        }, 1200);
      } catch (e: any) {
        handleAuthError(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;
      const role = await syncUserWorkspace(fbUser);

      setSuccessMsg("Security clearance accepted via Google Authentication.");
      setTimeout(() => {
        onAuthSuccess(fbUser, role);
      }, 1200);
    } catch (e: any) {
      handleAuthError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    // Guest Setup - explicitly save coordinate as Guest bypass
    localStorage.removeItem("ona_mock_user");
    localStorage.setItem("ona_mock_role", "Guest");
    
    setSuccessMsg("Welcome! Continuing navigation under Ona Guest Protocol status.");
    setTimeout(() => {
      onAuthSuccess({ uid: "guest_patron", isGuest: true, displayName: "Ona Guest Patron" }, "Guest");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#FBF9F4] flex flex-col lg:flex-row relative overflow-hidden font-sans">
      
      {/* Absolute Header link triggers */}
      <div className="absolute top-6 left-6 z-30">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gold-300/80 hover:text-gold-200 text-xs uppercase tracking-widest font-sans font-light bg-black/40 hover:bg-black/60 border border-gold-400/20 px-4 py-2 hover:border-gold-400 transition-all select-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>La Maison ONA</span>
        </button>
      </div>

      {/* LEFT SIDE: Luxurious Splendor / Cinematic high-society graphics */}
      <div className="lg:w-1/2 w-full relative min-h-[35vh] lg:min-h-screen flex flex-col justify-between p-8 lg:p-16 text-left select-none overflow-hidden bg-cover bg-center">
        {/* Cinematic rich overlays */}
        <div className="absolute inset-0 bg-neutral-950/70 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
        <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&auto=format&fit=crop&q=80')]" />

        {/* Brand visual insignia top */}
        <div className="relative z-20 pt-16 lg:pt-0">
          <div className="space-y-1">
            <h1 className="font-serif text-3xl lg:text-4xl tracking-[0.25em] text-[#C5A070] font-light">ONA</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-light">Victoria Island, Lagos</p>
          </div>
        </div>

        {/* Dynamic quote transitions in luxury frame */}
        <div className="relative z-20 max-w-lg mt-auto pb-6 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeQuoteIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="w-12 h-[1px] bg-[#C5A070]/50" />
              <p className="font-serif italic text-base lg:text-lg text-gray-200 leading-relaxed font-light font-serif">
                "{luxuryQuotes[activeQuoteIdx].txt}"
              </p>
              <p className="text-[9px] uppercase tracking-widest text-[#C5A070] font-light font-sans">
                {luxuryQuotes[activeQuoteIdx].author}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Indicators container */}
          <div className="flex gap-2.5 mt-6">
            {luxuryQuotes.map((_, idx) => (
              <button
                key={`indicator-${idx}`}
                onClick={() => setActiveQuoteIdx(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${
                  activeQuoteIdx === idx ? "bg-[#C5A070]" : "bg-gray-700 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Elegant Obsidian Matte credential form */}
      <div className="lg:w-1/2 w-full flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-[#050505] relative z-20">
        
        {/* Subtle decorative gold light circle */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#C5A070]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-10 text-left">
          
          {/* Section banner */}
          <div className="space-y-2">
            <span className="font-serif text-[10px] uppercase font-bold tracking-[0.3em] text-[#C5A070] block">
              {forgotMode ? "Credential Restore" : isSignUp ? "Member Registration" : "Patron Sign In"}
            </span>
            <h2 className="font-serif text-2xl lg:text-3xl font-light tracking-wide text-white">
              {forgotMode
                ? "Key Restoration Command"
                : isSignUp
                ? "Create Patron Coordinates"
                : "Enter the Ona Society Portal"}
            </h2>
            <p className="text-xs text-slate-400 font-light leading-relaxed font-sans">
              {forgotMode
                ? "Provide your registered email coordinate address to retrieve access keys."
                : isSignUp
                ? "Enter your credentials below to enjoy prioritized reservations and custom menu curation."
                : "Explore Ona Lagos as a guest or sign in for a personalized experience."}
            </p>
          </div>

          {/* Validation Feedback Panels */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/25 text-rose-300 p-3.5 text-xs flex items-start gap-2.5 rounded-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-sans font-light leading-relaxed">{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 p-3.5 text-xs flex items-center gap-2.5 rounded-xs"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-gold-400" />
              <span className="font-serif italic font-light leading-relaxed">{successMsg}</span>
            </motion.div>
          )}

          {/* Quick Sandbox Autofill block (ONLY for admin access testing) */}
          {!forgotMode && !isSignUp && (
            <div className="p-4 bg-gold-400/5 border border-[#C5A070]/20 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[#C5A070] text-[10px] font-bold uppercase tracking-widest font-sans">
                  <Sparkles className="w-3 h-3 text-[#C5A070] animate-pulse" /> Live Admin Access Coordinates
                </div>
                <div className="text-[10px] text-gray-400 font-light font-sans">
                  Bypass with Super-Admin credentials:
                </div>
                <div className="font-mono text-[9px] text-[#C5A070]/90">
                  admin@gmail.com / admin1234
                </div>
              </div>
              <button
                onClick={() => {
                  setEmail("admin@gmail.com");
                  setPassword("admin1234");
                }}
                className="shrink-0 font-sans text-[9px] uppercase tracking-wider bg-[#1c1a16] border border-[#C5A070]/40 hover:bg-[#2e2a22] text-gold-300 py-1.5 px-3 flex items-center gap-1 cursor-pointer transition-all duration-300"
              >
                Autofill Credentials
              </button>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleFormAction} className="space-y-4">
            
            {/* 1. Name coordinate (Sign Up Only) */}
            {isSignUp && !forgotMode && (
              <div className="space-y-1.5">
                <label className="block font-sans text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400">
                  Full Name / Title
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Chief Adeleke Williams"
                    className="w-full bg-[#111] border border-white/5 py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-[#C5A070]/60 text-white placeholder:text-gray-700 transition-[#0.2s]"
                  />
                </div>
              </div>
            )}

            {/* 2. Email coordinate */}
            <div className="space-y-1.5">
              <label className="block font-sans text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400">
                Email Coordinates
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@gmail.com"
                  className="w-full bg-[#111] border border-white/5 py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-[#C5A070]/60 text-white placeholder:text-gray-700 transition-[#0.2s]"
                />
              </div>
            </div>

            {/* 3. Password coordinate (Hidden on password restoration) */}
            {!forgotMode && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block font-sans text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400">
                    Secret Coordinates Key
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-[10px] text-gray-500 hover:text-gold-300 cursor-pointer transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#111] border border-white/5 py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-[#C5A070]/60 text-white placeholder:text-gray-700 transition-[#0.2s]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#C5A070] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* 4. Confirm Password coordinate (Sign Up Only) */}
            {isSignUp && !forgotMode && (
              <div className="space-y-1.5">
                <label className="block font-sans text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400">
                  Align coordinates (Confirm string)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#111] border border-white/5 py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-[#C5A070]/60 text-white placeholder:text-gray-700 transition-[#0.2s]"
                  />
                </div>
              </div>
            )}

            {/* 5. Utility checkbox row */}
            {!forgotMode && !isSignUp && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#C5A070] uppercase"
                  />
                  <span className="font-sans text-[10px] text-gray-400 uppercase tracking-wider">
                    Remember my coords
                  </span>
                </label>
              </div>
            )}

            {/* Main Activation Command button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 cursor-pointer bg-gold-500 hover:bg-[#8e734e] text-black py-3.5 font-sans text-xs uppercase tracking-widest font-semibold transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-[0_4px_30px_rgba(197,160,112,0.1)] rounded-none"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LockKeyhole className="w-4 h-4" />
                  <span>
                    {forgotMode
                      ? "Dispatch Restoration coordinates"
                      : isSignUp
                      ? "Establish Coordinate Index"
                      : "Unseal Portal Gateway"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Guest protocol bypass coordinate container */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-center py-1">
              <span className="w-8 h-[1px] bg-white/10" />
              <span className="text-[9px] uppercase tracking-[0.25em] text-gray-600 font-sans">
                OR GUEST PROTOCOL
              </span>
              <span className="w-8 h-[1px] bg-white/10" />
            </div>

            <button
              onClick={handleGuestContinue}
              className="w-full bg-[#111] hover:bg-[#1f1e1c] border border-gold-400/20 text-[#C5A070] py-3 text-xs uppercase tracking-widest transition-all cursor-pointer text-center font-sans font-light flex items-center justify-center gap-2 hover:border-[#C5A070]"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Continue as Guest Browser</span>
            </button>
          </div>

          {/* Social gateway dividers */}
          {!forgotMode && (
            <>
              <div className="relative my-6 text-center">
                <span className="absolute inset-x-0 top-1/2 h-[1px] bg-white/5" />
                <span className="relative bg-[#050505] px-3 font-sans text-[9px] uppercase tracking-widest text-gray-600">
                  Secure Federated API Access
                </span>
              </div>

              {/* Federated Login row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-[#12110e] hover:bg-white/5 border border-white/5 py-2.5 text-[11px] font-sans tracking-wide text-gray-300 cursor-pointer transition-colors"
                >
                  <Chrome className="w-4 h-4 text-[#C5A070]" />
                  <span>Google credentials</span>
                </button>

                <button
                  onClick={() => alert("Apple Authentication coordinates synced soon in Vercel environment.")}
                  className="flex items-center justify-center gap-2 bg-[#12110e] hover:bg-white/5 border border-white/5 py-2.5 text-[11px] font-sans tracking-wide text-gray-300 cursor-pointer transition-colors"
                >
                  <span className="font-serif font-black text-[#C5A070] text-xs"></span>
                  <span>Apple signature</span>
                </button>
              </div>
            </>
          )}

          {/* Mode Switcher footer */}
          <div className="pt-6 border-t border-white/5 text-center flex flex-col items-center justify-center gap-2">
            {forgotMode ? (
              <button
                onClick={() => setForgotMode(false)}
                className="font-sans text-[11px] text-gray-500 hover:text-gold-300 cursor-pointer flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to access gate
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="font-sans text-[10px] uppercase tracking-[0.18em] text-[#C5A070] hover:text-white transition-colors cursor-pointer select-none"
              >
                {isSignUp
                  ? "Configured with access keys already? ACCESS PORTAL"
                  : "Request coordinates? REGISTER SECURE SOCIETY INDEX"}
              </button>
            )}
          </div>

          {/* Legal microtext */}
          <p className="text-[9px] text-gray-600 text-center font-sans tracking-tight font-light leading-normal">
            By connecting credentials you acknowledge the secure society ledger agreement. Standard telemetry metrics apply. Created for the luxury gastronomy estate.
          </p>

        </div>
      </div>

    </div>
  );
}
