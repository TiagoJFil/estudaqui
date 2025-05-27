import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getServerSession } from "next-auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export async function getUserIdentifier(){
    const session = await getServerSession();
    if (!session || !session.user) {
        throw new Error("User not authenticated");
    }

    const userEmail = session.user.email;
    if (!userEmail) {
        throw new Error("User email not found in session");
    }
    return userEmail;
}