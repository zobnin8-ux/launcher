import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase env vars missing on server. Redeploy Vercel." },
      { status: 500 }
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_PROD_APP_URL ??
    process.env.NEXT_PUBLIC_DEV_APP_URL ??
    "https://launcher-black.vercel.app";

  const supabase = createClient(url, key);

  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${appUrl}/auth/confirm?type=email&next=/admin`,
    },
  });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        status: error.status,
        code: error.code,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Code sent. Check inbox and spam.",
    data,
  });
}
