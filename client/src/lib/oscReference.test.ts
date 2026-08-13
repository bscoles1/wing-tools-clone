import { describe, expect, it } from "vitest";
import { getOscChannelReference, wingRemoteFacts } from "./oscReference";

describe("OSC channel reference", () => {
  it("generates the documented channel path family for a selected snapshot channel", () => {
    const reference = getOscChannelReference(12);

    expect(reference.targetPath).toBe("/ch/12");
    expect(reference.commands.map((command) => command.command)).toEqual([
      "/ch/12/fdr",
      "/ch/12/fdr ,f <value>",
      "/ch/12/mute ,i 1",
    ]);
  });

  it("keeps the remote connection guidance available to the UI", () => {
    expect(wingRemoteFacts.find((fact) => fact.label === "OSC endpoint")?.value).toBe("UDP 2223");
    expect(wingRemoteFacts.find((fact) => fact.label === "Keep-alive")?.value).toBe("10 seconds");
  });
});
