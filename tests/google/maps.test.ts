import { describe, it, expect } from "vitest";
import {
  directionsUrl,
  searchUrl,
  embedUrl,
  DEMO_VENUE,
  type VenueLocation,
} from "@/lib/google/maps";

const venue: VenueLocation = {
  name: "Test Arena",
  address: "1 Test St, Test City, 00000",
  lat: 40.7484,
  lng: -73.9857,
  placeId: "test-place-id",
};

describe("lib/google/maps", () => {
  describe("directionsUrl", () => {
    it("builds a Google Maps directions URL with destination coords", () => {
      const url = directionsUrl(venue, "driving");
      expect(url).toContain("https://www.google.com/maps/dir/");
      expect(url).toContain("api=1");
      expect(url).toContain("destination=40.7484%2C-73.9857");
      expect(url).toContain("travelmode=driving");
    });

    it("includes destination_place_id when venue has placeId", () => {
      const url = directionsUrl(venue);
      expect(url).toContain("destination_place_id=test-place-id");
    });

    it("omits destination_place_id when placeId is absent", () => {
      const { placeId: _omit, ...withoutPlaceId } = venue;
      void _omit;
      const url = directionsUrl(withoutPlaceId);
      expect(url).not.toContain("destination_place_id");
    });

    it("defaults travelmode to driving", () => {
      const url = directionsUrl(venue);
      expect(url).toContain("travelmode=driving");
    });

    it.each(["walking", "transit", "bicycling"] as const)(
      "supports %s travel mode",
      (mode) => {
        const url = directionsUrl(venue, mode);
        expect(url).toContain(`travelmode=${mode}`);
      },
    );
  });

  describe("searchUrl", () => {
    it("builds a Google Maps search URL with url-encoded query", () => {
      const url = searchUrl("near me parking");
      expect(url).toContain("https://www.google.com/maps/search/");
      expect(url).toContain("query=near+me+parking");
    });

    it("url-encodes special characters", () => {
      const url = searchUrl("café & bar");
      expect(url).toContain("caf%C3%A9");
      expect(url).toContain("%26");
    });
  });

  describe("embedUrl", () => {
    it("uses placeId when available", () => {
      const url = embedUrl(venue, "test-key");
      expect(url).toContain("key=test-key");
      expect(url).toContain("q=place_id%3Atest-place-id");
    });

    it("falls back to lat/lng when placeId is absent", () => {
      const { placeId: _omit, ...withoutPlaceId } = venue;
      void _omit;
      const url = embedUrl(withoutPlaceId, "test-key");
      expect(url).toContain("q=40.7484%2C-73.9857");
    });

    it("produces a valid URL even without an API key", () => {
      const url = embedUrl(venue, undefined);
      expect(url).toContain("https://www.google.com/maps/embed/v1/place");
      expect(url).toContain("key=");
    });
  });

  describe("DEMO_VENUE", () => {
    it("has valid Mumbai coordinates", () => {
      expect(DEMO_VENUE.lat).toBeGreaterThan(18);
      expect(DEMO_VENUE.lat).toBeLessThan(20);
      expect(DEMO_VENUE.lng).toBeGreaterThan(72);
      expect(DEMO_VENUE.lng).toBeLessThan(73);
    });

    it("has all required fields", () => {
      expect(DEMO_VENUE.name).toBeTruthy();
      expect(DEMO_VENUE.address).toBeTruthy();
      expect(DEMO_VENUE.placeId).toBeTruthy();
    });
  });
});
