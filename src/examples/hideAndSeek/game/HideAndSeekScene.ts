import Phaser from "phaser";
import { BumpkinContainer } from "game/BumpkinContainer";
import { $gameState, patchGameState } from "lib/gameStore";
import { $activePopupId } from "lib/popupActiveStore";
import { popupSingleton } from "lib/popupSingleton";
import {
  $hideAndSeekRound,
  advanceHideAndSeekEat,
  getCurrentEatTarget,
  pickReplacementHideAndSeekNpc,
  resolveNpcNameForTokenParts,
} from "../lib/hideAndSeekRoundStore";
import {
  registerHideAndSeekPhaserScene,
  unregisterHideAndSeekPhaserScene,
} from "../lib/hideAndSeekSceneRef";
import wolfAssetUrl from "../images/wolf.webp";
import {
  registerWolfAnimations,
  WOLF_ANIM_IDLE,
  WOLF_ANIM_SLEEP,
  WOLF_ANIM_WALK,
  WOLF_FRAME,
} from "./wolfAnimations";

type NpcState = {
  bumpkin: BumpkinContainer;
  nextTurnAt: number;
};

const BASE_NPC_WANDER = 28;
const CAMERA_ZOOM = 2;
const POOF_ANIM_KEY = "hide_seek_poof";
/** Min distance² between bumpkins (and from spawn attempts vs player in initial layout). */
const MIN_NPC_SEPARATION_D2 = 42 * 42;
/** Replacement spawns stay at least this far from the wolf (world px). */
const MIN_SPAWN_FROM_PLAYER = 100;
const MIN_SPAWN_FROM_PLAYER_D2 = MIN_SPAWN_FROM_PLAYER * MIN_SPAWN_FROM_PLAYER;
/** Match BumpkinContainer: 1 texture pixel = 1 world pixel (camera zoom is separate). */
const WOLF_SCALE = 1;
const SCENE_BG_COLOR = 0x2d4a32;

/** Half the side length of the central safe square (bumpkins never enter). */
function safeSquareHalfExtent(viewW: number, viewH: number): number {
  const m = Math.min(viewW, viewH);
  const target = Math.min(100, Math.max(40, m * 0.22));
  const half = Math.min(target, m * 0.38);
  return half * 0.5;
}

export class HideAndSeekScene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Sprite;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private npcStates: NpcState[] = [];
  private roundLost = false;
  private awaitingClaim = false;
  private npcSpeedMultiplier = 1;
  private bgTile?: Phaser.GameObjects.TileSprite;
  private safeZoneRect?: Phaser.GameObjects.Rectangle;

  constructor() {
    super("HideAndSeekScene");
  }

  clearSeekEncounterState(): void {
    this.awaitingClaim = false;
    this.physics.resume();
    if (this.player?.active && !this.roundLost) {
      this.player.play(WOLF_ANIM_IDLE, true);
    }
  }

  preload() {
    const base = import.meta.env.BASE_URL;
    this.load.image("shadow", `${base}game/shadow.png`);
    this.load.spritesheet("silhouette", `${base}game/silhouette.webp`, {
      frameWidth: 14,
      frameHeight: 18,
    });
    this.load.image("3x3_bg", `${base}game/3x3_bg.png`);
    this.load.spritesheet("poof", `${base}game/poof.png`, {
      frameWidth: 20,
      frameHeight: 19,
    });
    this.load.spritesheet("wolf", wolfAssetUrl, {
      frameWidth: WOLF_FRAME.width,
      frameHeight: WOLF_FRAME.height,
    });
  }

  create() {
    registerHideAndSeekPhaserScene(this);

    const round = $hideAndSeekRound.get();

    const cam = this.cameras.main;
    cam.setBackgroundColor(SCENE_BG_COLOR);
    cam.setRoundPixels(true);

    const w = this.scale.width;
    const h = this.scale.height;
    this.bgTile = this.add
      .tileSprite(0, 0, w, h, "3x3_bg")
      .setOrigin(0, 0)
      .setDepth(-4000);

    this.ensurePoofAnimation();
    registerWolfAnimations(this);

    const cx = Math.round(this.scale.width / 2);
    const cy = Math.round(this.scale.height / 2);

    this.player = this.physics.add.sprite(cx, cy, "wolf", 0);
    this.player.setScale(WOLF_SCALE);
    this.player.setFlip(false, false);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(100);
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    /** ~Bumpkin hitbox width (16) in frame space; feet band of 44×44 art. */
    pBody.setSize(16, 14);
    pBody.setOffset(14, 24);
    pBody.setCollideWorldBounds(true);
    this.player.play(WOLF_ANIM_IDLE, true);

    this.cursors = this.input.keyboard?.createCursorKeys();

    if (round?.npcSpawnList?.length) {
      const taken: { x: number; y: number }[] = [{ x: cx, y: cy }];

      for (const { tokenParts } of round.npcSpawnList) {
        let x = cx;
        let y = cy;
        for (let attempt = 0; attempt < 80; attempt++) {
          x = 28 + Math.random() * (this.scale.width - 56);
          y = 28 + Math.random() * (this.scale.height - 56);
          const ok =
            !this.isInsideSafeSquare(x, y) &&
            taken.every((p) => {
              const dx = p.x - x;
              const dy = p.y - y;
              return dx * dx + dy * dy >= MIN_NPC_SEPARATION_D2;
            });
          if (ok) break;
        }
        taken.push({ x, y });

        const npc = new BumpkinContainer(this, Math.round(x), Math.round(y), {
          tokenParts,
          direction: Math.random() < 0.5 ? "left" : "right",
        });

        this.npcStates.push({
          bumpkin: npc,
          nextTurnAt: this.time.now + 400 + Math.random() * 600,
        });
      }
    }

    this.applyWorldAndCameraBounds();

    if (this.player) {
      // roundPixels on follow rounds scrollX/Y each frame; with diagonal motion that can stutter vs cardinals.
      cam.startFollow(this.player, false, 0.12, 0.12);
    }

    this.scale.on("resize", this.syncWorldBounds, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.syncWorldBounds, this);
      this.bgTile?.destroy();
      this.bgTile = undefined;
      this.safeZoneRect?.destroy();
      this.safeZoneRect = undefined;
      unregisterHideAndSeekPhaserScene();
      this.npcStates = [];
    });
  }

  private ensurePoofAnimation() {
    if (this.anims.exists(POOF_ANIM_KEY)) return;
    this.anims.create({
      key: POOF_ANIM_KEY,
      frames: this.anims.generateFrameNumbers("poof", { start: 0, end: 8 }),
      repeat: 0,
      frameRate: 10,
    });
  }

  private playPoofAt(worldX: number, worldY: number) {
    const poof = this.add.sprite(worldX, worldY, "poof").setDepth(50000);
    poof.play(POOF_ANIM_KEY, true);
    poof.once("animationcomplete", (anim: { key: string }) => {
      if (anim.key === POOF_ANIM_KEY && poof.active) {
        poof.destroy();
      }
    });
  }

  private applyWorldAndCameraBounds() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.bgTile?.setSize(w, h);
    this.layoutSafeZoneVisual();
    this.physics.world.setBounds(0, 0, w, h);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, w, h);
    cam.setZoom(CAMERA_ZOOM);
  }

  /** Semi-transparent overlay matching `isInsideSafeSquare` (above tiled bg, under wolf / bumpkins). */
  private layoutSafeZoneVisual(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const half = safeSquareHalfExtent(w, h);
    const side = half * 2;

    if (!this.safeZoneRect) {
      this.safeZoneRect = this.add.rectangle(cx, cy, side, side, 0x4caf50, 0.32);
      this.safeZoneRect.setStrokeStyle(2, 0x2e7d32, 0.5);
      this.safeZoneRect.setDepth(-2000);
    } else {
      this.safeZoneRect.setPosition(cx, cy);
      this.safeZoneRect.setSize(side, side);
    }
  }

  private syncWorldBounds = () => {
    this.applyWorldAndCameraBounds();
  };

  private getSafeSquareHalf(): number {
    return safeSquareHalfExtent(this.scale.width, this.scale.height);
  }

  /** True if (x,y) lies in the axis-aligned safe square around the map center (player start). */
  private isInsideSafeSquare(x: number, y: number): boolean {
    const cx = this.scale.width * 0.5;
    const cy = this.scale.height * 0.5;
    const h = this.getSafeSquareHalf();
    return Math.abs(x - cx) <= h && Math.abs(y - cy) <= h;
  }

  /** Push any bumpkin that entered the safe square to the nearest outside edge and steer outward. */
  private keepBumpkinsOutsideSafeSquare(): void {
    const cx = this.scale.width * 0.5;
    const cy = this.scale.height * 0.5;
    const h = this.getSafeSquareHalf();
    const left = cx - h;
    const right = cx + h;
    const top = cy - h;
    const bottom = cy + h;
    const pad = 6;

    for (const state of this.npcStates) {
      const b = state.bumpkin;
      const x = b.x;
      const y = b.y;
      if (x < left || x > right || y < top || y > bottom) continue;

      const dl = x - left;
      const dr = right - x;
      const dt = y - top;
      const db = bottom - y;
      let nx = x;
      let ny = y;
      if (dl <= dr && dl <= dt && dl <= db) nx = left - pad;
      else if (dr <= dt && dr <= db) nx = right + pad;
      else if (dt <= db) ny = top - pad;
      else ny = bottom + pad;

      b.setPosition(nx, ny);
      const body = b.body as Phaser.Physics.Arcade.Body;
      const spd = Math.max(
        BASE_NPC_WANDER * 0.5,
        Math.hypot(body.velocity.x, body.velocity.y),
      );
      const dx = nx - cx;
      const dy = ny - cy;
      const len = Math.hypot(dx, dy) || 1;
      body.setVelocity((dx / len) * spd, (dy / len) * spd);
      state.nextTurnAt = this.time.now + 400;
    }
  }

  private consumeBumpkin(npc: BumpkinContainer) {
    const idx = this.npcStates.findIndex((s) => s.bumpkin === npc);
    if (idx < 0) return;

    const worldX = npc.x;
    const worldY = npc.y;

    this.npcStates[idx].bumpkin.destroy();
    this.npcStates.splice(idx, 1);

    this.playPoofAt(worldX, worldY);

    this.npcSpeedMultiplier *= 1.1;

    patchGameState({ skulls: $gameState.get().skulls + 1 });

    advanceHideAndSeekEat();

    const r = $hideAndSeekRound.get();
    if (r && r.eatProgress >= r.eatOrder.length) {
      this.awaitingClaim = true;
      this.player?.play(WOLF_ANIM_IDLE, true);
      this.physics.pause();
      popupSingleton.open("hideAndSeekClaim", {});
    } else if (r && this.player) {
      this.spawnReplacementBumpkin();
    }
  }

  private collectBumpkinPositions(): { x: number; y: number }[] {
    return this.npcStates.map((s) => ({ x: s.bumpkin.x, y: s.bumpkin.y }));
  }

  /**
   * Picks a point far from the wolf and spaced from other bumpkins.
   * Relaxes player distance if the viewport is too tight.
   */
  private pickReplacementSpawnPoint(): { x: number; y: number } {
    const px = this.player!.x;
    const py = this.player!.y;
    const others = this.collectBumpkinPositions();
    const margin = 28;
    const randXY = () => ({
      x: margin + Math.random() * (this.scale.width - margin * 2),
      y: margin + Math.random() * (this.scale.height - margin * 2),
    });

    const fits = (x: number, y: number, minFromPlayerD2: number) => {
      if (this.isInsideSafeSquare(x, y)) return false;
      const dp = (x - px) * (x - px) + (y - py) * (y - py);
      if (dp < minFromPlayerD2) return false;
      return others.every((p) => {
        const dx = p.x - x;
        const dy = p.y - y;
        return dx * dx + dy * dy >= MIN_NPC_SEPARATION_D2;
      });
    };

    for (let i = 0; i < 140; i++) {
      const { x, y } = randXY();
      if (fits(x, y, MIN_SPAWN_FROM_PLAYER_D2)) return { x, y };
    }
    for (let i = 0; i < 100; i++) {
      const { x, y } = randXY();
      if (fits(x, y, MIN_NPC_SEPARATION_D2)) return { x, y };
    }

    let best = randXY();
    let bestScore = -1;
    for (let gx = margin; gx < this.scale.width - margin; gx += 32) {
      for (let gy = margin; gy < this.scale.height - margin; gy += 32) {
        const dp = (gx - px) * (gx - px) + (gy - py) * (gy - py);
        const sepOk =
          !this.isInsideSafeSquare(gx, gy) &&
          others.every((p) => {
            const dx = p.x - gx;
            const dy = p.y - gy;
            return dx * dx + dy * dy >= MIN_NPC_SEPARATION_D2;
          });
        if (sepOk && dp > bestScore) {
          bestScore = dp;
          best = { x: gx, y: gy };
        }
      }
    }
    if (bestScore < 0) {
      for (let i = 0; i < 200; i++) {
        const { x, y } = randXY();
        const sepOk =
          !this.isInsideSafeSquare(x, y) &&
          others.every((p) => {
            const dx = p.x - x;
            const dy = p.y - y;
            return dx * dx + dy * dy >= MIN_NPC_SEPARATION_D2;
          });
        if (sepOk) return { x, y };
      }
    }
    if (this.isInsideSafeSquare(best.x, best.y)) {
      const m = margin;
      const corners = [
        { x: m, y: m },
        { x: this.scale.width - m, y: m },
        { x: m, y: this.scale.height - m },
        { x: this.scale.width - m, y: this.scale.height - m },
      ];
      const corner = corners.find((p) => !this.isInsideSafeSquare(p.x, p.y));
      if (corner) best = corner;
    }
    return best;
  }

  private spawnReplacementBumpkin(): void {
    const exclude = new Set(
      this.npcStates.map((s) => s.bumpkin.getBumpkinTokenParts()),
    );
    const spawn = pickReplacementHideAndSeekNpc(exclude);
    const { x, y } = this.pickReplacementSpawnPoint();
    const npc = new BumpkinContainer(this, Math.round(x), Math.round(y), {
      tokenParts: spawn.tokenParts,
      direction: Math.random() < 0.5 ? "left" : "right",
    });
    this.npcStates.push({
      bumpkin: npc,
      nextTurnAt: this.time.now + 400 + Math.random() * 600,
    });
  }

  private tryResolveBumpkinContact(npc: BumpkinContainer) {
    const round = $hideAndSeekRound.get();
    if (!round || round.rewardClaimed || this.roundLost || this.awaitingClaim) return;

    if ($activePopupId.get()) return;

    const next = getCurrentEatTarget(round);
    if (!next) return;

    const touched = npc.getBumpkinTokenParts();
    if (touched === next.tokenParts) {
      this.consumeBumpkin(npc);
      return;
    }

    this.roundLost = true;
    if (this.player?.active) {
      this.player.play(WOLF_ANIM_SLEEP, true);
    }
    this.physics.pause();
    const wrongName = resolveNpcNameForTokenParts(touched);
    popupSingleton.open("hideAndSeekGameOver", {
      tokenParts: touched,
      npcName: wrongName ?? "",
    });
  }

  private checkPlayerNpcOverlap() {
    if (!this.player || this.roundLost || this.awaitingClaim) return;

    const round = $hideAndSeekRound.get();
    if (!round || round.rewardClaimed) return;

    if ($activePopupId.get()) return;

    for (const state of this.npcStates) {
      if (this.physics.overlap(this.player, state.bumpkin)) {
        this.tryResolveBumpkinContact(state.bumpkin);
        return;
      }
    }
  }

  update() {
    this.updatePlayer();
    this.updateNpcs();
    this.checkPlayerNpcOverlap();
  }

  private updatePlayer() {
    if (!this.player || !this.cursors) return;
    if (this.roundLost || this.awaitingClaim) return;

    const speed = 60;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown) vx -= 1;
    if (this.cursors.right.isDown) vx += 1;
    if (this.cursors.up.isDown) vy -= 1;
    if (this.cursors.down.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      if (vx !== 0 && vy !== 0) {
        const n = speed / Math.SQRT2;
        body.setVelocity(vx * n, vy * n);
      } else {
        body.setVelocity(vx * speed, vy * speed);
      }
      // Wolf sheet faces the opposite default to bumpkin CDN art; mirror when moving right.
      if (vx < 0) this.player.setScale(WOLF_SCALE, WOLF_SCALE);
      else if (vx > 0) this.player.setScale(-WOLF_SCALE, WOLF_SCALE);
      if (this.player.anims.currentAnim?.key !== WOLF_ANIM_WALK) {
        this.player.play(WOLF_ANIM_WALK, true);
      }
    } else {
      body.setVelocity(0);
      if (this.player.anims.currentAnim?.key !== WOLF_ANIM_IDLE) {
        this.player.play(WOLF_ANIM_IDLE, true);
      }
    }
  }

  private updateNpcs() {
    const now = this.time.now;
    const wanderSpeed = BASE_NPC_WANDER * this.npcSpeedMultiplier;

    for (const state of this.npcStates) {
      const { bumpkin } = state;
      const body = bumpkin.body as Phaser.Physics.Arcade.Body;

      if (now >= state.nextTurnAt) {
        state.nextTurnAt = now + 700 + Math.random() * 1400;
        const angle = Math.random() * Math.PI * 2;
        const v = wanderSpeed * (0.85 + Math.random() * 0.3);
        body.setVelocity(Math.round(Math.cos(angle) * v), Math.round(Math.sin(angle) * v));
      }

      if (body.blocked.left || body.blocked.right || body.blocked.up || body.blocked.down) {
        const angle = Math.random() * Math.PI * 2;
        const v = wanderSpeed;
        body.setVelocity(Math.round(Math.cos(angle) * v), Math.round(Math.sin(angle) * v));
        state.nextTurnAt = now + 400;
      }

      if (Math.abs(body.velocity.x) > 2) {
        if (body.velocity.x < 0) bumpkin.faceLeft();
        else bumpkin.faceRight();
      }

      if (body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y > 64) {
        bumpkin.walk();
      } else {
        bumpkin.idle();
      }
    }

    this.keepBumpkinsOutsideSafeSquare();
  }
}
