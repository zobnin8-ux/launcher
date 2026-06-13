import Link from "next/link";

export function UnpublishedBanner({ restaurantId }: { restaurantId: string }) {
  return (
    <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-900">
      Your site is not published yet.{" "}
      <Link
        href={`/admin/${restaurantId}/settings`}
        className="font-medium text-orange-600 hover:underline"
      >
        Publish in Settings
      </Link>
    </div>
  );
}
