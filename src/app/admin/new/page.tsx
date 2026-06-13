import Link from "next/link";
import { NewRestaurantForm } from "@/components/admin/NewRestaurantForm";

export default function NewRestaurantPage() {
  return (
    <div className="max-w-lg">
      <Link href="/admin" className="text-sm text-orange-600 hover:underline">
        ← Back to restaurants
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Create restaurant</h1>
      <p className="mt-1 text-gray-500 text-sm">
        Tell us about your restaurant to get started.
      </p>

      <NewRestaurantForm />
    </div>
  );
}
