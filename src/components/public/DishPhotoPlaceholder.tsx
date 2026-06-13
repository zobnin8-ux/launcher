export function dishCategoryIcon(categoryName: string, tags: string[] = []): string {
  const haystack = `${categoryName} ${tags.join(" ")}`.toLowerCase();

  if (/pizza|пиц/.test(haystack)) return "🍕";
  if (/grill|грил|steak|стейк|bbq|мяс/.test(haystack)) return "🥩";
  if (/salad|салат/.test(haystack)) return "🥗";
  if (/soup|суп/.test(haystack)) return "🍲";
  if (/dessert|десерт|cake|торт/.test(haystack)) return "🍰";
  if (/drink|напит|coffee|кофе|wine|вино/.test(haystack)) return "🥤";
  if (/fish|рыб|seafood|мореп/.test(haystack)) return "🐟";
  if (/burger|бург/.test(haystack)) return "🍔";
  if (/pasta|паст/.test(haystack)) return "🍝";
  if (/vegetarian|vegan|овощ/.test(haystack)) return "🥬";

  return "🍽";
}

export function DishPhotoPlaceholder({
  categoryName,
  tags,
  size = "md",
}: {
  categoryName?: string;
  tags?: string[];
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "w-full aspect-[4/3] text-5xl rounded-2xl"
      : size === "sm"
        ? "w-14 h-14 text-lg"
        : "w-16 h-16 text-xl";

  return (
    <div
      className={`${sizeClass} rounded-lg shrink-0 flex items-center justify-center bg-[var(--accent)]/10 text-[var(--accent)]`}
      aria-hidden
    >
      {dishCategoryIcon(categoryName ?? "", tags)}
    </div>
  );
}
