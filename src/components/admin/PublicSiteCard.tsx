import { getAppUrl } from "@/lib/utils/app-url";

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
        <p className="font-medium text-amber-900">Сайт ещё не опубликован</p>
        <p className="text-sm text-amber-800 mt-1">
          Откройте Settings → включите Published → сохраните.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
      <p className="font-medium text-green-900 mb-2">Публичные ссылки</p>
      <div className="space-y-2 text-sm">
        <p>
          <span className="text-gray-600">Меню: </span>
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:underline break-all font-medium"
          >
            {menuUrl}
          </a>
        </p>
        <p>
          <span className="text-gray-600">Главная: </span>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:underline break-all"
          >
            {siteUrl}
          </a>
        </p>
      </div>
    </div>
  );
}
