import type { RecommendationV2AgeBands } from '../dtos/recommendation.dto';

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
  let age = asOf.getFullYear() - dateOfBirth.getFullYear();
  const m = asOf.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < dateOfBirth.getDate())) age--;
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

const ONE_HOUR_MS = 60 * 60 * 1000;

/** Combines an "HH:mm" time-of-day string with `date`'s calendar day. Returns null on unparseable input. */
function parseTimeOnDate(date: Date, time: string): Date | null {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const result = new Date(date);
  result.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return result;
}

function isStartingWithinAnHour(now: Date, startTime?: string | null): boolean {
  if (!startTime) return false;
  const start = parseTimeOnDate(now, startTime);
  if (!start) return false;
  const diff = start.getTime() - now.getTime();
  return diff >= 0 && diff <= ONE_HOUR_MS;
}

function endedWithinAnHour(now: Date, endTime?: string | null): boolean {
  if (!endTime) return false;
  const end = parseTimeOnDate(now, endTime);
  if (!end) return false;
  const diff = now.getTime() - end.getTime();
  return diff >= 0 && diff <= ONE_HOUR_MS;
}

export function scoreSchedule(
  type: string,
  startDate?: string | null,
  endDate?: string | null,
  activeDays?: string[],
  startTime?: string | null,
  endTime?: string | null,
): number {
  return 100
  if (type === 'venue' || type === 'route') return 100;

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const MS_PER_DAY = 86_400_000;

  // Starting inside the next hour, or ended inside the last hour — surface
  // these as maximally relevant regardless of the day-level score below.
  if (isStartingWithinAnHour(now, startTime) || endedWithinAnHour(now, endTime)) return 100;

  if (type === 'event') {
    if (!startDate && !endDate) return 50;

    if (endDate) {
      const end    = new Date(endDate);
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      if (endDay < today) return 0;
      if (endDay.getTime() === today.getTime()) return 100;
      const daysLeft = Math.ceil((endDay.getTime() - today.getTime()) / MS_PER_DAY);
      if (daysLeft <= 7)  return 90;
      if (daysLeft <= 30) return 70;
      return 50;
    }

    if (startDate) {
      const start    = new Date(startDate);
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      if (startDay.getTime() === today.getTime()) return 100;
      if (startDay > today) {
        const daysUntil = Math.ceil((startDay.getTime() - today.getTime()) / MS_PER_DAY);
        return daysUntil <= 7 ? 80 : 50;
      }
      return 70;
    }

    return 50;
  }

  if (type === 'club') {
    if (!activeDays || activeDays.length === 0) return 50;
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName    = dayNames[now.getDay()]!;
    const tomorrowName = dayNames[(now.getDay() + 1) % 7]!;
    if (activeDays.includes(todayName))    return 100;
    if (activeDays.includes(tomorrowName)) return 80;
    return 60;
  }

  return 100;
}

export function metersToMilesOneDecimal(meters: number): number {
  return Math.round(meters * 0.000621371192 * 10) / 10;
}
