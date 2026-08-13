# WING Remote Protocols Review Notes

## Initial findings from the attached PDF

- The document covers four remote-control surfaces for WING: **OSC remote control**, **MIDI SysEx**, **binary interfaces**, and **wapi**, a WING-specific API layer.
- The console exposes a large hierarchical internal parameter tree with a **root → audioengine → channels → channel → parameter** structure, which is useful for explaining routing/state traversal inside the app.
- The protocol guide emphasizes a conceptual distinction between **Sources** and **Inputs**: a source is the pre-mix signal origin, while an input channel is the processing destination that receives a patched source.
- Source labels can persist across patching and can be presented independently of channel labels, suggesting improvements for the app’s routing explanation, source-management UX, and signal-flow labels.
- The table of contents indicates dedicated protocol sections for **keeping remote connections alive**, **simultaneous app connections**, **OSC get/set/subscription patterns**, **metering**, and **event-driven updates**. These are strong candidates for user-facing protocol guidance or diagnostics-oriented features.

## Visual ideas captured from reviewed pages

- The internal-data diagram shows a clean **hierarchical tree** representation that can inspire an educational “protocol map” or “remote data model” card in the app.
- The source-vs-input explanation supports adding clearer microcopy and labels in Signal Flow, Snapshot Detail, and Source Management so users understand why a signal source and a processing channel are not the same object.

## Additional protocol findings from pages 16–23

- WING remote communications use **OSC on UDP port 2223**, with separate communication channels for control-engine TCP channel 1, audio-engine TCP channel 2, and metering UDP channel 3.
- Open remote connections and OSC subscriptions **time out after 10 seconds of inactivity** and therefore require periodic keep-alive traffic.
- WING can communicate with **up to 24 connected clients** simultaneously, while OSC data subscription is limited to **one active subscription target at a time**.
- OSC supports **read/get**, **write/set**, **toggle**, **enumerated string**, and **node/batch** operations. The node model is especially useful because multiple related parameter changes can be represented in one hierarchical command.
- The OSC examples show practical parameter paths such as channel fader and mute commands, plus a port-redirection pattern for receiving replies on a specific port. These examples could support a new in-app **Protocol Explorer / OSC command reference** feature grounded in snapshot entities.
- The source pages visually reinforce two product opportunities: a protocol help panel that explains how WING’s node tree maps to channels/buses/matrices, and an entity-specific command preview that turns a selected snapshot object into example OSC paths and operations.

## Metering and selected visual asset

- The metering section documents UDP metering as a distinct channel that uses request identifiers, reports selected meter collections, and times out after five seconds. This supports clearly separating a future live-metering feature from the offline snapshot parser.
- The document’s internal-data tree diagram from page 14 was rendered and cropped for use as a user-provided visual reference. It clearly depicts the path from the WING root through the audio engine and channel subtree to individual parameters such as fader and color.
