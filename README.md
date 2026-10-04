# Crossy 3D · Sky Club

A Three.js arcade game inspired by tile-based road crossing. Original procedural voxel chicken, trees and vehicles; no downloaded game assets. This first version includes grass, roads and traffic.

## Run

```sh
rtk npm install
rtk npm run dev
```

Open http://127.0.0.1:5174/. Requires Node.js 20.19+ or 22.12+ and WebGL 2. Google Fonts is optional; a system font works offline.

## Controls

- Arrow keys / WASD: hop one tile; hold to keep hopping.
- Space, click or tap the scene: forward.
- Swipe the scene or use the direction buttons: move on touch screens.
- P / Escape or pause button: pause and resume.
- Enter after a collision, or replay button: new run.
- Sound button: enable generated sound effects.

New furthest rows award points. Cars travel in both directions with varying speeds and lengths. Their speeds grow with distance and are capped. Trees block cells; the center column of grass lanes stays open. The playable width is nine cells. You can backtrack up to six rows behind your furthest position. Traffic freezes while paused, and switching tabs pauses automatically. Best score persists in the browser.

## Verify

```sh
rtk npm test
rtk npm run build
```

Simulation runs at 120 Hz. Tests cover hop completion, scoring, interpolation, blocked moves, traffic collision, traffic wrapping and bounded lane generation.
