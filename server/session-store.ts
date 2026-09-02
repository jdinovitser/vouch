import { Pool } from "pg";
import type { SessionState } from "../shared/types";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export async function loadSession(sessionId: string): Promise<SessionState | undefined> {
  const result = await pool.query<{ state: SessionState }>(
    "SELECT state FROM vouch_sessions WHERE session_id = $1",
    [sessionId],
  );
  return result.rows[0]?.state;
}

export async function saveSession(session: SessionState): Promise<SessionState> {
  const result = await pool.query<{ state: SessionState }>(
    `INSERT INTO vouch_sessions (session_id, state)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (session_id) DO UPDATE
       SET state = EXCLUDED.state,
           revision = vouch_sessions.revision + 1,
           updated_at = NOW()
     RETURNING state`,
    [session.sessionId, JSON.stringify(session)],
  );
  return result.rows[0].state;
}

export async function replaceSession(session: SessionState): Promise<SessionState> {
  const result = await pool.query<{ state: SessionState }>(
    `INSERT INTO vouch_sessions (session_id, state, revision)
     VALUES ($1, $2::jsonb, 1)
     ON CONFLICT (session_id) DO UPDATE
       SET state = EXCLUDED.state,
           revision = 1,
           updated_at = NOW()
     RETURNING state`,
    [session.sessionId, JSON.stringify(session)],
  );
  return result.rows[0].state;
}

export async function closeSessionStore() {
  await pool.end();
}