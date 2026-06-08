/** Pick one Dynamo row per slug (and optional interestId); lowest sortOrder wins. */
export function pickCanonicalThemeRow(
  items: Record<string, unknown>[],
): Record<string, unknown> | undefined {
  if (items.length === 0) return undefined;
  return items.reduce((best, item) => {
    const bestOrder = Number(best.sortOrder ?? 0);
    const nextOrder = Number(item.sortOrder ?? 0);
    return nextOrder < bestOrder ? item : best;
  });
}

export function groupThemeRowsByKey(
  themeItems: Record<string, unknown>[],
): Map<string, Record<string, unknown>[]> {
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const item of themeItems) {
    const interestId = (item.interestId as string | undefined) ?? "";
    const key = `${interestId}\0${item.slug as string}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return groups;
}
