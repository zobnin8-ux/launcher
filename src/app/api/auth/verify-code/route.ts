import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { email, code } = await request.json();

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code required" }, { status: 400 });
  }

  const cookieStore = cookies();
  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: String(code).trim(),
    type: "email",
  });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 400 }
    );
  }

  return response;
}
