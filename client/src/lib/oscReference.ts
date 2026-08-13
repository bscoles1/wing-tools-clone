export type OscChannelReference = {
  channelIndex: number;
  targetPath: string;
  commands: Array<{ label: string; command: string; description: string }>;
};

export function getOscChannelReference(channelIndex: number): OscChannelReference {
  const targetPath = `/ch/${channelIndex}`;
  return {
    channelIndex,
    targetPath,
    commands: [
      {
        label: "Read fader",
        command: `${targetPath}/fdr`,
        description: "Request the channel fader parameter from the console.",
      },
      {
        label: "Set fader",
        command: `${targetPath}/fdr ,f <value>`,
        description: "Write a floating-point fader value; use the console’s expected range and verify the result before a show.",
      },
      {
        label: "Toggle mute",
        command: `${targetPath}/mute ,i 1`,
        description: "Toggle the channel mute state using WING’s integer toggle convention.",
      },
    ],
  };
}

export const wingRemoteFacts = [
  { label: "OSC endpoint", value: "UDP 2223", detail: "The protocol guide identifies UDP port 2223 for OSC remote control." },
  { label: "Keep-alive", value: "10 seconds", detail: "Remote connections and OSC subscriptions need periodic activity to remain active." },
  { label: "Client capacity", value: "24 clients", detail: "WING documents a maximum of 24 simultaneous TCP client connections." },
  { label: "OSC subscription", value: "1 target", detail: "Only one OSC event-data subscription target can be active at a time." },
] as const;
