import { AssetsService } from "../../../services/assets.service";
import type { OpportunityDetail, SlugName } from "../../types/opportunity-detail.types";
import type { EnumSeasonalHighlight } from "../../types/assets.types";
import { AppClock } from "../app-clock";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const assets = new AssetsService();

export interface LiveStatus {
  variant: "open" | "soon" | "closed";
  message: string;
}

export interface SeasonalHighlight {
  season: "Spring" | "Summer" | "Autumn" | "Winter";
  highlight: SlugName[];
  tags: string[];
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getOpeningStatus(
  openingHours: OpportunityDetail["opening_hours"]
): { isOpen: boolean; message: string } | null {
  if (!openingHours) return null;

  const now = new Date();
  const currentDay = DAYS[AppClock.weekday(now)]!;
  const currentTime = AppClock.timeString(now);
  const todayHours = openingHours[currentDay];

  if (todayHours?.allDay) {
    return { isOpen: true, message: "Open now - unrestricted" };
  }

  if (todayHours?.open && todayHours?.close && currentTime >= todayHours.open && currentTime < todayHours.close) {
    return { isOpen: true, message: `Open - until ${todayHours.close}` };
  }

  if (todayHours?.open && todayHours?.close && currentTime < todayHours.open) {
    return { isOpen: false, message: `Open Soon ${todayHours.open} – ${todayHours.close}` };
  }

  for (let i = 1; i <= 7; i++) {
    const nextDayIdx = (AppClock.weekday(now) + i) % 7;
    const nextDayHours = openingHours[DAYS[nextDayIdx]!];
    const label = i === 1 ? "Tomorrow" : DAY_LABELS[nextDayIdx];
    if (nextDayHours?.allDay) {
      return { isOpen: false, message: `Open ${label} – unrestricted` };
    }
    if (nextDayHours?.open && nextDayHours?.close) {
      return { isOpen: false, message: `Open ${label} ${nextDayHours.open} – ${nextDayHours.close}` };
    }
  }

  return null;
}

/** Live open/closed status for any opportunity type — real data where available, deterministic fallback otherwise. */
export function resolveLiveStatus(opp: OpportunityDetail): LiveStatus {
  const now = new Date();
  const nowParts = AppClock.parts(now);
  const currentHour = nowParts.hours;
  const currentDay = DAYS[nowParts.weekday]!;

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
      const currentTime = `${currentHour.toString().padStart(2, "0")}:${nowParts.minutes.toString().padStart(2, "0")}`;
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
    const isToday = AppClock.isSameCalendarDay(eventDate, now);
    if (isToday) {
      const todayTimes = opp.event_times?.[currentDay] ?? opp.event_times?.[capitalize(currentDay)];
      const [start, end] = todayTimes?.[0]?.split(/[-–]/).map((s2) => s2.trim()) ?? [];
      const currentTime = `${currentHour.toString().padStart(2, "0")}:${nowParts.minutes.toString().padStart(2, "0")}`;

      if (start && end && currentTime >= start && currentTime < end) {
        return { variant: "open", message: `Happening Now \u2013 ${end}` };
      }
      if (todayTimes && todayTimes.length > 0) {
        return { variant: "soon", message: `Starting Soon ${todayTimes[0]}` };
      }
      return { variant: "soon", message: "Starting Today" };
    }
  }

  if (opp.opp_type === "route") {
    return { variant: "open", message: "Open Now - unrestricted" };
    // if (currentHour >= 6 && currentHour < 18) {
    //   return { variant: "open", message: "Open Now – dusk" };
    // }
    // return { variant: "soon", message: "Opens Soon 06:00" };
  }

  const hash = opp.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const bucket = hash % 3;
  if (bucket === 0) return { variant: "open", message: "Open Now – 17:00" };
  if (bucket === 1) return { variant: "soon", message: "Opens Soon 09:00 – 17:00" };
  return { variant: "closed", message: "Closed Today" };
}

const MIN_HIGHLIGHTS = 3;

/**
 * Parses the current season's highlight out of the seasonal_highlights values, plus matching seasonal
 * tags. A record with no seasonal tagging at all has nothing to show here — full stop, no fallback.
 * When it does have seasonal tagging, the matched highlights are topped up with `forThem` (real child
 * facilities) and `attractions`: if `forThem` is real content, both it and `attractions` are attached;
 * if the record has no child facilities, `forThem` is just `attractions` again (buildForThem's fallback),
 * so only `forThem` is attached — adding `attractions` too would duplicate the same items.
 */
export function resolveSeasonalHighlight(
  seasonalHighlights: SlugName[] | null,
  seasonalTag: SlugName[] | null,
  attractions: SlugName[] | null = null,
  forThem: SlugName[] | null = null
): SeasonalHighlight | null {
  if (
    (!seasonalHighlights || seasonalHighlights.length === 0) &&
    (!attractions || attractions.length === 0)
  ) {
    return null;
  }

  const month = AppClock.parts().month;

  const currentSeason =
    month >= 2 && month <= 4
      ? "spring"
      : month >= 5 && month <= 7
        ? "summer"
        : month >= 8 && month <= 10
          ? "autumn"
          : "winter";

  const seasonLabels: Record<
    string,
    SeasonalHighlight["season"]
  > = {
    spring: "Spring",
    summer: "Summer",
    autumn: "Autumn",
    winter: "Winter",
  };

  const seasonLabel = seasonLabels[currentSeason]!;

  const tags = (seasonalTag ?? [])
    .map((t: SlugName) => t.name)
    .filter((tag) =>
      tag.toLowerCase().includes(currentSeason)
    );

  let highlight: SlugName[] = [];

  // Seasonal highlights
  if (seasonalHighlights?.length) {
    const seasonalAllHighlights =
      assets.getSeasonalHighlights(currentSeason);

    const foundHighlights = seasonalAllHighlights.filter(
      (item: EnumSeasonalHighlight) =>
        seasonalHighlights.some(
          (other) => other.slug === item.slug
        )
    );

    highlight = foundHighlights.map((item) => ({
      slug: currentSeason,
      name: item.name,
    }));
  }

  // Names that already exist in "forThem"
  const forThemSlugs = new Set(
    (forThem ?? []).map((item) => item.name.toLowerCase())
  );

  // Attractions that are NOT already in "forThem"
  const filteredAttractions: SlugName[] = (attractions ?? [])
    .filter(
      (attraction) => !forThemSlugs.has(attraction.name.toLowerCase())
    )
    .map((attraction) => ({
      slug: "attractions_",
      name: attraction.name,
    }));

  highlight = [
    ...highlight,
    ...filteredAttractions,
  ];

  return {
    season: seasonLabel,
    highlight,
    tags,
  };
}
