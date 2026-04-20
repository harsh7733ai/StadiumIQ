/**
 * Google reCAPTCHA v3 client + server helpers.
 *
 * reCAPTCHA v3 returns a score (0.0–1.0) instead of a user challenge;
 * we attach a token to each `/api/concierge` request and reject anything
 * below a configurable threshold. This is an additional layer on top of
 * the sliding-window rate limiter in `lib/security/rateLimit.ts`.
 *
 * Site key: public, set via `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
 * Secret key: server-only, set via `RECAPTCHA_SECRET_KEY`.
 *
 * When either is unset the helpers short-circuit — this keeps the demo
 * build working offline without Google credentials.
 */

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export const RECAPTCHA_MIN_SCORE = 0.5;

interface VerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Client-side: request a fresh reCAPTCHA token for a given action name.
 * Returns `null` when reCAPTCHA isn't loaded (e.g. ad-blockers, CSP).
 */
export async function getRecaptchaToken(
  action: string,
  siteKey: string | undefined = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!siteKey) return null;

  const grecaptcha = (
    window as unknown as {
      grecaptcha?: {
        ready: (cb: () => void) => void;
        execute: (key: string, opts: { action: string }) => Promise<string>;
      };
    }
  ).grecaptcha;
  if (!grecaptcha) return null;

  return new Promise((resolve) => {
    try {
      grecaptcha.ready(() => {
        grecaptcha
          .execute(siteKey, { action })
          .then(resolve)
          .catch(() => resolve(null));
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Server-side: verify a reCAPTCHA token against Google's endpoint.
 * Returns `{ ok: true, score }` on pass, `{ ok: false }` on fail.
 *
 * Fails *open* when the secret key is missing — we do not want the demo
 * or local dev builds to hard-fail requests without credentials.
 */
export async function verifyRecaptchaToken(
  token: string | null | undefined,
  expectedAction: string,
  secret: string | undefined = process.env.RECAPTCHA_SECRET_KEY,
): Promise<{ ok: boolean; score?: number }> {
  if (!secret) return { ok: true };
  if (!token) return { ok: false };

  const form = new URLSearchParams({ secret, response: token });

  try {
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as VerifyResponse;
    if (!data.success) return { ok: false };
    if (data.action && data.action !== expectedAction) return { ok: false };
    const score = typeof data.score === "number" ? data.score : undefined;
    if (score !== undefined && score < RECAPTCHA_MIN_SCORE) {
      return { ok: false, score };
    }
    return { ok: true, score };
  } catch {
    // Network failure → fail closed.
    return { ok: false };
  }
}
