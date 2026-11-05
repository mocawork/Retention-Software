import { describe, expect, it } from "vitest";

import {
  formatCount,
  formatDate,
  formatDateTime,
  formatLongDate,
  formatPercent,
  formatRupees,
  formatRupeesCompact,
  formatTime,
  partOfDay,
} from "./format";

describe("formatRupees (tables: full Indian grouping)", () => {
  it("shows paise as whole rupees with lakh grouping", () => {
    expect(formatRupees(48_230_000)).toBe("₹4,82,300");
    expect(formatRupees(1_234_567_800)).toBe("₹1,23,45,678");
    expect(formatRupees(0)).toBe("₹0");
  });

  it("never shows paise", () => {
    expect(formatRupees(99_949)).toBe("₹999");
    expect(formatRupees(99_950)).toBe("₹1,000");
  });

  it("handles refunds", () => {
    expect(formatRupees(-150_000)).toBe("-₹1,500");
  });

  it("rejects values that aren't money", () => {
    expect(() => formatRupees(Number.NaN)).toThrow(RangeError);
  });
});

describe("formatRupeesCompact (cards: lakh / crore, never K/M)", () => {
  it("keeps small amounts in full", () => {
    expect(formatRupeesCompact(95_000)).toBe("₹950");
    expect(formatRupeesCompact(8_230_000)).toBe("₹82,300");
  });

  it("uses lakh from ₹1,00,000", () => {
    expect(formatRupeesCompact(10_000_000)).toBe("₹1L");
    expect(formatRupeesCompact(48_230_000)).toBe("₹4.8L");
    expect(formatRupeesCompact(48_690_000)).toBe("₹4.8L"); // never rounds up
  });

  it("uses crore from ₹1,00,00,000", () => {
    expect(formatRupeesCompact(1_000_000_000)).toBe("₹1Cr");
    expect(formatRupeesCompact(1_250_000_000)).toBe("₹1.2Cr");
    expect(formatRupeesCompact(99_999_000)).toBe("₹9.9L");
  });

  it("keeps the sign", () => {
    expect(formatRupeesCompact(-48_230_000)).toBe("-₹4.8L");
  });
});

describe("numbers and percentages", () => {
  it("groups counts the Indian way", () => {
    expect(formatCount(1284)).toBe("1,284");
    expect(formatCount(1_234_567)).toBe("12,34,567");
  });

  it("shows one decimal at most, with the base", () => {
    expect(formatPercent(18.24, 12_400, "customers")).toBe("18.2% of 12,400 customers");
    expect(formatPercent(50)).toBe("50%");
  });
});

describe("dates and times (brand timezone, IST by default)", () => {
  it("formats dates like 12 Aug 2026", () => {
    expect(formatDate("2026-08-12T10:00:00Z")).toBe("12 Aug 2026");
    expect(formatDate("2026-09-01T10:00:00Z")).toBe("1 Sep 2026");
  });

  it("uses the brand's day, not UTC's", () => {
    // 20:00 UTC on 11 Aug is 01:30 on 12 Aug in India.
    expect(formatDate("2026-08-11T20:00:00Z")).toBe("12 Aug 2026");
    expect(formatDate("2026-08-11T20:00:00Z", "Europe/London")).toBe("11 Aug 2026");
  });

  it("uses 12-hour time with am/pm", () => {
    expect(formatTime("2026-08-12T09:35:00Z")).toBe("3:05 pm");
    expect(formatTime("2026-08-11T20:00:00Z")).toBe("1:30 am");
    expect(formatDateTime("2026-08-12T09:35:00Z")).toBe("12 Aug 2026, 3:05 pm");
  });

  it("writes the Home header date", () => {
    expect(formatLongDate("2026-11-05T06:00:00Z")).toBe("Thursday, 5 Nov 2026");
  });

  it("knows the part of the day in the brand's timezone", () => {
    expect(partOfDay("2026-11-05T03:00:00Z")).toBe("morning"); // 8:30 am IST
    expect(partOfDay("2026-11-05T09:00:00Z")).toBe("afternoon"); // 2:30 pm IST
    expect(partOfDay("2026-11-05T15:00:00Z")).toBe("evening"); // 8:30 pm IST
  });

  it("rejects invalid dates", () => {
    expect(() => formatDate("not a date")).toThrow(RangeError);
  });
});
