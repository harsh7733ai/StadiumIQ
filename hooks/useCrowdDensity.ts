"use client";

import { useEffect, useState } from "react";
import { subscribeToDensity, type DensityMap } from "@/lib/data/crowd";

export function useCrowdDensity(): DensityMap {
  const [densityMap, setDensityMap] = useState<DensityMap>({});

  useEffect(() => {
    const unsubscribe = subscribeToDensity((map) => {
      setDensityMap({ ...map });
    });
    return unsubscribe;
  }, []);

  return densityMap;
}
