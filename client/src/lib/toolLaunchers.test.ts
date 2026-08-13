import { describe, expect, it } from "vitest";
import { snapshotToolConfig } from "./toolLaunchers";

describe("snapshot tool launchers", () => {
  it("maps every snapshot tool to a functional snapshot-specific path", () => {
    expect(snapshotToolConfig.routing.path(12)).toBe("/snapshot/12#exports");
    expect(snapshotToolConfig["signal-flow"].path(12)).toBe("/snapshot/12/signal-flow");
    expect(snapshotToolConfig.linter.path(12)).toBe("/snapshot/12/linter");
    expect(snapshotToolConfig["source-management"].path(12)).toBe("/snapshot/12/source-management");
  });
});
