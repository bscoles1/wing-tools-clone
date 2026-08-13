import { describe, expect, it } from "vitest";
import { buildSourceTagManifest, filterSourceIds, toggleSourceTag } from "./sourceTags";

describe("Source & Tag System helpers", () => {
  it("adds and removes tags without affecting other sources", () => {
    const added = toggleSourceTag({ "LCL_1": ["Vocals"] }, "LCL_2", "Playback");
    expect(added).toEqual({ "LCL_1": ["Vocals"], "LCL_2": ["Playback"] });
    expect(toggleSourceTag(added, "LCL_1", "Vocals")["LCL_1"]).toEqual([]);
  });

  it("filters sources by tags and query text and builds a portable manifest", () => {
    const inputs = [{ id: "LCL_1", name: "Lead Vox", group: "LCL", index: 1 }, { id: "LCL_2", name: "Playback", group: "LCL", index: 2 }];
    const tags = { "LCL_1": ["Vocals"], "LCL_2": ["Playback", "Stage R"] };

    expect(filterSourceIds(inputs, tags, "", "Vocals")).toEqual([inputs[0]]);
    expect(filterSourceIds(inputs, tags, "stage r", null)).toEqual([inputs[1]]);
    expect(buildSourceTagManifest(7, "Show", inputs, tags).sources[1]).toMatchObject({ id: "LCL_2", tags: ["Playback", "Stage R"] });
  });
});
