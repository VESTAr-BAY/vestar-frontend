import { useNavigate, useSearchParams } from "react-router";
import { useAccount } from "wagmi";
import keyboardArrowLeft from "../../assets/keyboard_arrow_left.svg";
import { useLanguage } from "../../providers/LanguageProvider";
import { useMyKarma } from "../../hooks/user/useMyKarma";
import { useMyVotes } from "../../hooks/user/useMyVotes";
import type {
  BadgeVariant,
  KarmaEventType,
  KarmaEvent,
  MyVoteItem,
} from "../../types/user";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getKarmaTier(karma: number): {
  label: string;
  emoji: string;
  color: string;
} {
  if (karma >= 100000000)
    return { label: "Legendary", emoji: "👑", color: "#F59E0B" };
  if (karma >= 5000000)
    return { label: "S-Tier", emoji: "💎", color: "#22d3ee" };
  if (karma >= 500000)
    return { label: "High-Throughput", emoji: "🚀", color: "#06b6d4" };
  if (karma >= 100000)
    return { label: "Pro User", emoji: "💫", color: "#818cf8" };
  if (karma >= 20000)
    return { label: "Power User", emoji: "🔥", color: "#f97316" };
  if (karma >= 5000) return { label: "Regular", emoji: "⭐", color: "#eab308" };
  if (karma >= 500) return { label: "Active", emoji: "🟣", color: "#7140FF" };
  if (karma >= 50) return { label: "Basic", emoji: "🔵", color: "#3b82f6" };
  if (karma >= 2) return { label: "Newbie", emoji: "🌱", color: "#22c55e" };
  if (karma >= 1) return { label: "Entry", emoji: "⚡", color: "#9CA3AF" };
  return { label: "—", emoji: "·", color: "#707070" };
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  live: "bg-[rgba(34,197,94,0.12)] text-[#16a34a]",
  hot: "bg-[rgba(239,68,68,0.10)] text-[#dc2626]",
  new: "bg-[rgba(113,64,255,0.09)] text-[#7140FF]",
  end: "bg-black/5 text-[#707070]",
};

const KARMA_TYPE_STYLES: Record<KarmaEventType, { bg: string; text: string }> =
  {
    vote: { bg: "#F0EDFF", text: "#7140FF" },
    referral: { bg: "#E8FFF0", text: "#16a34a" },
    bonus: { bg: "#FFF5E8", text: "#d97706" },
    streak: { bg: "#E8F0FF", text: "#2563eb" },
  };

function VoteHistoryList({ votes }: { votes: MyVoteItem[] }) {
  const { t, lang } = useLanguage();
  const badgeLabel: Record<BadgeVariant, string> = {
    live: "● LIVE",
    hot: "🔥 HOT",
    new: "NEW",
    end: lang === "ko" ? "종료" : "END",
  };

  if (votes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-5xl">🗳️</span>
        <p className="text-[14px] text-[#707070]">{t("mp_no_votes")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[10px] px-4 py-4">
      {votes.map((item) => (
        <div
          key={item.id}
          className="bg-white border border-[#E7E9ED] rounded-2xl p-4 flex items-center gap-[14px]"
        >
          <div
            className="w-[48px] h-[48px] rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "#F0EDFF" }}
          >
            {item.choiceEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-[#707070] font-mono mb-[2px] truncate">
              {item.org}
            </div>
            <div className="text-[14px] font-semibold text-[#090A0B] mb-1 truncate leading-[1.35]">
              {item.title}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-[#707070]">
                {t("mp_voted_label")} {item.choice}
              </span>
              <span className="text-[#E7E9ED]">·</span>
              <span className="text-[12px] text-[#707070]">{item.date}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-[6px] flex-shrink-0">
            <span
              className={`text-[9px] font-bold font-mono px-2 py-[3px] rounded-[10px] tracking-[0.4px] uppercase ${BADGE_STYLES[item.badge]}`}
            >
              {badgeLabel[item.badge]}
            </span>
            <span className="text-[12px] font-semibold text-[#7140FF] font-mono">
              +{item.karmaEarned} ⚡
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function KarmaHistoryList({
  events,
  total,
}: {
  events: KarmaEvent[];
  total: number;
}) {
  const { t } = useLanguage();

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-5xl">⚡</span>
        <p className="text-[14px] text-[#707070]">{t("mp_no_karma")}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* Total summary */}
      <div className="bg-white border border-[#E7E9ED] rounded-2xl px-4 py-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-[#707070] mb-1">
            {t("mp_total_karma_stat")}
          </div>
          <div className="text-[24px] font-bold text-[#7140FF] font-mono">
            {total.toLocaleString()} ⚡
          </div>
        </div>
        <div className="text-4xl">🏆</div>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-[8px]">
        {events.map((event) => {
          const style = KARMA_TYPE_STYLES[event.type];
          return (
            <div
              key={event.id}
              className="bg-white border border-[#E7E9ED] rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: style.bg }}
              >
                {event.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#090A0B] leading-[1.35] truncate">
                  {event.label}
                </div>
                <div className="text-[11px] text-[#707070] mt-[2px]">
                  {event.date}
                </div>
              </div>
              <span
                className="text-[15px] font-bold font-mono flex-shrink-0"
                style={{ color: style.text }}
              >
                +{event.karma}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MyPage() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "karma" ? "karma" : "votes";
  const { t } = useLanguage();

  const { votes } = useMyVotes();
  const { events, total } = useMyKarma();
  const tier = getKarmaTier(total);

  return (
    <div className="min-h-screen pb-24">
      {/* Header strip */}
      {/* 페이지 궁성 좀 더 풍성하게 할만한 것들 채워주기 */}
      <div className="h-60 relative px-5 pb-6 pt-[calc(56px+20px)] -mt-14 bg-gradient-to-r from-[#EBFBFA] to-[#F2E9FB] overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7140FF] to-transparent" />

        <div className="text-[10px] font-semibold text-[#7140FF] tracking-[1.2px] uppercase font-mono mb-1.5">
          My Page
        </div>
        <div className="text-[20px] font-semibold text-[#090A0B] leading-tight truncate">
          {isConnected && address
            ? truncateAddress(address)
            : t("pp_not_connected")}
        </div>
        <div className="flex items-center gap-2 mt-[4px]">
          <span className="text-[18px]">{tier.emoji}</span>
          <span
            className="text-[15px] font-bold font-mono"
            style={{ color: tier.color }}
          >
            {tier.label}
          </span>
          <span className="text-[12px] text-[#13141A]/40 font-mono">
            {total.toLocaleString()} ⚡
          </span>
        </div>
      </div>

      {/* Tab bar */}
      {/* karma history 지워주기 */}
      {/* emoji들 다 지우고 default image setting한 걸 불러오거나 그냥 contract에서 내가 참여한 vote들 목록 불러오기를 하면 될 듯 */}
      <div className="bg-white border-b border-[#E7E9ED] flex">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: "votes" })}
          className={`flex-1 py-3 text-[14px] font-semibold transition-colors ${
            tab === "votes"
              ? "text-[#7140FF] border-b-2 border-[#7140FF]"
              : "text-[#707070] border-b-2 border-transparent"
          }`}
        >
          {t("mp_tab_votes")}
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: "karma" })}
          className={`flex-1 py-3 text-[14px] font-semibold transition-colors ${
            tab === "karma"
              ? "text-[#7140FF] border-b-2 border-[#7140FF]"
              : "text-[#707070] border-b-2 border-transparent"
          }`}
        >
          {t("mp_tab_karma")}
        </button>
      </div>

      {/* Tab content */}
      <div className="bg-[#ffffff] min-h-screen">
        {tab === "votes" ? (
          <VoteHistoryList votes={votes} />
        ) : (
          <KarmaHistoryList events={events} total={total} />
        )}
      </div>
    </div>
  );
}
