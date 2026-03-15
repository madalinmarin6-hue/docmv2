import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "./supabase"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        // Allow login by email or nickname
        const input = credentials.email.trim()
        const isEmail = input.includes("@")

        const { data: user, error } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq(isEmail ? "email" : "nickname", isEmail ? input : input.toLowerCase())
          .single()

        if (error || !user) {
          throw new Error(isEmail ? "No account found with this email" : "No account found with this nickname")
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error("Invalid password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
          emailVerified: user.email_verified,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        const u = user as unknown as { role: string; plan: string; emailVerified: boolean }
        token.role = u.role
        token.plan = u.plan
        token.emailVerified = u.emailVerified
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const s = session.user as unknown as { id: string; role: string; plan: string; emailVerified: boolean }
        s.id = token.id as string
        s.role = token.role as string
        s.plan = token.plan as string
        s.emailVerified = token.emailVerified as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "docm-secret-key-change-in-production",
}
