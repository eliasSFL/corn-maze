import Phaser from "phaser";
import { BumpkinContainer } from "game/BumpkinContainer";
import { WALKING_SPEED } from "lib/constants";
import { MMO_SERVER_REGISTRY_KEY } from "lib/mmo";
import { getAnimationApiBase } from "lib/portal/url";
import {
  bumpkinTextureKeyForToken,
  getOrCreateOfflineTileJumpTokenParts,
  OFFLINE_ICONIC_BUMPKIN_TOKENS,
} from "../lib/tileJumpOfflineBumpkin";
import { PLAYER_TOKEN_PARTS_REGISTRY_KEY } from "../TileJumpApp";
import {
  tokenUriBuilder,
  type BumpkinParts,
} from "lib/utils/tokenUriBuilder";
import { TILE_JUMP_MINIGAME_SLUG } from "../lib/tileJumpSlug";
import {
  $tileJumpHud,
  addTileJumpDeath,
  setTileJumpWon,
  type TileJumpMode,
} from "../lib/tileJumpStore";

// ── Grid config ──────────────────────────────────────────────────────────────
const COLS = 7;
const ROWS = 15;
const TILE_SIZE = 32;

const CENTER_COL = 3;
const START_ROW = ROWS; // virtual row below grid
const FINISH_ROW = -1; // virtual row above grid

// Board position in world space
const BOARD_OFFSET_X = 8 * TILE_SIZE;
const BOARD_OFFSET_Y = 5 * TILE_SIZE;

// World — large enough for spectators to roam
const WORLD_W = (COLS + 16) * TILE_SIZE;
const WORLD_H = (ROWS + 12) * TILE_SIZE;

// ── Snake path ───────────────────────────────────────────────────────────────
// Dev toggle: tint every safe tile blue so the path is visible while designing.
const SHOW_DEBUG_SAFE_PATH = true;

// Serpentine "1-wide corridor" path: straight rows at rows 14, 12, 10, 8, 6, 4, 2,
// connected by single vertical tiles at alternating edges. Because the horizontal
// runs are separated by a blank row (and the vertical connectors are in alternating
// columns), no two path tiles are adjacent unless they are consecutive in the path.
// ⇒ At any moment the player has exactly one correct direction (plus "back").
const SAFE_PATH: { col: number; row: number }[] = [
  // Row 14 — right edge
  { col: 3, row: 14 },
  { col: 4, row: 14 },
  { col: 5, row: 14 },
  { col: 6, row: 14 },
  // Up the right wall
  { col: 6, row: 13 },
  { col: 6, row: 12 },
  // Row 12 — sweep left
  { col: 5, row: 12 },
  { col: 4, row: 12 },
  { col: 3, row: 12 },
  { col: 2, row: 12 },
  { col: 1, row: 12 },
  { col: 0, row: 12 },
  // Up the left wall
  { col: 0, row: 11 },
  { col: 0, row: 10 },
  // Row 10 — sweep right
  { col: 1, row: 10 },
  { col: 2, row: 10 },
  { col: 3, row: 10 },
  { col: 4, row: 10 },
  { col: 5, row: 10 },
  { col: 6, row: 10 },
  // Up the right wall
  { col: 6, row: 9 },
  { col: 6, row: 8 },
  // Row 8 — sweep left
  { col: 5, row: 8 },
  { col: 4, row: 8 },
  { col: 3, row: 8 },
  { col: 2, row: 8 },
  { col: 1, row: 8 },
  { col: 0, row: 8 },
  // Up the left wall
  { col: 0, row: 7 },
  { col: 0, row: 6 },
  // Row 6 — sweep right
  { col: 1, row: 6 },
  { col: 2, row: 6 },
  { col: 3, row: 6 },
  { col: 4, row: 6 },
  { col: 5, row: 6 },
  { col: 6, row: 6 },
  // Up the right wall
  { col: 6, row: 5 },
  { col: 6, row: 4 },
  // Row 4 — sweep left
  { col: 5, row: 4 },
  { col: 4, row: 4 },
  { col: 3, row: 4 },
  { col: 2, row: 4 },
  { col: 1, row: 4 },
  { col: 0, row: 4 },
  // Up the left wall
  { col: 0, row: 3 },
  { col: 0, row: 2 },
  // Row 2 — sweep right to center
  { col: 1, row: 2 },
  { col: 2, row: 2 },
  { col: 3, row: 2 },
  // Up to finish
  { col: 3, row: 1 },
  { col: 3, row: 0 },
];

const SAFE_SET = new Set(SAFE_PATH.map((p) => `${p.col},${p.row}`));
function isSafeTile(col: number, row: number): boolean {
  return SAFE_SET.has(`${col},${row}`);
}

// ── Visual constants ─────────────────────────────────────────────────────────
const SILHOUETTE_KEY = "silhouette";
const SHADOW_KEY = "shadow";
const BG_KEY = "3x3_bg";
const BITMAP_FONT = "Teeny Tiny Pixls";

const CAMERA_ZOOM = 2.5;
const SEND_PACKET_RATE = 10;
const DEPTH_BG = -4000;
const DEPTH_TILES = 100;
const DEPTH_GOLDEN_TILE = 150;
const DEPTH_REMOTE_PLAYERS = 500;
const DEPTH_LOCAL_PLAYER = 600;
const DEPTH_FLASH = 700;

// Board collision zone padding (how far around the board spectators are blocked)
const BOARD_PADDING = 4; // pixels of padding around the grid

// Colors
const COLOR_TILE_DEFAULT = 0x8b6f47;
const COLOR_TILE_BORDER = 0x6b5635;
const COLOR_TILE_SAFE = 0x4488cc; // DEBUG
const COLOR_GOLDEN = 0xffd700;
const COLOR_FLASH_GREEN = 0x00ff66;
const COLOR_FLASH_RED = 0xff3333;

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
            /** Production plaza schema: flat wearable fields + `updatedAt` (see sunflower-land `features/world/types/Room.ts`). */
            clothing?: unknown;
          },
          sessionId: string,
        ) => void,
      ) => void;
    };
  };
};

function optionalWearableString(
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  const raw = source[key];
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  return t.length > 0 ? t : undefined;
}

/** Join payload / nested `equipped` map (template guest bumpkin shape). */
function bumpkinPartsFromEquippedRecord(
  equipped: Record<string, unknown> | undefined,
): BumpkinParts | undefined {
  if (!equipped) return undefined;
  const parts: BumpkinParts = {
    background: optionalWearableString(equipped, "background") as
      | BumpkinParts["background"]
      | undefined,
    body: optionalWearableString(equipped, "body") as BumpkinParts["body"] | undefined,
    hair: optionalWearableString(equipped, "hair") as BumpkinParts["hair"] | undefined,
    shirt: optionalWearableString(equipped, "shirt") as BumpkinParts["shirt"] | undefined,
    pants: optionalWearableString(equipped, "pants") as BumpkinParts["pants"] | undefined,
    shoes: optionalWearableString(equipped, "shoes") as BumpkinParts["shoes"] | undefined,
    tool: optionalWearableString(equipped, "tool") as BumpkinParts["tool"] | undefined,
    hat: optionalWearableString(equipped, "hat") as BumpkinParts["hat"] | undefined,
    necklace: optionalWearableString(equipped, "necklace") as
      | BumpkinParts["necklace"]
      | undefined,
    secondaryTool: optionalWearableString(equipped, "secondaryTool") as
      | BumpkinParts["secondaryTool"]
      | undefined,
    coat: optionalWearableString(equipped, "coat") as BumpkinParts["coat"] | undefined,
    onesie: optionalWearableString(equipped, "onesie") as BumpkinParts["onesie"] | undefined,
    suit: optionalWearableString(equipped, "suit") as BumpkinParts["suit"] | undefined,
    wings: optionalWearableString(equipped, "wings") as BumpkinParts["wings"] | undefined,
    dress: optionalWearableString(equipped, "dress") as BumpkinParts["dress"] | undefined,
    beard: optionalWearableString(equipped, "beard") as BumpkinParts["beard"] | undefined,
    aura: optionalWearableString(equipped, "aura") as BumpkinParts["aura"] | undefined,
  };
  return Object.values(parts).some((v) => v != null) ? parts : undefined;
}

/**
 * Maps Colyseus `Player.clothing` to bumpkin parts for `tokenUriBuilder`.
 * Matches main-game / plaza: flat parts on `clothing`, not `clothing.equipped`.
 */
function mmoClothingToBumpkinParts(clothing: unknown): BumpkinParts | undefined {
  if (!clothing || typeof clothing !== "object") return undefined;
  const c = clothing as Record<string, unknown>;

  const nested = c.equipped;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const fromEquipped = bumpkinPartsFromEquippedRecord(
      nested as Record<string, unknown>,
    );
    if (fromEquipped) return fromEquipped;
  }

  // Flat schema on `clothing` (plaza / production MMO) — same slots as `equipped`, plus e.g. `updatedAt`.
  return bumpkinPartsFromEquippedRecord(c);
}

function mmoClothingToTokenParts(clothing: unknown): string | undefined {
  const parts = mmoClothingToBumpkinParts(clothing);
  if (!parts) return undefined;
  try {
    const token = tokenUriBuilder(parts);
    return token && token !== "0" ? token : undefined;
  } catch {
    return undefined;
  }
}

function mmoClothingUpdatedAt(clothing: unknown): number {
  if (!clothing || typeof clothing !== "object") return 0;
  const u = (clothing as { updatedAt?: unknown }).updatedAt;
  return typeof u === "number" && Number.isFinite(u) ? u : 0;
}

export class TileJumpScene extends Phaser.Scene {
  // Player
  private playerBumpkin?: BumpkinContainer;
  private mode: TileJumpMode = "spectate";
  private playerGridCol = CENTER_COL;
  private playerGridRow = START_ROW;
  private isMoving = false;
  private isChecking = false; // true during the 0.2s tile-check delay
  private isDead = false;
  private hasWon = false;

  // Input
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA?: Phaser.Input.Keyboard.Key;
  private keyS?: Phaser.Input.Keyboard.Key;
  private keyD?: Phaser.Input.Keyboard.Key;
  private keyW?: Phaser.Input.Keyboard.Key;

  // Board
  private tileSprites: Phaser.GameObjects.Rectangle[][] = [];
  private goldenTile?: Phaser.GameObjects.Rectangle;

  // Background
  private bgTile?: Phaser.GameObjects.TileSprite;

  // Board collision blocker for spectate mode
  private boardBlocker?: Phaser.GameObjects.Zone;
  private boardCollider?: Phaser.Physics.Arcade.Collider;

  // MMO
  private mmoRoom?: MmoRoomHandle;
  private packetSentAt = 0;
  private serverPosition = { x: 0, y: 0 };
  private remoteBumpkins: Record<
    string,
    {
      bumpkin: BumpkinContainer;
      clothingRev: number;
      appliedTokenKey: string;
    }
  > = {};

  // Player bumpkin token (real clothing from session, or offline fallback)
  private playerTokenParts?: string;

  // Store listener cleanup
  private storeUnsub?: () => void;

  constructor() {
    super("TileJumpScene");
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  private gridToWorld(col: number, row: number): { x: number; y: number } {
    return {
      x: BOARD_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2,
      y: BOARD_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  /** Spectate spawn: off the right side of the board */
  private getSpectateSpawn(): { x: number; y: number } {
    return {
      x: BOARD_OFFSET_X + (COLS + 2) * TILE_SIZE,
      y: BOARD_OFFSET_Y + Math.floor(ROWS / 2) * TILE_SIZE,
    };
  }

  // ── Preload ────────────────────────────────────────────────────────────
  preload() {
    const base = import.meta.env.BASE_URL;
    this.load.image(SHADOW_KEY, `${base}game/shadow.png`);
    this.load.image(BG_KEY, `${base}game/3x3_bg.png`);
    this.load.spritesheet(SILHOUETTE_KEY, `${base}game/silhouette.webp`, {
      frameWidth: 14,
      frameHeight: 18,
    });
    this.load.bitmapFont(
      BITMAP_FONT,
      "https://sunflower-land.com/testnet-assets/public/world/Teeny%20Tiny%20Pixls5.png",
      "https://sunflower-land.com/testnet-assets/public/world/Teeny%20Tiny%20Pixls5.xml",
    );

    const animBase = getAnimationApiBase();

    // Load the player's real bumpkin sprite (from session) or offline fallback
    this.playerTokenParts =
      (this.game.registry.get(PLAYER_TOKEN_PARTS_REGISTRY_KEY) as
        | string
        | undefined) || getOrCreateOfflineTileJumpTokenParts();

    const playerKey = bumpkinTextureKeyForToken(this.playerTokenParts);
    if (!this.textures.exists(playerKey)) {
      this.load.spritesheet(
        playerKey,
        `${animBase}/animate/0_v1_${this.playerTokenParts}/idle_walking_dig_drilling`,
        { frameWidth: 96, frameHeight: 64 },
      );
    }

    // Also preload offline iconic bumpkins (used as fallbacks for remote players)
    for (const token of OFFLINE_ICONIC_BUMPKIN_TOKENS) {
      const key = bumpkinTextureKeyForToken(token);
      this.load.spritesheet(
        key,
        `${animBase}/animate/0_v1_${token}/idle_walking_dig_drilling`,
        { frameWidth: 96, frameHeight: 64 },
      );
    }
  }

  // ── Create ─────────────────────────────────────────────────────────────
  create() {
    this.mmoRoom = this.game.registry.get(
      MMO_SERVER_REGISTRY_KEY,
    ) as MmoRoomHandle | undefined;

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBackgroundColor("#1a1a2e");

    // Repeating 3x3 background — fixed to world so it doesn't move with camera
    this.bgTile = this.add
      .tileSprite(0, 0, WORLD_W, WORLD_H, BG_KEY)
      .setOrigin(0, 0)
      .setDepth(DEPTH_BG);

    this.drawBoard();
    this.drawStartTile();
    this.drawGoldenTile();
    this.createBoardBlocker();

    // Start in spectate mode — spawn off the board
    this.spawnSpectator();

    // Input
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setZoom(CAMERA_ZOOM);
    cam.setRoundPixels(true);
    // Smooth lerp follow — 0.08 gives a gentle chase that avoids jitter
    if (this.playerBumpkin) {
      cam.startFollow(this.playerBumpkin, true, 0.08, 0.08);
    }

    // Tap-to-move in play mode
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handleTap(pointer);
    });

    // Listen for mode changes from the React HUD
    this.storeUnsub = $tileJumpHud.subscribe((state) => {
      if (state.mode !== this.mode) {
        this.switchMode(state.mode);
      }
    });

    // Cleanup
    this.events.once("shutdown", () => {
      this.storeUnsub?.();
      Object.values(this.remoteBumpkins).forEach((r) => {
        r.bumpkin.destroy();
      });
      this.remoteBumpkins = {};
    });
  }

  // ── Board drawing ──────────────────────────────────────────────────────
  private drawBoard() {
    this.tileSprites = [];
    for (let row = 0; row < ROWS; row++) {
      this.tileSprites[row] = [];
      for (let col = 0; col < COLS; col++) {
        const { x, y } = this.gridToWorld(col, row);
        this.add
          .rectangle(x, y, TILE_SIZE - 1, TILE_SIZE - 1, COLOR_TILE_BORDER)
          .setDepth(DEPTH_TILES - 1);

        const fillColor =
          SHOW_DEBUG_SAFE_PATH && isSafeTile(col, row)
            ? COLOR_TILE_SAFE
            : COLOR_TILE_DEFAULT;
        const tile = this.add
          .rectangle(x, y, TILE_SIZE - 3, TILE_SIZE - 3, fillColor)
          .setDepth(DEPTH_TILES);
        this.tileSprites[row][col] = tile;
      }
    }
  }

  private drawStartTile() {
    const { x, y } = this.gridToWorld(CENTER_COL, START_ROW);
    this.add
      .rectangle(x, y, TILE_SIZE - 1, TILE_SIZE - 1, COLOR_TILE_BORDER)
      .setDepth(DEPTH_TILES - 1);
    this.add
      .rectangle(x, y, TILE_SIZE - 3, TILE_SIZE - 3, COLOR_FLASH_GREEN)
      .setDepth(DEPTH_TILES);
    this.add
      .bitmapText(x, y, BITMAP_FONT, "START", 5)
      .setOrigin(0.5)
      .setTint(0x004400)
      .setDepth(DEPTH_TILES + 1);
  }

  private drawGoldenTile() {
    const { x, y } = this.gridToWorld(CENTER_COL, FINISH_ROW);
    this.goldenTile = this.add
      .rectangle(x, y, TILE_SIZE - 2, TILE_SIZE - 2, COLOR_GOLDEN)
      .setDepth(DEPTH_GOLDEN_TILE);

    this.tweens.add({
      targets: this.goldenTile,
      alpha: { from: 0.8, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add
      .bitmapText(x, y, BITMAP_FONT, "FINISH", 5)
      .setOrigin(0.5)
      .setTint(0x6b4c00)
      .setDepth(DEPTH_GOLDEN_TILE + 1);
  }

  /** Invisible physics zone covering the entire board area — blocks spectators. */
  private createBoardBlocker() {
    // The zone covers from the finish tile row to the start tile row, all columns
    const topLeft = this.gridToWorld(0, FINISH_ROW);
    const bottomRight = this.gridToWorld(COLS - 1, START_ROW);

    const zx = (topLeft.x + bottomRight.x) / 2;
    const zy = (topLeft.y + bottomRight.y) / 2;
    const zw = bottomRight.x - topLeft.x + TILE_SIZE + BOARD_PADDING * 2;
    const zh = bottomRight.y - topLeft.y + TILE_SIZE + BOARD_PADDING * 2;

    this.boardBlocker = this.add.zone(zx, zy, zw, zh);
    this.physics.world.enable(this.boardBlocker);
    const body = this.boardBlocker.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.moves = false;
  }

  /** Wire up the collider between player and board blocker (call after bumpkin exists). */
  private ensureBoardCollider() {
    // Destroy old collider if any
    if (this.boardCollider) {
      this.boardCollider.destroy();
      this.boardCollider = undefined;
    }
    if (this.boardBlocker && this.playerBumpkin) {
      this.boardCollider = this.physics.add.collider(
        this.playerBumpkin,
        this.boardBlocker,
      );
      // Active only in spectate mode
      this.boardCollider.active = this.mode === "spectate";
    }
  }

  // ── Mode switching ─────────────────────────────────────────────────────
  private switchMode(newMode: TileJumpMode) {
    this.mode = newMode;

    if (newMode === "play") {
      // Spawn on start tile
      this.resetTileColors();
      this.hasWon = false;
      this.spawnOnStart();
    } else {
      // Move to spectate position
      this.hasWon = false;
      this.isDead = false;
      this.isMoving = false;
      this.spawnSpectator();
    }

    // Update collider active state to match mode
    this.ensureBoardCollider();

    if (this.playerBumpkin) {
      this.cameras.main.startFollow(this.playerBumpkin, true, 0.08, 0.08);
    }
  }

  // ── Spawn helpers ──────────────────────────────────────────────────────
  private spawnOnStart() {
    this.playerGridCol = CENTER_COL;
    this.playerGridRow = START_ROW;
    const { x, y } = this.gridToWorld(this.playerGridCol, this.playerGridRow);

    if (this.playerBumpkin) {
      this.playerBumpkin.setPosition(x, y);
      this.playerBumpkin.idle();
      const body = this.playerBumpkin.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
    } else {
      this.createPlayerBumpkin(x, y);
    }

    this.isMoving = false;
    this.isChecking = false;
    this.isDead = false;
    this.serverPosition = { x, y };
    // Teleport (death reset, mode switch): force broadcast so remotes don’t keep old coords.
    this.sendMmoPosition(true);
  }

  private spawnSpectator() {
    const { x, y } = this.getSpectateSpawn();

    if (this.playerBumpkin) {
      this.playerBumpkin.setPosition(x, y);
      this.playerBumpkin.idle();
      const body = this.playerBumpkin.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
    } else {
      this.createPlayerBumpkin(x, y);
    }

    this.isMoving = false;
    this.isDead = false;
    this.serverPosition = { x, y };
    this.sendMmoPosition(true);
  }

  private createPlayerBumpkin(x: number, y: number) {
    this.playerBumpkin = new BumpkinContainer(this, x, y, {
      tokenParts:
        this.playerTokenParts ?? getOrCreateOfflineTileJumpTokenParts(),
    });
    this.playerBumpkin.setDepth(DEPTH_LOCAL_PLAYER);

    // Wire up board blocker collider now that the bumpkin exists
    this.ensureBoardCollider();
  }

  // ── Update ─────────────────────────────────────────────────────────────
  update() {
    if (this.mode === "spectate") {
      this.handleFreeMovement();
    } else {
      // Play mode
      if (!this.isDead && !this.hasWon && !this.isMoving && !this.isChecking) {
        this.handleGridInput();
      }
    }

    this.sendMmoPosition();
    this.syncRemotePlayers();
  }

  // ── Free movement (spectate) ───────────────────────────────────────────
  private handleFreeMovement() {
    if (!this.playerBumpkin) return;

    const left = this.cursors?.left.isDown || this.keyA?.isDown === true;
    const right = this.cursors?.right.isDown || this.keyD?.isDown === true;
    const up = this.cursors?.up.isDown || this.keyW?.isDown === true;
    const down = this.cursors?.down.isDown || this.keyS?.isDown === true;

    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;
    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    const body = this.playerBumpkin.body as Phaser.Physics.Arcade.Body;

    if (vx !== 0 || vy !== 0) {
      if (vx < 0) this.playerBumpkin.faceLeft();
      if (vx > 0) this.playerBumpkin.faceRight();
      this.playerBumpkin.walk();
      body.setVelocity(vx * WALKING_SPEED * 2, vy * WALKING_SPEED * 2);
    } else {
      body.setVelocity(0, 0);
      this.playerBumpkin.idle();
    }
  }

  // ── Grid movement (play mode) ──────────────────────────────────────────
  private handleGridInput() {
    let dCol = 0;
    let dRow = 0;

    if (
      Phaser.Input.Keyboard.JustDown(
        this.cursors?.up as Phaser.Input.Keyboard.Key,
      ) ||
      Phaser.Input.Keyboard.JustDown(this.keyW as Phaser.Input.Keyboard.Key)
    ) {
      dRow = -1;
    } else if (
      Phaser.Input.Keyboard.JustDown(
        this.cursors?.down as Phaser.Input.Keyboard.Key,
      ) ||
      Phaser.Input.Keyboard.JustDown(this.keyS as Phaser.Input.Keyboard.Key)
    ) {
      dRow = 1;
    } else if (
      Phaser.Input.Keyboard.JustDown(
        this.cursors?.left as Phaser.Input.Keyboard.Key,
      ) ||
      Phaser.Input.Keyboard.JustDown(this.keyA as Phaser.Input.Keyboard.Key)
    ) {
      dCol = -1;
    } else if (
      Phaser.Input.Keyboard.JustDown(
        this.cursors?.right as Phaser.Input.Keyboard.Key,
      ) ||
      Phaser.Input.Keyboard.JustDown(this.keyD as Phaser.Input.Keyboard.Key)
    ) {
      dCol = 1;
    }

    if (dCol === 0 && dRow === 0) return;
    this.tryGridMove(dCol, dRow);
  }

  // ── Tap-to-move (play mode) ────────────────────────────────────────────
  private handleTap(pointer: Phaser.Input.Pointer) {
    if (this.mode !== "play") return;
    if (this.isDead || this.hasWon || this.isMoving || this.isChecking) return;

    // Convert screen coordinates to world coordinates
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // Figure out which grid cell was tapped
    const tappedCol = Math.floor(
      (worldPoint.x - BOARD_OFFSET_X) / TILE_SIZE,
    );
    const tappedRow = Math.floor(
      (worldPoint.y - BOARD_OFFSET_Y) / TILE_SIZE,
    );

    // Calculate delta from current player position
    const dCol = tappedCol - this.playerGridCol;
    const dRow = tappedRow - this.playerGridRow;

    // Only allow adjacent (cardinal) moves — exactly 1 step in one axis
    if (Math.abs(dCol) + Math.abs(dRow) !== 1) return;

    // Re-use the same movement logic as keyboard
    this.tryGridMove(dCol, dRow);
  }

  /** Shared logic for moving one grid step (keyboard or tap). */
  private tryGridMove(dCol: number, dRow: number) {
    const newCol = this.playerGridCol + dCol;
    const newRow = this.playerGridRow + dRow;

    // From START tile: can only move up into the grid at center col
    if (this.playerGridRow === START_ROW) {
      if (!(dRow === -1 && newCol === CENTER_COL)) return;
    }
    // From FINISH tile: locked
    else if (this.playerGridRow === FINISH_ROW) {
      return;
    }
    // On the main grid
    else {
      if (newRow === FINISH_ROW) {
        if (newCol !== CENTER_COL) return;
        if (dCol < 0) this.playerBumpkin?.faceLeft();
        if (dCol > 0) this.playerBumpkin?.faceRight();
        this.movePlayerTo(newCol, newRow, () => this.onWin());
        return;
      }
      if (newRow === START_ROW) {
        if (newCol !== CENTER_COL) return;
      } else if (
        newCol < 0 ||
        newCol >= COLS ||
        newRow < 0 ||
        newRow >= ROWS
      ) {
        return;
      }
    }

    if (dCol < 0) this.playerBumpkin?.faceLeft();
    if (dCol > 0) this.playerBumpkin?.faceRight();

    if (newRow === START_ROW) {
      this.movePlayerTo(newCol, newRow, () => {});
      return;
    }

    this.movePlayerTo(newCol, newRow, () => {
      this.checkTile(newCol, newRow);
    });
  }

  private movePlayerTo(col: number, row: number, onComplete: () => void) {
    if (!this.playerBumpkin) return;
    this.isMoving = true;

    const { x, y } = this.gridToWorld(col, row);
    this.playerBumpkin.walk();

    // Smooth tween — camera lerp follow handles centering automatically
    this.tweens.add({
      targets: this.playerBumpkin,
      x,
      y,
      duration: 100, // fast (2× previous)
      ease: "Sine.easeInOut", // smooth acceleration/deceleration
      onComplete: () => {
        this.playerBumpkin?.idle();
        this.playerGridCol = col;
        this.playerGridRow = row;
        this.isMoving = false;

        this.serverPosition = { x, y };
        this.sendMmoPosition(true);
        onComplete();
      },
    });
  }

  // ── Tile checks ────────────────────────────────────────────────────────
  private checkTile(col: number, row: number) {
    this.isChecking = true;
    const safe = isSafeTile(col, row);
    this.time.delayedCall(600, () => {
      this.isChecking = false;
      if (safe) {
        this.flashTile(col, row, COLOR_FLASH_GREEN);
      } else {
        this.flashTile(col, row, COLOR_FLASH_RED);
        this.onDeath();
      }
    });
  }

  private flashTile(col: number, row: number, color: number) {
    const { x, y } = this.gridToWorld(col, row);
    const flash = this.add
      .rectangle(x, y, TILE_SIZE - 3, TILE_SIZE - 3, color)
      .setDepth(DEPTH_FLASH)
      .setAlpha(0.9);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      ease: "Power2",
      onComplete: () => flash.destroy(),
    });
  }

  private onDeath() {
    this.isDead = true;
    addTileJumpDeath();
    this.cameras.main.shake(300, 0.01);

    this.time.delayedCall(800, () => {
      this.resetTileColors();
      this.spawnOnStart();
      if (this.playerBumpkin) {
        this.cameras.main.startFollow(this.playerBumpkin, true, 0.08, 0.08);
      }
    });
  }

  private onWin() {
    this.hasWon = true;
    setTileJumpWon();

    for (const { col, row } of SAFE_PATH) {
      if (row >= 0 && row < ROWS) {
        const tile = this.tileSprites[row]?.[col];
        if (tile) tile.setFillStyle(COLOR_FLASH_GREEN);
      }
    }

    if (this.goldenTile) {
      this.tweens.add({
        targets: this.goldenTile,
        scaleX: 1.2,
        scaleY: 1.3,
        duration: 400,
        yoyo: true,
        repeat: 2,
        ease: "Bounce.easeOut",
      });
    }

    const { x: cx, y: cy } = this.gridToWorld(
      CENTER_COL,
      Math.floor(ROWS / 2),
    );
    const winText = this.add
      .bitmapText(cx, cy - 10, BITMAP_FONT, "You finished!", 10)
      .setOrigin(0.5)
      .setTint(0xffd700)
      .setDepth(DEPTH_FLASH + 100);

    this.tweens.add({
      targets: winText,
      y: cy - 30,
      duration: 3000,
      ease: "Power1",
    });
  }

  private resetTileColors() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = this.tileSprites[row]?.[col];
        if (!tile) continue;
        const baseColor =
          SHOW_DEBUG_SAFE_PATH && isSafeTile(col, row)
            ? COLOR_TILE_SAFE
            : COLOR_TILE_DEFAULT;
        tile.setFillStyle(baseColor);
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

    if ((moved || force) && (force || now - this.packetSentAt > 1000 / SEND_PACKET_RATE)) {
      this.serverPosition = { x: bumpkin.x, y: bumpkin.y };
      this.packetSentAt = now;
      server.send(0, {
        x: bumpkin.x,
        y: bumpkin.y,
        sceneId: TILE_JUMP_MINIGAME_SLUG,
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
      if (String(player.sceneId) !== TILE_JUMP_MINIGAME_SLUG) return;

      seen.add(sessionId);
      let entry = this.remoteBumpkins[sessionId];

      const clothingRev = mmoClothingUpdatedAt(player.clothing);
      const remoteToken = mmoClothingToTokenParts(player.clothing);
      const appliedTokenKey = remoteToken ?? "__default__";

      const needsNewAvatar =
        !entry ||
        !entry.bumpkin.active ||
        entry.clothingRev !== clothingRev ||
        entry.appliedTokenKey !== appliedTokenKey;

      if (needsNewAvatar) {
        entry?.bumpkin?.destroy();

        const bumpkin = new BumpkinContainer(this, player.x, player.y, {
          ...(remoteToken ? { tokenParts: remoteToken } : {}),
        });
        bumpkin.setDepth(DEPTH_REMOTE_PLAYERS);

        entry = { bumpkin, clothingRev, appliedTokenKey };
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
    });

    Object.keys(this.remoteBumpkins).forEach((id) => {
      if (!seen.has(id)) {
        this.remoteBumpkins[id]?.bumpkin.destroy();
        delete this.remoteBumpkins[id];
      }
    });
  }
}
