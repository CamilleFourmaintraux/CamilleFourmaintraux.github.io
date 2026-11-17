import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { scrollToAnchor } from "@/lib/navigation";

type Props = { items: { id: string; label: string }[] };

/** In-page navigation that follows the reading position. */
export default function SectionNav({ items }: Props) {
  const { t } = useTranslation();
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const sections = items
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      // A section becomes current when it crosses the upper third of the screen.
      { rootMargin: "-25% 0px -70% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="section-nav" aria-label={t("ui.sectionNav")}>
      <ul>
        {items.map(({ id, label }) => (
          <li key={id}>
            <Link
              to={{ hash: `#${id}` }}
              replace
              aria-current={active === id ? "location" : undefined}
              // Also scrolls when the address already points to this section.
              onClick={() => scrollToAnchor(id)}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
