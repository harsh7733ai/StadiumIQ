"use client";

import { useEffect } from "react";
import { startSimulation } from "@/lib/mock/generator";
import { PoisSchema } from "@/lib/schemas/poi";
import rawPois from "@/public/venue/pois.json";

const pois = PoisSchema.parse(rawPois);

export function MockSimulationBoot() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") {
      startSimulation(pois);
    }
  }, []);

  return null;
}
