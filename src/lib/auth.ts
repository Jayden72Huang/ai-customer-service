import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { compare } from "bcryptjs";
import { getDb } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const sql = getDb();
        const rows = await sql`
          SELECT id, email, name, password_hash, membership
          FROM users
          WHERE email = ${credentials.email as string}
        `;

        if (rows.length === 0) return null;

        const user = rows[0];
        const valid = await compare(
          credentials.password as string,
          user.password_hash as string,
        );

        if (!valid) return null;

        return {
          id: user.id as string,
          email: user.email as string,
          name: user.name as string,
          membership: (user.membership as string) || "free",
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isProtected = request.nextUrl.pathname.startsWith("/dashboard");
      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", request.url));
      }
      return true;
    },
    async signIn({ user, account }) {
      // For OAuth providers, auto-create user in DB if not exists
      if (account?.provider === "github" && user.email) {
        const sql = getDb();
        const existing = await sql`SELECT id, membership FROM users WHERE email = ${user.email}`;
        if (existing.length === 0) {
          const rows = await sql`
            INSERT INTO users (email, password_hash, name)
            VALUES (${user.email}, ${"oauth-no-password"}, ${user.name || user.email.split("@")[0]})
            RETURNING id, membership
          `;
          user.id = rows[0].id as string;
          (user as Record<string, unknown>).membership = rows[0].membership || "free";
        } else {
          user.id = existing[0].id as string;
          (user as Record<string, unknown>).membership = existing[0].membership || "free";
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.membership = (user as Record<string, unknown>).membership || "free";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as unknown as Record<string, unknown>).membership = token.membership || "free";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
