/**
 * Google Maps helpers.
 *
 * StadiumIQ uses a hand-traced venue SVG for the in-building crowd
 * heatmap — Google Maps is the *wrong* tool for indoor navigation at
 * POI granularity. But fans often want to know how to get TO the venue
 * from wherever they are, so we surface a deep link to Google Maps
 * Directions with the venue's geocoded address.
 *
 * This file also exposes a Places API helper for the roadmap
 * "find parking / nearby hotels" experience — not yet wired to UI.
 */

/** Venue geocoded coordinates + postal address for deep-linking. */
export interface VenueLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

/**
 * Build a Google Maps directions URL that launches the native app on
 * mobile and the web view on desktop.
 *
 * @example
 *   directionsUrl(venue, "driving")
 *   → "https://www.google.com/maps/dir/?api=1&destination=..."
 */
export function directionsUrl(
  venue: VenueLocation,
  mode: "driving" | "walking" | "transit" | "bicycling" = "driving",
): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${venue.lat},${venue.lng}`,
    travelmode: mode,
  });
  if (venue.placeId) params.set("destination_place_id", venue.placeId);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * A bare search URL — handy when the venue has no geocoded coords yet
 * but has a searchable name.
 */
export function searchUrl(query: string): string {
  const params = new URLSearchParams({ api: "1", query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/**
 * An embeddable iframe URL for the venue's location. Falls back to the
 * address if coords are missing. Requires NEXT_PUBLIC_GOOGLE_MAPS_KEY
 * to be set on the caller's env; the URL works without it but with a
 * "development only" watermark.
 */
export function embedUrl(
  venue: VenueLocation,
  apiKey: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
): string {
  const base = "https://www.google.com/maps/embed/v1/place";
  const params = new URLSearchParams({
    key: apiKey ?? "",
    q: venue.placeId
      ? `place_id:${venue.placeId}`
      : `${venue.lat},${venue.lng}`,
  });
  return `${base}?${params.toString()}`;
}

/** Demo venue for the hackathon submission. */
export const DEMO_VENUE: VenueLocation = {
  name: "StadiumIQ Demo Arena",
  address: "Wankhede Stadium, Mumbai, Maharashtra 400020",
  lat: 18.9388,
  lng: 72.8258,
  placeId: "ChIJf9IZiA7O5zsR_zX4fVPRp60",
};
