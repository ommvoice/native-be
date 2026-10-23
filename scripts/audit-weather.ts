/**
 * Audits the weather step of getItemsWithScoreV2 (ScoringV3.scoreWeatherSuitability) against the
 * product rules, for EVERY opportunity in a range of weather scenarios:
 *
 *   good weather (dry / sunny / overcast / windy) → SHOW, whatever the setting
 *   bad weather  (rain / storm / snow)             → outside: HIDE · mixed: SHOW but score lower · inside: SHOW
 *
 * Scenarios are real WeatherAPI readings mapped through ScoringV3.mapWeatherToSuitabilitySlugs, exactly
 * as the live endpoint maps them. Every violation is listed with the opportunity id and why.
 *
 *   npm run audit:weather
 *
 * Read-only: JSON assets only.
 */
import * as ScoringV3 from "../app/services/scoring-v3.service.js";
import { RecommendationV2Repository } from "../app/repositories/recommendation-v2.repository.js";
import type { RecommendationV2Candidate } from "../app/dtos/recommendation.dto.js";

// ── Weather scenarios (WeatherAPI condition code + °C + windy) and what counts as "bad" ────────

const SCENARIOS: { name: string; code: number; temp: number; windy?: boolean }[] = [
  { name: "sunny, warm 22°C", code: 1000, temp: 22 },
  { name: "sunny, hot 28°C", code: 1000, temp: 28 },
  { name: "sunny, cold 5°C", code: 1000, temp: 5 },
  { name: "overcast, mild 14°C", code: 1009, temp: 14 },
  { name: "overcast, windy 12°C", code: 1009, temp: 12, windy: true },
  { name: "fog 9°C", code: 1135, temp: 9 },
  { name: "light rain 12°C", code: 1183, temp: 12 },
  { name: "rain + windy 11°C", code: 1189, temp: 11, windy: true },
  { name: "heavy rain 10°C", code: 1195, temp: 10 },
  { name: "thunderstorm 16°C", code: 1087, temp: 16 },
  { name: "snow -1°C", code: 1066, temp: -1 },
];
/** "Rainy and similar": any of these in the live slugs makes it bad weather. */
const BAD_WEATHER = new Set(["wet_rain", "storm_heavy_rain", "snow_ice"]);

type Setting = "outside" | "mixed" | "inside" | "unknown";
function settingOf(c: RecommendationV2Candidate): Setting {
  const s = c.physicalSetting.map((x) => x.trim().toLowerCase());
  if (s.includes("mixed_covering") || (s.includes("inside") && s.includes("outside"))) return "mixed";
  if (s.includes("inside")) return "inside";
  if (s.includes("outside")) return "outside";
  return "unknown";
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────

async function main() {
  const cands = (await new RecommendationV2Repository().getOpportunityCandidatesV2({ includeInactive: true }));
  const violations = new Map<string, Map<string, string[]>>(); // rule -> ref -> scenarios
  const add = (rule: string, c: RecommendationV2Candidate, scenario: string) => {
    const byRef = violations.get(rule) ?? new Map<string, string[]>();
    const ref = `${c.type}:${c.id}`;
    byRef.set(ref, [...(byRef.get(ref) ?? []), scenario]);
    violations.set(rule, byRef);
  };

  const settingCounts: Record<Setting, number> = { outside: 0, mixed: 0, inside: 0, unknown: 0 };
  cands.forEach((c) => settingCounts[settingOf(c)]++);
  console.log(`Opportunities: ${cands.length} — outside ${settingCounts.outside}, mixed ${settingCounts.mixed}, inside ${settingCounts.inside}, no setting ${settingCounts.unknown}\n`);
  console.log("Scenario                    live slugs                         bad?  shown out/mix/in        avg score out/mix/in");

  for (const sc of SCENARIOS) {
    const slugs = ScoringV3.mapWeatherToSuitabilitySlugs({ condition: { code: sc.code, isWindy: !!sc.windy }, temp_c: sc.temp });
    const bad = slugs.some((s) => BAD_WEATHER.has(s));
    const shown: Record<Setting, number> = { outside: 0, mixed: 0, inside: 0, unknown: 0 };
    const total: Record<Setting, number> = { outside: 0, mixed: 0, inside: 0, unknown: 0 };
    const sum: Record<Setting, number> = { outside: 0, mixed: 0, inside: 0, unknown: 0 };
    const scoreOf = new Map<string, number>();

    for (const c of cands) {
      const setting = settingOf(c);
      const score = ScoringV3.scoreWeatherSuitability(slugs, c.physicalSetting);
      scoreOf.set(`${c.type}:${c.id}`, score);
      total[setting]++;
      if (score > 0) { shown[setting]++; sum[setting] += score; }

      const why = c.weatherSuitability.length ? `suits [${c.weatherSuitability.join(", ")}]` : "no weather-suitability list";
      if (!bad && score === 0) add(`GOOD weather, ${setting} → should SHOW, but hidden (${c.weatherSuitability.length ? "live weather not in its suitability list" : "it has no weather-suitability list"})`, c, sc.name);
      if (bad && setting === "outside" && score > 0) add(`BAD weather, outside → should HIDE, but shown (its suitability list includes ${c.weatherSuitability.filter((s) => slugs.includes(s.trim().toLowerCase())).join("/")})`, c, sc.name);
      if (bad && setting !== "outside" && score === 0) add(`BAD weather, ${setting} → should SHOW, but hidden (${why})`, c, sc.name);
    }

    // "mixed scores lower than inside" in bad weather — compare the best mixed score with the lowest inside score
    if (bad) {
      const insideMin = Math.min(...cands.filter((c) => settingOf(c) === "inside").map((c) => scoreOf.get(`${c.type}:${c.id}`)!));
      for (const c of cands.filter((c) => settingOf(c) === "mixed")) {
        const s = scoreOf.get(`${c.type}:${c.id}`)!;
        if (s > 0 && s >= insideMin) add(`BAD weather, mixed → should score LOWER than inside, but scores ${s} (lowest inside: ${insideMin})`, c, sc.name);
      }
    }

    const avg = (s: Setting) => (shown[s] ? (sum[s] / shown[s]).toFixed(1) : "-");
    console.log(
      `${sc.name.padEnd(27)} ${slugs.join(",").padEnd(34)} ${bad ? "BAD " : "good"}  ` +
      `${`${shown.outside}/${total.outside}`.padStart(7)} ${`${shown.mixed}/${total.mixed}`.padStart(5)} ${`${shown.inside}/${total.inside}`.padStart(5)}    ` +
      `${avg("outside").padStart(4)} ${avg("mixed").padStart(4)} ${avg("inside").padStart(4)}`,
    );
  }

  console.log(`\n${violations.size ? "VIOLATIONS" : "No violations — every opportunity follows the weather rules in every scenario."}`);
  for (const [rule, byRef] of [...violations].sort((a, b) => b[1].size - a[1].size)) {
    console.log(`\n■ ${rule} — ${byRef.size} opportunit${byRef.size === 1 ? "y" : "ies"}`);
    const lines = [...byRef].map(([ref, scenarios]) => `    ${ref.padEnd(52)} in: ${[...new Set(scenarios)].join("; ")}`);
    console.log(lines.slice(0, 25).join("\n"));
    if (lines.length > 25) console.log(`    … +${lines.length - 25} more: ${[...byRef.keys()].slice(25).join(", ")}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
