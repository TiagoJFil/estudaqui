import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { db } from "@/lib/data/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { COLLECTIONS, UserI } from "@/lib/data/data-interfaces";
import { getDefaultUser } from "@/lib/data/default-values";

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
      if (!user?.id) return true;
      try {
        const userRef = doc(db, COLLECTIONS.USERS, user.id);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, getDefaultUser());
        }
      } catch (e) {
        console.error("Error creating user document:", e);
      }
      return true;
    },
  },
});