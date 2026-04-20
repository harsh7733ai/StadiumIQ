import { describe, expect, it } from 'vitest';
import { createSession, joinSession, getSession } from '@/lib/mock/groupStore';

describe('Group API & Store Logic', () => {
  it('creates a session properly', () => {
    const session = createSession('user1', 'Alice');
    expect(session.code).toHaveLength(6);
    expect(session.createdBy).toBe('user1');
    expect(session.members).toHaveLength(1);
    expect(session.members[0].displayName).toBe('Alice');
  });

  it('allows another user to join the session', () => {
    const session = createSession('user1', 'Alice');
    const joined = joinSession(session.code, 'user2', 'Bob');
    
    expect(joined.members).toHaveLength(2);
    expect(joined.members[1].userId).toBe('user2');
    expect(joined.members[1].displayName).toBe('Bob');
  });

  it('fetches the correct session by code', () => {
    const session = createSession('user3', 'Charlie');
    const fetched = getSession(session.code);
    expect(fetched).toBeDefined();
    expect(fetched!.code).toBe(session.code);
  });
});
