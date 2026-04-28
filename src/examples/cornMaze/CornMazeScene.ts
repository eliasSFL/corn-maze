import type { SceneId } from "features/world/sceneIds";
import { BaseScene, NPCBumpkin } from "features/world/scenes/BaseScene";
import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { NPC_WEARABLES } from "lib/npcs";
import { SOUNDS } from "example-assets/sound-effects/soundEffects";

import cornMazeTilesetUrl from "./assets/sprites/corn_maze_tileset.png";
import mazePortalUrl from "./assets/sprites/maze_portal.png";
import crowSpriteUrl from "./assets/sprites/crow.png";

import { ENEMIES, Enemy } from "./lib/enemies";
import { CORN_MAZES, getCurrentMazeDay } from "./lib/mazes";
import {
  $cornMazeState,
  collectCrow,
  hitEnemy,
  portalHit,
  tick,
  type CornMazeMode,
} from "./lib/cornMazeStore";

/**
 * Module-level override for the maze day that should be loaded when the next
 * `CornMazeScene` instance is constructed. The Phaser registry isn't available
 * during `super()`, so we can't read store state from inside the constructor;
 * the React layer can set this before calling `new Game()` and clear it on
 * teardown. `undefined` falls back to the daily rotation (or the value already
 * in the store at scene startup).
 */
let mazeDayOverride: number | undefined;
export function setMazeDayOverride(day: number | undefined) {
  mazeDayOverride = day;
}

const LUNA: NPCBumpkin = {
  x: 333,
  y: 330,
  npc: "luna",
  direction: "left",
};

export class CornMazeScene extends BaseScene {
  sceneId: SceneId = "corn_maze";
  /** Don't allow the portal-hit collider to fire multiple times per attempt. */
  canHandlePortalHit = true;
  currentDay: number;

  enemies?: Phaser.GameObjects.Group;
  mazePortal?: Phaser.GameObjects.Sprite;

  /** Cleanup handles registered in `create` so we can unbind on shutdown. */
  private storeUnsubscribe?: () => void;
  private tickInterval?: ReturnType<typeof setInterval>;

  constructor() {
    const day =
      mazeDayOverride ??
      $cornMazeState.get().selectedDay ??
      getCurrentMazeDay();

    super({
      name: "corn_maze",
      // The maze maps were authored against the 2023 tilesheet (corn walls +
      // witches eve decorations at GIDs that have since been reassigned).
      // Point BaseScene at the portal-local archived tilesheet so the GIDs
      // resolve to the right art.
      map: { json: CORN_MAZES[day], imageKey: "corn_maze_tileset" },
      audio: { fx: { walk_key: "sand_footstep" } },
    });

    this.currentDay = day;
  }

  /**
   * Phaser fires `init` on every `scene.start()` / `scene.restart()`. We use
   * the optional `day` payload to swap the maze layout in place — no Game
   * teardown required. The tilemap key gets removed from the cache so
   * `BaseScene.preload` re-loads the new day's JSON instead of reusing the
   * previously cached one.
   */
  init(data?: { day?: number }) {
    if (data?.day === undefined || data.day === this.currentDay) return;
    this.currentDay = data.day;
    (
      this as unknown as { options: { map: { json: unknown } } }
    ).options.map.json = CORN_MAZES[data.day];
    if (this.cache.tilemap.has("corn_maze")) {
      this.cache.tilemap.remove("corn_maze");
    }
  }

  preload() {
    super.preload();

    this.load.image("corn_maze_tileset", cornMazeTilesetUrl);
    this.load.spritesheet("maze_portal", mazePortalUrl, {
      frameWidth: 12,
      frameHeight: 12,
    });
    this.load.image("crow", crowSpriteUrl);

    this.load.audio("ouph", SOUNDS.voices.ouph);
    this.load.audio("crow_collected", SOUNDS.notifications.crow_collected);
  }

  create() {
    super.create();

    if (window.innerWidth < 500) {
      this.cameras.main.setZoom(2.3);
    }

    this.setUpPortal();
    this.setUpLuna();
    this.setUpEnemies();
    this.setUpEnemyColliders();
    this.setUpCrows();

    // Scene boots paused; HUD resumes it once the player taps "Let's go!".
    this.scene.pause();

    let previousMode: CornMazeMode | undefined;
    let previousDay = this.currentDay;
    this.storeUnsubscribe = $cornMazeState.subscribe((state) => {
      // Defensive: stale subscription from a destroyed scene fires with a
      // null `this.scene`. Bail; shutdown will unsubscribe.
      if (!this.scene) return;

      const requestedDay = state.selectedDay ?? getCurrentMazeDay();

      // Beta map selector changed — restart with the new day so `init` swaps
      // the tilemap JSON before preload re-runs.
      if (requestedDay !== previousDay) {
        previousDay = requestedDay;
        previousMode = state.mode;
        this.scene.restart({ day: requestedDay });
        return;
      }

      // Retry: gameover → ready means the player wants another attempt.
      if (state.mode === "ready" && previousMode === "gameover") {
        previousMode = state.mode;
        this.scene.restart({ day: this.currentDay });
        return;
      }
      previousMode = state.mode;

      if (
        state.mode === "ready" ||
        state.mode === "gameover" ||
        state.mode === "confirmingExit"
      ) {
        if (!this.scene.isPaused()) this.scene.pause();
      }

      if (state.mode === "playing") {
        if (this.scene.isPaused()) this.scene.resume();
        this.mazePortal?.play("maze_portal_anim", true);
        this.canHandlePortalHit = true;
      }
    });

    // Run the timer tick from the scene so we don't drift between tabs/scenes.
    this.tickInterval = setInterval(() => tick(), 1000);

    const cleanup = () => {
      this.storeUnsubscribe?.();
      this.storeUnsubscribe = undefined;
      if (this.tickInterval) {
        clearInterval(this.tickInterval);
        this.tickInterval = undefined;
      }
    };
    this.events.once("shutdown", cleanup);
    this.events.once("destroy", cleanup);
  }

  setUpPortal() {
    this.mazePortal = this.add.sprite(320, 319, "maze_portal");

    this.anims.create({
      key: "maze_portal_anim",
      frames: this.anims.generateFrameNumbers("maze_portal", {
        start: 0,
        end: 12,
      }),
      repeat: -1,
      frameRate: 10,
    });
  }

  setUpLuna() {
    const container = new BumpkinContainer({
      scene: this,
      x: LUNA.x,
      y: LUNA.y,
      clothing: { ...NPC_WEARABLES.luna, updatedAt: 0 },
      direction: "left",
    });

    (container.body as Phaser.Physics.Arcade.Body)
      .setSize(16, 20)
      .setOffset(0, 0)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.physics.world.enable(container);

    if (this.currentPlayer) {
      this.physics.add.collider(container, this.currentPlayer, () => {
        this.handlePortalHit();
      });
    }
  }

  handlePortalHit() {
    if (!this.canHandlePortalHit) return;
    this.canHandlePortalHit = false;
    portalHit();
  }

  setUpCrows() {
    const crowsLayer = this.map.getLayer("Crows");
    if (!crowsLayer) return;

    const tileData = crowsLayer.data;
    const tileWidth = this.map.tileWidth;
    const tileHeight = this.map.tileHeight;

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const tile = tileData[y][x];
        if (tile.index === -1) continue;

        const spriteX = x * tileWidth + tileWidth / 2;
        const spriteY = y * tileHeight + tileHeight / 2;
        const crowId = `${spriteX}-${spriteY}`;

        const crow = this.physics.add.sprite(spriteX, spriteY, "crow");
        if (this.currentPlayer) {
          this.physics.add.overlap(this.currentPlayer, crow, () => {
            collectCrow(crowId);
            const collected = this.sound.add("crow_collected");
            collected.play({ volume: 0.7 });
            crow.destroy();
          });
        }
      }
    }
  }

  setUpEnemies() {
    this.enemies = this.add.group();
    const enemies = ENEMIES[this.currentDay] ?? [];

    enemies.forEach((enemy) => {
      const container = new BumpkinContainer({
        scene: this,
        x: enemy.x,
        y: enemy.y,
        clothing: {
          ...(enemy.clothing ?? NPC_WEARABLES[enemy.npc]),
          updatedAt: 0,
        },
        direction: enemy.target.startFacingLeft ? "left" : "right",
      });

      container.setDepth(enemy.y);
      (container.body as Phaser.Physics.Arcade.Body)
        .setSize(16, 20)
        .setOffset(0, 0)
        .setCollideWorldBounds(true);

      this.physics.world.enable(container);
      container.walk();
      this.enemies?.add(container);

      const tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
        targets: container,
        x: enemy.target.x,
        y: enemy.target.y,
        duration: enemy.target.duration,
        ease: "Linear",
        repeat: -1,
        yoyo: true,
        onUpdate: (tween, target) => {
          if (!target.isWalking && !enemy.target.hold) {
            target.walk();
          }

          if (enemy.target.direction === "horizontal") {
            this.handleDirectionChange(enemy, target as BumpkinContainer);
          }

          if (enemy.target.hold) {
            this.handleRandomEnemyHold(
              tween,
              enemy,
              target as BumpkinContainer,
            );
          }
        },
      };

      this.tweens.add(tweenConfig);
    });
  }

  setUpEnemyColliders() {
    if (!this.currentPlayer || !this.enemies) return;

    this.physics.add.overlap(this.currentPlayer, this.enemies, () => {
      if (!this.currentPlayer?.invincible) {
        hitEnemy();
        const hit = this.sound.add("ouph");
        hit.play({ volume: 0.5 });
        this.currentPlayer?.hitPlayer();
      }
    });
  }

  handleDirectionChange(enemy: Enemy, container: BumpkinContainer) {
    const startDirection = enemy.target.startFacingLeft ? "left" : "right";
    if (startDirection === "right") {
      if (
        container.x === enemy.target.x &&
        container.directionFacing === "right"
      ) {
        container.faceLeft();
      } else if (
        container.x === enemy.x &&
        container.directionFacing === "left"
      ) {
        container.faceRight();
      }
    } else {
      if (
        container.x === enemy.target.x &&
        container.directionFacing === "left"
      ) {
        container.faceRight();
      } else if (
        container.x === enemy.x &&
        container.directionFacing === "right"
      ) {
        container.faceLeft();
      }
    }
  }

  handleRandomEnemyHold(
    tween: Phaser.Tweens.Tween,
    enemy: Enemy,
    container: BumpkinContainer,
  ) {
    const minHoldTime = 1;
    const maxHoldTime = enemy.target.duration + 1000;
    const randomHoldTime = Phaser.Math.Between(minHoldTime, maxHoldTime);

    if (
      enemy.target.direction === "horizontal" &&
      container.x === enemy.target.x
    ) {
      tween.pause();
      container.idle();
      setTimeout(() => {
        if (tween && tween.isPaused()) {
          tween.resume();
          container.walk();
        }
      }, randomHoldTime);
    } else if (
      enemy.target.direction === "vertical" &&
      container.y === enemy.target.y
    ) {
      tween.pause();
      container.idle();
      setTimeout(() => {
        tween.resume();
        container.walk();
      }, randomHoldTime);
    }
  }

  update(): void {
    super.update();
  }
}
