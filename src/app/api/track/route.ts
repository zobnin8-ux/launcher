import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { restaurantId, eventType, metadata } = body;

  if (!restaurantId || !eventType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const allowed = ["menu_view", "item_view", "qr_scan"];
  if (!allowed.includes(eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("events").insert({
    restaurant_id: restaurantId,
    event_type: eventType,
    metadata: metadata ?? {},
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
