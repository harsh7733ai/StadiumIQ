import type { GroupSession } from "@/lib/schemas/session";

declare global {
  // eslint-disable-next-line no-var
  var __stadiumiq_group_store: Map<string, GroupSession> | undefined;
}

const store = globalThis.__stadiumiq_group_store ?? new Map<string, GroupSession>();

if (process.env.NODE_ENV !== "production") {
  globalThis.__stadiumiq_group_store = store;
}

export function createSession(userId: string, displayName: string): GroupSession {
  // Generate a random 6-character code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const session: GroupSession = {
    code,
    createdBy: userId,
    members: [
      {
        userId,
        displayName,
        poiId: null,
        coords: null,
        updatedAt: Date.now(),
      },
    ],
    createdAt: Date.now(),
  };
  store.set(code, session);
  return session;
}

export function joinSession(code: string, userId: string, displayName: string): GroupSession {
  const session = store.get(code.toUpperCase());
  if (!session) throw new Error("Session not found");

  if (!session.members.some((m) => m.userId === userId)) {
    session.members.push({
      userId,
      displayName,
      poiId: null,
      coords: null,
      updatedAt: Date.now(),
    });
  }
  return session;
}

export function getSession(code: string): GroupSession | null {
  return store.get(code.toUpperCase()) || null;
}
