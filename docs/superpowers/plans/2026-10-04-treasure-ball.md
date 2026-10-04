# Treasure Ball Implementation Plan

Goal: Add playable sixth arcade game with physical Plinko, two-tier ball pusher and separate bonus wheel.
Architecture: Isolated games/treasure-ball/src/game.js manages Cannon worlds and session state; main.js renders physical state and handles controls. Reuse existing CSS/exit dialog conventions without changing other games.
Tech Stack: Three.js, Cannon ES, Vite, node:test.

1. Create games/treasure-ball/test/game.test.js covering credits, channel boundaries, queues, points/key payouts, bonus selection, repeated six-ball bonus, pause/end/reset, real peg traversal and side containment. Run `rtk proxy node --test games/treasure-ball/test/*.test.js`, initially missing module fails.
2. Implement games/treasure-ball/src/game.js: separate Plinko physics world (locked z motion), small/big sphere bodies on sealed two-tier table, prefill, capped sequential rewards, front collection, eased queued wheel.
3. Create games/treasure-ball/index.html, src/main.js, src/style.css, preview.svg and README.md. Render peg grid/channels, white/gold balls, moving shelf, reward wheel. Bind start/replay, aim, fire, sound, pause, Esc and best score.
4. Update src/home.js, vite.config.js, package.json test command, README.md. Run `rtk proxy npm test` and `rtk proxy npm run build`.
5. Test local browser: home routing, start/aim/fire, physical peg outcomes, wheel, pause/escape/mobile and clean console. Fix failures before commit.
6. Commit/push main; deploy existing linked Vercel project via `rtk proxy npx --yes vercel@latest deploy --prod --yes --scope dunzgnguyens-projects`. Verify public Home/game and save screenshot. Update checkpoint/work tracker; completion notifier.
