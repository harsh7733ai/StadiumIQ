"use client";

import { Navigation } from "lucide-react";
import { directionsUrl, DEMO_VENUE } from "@/lib/google/maps";
import { trackEvent } from "@/lib/firebase/analytics";
import { trackGtagEvent } from "@/lib/google/gtag";

export function VenueDirections() {
  const url = directionsUrl(DEMO_VENUE, "driving");

  function handleClick(): void {
    void trackEvent("venue_directions_opened", { mode: "driving" });
    trackGtagEvent("venue_directions_opened", { mode: "driving" });
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="flex items-center gap-2 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
      aria-label={`Open directions to ${DEMO_VENUE.name} in Google Maps`}
    >
      <Navigation className="w-3.5 h-3.5" />
      Directions to {DEMO_VENUE.name}
    </a>
  );
}
