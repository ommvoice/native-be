import type { RecommendationV2AgeBands } from '../dtos/recommendation.dto';
import { AppClock } from '../shared/utils/app-clock';

export function collectFamilyInterestSlugs(input: {
  parentCategorySlugs: string[];
  parentSubCategorySlugs: string[];
  children: { interestCategorySlugs: string[]; interestSubCategorySlugs: string[] }[];
}): Set<string> {
  const set = new Set<string>();
  for (const s of input.parentCategorySlugs)    set.add(s.toLowerCase());
  for (const s of input.parentSubCategorySlugs) set.add(s.toLowerCase());
  for (const ch of input.children) {
    for (const s of ch.interestCategorySlugs)    set.add(s.toLowerCase());
    for (const s of ch.interestSubCategorySlugs) set.add(s.toLowerCase());
  }
  return set;
}

export function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R     = 3958.7613;
  const toRad = (d: number) => d * (Math.PI / 180);
  const dLat  = toRad(lat2 - lat1);
  const dLon  = toRad(lon2 - lon1);
  const a     =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getAgeInYears(dateOfBirth: Date, asOf = new Date()): number {
  const birth = AppClock.parts(dateOfBirth);
  const ref   = AppClock.parts(asOf);
  let age = ref.year - birth.year;
  const m = ref.month - birth.month;
  if (m < 0 || (m === 0 && ref.day < birth.day)) age--;
  return Math.max(0, age);
}

function band(v: boolean | null | undefined): boolean { return v === true; }

function anyBandSelected(b: RecommendationV2AgeBands): boolean {
  return band(b.under1) || band(b.ages1To2) || band(b.ages3To4) ||
         band(b.ages5To7) || band(b.ages8To12) || band(b.over13) || band(b.adults);
}

export function childAgeMatchesBands(childAge: number, b: RecommendationV2AgeBands): boolean {
  if (!anyBandSelected(b)) return true;
  if (band(b.under1)   && childAge < 1)                          return true;
  if (band(b.ages1To2) && childAge >= 1  && childAge <= 2)       return true;
  if (band(b.ages3To4) && childAge >= 3  && childAge <= 4)       return true;
  if (band(b.ages5To7) && childAge >= 5  && childAge <= 7)       return true;
  if (band(b.ages8To12)&& childAge >= 8  && childAge <= 12)      return true;
  if (band(b.over13)   && childAge >= 13)                        return true;
  if (band(b.adults)   && childAge >= 16)                        return true;
  return false;
}

export function scoreAge(childAges: number[], bands: RecommendationV2AgeBands): number {
  if (childAges.length === 0 || !anyBandSelected(bands)) return 100;
  const sum = childAges.reduce((acc, age) => acc + (childAgeMatchesBands(age, bands) ? 100 : 0), 0);
  return sum / childAges.length;
}

export function scoreInterestOverlap(familySlugs: Set<string>, themeSlug: string, variantSlug: string): number {
  const opp = new Set<string>();
  if (themeSlug.trim())   opp.add(themeSlug.trim().toLowerCase());
  if (variantSlug.trim()) opp.add(variantSlug.trim().toLowerCase());
  if (familySlugs.size === 0) return 50;
  let matched = 0;
  for (const s of familySlugs) { if (opp.has(s)) matched++; }
  return (matched / familySlugs.size) * 100;
}

export function scoreDistance(distanceMiles: number, maxMiles: number): number {
  if (maxMiles <= 0 || distanceMiles >= maxMiles) return 0;
  if (distanceMiles <= 0) return 100;
  return 100 * (1 - distanceMiles / maxMiles);
}

export function combineWeighted(interestScore: number, ageScore: number, distanceScore: number): number {
  if (interestScore === 0 || ageScore === 0 || distanceScore === 0) return 0;
  return Math.round((interestScore + ageScore + distanceScore) / 3);
}

export function combineNearby(ageScore: number, distanceScore: number): number {
  if (ageScore === 0 || distanceScore === 0) return 0;
  return Math.round(ageScore * 0.5 + distanceScore * 0.5);
}

/** `now` and the "HH:MM" `startTime` are compared as UK wall-clock minutes-since-midnight — not by
 * building Date objects via `setHours`, which runs in the Lambda runtime's own zone (UTC), not the UK's. */
function isStartingWithinAnHour(now: Date, startTime?: string | null): boolean {
  if (!startTime) return false;
  const startMins = AppClock.parseTimeToMinutes(startTime);
  if (startMins === null) return false;
  const diff = startMins - AppClock.minutesSinceMidnight(now);
  return diff >= 0 && diff <= 60;
}

function endedWithinAnHour(now: Date, endTime?: string | null): boolean {
  if (!endTime) return false;
  const endMins = AppClock.parseTimeToMinutes(endTime);
  if (endMins === null) return false;
  const diff = AppClock.minutesSinceMidnight(now) - endMins;
  return diff >= 0 && diff <= 60;
}

export function scoreSchedule(
  type: string,
  startDate?: string | null,
  endDate?: string | null,
  activeDays?: string[],
  startTime?: string | null,
  endTime?: string | null,
): number {
  if (type === 'route' || type === 'venue') return 100;

  const now   = new Date();
  const today = AppClock.calendarDay(now);

  // isStartingWithinAnHour only compares wall-clock time-of-day — it has no
  // idea which day/date this club/event actually runs on. Checking it before
  // confirming the item is even on today would let a pure clock-time
  // coincidence (e.g. it's 14:45 and startTime is "15:30") override a real
  // "not open today" exclusion below. So the day/date gate must run first;
  // the within-an-hour check only matters once we already know it's on today.

  if (type === 'event') {
    const start    = startDate ? new Date(startDate) : null;
    const end      = endDate ? new Date(endDate) : null;
    const startDay = start ? AppClock.calendarDay(start) : null;
    const endDay   = end ? AppClock.calendarDay(end) : null;

    // No date info at all — can't confirm it's actually on today, so don't show it.
    if (!startDay && !endDay) return 0;
    // Hasn't started yet, or already ended — not on today, don't show it.
    if (startDay && startDay > today) return 0;
    if (endDay && endDay < today) return 0;

    // Today falls within [start, end] (or the one bound present covers today)
    // — it's on today. Starting or ending within the hour is maximally
    // relevant (100); otherwise still shown, just ranked slightly below the
    // imminent ones (90).
    if (isStartingWithinAnHour(now, startTime) || endedWithinAnHour(now, endTime)) return 100;
    return 90;
  }

  if (type === 'club') {
    // No recurring schedule captured — can't confirm it's open today, don't show it.
    if (!activeDays || activeDays.length === 0) return 0;
    const dayNames  = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[AppClock.weekday(now)]!;
    // Not running today — closed today, don't show it.
    if (!activeDays.includes(todayName)) return 0;

    if (isStartingWithinAnHour(now, startTime) || endedWithinAnHour(now, endTime)) return 100;
    return 90;
  }

  return 100;
}

export function metersToMilesOneDecimal(meters: number): number {
  return Math.round(meters * 0.000621371192 * 10) / 10;
}
