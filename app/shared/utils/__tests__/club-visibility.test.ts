import { describe, expect, it } from "vitest";
import clubs from "../../assets/clubs.json";
import {
  getClubVisibilityWindow,
  isClubVisible,
  lastSessionEnd,
  resolveClubEndTime,
  type ClubVisibilityFields,
} from "../club-visibility";

const at = (iso: string) => new Date(iso);

// The spec example: 11/09/2026 → 23/10/2026 (a Friday), daily 09:00–11:00.
const playgroup: ClubVisibilityFields = {
  clubStartDate: "2026-09-11T00:00:00.000Z",
  clubEndDate: "2026-10-23T00:00:00.000Z",
  clubFixedDailyTimings: true,
  clubDailyEndTime: "11:00",
};

describe("lastSessionEnd", () => {
  it("returns the latest end time in a session schedule", () => {
    expect(lastSessionEnd("09:00-11:00, 11:30-13:30, 14:00-16:00")).toBe("16:00");
    expect(lastSessionEnd("14:00-16:00, 09:00-11:00")).toBe("16:00");
    expect(lastSessionEnd(null)).toBeNull();
    expect(lastSessionEnd("rubbish")).toBeNull();
  });
});

describe("resolveClubEndTime", () => {
  it("fixed daily end time first", () => {
    expect(resolveClubEndTime(playgroup)).toBe("11:00");
  });

  it("ignores the daily end time when fixed daily timings is off", () => {
    expect(resolveClubEndTime({ ...playgroup, clubFixedDailyTimings: false })).toBeNull();
  });

  it("then the mixed timing for the end date's weekday (Friday)", () => {
    expect(resolveClubEndTime({ ...playgroup, clubFixedDailyTimings: false, clubMixedTimingsFridayEndTime: "12:00", clubMixedTimingsMondayEndTime: "11:30" })).toBe("12:00");
  });

  it("then that weekday's multi-session schedule, then the daily session schedule", () => {
    expect(resolveClubEndTime({ ...playgroup, clubFixedDailyTimings: false, clubMultiSessionFridaySchedule: "09:00-11:00, 11:30-13:30" })).toBe("13:30");
    expect(resolveClubEndTime({ ...playgroup, clubFixedDailyTimings: false, clubDailyFixedSessionSchedule: "09:00-10:00, 15:00-17:00" })).toBe("17:00");
  });
});

describe("getClubVisibilityWindow", () => {
  it("spec example: shown from 04/09 00:00, removed 23/10 11:00 (UK, BST)", () => {
    const { showFrom, hideAt } = getClubVisibilityWindow(playgroup);
    expect(showFrom?.toISOString()).toBe("2026-09-03T23:00:00.000Z"); // 04/09 00:00 BST
    expect(hideAt?.toISOString()).toBe("2026-10-23T10:00:00.000Z");   // 23/10 11:00 BST
  });

  it("7 days before crosses a month boundary correctly", () => {
    const { showFrom } = getClubVisibilityWindow({ clubStartDate: "2026-12-03T00:00:00.000Z" });
    expect(showFrom?.toISOString()).toBe("2026-11-26T00:00:00.000Z"); // GMT
  });

  it("no end time on the end date → shown for the whole end date", () => {
    const { hideAt } = getClubVisibilityWindow({ ...playgroup, clubFixedDailyTimings: false });
    expect(hideAt?.toISOString()).toBe("2026-10-23T23:00:00.000Z"); // 24/10 00:00 BST
  });

  it("no start / end date → open-ended", () => {
    expect(getClubVisibilityWindow({ ...playgroup, clubStartDate: null }).showFrom).toBeNull();
    expect(getClubVisibilityWindow({ ...playgroup, clubEndDate: null }).hideAt).toBeNull();
    expect(getClubVisibilityWindow({})).toEqual({ showFrom: null, hideAt: null });
  });
});

describe("isClubVisible", () => {
  it("spec example at key moments", () => {
    expect(isClubVisible(playgroup, at("2026-09-03T22:59:59.000Z"))).toBe(false); // 03/09 23:59 UK
    expect(isClubVisible(playgroup, at("2026-09-03T23:00:00.000Z"))).toBe(true);  // 04/09 00:00 UK
    expect(isClubVisible(playgroup, at("2026-09-11T08:00:00.000Z"))).toBe(true);  // first day 09:00 UK
    expect(isClubVisible(playgroup, at("2026-10-23T09:59:59.000Z"))).toBe(true);  // 23/10 10:59 UK
    expect(isClubVisible(playgroup, at("2026-10-23T10:00:00.000Z"))).toBe(false); // 23/10 11:00 UK
    expect(isClubVisible(playgroup, at("2026-11-12T12:00:00.000Z"))).toBe(false);
  });

  it("no window bounds → always visible", () => {
    expect(isClubVisible({}, at("2030-01-01T00:00:00.000Z"))).toBe(true);
  });
});

describe("real clubs from clubs.json", () => {
  const club = (id: string) => (clubs as (ClubVisibilityFields & { id: string })[]).find((c) => c.id === id)!;

  it("tick_tock_lympstone_playgroup_2 (11/09 → 23/10, daily 09:00–11:00) matches the spec example", () => {
    const c = club("tick_tock_lympstone_playgroup_2");
    expect(c).toBeDefined();
    const { showFrom, hideAt } = getClubVisibilityWindow(c);
    expect(showFrom?.toISOString()).toBe("2026-09-03T23:00:00.000Z");
    expect(hideAt?.toISOString()).toBe("2026-10-23T10:00:00.000Z");
    expect(isClubVisible(c, at("2026-11-12T12:00:00.000Z"))).toBe(false); // finished
  });

  it("robin_wood_forest_school_under_5s (mixed timings) ends at its Friday end time, 12:00", () => {
    const c = club("robin_wood_forest_school_under_5s");
    expect(resolveClubEndTime(c)).toBe("12:00");
    expect(getClubVisibilityWindow(c).hideAt?.toISOString()).toBe("2026-10-23T11:00:00.000Z");
  });

  it("tick_tock_lympstone_playgroup (06/11 → 18/12/2026, daily 09:00–11:00): shown from 30/10 00:00, removed 18/12 11:00 (GMT)", () => {
    const c = club("tick_tock_lympstone_playgroup");
    expect(resolveClubEndTime(c)).toBe("11:00");
    const { showFrom, hideAt } = getClubVisibilityWindow(c);
    expect(showFrom?.toISOString()).toBe("2026-10-30T00:00:00.000Z");
    expect(hideAt?.toISOString()).toBe("2026-12-18T11:00:00.000Z");
    expect(isClubVisible(c, at("2026-10-29T23:59:59.000Z"))).toBe(false); // 8 days before start
    expect(isClubVisible(c, at("2026-10-30T00:00:00.000Z"))).toBe(true);  // 7 days before start
    expect(isClubVisible(c, at("2026-11-12T12:00:00.000Z"))).toBe(true);  // today
    expect(isClubVisible(c, at("2026-12-18T10:59:59.000Z"))).toBe(true);  // last day, before 11:00
    expect(isClubVisible(c, at("2026-12-18T11:00:00.000Z"))).toBe(false); // last session finished
  });

  it("ocean_softplay (ongoing until 2028) is visible today", () => {
    expect(isClubVisible(club("ocean_softplay"), at("2026-11-12T12:00:00.000Z"))).toBe(true);
  });
});
