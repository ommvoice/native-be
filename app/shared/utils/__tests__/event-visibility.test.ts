import { describe, expect, it } from "vitest";
import { AppClock } from "../app-clock";
import events from "../../assets/events.json";
import {
  getEventVisibilityWindow,
  isEventVisible,
  resolveEventEndTime,
  type EventVisibilityFields,
} from "../event-visibility";

// The spec example: Monday 07/12/2026, 16:00–18:00 (mixed timings), promotion from 01/11/2026.
const christmasEvent: EventVisibilityFields = {
  eventStartDate: "2026-12-07T00:00:00.000Z",
  eventEndDate: "2026-12-07T00:00:00.000Z",
  ticketSalesStartDate: "2026-11-01T00:00:00.000Z",
  eventDailyFixedTimings: false,
  eventMixedTimingsMondayEnd: "18:00",
};

describe("resolveEventEndTime", () => {
  it("uses the mixed timing for the end date's weekday", () => {
    expect(resolveEventEndTime(christmasEvent)).toBe("18:00");
    expect(resolveEventEndTime({ ...christmasEvent, eventMixedTimingsMondayEnd: null, eventMixedTimingsTuesdayEnd: "18:00" })).toBeNull();
  });

  it("prefers daily fixed, then weekly fixed timings", () => {
    expect(resolveEventEndTime({ ...christmasEvent, eventDailyFixedTimings: true, eventDailyFixedEndTime: "17:30", eventWeeklyFixedEndTime: "19:00" })).toBe("17:30");
    expect(resolveEventEndTime({ ...christmasEvent, eventWeeklyFixedEndTime: "19:00" })).toBe("19:00");
  });

  it("ignores the daily fixed end time when daily fixed timings is off", () => {
    expect(resolveEventEndTime({ ...christmasEvent, eventDailyFixedEndTime: "17:30" })).toBe("18:00");
  });
});

describe("getEventVisibilityWindow", () => {
  it("spec example: shown from 01/11 00:00, removed 07/12 17:00 (UK)", () => {
    const { showFrom, hideAt } = getEventVisibilityWindow(christmasEvent);
    expect(showFrom?.toISOString()).toBe("2026-11-01T00:00:00.000Z"); // GMT
    expect(hideAt?.toISOString()).toBe("2026-12-07T17:00:00.000Z");
  });

  it("handles British Summer Time (UK 00:00 / 17:00 are 23:00Z / 16:00Z)", () => {
    const { showFrom, hideAt } = getEventVisibilityWindow({
      eventEndDate: "2026-07-20T00:00:00.000Z", // Monday
      ticketSalesStartDate: "2026-06-03T00:00:00.000Z",
      eventMixedTimingsMondayEnd: "18:00",
    });
    expect(showFrom?.toISOString()).toBe("2026-06-02T23:00:00.000Z");
    expect(hideAt?.toISOString()).toBe("2026-07-20T16:00:00.000Z");
  });

  it("accepts Date values as well as ISO strings", () => {
    const { showFrom, hideAt } = getEventVisibilityWindow({
      ...christmasEvent,
      eventEndDate: new Date("2026-12-07T00:00:00.000Z"),
      ticketSalesStartDate: new Date("2026-11-01T00:00:00.000Z"),
    });
    expect(showFrom?.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(hideAt?.toISOString()).toBe("2026-12-07T17:00:00.000Z");
  });

  it("no end time → shown for the whole end date", () => {
    const { hideAt } = getEventVisibilityWindow({ ...christmasEvent, eventMixedTimingsMondayEnd: null });
    expect(hideAt?.toISOString()).toBe("2026-12-08T00:00:00.000Z");
  });

  it("no end date → falls back to the start date", () => {
    const { hideAt } = getEventVisibilityWindow({ ...christmasEvent, eventEndDate: null });
    expect(hideAt?.toISOString()).toBe("2026-12-07T17:00:00.000Z");
  });

  it("end time before 01:00 → removed the evening before", () => {
    const { hideAt } = getEventVisibilityWindow({ ...christmasEvent, eventMixedTimingsMondayEnd: "00:30" });
    expect(hideAt?.toISOString()).toBe("2026-12-06T23:30:00.000Z");
  });

  it("no promotion date / no dates → open-ended", () => {
    expect(getEventVisibilityWindow({ ...christmasEvent, ticketSalesStartDate: null }).showFrom).toBeNull();
    expect(getEventVisibilityWindow({})).toEqual({ showFrom: null, hideAt: null });
  });
});

describe("isEventVisible", () => {
  const at = (iso: string) => new Date(iso);

  it("spec example: hidden before 01/11, shown from 01/11 00:00 until 07/12 16:59, hidden from 17:00", () => {
    expect(isEventVisible(christmasEvent, at("2026-10-31T23:59:59.000Z"))).toBe(false);
    expect(isEventVisible(christmasEvent, at("2026-11-01T00:00:00.000Z"))).toBe(true);
    expect(isEventVisible(christmasEvent, at("2026-12-07T16:59:59.000Z"))).toBe(true);
    expect(isEventVisible(christmasEvent, at("2026-12-07T17:00:00.000Z"))).toBe(false);
    expect(isEventVisible(christmasEvent, at("2026-12-08T10:00:00.000Z"))).toBe(false);
  });

  it("no window bounds → always visible", () => {
    expect(isEventVisible({}, at("2030-01-01T00:00:00.000Z"))).toBe(true);
  });
});

describe("real event from events.json: christingle", () => {
  // Monday 07/12/2026 16:00–18:00 (mixed timings), ticket sales from 01/11/2026.
  const christingle = (events as EventVisibilityFields[] & { id: string }[]).find((e) => e.id === "christingle")!;
  const at = (iso: string) => new Date(iso);

  it("is in the asset file with the expected dates", () => {
    expect(christingle).toBeDefined();
    expect(resolveEventEndTime(christingle)).toBe("18:00");
  });

  it("window: shown from 01/11/2026 00:00, removed 07/12/2026 17:00 (UK)", () => {
    const { showFrom, hideAt } = getEventVisibilityWindow(christingle);
    expect(showFrom?.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(hideAt?.toISOString()).toBe("2026-12-07T17:00:00.000Z");
  });

  it("visibility at key moments", () => {
    expect(isEventVisible(christingle, at("2026-10-31T23:59:59.000Z"))).toBe(false); // before promotion
    expect(isEventVisible(christingle, at("2026-11-01T00:00:00.000Z"))).toBe(true);  // promotion starts
    expect(isEventVisible(christingle, at("2026-11-12T12:00:00.000Z"))).toBe(true);  // mid-promotion
    expect(isEventVisible(christingle, at("2026-12-07T16:00:00.000Z"))).toBe(true);  // event has started
    expect(isEventVisible(christingle, at("2026-12-07T16:59:59.000Z"))).toBe(true);  // last second shown
    expect(isEventVisible(christingle, at("2026-12-07T17:00:00.000Z"))).toBe(false); // 1h before 18:00 end
    expect(isEventVisible(christingle, at("2026-12-07T18:00:00.000Z"))).toBe(false); // event finished
  });
});

describe("AppClock.fromWallClock", () => {
  it("converts UK wall-clock to the right instant in GMT and BST", () => {
    expect(AppClock.fromWallClock("2026-12-07", 16 * 60)?.toISOString()).toBe("2026-12-07T16:00:00.000Z");
    expect(AppClock.fromWallClock("2026-07-01", 16 * 60)?.toISOString()).toBe("2026-07-01T15:00:00.000Z");
  });

  it("handles the clock-change days", () => {
    // 29/03/2026 clocks go forward at 01:00 GMT; 25/10/2026 they go back at 02:00 BST.
    expect(AppClock.fromWallClock("2026-03-29", 3 * 60)?.toISOString()).toBe("2026-03-29T02:00:00.000Z");
    expect(AppClock.fromWallClock("2026-10-25", 12 * 60)?.toISOString()).toBe("2026-10-25T12:00:00.000Z");
  });

  it("rejects bad dates", () => {
    expect(AppClock.fromWallClock("not-a-date")).toBeNull();
  });
});
