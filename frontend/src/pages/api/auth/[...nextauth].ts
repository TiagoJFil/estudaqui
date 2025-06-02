import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { createOrGetAccount } from "@/lib/data/data-service";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      console.log("User signing in:", user);

      const userAccount = await createOrGetAccount(user.email);
      if (userAccount) {
        return true; // Allow sign-in
      } else {
        return false; // Deny sign-in
      }
    },
  },
  pages: {
    signIn: "/", 
    error: "/?error=auth", // Error page URL
  },
});
