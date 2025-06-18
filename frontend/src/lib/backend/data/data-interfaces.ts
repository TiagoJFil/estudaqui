import { ExamJSON } from "../llm/types";

export interface UserI {
    credits: number;
    name?: string | null
}

export interface PDFInfo {
    filename: string;
    storageRef: string;
    userId: string;
    examInfo?: ExamJSON;
    createdAt: Date; 
}

export interface PaymentInfo {
    method: "solana" | "card" | "paypal" | "mbway" ;
    userId: string;
    packID: string;
    timestamp: Date;
    transactionId?: string; // Optional for crypto payments
}

export interface PackInfo {
    id: string;
    name: string;
    description: string;
    priceUSD: number;
    credits: number;
    subscription?: boolean;
    subscriptionPeriod?: "monthly" | "yearly"; // Optional for packs that are not subscriptions
    extraCredits?: number; 
    active: boolean;
    stripeID: string;
    stripeLinkID: string;
    imageUrl?: string; // Optional
}

//collections
export const COLLECTIONS = {
    USERS: "users",
    FILES: "files",
    PAYMENTS: "payments",
    PACKS: "packs",
}
