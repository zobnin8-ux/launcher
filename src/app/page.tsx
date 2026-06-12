import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <header className="max-w-5xl mx-auto px-4 py-6 flex justify-between items-center">
        <span className="font-bold text-xl text-orange-700">Restaurant Launch Kit</span>
        <Link
          href="/login"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
        >
          Sign in
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
          Your menu, live on the web
          <span className="block text-orange-600">in minutes</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your existing menu or build from scratch. Get a beautiful mobile-first
          website, QR code, and admin panel — powered by structured data, not PDFs.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 text-lg"
          >
            Get started free
          </Link>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8 text-left">
          <Feature
            title="Upload & parse"
            description="Drop a PDF or photo of your menu. AI extracts categories, dishes, and prices for you to review."
          />
          <Feature
            title="Mobile-first menu"
            description="Customers scan a QR code and browse your menu on any phone. No app download needed."
          />
          <Feature
            title="Multi-language"
            description="Serve tourists and locals with automatic translations in your chosen languages."
          />
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        Restaurant Launch Kit — MVP
      </footer>
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
      <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
