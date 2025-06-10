import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getServerSession } from "next-auth";
import bs58 from "bs58"
import { PublicKey, Transaction } from "@solana/web3.js";

// Extend Transaction type to include addMemo method
declare module "@solana/web3.js" {
  interface Transaction {
    addMemo(memo: string): this;
  }
}



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

export async function getUserIdentifierServerside(){
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

export async function hashAndEncodeBase58(text: string): Promise<string> {
    const hash = await hashTextSHA256(text);
    return bs58.encode(Buffer.from(hash, 'hex'));
}

export async function getSimpleCryptoPaymentIDMemo(userID:string,packID:string): Promise<string> {
    return await hashAndEncodeBase58(`${userID}-${packID}`)
}

export async function getQRCryptoPaymentIDMemo(userID:string, packID:string,orderID: string): Promise<string> {
    return (await hashAndEncodeBase58(`${userID}-${packID}`)) + ";" + orderID;
}

export const MAX_FILE_SIZE_MB = 10;

export const VALID_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

export const NEXT_PUBLIC_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";


export function convertDbDateToDate(createdAt: { _seconds : number} ){
    if (!createdAt || typeof createdAt._seconds !== 'number') {
        throw new Error("Invalid date format");
    }
    return new Date(createdAt._seconds * 1000);
}

Transaction.prototype.addMemo = function (memo: string) {
    if (!memo || memo.length === 0) {
        throw new Error("Memo cannot be empty");
    }
    if (memo.length > 200) {
        throw new Error("Memo exceeds maximum length of 200 characters");
    }

    this.add({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from(memo, 'utf-8')
    });
    return this;
}

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
