import { COLLECTIONS, UserI } from "./data-interfaces";
import { db } from "@/lib/data/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getDefaultUserInfo } from "./default-values";
import { User } from "next-auth";



export async function createOrGetAccount(email: string | null | undefined) {
  if (!email) {
    console.error("No email provided for user account creation");
    return;
  }

  const userRef = doc(db, COLLECTIONS.USERS, email);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const newUser: UserI = getDefaultUserInfo();
    await setDoc(userRef, newUser);
    return newUser;
  } else {
    return userSnap.data() as UserI;
  }
}

export async function getUser(email: string): Promise<UserI | null> {
    const userRef = doc(db, COLLECTIONS.USERS, email);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data() as UserI;
    } else {
        return null;
    }
}

export async function SubtractCreditsFromUser(email: string, creditsToSubtract: number): Promise<UserI> {
    if (creditsToSubtract < 0) {
        throw new Error("Cannot subtract negative credits");
    }
    
    const userNullable = await getUser(email);
    if (!userNullable) {
        throw new Error("User does not exist");
    }
    const user = userNullable as UserI;

    if (user.credits < creditsToSubtract) {
        throw new Error("Insufficient credits");
    }
    
    const userRef = doc(db, COLLECTIONS.USERS, email);
    
    await setDoc(userRef, { credits: user.credits - creditsToSubtract }, { merge: true });
    // Return the updated user object
    const updatedUserSnap = await getDoc(userRef);

    return  updatedUserSnap.data() as UserI;
}