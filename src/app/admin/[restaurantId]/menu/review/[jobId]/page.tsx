import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewEditor } from "@/components/admin/ReviewEditor";
import { getParseJob, getRestaurantById } from "@/lib/data/restaurants";
import type { ParseResult } from "@/lib/types/database";

export default async function ReviewPage({
  params,
}: {
  params: { restaurantId: string; jobId: string };
}) {
  const { restaurantId, jobId } = params;
  const restaurant = await getRestaurantById(restaurantId);
  if (!restaurant) notFound();

  const job = await getParseJob(jobId);
  if (!job || job.restaurant_id !== restaurantId) notFound();

  if (job.status !== "done" || !job.result) {
    return (
      <div>
        <Link href={`/admin/${restaurantId}/menu`} className="text-sm text-orange-600 hover:underline">
          ← Menu editor
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Review parsed menu</h1>
        <p className="mt-4 text-gray-500">
          {job.status === "processing" || job.status === "pending"
            ? "Still processing… refresh in a moment."
            : job.error_message ?? "Parsing failed."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/admin/${restaurantId}/menu`} className="text-sm text-orange-600 hover:underline">
        ← Menu editor
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Review parsed menu</h1>
      <p className="text-gray-500 text-sm mb-8">{restaurant.name}</p>

      <ReviewEditor
        restaurantId={restaurantId}
        jobId={jobId}
        initialResult={job.result as ParseResult}
      />
    </div>
  );
}
