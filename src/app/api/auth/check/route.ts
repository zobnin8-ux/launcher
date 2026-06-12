import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !anon && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    !service && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return NextResponse.json({
      ok: false,
      missing,
      hint: "Add these in Vercel → Settings → Environment Variables, then Redeploy.",
    });
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anon!, Authorization: `Bearer ${anon!}` },
    });

    return NextResponse.json({
      ok: res.ok,
      supabaseUrl: url,
      anonKeySet: !!anon,
      anonKeyPrefix: anon!.slice(0, 12) + "...",
      healthStatus: res.status,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Cannot reach Supabase",
      supabaseUrl: url,
    });
  }
}
