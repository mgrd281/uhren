"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Watch, Shield } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(false);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-4 lg:ps-0">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gold-500/[0.07] blur-[120px] animate-pulse" />
        <div className="absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-gold-500/[0.05] blur-[150px] animate-pulse [animation-delay:2s]" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-white/[0.02] blur-[100px]" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[380px]">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-5">
            <div className="absolute -inset-3 rounded-3xl bg-gold-500/20 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-xl">
              <Watch size={30} className="text-gold-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Luxusuhren
          </h1>
          <p className="mt-1.5 text-[13px] font-medium tracking-wide text-zinc-500">
            Verwaltungssystem
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white px-5 py-3.5 text-[14px] font-semibold text-zinc-800 shadow-lg shadow-black/10 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {loading ? "Wird angemeldet…" : "Mit Google anmelden"}
          </button>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-center text-[13px] font-medium text-red-400">
                Zugriff verweigert — nur autorisierte Benutzer.
              </p>
            </div>
          )}

          {/* Trust indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-zinc-600">
            <Shield size={13} />
            <span className="text-[11px] font-medium tracking-wide">
              Sichere Google-Authentifizierung
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] tracking-wide text-zinc-700">
          Nur für autorisierte Benutzer
        </p>
      </div>
    </div>
  );
}
