import { getAppUrl } from "@/lib/utils/app-url";
import { CopyButton } from "@/components/admin/CopyButton";

export function PublicSiteCard({
  slug,
  isPublished,
}: {
  slug: string;
  isPublished: boolean;
}) {
  const base = getAppUrl();
  const menuUrl = `${base}/m/${slug}/menu`;
  const siteUrl = `${base}/m/${slug}`;

  if (!isPublished) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="font-medium text-amber-900">Your site is not published yet</p>
        <p className="text-sm text-amber-800 mt-1">
          Turn on <strong>Published</strong> in Settings to make your menu public.
        </p>
        <p className="text-xs text-amber-700 mt-2 font-mono break-all">
          Future menu URL: {menuUrl}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
      <p className="font-medium text-green-900 mb-2">Public links</p>
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <span className="text-gray-600">Menu: </span>
            <a
              href={menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline break-all font-medium"
            >
              {menuUrl}
            </a>
          </div>
          <CopyButton text={menuUrl} />
        </div>
        <div className="flex items-start gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <span className="text-gray-600">Home: </span>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline break-all"
            >
              {siteUrl}
            </a>
          </div>
          <CopyButton text={siteUrl} />
        </div>
      </div>
    </div>
  );
}
