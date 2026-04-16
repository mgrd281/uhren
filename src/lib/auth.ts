import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
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
    async authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isLoginPage = request.nextUrl.pathname === "/login";

      if (isLoginPage) {
        // Redirect logged-in users away from login page
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      // Protect all other routes
      return isLoggedIn;
    },

    async signIn({ user, account }) {
      if (account?.provider !== "google" || !account.providerAccountId) {
        return false;
      }

      const googleUid = account.providerAccountId;

      // Check if an owner already exists
      const owner = await prisma.authorizedUser.findUnique({
        where: { id: "owner" },
      });

      if (!owner) {
        // First login ever → this Google account becomes the permanent owner
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

      // Owner exists → only allow if same Google UID
      if (owner.googleUid === googleUid) {
        return true;
      }

      // Any other Google account is blocked
      return false;
    },

    async session({ session }) {
      return session;
    },
  },
  trustHost: true,
});
