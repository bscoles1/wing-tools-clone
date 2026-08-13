# Signal Flow Mind-Map Design

## Intent

The Signal Flow view changes from a sequential organization chart to a central-concept mind map. The **WING Console** remains the visual anchor, while routing entities radiate from it as color-coded, independently expandable branches. This maps the supplied reference’s central-topic structure to the mixer’s practical routing groups without implying a false linear signal order.

## Branch model

| Map position | Routing branch | Color | Node information | Reveal behavior |
|---|---|---|---|---|
| Upper left | Physical Inputs | Emerald | Physical patch source, name, gain, stereo/phantom context, and downstream link count | Shows the first 12 nodes, then offers **Show more** and **Show all**. |
| Lower left | Mixer Channels | Blue | Assigned input source, channel name, gain/state, and send count | Shows the first 12 nodes, then offers **Show more** and **Show all**. |
| Upper right | Mix Buses | Violet | Upstream channel sources, bus name, level/state, and destinations | Shows the first 12 nodes, then offers **Show more** and **Show all**. |
| Lower right | Matrix Mixes | Amber | Upstream channel/bus sources, matrix name, and output destinations | Shows the first 12 nodes, then offers **Show more** and **Show all**. |
| Bottom center | Physical Outputs | Rose | Configured output patch plus detected output feed and level | Shows the first 12 nodes, then offers **Show more** and **Show all**. |

## Interaction behavior

Every branch header acts as an independent expand/collapse control. Selecting a node automatically opens every branch present in its upstream/downstream route, highlights the selected node and trace path, and retains the Route Inspector. On narrow screens, branches stack in the same semantic order around the central hub so no route data is hidden behind horizontal scrolling.
