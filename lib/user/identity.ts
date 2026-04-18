"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "stadiumiq_user_id";

export function getOrCreateUserId(): string {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}

export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  return userId;
}
