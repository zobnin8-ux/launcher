import { LoginForm } from "@/components/admin/LoginForm";
import Link from "next/link";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
        <Link href="/" className="text-orange-600 font-bold text-lg">
          Restaurant Launch Kit
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-gray-500 text-sm">Manage your restaurant menus</p>
        <div className="mt-8">
          {searchParams.error && (
            <p className="mb-4 text-sm text-red-600">
              Authentication failed. Please try again.
            </p>
          )}
          <LoginForm redirectTo={searchParams.redirect} />
        </div>
      </div>
    </div>
  );
}
