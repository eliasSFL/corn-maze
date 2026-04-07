import Phaser from "phaser";
import { SQUARE_WIDTH } from "lib/constants";

/** Default farmer look → `tokenUriBuilder` output used by the animation CDN. */
const DEFAULT_BUMPKIN_TOKEN = "32_1_5_13_18_22_23";

function animationBaseUrl(): string {
  const raw =
    import.meta.env.VITE_ANIMATION_URL ||
    "https://animations-dev.sunflower-land.com";
  return raw.replace(/\/$/, "");
}

export type BumpkinClothing = {
  updatedAt: number;
};

export class BumpkinContainer extends Phaser.GameObjects.Container {
  public sprite: Phaser.GameObjects.Sprite | undefined;
  public shadow: Phaser.GameObjects.Sprite | undefined;
  private silhouette: Phaser.GameObjects.Sprite | undefined;
  private ready = false;
  private spriteKey = "";
  private idleAnimationKey = "";
  private walkingAnimationKey = "";
  private direction: "left" | "right" = "right";
  public clothing: BumpkinClothing;
  private readonly tokenParts: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options?: {
      clothing?: BumpkinClothing;
      /** Bumpkin token segments for `0_v1_${tokenParts}` on the animation service. */
      tokenParts?: string;
      direction?: "left" | "right";
    },
  ) {
    super(scene, x, y);
    this.clothing = options?.clothing ?? { updatedAt: 0 };
    this.tokenParts = options?.tokenParts ?? DEFAULT_BUMPKIN_TOKEN;
    if (options?.direction) this.direction = options.direction;

    scene.physics.add.existing(this);

    this.silhouette = scene.add.sprite(0, 0, "silhouette");
    this.add(this.silhouette);
    this.sprite = this.silhouette;

    this.shadow = scene.add
      .sprite(0, 8, "shadow")
      .setSize(SQUARE_WIDTH, SQUARE_WIDTH);
    this.add(this.shadow);
    this.sendToBack(this.shadow);

    this.setSize(SQUARE_WIDTH, SQUARE_WIDTH);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(SQUARE_WIDTH, SQUARE_WIDTH);
    body.setCollideWorldBounds(true);

    this.loadSprites(scene);
    scene.add.existing(this);
  }

  /** Animation CDN token segments (`0_v1_${parts}`), for gameplay logic (e.g. identify NPCs). */
  getBumpkinTokenParts(): string {
    return this.tokenParts;
  }

  private loadSprites(scene: Phaser.Scene) {
    this.spriteKey = `bumpkin_${this.tokenParts}`;
    this.idleAnimationKey = `${this.spriteKey}-idle`;
    this.walkingAnimationKey = `${this.spriteKey}-walk`;

    if (scene.textures.exists(this.spriteKey)) {
      this.ensureAnims(scene);
      this.swapToAnimatedSprite(scene);
      return;
    }

    const url = `${animationBaseUrl()}/animate/0_v1_${this.tokenParts}/idle_walking_dig_drilling`;
    scene.load.spritesheet(this.spriteKey, url, {
      frameWidth: 96,
      frameHeight: 64,
    });

    scene.load.once(`filecomplete-spritesheet-${this.spriteKey}`, () => {
      if (!scene.textures.exists(this.spriteKey) || this.ready) return;
      this.ensureAnims(scene);
      this.swapToAnimatedSprite(scene);
    });

    scene.load.start();
  }

  private ensureAnims(scene: Phaser.Scene) {
    if (!scene.anims.exists(this.idleAnimationKey)) {
      scene.anims.create({
        key: this.idleAnimationKey,
        frames: scene.anims.generateFrameNumbers(this.spriteKey, {
          start: 0,
          end: 8,
        }),
        repeat: -1,
        frameRate: 10,
      });
    }
    if (!scene.anims.exists(this.walkingAnimationKey)) {
      scene.anims.create({
        key: this.walkingAnimationKey,
        frames: scene.anims.generateFrameNumbers(this.spriteKey, {
          start: 9,
          end: 16,
        }),
        repeat: -1,
        frameRate: 10,
      });
    }
  }

  private swapToAnimatedSprite(scene: Phaser.Scene) {
    this.ensureAnims(scene);

    const idle = scene.add.sprite(0, 2, this.spriteKey).setOrigin(0.5);
    this.add(idle);
    this.sprite = idle;
    if (this.shadow) {
      this.sendToBack(this.shadow);
    }

    if (this.direction === "left") this.faceLeft();
    idle.play(this.idleAnimationKey, true);

    if (this.silhouette?.active) {
      this.silhouette.destroy();
      this.silhouette = undefined;
    }
    this.ready = true;
  }

  faceLeft() {
    if (this.sprite?.scaleX === -1) return;
    this.direction = "left";
    this.sprite?.setScale(-1, 1);
  }

  faceRight() {
    if (this.sprite?.scaleX === 1) return;
    this.direction = "right";
    this.sprite?.setScale(1, 1);
  }

  walk() {
    if (
      !this.ready ||
      !this.sprite?.anims ||
      !this.scene?.anims.exists(this.walkingAnimationKey)
    ) {
      return;
    }
    if (this.sprite.anims.getName() !== this.walkingAnimationKey) {
      this.sprite.anims.play(this.walkingAnimationKey, true);
    }
  }

  idle() {
    if (
      !this.ready ||
      !this.sprite?.anims ||
      !this.scene?.anims.exists(this.idleAnimationKey)
    ) {
      return;
    }
    if (this.sprite.anims.getName() !== this.idleAnimationKey) {
      this.sprite.anims.play(this.idleAnimationKey, true);
    }
  }
}
