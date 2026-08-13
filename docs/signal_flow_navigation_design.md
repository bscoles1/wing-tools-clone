# Advanced Signal Flow Navigation Design

## Viewport navigation

The mind-map canvas uses a local viewport state composed of a zoom factor and an `x`/`y` pan offset. Zoom is bounded to **60%–150%** and is available through explicit `Zoom in`, `Zoom out`, and `Reset view` controls. Desktop users can drag the background canvas to pan; touch users can drag with one finger. Pointer events beginning on a branch header, a node card, or a control do not pan the canvas, so routing interactions remain direct.

## Selected-route focus

When a node is selected, the existing trace calculation identifies upstream and downstream nodes. **Focus selected route** uses those roles to temporarily hide every branch node not in that route, while retaining the selected node, the console hub, and trace color semantics. Turning focus off restores the complete, filtered mind map without discarding the selected node or current branch filters.

## Per-branch filtering

Every open branch provides a text search field that matches the node name, group, configured patch source, and derived source label. A source filter control offers all detected source groups for that branch, plus an unfiltered **All sources** state. Filtering runs before progressive reveal, so the branch count and Show more control refer only to matching nodes. A branch with no results displays an explicit empty state and a clear-filter action.
