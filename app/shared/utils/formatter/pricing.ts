import type { OpportunityDetail, PricingTier } from "../../types/opportunity-detail.types";

function parseNumeric(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? null : num;
}

function allTiersFree(tiers: PricingTier[]): boolean {
  return tiers.every((t) => t.price === "Free" || t.price === "£0.00");
}

export function buildPricingTiers(opp: OpportunityDetail): PricingTier[] {
  if (opp.is_free) return [];

  const { adult_price, child_price, infant_price, concession_price } = opp;

  const concessionVal = concession_price !== null ? concession_price : 0;
  const familyPrice =
    adult_price !== null && child_price !== null
      ? adult_price * 2 + child_price * 2 - concessionVal
      : null;

  const fmt = (v: number | null) =>
    v === null ? null : v === 0 ? "Free" : `£${v.toFixed(2)}`;

  const fmtConcession = (v: number) => `£${v.toFixed(2)}`;

  const tiers: PricingTier[] = ([
    adult_price !== null      && { label: "Adult",      price: fmt(adult_price)! },
    child_price !== null      && { label: "Child",      price: fmt(child_price)! },
    infant_price !== null     && { label: "Infant",     price: fmt(infant_price)! },
    concessionVal > 0         && { label: "Concession", price: fmtConcession(concessionVal) },
    familyPrice !== null      && { label: "Family",     price: fmt(familyPrice)!, description: "(2A + 2C)" },
  ] as (PricingTier | false)[]).filter(Boolean) as PricingTier[];

  if (tiers.length === 0 && (opp.entry_cost || opp.price_info)) {
    tiers.push({ label: "Entry", price: opp.entry_cost || opp.price_info || "" });
  }

  if (allTiersFree(tiers)) {
    opp.is_free = true;
    return [];
  }

  return tiers;
}

export function resolveCardPrice(
  hasEntryCost: boolean,
  adultPrice: string | null | undefined,
  childPrice: string | null | undefined,
  babyPrice: string | null | undefined,
): { price: string; priceValue: number | undefined } {
  const anyPrice = adultPrice ?? childPrice ?? babyPrice;
  if (!hasEntryCost && !anyPrice) return { price: "Free", priceValue: 0 };
  if (!anyPrice) return { price: "Free", priceValue: 0 };
  const num = parseNumeric(anyPrice);
  if (num !== null && num === 0) return { price: "Free", priceValue: 0 };
  return { price: `From £${anyPrice.replace("£", "")}`, priceValue: num ?? undefined };
}

// ── Shared ticketVariant* resolver ───────────────────────────────────────────
// venue/event/club assets all carry the exact same ticketVariant* field
// names (confirmed against venues.json/events.json/clubs.json — routes carry
// none at all, they're always free), so one resolver handles all three
// instead of each *-to-opportunity.ts formatter re-deriving tiers ad hoc.

/** The subset of OpportunityVenueV2/EventV2/ClubV2 this resolver needs — identical field names across all three raw asset shapes. */
export interface TicketVariantFields {
  ticketingVariants:                 string | null;
  ticketVariantDefinitionBaby:       string | null;
  ticketVariantBabyPrice:            string | null;
  ticketVariantDefinitionFixedChild: string | null;
  ticketVariantFixedChildPrice:      string | null;
  ticketVariantDefinitionYoungChild: string | null;
  ticketVariantYoungChildPrice:      string | null;
  ticketVariantDefinitionOlderChild: string | null;
  ticketVariantOlderChildPrice:      string | null;
  ticketVariantDefinitionAdult:      string | null;
  ticketVariantAdultPrice:           string | null;
  ticketVariantDefinitionConcession: string | null;
  ticketVariantConcessionPrice:      string | null;
  ticketVariantDefinitionGroup:      string | null;
  ticketVariantGroupPrice:           string | null;
}

export interface ResolvedTicketPricing {
  tiers:           PricingTier[];
  isFree:          boolean;
  adultPrice:      number | null;
  /** Fixed Child, else Young Child, else Older Child — whichever this record actually uses as its "standard child rate". */
  childPrice:      number | null;
  babyPrice:       number | null;
  concessionPrice: number | null;
}

function formatAmount(v: number): string {
  return v === 0 ? "Free" : `£${v.toFixed(2)}`;
}

/** A price cell is sometimes a single value ("12.73"), sometimes a range ("£3.50-£8.45") — sheet data isn't consistent. */
function parsePriceValue(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  const rangeMatch = cleaned.match(/^£?\s*([\d.]+)\s*[-–]\s*£?\s*([\d.]+)\s*$/);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]!);
    return isNaN(lo) ? null : lo;
  }
  const num = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? null : num;
}

function formatPriceDisplay(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  const rangeMatch = cleaned.match(/^£?\s*([\d.]+)\s*[-–]\s*£?\s*([\d.]+)\s*$/);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]!);
    const hi = parseFloat(rangeMatch[2]!);
    if (isNaN(lo) || isNaN(hi)) return null;
    if (lo === 0 && hi === 0) return "Free";
    return `£${lo.toFixed(2)}-£${hi.toFixed(2)}`;
  }
  const num = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? null : formatAmount(num);
}

/**
 * Parses a Group ticket's free-text definition into an abbreviated tier
 * description: "Family (2 adults and up to 3 children)" -> "(2A + 3C)",
 * "4 people, max 2 adults" -> "(4P)", "Groups of 25+" -> "(25P+)". Returns
 * undefined when the text has no recognizable count (e.g. "Family Group").
 */
function parseGroupDescription(definition: string | null): string | undefined {
  if (!definition) return undefined;

  const adultMatch = definition.match(/(\d+)\s*adults?/i);
  const childMatch = definition.match(/(\d+)\s*child(?:ren)?/i);
  if (adultMatch && childMatch) return `(${adultMatch[1]}A + ${childMatch[1]}C)`;

  const peopleMatch = definition.match(/(\d+)\s*(?:people|persons?)\s*(\+)?/i);
  if (peopleMatch) return `(${peopleMatch[1]}P${peopleMatch[2] ? "+" : ""})`;

  const plusMatch = definition.match(/(\d+)\s*\+/);
  if (plusMatch) return `(${plusMatch[1]}P+)`;

  return undefined;
}

type TicketVariantSlug =
  | "adult" | "fixed_child" | "young_child" | "older_child" | "baby" | "concession" | "group";

const VARIANT_FIELD_MAP: Record<
  TicketVariantSlug,
  { price: keyof TicketVariantFields; definition: keyof TicketVariantFields; label: string }
> = {
  adult:       { price: "ticketVariantAdultPrice",      definition: "ticketVariantDefinitionAdult",      label: "Adult" },
  fixed_child: { price: "ticketVariantFixedChildPrice",  definition: "ticketVariantDefinitionFixedChild", label: "Child" },
  young_child: { price: "ticketVariantYoungChildPrice",  definition: "ticketVariantDefinitionYoungChild", label: "Young Child" },
  older_child: { price: "ticketVariantOlderChildPrice",  definition: "ticketVariantDefinitionOlderChild", label: "Older Child" },
  baby:        { price: "ticketVariantBabyPrice",        definition: "ticketVariantDefinitionBaby",       label: "Baby" },
  concession:  { price: "ticketVariantConcessionPrice",  definition: "ticketVariantDefinitionConcession", label: "Concession" },
  // Group tickets are how "family" pricing is actually represented in the
  // data — there's no separate family field, so Group is shown as "Family".
  group:       { price: "ticketVariantGroupPrice",       definition: "ticketVariantDefinitionGroup",      label: "Family" },
};

/** Builds the full pricing-tier list (+ the scalar prices OpportunityDetail stores) directly from a venue/event/club's raw ticketVariant* fields. */
export function resolveTicketPricing(data: TicketVariantFields): ResolvedTicketPricing {
  const tiers: PricingTier[] = [];

  const pushTier = (slug: TicketVariantSlug) => {
    const { price, definition, label } = VARIANT_FIELD_MAP[slug];
    const display = formatPriceDisplay(data[price]);
    if (!display) return;
    const age = data[definition] ?? undefined;
    const description = slug === "group" ? parseGroupDescription(data[definition]) : undefined;
    tiers.push({
      label,
      price: display,
      ...(age ? { age } : {}),
      ...(description ? { description } : {}),
    });
  };

  // ticketingVariants (e.g. "adult, young_child, older_child, group") is the
  // authoritative, per-record list of which variants actually apply — when
  // present, show exactly those, in that order, instead of guessing from
  // whichever price fields happen to be populated.
  const declared = data.ticketingVariants
    ?.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is TicketVariantSlug => s in VARIANT_FIELD_MAP);

  if (declared && declared.length > 0) {
    for (const slug of declared) pushTier(slug);
  } else {
    pushTier("adult");
    // A record either sets one flat "Fixed Child" rate, or splits child
    // pricing by age into Young Child / Older Child — Fixed Child wins as
    // the single representative "child" rate when present, else Young Child.
    if (formatPriceDisplay(data.ticketVariantFixedChildPrice)) pushTier("fixed_child");
    else if (formatPriceDisplay(data.ticketVariantYoungChildPrice)) pushTier("young_child");
    pushTier("older_child");
    pushTier("baby");
    pushTier("concession");
    pushTier("group");
  }

  const adultPrice = parsePriceValue(data.ticketVariantAdultPrice);
  const fixedChildPrice = parsePriceValue(data.ticketVariantFixedChildPrice);
  const youngChildPrice = parsePriceValue(data.ticketVariantYoungChildPrice);
  const olderChildPrice = parsePriceValue(data.ticketVariantOlderChildPrice);
  const childPrice = fixedChildPrice ?? youngChildPrice ?? olderChildPrice;
  const babyPrice = parsePriceValue(data.ticketVariantBabyPrice);
  const concessionPrice = parsePriceValue(data.ticketVariantConcessionPrice);

  const isFree = tiers.length > 0 && tiers.every((t) => t.price === "Free");
  
  const filteredPricingTiers = tiers.filter(
  (tier) => tier.label?.toLowerCase() !== "family"
);

  return {
    tiers: isFree ? [] : filteredPricingTiers,
    isFree: tiers.length === 0 || isFree,
    adultPrice,
    childPrice,
    babyPrice,
    concessionPrice,
  };
}

/** Recommendation-card price: combine Adult + resolved child rate into one total when both exist, instead of only ever surfacing Adult. Kept as the fallback for callers with no family context (see resolveFamilyEstimatedTotal for the family-aware version). */
export function resolveCardTotalPrice(pricing: ResolvedTicketPricing): { price: string; priceValue: number | undefined } {
  const { adultPrice, childPrice, babyPrice } = pricing;

  if (adultPrice !== null && childPrice !== null) {
    const total = adultPrice + childPrice;
    return { price: total === 0 ? "Free" : `£${total.toFixed(2)}`, priceValue: total };
  }

  const single = adultPrice ?? childPrice ?? babyPrice;
  if (single === null || single === undefined) return { price: "Free", priceValue: 0 };
  if (single === 0) return { price: "Free", priceValue: 0 };
  return { price: `From £${single.toFixed(2)}`, priceValue: single };
}

// ── Family-composition-aware card estimate ──────────────────────────────────
// Backend counterpart of native-fe-v0's PricingCard.tsx (calcQuantitiesFromMembers
// + its estimatedTotal calculation): 1 Adult (the requesting parent, always
// counted) + each of their children matched to the narrowest-fitting age-banded
// tier, summed across every non-flat-rate tier — instead of a flat "1 adult +
// 1 child" guess with no regard for the family actually asking.

interface AgeRange {
  min: number;
  max: number;
}

/** Parses a tier's free-text age range ("18+", "0-16", "0-12months") into numeric years. Returns null when it's not age-based at all (e.g. height-based "Below 90cm"). Mirrors PricingCard.tsx's parseAgeRange exactly. */
function parseAgeRange(age?: string): AgeRange | null {
  if (!age) return null;
  const trimmed = age.trim().toLowerCase();

  const plusMatch = trimmed.match(/^(\d+)\s*\+/);
  if (plusMatch) return { min: parseInt(plusMatch[1]!, 10), max: Infinity };

  const monthsMatch = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)\s*months?/);
  if (monthsMatch) return { min: parseInt(monthsMatch[1]!, 10) / 12, max: parseInt(monthsMatch[2]!, 10) / 12 };

  const rangeMatch = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) return { min: parseInt(rangeMatch[1]!, 10), max: parseInt(rangeMatch[2]!, 10) };

  return null;
}

/** A tier's displayed price is sometimes a range ("£12.00-£14.00") rather than a single value — both bounds carry through so the estimate can scale each by quantity instead of collapsing to one number. Mirrors PricingCard.tsx's parsePriceRange. */
function parsePriceDisplayRange(price: string): { low: number; high: number } {
  const matches = price.match(/[\d.]+/g);
  if (!matches || matches.length === 0) return { low: 0, high: 0 };
  const low = parseFloat(matches[0]!);
  const high = matches.length >= 2 ? parseFloat(matches[1]!) : low;
  return { low, high };
}

function calcFamilyQuantities(childAges: number[], tiers: PricingTier[]): Record<string, number> {
  const quantities: Record<string, number> = {};
  tiers.forEach((tier) => { quantities[tier.label] = 0; });

  const adultTier = tiers.find((t) => t.label.toLowerCase() === "adult");
  if (adultTier) quantities[adultTier.label] = 1; // the requesting parent

  // Per-child tiers, ranked narrowest range first so e.g. a baby ("0-1")
  // matches "Baby" before it could also satisfy a broader catch-all like
  // "Child" ("0-16") — same ranking PricingCard.tsx uses.
  const childTiers = tiers
    .filter((t) => t !== adultTier && !t.description)
    .map((t) => ({ tier: t, range: parseAgeRange(t.age) }))
    .filter((t): t is { tier: PricingTier; range: AgeRange } => t.range !== null)
    .sort((a, b) => (a.range.max - a.range.min) - (b.range.max - b.range.min));

  const fallbackChildTier =
    tiers.find((t) => t.label.toLowerCase() === "child") ??
    tiers.find((t) => t !== adultTier && /child/i.test(t.label));

  childAges.forEach((age) => {
    const match = childTiers.find(({ range }) => age >= range.min && age <= range.max);
    const label = match?.tier.label ?? fallbackChildTier?.label;
    if (label) quantities[label] = (quantities[label] ?? 0) + 1;
  });

  return quantities;
}

/** Sums each non-flat-rate tier's price × the requesting family's matched quantity into an overall {low, high} estimate, formatted the same way PricingCard.tsx's formatPriceRange does. */
export function resolveFamilyEstimatedTotal(
  tiers: PricingTier[],
  childAges: number[]
): { price: string; priceValue: number | undefined } {
  if (tiers.length === 0) return { price: "Free", priceValue: 0 };

  const quantities = calcFamilyQuantities(childAges, tiers);

  let low = 0;
  let high = 0;
  tiers.forEach((tier) => {
    if (tier.description) return;
    const qty = quantities[tier.label] || 0;
    if (qty === 0) return;
    const range = parsePriceDisplayRange(tier.price);
    low += qty * range.low;
    high += qty * range.high;
  });

  if (low === 0 && high === 0) return { price: "Free", priceValue: 0 };
  if (low === high) return { price: `£${low.toFixed(2)}`, priceValue: low };
  return { price: `£${low.toFixed(2)}-£${high.toFixed(2)}`, priceValue: low };
}
