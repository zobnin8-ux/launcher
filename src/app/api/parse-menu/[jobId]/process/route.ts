import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: job } = await supabase
    .from("parse_jobs")
    .select("id, status, restaurant_id")
    .eq("id", jobId)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", job.restaurant_id)
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (job.status === "done") {
    return NextResponse.json({ status: "done" });
  }

  if (job.status === "error") {
    const { data: failed } = await supabase
      .from("parse_jobs")
      .select("error_message")
      .eq("id", jobId)
      .single();
    return NextResponse.json(
      { status: "error", error: failed?.error_message ?? "Parsing failed" },
      { status: 500 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY not set on Vercel. Add it in Environment Variables and redeploy.",
      },
      { status: 500 }
    );
  }

  try {
    const { processParseJob } = await import("@/lib/ai/process-parse-job");
    await processParseJob(jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parsing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: result } = await supabase
    .from("parse_jobs")
    .select("status, error_message")
    .eq("id", jobId)
    .single();

  if (result?.status === "done") {
    return NextResponse.json({ status: "done" });
  }

  return NextResponse.json(
    {
      status: "error",
      error: result?.error_message ?? "Parsing failed",
    },
    { status: 500 }
  );
}
