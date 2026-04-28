import Phaser from "phaser";
import { SQUARE_WIDTH } from "lib/constants";
import { getAnimationApiBase } from "lib/portal/url";

/** Default farmer look → `tokenUriBuilder` output used by the animation CDN. */
const DEFAULT_BUMPKIN_TOKEN = "32_1_5_13_18_22_23";

function animationBaseUrl(): string {
  return getAnimationApiBase();
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
  private spriteKey2 = "";
  private idleAnimationKey = "";
  private walkingAnimationKey = "";
  private digAnimationKey = "";
  private drillAnimationKey = "";
  private wateringAnimationKey = "";
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
    this.spriteKey2 = `bumpkin2_${this.tokenParts}`;
    this.idleAnimationKey = `${this.spriteKey}-idle`;
    this.walkingAnimationKey = `${this.spriteKey}-walk`;
    this.digAnimationKey = `${this.spriteKey}-dig`;
    this.drillAnimationKey = `${this.spriteKey}-drill`;
    this.wateringAnimationKey = `${this.spriteKey}-watering`;

    if (scene.textures.exists(this.spriteKey)) {
      this.ensureAnims(scene);
      this.swapToAnimatedSprite(scene);
      return;
    }

    const base = animationBaseUrl();

    // Primary sheet: idle, walking, dig, drilling, watering (all on one texture)
    const url = `${base}/animate/0_v1_${this.tokenParts}/idle_walking_dig_drilling_watering`;
    scene.load.spritesheet(this.spriteKey, url, {
      frameWidth: 96,
      frameHeight: 64,
    });

    const onBumpkinLoadError = (file: Phaser.Loader.File) => {
      if (file.key !== this.spriteKey) return;
      scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onBumpkinLoadError);
      if (this.ready || !this.silhouette?.active) return;
      this.silhouette.setScale(4, 4);
    };
    scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onBumpkinLoadError);

    scene.load.once(`filecomplete-spritesheet-${this.spriteKey}`, () => {
      scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onBumpkinLoadError);
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
    if (!scene.anims.exists(this.digAnimationKey)) {
      scene.anims.create({
        key: this.digAnimationKey,
        frames: scene.anims.generateFrameNumbers(this.spriteKey, {
          start: 17,
          end: 29,
        }),
        repeat: -1,
        frameRate: 10,
      });
    }
    if (!scene.anims.exists(this.drillAnimationKey)) {
      scene.anims.create({
        key: this.drillAnimationKey,
        frames: scene.anims.generateFrameNumbers(this.spriteKey, {
          start: 30,
          end: 38,
        }),
        repeat: -1,
        frameRate: 10,
      });
    }

    // Watering: starts after drilling (frame 39) through end of sheet
    if (
      !scene.anims.exists(this.wateringAnimationKey) &&
      scene.textures.exists(this.spriteKey)
    ) {
      const totalFrames =
        scene.textures.get(this.spriteKey).frameTotal - 1; // -1 for __BASE
      if (totalFrames > 39) {
        scene.anims.create({
          key: this.wateringAnimationKey,
          frames: scene.anims.generateFrameNumbers(this.spriteKey, {
            start: 39,
            end: totalFrames - 1,
          }),
          repeat: -1,
          frameRate: 10,
        });
      }
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

  dig() {
    if (
      !this.ready ||
      !this.sprite?.anims ||
      !this.scene?.anims.exists(this.digAnimationKey)
    ) {
      return;
    }
    if (this.sprite.anims.getName() !== this.digAnimationKey) {
      this.sprite.anims.play(this.digAnimationKey, true);
    }
  }

  drill() {
    if (
      !this.ready ||
      !this.sprite?.anims ||
      !this.scene?.anims.exists(this.drillAnimationKey)
    ) {
      return;
    }
    if (this.sprite.anims.getName() !== this.drillAnimationKey) {
      this.sprite.anims.play(this.drillAnimationKey, true);
    }
  }

  watering() {
    if (
      !this.ready ||
      !this.sprite?.anims ||
      !this.scene?.anims.exists(this.wateringAnimationKey)
    ) {
      return;
    }
    if (this.sprite.anims.getName() !== this.wateringAnimationKey) {
      this.sprite.anims.play(this.wateringAnimationKey, true);
    }
  }
}
