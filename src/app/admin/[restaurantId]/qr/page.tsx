import Link from "next/link";
import { notFound } from "next/navigation";
import { QrPanel } from "@/components/admin/QrPanel";
import { getLatestQrCode, getRestaurantById } from "@/lib/data/restaurants";

export default async function QrPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { restaurantId } = params;
  const restaurant = await getRestaurantById(restaurantId);
  if (!restaurant) notFound();

  const qr = await getLatestQrCode(restaurantId);

  return (
    <div>
      <Link href={`/admin/${restaurantId}`} className="text-sm text-orange-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold">QR code</h1>
      <p className="text-gray-500 text-sm mb-8">{restaurant.name}</p>

      <QrPanel restaurantId={restaurantId} initialQr={qr} />
    </div>
  );
}
