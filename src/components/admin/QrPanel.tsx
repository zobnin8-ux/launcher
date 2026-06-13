"use client";

import { useState } from "react";
import type { QrCode } from "@/lib/types/database";
import { CopyButton } from "@/components/admin/CopyButton";
import { getAppUrl } from "@/lib/utils/app-url";

export function QrPanel({
  restaurantId,
  initialQr,
  menuSlug,
}: {
  restaurantId: string;
  initialQr: QrCode | null;
  menuSlug: string;
}) {
  const [qr, setQr] = useState(initialQr);
  const [loading, setLoading] = useState(false);
  const menuUrl = `${getAppUrl()}/m/${menuSlug}/menu`;

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/generate-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setQr(data);
  }

  return (
    <div className="space-y-6 max-w-md">
      <p className="text-gray-600">
        Generate a QR code that links directly to your public menu.
      </p>

      <div className="flex items-start gap-2 text-sm bg-gray-50 border rounded-lg p-3">
        <p className="flex-1 break-all font-mono text-gray-700">{menuUrl}</p>
        <CopyButton text={menuUrl} />
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
      >
        {loading ? "Generating…" : qr ? "Regenerate QR code" : "Generate QR code"}
      </button>

      {qr && (
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.file_url} alt="QR Code" className="w-64 h-64 mx-auto border rounded-lg" />
          <p className="text-sm text-gray-500 text-center break-all">{qr.target_url}</p>
          <div className="flex gap-3 justify-center">
            <a
              href={qr.file_url}
              download="menu-qr.png"
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              Download PNG
            </a>
            {qr.svg_url && (
              <a
                href={qr.svg_url}
                download="menu-qr.svg"
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Download SVG
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
