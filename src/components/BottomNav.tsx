import { NavLink } from "react-router-dom";
import { Compass, House, Search, Settings } from "lucide-react";
import { useI18n } from "../i18n";
import type { StringKey } from "../i18n/en";

const ITEMS: { to: string; label: StringKey; Icon: typeof House }[] = [
  { to: "/", label: "nav.home", Icon: House },
  { to: "/search", label: "nav.search", Icon: Search },
  { to: "/explore", label: "nav.explore", Icon: Compass },
  { to: "/settings", label: "nav.settings", Icon: Settings },
];

export default function BottomNav() {
  const { t } = useI18n();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-sheet/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[0.72rem] font-medium transition-colors ${
                  isActive ? "text-moss" : "text-ink-soft hover:text-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-8 w-14 place-items-center rounded-full ${isActive ? "bg-moss/10" : ""}`}>
                    <Icon size={21} strokeWidth={isActive ? 2.3 : 1.8} aria-hidden />
                  </span>
                  {t(label)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
