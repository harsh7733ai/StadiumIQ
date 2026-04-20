import Script from "next/script";
import { publicEnv } from "@/lib/env";

/**
 * Loads Google reCAPTCHA v3 when `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is
 * configured. The v3 widget is invisible — it silently scores user
 * interactions on the page and produces tokens that are attached to
 * concierge requests (see `getRecaptchaToken` in `lib/security/recaptcha`).
 *
 * Rendered from the root layout. No-op in demo mode (no site key), so
 * the base build has zero third-party network cost from this script.
 */
export function RecaptchaScript() {
  const siteKey = publicEnv.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return null;

  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
      strategy="afterInteractive"
    />
  );
}
