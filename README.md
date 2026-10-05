# Sky Club

Six browser arcade games built with Three.js. Play at [tit-moon2026.vercel.app](https://tit-moon2026.vercel.app/).

## Run locally

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5175/. Home lists all games and browser-local best scores.

## Games

- **Flappy 3D** (`/games/flappy-three/`): flap through pipes as speed and difficulty increase. Space, click or tap.
- **Crossy 3D** (`/games/crossy-three/`): dodge traffic, cross rivers and wait for trains while the camera pushes you forward. Five difficulties. WASD, arrow keys or swipe.
- **Pop the Lock** (`/games/pop-the-lock/`): hit the target and reverse direction. Endless is the default; level-based play is also available. Space, click or tap.
- **Claw Club** (`/games/claw-machine/`): a challenging 3D claw machine with three grabs per round and 20 seconds to aim. WASD or touch controls to move; Space to grab.
- **Infinity Pusher** (`/games/coin-pusher/`): 50 credits per round, a target wheel awarding 1–15 coins, and a two-tier Cannon ES pusher. Every 50 points from collected coins creates a stone. Each stone triggers a Bonus Spin; six stones trigger a Jackpot. A/D, arrows or the slider to aim; Space or tap to shoot.
- **Treasure Ball** (`/games/treasure-ball/`): a physical Plinko pegboard, white and gold balls, bonus spins and three-key treasure chests. 50 credits per round. A/D or the slider to aim; Space or tap to drop.

Both pusher games end immediately at zero credits, stopping the pusher and pending rewards. Collected pieces award points, not credits.

## Language and navigation

English is the default. Select **Tiếng Việt** in the header to switch to Vietnamese. The choice is saved locally and shared across Home and all games. Changing language reloads the page and starts a new round; saved best scores remain intact.

Escape, the Home button and the Sky Club logo open a confirmation dialog. Active games pause while it is open. Cancel restores the previous play/pause state; confirming returns Home and ends the current round. P toggles pause. Scores and settings are stored separately for each site origin.

## Verify and build

```sh
npm test
npm run build
npm run preview
```

Vite builds Home and all six game pages, sharing the Three.js bundle. Deploy `dist/` as a static site, or deploy this repository with the included Vercel configuration. No server or database is required.

Active game source lives under `games/`. The original Flappy and Crossy histories were preserved through subtree imports. Archived standalone recovery copies are ignored by Git and excluded from deployment.
