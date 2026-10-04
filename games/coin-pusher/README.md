# Infinity Pusher

3D coin pusher inspired by the moving target and six-stone collection mechanics of Andamiro Avengers. Original geometric cabinet/art. No real currency.

Start with 50 tokens. Aim with slider / left-right / A-D; press Space / fire button. Each shot costs one token and creates a physical disc. Time the six colored target lights crossing the gold marker for +2 tokens. The pusher advances and retracts every 3.8 seconds. Cannon ES simulates gravity, collisions, friction and stacked discs; stones use spherical collision shapes with faceted Three.js visuals.

Front coins: +1 point and +1 token. Side gutters lose pieces; lost stones recycle onto the board. Every front stone, regardless of color: +20 points and Bonus Spin awarding 4, 6, 8 or 12 tokens. Every sixth stone: +100 points and +30 tokens. Bonus rewards use RNG; physical collection does not. No tokens left: allow 8 seconds for last shot/2 pusher strokes and pending bonus rewards before game over. P pauses physics and clocks; Esc confirms Home. Best score stored locally as coin-pusher-best.

Fixed 60 Hz physics, SAP broadphase, sleeping bodies, 260-piece cap and instanced coin rendering. This is a simplified cabinet prototype; real machines' coin friction and payout calibration differ.

Starting board uses a dense 132-coin lower layer and 25–55 random extra coins. Every round changes pile positions and count. All resting bodies wake during forward strokes so forces propagate to the ledge. Collected stones recycle; duplicate colors count toward each six-stone Super Bonus.
