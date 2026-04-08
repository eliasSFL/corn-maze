type Source = "phaser_preloader_scene" | "phaser_base_scene" | string;

export const createErrorLogger = (_source: Source, _farmId: number) => {
  return (error: unknown) => {
    console.error("[minigame]", _source, error);
  };
};
