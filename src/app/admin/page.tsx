import Link from "next/link";
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
            <Link
              key={r.id}
              href={`/admin/${r.id}`}
              className="block bg-white rounded-xl border p-5 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{r.name}</h2>
                  <p className="text-sm text-gray-500">{r.cuisine ?? "Restaurant"}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    r.is_published
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {r.is_published ? "Published" : "Draft"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
