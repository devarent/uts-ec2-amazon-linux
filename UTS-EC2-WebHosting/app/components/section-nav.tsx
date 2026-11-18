"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "roadmap", label: "Rencana" },
  { id: "arsitektur", label: "Arsitektur" },
  { id: "checklist", label: "Checklist" },
  { id: "konfigurasi", label: "Konfigurasi" },
  { id: "guestbook", label: "Database" },
  { id: "asisten", label: "Asisten" },
  { id: "referensi", label: "Referensi" },
  { id: "faq", label: "FAQ" },
];

export default function SectionNav() {
  const [active, setActive] = useState("roadmap");

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top,
          );
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <nav
        aria-label="Navigasi bagian panduan"
        className="scrollbar-thin mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8"
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? "location" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-3 text-xs font-medium transition-colors sm:text-[13px]",
              active === section.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
