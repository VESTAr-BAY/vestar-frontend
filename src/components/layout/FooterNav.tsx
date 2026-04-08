import { useLocation, useNavigate } from "react-router";
import { useLanguage } from "../../providers/LanguageProvider";
import type { ScrollState } from "../../hooks/useScrollDirection";

interface NavItem {
  labelKey: "nav_home" | "nav_my";
  path: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: "nav_home",
    path: "/vote",
    icon: (active) => (
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    labelKey: "nav_my",
    path: "/mypage",
    icon: (active) => (
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

const STATE_CLASSES: Record<ScrollState, string> = {
  default:
    "bottom-0 w-full max-w-[430px] h-16 bg-[#13141A] border-t border-white/[0.07]",
  hidden:
    "-bottom-[74px] w-full max-w-[430px] h-16 bg-[#13141A] border-t border-white/[0.07]",
  floating:
    "bottom-[10px] w-[calc(100%-32px)] max-w-[calc(430px-32px)] h-[52px] rounded-2xl bg-[#1C2033] border border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.35),0_-2px_8px_rgba(0,0,0,0.25)]",
};

interface FooterNavProps {
  scrollState: ScrollState;
}

export function FooterNav({ scrollState }: FooterNavProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLanguage();

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-[100] flex items-center justify-around transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${STATE_CLASSES[scrollState]}`}
    >
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.path ||
          (item.path === "/vote" && pathname.startsWith("/vote"));
        return (
          <button
            key={item.labelKey}
            type="button"
            onClick={() => navigate(item.path)}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 bg-transparent border-none cursor-pointer transition-colors ${active ? "text-[#7140FF]" : scrollState === "hidden" ? "text-white/30" : "text-[#13141A]/30"}`}
          >
            {item.icon(active)}
            <span className="text-[10px] font-medium tracking-[-0.1px]">
              {t(item.labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
