import { atom } from "nanostores";
import { NPC_WEARABLES, type NPCName } from "lib/npcs";
import { tokenUriBuilder, type BumpkinParts } from "lib/utils/tokenUriBuilder";
import { clearBumpkinHunterGameOverSessionFlag } from "./bumpkinHunterPortal";

/** Bumpkins on screen per round; eat order is a permutation of this set. */
export const HIDE_AND_SEEK_BUMPKIN_COUNT = 30;

export type HideAndSeekNpcSpawn = {
  npcName: NPCName;
  tokenParts: string;
};

export type HideAndSeekRound = {
  /** Order the player must bump into NPCs (permutation of those on screen). */
  eatOrder: readonly HideAndSeekNpcSpawn[];
  /** NPCs to spawn in the scene (same set as eat order, any layout order). */
  npcSpawnList: readonly HideAndSeekNpcSpawn[];
  eatProgress: number;
  rewardClaimed: boolean;
};

export const $hideAndSeekRound = atom<HideAndSeekRound | null>(null);

function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function allNpcNames(): NPCName[] {
  return Object.keys(NPC_WEARABLES) as NPCName[];
}

function toSpawn(npcName: NPCName): HideAndSeekNpcSpawn {
  return {
    npcName,
    tokenParts: tokenUriBuilder(NPC_WEARABLES[npcName] as BumpkinParts),
  };
}

/** First NPC name in `NPC_WEARABLES` that matches this token (for UI labels). */
export function resolveNpcNameForTokenParts(
  tokenParts: string,
): NPCName | undefined {
  for (const name of allNpcNames()) {
    if (toSpawn(name).tokenParts === tokenParts) return name;
  }
  return undefined;
}

/** One entry per distinct bumpkin look (`tokenParts`), for no duplicates on screen. */
function allUniqueTokenSpawns(): HideAndSeekNpcSpawn[] {
  const seen = new Set<string>();
  const out: HideAndSeekNpcSpawn[] = [];
  for (const name of allNpcNames()) {
    const spawn = toSpawn(name);
    if (seen.has(spawn.tokenParts)) continue;
    seen.add(spawn.tokenParts);
    out.push(spawn);
  }
  return out;
}

export function getCurrentEatTarget(
  round: HideAndSeekRound | null,
): HideAndSeekNpcSpawn | null {
  if (!round || round.eatProgress >= round.eatOrder.length) return null;
  return round.eatOrder[round.eatProgress] ?? null;
}

export function advanceHideAndSeekEat(): void {
  const r = $hideAndSeekRound.get();
  if (!r) return;
  $hideAndSeekRound.set({ ...r, eatProgress: r.eatProgress + 1 });
}

/** Random NPC for a respawn; never returns a token already on screen. */
export function pickReplacementHideAndSeekNpc(
  excludeTokenParts: ReadonlySet<string>,
): HideAndSeekNpcSpawn {
  for (const name of shuffle(allNpcNames())) {
    const spawn = toSpawn(name);
    if (!excludeTokenParts.has(spawn.tokenParts)) return spawn;
  }
  for (const name of allNpcNames()) {
    const spawn = toSpawn(name);
    if (!excludeTokenParts.has(spawn.tokenParts)) return spawn;
  }
  throw new Error("hideAndSeek: no unused bumpkin token for replacement");
}

/** Picks random NPCs from `lib/npcs` and a random eat order (unique looks only). */
export function prepareHideAndSeekRound(): HideAndSeekRound {
  clearBumpkinHunterGameOverSessionFlag();
  const pool = shuffle(allUniqueTokenSpawns());
  const npcSpawnList = pool.slice(0, HIDE_AND_SEEK_BUMPKIN_COUNT);
  const eatOrder = shuffle([...npcSpawnList]);
  const round: HideAndSeekRound = {
    eatOrder,
    npcSpawnList,
    eatProgress: 0,
    rewardClaimed: false,
  };
  $hideAndSeekRound.set(round);
  return round;
}

export function markHideAndSeekRewardClaimed(): void {
  const r = $hideAndSeekRound.get();
  if (r) {
    $hideAndSeekRound.set({ ...r, rewardClaimed: true });
  }
}
