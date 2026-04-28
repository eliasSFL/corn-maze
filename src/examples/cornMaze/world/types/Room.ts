import type { NPCName } from "lib/npcs";
import type { BumpkinParts } from "lib/utils/tokenUriBuilder";
import type { SceneId } from "../sceneIds";

type Moderation = { kicked: unknown[]; muted: unknown[] };
type FactionName = string;

export interface InputData {
  x: number;
  y: number;
  tick: number;
  text: string;
}

export interface Player {
  username: string;
  farmId: number;
  faction?: FactionName;
  x: number;
  y: number;
  experience: number;
  tick: number;
  clothing: BumpkinParts & { updatedAt: number };
  npc: NPCName;
  sceneId: SceneId;
  moderation: Moderation;
  inputQueue: InputData[];
}

export interface Message {
  text: string;
  farmId?: number;
  sessionId: string;
  sceneId: SceneId;
  sentAt: number;
}

export interface Reaction {
  reaction: "heart" | "sad" | "happy";
  quantity?: number;
  farmId?: number;
  sessionId: string;
  sceneId: SceneId;
  sentAt: number;
}

/** Colyseus-shaped room state (optional; chicken rescue runs with MMO disabled). */
export interface PlazaRoomState {
  mapWidth: number;
  mapHeight: number;
  players: {
    get: (sessionId: string) => Player | undefined;
    forEach: (
      callback: (player: Player, sessionId: string) => void,
    ) => void;
  };
  messages: { onAdd: (cb: (m: Message) => void) => () => void };
  reactions: { onAdd: (cb: (r: Reaction) => void) => () => void };
}
