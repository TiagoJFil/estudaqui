import { COLLECTIONS, UserI, PDFInfo } from "./data-interfaces";
import { db, storage } from "@/lib/data/firebase";
import { getDefaultUserInfo } from "./default-values";
import { ExamJSON } from "@/services/examService";

export async function createOrGetAccount(email: string | null | undefined) {
  if (!email) {
    console.error("No email provided for user account creation");
    return;
  }

  const userRef = db.collection(COLLECTIONS.USERS).doc(email);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    const newUser: UserI = getDefaultUserInfo();
    await userRef.set(newUser);
    return newUser;
  } else {
    return userSnap.data() as UserI;
  }
}

export async function getUser(email: string): Promise<UserI | null> {
  const userRef = db.collection(COLLECTIONS.USERS).doc(email);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    return userSnap.data() as UserI;
  } else {
    return null;
  }
}

export async function subtractCreditsFromUser(email: string, creditsToSubtract: number): Promise<UserI> {
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

  const userRef = db.collection(COLLECTIONS.USERS).doc(email);
  await userRef.set({ credits: user.credits - creditsToSubtract }, { merge: true });

  const updatedUserSnap = await userRef.get();
  return updatedUserSnap.data() as UserI;
}

export async function savePDF(pdf: File, userID: string, pdfTextHash: string): Promise<PDFInfo> {
  if (!pdf || !(pdf instanceof File)) {
    throw new Error("Invalid file provided");
  }
  if (!userID) {
    throw new Error("User ID is required");
  }
  if (!pdf.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("File must be a PDF");
  }

  const filesRef = db.collection(COLLECTIONS.FILES);
  const querySnapshot = await filesRef
  .doc(pdfTextHash)
  .get()

  if (querySnapshot.exists) {
    return querySnapshot.data() as PDFInfo;
  }

  const bucket = storage.bucket();
  const fileRef = bucket.file(`pdfs/${pdfTextHash}`);
  await fileRef.save(Buffer.from(await pdf.arrayBuffer()), {
    metadata: {
       contentType: pdf.type,
       metadata: {
         uploadedBy: userID,
         fileName: pdf.name,
       }
    },
  });
  const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

  const fileFirestoreDocument: PDFInfo = {
    filename: pdf.name,
    userId: userID,
    storageRef: downloadURL,
  };

  const fileDoc = filesRef.doc(pdfTextHash);
  await fileDoc.set(fileFirestoreDocument);

  return fileFirestoreDocument;
}

export async function addExamInfoToPDF(pdfTextHash: string, examInfo: ExamJSON): Promise<void> {
  if (!pdfTextHash || !examInfo) {
    throw new Error("Invalid parameters provided");
  }

  const filesRef = db.collection(COLLECTIONS.FILES);
  const fileDoc = filesRef.doc(pdfTextHash);
  
  await fileDoc.set({ examInfo }, { merge: true });
}

export async function getPDFInfo(pdfTextHash: string): Promise<PDFInfo | null> {
  if (!pdfTextHash) {
    throw new Error("PDF text hash is required");
  }
  try{
    const filesRef = db.collection(COLLECTIONS.FILES);
    const fileDoc = filesRef.doc(pdfTextHash);
    const fileSnap = await fileDoc.get();

    if (fileSnap.exists) {
      return fileSnap.data() as PDFInfo;
    } else {
      return null;
    }

  } catch (error) {
    console.error("Error accessing Firestore:", error);
    throw new Error("Could not access Firestore. Please try again later.");
  }

}