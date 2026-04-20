"use client";

import { useState, useEffect } from "react";
import { useUserId } from "@/lib/user/identity";
import { createGroup, joinGroup, subscribeToGroup } from "@/lib/data/group";
import type { GroupSession } from "@/lib/schemas/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import rawPois from "@/public/venue/pois.json";

export default function GroupPage() {
  const userId = useUserId();
  const [session, setSession] = useState<GroupSession | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  useEffect(() => {
    if (session) {
      const unsub = subscribeToGroup(session.code, (newSession) => setSession(newSession));
      return unsub;
    }
    // We only want to re-subscribe if the session code changes, not on every session update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.code]);

  if (!userId) return null; // loading

  const handleCreate = async () => {
    const name = displayName.trim() || `Fan-${userId.substring(0, 4)}`;
    try {
      const newSession = await createGroup(userId, name);
      setSession(newSession);
      toast.success("Group created");
    } catch {
      toast.error("Failed to create group");
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      toast.error("Code must be 6 characters");
      return;
    }
    const name = displayName.trim() || `Fan-${userId.substring(0, 4)}`;
    try {
      const joinedSession = await joinGroup(code, userId, name);
      setSession(joinedSession);
      toast.success("Joined group successfully");
    } catch {
      toast.error("Group not found");
    }
  };

  const handleSuggest = () => {
    // Basic MVP logic for demo min/max walk time. 
    // In practice, this would rely on the `lib/routing/dijkstra.ts` graph.
    // For this MVP, we recommend the most common meetup POI.
    const poi = rawPois.find((p) => p.id === "food-burger");
    if (poi) {
      toast.success(`Meetup suggested: ${poi.name}`);
    }
  };

  if (session) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center py-8 px-4 gap-4">
        <Card className="w-full max-w-sm bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Group Code: {session.code}</CardTitle>
            <CardDescription className="text-slate-400">Share this code with friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300">Members</h3>
              <ul className="space-y-1">
                {session.members.map((m) => (
                  <li key={m.userId} className="text-slate-100 flex items-center justify-between text-sm p-2 bg-slate-800 rounded">
                    {m.displayName}
                    {m.userId === session.createdBy && <span className="text-xs text-amber-400">Host</span>}
                  </li>
                ))}
              </ul>
            </div>
            <Button onClick={handleSuggest} className="w-full bg-sky-600 hover:bg-sky-500 text-white">
              Suggest Meetup
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center py-8 px-4">
      <Card className="w-full max-w-sm bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-xl">Group Coordination</CardTitle>
          <CardDescription className="text-slate-400">
            Create or join a group to see friends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm text-slate-300">Your Display Name</label>
            <Input 
              id="displayName"
              placeholder="e.g. Alex" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              aria-label="Your Display Name"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <Button onClick={handleCreate} className="w-full bg-sky-600 hover:bg-sky-500 text-white" aria-label="Create New Session">
              Create New Session
            </Button>
            
            <div className="relative" aria-hidden="true">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Or join</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input 
                placeholder="6-char code" 
                value={joinCode} 
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-slate-800 border-slate-700 text-white uppercase text-center tracking-widest placeholder:text-slate-500"
                maxLength={6}
                aria-label="6 character join code"
              />
              <Button onClick={handleJoin} variant="outline" className="border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700" aria-label="Join existing session">
                Join
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
