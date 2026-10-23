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
  const currentDay = DAYS[nowParts.weekday]!;

  if (opp.opp_type === "venue") {
    const real = getOpeningStatus(opp.opening_hours);
    if (real) {
      return real.isOpen
        ? { variant: "open", message: real.message }
        : { variant: "soon", message: real.message };
    }
  }

  const currentTime = AppClock.timeString(now);
  const today = AppClock.isoDateString(now);
  // Stored as UK calendar dates at UTC midnight, so the date part compares directly with `today`.
  const startDay = opp.start_date?.slice(0, 10) ?? null;
  const endDay = opp.end_date?.slice(0, 10) ?? startDay;

  if (opp.opp_type === "club" && opp.club_availability) {
    if (endDay && today > endDay) return { variant: "closed", message: "No Upcoming Sessions" };
    if (startDay && today < startDay) return { variant: "closed", message: `Starts ${formatDay(startDay)}` };

    const [start, end] = splitSlot(slotsFor(opp.club_availability, currentDay)?.[0]);
    if (start && end && currentTime >= start && currentTime < end) {
      return { variant: "open", message: `Happening Now – ${end}` };
    }
    if (start && end && currentTime < start) {
      return { variant: "soon", message: `Starting Soon ${start} – ${end}` };
    }

    // No session left today — point at the real next one instead of implying it's today.
    for (let i = 1; i <= 7; i++) {
      const dayIdx = (nowParts.weekday + i) % 7;
      if (endDay && addDays(today, i) > endDay) break;
      const [nextStart, nextEnd] = splitSlot(slotsFor(opp.club_availability, DAYS[dayIdx]!)?.[0]);
      if (!nextStart) continue;
      const label = i === 1 ? "Tomorrow" : DAY_LABELS[dayIdx];
      return { variant: "closed", message: `Next Session ${label} ${nextStart}${nextEnd ? ` – ${nextEnd}` : ""}` };
    }
    return { variant: "closed", message: "No Upcoming Sessions" };
  }

  if (opp.opp_type === "event" && startDay) {
    if (endDay && today > endDay) return { variant: "closed", message: "Event Ended" };
    if (today < startDay) return { variant: "closed", message: `Starts ${formatDay(startDay)}` };

    const todayTimes = slotsFor(opp.event_times, currentDay);
    const [start, end] = splitSlot(todayTimes?.[0]);
    if (start && end && currentTime >= start && currentTime < end) {
      return { variant: "open", message: `Happening Now – ${end}` };
    }
    if (end && currentTime >= end) return { variant: "closed", message: "Finished Today" };
    if (todayTimes && todayTimes.length > 0) {
      return { variant: "soon", message: `Starting Soon ${todayTimes[0]}` };
    }
    return { variant: "soon", message: "Starting Today" };
  }

  if (opp.opp_type === "route") {
    return { variant: "open", message: "Open Now - unrestricted" };
    // if (currentHour >= 6 && currentHour < 18) {
    //   return { variant: "open", message: "Open Now – dusk" };
    // }
    // return { variant: "soon", message: "Opens Soon 06:00" };
  }

  // No real schedule to go on — an empty message hides the banner rather than inventing a status.
  return { variant: "closed", message: "" };
}

/** Day-keyed time maps are built from sheet values, so keys can be "monday" or "Monday". */
function slotsFor(times: Record<string, string[]> | null | undefined, day: string): string[] | undefined {
  return times?.[day] ?? times?.[capitalize(day)];
}

function splitSlot(slot: string | undefined): [string | undefined, string | undefined] {
  const [start, end] = slot?.split(/[-–]/).map((s) => s.trim()) ?? [];
  return [start || undefined, end || undefined];
}

function addDays(isoDay: string, days: number): string {
  const d = new Date(`${isoDay}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "2026-10-26" -> "Mon 26 Oct" */
function formatDay(isoDay: string): string {
  return new Date(`${isoDay}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
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
