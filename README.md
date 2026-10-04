# Sky Club

Three.js arcade collection: Flappy 3D, Crossy 3D, Pop the Lock and Claw Club. Both games' Git histories are preserved through subtree imports.

## Run

```sh
rtk npm install
rtk npm run dev
```

Open http://127.0.0.1:5175/. Home lists the games and their browser-local best scores.

- `/`: game selection.
- `/games/flappy-three/`: Flappy 3D with progressive speed and pipe difficulty.
- `/games/crossy-three/`: Crossy 3D with camera pressure, widening roads, variable traffic, rivers and trains.

Escape, the Home button and the Sky Club logo open a confirmation dialog. Active games pause while it is open. Cancel restores the previous play/pause state; confirming navigates to Home and ends the current run. P still pauses normally. Best scores remain stored locally for each site origin.

## Verify and build

```sh
rtk npm test
rtk npm run build
rtk npm run preview
```

The root Vite build produces Home and all four game pages and shares the Three.js bundle between games. Deploy `dist/` as a static site, or deploy this repository using the included Vercel configuration. No server or database is required.

The original standalone checkouts were moved from `Documents/Working` to `.archive/` as local recovery copies; `.archive/` is ignored by Git and excluded from deployment. Active source is under `games/`.

Pop the Lock: `/games/pop-the-lock/` — bấm đúng nhịp, đổi chiều sau mỗi lần trúng; mặc định Endless, có thể chọn Theo màn; Space/click/chạm, P pause, Esc về Home.

Claw Club: `/games/claw-machine/` — máy gắp gấu 3D, 3 lượt/ván, 20 giây căn; WASD/nút chạm di chuyển, Space gắp, P pause, Esc Home.
