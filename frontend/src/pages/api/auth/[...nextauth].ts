import NextAuth from "next-auth";
import type { NextAuthOptions, Session, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import TwitterProvider from "next-auth/providers/twitter";
import { UserService } from "@/lib/backend/data/data-service";

// Extend the Session and User types to include credits

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
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
  ],  callbacks: {
    async signIn({ user, account }) {
      let uid = user.email;
      if ((user.email === null || user.email === undefined) && user.name !== null && account?.provider === "twitter") {
        uid = user.id + "@twitter.com";
        user.email = uid; 
      }
      if (!uid) {
        console.error("No user identifier found for sign-in");
        return false; // Deny sign-in if no identifier is available
      }
      const userAccount = await UserService.createOrGetAccount(uid as string,user.name);
      if (userAccount) {
        return true; // Allow sign-in
      } else {
        return false; // Deny sign-in
      }
    },
    async session({ session, user, token }) {
      // Attach user information to the session
      let userID = session?.user?.email
      if (!userID) {
        console.error("No user identifier found in session: ", session);
        return session; //(should never happen) Return session without user info if no identifier is available
      }

        const userInfo = await UserService.getUser(userID);
        if (userInfo && session?.user) {
          session.user.credits = userInfo.credits;
        }
      
      return session;
    }
  },
  pages: {
    signIn: "/", 
    error: "/?error=auth", // Error page URL
  },
});
