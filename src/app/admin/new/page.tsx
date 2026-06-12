import { createRestaurant } from "@/actions/restaurants";
import Link from "next/link";

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

      <form action={createRestaurant} className="mt-8 space-y-4 bg-white rounded-xl border p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Restaurant name *
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full border rounded-lg px-3 py-2"
            placeholder="The Golden Fork"
          />
        </div>
        <div>
          <label htmlFor="cuisine" className="block text-sm font-medium mb-1">
            Cuisine
          </label>
          <input
            id="cuisine"
            name="cuisine"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Italian, Mexican, etc."
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-1">
            Address
          </label>
          <input
            id="address"
            name="address"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="123 Main St, City"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone
            </label>
            <input id="phone" name="phone" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input id="email" name="email" type="email" className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="currency" className="block text-sm font-medium mb-1">
              Currency
            </label>
            <input id="currency" name="currency" defaultValue="USD" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label htmlFor="locales" className="block text-sm font-medium mb-1">
              Languages
            </label>
            <input id="locales" name="locales" defaultValue="en" className="w-full border rounded-lg px-3 py-2" placeholder="en, es" />
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
        >
          Create restaurant
        </button>
      </form>
    </div>
  );
}
