import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import TwitterProvider from "next-auth/providers/twitter";
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
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
  ],  callbacks: {
    async signIn({ user, account }) {
      console.log("User signing in:", user);
      //if twitter use name
      console.log("Account info:", account);
      
      let mail = user.email;
      if (user.email === null || user.email === undefined && user.name !== null && account?.provider === "twitter") {
        mail = user.name + "@twitter.com";
      }


      const userAccount = await createOrGetAccount(mail);
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
