"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/* ─── Animation phases ───
   0  pure black
   1  ambient glow blooms
   2  logo reveals (blur→sharp + scale)
   3  brand name reveals
   4  subtitle + decorative lines
   5  splash dissolves → auth fades in (staggered)
   6  splash unmounted
────────────────────────── */

/* Shared brand icon — geometric M monogram inside octagonal watch case */
function BrandIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* Octagonal watch case */}
      <path
        d="M16.5 4h15L44 16.5v15L31.5 44h-15L4 31.5v-15L16.5 4z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Inner circle — dial */}
      <circle cx="24" cy="24" r="11" stroke="currentColor" strokeWidth="0.8" />
      {/* M monogram — elegant geometric */}
      <path
        d="M17 31V19l7 8 7-8v12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crown at 12 o'clock */}
      <line x1="24" y1="4" x2="24" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060607]" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [p, setP] = useState(0);
  const searchParams = useSearchParams();
  const denied = searchParams.get("error") === "unauthorized" || searchParams.get("error") === "AccessDenied";
  const [requestSent, setRequestSent] = useState(false);
  const pendingEmail = searchParams.get("email") ?? "";

  /* ── Auto-polling: check every 5 s if access was approved ── */
  useEffect(() => {
    if (!denied || !pendingEmail) return;
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/access-requests/check?email=${encodeURIComponent(pendingEmail)}`);
        const data = await res.json();
        if (data.status === "approved" && active) {
          await signIn("google", { callbackUrl: "/dashboard" });
        }
      } catch {
        // ignore network errors, keep polling
      }
    };
    const id = setInterval(poll, 5000);
    return () => { active = false; clearInterval(id); };
  }, [denied, pendingEmail]);

  /* ── Browser fingerprint (survives VPN) ── */
  useEffect(() => {
    try {
      const parts: string[] = [];
      parts.push(navigator.language);
      parts.push(String(screen.width) + "x" + String(screen.height));
      parts.push(String(screen.colorDepth));
      parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
      parts.push(navigator.platform);
      parts.push(String(navigator.hardwareConcurrency || 0));
      parts.push(String((navigator as unknown as { deviceMemory?: number }).deviceMemory || 0));
      // Canvas fingerprint
      const canvas = document.createElement("canvas");
      canvas.width = 200; canvas.height = 50;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("fingerprint", 2, 15);
        ctx.fillStyle = "rgba(102,204,0,0.7)";
        ctx.fillText("fingerprint", 4, 17);
        parts.push(canvas.toDataURL());
      }
      // WebGL renderer
      const gl = document.createElement("canvas").getContext("webgl");
      if (gl) {
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        if (dbg) {
          parts.push(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || "");
          parts.push(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
        }
      }
      // Hash
      const raw = parts.join("|");
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
      }
      const fp = "fp_" + (hash >>> 0).toString(36);
      document.cookie = `device_fp=${fp};path=/;max-age=86400;SameSite=Lax`;
    } catch {
      // Fingerprint optional
    }
  }, []);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const prev = meta?.getAttribute("content");
    meta?.setAttribute("content", "#060607");
    return () => { if (meta && prev) meta.setAttribute("content", prev); };
  }, []);

  useEffect(() => {
    const t = [
      setTimeout(() => setP(1), 100),
      setTimeout(() => setP(2), 340),
      setTimeout(() => setP(3), 880),
      setTimeout(() => setP(4), 1260),
      setTimeout(() => setP(5), 1800),
      setTimeout(() => setP(6), 2450),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(false);
    try { await signIn("google", { callbackUrl: "/dashboard" }); }
    catch { setError(true); setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-[#050506]">

      {/* ═══════════════════════════════════════
          SPLASH
          ═══════════════════════════════════════ */}
      {p < 6 && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            opacity: p >= 5 ? 0 : 1,
            transition: "opacity 650ms cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: p >= 5 ? "none" : "auto",
          }}
        >
          {/* Primary corona */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b8860b]/[0.05] blur-[90px]"
            style={{
              opacity: p >= 1 ? 1 : 0,
              transform: `translate(-50%,-50%) scale(${p >= 1 ? 1 : 0.6})`,
              transition: "opacity 1000ms ease-out, transform 1000ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
          {/* Wide halo */}
          <div
            className="pointer-events-none absolute left-1/2 top-[47%] h-[500px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b8860b]/[0.012] blur-[160px]"
            style={{
              opacity: p >= 2 ? 1 : 0,
              transition: "opacity 1400ms ease-out",
            }}
          />

          <div className="flex flex-col items-center">

            {/* Logo — blur + scale reveal */}
            <div
              style={{
                opacity: p >= 2 ? 1 : 0,
                filter: `blur(${p >= 2 ? 0 : 12}px)`,
                transform: `scale(${p >= 2 ? 1 : 0.85})`,
                transition: "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1), filter 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div className="relative">
                <div className="absolute -inset-10 rounded-full bg-[#b8860b]/[0.07] blur-3xl" />
                <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-[20px] border border-[#b8860b]/25 bg-[#b8860b]/[0.04] shadow-[0_0_60px_-10px_rgba(184,134,11,0.15)]">
                  <BrandIcon size={34} className="text-[#c9a84c]" />
                </div>
              </div>
            </div>

            {/* Brand name — blur + lift */}
            <div
              className="mt-9"
              style={{
                opacity: p >= 3 ? 1 : 0,
                filter: `blur(${p >= 3 ? 0 : 8}px)`,
                transform: `translateY(${p >= 3 ? 0 : 8}px)`,
                transition: "opacity 600ms ease-out, filter 600ms ease-out, transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <h1 className="text-[28px] font-extralight tracking-[0.28em] text-white" style={{ fontFeatureSettings: "'ss01' 1, 'cv01' 1" }}>
                MGRDEGH
              </h1>
            </div>

            {/* Subtitle */}
            <div
              className="mt-4"
              style={{
                opacity: p >= 4 ? 1 : 0,
                filter: `blur(${p >= 4 ? 0 : 6}px)`,
                transform: `translateY(${p >= 4 ? 0 : 5}px)`,
                transition: "opacity 500ms ease-out, filter 500ms ease-out, transform 500ms ease-out",
              }}
            >
              <div className="flex items-center gap-5">
                <span className="h-px w-12 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                <p className="text-[8px] font-medium tracking-[0.4em] text-white/25">
                  VERWALTUNGSSYSTEM
                </p>
                <span className="h-px w-12 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          AUTH SCREEN
          ═══════════════════════════════════════ */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-y-auto px-6"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px), 1.5rem)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)",
          opacity: p >= 5 ? 1 : 0,
          transition: "opacity 700ms cubic-bezier(0.4, 0, 0.2, 1)",
          transitionDelay: p >= 5 ? "60ms" : "0ms",
          pointerEvents: p >= 5 ? "auto" : "none",
        }}
      >
        {/* Ambient atmosphere */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-18%] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-[#b8860b]/[0.03] blur-[200px]" />
          <div className="absolute -bottom-[25%] -left-[18%] h-[500px] w-[500px] rounded-full bg-[#0d0d1a]/50 blur-[180px]" />
          <div className="absolute -right-[12%] top-[35%] h-[350px] w-[350px] rounded-full bg-[#b8860b]/[0.018] blur-[140px]" />
          <div className="absolute left-1/2 top-[44%] h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.006] blur-[70px]" />
        </div>

        {/* Noise */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
          }}
        />

        {/* Vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 65% 55% at 50% 46%, transparent 0%, rgba(5,5,6,0.5) 100%)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex w-full max-w-[340px] flex-col items-center">

          {/* ── Brand mark ── */}
          <div
            className="relative mb-14"
            style={{
              opacity: p >= 5 ? 1 : 0,
              filter: `blur(${p >= 6 ? 0 : p >= 5 ? 4 : 12}px)`,
              transform: `translateY(${p >= 5 ? 0 : 18}px) scale(${p >= 5 ? 1 : 0.92})`,
              transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: p >= 5 ? "140ms" : "0ms",
            }}
          >
            <div className="absolute -inset-12 rounded-full bg-[#b8860b]/[0.04] blur-3xl" />
            <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[19px] border border-[#b8860b]/25 bg-[#b8860b]/[0.04] shadow-[inset_0_1px_0_rgba(184,134,11,0.08),0_0_0_1px_rgba(184,134,11,0.06),0_16px_56px_-8px_rgba(0,0,0,0.7),0_0_50px_-12px_rgba(184,134,11,0.1)] backdrop-blur-2xl">
              <BrandIcon size={30} className="text-[#c9a84c]" />
            </div>
          </div>

          {/* ── Wordmark ── */}
          <div
            className="mb-14 flex flex-col items-center"
            style={{
              opacity: p >= 5 ? 1 : 0,
              filter: `blur(${p >= 6 ? 0 : p >= 5 ? 3 : 10}px)`,
              transform: `translateY(${p >= 5 ? 0 : 14}px)`,
              transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: p >= 5 ? "260ms" : "0ms",
            }}
          >
            <h1
              className="text-[26px] font-extralight tracking-[0.3em] text-white"
              style={{ fontFeatureSettings: "'ss01' 1, 'cv01' 1" }}
            >
              MGRDEGH
            </h1>
            <div className="mt-5 flex items-center gap-5">
              <span className="h-px w-11 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
              <p className="text-[8px] font-medium tracking-[0.38em] text-white/20">
                VERWALTUNGSSYSTEM
              </p>
              <span className="h-px w-11 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
            </div>
          </div>

          {/* ── Auth card ── */}
          <div
            className="w-full"
            style={{
              opacity: p >= 5 ? 1 : 0,
              filter: `blur(${p >= 6 ? 0 : p >= 5 ? 2 : 8}px)`,
              transform: `translateY(${p >= 5 ? 0 : 22}px)`,
              transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: p >= 5 ? "380ms" : "0ms",
            }}
          >
            <div
              className="relative rounded-[22px] p-px"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.008) 100%)" }}
            >
              {/* Top highlight */}
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />

              <div
                className="relative overflow-hidden rounded-[21px] bg-[#09090b]/90 px-8 pb-9 pt-8 backdrop-blur-2xl"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.025), 0 28px 72px -16px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.015)" }}
              >
                {/* Inner top glow */}
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.012] to-transparent" />

                <div className="relative">

                  {denied ? (
                    /* ── Access Denied State ── */
                    <div className="flex flex-col items-center py-2">
                      {/* Shield icon */}
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/[0.06] ring-1 ring-red-500/10">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400/70">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      </div>

                      <h2 className="text-[13px] font-medium tracking-[0.04em] text-white/60">
                        Zugriff nicht autorisiert
                      </h2>
                      <p className="mt-2 text-center text-[11px] leading-relaxed text-white/25">
                        Dein Google-Konto ist nicht freigeschaltet.
                        <br />
                        Eine Anfrage wurde automatisch gesendet.
                      </p>

                      {/* Status indicator */}
                      <div className="mt-5 flex items-center gap-2 rounded-full bg-amber-500/[0.06] px-4 py-2 ring-1 ring-amber-500/10">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/40" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400/60" />
                        </span>
                        <span className="text-[10px] font-medium tracking-[0.06em] text-amber-400/70">
                          Anfrage wird geprüft
                        </span>
                      </div>

                      {pendingEmail && (
                        <p className="mt-3 text-center text-[10px] leading-relaxed text-white/20">
                          Zugang wird automatisch erteilt,<br />sobald deine Anfrage genehmigt wurde.
                        </p>
                      )}

                      {/* Divider */}
                      <div className="mx-auto mt-7 h-px w-full bg-gradient-to-r from-transparent via-white/[0.035] to-transparent" />

                      {/* Retry */}
                      <button
                        onClick={() => window.location.href = "/login"}
                        className="mt-5 text-[11px] font-normal tracking-[0.04em] text-white/25 transition-colors hover:text-white/50"
                      >
                        Mit anderem Konto versuchen
                      </button>
                    </div>
                  ) : (
                    /* ── Normal Google Sign-In ── */
                    <>
                  {/* ── Google CTA ── */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="group relative flex w-full flex-col items-center gap-6 py-1 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {/* Google icon */}
                    <div className="relative">
                      {/* Glow ring */}
                      <div className="absolute -inset-4 rounded-full bg-white/[0.015] blur-xl transition-all duration-600 group-hover:bg-white/[0.035] group-hover:-inset-5" />
                      {/* Container */}
                      <div className="relative flex h-[56px] w-[56px] items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03] transition-all duration-500 group-hover:border-white/[0.12] group-hover:bg-white/[0.055] group-hover:shadow-[0_0_24px_-4px_rgba(255,255,255,0.06)] active:scale-[0.96]"
                        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 6px_28px -6px rgba(0,0,0,0.45)" }}
                      >
                        {loading ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-[1.5px] border-white/10 border-t-white/60" />
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0 transition-transform duration-500 group-hover:scale-[1.06]">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Label */}
                    <span className="text-[12px] font-normal tracking-[0.06em] text-white/35 transition-colors duration-400 group-hover:text-white/65">
                      {loading ? "Verbinde…" : "Mit Google fortfahren"}
                    </span>

                    {/* Expanding underline */}
                    <span className="h-px w-6 bg-white/[0.04] transition-all duration-600 group-hover:w-14 group-hover:bg-white/[0.1]" />
                  </button>

                  {/* Error */}
                  {error && (
                    <div className="mt-6 rounded-xl border border-red-500/10 bg-red-500/[0.04] px-4 py-2.5">
                      <p className="text-center text-[11px] font-medium tracking-[0.02em] text-red-400/80">
                        Zugriff verweigert
                      </p>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="mx-auto mt-9 h-px w-full bg-gradient-to-r from-transparent via-white/[0.035] to-transparent" />

                  {/* Security */}
                  <div className="mt-5 flex items-center justify-center gap-2.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/12">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="text-[8px] font-medium tracking-[0.14em] text-white/12">
                      VERSCHLÜSSELT
                    </span>
                  </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="mt-12 flex flex-col items-center gap-4"
            style={{
              opacity: p >= 5 ? 1 : 0,
              transition: "opacity 600ms ease-out",
              transitionDelay: p >= 5 ? "500ms" : "0ms",
            }}
          >
            <div className="h-px w-5 bg-white/[0.035]" />
            <p className="text-[8px] font-medium tracking-[0.2em] text-white/[0.1]">
              AUTORISIERTER ZUGANG
            </p>
            <a
              href="https://www.karinex.de"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-1 flex items-center gap-2 rounded-full px-4 py-1.5 transition-all duration-500 hover:bg-white/[0.02]"
            >
              <span className="text-[7px] font-medium tracking-[0.15em] text-white/[0.12] transition-colors duration-500 group-hover:text-white/25">
                EIN UNTERNEHMEN DER
              </span>
              <span className="text-[8px] font-semibold tracking-[0.1em] text-[#b8860b]/30 transition-colors duration-500 group-hover:text-[#b8860b]/55">
                KARINEX.DE
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
