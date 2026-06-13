import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSiteCard } from "@/components/admin/PublicSiteCard";
import { getEventCounts, getRestaurantById } from "@/lib/data/restaurants";

export default async function RestaurantDashboard({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { restaurantId } = params;
  const restaurant = await getRestaurantById(restaurantId);
  if (!restaurant) notFound();

  const stats7 = await getEventCounts(restaurantId, 7);
  const stats30 = await getEventCounts(restaurantId, 30);

  const nav = [
    { href: `/admin/${restaurantId}/menu`, label: "Menu editor", desc: "Edit categories and dishes" },
    { href: `/admin/${restaurantId}/qr`, label: "QR code", desc: "Generate and download QR" },
    { href: `/admin/${restaurantId}/settings`, label: "Settings", desc: "Contacts, theme, publishing" },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/admin" className="text-sm text-orange-600 hover:underline">
            ← All restaurants
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{restaurant.name}</h1>
        </div>
      </div>

      <PublicSiteCard slug={restaurant.slug} isPublished={restaurant.is_published} />

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <StatCard title="Menu views (7 days)" value={stats7.menu_view} />
        <StatCard title="QR scans (7 days)" value={stats7.qr_scan} />
        <StatCard title="Menu views (30 days)" value={stats30.menu_view} />
        <StatCard title="QR scans (30 days)" value={stats30.qr_scan} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block bg-white rounded-xl border p-5 hover:border-orange-300 transition-colors"
          >
            <h2 className="font-semibold">{item.label}</h2>
            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
