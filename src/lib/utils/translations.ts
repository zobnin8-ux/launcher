import type { Translation } from "@/lib/types/database";

export function getTranslatedField(
  translations: Translation[],
  entityId: string,
  field: string,
  locale: string,
  fallback: string
): string {
  const t = translations.find(
    (tr) => tr.entity_id === entityId && tr.field === field && tr.locale === locale
  );
  return t?.value ?? fallback;
}

export function applyTranslations<T extends { id: string; name: string; description?: string | null }>(
  entity: T,
  translations: Translation[],
  locale: string
): T {
  return {
    ...entity,
    name: getTranslatedField(translations, entity.id, "name", locale, entity.name),
    description: entity.description
      ? getTranslatedField(
          translations,
          entity.id,
          "description",
          locale,
          entity.description
        )
      : translations.find(
          (tr) =>
            tr.entity_id === entity.id &&
            tr.field === "description" &&
            tr.locale === locale
        )?.value ?? entity.description,
  };
}
