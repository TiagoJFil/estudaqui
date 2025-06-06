import { PackInfo, COLLECTIONS } from "../data/data-interfaces";
import { db } from "../data/firebase";

export async function getActivePacksInfo(): Promise<PackInfo[]> {
    const packsRef = db.collection(COLLECTIONS.PACKS);
    const snapshot = await packsRef.where("active", "==", true).get();
    if (snapshot.empty) {
        return [];
    }

    const packs: PackInfo[] = [];
    snapshot.forEach(doc => {
        const data = doc.data() as PackInfo;
        packs.push(data);
    });
    return packs;
}


export async function getPackInfoById(packId: string): Promise<PackInfo | null> {
    const packRef = db.collection(COLLECTIONS.PACKS).doc(packId);
    const doc = await packRef.get();
    if (!doc.exists) {
        return null;
    }
    return doc.data() as PackInfo;
}