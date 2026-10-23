import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { db } from "./db";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password are required");
      }

      const email = credentials.email.trim().toLowerCase();
      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        throw new Error("Invalid email or password");
      }

      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatarUrl,
      };
    },
  }),
];

// Add Google Provider if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

// Add GitHub Provider if credentials are provided
const githubId = process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID;
const githubSecret = process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;
if (githubId && githubSecret) {
  providers.push(
    GithubProvider({
      clientId: githubId,
      clientSecret: githubSecret,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account && (account.provider === "google" || account.provider === "github")) {
        if (!user.email) {
          return false;
        }

        const email = user.email.trim().toLowerCase();

        try {
          // 1. Find existing user by email
          let existingUser = await db.user.findUnique({
            where: { email },
          });

          if (!existingUser) {
            // Create user
            existingUser = await db.user.create({
              data: {
                email,
                name: user.name || (account.provider === "github" ? "GitHub User" : "Google User"),
                avatarUrl: user.image || null,
                password: null,
              },
            });
          } else if (!existingUser.avatarUrl && user.image) {
            // Update avatar if missing
            await db.user.update({
              where: { id: existingUser.id },
              data: { avatarUrl: user.image },
            });
          }

          // 2. Link account in Account table
          const existingAccount = await db.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (!existingAccount) {
            await db.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: typeof account.session_state === "string" ? account.session_state : null,
              },
            });
          }

          user.id = existingUser.id;
          return true;
        } catch (err) {
          console.error(`OAuth signIn error (${account.provider}):`, err);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      // If token does not have an ID yet or user just authenticated via OAuth
      if (token.email && (!token.id || token.id === user?.id)) {
        try {
          const dbUser = await db.user.findUnique({
            where: { email: token.email.toLowerCase() },
            select: { id: true, name: true, avatarUrl: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            if (dbUser.name) token.name = dbUser.name;
            if (dbUser.avatarUrl) token.picture = dbUser.avatarUrl;
          }
        } catch {
          // ignore lookup error
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "linkstack-super-secret-development-key-2026-secure-token",
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    throw new Error("Unauthorized");
  }
  return user;
}
