"use client";

import { useEffect, useRef } from "react";

export function QrScanTracker({
  restaurantId,
  src,
}: {
  restaurantId: string;
  src?: string;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (src === "qr" && !tracked.current) {
      tracked.current = true;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, eventType: "qr_scan", metadata: { src } }),
      }).catch(() => {});
    }
  }, [restaurantId, src]);

  return null;
}
