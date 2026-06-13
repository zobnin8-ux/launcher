import Link from "next/link";
import { notFound } from "next/navigation";
import { MenuEditor } from "@/components/admin/MenuEditor";
import { PublicSiteCard } from "@/components/admin/PublicSiteCard";
import { WhatsNextBanner } from "@/components/admin/WhatsNextBanner";
import { getAdminMenuTree, getRestaurantById } from "@/lib/data/restaurants";
import { ensureDefaultMenu } from "@/actions/menu";

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: { restaurantId: string };
  searchParams: { imported?: string };
}) {
  const { restaurantId } = params;
  const restaurant = await getRestaurantById(restaurantId);
  if (!restaurant) notFound();

  await ensureDefaultMenu(restaurantId);
  const menus = await getAdminMenuTree(restaurantId);
  const showWhatsNext = searchParams.imported === "1";

  return (
    <div>
      <Link
        href={`/admin/${restaurantId}`}
        className="text-sm text-orange-600 hover:underline"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Menu editor</h1>
      <p className="text-gray-500 text-sm mb-4">{restaurant.name}</p>

      {showWhatsNext && (
        <WhatsNextBanner
          restaurantId={restaurantId}
          isPublished={restaurant.is_published}
        />
      )}

      <PublicSiteCard slug={restaurant.slug} isPublished={restaurant.is_published} />

      <MenuEditor
        restaurantId={restaurantId}
        currency={restaurant.currency}
        initialMenus={menus}
      />
    </div>
  );
}
