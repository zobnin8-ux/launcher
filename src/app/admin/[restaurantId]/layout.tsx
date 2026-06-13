import { notFound } from "next/navigation";
import { UnpublishedBanner } from "@/components/admin/UnpublishedBanner";
import { getRestaurantById } from "@/lib/data/restaurants";

export default async function RestaurantAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { restaurantId: string };
}) {
  const restaurant = await getRestaurantById(params.restaurantId);
  if (!restaurant) notFound();

  return (
    <div>
      {!restaurant.is_published && (
        <UnpublishedBanner restaurantId={params.restaurantId} />
      )}
      {children}
    </div>
  );
}
