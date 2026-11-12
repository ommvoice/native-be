import { describe, expect, it } from "vitest";
import { AssetsService } from "../../../../services/assets.service";
import { groupOpportunitiesByInterest } from "../plan-formatter";
import type { Opportunity } from "../recommendation-formatter";

const interest = new AssetsService().getInterestCategories()[0]!;

/** Just enough of an Opportunity for grouping/visibility — everything lands in the first interest group. */
const opp = (id: string, type: Opportunity["type"], endDate: string | null = null): Opportunity =>
  ({
    id,
    type,
    searchTags: { interestCategories: [{ slug: interest.slug, name: interest.name }] },
    schedule: endDate ? { endDate } : undefined,
  }) as unknown as Opportunity;

const idsInPlan = async (opportunities: Opportunity[], now: string) =>
  (await groupOpportunitiesByInterest(opportunities, new Date(now)))
    .find((g) => g.interest.slug === interest.slug)!
    .list.map((o) => o.id);

describe("groupOpportunitiesByInterest — event visibility (christingle: 07/12/2026 16:00–18:00, promo from 01/11/2026)", () => {
  const christingle = opp("christingle", "event", "2026-12-07T00:00:00.000Z");
  const venue = opp("some-venue", "venue");

  it("hidden before its promotion starts", async () => {
    expect(await idsInPlan([christingle, venue], "2026-10-31T23:59:59.000Z")).toEqual(["some-venue"]);
  });

  it("shown from 01/11 00:00 up to 07/12 16:59", async () => {
    expect(await idsInPlan([christingle, venue], "2026-11-01T00:00:00.000Z")).toEqual(["christingle", "some-venue"]);
    expect(await idsInPlan([christingle, venue], "2026-11-12T12:00:00.000Z")).toEqual(["christingle", "some-venue"]);
    expect(await idsInPlan([christingle, venue], "2026-12-07T16:59:59.000Z")).toEqual(["christingle", "some-venue"]);
  });

  it("removed from 07/12 17:00 (1 hour before it finishes)", async () => {
    expect(await idsInPlan([christingle, venue], "2026-12-07T17:00:00.000Z")).toEqual(["some-venue"]);
  });
});

describe("groupOpportunitiesByInterest — club visibility (tick_tock_lympstone_playgroup_2: 11/09–23/10/2026, 09:00–11:00)", () => {
  const club = opp("tick_tock_lympstone_playgroup_2", "club");
  const venue = opp("some-venue", "venue");

  it("hidden until 7 days before it starts (04/09 00:00 UK = 03/09 23:00Z)", async () => {
    expect(await idsInPlan([club, venue], "2026-09-03T22:59:59.000Z")).toEqual(["some-venue"]);
    expect(await idsInPlan([club, venue], "2026-09-03T23:00:00.000Z")).toEqual(["tick_tock_lympstone_playgroup_2", "some-venue"]);
  });

  it("removed at 11:00 UK on 23/10 (10:00Z)", async () => {
    expect(await idsInPlan([club, venue], "2026-10-23T09:59:59.000Z")).toEqual(["tick_tock_lympstone_playgroup_2", "some-venue"]);
    expect(await idsInPlan([club, venue], "2026-10-23T10:00:00.000Z")).toEqual(["some-venue"]);
  });
});

describe("groupOpportunitiesByInterest — records missing from the assets", () => {
  it("clubs and events missing from clubs.json / events.json are always kept", async () => {
    const all = [opp("old-club", "club", "2026-11-01T00:00:00.000Z"), opp("not-in-assets", "event", "2020-01-01T00:00:00.000Z")];
    expect(await idsInPlan(all, "2026-11-12T12:00:00.000Z")).toEqual(["old-club", "not-in-assets"]);
  });
});
