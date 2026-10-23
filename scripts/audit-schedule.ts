/**
 * Audits the schedule step of getItemsWithScoreV2 (ScoringV3.scoreSchedule + the repository's
 * "open days / today's times" mapping) against the product rules, for EVERY opportunity:
 *
 *   1. REMOVE activities that are not open on the current day of the week
 *   2. REMOVE activities that are not opening within 60 minutes of the current time
 *   3. REMOVE activities that are now closed (venue close time / club & event end time passed)
 *
 * For each test moment it compares what V2 does (keep/remove) with what the rules say given the raw
 * JSON fields — read independently of the repository (fixed/mixed/multi-session timings, event weekly
 * timetable, date ranges, closing times past midnight). Every mismatch is listed with the opportunity
 * id, the reason, and example moments.
 *
 *   npm run audit:schedule
 *
 * Edit WEEKS / TIMES below to sweep other dates. Read-only: JSON assets only.
 */
import { AppClock } from "../app/shared/utils/app-clock.js";
import * as ScoringV3 from "../app/services/scoring-v3.service.js";
import { RecommendationV2Repository } from "../app/repositories/recommendation-v2.repository.js";
import { AssetsService } from "../app/services/assets.service.js";

// ── What to sweep ─────────────────────────────────────────────────────────────────────────────

/** Mondays (UK) — each starts a 7-day sweep. Picked so the dated events/clubs are actually running. */
const WEEKS = ["2026-06-08", "2026-08-10", "2026-10-19"];
/** Times of day (UK) checked on every day of every week. */
const TIMES = Array.from({ length: 36 }, (_, i) => `${String(6 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

// ── Mock clock (UK wall time → instant), shared by AppClock / repository / scoring ─────────────

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const RealDate = Date;
let fixedMs = RealDate.now();
class MockDate extends RealDate {
  constructor(...args: any[]) { if (args.length === 0) super(fixedMs); else super(...(args as [any])); }
  static now() { return fixedMs; }
}
(globalThis as any).Date = MockDate;

function londonOffsetMinutes(utcMs: number): number {
  const name = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", timeZoneName: "shortOffset" })
    .formatToParts(new RealDate(utcMs)).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-]\d+)?/.exec(name);
  return m && m[1] ? Number(m[1]) * 60 : 0;
}
function ukToUtc(date: string, time: string): number {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = RealDate.UTC(y!, mo! - 1, d!, h!, mi!);
  return guess - londonOffsetMinutes(guess - londonOffsetMinutes(guess) * 60_000) * 60_000;
}
function addDays(date: string, n: number): string {
  const d = new RealDate(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Rules applied to the RAW record (independent of the repository mapping) ───────────────────

type Raw = Record<string, any>;
interface Window { start: number; end: number } // minutes since midnight; end may be > 1440 (past midnight)

const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const mins = (t: unknown): number | null => {
  if (typeof t !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const dayList = (s: unknown): string[] =>
  typeof s === "string" ? s.split(",").map((d) => d.trim().toLowerCase()).filter((d) => DAYS.includes(d)) : [];
/** "09:00-11:00, 11:30-13:30" → windows. */
const sessions = (s: unknown): Window[] =>
  typeof s === "string"
    ? s.split(",").map((p) => p.trim().split("-")).flatMap(([a, b]) => {
        const st = mins(a), en = mins(b);
        return st === null || en === null ? [] : [{ start: st, end: en }];
      })
    : [];
/** A close time at/before the open time means "past midnight" (00:00 → 24:00, 01:00 → 25:00). */
const window = (s: unknown, e: unknown): Window | null => {
  const st = mins(s), en = mins(e);
  if (st === null && en === null) return null;
  const start = st ?? 0;
  let end = en ?? 24 * 60;
  if (end <= start) end += 24 * 60;
  return { start, end };
};

/** Every opening window per weekday, from whichever timing fields the record actually uses. */
function rawWindows(type: string, r: Raw): { byDay: Map<string, Window[]>; noTimes: boolean; notes: string[] } {
  const byDay = new Map<string, Window[]>();
  const notes: string[] = [];
  // An open day is recorded even when it has no times (so "no times" isn't mistaken for "closed today").
  const add = (day: string, w: Window | null) => byDay.set(day, [...(byDay.get(day) ?? []), ...(w ? [w] : [])]);
  let anyDay = false;

  if (type === "venue") {
    const fixedDays = dayList(r.venueSchedulePattern);
    for (const d of DAYS) {
      const mixed = window(r[`venueMixedTimings${cap(d)}Start`], r[`venueMixedTimings${cap(d)}End`]);
      if (r.venueFixedDailyTimings === true) { if (fixedDays.includes(d)) { anyDay = true; add(d, window(r.venueFixedTimingsStartTime, r.venueFixedTimingsEndTime)); } }
      else if (mixed) { anyDay = true; add(d, mixed); }
    }
  }
  if (type === "club") {
    const scheduleDays = dayList(r.clubDailySchedule);
    for (const d of DAYS) {
      const mixed = window(r[`clubMixedTimings${cap(d)}StartTime`], r[`clubMixedTimings${cap(d)}EndTime`]);
      const multi = sessions(r[`clubMultiSession${cap(d)}Schedule`]);
      if (mixed) { anyDay = true; add(d, mixed); }
      if (multi.length) { anyDay = true; multi.forEach((w) => add(d, w)); }
      if (!mixed && !multi.length && scheduleDays.includes(d)) { anyDay = true; add(d, window(r.clubDailyStartTime, r.clubDailyEndTime)); }
    }
    if (r.clubFixedDailyTimings !== true && scheduleDays.length && r.clubDailyStartTime) notes.push("times only in the 'daily' fields but clubFixedDailyTimings=false");
  }
  if (type === "event") {
    const weekly = dayList(r.eventTimetableWeekly);
    for (const d of weekly.length ? weekly : DAYS) {
      anyDay = true;
      if (r.eventDailyFixedTimings === true) add(d, window(r.eventDailyFixedStartTime, r.eventDailyFixedEndTime));
      else add(d, window(r[`eventMixedTimings${cap(d)}Start`], r[`eventMixedTimings${cap(d)}End`]));
    }
  }
  const noTimes = anyDay && [...byDay.values()].every((ws) => ws.length === 0);
  return { byDay, noTimes, notes };
}

function inDateRange(type: string, r: Raw, date: string): boolean {
  const s = type === "event" ? r.eventStartDate : type === "club" ? r.clubStartDate : null;
  const e = type === "event" ? r.eventEndDate : type === "club" ? r.clubEndDate : null;
  if (s && date < String(s).slice(0, 10)) return false;
  if (e && date > String(e).slice(0, 10)) return false;
  return true;
}

/** The three rules: open today, and (open now OR opening within 60 min). Also honours a window that
 * started yesterday and runs past midnight. Returns null when the record has no times to judge by. */
function expectedKeep(type: string, r: Raw, date: string, nowMin: number): { keep: boolean | null; why: string } {
  const today = DAYS[new RealDate(`${date}T12:00:00Z`).getUTCDay()]!;
  const yesterday = DAYS[(DAYS.indexOf(today) + 6) % 7]!;
  const { byDay, noTimes } = rawWindows(type, r);
  if (!inDateRange(type, r, date)) return { keep: false, why: "outside its date range" };
  const carried = (byDay.get(yesterday) ?? []).some((w) => w.end > 1440 && nowMin <= w.end - 1440);
  if (carried) return { keep: true, why: "still open from a window that started yesterday" };
  if (!byDay.has(today)) return { keep: false, why: `not open on ${today}` };
  if (noTimes) return { keep: null, why: "no times recorded" };
  for (const w of byDay.get(today)!) {
    if (nowMin >= w.start && nowMin <= w.end) return { keep: true, why: "open now" };
    if (w.start - nowMin >= 0 && w.start - nowMin <= 60) return { keep: true, why: "opens within 60 min" };
  }
  return { keep: false, why: "closed now / opens later than 60 min" };
}

// ── Reason for a mismatch ─────────────────────────────────────────────────────────────────────

function classify(type: string, r: Raw, c: any, date: string, v2Keep: boolean, exp: { keep: boolean | null; why: string }): string {
  const today = DAYS[new RealDate(`${date}T12:00:00Z`).getUTCDay()]!;
  const { notes } = rawWindows(type, r);
  if (exp.keep === null) return `no opening times recorded → V2 ${v2Keep ? "KEEPS it all day (rules 2/3 can't apply)" : "removes it all day"}`;
  if (exp.why.startsWith("still open from") && !v2Keep) return "open past midnight from the previous day → V2 removes it after midnight";
  if (type === "club" && notes.length && !v2Keep) return `club: ${notes[0]} → repository gives it no open days → never shown`;
  if (type === "club" && !v2Keep && [...rawWindows(type, r).byDay.keys()].includes(today) && !(c.activeDays ?? []).includes(today))
    return "club: that day's times are in multi-session fields, which the repository doesn't read → removed while it's running";
  if (type === "club" && v2Keep && exp.why === "outside its date range") return "club: outside its start/end (term) dates → V2 ignores club dates and keeps it";
  if (type === "event" && v2Keep && exp.why.startsWith("not open on")) return "event: not on today's weekday per its weekly timetable → V2 ignores the event timetable and keeps it";
  const ends = [r.venueFixedTimingsEndTime, r.clubDailyEndTime, r.eventDailyFixedEndTime, ...DAYS.flatMap((d) => [r[`venueMixedTimings${cap(d)}End`], r[`clubMixedTimings${cap(d)}EndTime`]])].map(mins);
  const starts = [r.venueFixedTimingsStartTime, r.clubDailyStartTime, r.eventDailyFixedStartTime, ...DAYS.flatMap((d) => [r[`venueMixedTimings${cap(d)}Start`], r[`clubMixedTimings${cap(d)}StartTime`]])].map(mins);
  if (!v2Keep && ends.some((e, i) => e !== null && starts[i] !== null && e <= starts[i]!))
    return "closes at/after midnight (end time ≤ start time, e.g. 10:00–00:00 or 10:00–01:00) → V2 treats it as closed";
  return `other: V2 ${v2Keep ? "keeps" : "removes"}, rules say ${exp.keep ? "keep" : "remove"} (${exp.why}); V2 saw days=[${(c.activeDays ?? []).join(",")}] times ${c.startTime ?? "-"}–${c.endTime ?? "-"}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────

async function main() {
  const assets = new AssetsService();
  const raw: Record<string, Raw[]> = {
    venue: await assets.getAllVenues() as any, event: await assets.getAllEvents() as any,
    club: await assets.getAllClubs() as any, route: await assets.getAllRoutes() as any,
  };
  const repo = new RecommendationV2Repository();
  const issues = new Map<string, Map<string, { examples: string[]; count: number }>>(); // reason -> ref -> examples
  let checks = 0, agree = 0;

  for (const week of WEEKS) {
    for (let d = 0; d < 7; d++) {
      const date = addDays(week, d);
      for (const time of TIMES) {
        fixedMs = ukToUtc(date, time);
        const nowMin = AppClock.minutesSinceMidnight(new Date());
        const cands = await repo.getOpportunityCandidatesV2({ includeInactive: true });
        for (const c of cands) {
          if (c.type === "route") continue; // routes have no schedule — always available
          const r = raw[c.type]!.find((x) => x.id === c.id)!;
          if (r.active === false) continue;
          const v2Keep = ScoringV3.scoreSchedule(c.type, c.startDate, c.endDate, c.activeDays, c.startTime, c.endTime) > 0;
          const exp = expectedKeep(c.type, r, date, nowMin);
          checks++;
          if (exp.keep === v2Keep) { agree++; continue; }
          const reason = classify(c.type, r, c, date, v2Keep, exp);
          const byRef = issues.get(reason) ?? new Map();
          const ref = `${c.type}:${c.id}`;
          const e = byRef.get(ref) ?? { examples: [], count: 0 };
          e.count++;
          if (e.examples.length < 2) e.examples.push(`${DAYS[AppClock.weekday(new Date())]!.slice(0, 3)} ${date} ${time}`);
          byRef.set(ref, e);
          issues.set(reason, byRef);
        }
      }
    }
  }

  console.log(`Checked ${checks} opportunity×moment pairs (venues/events/clubs, ${WEEKS.length} weeks × 7 days × ${TIMES.length} times). V2 matches the rules in ${agree} (${((agree / checks) * 100).toFixed(1)}%).\n`);
  for (const [reason, byRef] of [...issues].sort((a, b) => b[1].size - a[1].size)) {
    console.log(`■ ${reason}  — ${byRef.size} opportunit${byRef.size === 1 ? "y" : "ies"}`);
    for (const [ref, e] of byRef) console.log(`    ${ref.padEnd(52)} ${String(e.count).padStart(3)}× e.g. ${e.examples.join(" | ")}`);
    console.log();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
