import Link from "next/link";

export function WhatsNextBanner({
  restaurantId,
  isPublished,
}: {
  restaurantId: string;
  isPublished: boolean;
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 space-y-4">
      <h2 className="font-semibold text-blue-900">What&apos;s next?</h2>
      <ol className="space-y-3 text-sm">
        <li className="flex gap-2">
          <span className="text-green-600 font-bold">✓</span>
          <span>Review your menu — imported successfully</span>
        </li>
        <li className="flex gap-2 items-start">
          <span className={isPublished ? "text-green-600 font-bold" : "text-gray-400"}>
            {isPublished ? "✓" : "2."}
          </span>
          <span>
            {isPublished ? (
              "Publish your site — done"
            ) : (
              <>
                Publish your site →{" "}
                <Link
                  href={`/admin/${restaurantId}/settings`}
                  className="text-orange-600 hover:underline font-medium"
                >
                  Settings → Published
                </Link>
              </>
            )}
          </span>
        </li>
        <li className="flex gap-2 items-start">
          <span className="text-gray-400">3.</span>
          <span>
            Download your QR code →{" "}
            <Link
              href={`/admin/${restaurantId}/qr`}
              className="text-orange-600 hover:underline font-medium"
            >
              QR page
            </Link>
          </span>
        </li>
      </ol>
    </div>
  );
}
