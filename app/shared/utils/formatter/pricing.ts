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
  return { price: `From ${anyPrice}`, priceValue: num ?? undefined };
}
