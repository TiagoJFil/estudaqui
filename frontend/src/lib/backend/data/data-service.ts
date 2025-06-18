import { COLLECTIONS, UserI, PDFInfo, PackInfo } from "./data-interfaces";
import { db, storage } from "@/lib/backend/data/firebase";
import { getDefaultUserInfo } from "./default-values";
import { ExamJSON } from "../llm/types";

export class UserService {

  static async createOrGetAccount(id: string, name: string | null | undefined): Promise<UserI | void> {
    if (!id) {
      console.error("No ID provided for user account creation");
      return;
    }
    const userRef = db.collection(COLLECTIONS.USERS).doc(id);
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      const defaultUser: UserI = getDefaultUserInfo();
      defaultUser.name = name;
      await userRef.set(defaultUser);
      return defaultUser;
    }
    return userSnapshot.data() as UserI;
  }

  static async getUser(email: string): Promise<UserI | null> {
    const userRef = db.collection(COLLECTIONS.USERS).doc(email);
    const userSnapshot = await userRef.get();
    return userSnapshot.exists ? (userSnapshot.data() as UserI) : null;
  }

  static async subtractCredits(email: string, amount: number): Promise<UserI> {
    if (amount < 0) throw new Error("Cannot subtract negative credits");
    const user = await this.getUser(email);
    if (!user) throw new Error("User does not exist");
    if (user.credits < amount) throw new Error("Insufficient credits");
    const userRef = db.collection(COLLECTIONS.USERS).doc(email);
    await userRef.set({ credits: user.credits - amount }, { merge: true });
    const updated = await userRef.get();
    return updated.data() as UserI;
  }

  static async addCredits(email: string, amount: number): Promise<UserI> {
    if (amount <= 0) throw new Error("Cannot add non-positive credits");
    const user = await this.getUser(email);
    if (!user) throw new Error("User does not exist");
    const userRef = db.collection(COLLECTIONS.USERS).doc(email);
    await userRef.set({ credits: user.credits + amount }, { merge: true });
    const updated = await userRef.get();
    return updated.data() as UserI;
  }

  static async registerPayment(paymentInfo: { method: "solana" | "card" | "mbway"; userID: string; packID: string; timestamp: Date; transactionId?: string }): Promise<void> {
    if (!paymentInfo.userID || !paymentInfo.packID) throw new Error("Invalid payment information provided");
    const data = { ...paymentInfo, timestamp: paymentInfo.timestamp.toISOString() };
    await db.collection(COLLECTIONS.PAYMENTS).add(data);
  }
}

export class FileService {

  static async savePDF(pdfFile: File, userId: string, pdfHash: string): Promise<PDFInfo> {
    if (!pdfFile || !(pdfFile instanceof File)) throw new Error("Invalid file provided");
    if (!userId) throw new Error("User ID is required");
    if (!pdfFile.name.toLowerCase().endsWith(".pdf")) throw new Error("File must be a PDF");
    const docRef = db.collection(COLLECTIONS.FILES).doc(pdfHash);
    const snapshot = await docRef.get();
    if (snapshot.exists) return snapshot.data() as PDFInfo;
    const bucket = storage.bucket();
    const fileRef = bucket.file(`pdfs/${pdfHash}`);
    await fileRef.save(Buffer.from(await pdfFile.arrayBuffer()), { metadata: { contentType: pdfFile.type, metadata: { uploadedBy: userId, fileName: pdfFile.name } } });
    const url = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;
    const info: PDFInfo = { filename: pdfFile.name, userId, storageRef: url, createdAt: new Date() };
    await docRef.set(info);
    return info;
  }

  static async addExamInfo(pdfHash: string, examInfo: ExamJSON): Promise<void> {
    if (!pdfHash || !examInfo) throw new Error("Invalid parameters provided");
    await db.collection(COLLECTIONS.FILES).doc(pdfHash).set({ examInfo }, { merge: true });
  }

  static async getPDFInfo(pdfHash: string): Promise<PDFInfo | null> {
    if (!pdfHash) throw new Error("PDF text hash is required");
    try {
      const snapshot = await db.collection(COLLECTIONS.FILES).doc(pdfHash).get();
      return snapshot.exists ? (snapshot.data() as PDFInfo) : null;
    } catch (e) {
      console.error("Error accessing Firestore:", e);
      throw new Error("Could not access Firestore. Please try again later.");
    }
  }
}

export class UploadService {

  static async addUserUpload(userId: string, fileId: string, filename: string): Promise<void> {
    await db.collection(`users/${userId}/uploads`).doc(fileId).set({ filename, createdAt: new Date() }, { merge: true });
  }

  static async getUserUploads(userId: string): Promise<any[]> {
    const snaps = await db.collection(`users/${userId}/uploads`).orderBy("createdAt", "desc").get();
    return Promise.all(snaps.docs.map(async doc => {
      const fileDoc = await db.collection(COLLECTIONS.FILES).doc(doc.id).get();
      return { id: doc.id, ...doc.data(), file: fileDoc.exists ? fileDoc.data() : null };
    }));
  }
}

export class HistoryService {

  static async updateExamName(userId: string, examId: string, newName: string): Promise<void> {
    if (!userId || !examId || !newName) throw new Error("Invalid parameters provided for updating exam name");
    const docRef = db.collection(`users/${userId}/uploads`).doc(examId);
    const snap = await docRef.get();
    if (!snap.exists) throw new Error("Exam not found");
    await docRef.set({ filename: newName }, { merge: true });
  }

  static async deleteExam(userId: string, examId: string): Promise<void> {
    if (!userId || !examId) throw new Error("Invalid parameters provided for deleting exam");
    const docRef = db.collection(`users/${userId}/uploads`).doc(examId);
    const snap = await docRef.get();
    if (!snap.exists) throw new Error("Exam not found");
    await docRef.delete();
  }
}

export class PackService {
  private static instance: PackService;
  private cache: PackInfo[] | null = null;

  private constructor() {}

  public static getInstance(): PackService {
    if (!PackService.instance) {
      PackService.instance = new PackService();
    }
    return PackService.instance;
  }

  public async getAllPacks(): Promise<PackInfo[]> {
    if (this.cache) {
      return this.cache;
    }
    const snapshot = await db.collection(COLLECTIONS.PACKS).where("active", "==", true).get();
    const packs: PackInfo[] = [];
    snapshot.forEach(doc => {
      packs.push(doc.data() as PackInfo);
    });
    this.cache = packs;
    return packs;
  }

  public async getPackInfoById(packId: string): Promise<PackInfo | null> {
    const packs = await this.getAllPacks();
    const pack = packs.find(p => p.id === packId);
    if (!pack) {
      console.warn(`Pack with ID ${packId} not found`);
      return null;
    }
    return pack;
  }
}

// export a singleton instance
export const packService = PackService.getInstance();