import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
  return initializeApp({ credential: cert(sa) });
}

export function getDb() {
  getFirebaseApp();
  return getFirestore();
}

/** Auto-increment counter — runs in a Firestore transaction */
export async function getNextId(collection: string): Promise<number> {
  const db = getDb();
  const counterRef = db.collection("_counters").doc(collection);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const next = snap.exists ? (snap.data()!.value as number) + 1 : 1;
    tx.set(counterRef, { value: next });
    return next;
  });
}

/** Convert a Firestore DocumentSnapshot to a plain object with numeric id */
export function docData(
  doc: FirebaseFirestore.DocumentSnapshot
): Record<string, unknown> | null {
  if (!doc.exists) return null;
  const d = doc.data()!;
  return { ...d, id: parseInt(doc.id, 10) };
}

/** Convert a QueryDocumentSnapshot to a plain object with numeric id */
export function qDocData(
  doc: FirebaseFirestore.QueryDocumentSnapshot
): Record<string, unknown> {
  return { ...doc.data(), id: parseInt(doc.id, 10) };
}
