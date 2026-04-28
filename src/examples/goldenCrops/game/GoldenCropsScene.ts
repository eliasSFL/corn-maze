import Phaser from "phaser";
import { BumpkinContainer } from "game/BumpkinContainer";
import { WALKING_SPEED } from "lib/constants";
import { CONFIG } from "lib/config";
import mapJson from "../assets/map/chicken_rescue.json";
import defaultTilesetConfig from "../assets/map/tileset.json";
import { MMO_SERVER_REGISTRY_KEY } from "lib/mmo";
import { getAnimationApiBase } from "lib/portal/url";
import { tokenUriBuilder, type BumpkinParts } from "lib/utils/tokenUriBuilder";
import {
  NPC_TOKENS,
  OFFLINE_ICONIC_BUMPKIN_TOKENS,
  bumpkinTextureKeyForToken,
  getOrCreateOfflineGoldenCropsTokenParts,
} from "../lib/goldenCropsOfflineBumpkin";
import { GOLDEN_CROPS_MINIGAME_SLUG } from "../lib/goldenCropsSlug";
import {
  $goldenCropsHud,
  $goldenCropsModal,
  openModal,
  updateHudBalances,
  type GoldenCropsHudState,
} from "../lib/goldenCropsStore";

// ── Registry keys (must match React side) ────────────────────────────────────
const PLAYER_TOKEN_PARTS_KEY = "playerTokenParts";
/** React reads this to get a reference to the live scene. */
export const SCENE_INSTANCE_REGISTRY_KEY = "goldenCropsScene";

// ── World config (16px tiles — same map as Chicken Rescue) ───────────────────
const TILE = 16;
const MAP_TILE_W = (mapJson as { width: number }).width;
const MAP_TILE_H = (mapJson as { height: number }).height;
const WORLD_W = MAP_TILE_W * TILE;
const WORLD_H = MAP_TILE_H * TILE;
const CAMERA_ZOOM = 3;
/** Loader keys for Chicken Rescue layout + Sunnyside tileset (map-extruded). */
const MAP_JSON_KEY = "golden_crops_chicken_map";
const TILESET_IMAGE_KEY = "golden_crops_world_tileset";
const SEND_PACKET_RATE = 10;

// ── Visual keys ──────────────────────────────────────────────────────────────
const SILHOUETTE_KEY = "silhouette";
const SHADOW_KEY = "shadow";
const BITMAP_FONT = "Teeny Tiny Pixls";

// Art asset keys
/** Static "claim" prop from sunflower-land — replaces claim NPCs on the map. */
const VIP_GIFT_KEY = "vip_gift";
/** Sunnyside cancel icon — shown over the player when there's nothing to water. */
const CANCEL_ICON_KEY = "sunnyside_cancel";
/** Sunflower-land "select_box" frame — drawn at the 24×24 target during gestures. */
const SELECT_BOX_KEY = "select_box";
/** Poof spritesheet — 9 frames at 20×19 each. */
const POOF_KEY = "poof";

// Plot & crop growth keys
const SOIL_KEY = "soil2";
const SOIL_DRY_KEY = "soil_dry";
const CROP_SEED_KEY = "crop_seed";
const CROP_SEEDLING_KEY = "crop_seedling";
const CROP_HALFWAY_KEY = "crop_halfway";
const CROP_ALMOST_KEY = "crop_almost";
const CROP_READY_KEY = "crop_plant";
/** Potato plant — shown as the "loot mystery crop" final stage. */
const CROP_LOOT_READY_KEY = "crop_loot_plant";
/** SFL empty progress bar frame (15×7). */
const EMPTY_BAR_KEY = "empty_progress_bar";

// Reward icons (used by floating-reward popup)
export const REWARD_ICON_COIN = "icon_coin";

// ── Depths (map base < foreground tiles < props < player) ────────────────────
const DEPTH_GROUND = 20_000;
const DEPTH_OBJECTS = 25_000;
const DEPTH_NPC = 28_000;
const DEPTH_REMOTE = 35_000;
const DEPTH_LOCAL = 100_000_000;
const DEPTH_LABELS = 100_000_001;

// ── Object positions (halved from prior 32px grid to fit 40×26 Chicken map) ───
const SPAWN = { x: 160, y: 224 };

const NPC1_POS = { x: 96, y: 192 };

const SHOP_POS = { x: 384, y: 128 };

const PLOTS_ORIGIN = { x: 176, y: 176 };
const PLOT_SPACING = 32; // one tile gap between plots
const PLOT_COLS = 4;
const PLOT_ROWS = 4;

/** Hidden types — players see identical soil for all of them. */
type PlotType = "instant" | "loot" | "timed";

/** Assignment order (row-major, 4×4 grid): mix of instant, loot, timed. */
const PLOT_TYPES: PlotType[] = [
  "instant", "loot",    "timed",   "instant",
  "loot",    "instant", "instant", "timed",
  "timed",   "instant", "loot",    "instant",
  "instant", "timed",   "instant", "loot",
];

// ── Colors ───────────────────────────────────────────────────────────────────
const COLOR_SHOP = 0x8866aa;

// ── Helpers ──────────────────────────────────────────────────────────────────

function clothingToTokenParts(
  equipped: Record<string, string> | undefined,
): string | undefined {
  if (!equipped) return undefined;
  const parts: BumpkinParts = {
    background: (equipped.background || undefined) as BumpkinParts["background"],
    body: (equipped.body || undefined) as BumpkinParts["body"],
    hair: (equipped.hair || undefined) as BumpkinParts["hair"],
    shirt: (equipped.shirt || undefined) as BumpkinParts["shirt"],
    pants: (equipped.pants || undefined) as BumpkinParts["pants"],
    shoes: (equipped.shoes || undefined) as BumpkinParts["shoes"],
    tool: (equipped.tool || undefined) as BumpkinParts["tool"],
    hat: (equipped.hat || undefined) as BumpkinParts["hat"],
    necklace: (equipped.necklace || undefined) as BumpkinParts["necklace"],
    secondaryTool: (equipped.secondaryTool || undefined) as BumpkinParts["secondaryTool"],
    coat: (equipped.coat || undefined) as BumpkinParts["coat"],
    onesie: (equipped.onesie || undefined) as BumpkinParts["onesie"],
    suit: (equipped.suit || undefined) as BumpkinParts["suit"],
    wings: (equipped.wings || undefined) as BumpkinParts["wings"],
    dress: (equipped.dress || undefined) as BumpkinParts["dress"],
    beard: (equipped.beard || undefined) as BumpkinParts["beard"],
    aura: (equipped.aura || undefined) as BumpkinParts["aura"],
  };
  try {
    const t = tokenUriBuilder(parts);
    return t && t !== "0" ? t : undefined;
  } catch {
    return undefined;
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

type MmoRoomHandle = {
  sessionId: string;
  send: (type: number, msg: Record<string, unknown>) => void;
  state: {
    players?: {
      forEach: (
        cb: (
          player: {
            x: number;
            y: number;
            sceneId: string;
            clothing?: { equipped?: Record<string, string> };
            username?: string;
          },
          sessionId: string,
        ) => void,
      ) => void;
    };
  };
};

type PlotState = {
  soilImage: Phaser.GameObjects.Image;
  cropImage: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.BitmapText;
  /** SFL-style progress bar: sprite frame + graphics bg/fill (shown while growing timed plots). */
  progressBarFrame: Phaser.GameObjects.Sprite;
  progressBarBg: Phaser.GameObjects.Graphics;
  progressBarFill: Phaser.GameObjects.Graphics;
  /** Hidden type: "instant" (water.cauliflower), "loot" (water.kale), "timed" (water.plot). */
  plotType: PlotType;
  /** Generator job ID — only used by "timed" plots. */
  jobId?: string;
  completesAt?: number;
  startedAt?: number;
  /** Track the current texture key to avoid unnecessary swaps. */
  currentCropKey?: string;
  /** True while an instant/loot growth animation is playing on this plot. */
  isAnimating?: boolean;
};

// ═════════════════════════════════════════════════════════════════════════════
export class GoldenCropsScene extends Phaser.Scene {
  // Player
  private playerBumpkin?: BumpkinContainer;
  private playerTokenParts?: string;

  // Input
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW?: Phaser.Input.Keyboard.Key;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyS?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keySpace?: Phaser.Input.Keyboard.Key;

  // NPCs — only the shop keeper is a live Bumpkin. The three "claim" spots
  // are static VIP gift boxes rendered in `createNpcs()`.
  private shopNpc?: BumpkinContainer;

  // Interactive objects
  private shopZone?: Phaser.GameObjects.Zone;
  private plots: PlotState[] = [];

  // Collider groups (BaseScene pattern)
  private colliders?: Phaser.GameObjects.Group;
  private triggerColliders?: Phaser.GameObjects.Group;
  /** Trigger callbacks keyed by the collider object's `id` data. */
  private onCollision: Record<
    string,
    (player: BumpkinContainer, obj: Phaser.GameObjects.GameObject) => void
  > = {};

  // Gate

  // MMO
  private mmoRoom?: MmoRoomHandle;
  private packetSentAt = 0;
  private serverPosition = { x: 0, y: 0 };
  private remoteBumpkins: Record<
    string,
    { bumpkin: BumpkinContainer; label?: Phaser.GameObjects.BitmapText }
  > = {};

  // Interaction cooldown
  private lastInteractAt = 0;

  // Gesture animation state (shared by watering + digging — both block movement).
  private isWatering = false;
  /** If undefined, keep the gesture until `stopWatering()` is called. */
  private wateringUntil: number | undefined = 0;
  private onWateringComplete?: () => void;
  /** Which sprite animation is playing during a gesture. */
  private currentGesture: "watering" | "digging" = "watering";
  /** 24×24 select-box frame rendered at the target during a gesture. */
  private targetBox?: Phaser.GameObjects.Image;
  /** Last SPACE press — used to detect "just pressed" in the update loop. */
  private lastSpaceAt = 0;

  /**
   * React-provided dispatcher. Signature mirrors the economy's dispatch.
   * Returns `{ ok: boolean, error?: string, coins?: number }`.
   * Populated via `setActionDispatcher()` from GoldenCropsGamePage.
   */
  private actionDispatcher?: (
    actionId: string,
    extra?: Record<string, unknown>,
  ) => { ok: boolean; error?: string; coins?: number };

  /** Chicken Rescue Tiled map (same layout / tileset wiring as that example). */
  private worldMap?: Phaser.Tilemaps.Tilemap;

  constructor() {
    super("GoldenCropsScene");
  }

  // ── Preload ────────────────────────────────────────────────────────────
  preload() {
    const mapPayload = {
      ...mapJson,
      tilesets: defaultTilesetConfig.tilesets,
    };
    this.load.tilemapTiledJSON(MAP_JSON_KEY, mapPayload as unknown as object);
    this.load.image(
      TILESET_IMAGE_KEY,
      `${CONFIG.PROTECTED_IMAGE_URL}/world/map-extruded.png`,
    );

    const base = import.meta.env.BASE_URL;
    this.load.image(SHADOW_KEY, `${base}game/shadow.png`);
    this.load.spritesheet(SILHOUETTE_KEY, `${base}game/silhouette.webp`, {
      frameWidth: 14,
      frameHeight: 18,
    });
    this.load.bitmapFont(
      BITMAP_FONT,
      "https://sunflower-land.com/testnet-assets/public/world/Teeny%20Tiny%20Pixls5.png",
      "https://sunflower-land.com/testnet-assets/public/world/Teeny%20Tiny%20Pixls5.xml",
    );

    // Art assets (local copies from sunflower-land repo)
    this.load.image(VIP_GIFT_KEY, `${base}game/vip_gift.png`);
    this.load.image(
      CANCEL_ICON_KEY,
      `${CONFIG.PROTECTED_IMAGE_URL}/icons/cancel.png`,
    );
    this.load.image(SELECT_BOX_KEY, `${base}game/select_box.png`);
    this.load.image(EMPTY_BAR_KEY, `${base}game/empty_bar.png`);
    // Poof spritesheet — 9 frames at 20×19
    this.load.spritesheet(POOF_KEY, `${base}game/poof.png`, {
      frameWidth: 20,
      frameHeight: 19,
    });

    // Soil & crop growth stage images from SFL CDN
    const cdnBase = CONFIG.PROTECTED_IMAGE_URL;
    this.load.image(SOIL_KEY, `${cdnBase}/crops/soil2.png`);
    this.load.image(SOIL_DRY_KEY, `${cdnBase}/crops/soil_dry.png`);
    this.load.image(CROP_SEED_KEY, `${cdnBase}/crops/sunflower/seed.png`);
    this.load.image(
      CROP_SEEDLING_KEY,
      `${cdnBase}/crops/sunflower/seedling.png`,
    );
    this.load.image(
      CROP_HALFWAY_KEY,
      `${cdnBase}/crops/sunflower/halfway.png`,
    );
    this.load.image(CROP_ALMOST_KEY, `${cdnBase}/crops/sunflower/almost.png`);
    this.load.image(CROP_READY_KEY, `${cdnBase}/crops/sunflower/plant.png`);
    // Potato — shown as the mystery "loot" crop final stage
    this.load.image(
      CROP_LOOT_READY_KEY,
      `${cdnBase}/crops/potato/plant.png`,
    );

    // Reward popup icon
    this.load.image(REWARD_ICON_COIN, `${cdnBase}/icons/coins.png`);

    const animBase = getAnimationApiBase();

    // Player sprite
    this.playerTokenParts =
      (this.game.registry.get(PLAYER_TOKEN_PARTS_KEY) as string | undefined) ||
      getOrCreateOfflineGoldenCropsTokenParts();

    const playerKey = bumpkinTextureKeyForToken(this.playerTokenParts);
    if (!this.textures.exists(playerKey)) {
      this.load.spritesheet(
        playerKey,
        `${animBase}/animate/0_v1_${this.playerTokenParts}/idle_walking_dig_drilling_watering`,
        { frameWidth: 96, frameHeight: 64 },
      );
    }

    // NPC sprites — only the Shop NPC remains as a Bumpkin; claim NPCs are
    // replaced by static VIP gift props, so we don't load their animations.
    const npcTokens = new Set([NPC_TOKENS.SHOP_NPC]);
    for (const token of npcTokens) {
      const key = bumpkinTextureKeyForToken(token);
      if (!this.textures.exists(key)) {
        this.load.spritesheet(
          key,
          `${animBase}/animate/0_v1_${token}/idle_walking_dig_drilling_watering`,
          { frameWidth: 96, frameHeight: 64 },
        );
      }
    }

    // Offline iconic bumpkins for remote players
    for (const token of OFFLINE_ICONIC_BUMPKIN_TOKENS) {
      const key = bumpkinTextureKeyForToken(token);
      if (!this.textures.exists(key)) {
        this.load.spritesheet(
          key,
          `${animBase}/animate/0_v1_${token}/idle_walking_dig_drilling_watering`,
          { frameWidth: 96, frameHeight: 64 },
        );
      }
    }
  }

  // ── Create ─────────────────────────────────────────────────────────────
  create() {
    this.mmoRoom = this.game.registry.get(
      MMO_SERVER_REGISTRY_KEY,
    ) as MmoRoomHandle | undefined;

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    this.createChickenRescueTilemap();

    // Create world objects
    this.createNpcs();
    this.createShop();
    this.createPlots();

    // Static colliders for procedurally-placed objects (NPCs, crops, shop)
    this.createSceneColliders();

    // Player
    this.createPlayerBumpkin(SPAWN.x, SPAWN.y);

    // Input
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    // Stop SPACE from scrolling the page
    this.input.keyboard?.addCapture("SPACE");

    // Camera (BaseScene-style: instant follow + rounded pixels for smoothness)
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setZoom(CAMERA_ZOOM);
    cam.setRoundPixels(true);
    if (this.playerBumpkin) {
      cam.startFollow(this.playerBumpkin, true);
      cam.followOffset.set(0, 0);
    }

    // Click / tap interaction
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handleInteraction(pointer);
    });

    // Expose scene instance to React via registry
    this.game.registry.set(SCENE_INSTANCE_REGISTRY_KEY, this);

    // Sync existing generator jobs into plots (from economy state)
    this.syncPlotsFromGenerating();

    // Cleanup
    this.events.once("shutdown", () => {
      this.game.registry.remove(SCENE_INSTANCE_REGISTRY_KEY);
      Object.values(this.remoteBumpkins).forEach((r) => {
        r.label?.destroy();
        r.bumpkin.destroy();
      });
      this.remoteBumpkins = {};
    });
  }

  /** Same Tiled layout and extruded tileset as Chicken Rescue (`BaseScene` + Preloader). */
  private createChickenRescueTilemap() {
    this.worldMap = this.make.tilemap({ key: MAP_JSON_KEY });
    const tileset = this.worldMap.addTilesetImage(
      "Sunnyside V3",
      TILESET_IMAGE_KEY,
      16,
      16,
      1,
      2,
    ) as Phaser.Tilemaps.Tileset;

    const foregroundLayerNames = new Set(["Trees", "Decorations"]);
    let baseDepth = 0;

    this.worldMap.layers.forEach((layerData) => {
      if (layerData.name === "Collisions") return;

      const layer = this.worldMap!.createLayer(
        layerData.name,
        [tileset],
        0,
        0,
      );
      if (!layer) return;

      if (foregroundLayerNames.has(layerData.name)) {
        layer.setDepth(10_000);
      } else {
        layer.setDepth(baseDepth++);
      }
    });

    // Build collider + trigger groups from Tiled object layers.
    // Mirrors `BaseScene.initialiseMap()` (sunflower-land/src/features/world/scenes/BaseScene.ts).
    this.colliders = this.add.group();
    this.triggerColliders = this.add.group();

    if (this.worldMap.getObjectLayer("Collisions")) {
      const collisionPolygons = this.worldMap.createFromObjects("Collisions", {
        scene: this,
      });
      collisionPolygons.forEach((polygon) => {
        this.colliders?.add(polygon);
        this.physics.world.enable(polygon);
        const body = (polygon as Phaser.GameObjects.GameObject).body as
          | Phaser.Physics.Arcade.Body
          | null;
        if (body) {
          body.setImmovable(true);
          body.moves = false;
        }
        // Hide Tiled debug fill — only the body matters
        (polygon as Phaser.GameObjects.Shape).setVisible(false);
      });
    }

    if (this.worldMap.getObjectLayer("Trigger")) {
      const triggerPolygons = this.worldMap.createFromObjects("Trigger", {
        scene: this,
      });
      triggerPolygons.forEach((polygon) => {
        this.triggerColliders?.add(polygon);
        this.physics.world.enable(polygon);
        const body = (polygon as Phaser.GameObjects.GameObject).body as
          | Phaser.Physics.Arcade.Body
          | null;
        if (body) {
          body.setImmovable(true);
          body.moves = false;
        }
        (polygon as Phaser.GameObjects.Shape).setVisible(false);
      });
    }
  }

  // ── Collider helpers (BaseScene-style) ─────────────────────────────────
  /** Add a static, immovable collision rectangle to the colliders group. */
  private addStaticCollider(x: number, y: number, w: number, h: number, id?: string) {
    const rect = this.add
      .rectangle(x, y, w, h)
      .setVisible(false);
    this.physics.world.enable(rect);
    const body = rect.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.moves = false;
    if (id) rect.setData("id", id);
    this.colliders?.add(rect);
    return rect;
  }

  /** Add an overlap-only trigger zone to the triggerColliders group. */
  private addTriggerCollider(
    x: number,
    y: number,
    w: number,
    h: number,
    id?: string,
  ) {
    const zone = this.add.zone(x, y, w, h);
    this.physics.world.enable(zone);
    const body = zone.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.moves = false;
    if (id) zone.setData("id", id);
    this.triggerColliders?.add(zone);
    return zone;
  }

  /** Register a callback fired when the player collides/overlaps with `id`. */
  public registerCollisionCallback(
    id: string,
    cb: (player: BumpkinContainer, obj: Phaser.GameObjects.GameObject) => void,
  ) {
    this.onCollision[id] = cb;
  }

  /**
   * Add static colliders for procedurally-placed scene objects (NPCs, crops, shop).
   * Tiled-defined colliders are added separately in `createChickenRescueTilemap()`.
   */
  private createSceneColliders() {
    // Shop NPC — small body at its feet
    const NPC_W = 12;
    const NPC_H = 10;
    const NPC_FEET_OFFSET = 6;
    this.addStaticCollider(
      SHOP_POS.x,
      SHOP_POS.y + NPC_FEET_OFFSET,
      NPC_W,
      NPC_H,
    );

    // VIP gift claim box — solid tile-sized collider
    this.addStaticCollider(NPC1_POS.x, NPC1_POS.y, TILE, TILE);

    // Shop building footprint
    this.addStaticCollider(
      SHOP_POS.x,
      SHOP_POS.y + TILE,
      TILE * 2,
      TILE * 2,
      "shop",
    );
  }

  // ── NPC + claim-box creation ───────────────────────────────────────────
  /**
   * Only the Shop NPC is a live Bumpkin. The three claim NPCs are rendered
   * as static `vip_gift` props — matches the sunflower-land world prop used
   * for claimable rewards.
   */
  private createNpcs() {
    // Claim box 1 — Watering cans (open map)
    this.addVipGift(NPC1_POS.x, NPC1_POS.y, "CLAIM");

    // Shop NPC (still a live Bumpkin)
    this.shopNpc = new BumpkinContainer(this, SHOP_POS.x, SHOP_POS.y, {
      tokenParts: NPC_TOKENS.SHOP_NPC,
    });
    this.shopNpc.setDepth(DEPTH_NPC);
    this.addLabel(SHOP_POS.x, SHOP_POS.y - 16, "SHOP");

  }

  /**
   * Drop a static VIP gift sprite at the given position with an optional
   * floating label. Falls back to a colored rectangle if the texture didn't
   * finish loading.
   */
  private addVipGift(x: number, y: number, label?: string) {
    if (this.textures.exists(VIP_GIFT_KEY)) {
      this.add.image(x, y, VIP_GIFT_KEY).setDepth(DEPTH_OBJECTS);
    } else {
      this.add
        .rectangle(x, y, TILE, TILE, 0xc06ab6)
        .setDepth(DEPTH_OBJECTS);
    }
    if (label) this.addLabel(x, y - 14, label);
  }

  // ── Shop ───────────────────────────────────────────────────────────────
  private createShop() {
    this.add
      .rectangle(SHOP_POS.x, SHOP_POS.y + TILE, TILE * 2, TILE * 2, COLOR_SHOP)
      .setDepth(DEPTH_GROUND);

    this.shopZone = this.add.zone(
      SHOP_POS.x,
      SHOP_POS.y,
      TILE * 3,
      TILE * 3,
    );
    this.physics.world.enable(this.shopZone);
  }

  // ── Plots (unified grid — all look like soil, hidden type drives flow) ──
  private createPlots() {
    let idx = 0;
    for (let row = 0; row < PLOT_ROWS; row++) {
      for (let col = 0; col < PLOT_COLS; col++) {
        const x = PLOTS_ORIGIN.x + col * PLOT_SPACING;
        const y = PLOTS_ORIGIN.y + row * PLOT_SPACING;
        const plotType: PlotType = PLOT_TYPES[idx] ?? "instant";
        idx++;

        // Soil base image (always visible)
        const soilImage = this.add
          .image(x, y, SOIL_KEY)
          .setDepth(DEPTH_OBJECTS);

        // Crop overlay — starts as a seedling so every plot looks the same.
        const cropImage = this.add
          .image(x, y - 4, CROP_SEEDLING_KEY)
          .setDepth(DEPTH_OBJECTS + 1);

        const label = this.add
          .bitmapText(x, y - 18, BITMAP_FONT, "", 3)
          .setOrigin(0.5)
          .setTint(0xffffff)
          .setDepth(DEPTH_LABELS);

        // SFL-style progress bar — sprite frame + colored graphics fills.
        const BAR_Y = y + 10;
        const progressBarBg = this.add.graphics().setDepth(DEPTH_LABELS);
        progressBarBg.fillStyle(0x193c3e, 1);
        progressBarBg.fillRect(x - 8, BAR_Y - 2, 15, 3);
        progressBarBg.setVisible(false);

        const progressBarFill = this.add.graphics().setDepth(DEPTH_LABELS + 1);
        progressBarFill.setVisible(false);

        const progressBarFrame = this.add
          .sprite(x, BAR_Y, EMPTY_BAR_KEY)
          .setDisplaySize(18, 7)
          .setDepth(DEPTH_LABELS + 2)
          .setVisible(false);

        this.plots.push({
          soilImage,
          cropImage,
          label,
          progressBarFrame,
          progressBarBg,
          progressBarFill,
          plotType,
        });
      }
    }
  }

  // ── Player ─────────────────────────────────────────────────────────────
  private createPlayerBumpkin(x: number, y: number) {
    this.playerBumpkin = new BumpkinContainer(this, x, y, {
      tokenParts:
        this.playerTokenParts ?? getOrCreateOfflineGoldenCropsTokenParts(),
    });
    this.playerBumpkin.setDepth(DEPTH_LOCAL);

    // Tighten the body to a small feet-aligned hitbox (mirrors BaseScene)
    const body = this.playerBumpkin.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 8).setOffset(-5, 2).setAllowRotation(false);
    body.setCollideWorldBounds(true);

    // Player ↔ static colliders (Tiled "Collisions" + scene-placed objects)
    if (this.colliders) {
      this.physics.add.collider(
        this.playerBumpkin,
        this.colliders,
        (playerObj, otherObj) => {
          const other = otherObj as unknown as Phaser.GameObjects.GameObject;
          const id = other.getData?.("id") as string | undefined;
          if (id && this.onCollision[id]) {
            this.onCollision[id](playerObj as BumpkinContainer, other);
          }
        },
      );
    }

    // Player ↔ overlap triggers
    if (this.triggerColliders) {
      this.physics.add.overlap(
        this.playerBumpkin,
        this.triggerColliders,
        (playerObj, otherObj) => {
          const other = otherObj as unknown as Phaser.GameObjects.GameObject;
          const id = other.getData?.("id") as string | undefined;
          if (id && this.onCollision[id]) {
            this.onCollision[id](playerObj as BumpkinContainer, other);
          }
        },
      );
    }

  }

  // ── Labels ─────────────────────────────────────────────────────────────
  private addLabel(x: number, y: number, text: string) {
    this.add
      .bitmapText(x, y, BITMAP_FONT, text, 5)
      .setOrigin(0.5)
      .setTint(0xffffff)
      .setDepth(DEPTH_LABELS);
  }

  // ── Update ─────────────────────────────────────────────────────────────
  update() {
    this.handleFreeMovement();
    this.handleSpaceAction();
    this.updatePlotVisuals();
    this.sendMmoPosition();
    this.syncRemotePlayers();
  }

  /**
   * Fires on SPACE (just-pressed). The closest plot wins.
   *
   * Dispatch logic per type:
   *  - **timed** ready   → digging harvest
   *  - **timed** growing → floating "Ns left"
   *  - **timed** empty   → watering → generator start (progress bar)
   *  - **instant** empty → watering → crop animation → poof → coins
   *  - **loot** empty    → watering → mystery crop → poof → reveal
   *  - animating plot    → skip
   *  - nothing nearby    → empty-water cross
   */
  private handleSpaceAction() {
    if (!this.keySpace || !this.playerBumpkin) return;
    if (!Phaser.Input.Keyboard.JustDown(this.keySpace)) return;

    if (this.isWatering) return;
    if ($goldenCropsModal.get().type !== null) return;

    const now = Date.now();
    if (now - this.lastSpaceAt < 200) return;
    this.lastSpaceAt = now;

    const px = this.playerBumpkin.x;
    const py = this.playerBumpkin.y;
    const reach = TILE * 1.6;

    // Find the closest plot within reach.
    let closest: PlotState | undefined;
    let closestDist = reach * reach;
    for (const plot of this.plots) {
      const dx = px - plot.soilImage.x;
      const dy = py - plot.soilImage.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < closestDist) {
        closestDist = d2;
        closest = plot;
      }
    }

    if (!closest) {
      this.requestEmptyWater();
      return;
    }

    // Skip plots that are mid-animation (instant/loot growth playing).
    if (closest.isAnimating) return;

    // Timed plot: ready → harvest, growing → label, empty → water
    if (closest.plotType === "timed") {
      if (closest.jobId && closest.completesAt && now >= closest.completesAt) {
        this.requestHarvestTimed(closest);
      } else if (closest.jobId) {
        const remaining = Math.max(0, (closest.completesAt ?? 0) - now);
        const secs = Math.ceil(remaining / 1000);
        this.showFloatingLabel(`${secs}s`, 0xffffff);
      } else {
        this.requestWaterTimed(closest);
      }
      return;
    }

    // Instant or loot — must be idle (no jobId, not animating).
    if (closest.plotType === "instant") {
      this.requestWaterInstant(closest);
    } else {
      this.requestWaterLoot(closest);
    }
  }

  /** Read the current player's watering-can balance from the HUD store. */
  private hasWateringCan(): boolean {
    return ($goldenCropsHud.get().balances["watering-can"] ?? 0) >= 1;
  }

  // ── Movement ───────────────────────────────────────────────────────────
  /** BaseScene-style: keys → angle → cos/sin velocity. Avoids stutter. */
  private keysToAngle(
    left: boolean,
    right: boolean,
    up: boolean,
    down: boolean,
  ): number | undefined {
    const x = (right ? 1 : 0) - (left ? 1 : 0);
    const y = (down ? 1 : 0) - (up ? 1 : 0);
    if (x === 0 && y === 0) return undefined;
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  private handleFreeMovement() {
    if (!this.playerBumpkin) return;
    const body = this.playerBumpkin.body as Phaser.Physics.Arcade.Body;

    // Gesture animation (watering/digging) — block movement while active.
    // If `wateringUntil` is undefined, the gesture is indefinite (until stopWatering()).
    if (this.isWatering) {
      if (
        this.wateringUntil === undefined ||
        Date.now() < this.wateringUntil
      ) {
        body.setVelocity(0, 0);
        return;
      }
      this.isWatering = false;
      this.wateringUntil = 0;
      this.playerBumpkin.idle();
      this.hideTargetBox();
      const cb = this.onWateringComplete;
      this.onWateringComplete = undefined;
      if (cb) cb();
    }

    const left = this.cursors?.left.isDown || this.keyA?.isDown === true;
    const right = this.cursors?.right.isDown || this.keyD?.isDown === true;
    const up = this.cursors?.up.isDown || this.keyW?.isDown === true;
    const down = this.cursors?.down.isDown || this.keyS?.isDown === true;

    const angle = this.keysToAngle(left, right, up, down);
    const speed = WALKING_SPEED * 2;

    if (angle !== undefined) {
      // Face turn (skip pure up/down)
      if (Math.abs(angle) !== 90) {
        if (Math.abs(angle) > 90) this.playerBumpkin.faceLeft();
        else this.playerBumpkin.faceRight();
      }
      this.playerBumpkin.walk();
      body.setVelocity(
        speed * Math.cos((angle * Math.PI) / 180),
        speed * Math.sin((angle * Math.PI) / 180),
      );
    } else {
      body.setVelocity(0, 0);
      this.playerBumpkin.idle();
    }
  }

  // ── Interaction ────────────────────────────────────────────────────────
  /**
   * Tap / click — ONLY opens NPC dialogs (claim / shop / trophy).
   * Crops and plots are always driven via SPACE.
   */
  private handleInteraction(_pointer: Phaser.Input.Pointer) {
    if (!this.playerBumpkin) return;

    // Debounce
    const now = Date.now();
    if (now - this.lastInteractAt < 300) return;
    this.lastInteractAt = now;

    const px = this.playerBumpkin.x;
    const py = this.playerBumpkin.y;

    if (this.isNear(px, py, NPC1_POS.x, NPC1_POS.y, TILE * 2)) {
      openModal({ type: "claim-npc" });
      return;
    }
    if (this.isNear(px, py, SHOP_POS.x, SHOP_POS.y, TILE * 2.5)) {
      openModal({ type: "shop" });
      return;
    }
    // Clicking a plot — same logic as SPACE handler, for accessibility.
    if (this.isWatering) return;

    const reach = TILE * 1.4;
    let closest: PlotState | undefined;
    let closestDist = reach * reach;
    for (const plot of this.plots) {
      const dx = px - plot.soilImage.x;
      const dy = py - plot.soilImage.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < closestDist) {
        closestDist = d2;
        closest = plot;
      }
    }
    if (!closest || closest.isAnimating) return;

    if (closest.plotType === "timed") {
      if (
        closest.jobId &&
        closest.completesAt &&
        now >= closest.completesAt
      ) {
        this.requestHarvestTimed(closest);
      } else if (!closest.jobId) {
        this.requestWaterTimed(closest);
      }
      return;
    }
    if (closest.plotType === "instant") {
      this.requestWaterInstant(closest);
    } else {
      this.requestWaterLoot(closest);
    }
  }

  /**
   * Play a gesture animation (watering or digging) for `durationMs`, blocking
   * movement. Pass `null` for an indefinite duration — call `stopWatering()`
   * to end it. `onComplete` fires once the animation ends and movement resumes.
   *
   * When `opts.target` is provided, a 24×24 select-box frame is drawn at that
   * position for the duration of the gesture so the player can see exactly
   * what's being targeted.
   */
  public playWateringAnimation(
    durationMs: number | null = 1200,
    onComplete?: () => void,
    opts?: {
      gesture?: "watering" | "digging";
      target?: { x: number; y: number };
    },
  ) {
    if (!this.playerBumpkin) return;
    this.isWatering = true;
    this.wateringUntil =
      durationMs === null ? undefined : Date.now() + durationMs;
    this.onWateringComplete = onComplete;
    this.currentGesture = opts?.gesture ?? "watering";
    if (this.currentGesture === "digging") {
      this.playerBumpkin.dig();
    } else {
      this.playerBumpkin.watering();
    }
    if (opts?.target) {
      this.showTargetBox(opts.target.x, opts.target.y);
    } else {
      this.hideTargetBox();
    }
    const body = this.playerBumpkin.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  /** Render the 24×24 select-box frame over the target tile. */
  public showTargetBox(x: number, y: number) {
    this.hideTargetBox();
    if (!this.textures.exists(SELECT_BOX_KEY)) return;
    this.targetBox = this.add
      .image(x, y, SELECT_BOX_KEY)
      .setDisplaySize(24, 24)
      .setDepth(DEPTH_LABELS + 5);
  }

  /** Remove the select-box frame if one is currently visible. */
  public hideTargetBox() {
    if (this.targetBox) {
      this.targetBox.destroy();
      this.targetBox = undefined;
    }
  }

  /**
   * End an in-progress watering animation.
   * Fires the stored `onComplete` callback if one was attached.
   */
  public stopWatering() {
    if (!this.isWatering) return;
    this.wateringUntil = 0; // Will be picked up next update() tick
  }

  /** React registers its `handleAction` here so SPACE can dispatch economy actions. */
  public setActionDispatcher(
    fn: (
      actionId: string,
      extra?: Record<string, unknown>,
    ) => { ok: boolean; error?: string; coins?: number },
  ) {
    this.actionDispatcher = fn;
  }

  /** Spawn a floating text label above the player's head. */
  public showFloatingLabel(label: string, tint = 0xffffff) {
    if (!this.playerBumpkin) return;
    const text = this.add
      .bitmapText(
        this.playerBumpkin.x,
        this.playerBumpkin.y - 18,
        BITMAP_FONT,
        label,
        6,
      )
      .setOrigin(0.5, 0.5)
      .setTint(tint)
      .setDepth(DEPTH_LABELS + 11);
    this.tweens.add({
      targets: text,
      y: `-=24`,
      alpha: { from: 1, to: 0 },
      duration: 1200,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  // ── Poof + crop-stage animation helpers ────────────────────────────────

  /** Ensure the poof animation is registered, then play it at (x, y). */
  private playPoofAt(
    x: number,
    y: number,
    onComplete?: () => void,
  ) {
    if (!this.textures.exists(POOF_KEY)) {
      onComplete?.();
      return;
    }
    if (!this.anims.exists("poof_anim")) {
      this.anims.create({
        key: "poof_anim",
        frames: this.anims.generateFrameNumbers(POOF_KEY, {
          start: 0,
          end: 8,
        }),
        repeat: 0,
        frameRate: 10,
      });
    }
    const sprite = this.add
      .sprite(x, y - 4, POOF_KEY)
      .setOrigin(0.5)
      .setDepth(DEPTH_LABELS + 5);
    sprite.play("poof_anim", true);
    sprite.on("animationcomplete", () => {
      sprite.destroy();
      onComplete?.();
    });
  }

  /**
   * Animate through a series of crop textures on a plot's `cropImage`, then
   * call `onComplete`. Each stage is shown for `totalMs / stages.length` ms.
   */
  private playCropGrowthOnPlot(
    plot: PlotState,
    stages: string[],
    totalMs: number,
    onComplete?: () => void,
  ) {
    const interval = totalMs / stages.length;
    stages.forEach((key, i) => {
      this.time.delayedCall(interval * i, () => {
        if (!plot.soilImage?.active) return; // scene may have been destroyed
        this.setPlotCropTexture(plot, key);
      });
    });
    this.time.delayedCall(totalMs, () => onComplete?.());
  }

  /** Reset a plot back to the default seedling look. */
  private resetPlotVisual(plot: PlotState) {
    this.setPlotCropTexture(plot, CROP_SEEDLING_KEY);
    plot.cropImage.setVisible(true);
    plot.isAnimating = false;
    plot.label.setText("");
  }

  // ── Request helpers (called from SPACE handler / pointer handler) ──────

  private requireWateringCan(): boolean {
    if (this.hasWateringCan()) return true;
    openModal({ type: "no-watering-can" });
    return false;
  }

  /**
   * Instant plot (water.cauliflower): water 2s → dispatch → grow stages 2s
   * → ready → poof → float +1 coin → reset.
   */
  private requestWaterInstant(plot: PlotState) {
    if (!this.requireWateringCan()) return;
    const target = { x: plot.soilImage.x, y: plot.soilImage.y };
    plot.isAnimating = true;
    this.playWateringAnimation(
      2000,
      () => {
        const res = this.actionDispatcher?.("water.cauliflower");
        if (!res?.ok) {
          this.resetPlotVisual(plot);
          if (res?.error) openModal({ type: "error", message: res.error });
          return;
        }
        // Animate crop stages on the plot
        const stages = [
          CROP_SEED_KEY,
          CROP_SEEDLING_KEY,
          CROP_HALFWAY_KEY,
          CROP_ALMOST_KEY,
          CROP_READY_KEY,
        ];
        this.playCropGrowthOnPlot(plot, stages, 2000, () => {
          this.playPoofAt(target.x, target.y, () => {
            this.resetPlotVisual(plot);
          });
          this.showFloatingReward(REWARD_ICON_COIN, "+1", { tint: 0xffd33d });
        });
      },
      { target },
    );
  }

  /**
   * Loot plot (water.kale): water indefinitely while loading → show crop
   * growth stages → land on a mystery crop (potato) → response arrives →
   * poof → reveal coins → reset.
   */
  private requestWaterLoot(plot: PlotState) {
    if (!this.requireWateringCan()) return;
    const target = { x: plot.soilImage.x, y: plot.soilImage.y };
    plot.isAnimating = true;

    // Start watering (indefinite — stopped when response arrives)
    this.playWateringAnimation(null, undefined, { target });

    // Crop growth stages while waiting
    const stages = [
      CROP_SEED_KEY,
      CROP_SEEDLING_KEY,
      CROP_HALFWAY_KEY,
      CROP_ALMOST_KEY,
      CROP_LOOT_READY_KEY, // mystery crop at the end
    ];
    this.playCropGrowthOnPlot(plot, stages, 1800);

    // Simulate server latency
    const latency = 1800 + Math.random() * 1400;
    this.time.delayedCall(latency, () => {
      const res = this.actionDispatcher?.("water.kale");
      this.stopWatering();
      if (!res?.ok) {
        this.resetPlotVisual(plot);
        if (res?.error) openModal({ type: "error", message: res.error });
        return;
      }
      const coins = res.coins ?? 0;
      this.playPoofAt(target.x, target.y, () => {
        this.resetPlotVisual(plot);
      });
      if (coins > 0) {
        this.showFloatingReward(REWARD_ICON_COIN, `+${coins}`, {
          tint: 0xffd33d,
        });
      } else {
        this.showFloatingCross();
      }
      openModal({ type: "kale-reveal", lootCoins: coins });
    });
  }

  /**
   * Timed plot (water.plot): water 2s → dispatch generator → immediately
   * show progress bar (10s). No crop-stage animation.
   */
  private requestWaterTimed(plot: PlotState) {
    if (!this.requireWateringCan()) return;
    const target = { x: plot.soilImage.x, y: plot.soilImage.y };
    this.playWateringAnimation(
      2000,
      () => {
        const res = this.actionDispatcher?.("water.plot");
        if (!res?.ok) {
          if (res?.error) openModal({ type: "error", message: res.error });
          return;
        }
        // Generator started — updatePlotVisuals shows the progress bar.
        this.showFloatingLabel("Planted!", 0x8bd3ff);
      },
      { target },
    );
  }

  /**
   * Harvest a ready timed plot — digging animation → dispatch harvest →
   * poof → float coins → reset.
   */
  private requestHarvestTimed(plot: PlotState) {
    if (!plot.jobId) return;
    const target = { x: plot.soilImage.x, y: plot.soilImage.y };
    const jobId = plot.jobId;
    this.playWateringAnimation(
      1000,
      () => {
        const res = this.actionDispatcher?.("harvest", { jobId });
        if (!res?.ok) {
          if (res?.error) openModal({ type: "error", message: res.error });
          return;
        }
        const coins = res.coins ?? 5;
        this.playPoofAt(target.x, target.y);
        this.showFloatingReward(REWARD_ICON_COIN, `+${coins}`, {
          tint: 0xffd33d,
        });
      },
      { gesture: "digging", target },
    );
  }

  /**
   * Empty-space watering — plays a short watering animation and shows a red
   * X. Does not consume a watering can or fire any economy action.
   */
  private requestEmptyWater() {
    this.playWateringAnimation(800, () => {
      this.showFloatingCross();
    });
  }

  /**
   * Sunnyside "cancel" icon floats above the player — "no target here".
   * Rendered at the icon's native pixel size (no scaling).
   */
  public showFloatingCross() {
    if (!this.playerBumpkin) return;
    const px = this.playerBumpkin.x;
    const py = this.playerBumpkin.y - 18;

    const icon = this.textures.exists(CANCEL_ICON_KEY)
      ? this.add.image(px, py, CANCEL_ICON_KEY).setDepth(DEPTH_LABELS + 11)
      : undefined;

    if (!icon) return;

    this.tweens.add({
      targets: icon,
      y: py - 24,
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: "Cubic.easeOut",
      onComplete: () => icon.destroy(),
    });
  }

  /**
   * Spawn a small icon + label that floats above the player's head and fades out.
   * Used after accepting a giant-crop watering action to surface the reward.
   */
  public showFloatingReward(
    iconKey: string,
    label?: string,
    options?: { tint?: number },
  ) {
    if (!this.playerBumpkin) return;

    const px = this.playerBumpkin.x;
    const py = this.playerBumpkin.y - 18;
    const scene = this;

    let icon: Phaser.GameObjects.Image | undefined;
    if (this.textures.exists(iconKey)) {
      icon = this.add
        .image(px, py, iconKey)
        .setDepth(DEPTH_LABELS + 10);
      // Clamp to a reasonable size (some crop sprites are large)
      const max = 18;
      const w = icon.width;
      if (w > max) icon.setScale(max / w);
    }

    let text: Phaser.GameObjects.BitmapText | undefined;
    if (label) {
      text = this.add
        .bitmapText(px + (icon ? 10 : 0), py, BITMAP_FONT, label, 6)
        .setOrigin(0.5, 0.5)
        .setTint(options?.tint ?? 0xffffff)
        .setDepth(DEPTH_LABELS + 11);
    }

    scene.tweens.add({
      targets: [icon, text].filter(Boolean) as Phaser.GameObjects.GameObject[],
      y: `-=24`,
      alpha: { from: 1, to: 0 },
      duration: 1200,
      ease: "Cubic.easeOut",
      onComplete: () => {
        icon?.destroy();
        text?.destroy();
      },
    });
  }

  private isNear(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dist: number,
  ): boolean {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy < dist * dist;
  }

  // ── Plot visuals ───────────────────────────────────────────────────────
  private updatePlotVisuals() {
    for (const plot of this.plots) {
      // Instant / loot: the growth animation is driven by playCropGrowthOnPlot,
      // so we just skip updates while `isAnimating` is true.
      if (plot.isAnimating) continue;

      // Timed plots — use generator job state.
      if (plot.plotType === "timed" && plot.jobId && plot.completesAt) {
        const now = Date.now();
        if (now >= plot.completesAt) {
          // Ready to harvest — show sunflower, "TAP" label, hide bar.
          this.setPlotCropTexture(plot, CROP_READY_KEY);
          plot.label.setText("TAP");
          this.hideProgressBar(plot);
        } else {
          // Growing — show progress bar only (no crop stages).
          const startedAt = plot.startedAt ?? now;
          const totalDuration = plot.completesAt - startedAt;
          const elapsed = now - startedAt;
          const progress =
            totalDuration > 0
              ? Math.max(0, Math.min(1, elapsed / totalDuration))
              : 0;

          if (plot.cropImage.visible) plot.cropImage.setVisible(false);
          this.showProgressBar(plot, progress);

          const remaining = Math.max(0, plot.completesAt - now);
          const secs = Math.ceil(remaining / 1000);
          plot.label.setText(`${secs}s`);
        }
        continue;
      }

      // Idle (any type without a job or animation) — show seedling.
      this.setPlotCropTexture(plot, CROP_SEEDLING_KEY);
      if (!plot.cropImage.visible) plot.cropImage.setVisible(true);
      this.hideProgressBar(plot);
      plot.label.setText("");
    }
  }

  /** Show the SFL-style progress bar on a plot and update its fill. */
  private showProgressBar(plot: PlotState, progress: number) {
    if (!plot.progressBarFrame.visible) {
      plot.progressBarBg.setVisible(true);
      plot.progressBarFrame.setVisible(true);
    }

    // Redraw the fill each frame (graphics objects don't have a width property).
    const barX = plot.soilImage.x;
    const barY = plot.soilImage.y + 10;
    // Round up to nearest 10% (but cap at 90% when not truly complete) — matches SFL behavior.
    let amount = Math.min(Math.ceil(progress * 10) / 10, 1);
    if (amount === 1 && progress < 1) amount = 0.9;

    plot.progressBarFill.clear();
    plot.progressBarFill.fillStyle(0x63c74d, 1);
    plot.progressBarFill.fillRect(barX - 7, barY - 2, 14 * amount, 4);
    plot.progressBarFill.setVisible(true);
  }

  /** Hide all progress bar components on a plot. */
  private hideProgressBar(plot: PlotState) {
    if (plot.progressBarFrame.visible) plot.progressBarFrame.setVisible(false);
    if (plot.progressBarBg.visible) plot.progressBarBg.setVisible(false);
    if (plot.progressBarFill.visible) {
      plot.progressBarFill.clear();
      plot.progressBarFill.setVisible(false);
    }
  }

  /** Swap the crop overlay texture only if it changed. */
  private setPlotCropTexture(plot: PlotState, key: string) {
    if (plot.currentCropKey !== key) {
      plot.cropImage.setTexture(key);
      plot.currentCropKey = key;
    }
    if (!plot.cropImage.visible) {
      plot.cropImage.setVisible(true);
    }
  }

  /**
   * Called from React (via registry callback) when a plot is planted.
   * Associates a generator job with the plot.
   */
  public assignJobToPlot(
    jobId: string,
    completesAt: number,
    startedAt?: number,
  ) {
    // Find first empty timed plot
    const empty = this.plots.find(
      (p) => p.plotType === "timed" && !p.jobId,
    );
    if (empty) {
      empty.jobId = jobId;
      empty.completesAt = completesAt;
      empty.startedAt = startedAt ?? Date.now();
    }
  }

  /**
   * Called from React when a plot is harvested.
   */
  public clearPlotJob(jobId: string) {
    const plot = this.plots.find((p) => p.jobId === jobId);
    if (plot) {
      plot.jobId = undefined;
      plot.completesAt = undefined;
      plot.startedAt = undefined;
      plot.currentCropKey = undefined;
      plot.cropImage.setTexture(CROP_SEEDLING_KEY).setVisible(true);
      this.hideProgressBar(plot);
    }
  }

  /**
   * On create, sync any existing generator jobs from HUD state into plots.
   */
  private syncPlotsFromGenerating() {
    const hud = $goldenCropsHud.get();
    this.syncGeneratingJobs(hud.generating ?? {});
  }

  /**
   * Sync generator jobs to plot state. Assigns any jobs not yet tracked
   * to the first available empty plot.
   */
  public syncGeneratingJobs(
    generating: Record<
      string,
      { outputToken: string; completesAt: number; startedAt: number }
    >,
  ) {
    const assignedJobIds = new Set(
      this.plots.filter((p) => p.jobId).map((p) => p.jobId!),
    );

    for (const [jobId, job] of Object.entries(generating)) {
      if (job.outputToken !== "wet-plot") continue;
      if (assignedJobIds.has(jobId)) continue;

      const empty = this.plots.find(
        (p) => p.plotType === "timed" && !p.jobId,
      );
      if (empty) {
        empty.jobId = jobId;
        empty.completesAt = job.completesAt;
        empty.startedAt = job.startedAt;
        assignedJobIds.add(jobId);
      }
    }
  }

  // ── MMO sync ───────────────────────────────────────────────────────────
  private sendMmoPosition(force = false) {
    const server = this.mmoRoom;
    const bumpkin = this.playerBumpkin;
    if (!server || !bumpkin) return;

    const now = Date.now();
    const moved =
      this.serverPosition.x !== bumpkin.x ||
      this.serverPosition.y !== bumpkin.y;

    if (
      (moved || force) &&
      (force || now - this.packetSentAt > 1000 / SEND_PACKET_RATE)
    ) {
      this.serverPosition = { x: bumpkin.x, y: bumpkin.y };
      this.packetSentAt = now;
      server.send(0, {
        x: bumpkin.x,
        y: bumpkin.y,
        sceneId: GOLDEN_CROPS_MINIGAME_SLUG,
      });
    }
  }

  private syncRemotePlayers() {
    const server = this.mmoRoom;
    if (!server) return;

    const players = server.state.players;
    if (!players || typeof players.forEach !== "function") return;

    const selfId = server.sessionId;
    const seen = new Set<string>();

    players.forEach((player, sessionId) => {
      if (sessionId === selfId) return;
      if (String(player.sceneId) !== GOLDEN_CROPS_MINIGAME_SLUG) return;

      seen.add(sessionId);
      let entry = this.remoteBumpkins[sessionId];

      if (!entry || !entry.bumpkin.active) {
        const remoteToken = clothingToTokenParts(player.clothing?.equipped);
        const bumpkin = new BumpkinContainer(this, player.x, player.y, {
          ...(remoteToken ? { tokenParts: remoteToken } : {}),
        });
        bumpkin.setDepth(DEPTH_REMOTE);

        const username = player.username ?? "Player";
        const label = this.add
          .bitmapText(player.x, player.y - 20, BITMAP_FONT, username, 5)
          .setOrigin(0.5)
          .setTint(0xffffff)
          .setDepth(DEPTH_REMOTE + 1);

        entry = { bumpkin, label };
        this.remoteBumpkins[sessionId] = entry;
      }

      const dx = player.x - entry.bumpkin.x;
      const dy = player.y - entry.bumpkin.y;
      const moving = Math.abs(dx) > 1 || Math.abs(dy) > 1;

      if (moving) {
        if (dx < -1) entry.bumpkin.faceLeft();
        if (dx > 1) entry.bumpkin.faceRight();
        entry.bumpkin.walk();
      } else {
        entry.bumpkin.idle();
      }

      entry.bumpkin.setPosition(
        Phaser.Math.Linear(entry.bumpkin.x, player.x, 0.15),
        Phaser.Math.Linear(entry.bumpkin.y, player.y, 0.15),
      );

      if (entry.label) {
        entry.label.setPosition(entry.bumpkin.x, entry.bumpkin.y - 20);
        const uname = player.username ?? "Player";
        if (entry.label.text !== uname) entry.label.text = uname;
      }
    });

    // Remove departed players
    Object.keys(this.remoteBumpkins).forEach((id) => {
      if (!seen.has(id)) {
        this.remoteBumpkins[id]?.label?.destroy();
        this.remoteBumpkins[id]?.bumpkin.destroy();
        delete this.remoteBumpkins[id];
      }
    });
  }
}
