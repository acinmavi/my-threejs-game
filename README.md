# Crossy 3D · Sky Club

A Three.js arcade game inspired by tile-based road crossing. Original procedural voxel chicken, trees, vehicles, floating logs and trains; no downloaded game assets.

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

New furthest rows award points. Cars travel in both directions at different speeds and lengths. Two cars per 26-unit loop leave larger crossing windows; road speeds range from 1.05 to a maximum of 3.4 units/s. Even the fastest lane leaves more than 2.9 seconds of clear crossing time at a fixed column.

After eight seconds of grace, the camera advances at 0.2–0.3 rows/s and follows forward progress. Falling 3.5 rows behind ends the run. A red trailing line and warning show when you are falling behind. Grass breaks let you wait between hazards.

River lanes have moving logs that carry you sideways. Land on a log; falling into water or drifting beyond the playable width ends the run. Trains have a 12-second cycle with two seconds of flashing warning lights before a 1.6-second passage. A nearby warning also appears in the HUD, with a horn when sound is enabled.

Trees block cells; the center column of grass lanes stays open. The playable width is nine cells. You can backtrack up to six rows behind your furthest position, subject to the trailing camera limit. Pausing freezes traffic, logs, train timing and camera pressure; switching tabs pauses automatically. Best score persists in the browser.

## Verify

```sh
rtk npm test
rtk npm run build
```

Simulation runs at 120 Hz. Tests cover hop completion, scoring, interpolation, blocked moves, traffic collision, traffic wrapping and bounded lane generation.
