import Link from "next/link";
import { RestaurantCard } from "@/components/admin/RestaurantCard";
import { getOwnerRestaurants } from "@/lib/data/restaurants";

export default async function AdminPage() {
  const restaurants = await getOwnerRestaurants();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your restaurants</h1>
        <Link
          href="/admin/new"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
        >
          + New restaurant
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-500 mb-4">No restaurants yet.</p>
          <Link
            href="/admin/new"
            className="text-orange-600 font-medium hover:underline"
          >
            Create your first restaurant →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}
