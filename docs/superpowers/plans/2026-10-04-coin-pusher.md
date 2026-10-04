# Coin Pusher implementation plan

1. Add cannon-es and create games/coin-pusher/src/game.js for deterministic session rules and the physics world. Write Node tests of collection, timing, collision and lifecycle.
2. Create main.js, index.html, style.css and preview.svg. Render the cabinet with reusable materials/geometries; synchronize physical bodies with meshes. Add aim slider, keyboard/touch fire, HUD, pause, sound and shared exit dialog.
3. Add Home card, fifth build entry, test glob and README controls/mechanics.
4. Run all tests and production build. Verify Home route, 50-token wallet with 157–187 starting board coins, firing, wheel bonus, pause/escape and mobile layout through browser. Fix issues before commit.
5. Commit, push main, deploy to existing Vercel project and verify public route. Notify completion.

Additional regression checks: dense random starting count, full-pile contact propagation, repeated same-color stones and repeated six-stone bonuses.
