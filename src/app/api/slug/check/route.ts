import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidSlug } from "@/lib/utils/slug";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim().toLowerCase() ?? "";

  if (!isValidSlug(slug)) {
    return NextResponse.json({ available: false, slug, reason: "invalid" });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  return NextResponse.json({ available: !data, slug });
}
