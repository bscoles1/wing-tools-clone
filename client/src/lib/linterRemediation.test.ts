import { describe, expect, it } from "vitest";
import { getLintRemediation } from "./linterRemediation";

describe("getLintRemediation", () => {
  it("gives a specific next step for a known lint rule", () => {
    expect(getLintRemediation("Unpatched Channels")).toContain("Assign a physical");
    expect(getLintRemediation("High Gain Levels")).toContain("headroom");
  });

  it("keeps an actionable fallback for unknown rules", () => {
    expect(getLintRemediation("Future Rule")).toContain("Review the listed signals");
  });
});
