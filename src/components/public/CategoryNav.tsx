"use client";

import { useEffect, useRef, useState } from "react";

export function CategoryNav({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!categories.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id.replace("cat-", ""));
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
    );

    for (const cat of categories) {
      const el = document.getElementById(`cat-${cat.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [categories]);

  function scrollTo(id: string) {
    const el = document.getElementById(`cat-${id}`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    setActiveId(id);

    const chip = navRef.current?.querySelector(`[data-cat="${id}"]`);
    chip?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  if (categories.length <= 1) return null;

  return (
    <nav
      ref={navRef}
      className="sticky top-[57px] z-10 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-rule)]"
      aria-label="Categories"
    >
      <div className="max-w-[640px] mx-auto px-5 py-2 flex gap-5 overflow-x-auto scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            data-cat={cat.id}
            onClick={() => scrollTo(cat.id)}
            className={`category-nav-chip ${activeId === cat.id ? "active" : ""}`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </nav>
  );
}
