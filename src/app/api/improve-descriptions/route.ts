import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, items } = await request.json();

    if (!restaurantId || !items?.length) {
      return NextResponse.json(
        { error: "Add menu items first, then try again." },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not set on Vercel." },
        { status: 500 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("id", restaurantId)
      .eq("owner_id", user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const { improveDescriptions } = await import("@/lib/ai/translate");
    const suggestions = await improveDescriptions(items);

    return NextResponse.json({ suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to improve descriptions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
