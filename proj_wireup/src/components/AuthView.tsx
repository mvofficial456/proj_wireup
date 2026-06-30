import React, { useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, signInAnonymously, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Zap, Sparkles, ShieldAlert, KeyRound, Mail, User, CheckCircle2 } from "lucide-react";

interface AuthProps {
  onSuccess: (user: any) => void;
}

export default function AuthView({ onSuccess }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onSuccess(userCredential.user);
    } catch (err: any) {
      if (err.code === "auth/admin-restricted-operation" || err.code === "auth/operation-not-allowed") {
        console.warn("Authentication provider is not enabled. Falling back to guest sandbox for preview.");
        onSuccess({ uid: "guest_sandbox", email: "guest@wireup.ai", isAnonymous: true });
        return;
      }
      console.error(err);
      let errMsg = "Authentication failed. Please verify credentials.";
      if (err.code === "auth/invalid-credential") {
        errMsg = "Invalid email or password.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      onSuccess(userCredential.user);
    } catch (err: any) {
      if (err.code === "auth/admin-restricted-operation" || err.code === "auth/operation-not-allowed" || err.code === "auth/unauthorized-domain") {
        console.warn("Google Authentication is not enabled. Falling back to guest sandbox for preview.");
        onSuccess({ uid: "guest_sandbox", email: "guest@wireup.ai", isAnonymous: true });
        return;
      }
      if (err.code === "auth/popup-closed-by-user") {
        console.log("Sign-in popup was closed by the user.");
        return;
      }
      console.error(err);
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInAnonymously(auth);
      onSuccess(userCredential.user);
    } catch (err: any) {
      if (err.code === "auth/admin-restricted-operation" || err.code === "auth/operation-not-allowed") {
         console.warn("Guest Access is not enabled in Firebase. Using fallback sandbox user.");
      } else {
         console.error(err);
      }
      setError("Failed to initialize guest sandbox. Using safe Client Mode.");
      // Fallback guest user for preview robustness
      onSuccess({ uid: "guest_sandbox", email: "guest@wireup.ai", isAnonymous: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto bg-slate-950 px-4 md:px-8 py-8 md:py-12 transform-gpu" style={{ WebkitOverflowScrolling: "touch" }}>
      {/* Immersive Dark Cosmic Grid and Glow Circles */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto min-h-[calc(100vh-6rem)] relative z-10 flex flex-col justify-center">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-24 items-center">
          {/* Brand Header */}
        <div className="text-center md:text-left mb-8 md:mb-0">
          <div className="flex flex-col items-center md:items-start mb-6">
            <img src="/logo.png" alt="WireUp Logo" className="w-24 h-24 sm:w-32 sm:h-32 mb-6 rounded-2xl shadow-xl shadow-indigo-500/20" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
              WireUp
            </h1>
          </div>
          <p className="text-slate-300 text-base md:text-lg max-w-sm mx-auto md:mx-0 leading-relaxed">
            Proactive planning, risk scoring, and accountability motivation. Beat your deadlines, don't just snooze reminders.
          </p>

          <div className="hidden md:flex flex-col gap-4 mt-12">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              </div>
              <span>No credit card required for Sandbox</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <span>AI-Driven task management</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                <Zap className="w-5 h-5 text-indigo-400" />
              </div>
              <span>Cloud sync across devices</span>
            </div>
          </div>
        </div>

        {/* glassmorphism Card */}
        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/5 relative shadow-2xl bg-slate-900/50 backdrop-blur-xl">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-slate-400">Sign in to continue to your workspace</p>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6 text-center">
            <span className="relative z-10 px-3 bg-slate-950 text-slate-500 text-xs font-semibold uppercase tracking-wider">Or</span>
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 -z-0" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/5 rounded-xl text-sm text-gray-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Secure Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/5 rounded-xl text-sm text-gray-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Enter WireUp Workspace"}
            </button>
          </form>

          {/* Guest Access Sandbox option */}
          <div className="relative my-6 text-center">
            <span className="relative z-10 px-3 bg-slate-950 text-slate-500 text-xs font-semibold uppercase tracking-wider">Or</span>
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 -z-0" />
          </div>

          <button
            onClick={handleGuestAccess}
            disabled={loading}
            className="w-full py-3 bg-slate-900/60 hover:bg-slate-900 border border-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors cursor-pointer hover:text-white"
          >
            Enter Sandbox as Guest
          </button>
        </div>

        {/* Feature Checkpoints Footer */}
        <div className="mt-8 flex justify-center gap-6 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> No Card Required
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> AI-Driven
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Cloud Sync
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}
