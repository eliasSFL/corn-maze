import { getAnimationApiBase } from "lib/portal/url";
import { BumpkinParts, tokenUriBuilder } from "lib/utils/tokenUriBuilder";

export enum ANIMATION {
  attack = "attack",
  axe = "axe",
  carry = "carry",
  carry_idle = "carry_idle",
  carry_none = "carry_none",
  carry_none_idle = "carry_none_idle",
  casting = "casting",
  caught = "caught",
  death = "death",
  dig = "dig",
  doing = "doing",
  drilling = "drilling",
  hammering = "hammering",
  hurt = "hurt",
  idle = "idle",
  idle_small = "idle_small",
  jump = "jump",
  mining = "mining",
  reeling = "reeling",
  roll = "roll",
  run = "run",
  swimming = "swimming",
  waiting = "waiting",
  walking = "walking",
  walking_small = "walking_small",
  watering = "watering",
}

export const getAnimationUrl = (
  bumpkinParts: BumpkinParts,
  animation: keyof typeof ANIMATION,
) => {
  const base = getAnimationApiBase();
  return `${base}/animate/0_v1_${tokenUriBuilder(bumpkinParts)}/${animation}`;
};

/** Farm / world NPC style (animated WebP), e.g. `["idle-small"]`. */
export const getAnimatedWebpUrl = (
  bumpkinParts: BumpkinParts,
  animations: string[],
) => {
  const base = getAnimationApiBase();
  return `${base}/animated_webp/0_v1_${tokenUriBuilder(bumpkinParts)}/${animations.join("_")}`;
};
