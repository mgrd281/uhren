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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060607] p-6 lg:ps-0">

      {/* ── Deep ambient atmosphere ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Top warm corona */}
        <div className="absolute left-1/2 top-[-20%] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-[#b8860b]/[0.035] blur-[200px]" />
        {/* Bottom-left cool undertone */}
        <div className="absolute -bottom-[30%] -left-[20%] h-[600px] w-[600px] rounded-full bg-[#1a1a2e]/40 blur-[180px]" />
        {/* Right edge warmth */}
        <div className="absolute -right-[15%] top-[40%] h-[400px] w-[400px] rounded-full bg-[#b8860b]/[0.02] blur-[150px]" />
        {/* Center focal point — very subtle */}
        <div className="absolute left-1/2 top-[45%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.008] blur-[80px]" />
      </div>

      {/* ── Fine grain texture ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* ── Radial vignette ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 48%, transparent 0%, rgba(6,6,7,0.4) 100%)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex w-full max-w-[340px] flex-col items-center">

        {/* ── Brand mark ── */}
        <div className="relative mb-16">
          {/* Outer halo */}
          <div className="absolute -inset-10 rounded-full bg-[#b8860b]/[0.04] blur-3xl" />
          {/* Icon container */}
          <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-[18px] border border-white/[0.05] bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(255,255,255,0.02),0_12px_48px_-8px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-[#c9a84c]">
              <circle cx="12" cy="12" r="6" />
              <path d="M12 10v2l1 1" />
              <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83" />
            </svg>
          </div>
        </div>

        {/* ── Brand typography ── */}
        <div className="mb-16 flex flex-col items-center">
          <h1 className="text-[32px] font-light tracking-[0.08em] text-white">
            Mgrdegh
          </h1>
          <div className="mt-4 flex items-center gap-4">
            <span className="h-px w-10 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <p className="text-[9px] font-medium uppercase tracking-[0.35em] text-white/25">
              Verwaltungssystem
            </p>
            <span className="h-px w-10 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          </div>
        </div>

        {/* ── Authentication ── */}
        <div className="w-full">

          {/* Outer wrapper — gradient border technique */}
          <div className="relative rounded-[20px] p-px"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
            }}
          >
            {/* Top edge highlight */}
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

            {/* Inner surface */}
            <div className="relative overflow-hidden rounded-[19px] bg-[#0a0a0c]/90 px-8 pb-8 pt-7 backdrop-blur-2xl"
              style={{
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 24px 64px -16px rgba(0,0,0,0.5)",
              }}
            >
              {/* Subtle inner glow at top */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.015] to-transparent" />

              <div className="relative">

                {/* ── Google CTA ── */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="group relative flex w-full flex-col items-center gap-5 py-2 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {/* Google icon — elevated circle */}
                  <div className="relative">
                    <div className="absolute -inset-3 rounded-full bg-white/[0.02] blur-xl transition-all duration-500 group-hover:bg-white/[0.04]" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_24px_-4px_rgba(0,0,0,0.4)] transition-all duration-500 group-hover:border-white/[0.1] group-hover:bg-white/[0.06] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_-4px_rgba(0,0,0,0.5)] active:scale-95">
                      {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-[1.5px] border-white/10 border-t-white/60" />
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" className="shrink-0 transition-transform duration-500 group-hover:scale-105">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Label */}
                  <span className="text-[13px] font-normal tracking-[0.02em] text-white/40 transition-colors duration-300 group-hover:text-white/70">
                    {loading ? "Verbinde…" : "Mit Google fortfahren"}
                  </span>

                  {/* Underline accent */}
                  <span className="h-px w-8 bg-white/[0.04] transition-all duration-500 group-hover:w-16 group-hover:bg-white/[0.1]" />
                </button>

                {/* Error */}
                {error && (
                  <div className="mt-6 rounded-xl border border-red-500/10 bg-red-500/[0.04] px-4 py-2.5">
                    <p className="text-center text-[11px] font-medium tracking-[0.02em] text-red-400/80">
                      Zugriff verweigert
                    </p>
                  </div>
                )}

                {/* Separator */}
                <div className="mx-auto mt-8 h-px w-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

                {/* Security badge */}
                <div className="mt-5 flex items-center justify-center gap-2.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/15">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="text-[9px] font-medium tracking-[0.12em] text-white/15">
                    VERSCHLÜSSELT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-14 flex flex-col items-center gap-3">
          <div className="h-px w-6 bg-white/[0.04]" />
          <p className="text-[9px] font-medium tracking-[0.18em] text-white/[0.12]">
            AUTORISIERTER ZUGANG
          </p>
        </div>
      </div>
    </div>
  );
}
