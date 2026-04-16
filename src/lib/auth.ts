import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Base config shared between middleware (Edge) and API routes (Node.js).
 * Must NOT import anything Node-only (e.g. Prisma).
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isLoginPage = request.nextUrl.pathname === "/login";

      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;

/**
 * Full config with Prisma callbacks — only used in API routes (Node.js runtime).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account }) {
      if (account?.provider !== "google" || !account.providerAccountId) {
        return false;
      }

      const { prisma } = await import("./prisma");
      const googleUid = account.providerAccountId;

      const owner = await prisma.authorizedUser.findUnique({
        where: { id: "owner" },
      });

      if (!owner) {
        await prisma.authorizedUser.create({
          data: {
            id: "owner",
            googleUid,
            email: user.email ?? "",
            name: user.name,
            image: user.image,
          },
        });
        return true;
      }

      if (owner.googleUid === googleUid) {
        return true;
      }

      return false;
    },

    async session({ session }) {
      return session;
    },
  },
});
