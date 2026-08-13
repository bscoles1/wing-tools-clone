const remediationByRule: Record<string, string> = {
  "Incomplete Snapshot Data": "Re-export the snapshot directly from the WING console if you need a complete inventory. The available data can still be reviewed safely.",
  "Unpatched Channels": "Assign a physical, USB, AES50, or expansion-card source to each channel that should carry audio.",
  "Unrouted Channels": "Route intentional program channels to Main, a bus, a matrix, or a physical output before the show.",
  "Muted Routed Channels": "Confirm that the mute is deliberate; otherwise unmute the channel after checking its destination and level.",
  "Unrouted Buses": "Assign each required monitor, effects, or subgroup bus to an output or downstream matrix.",
  "Missing Bus Sends": "Add channel sends to each bus that should receive signal, then confirm pre/post-fader behavior on the console.",
  "Unrouted Matrices": "Connect the matrix to its intended broadcast, lobby, recording, or zone output destination.",
  "OFF Routes": "Review each OFF route against the current show plan. Enable only routes that are intentionally required.",
  "Unused Inputs": "Label, disconnect, or reserve unused inputs so the patch sheet remains clear for the crew.",
  "High Gain Levels": "Lower the source or preamp gain and re-check headroom while the performer or playback source is at show level.",
  "Multiple Solo Channels": "Clear nonessential solos before handing the console to an operator to avoid confusing monitoring behavior.",
};

export function getLintRemediation(rule: string): string {
  return remediationByRule[rule] ?? "Review the listed signals against the show plan and correct any unintended routing or configuration.";
}
