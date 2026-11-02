/**
 * app/shared/assets/enums.json is what the app actually reads and it carries manual edits (renamed
 * entries, the *_skill slugs) that the generated seed/data/uat/enums files don't have, so the
 * parse-*-data.ts scripts match sheet values against it rather than those files.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { EnumEntry } from "./enum-matching.js";

const ENUMS_JSON_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "shared", "assets", "enums.json");

export interface MintedEnum {
  enumKey: string;
  name: string;
  slug: string;
}

/** Sheet wordings for an existing entry that no name match can catch. */
const SHEET_ALIASES: Record<string, Record<string, string>> = {
  estimatedDuration: { "Under 30mins": "under_thirty_mins" },
  opportunityThemeVariant: { "Animal Park or Zoo": "animal_parks" },
  kidsFacility: { "Activity Sheets or Signs": "activity_sheets" },
};

const assetEnums: Record<string, EnumEntry[]> = JSON.parse(fs.readFileSync(ENUMS_JSON_PATH, "utf8"));
for (const [key, aliases] of Object.entries(SHEET_ALIASES)) {
  for (const [name, slug] of Object.entries(aliases)) assetEnums[key]?.push({ name, slug, active: true });
}

/** Values no enum matched, across every parser, in the order they were first seen. */
export const mintedEnums: MintedEnum[] = [];

/** "ROUTE_SUITABILITY_ENUM" → "routeSuitability", the enums.json key. */
function assetKey(enumKey: string): string {
  return enumKey.replace(/_ENUM$/, "").toLowerCase().replace(/_(\w)/g, (_, c: string) => c.toUpperCase());
}

/** Swaps each registry entry for its enums.json list. The lists are shared between parsers, so a
 * value minted by one resolves to the same slug in the others. */
export function useAssetEnums(registry: Record<string, EnumEntry[]>): Record<string, EnumEntry[]> {
  return Object.fromEntries(
    Object.keys(registry).map((enumKey) => {
      const entries = assetEnums[assetKey(enumKey)];
      if (!entries) throw new Error(`enums.json has no "${assetKey(enumKey)}" list for ${enumKey}`);
      return [enumKey, entries];
    }),
  );
}

/** Appends `minted` to enums.json. Re-reads the file so nothing minted in memory (e.g. from a base
 * sheet) gets written by accident. */
export function appendToEnumsJson(minted: MintedEnum[]): void {
  const enums: Record<string, EnumEntry[]> = JSON.parse(fs.readFileSync(ENUMS_JSON_PATH, "utf8"));
  for (const { enumKey, name, slug } of minted) {
    const entries = enums[assetKey(enumKey)];
    if (!entries) throw new Error(`enums.json has no "${assetKey(enumKey)}" list for ${enumKey}`);
    if (!entries.some((e) => e.slug === slug)) entries.push({ name, slug, active: true });
  }
  fs.writeFileSync(ENUMS_JSON_PATH, JSON.stringify(enums, null, 2) + "\n");
}
