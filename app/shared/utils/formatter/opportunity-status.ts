import type { OpportunityDetail } from "../../types/opportunity-detail.types";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export interface LiveStatus {
  variant: "open" | "soon" | "closed";
  message: string;
}

export interface SeasonalHighlight {
  season: "Spring" | "Summer" | "Autumn" | "Winter";
  highlight: string;
  tags: string[];
}

function getOpeningStatus(
  openingHours: OpportunityDetail["opening_hours"]
): { isOpen: boolean; message: string } | null {
  if (!openingHours) return null;

  const now = new Date();
  const currentDay = DAYS[now.getDay()]!;
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  const todayHours = openingHours[currentDay];

  if (todayHours?.open && todayHours?.close && currentTime >= todayHours.open && currentTime < todayHours.close) {
    return { isOpen: true, message: `Open Now – ${todayHours.close}` };
  }

  if (todayHours?.open && todayHours?.close && currentTime < todayHours.open) {
    return { isOpen: false, message: `Open Soon ${todayHours.open} – ${todayHours.close}` };
  }

  for (let i = 1; i <= 7; i++) {
    const nextDayIdx = (now.getDay() + i) % 7;
    const nextDayHours = openingHours[DAYS[nextDayIdx]!];
    if (nextDayHours?.open && nextDayHours?.close) {
      const label = i === 1 ? "Tomorrow" : DAY_LABELS[nextDayIdx];
      return { isOpen: false, message: `Open ${label} ${nextDayHours.open} – ${nextDayHours.close}` };
    }
  }

  return null;
}

/** Live open/closed status for any opportunity type — real data where available, deterministic fallback otherwise. */
export function resolveLiveStatus(opp: OpportunityDetail): LiveStatus {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = DAYS[now.getDay()]!;

  if (opp.opp_type === "venue") {
    const real = getOpeningStatus(opp.opening_hours);
    if (real) {
      return real.isOpen
        ? { variant: "open", message: real.message }
        : { variant: "soon", message: real.message };
    }
  }

  if (opp.opp_type === "club" && opp.club_availability) {
    const todaySlot = opp.club_availability[currentDay]?.[0] ?? null;
    if (todaySlot) {
      const [start, end] = todaySlot.split(/[-–]/).map((s) => s.trim());
      const currentTime = `${currentHour.toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      if (start && end && currentTime >= start && currentTime < end) {
        return { variant: "open", message: `Happening Now – ${end}` };
      }
      if (start && end && currentTime < start) {
        return { variant: "soon", message: `Starting Soon ${start} – ${end}` };
      }
      return { variant: "closed", message: "Closed Today" };
    }
  }

  if (opp.opp_type === "event" && opp.start_date) {
    const eventDate = new Date(opp.start_date);
    const isToday = eventDate.toDateString() === now.toDateString();
    if (isToday) {
      const todayTimes = opp.event_times?.[currentDay];
      if (todayTimes && todayTimes.length > 0) {
        return { variant: "soon", message: `Starting Soon ${todayTimes[0]}` };
      }
      return { variant: "soon", message: "Starting Today" };
    }
  }

  if (opp.opp_type === "route") {
    if (currentHour >= 6 && currentHour < 18) {
      return { variant: "open", message: "Open Now – dusk" };
    }
    return { variant: "soon", message: "Opens Soon 06:00" };
  }

  const hash = opp.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const bucket = hash % 3;
  if (bucket === 0) return { variant: "open", message: "Open Now – 17:00" };
  if (bucket === 1) return { variant: "soon", message: "Opens Soon 09:00 – 17:00" };
  return { variant: "closed", message: "Closed Today" };
}

/** Parses the current season's highlight out of a free-text seasonal_highlights string, plus matching seasonal tags. Routes only. */
export function resolveSeasonalHighlight(
  seasonalHighlights: string | null,
  seasonalTag: string[] | null
): SeasonalHighlight | null {
  if (!seasonalHighlights) return null;

  const month = new Date().getMonth();
  const currentSeason =
    month >= 2 && month <= 4 ? "spring" : month >= 5 && month <= 7 ? "summer" : month >= 8 && month <= 10 ? "autumn" : "winter";
  const seasonLabels: Record<string, SeasonalHighlight["season"]> = {
    spring: "Spring",
    summer: "Summer",
    autumn: "Autumn",
    winter: "Winter",
  };
  const seasonLabel = seasonLabels[currentSeason]!;

  const seasonRegex = new RegExp(`${seasonLabel}:\\s*([^.]+\\.?)`, "i");
  const match = seasonalHighlights.match(seasonRegex);
  const highlight = match ? match[1]!.trim() : seasonalHighlights;

  const tags = (seasonalTag ?? []).filter((tag) => tag.toLowerCase().includes(currentSeason));

  return { season: seasonLabel, highlight, tags };
}
