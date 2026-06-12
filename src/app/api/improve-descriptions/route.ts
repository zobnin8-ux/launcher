import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { restaurantId, items } = await request.json();

  if (!restaurantId || !items?.length) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { improveDescriptions } = await import("@/lib/ai/translate");
  const suggestions = await improveDescriptions(items);

  return NextResponse.json({ suggestions });
}
