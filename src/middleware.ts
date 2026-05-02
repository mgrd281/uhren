import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /login
     * - /api/auth (NextAuth routes)
     * - /api/webhooks (Shopify webhook receiver)
     * - /_next (static assets)
     * - /favicon.ico, /icon-*, /apple-touch-icon*, /manifest.json, /sw.js
     */
    "/((?!login|api/auth|api/webhooks|_next|favicon\\.ico|icon-|apple-touch-icon|manifest\\.json|sw\\.js).*)",
  ],
};
