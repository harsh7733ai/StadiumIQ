import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "./client";
import { hasFirebase } from "@/lib/env";
import type { Order } from "@/lib/schemas/order";

/**
 * Firestore persistence layer for orders.
 *
 * Writes are fire-and-forget: the in-memory `orderStore` remains the
 * authoritative source of truth for the live demo (zero cold-start latency),
 * while Firestore acts as a durable mirror for real-production deployments.
 */
const ORDERS_COLLECTION = "orders";

/** Mirror an order to Firestore. Never throws. */
export async function mirrorOrderToFirestore(order: Order): Promise<void> {
  if (!hasFirebase) return;
  if (typeof window === "undefined") return;

  try {
    const db = getDb();
    await setDoc(doc(db, ORDERS_COLLECTION, order.id), {
      ...order,
      createdAt: Timestamp.fromMillis(order.createdAt),
      updatedAt: Timestamp.fromMillis(order.updatedAt),
      mirroredAt: serverTimestamp(),
    });
  } catch {
    // Firestore is secondary — never break the primary write.
  }
}

/** Log a concierge query to Firestore for analytics. Never throws. */
export async function logConciergeQuery(
  userId: string,
  query: string,
  recommendationId: string | null,
): Promise<void> {
  if (!hasFirebase) return;
  if (typeof window === "undefined") return;

  try {
    const db = getDb();
    await addDoc(collection(db, "concierge_queries"), {
      userId,
      query: query.slice(0, 500),
      recommendationId,
      createdAt: serverTimestamp(),
    });
  } catch {
    // swallow
  }
}
