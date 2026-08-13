# Patch-Flow Signal Flow Canvas Design

## Reference translation

The supplied reference uses a wide, zoomable patch canvas rather than a radial map. It arranges grouped endpoint blocks in horizontal routing lanes, draws visible cables between them, provides plus/minus/reset navigation, and includes a minimap for orientation. This implementation uses the same interaction model with the project’s parsed WING snapshot data.

## Routing lanes

| Lane | WING entities | Placement | Connections |
|---|---|---|---|
| Source patches | Physical inputs grouped by local and stagebox/source group | Top | Feed assigned mixer channels. |
| Mixer inputs | Channel strips | Upper middle | Receive physical inputs; feed buses, matrices, and outputs. |
| Mixer outputs | Buses and matrices | Lower middle | Receive channel/mix sources; feed physical outputs. |
| Device outputs | Physical output patches grouped by device/source group | Bottom | Receive channel, bus, or matrix feeds. |

## Canvas behavior

Every routing entity is an endpoint chip with a visible patch cable for each known normalized edge. Cables use the entity color of their upstream source. Selecting a chip keeps the existing Route Inspector and highlights all upstream/downstream cables. **Focus selected route** hides unrelated endpoint chips and cables. The canvas supports drag-to-pan, plus/minus zoom, fit/reset controls, and a minimap. Search, entity-type, and source-group filters narrow the rendered patch chips before the edge set is built.
