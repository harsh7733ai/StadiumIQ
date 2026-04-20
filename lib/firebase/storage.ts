import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
  type UploadResult,
} from "firebase/storage";
import { getFirebaseApp } from "./client";
import { hasFirebase } from "@/lib/env";

/**
 * Firebase Cloud Storage wrapper.
 *
 * Powers venue asset uploads (floor-plan SVGs, POI thumbnails, concession
 * menu photos, receipt PDFs). Every write is scoped to a tenant prefix
 * so Storage security rules can enforce per-venue isolation.
 *
 * All helpers fail closed: if Firebase is not configured the caller gets
 * a clear error rather than a silent no-op. These operations are
 * operator-level, not fan-level — a 500 here is acceptable.
 */
let storageInstance: FirebaseStorage | null = null;

function getStorageInstance(): FirebaseStorage {
  if (!hasFirebase) {
    throw new Error(
      "Firebase Storage is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.",
    );
  }
  if (storageInstance) return storageInstance;
  storageInstance = getStorage(getFirebaseApp());
  return storageInstance;
}

/**
 * Canonical storage key layout. Every object stored by the app must go
 * through one of these builders so the Firebase rules stay predictable.
 */
export const storageKeys = {
  venueFloorPlan: (venueId: string) => `venues/${venueId}/floor-plan.svg`,
  poiThumbnail: (venueId: string, poiId: string) =>
    `venues/${venueId}/pois/${poiId}.jpg`,
  concessionMenuPhoto: (venueId: string, poiId: string, itemId: string) =>
    `venues/${venueId}/menus/${poiId}/${itemId}.jpg`,
  receipt: (userId: string, orderId: string) =>
    `receipts/${userId}/${orderId}.pdf`,
} as const;

/**
 * Upload raw bytes to the given storage key. Returns the public download
 * URL on success.
 */
export async function uploadAsset(
  key: string,
  bytes: Blob | Uint8Array | ArrayBuffer,
  contentType?: string,
): Promise<{ downloadUrl: string; uploadResult: UploadResult }> {
  const storage = getStorageInstance();
  const fileRef = ref(storage, key);
  const metadata = contentType ? { contentType } : undefined;
  const uploadResult = await uploadBytes(fileRef, bytes, metadata);
  const downloadUrl = await getDownloadURL(fileRef);
  return { downloadUrl, uploadResult };
}

/** Resolve a storage key to a public download URL. */
export async function getAssetUrl(key: string): Promise<string> {
  const storage = getStorageInstance();
  return getDownloadURL(ref(storage, key));
}

/** Delete an asset. Used for receipt lifecycle cleanup. */
export async function deleteAsset(key: string): Promise<void> {
  const storage = getStorageInstance();
  await deleteObject(ref(storage, key));
}
