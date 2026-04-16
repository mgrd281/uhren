"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] p-6 lg:ps-0">

      {/* ── Ambient lighting ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Primary warm glow — top center */}
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#c98a0e]/[0.06] blur-[160px]" />
        {/* Secondary glow — bottom right, cooler */}
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#c98a0e]/[0.03] blur-[140px]" />
        {/* Faint center vignette */}
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.015] blur-[100px]" />
      </div>

      {/* ── Noise texture overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 flex w-full max-w-[360px] flex-col items-center">

        {/* ── Logo mark ── */}
        <div className="relative mb-12">
          {/* Soft halo behind logo */}
          <div className="absolute -inset-6 rounded-full bg-[#c98a0e]/[0.08] blur-2xl" />
          <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[20px] border border-white/[0.06] bg-white/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            {/* Watch icon — refined SVG */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a94a]">
              <circle cx="12" cy="12" r="6" />
              <path d="M12 10v2l1 1" />
              <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83" />
            </svg>
          </div>
        </div>

        {/* ── Typography ── */}
        <div className="mb-14 flex flex-col items-center text-center">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-white/95">
            Luxusuhren
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-white/10" />
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">
              Verwaltungssystem
            </p>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </div>

        {/* ── Auth container ── */}
        <div className="w-full">
          {/* Premium auth card */}
          <div
            className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-[1px] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_50px_-12px_rgba(0,0,0,0.6)]"
          >
            {/* Inner highlight line at top */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

            <div className="relative rounded-[15px] bg-[#0f0f11]/80 px-7 py-8 backdrop-blur-xl">

              {/* Small label */}
              <p className="mb-6 text-center text-[11px] font-medium tracking-[0.08em] text-zinc-500">
                ANMELDEN
              </p>

              {/* Google sign-in button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3.5 text-[14px] font-medium text-zinc-200 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              >
                {/* Subtle shimmer on hover */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                <span className="relative flex items-center gap-3">
                  {loading ? (
                    <div className="h-[18px] w-[18px] animate-spin rounded-full border-[1.5px] border-zinc-600 border-t-zinc-200" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  <span className="tracking-[-0.01em]">
                    {loading ? "Verbinde…" : "Mit Google fortfahren"}
                  </span>
                </span>
              </button>

              {/* Error state */}
              {error && (
                <div className="mt-5 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-4 py-2.5">
                  <p className="text-center text-[12px] font-medium text-red-400/90">
                    Zugriff verweigert
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="mx-auto mt-7 h-px w-12 bg-white/[0.06]" />

              {/* Trust line */}
              <div className="mt-5 flex items-center justify-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-[10px] font-medium tracking-[0.06em] text-zinc-600">
                  Verschlüsselte Verbindung
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="mt-10 text-center text-[10px] font-medium tracking-[0.1em] text-zinc-700/60">
          NUR FÜR AUTORISIERTE BENUTZER
        </p>
      </div>
    </div>
  );
}
