import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getServerSession } from "next-auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function hashTextSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

export const MAX_FILE_SIZE_MB = 10;

export const VALID_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

export const isValidFileType = (file: File): boolean => {
    return Object.keys(VALID_FILE_TYPES).includes(file.type);
}
export const isValidFileSize = (file: File): boolean => {
    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB to bytes
    return file.size <= maxSizeBytes;
}
export const isValidFile = (file: File): boolean => {
    return isValidFileType(file) && isValidFileSize(file);
}
