"use client"

import { ExamJson } from "@/lib/frontend/types";

async function uploadFilesToServer(uploadedFiles: File[]): Promise<any> {
    const formData = new FormData();
    uploadedFiles.forEach((file) => formData.append("files", file));

    try {
        const response = await fetch("/api/v1/upload", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Return the structured exam JSON
    } catch (error) {
        console.error("Error processing request:", error);
        throw error;
    }
}

async function getUserInfo(): Promise<any> {
    try {
        const response = await fetch("/api/v1/user", {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Return user info
    } catch (error) {
        console.error("Error fetching user info:", error);
        throw error;
    }
}

async function getActivePacks(): Promise<any> {
    try {
        const response = await fetch("/api/v1/active-packs", {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Return active packs info
    } catch (error) {
        console.error("Error fetching active packs:", error);
        throw error;
    }
}

async function completePackCryptoPurchase(
    signature: string,
    packID: string,
    orderID?: string
): Promise<any> {
    try {
        const response = await fetch("/api/v1/payment/solana", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            signature,
            packID: packID,
            orderID: orderID || null, // Optional order ID
          }),
        })

        if (!response.ok) {
            throw new Error("Payment verification failed");
        }

        const data = await response.json();
        return data; // Return purchase confirmation or details
    } catch (error) {
        console.error("Error completing pack purchase:", error);
        throw error;
    }
}

async function getSuggestedAnswerFromApi(question: string, additionalContent: string | null): Promise<string> {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append("question", question);
        if (additionalContent) {
            queryParams.append("additionalContent", additionalContent);
        }

        const response = await fetch("/api/v1/suggested-answer?" + queryParams.toString());

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.answer;
    } catch (error) {
        console.error("Error fetching suggested answer from API:", error);
        throw error;
    }
}
async function getExamById(examId: string): Promise<ExamJson> {
    const response = await fetch(`/api/v1/exam/${encodeURIComponent(examId)}`);
    if (!response.ok) throw new Error("Failed to fetch exam");
    return await response.json();
}

// Fetch the current user's uploads from the API
async function getUserUploads(): Promise<any[]> {
    const response = await fetch("/api/v1/user-uploads");
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

export class API {
    static async uploadFiles(uploadedFiles: File[]): Promise<any> {
        return uploadFilesToServer(uploadedFiles);
    }

    static async getUserInfo(): Promise<any> {
        return getUserInfo();
    }

    static async getActivePacks(): Promise<any> {
        return getActivePacks();
    }

    static async completePackCryptoPurchase(
        signature: string,
        packID: string,
        orderID?: string
    ): Promise<any> {
        return completePackCryptoPurchase(signature, packID,orderID);
    }

    static async getSuggestedAnswerFromApi(
        question: string,
        additionalContent: string | null
    ): Promise<string> {
        return getSuggestedAnswerFromApi(question, additionalContent);
    }
    static async getExamById(examId: string): Promise<ExamJson> {
        return getExamById(examId);
    }
    static async getUserUploads(): Promise<any[]> {
        return getUserUploads();
    }
}