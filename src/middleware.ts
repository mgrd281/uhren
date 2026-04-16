export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login
     * - /api/auth (NextAuth routes)
     * - /_next (static assets)
     * - /favicon.ico, /icon-*, /apple-touch-icon*, /manifest.json, /sw.js
     */
    "/((?!login|api/auth|_next|favicon\\.ico|icon-|apple-touch-icon|manifest\\.json|sw\\.js).*)",
  ],
};
