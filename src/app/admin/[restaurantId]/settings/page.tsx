import Link from "next/link";
import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getRestaurantById } from "@/lib/data/restaurants";

export default async function SettingsPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { restaurantId } = params;
  const restaurant = await getRestaurantById(restaurantId);
  if (!restaurant) notFound();

  return (
    <div>
      <Link href={`/admin/${restaurantId}`} className="text-sm text-orange-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Settings</h1>
      <p className="text-gray-500 text-sm mb-8">{restaurant.name}</p>

      <SettingsForm restaurant={restaurant} />
    </div>
  );
}
