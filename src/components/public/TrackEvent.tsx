"use client";

import { useEffect } from "react";

export function TrackEvent({
  restaurantId,
  eventType,
  metadata,
}: {
  restaurantId: string;
  eventType: "menu_view" | "item_view" | "qr_scan";
  metadata?: Record<string, unknown>;
}) {
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, eventType, metadata }),
    }).catch(() => {});
  }, [restaurantId, eventType, metadata]);

  return null;
}
