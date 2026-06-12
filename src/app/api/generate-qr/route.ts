import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { restaurantId } = await request.json();
  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("id", restaurantId)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const targetUrl = `${appUrl}/m/${restaurant.slug}/menu?src=qr`;

  const pngBuffer = await QRCode.toBuffer(targetUrl, {
    width: 1024,
    margin: 2,
    type: "png",
  });

  const svgString = await QRCode.toString(targetUrl, {
    type: "svg",
    width: 1024,
    margin: 2,
  });

  const pngPath = `${user.id}/${restaurantId}/qr.png`;
  const svgPath = `${user.id}/${restaurantId}/qr.svg`;

  const { error: pngError } = await supabase.storage
    .from("qr-codes")
    .upload(pngPath, pngBuffer, { upsert: true, contentType: "image/png" });

  if (pngError) {
    return NextResponse.json({ error: pngError.message }, { status: 500 });
  }

  await supabase.storage
    .from("qr-codes")
    .upload(svgPath, new Blob([svgString], { type: "image/svg+xml" }), {
      upsert: true,
      contentType: "image/svg+xml",
    });

  const {
    data: { publicUrl: pngUrl },
  } = supabase.storage.from("qr-codes").getPublicUrl(pngPath);

  const {
    data: { publicUrl: svgUrl },
  } = supabase.storage.from("qr-codes").getPublicUrl(svgPath);

  const { data: qr, error } = await supabase
    .from("qr_codes")
    .insert({
      restaurant_id: restaurantId,
      target_url: targetUrl,
      file_url: pngUrl,
      svg_url: svgUrl,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(qr);
}
