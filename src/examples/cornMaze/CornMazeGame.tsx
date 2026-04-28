import React, { useEffect, useRef } from "react";
import { Game, AUTO } from "phaser";
import { PhaserNavMeshPlugin } from "phaser-navmesh";
import NinePatchPlugin from "phaser3-rex-plugins/plugins/ninepatch-plugin.js";
import VirtualJoystickPlugin from "phaser3-rex-plugins/plugins/virtualjoystick-plugin.js";

import { Preloader } from "features/world/scenes/Preloader";
import { CornMazeScene } from "./CornMazeScene";

/**
 * Mounts the Phaser Game with the corn maze scene. The store-driven map swap
 * lives inside the scene's subscription, so we don't tear the Game down on
 * day changes — a fresh `scene.restart({ day })` is enough.
 */
export const CornMazeGame: React.FC<{
  farmId: number;
}> = ({ farmId }) => {
  const game = useRef<Game | undefined>(undefined);

  const initialScene = "corn_maze";
  const scenes = [Preloader, CornMazeScene];

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: AUTO,
      fps: { target: 30, smoothStep: true },
      backgroundColor: "#000000",
      parent: "game-content",
      autoRound: true,
      pixelArt: true,
      plugins: {
        global: [
          { key: "rexNinePatchPlugin", plugin: NinePatchPlugin, start: true },
          {
            key: "rexVirtualJoystick",
            plugin: VirtualJoystickPlugin,
            start: true,
          },
        ],
        scene: [
          {
            key: "PhaserNavMeshPlugin",
            plugin: PhaserNavMeshPlugin,
            mapping: "navMeshPlugin",
            start: true,
          },
        ],
      },
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: "arcade",
        arcade: { debug: false, gravity: { x: 0, y: 0 } },
      },
      scene: scenes,
      loader: { crossOrigin: "anonymous" },
    };

    game.current = new Game(config);
    game.current.registry.set("initialScene", initialScene);
    game.current.registry.set("id", farmId);

    return () => {
      game.current?.destroy(true);
      game.current = undefined;
    };
  }, [farmId]);

  return <div id="game-content" />;
};
