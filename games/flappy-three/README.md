# Flappy 3D · Sky Club

A small Three.js game with an original procedural bird, pipes, clouds and scenery. No downloaded game assets.

## Run

```sh
rtk npm install
rtk npm run dev
```

Open the local URL printed by Vite. Requires Node.js 20.19+ or 22.12+ and a browser with WebGL 2.

## Controls

- Space, Arrow Up, click or tap the scene: flap.
- P or pause button: pause and resume.
- Enter after game over, or the replay button: start a new run.
- Sound button: enable or mute generated audio.

Best score is stored in the browser. Switching tabs automatically pauses an active run. Google Fonts is optional; a system font works offline. Game assets and dependencies are local after installation.

Difficulty increases over 90 seconds of active play: speed rises from 3.2 to 6.4 units/s, gaps narrow from 2.7 to 1.7 units, pipe spacing drops from 5.5 to 4.8 units, and height variation increases. Vertical jumps between neighboring gaps are limited to 1.6 units. Existing pipes retain their gap sizes; newly spawned pipes use the current difficulty. Pausing freezes difficulty, and restarting resets it. The HUD shows the speed multiplier.

## Verify

```sh
rtk npm test
rtk npm run build
```

Physics runs at a fixed 120 Hz. The tests cover starting, gravity, pipe collisions, one-time scoring, frozen game-over state and frame-rate consistency.

In the Sky Club collection, Escape and Home open an exit confirmation. Cancel resumes the prior play/pause state.

## Language

English is the default. Use the language selector in the header to switch to Vietnamese. Your choice is saved across the Sky Club collection. Changing language reloads the game and starts a fresh round.
