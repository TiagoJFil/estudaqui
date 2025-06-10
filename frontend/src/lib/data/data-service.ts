import { COLLECTIONS, UserI, PDFInfo } from "./data-interfaces";
import { db, storage } from "@/lib/data/firebase";
import { getDefaultUserInfo } from "./default-values";
import { ExamJSON } from "../llm/types";

export async function createOrGetAccount(email: string | null | undefined) {
  if (!email) {
    console.error("No email provided for user account creation");
    return;
  }

  const userRef = db.collection(COLLECTIONS.USERS).doc(email);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    const defaultUser: UserI = getDefaultUserInfo();
    await userRef.set(defaultUser);
    return defaultUser;
  } else {
    return userSnapshot.data() as UserI;
  }
}

export async function getUser(email: string): Promise<UserI | null> {
  const userRef = db.collection(COLLECTIONS.USERS).doc(email);
  const userSnapshot = await userRef.get();
  if (userSnapshot.exists) {
    return userSnapshot.data() as UserI;
  } else {
    return null;
  }
}

export async function subtractCreditsFromUser(email: string, creditsToSubtract: number): Promise<UserI> {
  if (creditsToSubtract < 0) {
    throw new Error("Cannot subtract negative credits");
  }

  const user = await getUser(email);
  if (!user) {
    throw new Error("User does not exist");
  }

  if (user.credits < creditsToSubtract) {
    throw new Error("Insufficient credits");
  }

  const userRef = db.collection(COLLECTIONS.USERS).doc(email);
  await userRef.set({ credits: user.credits - creditsToSubtract }, { merge: true });

  const updatedUserSnapshot = await userRef.get();
  return updatedUserSnapshot.data() as UserI;
}

export async function addCreditsToUser(email: string, amount: number): Promise<UserI> {
  if (amount <= 0) {
    throw new Error("Cannot add non-positive credits");
  }

  const userNullable = await getUser(email);
  if (!userNullable) {
    throw new Error("User does not exist");
  }
  const user = userNullable as UserI;

  const userRef = db.collection(COLLECTIONS.USERS).doc(email);
  await userRef.set({ credits: user.credits + amount }, { merge: true });

  const updatedUserSnap = await userRef.get();
  return updatedUserSnap.data() as UserI;
}


export async function savePDF(pdfFile: File, userId: string, pdfHash: string): Promise<PDFInfo> {
  if (!pdfFile || !(pdfFile instanceof File)) {
    throw new Error("Invalid file provided");
  }
  if (!userId) {
    throw new Error("User ID is required");
  }
  if (!pdfFile.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("File must be a PDF");
  }

  const filesCollection = db.collection(COLLECTIONS.FILES);
  const pdfDocRef = filesCollection.doc(pdfHash);
  const pdfDocSnapshot = await pdfDocRef.get();

  if (pdfDocSnapshot.exists) {
    return pdfDocSnapshot.data() as PDFInfo;
  }

  const bucket = storage.bucket();
  const fileRef = bucket.file(`pdfs/${pdfHash}`);
  await fileRef.save(Buffer.from(await pdfFile.arrayBuffer()), {
    metadata: {
      contentType: pdfFile.type,
      metadata: {
        uploadedBy: userId,
        fileName: pdfFile.name,
      },
    },
  });
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

  const pdfInfo: PDFInfo = {
    filename: pdfFile.name,
    userId: userId,
    storageRef: downloadUrl,
    createdAt: new Date(),
  };

  await pdfDocRef.set(pdfInfo);

  return pdfInfo;
}

export async function addExamInfoToPDF(pdfHash: string, examInfo: ExamJSON): Promise<void> {
  if (!pdfHash || !examInfo) {
    throw new Error("Invalid parameters provided");
  }

  const filesCollection = db.collection(COLLECTIONS.FILES);
  const pdfDocRef = filesCollection.doc(pdfHash);
  await pdfDocRef.set({ examInfo }, { merge: true });
}

export async function getPDFInfo(pdfHash: string): Promise<PDFInfo | null> {
  if (!pdfHash) {
    throw new Error("PDF text hash is required");
  }
  try {
    const filesCollection = db.collection(COLLECTIONS.FILES);
    const pdfDocRef = filesCollection.doc(pdfHash);
    const pdfDocSnapshot = await pdfDocRef.get();

    if (pdfDocSnapshot.exists) {
      return pdfDocSnapshot.data() as PDFInfo;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error accessing Firestore:", error);
    throw new Error("Could not access Firestore. Please try again later.");
  }
}


export async function registerPayment(
  paymentInfo: {
    method: "solana" | "card" | "paypal" | "mbway";
    userID: string;
    packID: string;
    timestamp: Date;
    transactionId?: string; // Optional for crypto payments
  }
): Promise<void> {
  if (!paymentInfo || !paymentInfo.userID || !paymentInfo.packID) {
    throw new Error("Invalid payment information provided");
  }
  const paymentInfoWithStringDates = {
    ...paymentInfo,
    timestamp: paymentInfo.timestamp.toISOString(),
  };

  const paymentsRef = db.collection(COLLECTIONS.PAYMENTS);
  await paymentsRef.add(paymentInfoWithStringDates);
}

// Save a reference to the user's uploads subcollection
export async function addUserUpload(userId: string, fileId: string, filename: string) {
  const uploadsCollection = db.collection(`users/${userId}/uploads`);
  await uploadsCollection.doc(fileId).set({
    filename,
    createdAt: new Date(),
  }, { merge: true });
}

// Get all uploads for a user, joined with file info
export async function getUserUploads(userId: string) {
  const uploadsCollection = db.collection(`users/${userId}/uploads`);
  const uploadsSnapshot = await uploadsCollection.orderBy("createdAt", "desc").get();
  return Promise.all(
    uploadsSnapshot.docs.map(async (doc) => {
      const fileId = doc.id;
      const fileDoc = await db.collection(COLLECTIONS.FILES).doc(fileId).get();
      return {
        id: fileId,
        ...doc.data(),
        file: fileDoc.exists ? fileDoc.data() : null,
      };
    })
  );
}