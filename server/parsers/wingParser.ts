/**
 * WING Snapshot Parser
 * 
 * Parses Behringer WING .snap JSON files and normalizes them into an internal data model
 * for consistent handling across the application.
 */

export interface WingInput {
  id: string;
  name: string;
  group: string; // e.g., "LCL", "AES50A", "USB"
  index: number;
  gain?: number;
  phantomPower?: boolean;
  stereoMode?: "mono" | "stereo";
  usedBy?: string[]; // List of channels/buses using this input
}

export interface WingOutput {
  id: string;
  name: string;
  group: string;
  index: number;
  source?: {
    group: string;
    index: number;
  };
  level?: number;
}

export interface WingChannel {
  id: string;
  index: number;
  name: string;
  inputSource?: {
    group: string;
    index: number;
  };
  routes: Array<{
    destination: "bus" | "matrix" | "output";
    group: string;
    index: number;
    level?: number;
  }>;
  gain?: number;
  mute?: boolean;
  solo?: boolean;
}

export interface WingBus {
  id: string;
  index: number;
  name: string;
  isMono: boolean;
  routes: Array<{
    destination: "matrix" | "output";
    group: string;
    index: number;
    level?: number;
  }>;
  gain?: number;
  mute?: boolean;
}

export interface WingMatrix {
  id: string;
  index: number;
  name: string;
  isMono: boolean;
  routes: Array<{
    destination: "output";
    group: string;
    index: number;
    level?: number;
  }>;
  gain?: number;
  mute?: boolean;
}

export interface WingMixerSnapshot {
  metadata: {
    mixerName?: string;
    mixerModel?: string;
    firmware?: string;
    snapshotSchema?: string;
    createdAt?: string;
  };
  inputs: WingInput[];
  outputs: WingOutput[];
  channels: WingChannel[];
  buses: WingBus[];
  matrices: WingMatrix[];
  summary: {
    totalInputs: number;
    totalOutputs: number;
    totalChannels: number;
    activeRoutes: number;
  };
}

/**
 * Helper function to safely extract nested JSON values
 */
function getNestedValue(obj: any, keys: string[]): any {
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Helper to convert JSON values to appropriate types
 */
function toBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value === "1" || value.toLowerCase() === "true";
  return false;
}

function toNumber(value: any): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Parse a Behringer WING .snap file (JSON) into the internal data model
 */
export function parseWingSnapshot(rawJson: any): WingMixerSnapshot {
  // Locate the data root (ae_data or root itself)
  let dataRoot = rawJson;
  if (rawJson.ae_data && typeof rawJson.ae_data === "object") {
    dataRoot = rawJson.ae_data;
  }

  if (!dataRoot || typeof dataRoot !== "object") {
    throw new Error("Invalid WING snapshot: could not locate data root");
  }

  // Extract metadata
  const metadata = {
    mixerName: dataRoot.name || "WING Mixer",
    mixerModel: dataRoot.model || "wing",
    firmware: dataRoot.fw || undefined,
    snapshotSchema: dataRoot.schema || "snapshot.9",
    createdAt: new Date().toISOString(),
  };

  // Parse inputs
  const inputs = parseInputs(dataRoot);

  // Parse outputs
  const outputs = parseOutputs(dataRoot);

  // Parse channels
  const channels = parseChannels(dataRoot);

  // Parse buses
  const buses = parseBuses(dataRoot);

  // Parse matrices
  const matrices = parseMatrices(dataRoot);

  // Calculate summary
  const summary = {
    totalInputs: inputs.length,
    totalOutputs: outputs.length,
    totalChannels: channels.length,
    activeRoutes: countActiveRoutes(channels, buses, matrices),
  };

  return {
    metadata,
    inputs,
    outputs,
    channels,
    buses,
    matrices,
    summary,
  };
}

/**
 * Parse input sources from the io.in section
 */
function parseInputs(dataRoot: any): WingInput[] {
  const inputs: WingInput[] = [];
  const ioIn = getNestedValue(dataRoot, ["io", "in"]);

  if (!ioIn || typeof ioIn !== "object") {
    return inputs;
  }

  // Iterate over input groups (LCL, AES50A, AES50C, USB, etc.)
  for (const [groupName, groupData] of Object.entries(ioIn || {})) {
    if (typeof groupData !== "object" || groupData === null) continue;

    // Iterate over individual inputs within the group
    for (const [indexStr, inputData] of Object.entries(groupData || {})) {
      if (typeof inputData !== "object") continue;

      const index = parseInt(indexStr, 10);
      if (isNaN(index)) continue;

      const input: WingInput = {
        id: `${groupName}_${index}`,
        name: (inputData as any).name || `${groupName} ${index}`,
        group: groupName,
        index,
        gain: toNumber((inputData as any).gain),
        phantomPower: toBoolean((inputData as any).phantom),
        stereoMode: (inputData as any).stereo === true ? "stereo" : "mono",
        usedBy: [],
      };

      inputs.push(input);
    }
  }

  return inputs;
}

/**
 * Parse output destinations from the io.out section
 */
function parseOutputs(dataRoot: any): WingOutput[] {
  const outputs: WingOutput[] = [];
  const ioOut = getNestedValue(dataRoot, ["io", "out"]);

  if (!ioOut || typeof ioOut !== "object") {
    return outputs;
  }

  // Iterate over output groups (LCL, AES50A, AES50C, USB, CRD, etc.)
  for (const [groupName, groupData] of Object.entries(ioOut || {})) {
    if (typeof groupData !== "object" || groupData === null) continue;

    // Iterate over individual outputs within the group
    for (const [indexStr, outputData] of Object.entries(groupData || {})) {
      if (typeof outputData !== "object") continue;

      const index = parseInt(indexStr, 10);
      if (isNaN(index)) continue;

      const output: WingOutput = {
        id: `${groupName}_${index}`,
        name: (outputData as any).name || `${groupName} ${index}`,
        group: groupName,
        index,
        source: undefined,
        level: toNumber((outputData as any).level),
      };

      // Parse source routing
      const sourceGroup = (outputData as any).grp;
      const sourceIndex = toNumber((outputData as any).in);
      if (sourceGroup && sourceIndex !== undefined) {
        output.source = {
          group: sourceGroup,
          index: sourceIndex,
        };
      }

      outputs.push(output);
    }
  }

  return outputs;
}

/**
 * Parse mixer channels from the ch section
 */
function parseChannels(dataRoot: any): WingChannel[] {
  const channels: WingChannel[] = [];
  const chData = getNestedValue(dataRoot, ["ch"]);

  if (!chData || typeof chData !== "object") {
    return channels;
  }

  for (const [indexStr, channelData] of Object.entries(chData || {})) {
    if (typeof channelData !== "object" || channelData === null) continue;

    const index = parseInt(indexStr, 10);
    if (isNaN(index)) continue;

    const channel: WingChannel = {
      id: `CH${index}`,
      index,
      name: (channelData as any).name || `Channel ${index}`,
      routes: [],
      gain: toNumber((channelData as any).gain),
      mute: toBoolean((channelData as any).mute),
      solo: toBoolean((channelData as any).solo),
    };

    // Parse input source
    const inputGroup = (channelData as any).src_grp;
    const inputIndex = toNumber((channelData as any).src_in);
    if (inputGroup && inputIndex !== undefined) {
      channel.inputSource = {
        group: inputGroup,
        index: inputIndex,
      };
    }

    // Parse routing to buses and matrices
    const chRoutes = getNestedValue(channelData, ["rt"]);
    if (chRoutes && typeof chRoutes === "object") {
      for (const [routeType, routeObject] of Object.entries(chRoutes)) {
        if (typeof routeObject !== "object" || routeObject === null) continue;
        for (const [routeIndexStr, routeValue] of Object.entries(routeObject)) {
          if (toBoolean(routeValue)) {
            const routeIndex = parseInt(routeIndexStr, 10);
            if (!isNaN(routeIndex)) {
              channel.routes.push({
                destination: routeType as "bus" | "matrix" | "output",
                group: routeType,
                index: routeIndex,
              });
            }
          }
        }
      }
    }

    channels.push(channel);
  }

  return channels;
}

/**
 * Parse mix buses from the bus section
 */
function parseBuses(dataRoot: any): WingBus[] {
  const buses: WingBus[] = [];
  const busData = getNestedValue(dataRoot, ["bus"]);

  if (!busData || typeof busData !== "object") {
    return buses;
  }

  for (const [indexStr, busItem] of Object.entries(busData || {})) {
    if (typeof busItem !== "object" || busItem === null) continue;

    const index = parseInt(indexStr, 10);
    if (isNaN(index)) continue;

    const bus: WingBus = {
      id: `BUS${index}`,
      index,
      name: (busItem as any).name || `Bus ${index}`,
      isMono: toBoolean((busItem as any).busmono),
      routes: [],
      gain: toNumber((busItem as any).gain),
      mute: toBoolean((busItem as any).mute),
    };

    // Parse routing from bus to matrices and outputs
    const busRoutes = getNestedValue(busItem, ["rt"]);
    if (busRoutes && typeof busRoutes === "object") {
      for (const [routeType, routeObject] of Object.entries(busRoutes)) {
        if (typeof routeObject !== "object" || routeObject === null) continue;
        for (const [routeIndexStr, routeValue] of Object.entries(routeObject)) {
          if (toBoolean(routeValue)) {
            const routeIndex = parseInt(routeIndexStr, 10);
            if (!isNaN(routeIndex)) {
              bus.routes.push({
                destination: routeType as "matrix" | "output",
                group: routeType,
                index: routeIndex,
              });
            }
          }
        }
      }
    }

    buses.push(bus);
  }

  return buses;
}

/**
 * Parse matrix mixes from the mtx section
 */
function parseMatrices(dataRoot: any): WingMatrix[] {
  const matrices: WingMatrix[] = [];
  const mtxData = getNestedValue(dataRoot, ["mtx"]);

  if (!mtxData || typeof mtxData !== "object") {
    return matrices;
  }

  for (const [indexStr, mtxItem] of Object.entries(mtxData || {})) {
    if (typeof mtxItem !== "object" || mtxItem === null) continue;

    const index = parseInt(indexStr, 10);
    if (isNaN(index)) continue;

    const matrix: WingMatrix = {
      id: `MTX${index}`,
      index,
      name: (mtxItem as any).name || `Matrix ${index}`,
      isMono: toBoolean((mtxItem as any).mtxmono),
      routes: [],
      gain: toNumber((mtxItem as any).gain),
      mute: toBoolean((mtxItem as any).mute),
    };

    // Parse routing from matrix to outputs
    const mtxRoutes = getNestedValue(mtxItem, ["rt"]);
    if (mtxRoutes && typeof mtxRoutes === "object") {
      for (const [routeType, routeObject] of Object.entries(mtxRoutes)) {
        if (typeof routeObject !== "object" || routeObject === null) continue;
        for (const [routeIndexStr, routeValue] of Object.entries(routeObject)) {
          if (toBoolean(routeValue)) {
            const routeIndex = parseInt(routeIndexStr, 10);
            if (!isNaN(routeIndex)) {
              matrix.routes.push({
                destination: routeType as "output",
                group: routeType,
                index: routeIndex,
              });
            }
          }
        }
      }
    }

    matrices.push(matrix);
  }

  return matrices;
}

/**
 * Count the number of active routes in the snapshot
 */
function countActiveRoutes(
  channels: WingChannel[],
  buses: WingBus[],
  matrices: WingMatrix[]
): number {
  let count = 0;

  // Count channel input sources
  for (const channel of channels) {
    if (channel.inputSource) count++;
    count += channel.routes.length;
  }

  // Count bus routes
  for (const bus of buses) {
    count += bus.routes.length;
  }

  // Count matrix routes
  for (const matrix of matrices) {
    count += matrix.routes.length;
  }

  return count;
}

/**
 * Serialize the internal model back to a WING snapshot JSON format
 */
export function serializeWingSnapshot(snapshot: WingMixerSnapshot): any {
  const output: any = {
    name: snapshot.metadata.mixerName,
    model: snapshot.metadata.mixerModel,
    fw: snapshot.metadata.firmware,
    schema: snapshot.metadata.snapshotSchema,
    ae_data: {
      io: {
        in: {},
        out: {},
      },
      ch: {},
      bus: {},
      mtx: {},
      main: {},
    },
  };

  // Serialize inputs
  for (const input of snapshot.inputs) {
    if (!output.ae_data.io.in[input.group]) {
      output.ae_data.io.in[input.group] = {};
    }
    output.ae_data.io.in[input.group][input.index] = {
      name: input.name,
      gain: input.gain,
      phantom: input.phantomPower ? 1 : 0,
      stereo: input.stereoMode === "stereo" ? 1 : 0,
    };
  }

  // Serialize outputs
  for (const output_ of snapshot.outputs) {
    if (!output.ae_data.io.out[output_.group]) {
      output.ae_data.io.out[output_.group] = {};
    }
    output.ae_data.io.out[output_.group][output_.index] = {
      name: output_.name,
      level: output_.level,
      grp: output_.source?.group,
      in: output_.source?.index,
    };
  }

  // Serialize channels
  for (const channel of snapshot.channels) {
    const chRoutes: any = {};
    for (const route of channel.routes) {
      if (!chRoutes[route.group]) {
        chRoutes[route.group] = {};
      }
      chRoutes[route.group][route.index] = 1; // Assuming 1 for active route
    }

    output.ae_data.ch[channel.index] = {
      name: channel.name,
      gain: channel.gain,
      mute: channel.mute ? 1 : 0,
      solo: channel.solo ? 1 : 0,
      src_grp: channel.inputSource?.group,
      src_in: channel.inputSource?.index,
      rt: chRoutes,
    };
  }

  // Serialize buses
  for (const bus of snapshot.buses) {
    const busRoutes: any = {};
    for (const route of bus.routes) {
      if (!busRoutes[route.group]) {
        busRoutes[route.group] = {};
      }
      busRoutes[route.group][route.index] = 1;
    }

    output.ae_data.bus[bus.index] = {
      name: bus.name,
      busmono: bus.isMono ? 1 : 0,
      gain: bus.gain,
      mute: bus.mute ? 1 : 0,
      rt: busRoutes,
    };
  }

  // Serialize matrices
  for (const matrix of snapshot.matrices) {
    const mtxRoutes: any = {};
    for (const route of matrix.routes) {
      if (!mtxRoutes[route.group]) {
        mtxRoutes[route.group] = {};
      }
      mtxRoutes[route.group][route.index] = 1;
    }

    output.ae_data.mtx[matrix.index] = {
      name: matrix.name,
      mtxmono: matrix.isMono ? 1 : 0,
      gain: matrix.gain,
      mute: matrix.mute ? 1 : 0,
      rt: mtxRoutes,
    };
  }

  return output;
}
