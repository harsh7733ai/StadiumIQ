import type { GroupSession } from "@/lib/schemas/session";
import { GroupSessionSchema } from "@/lib/schemas/session";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export async function createGroup(userId: string, displayName: string): Promise<GroupSession> {
  if (!IS_MOCK) throw new Error("Firestore createGroup not implemented");
  
  const res = await fetch("/api/group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", userId, displayName }),
  });
  
  if (!res.ok) throw new Error("Failed to create group");
  const data: unknown = await res.json();
  return GroupSessionSchema.parse(data);
}

export async function joinGroup(code: string, userId: string, displayName: string): Promise<GroupSession> {
  if (!IS_MOCK) throw new Error("Firestore joinGroup not implemented");
  
  const res = await fetch("/api/group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "join", code, userId, displayName }),
  });
  
  if (!res.ok) throw new Error("Failed to join group or invalid code");
  const data: unknown = await res.json();
  return GroupSessionSchema.parse(data);
}

export function subscribeToGroup(code: string, cb: (session: GroupSession) => void): () => void {
  if (!IS_MOCK) throw new Error("Firestore subscribeToGroup not implemented");
  
  let active = true;
  async function poll() {
    if (!active) return;
    try {
      const res = await fetch(`/api/group?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data: unknown = await res.json();
        const parsed = GroupSessionSchema.safeParse(data);
        if (parsed.success) cb(parsed.data);
      }
    } catch {
      // transient fetch error
    }
  }
  
  void poll();
  const id = setInterval(() => void poll(), 2000);
  return () => {
    active = false;
    clearInterval(id);
  };
}
