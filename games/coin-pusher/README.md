# Infinity Pusher

Three.js / Cannon ES two-tier coin pusher inspired by Andamiro Avengers. Original geometric art; virtual credits and points.

## Core loop

30 starting credits. Press Space / fire button to spend one credit and fire one visible token at the rotating target wheel. The wheel has sectors 1, 3, 5, 10, 2, 8, 15 and 5. The sector at the fixed marker when the projectile arrives (0.6 seconds) awards that exact number of additional physical tokens. The fired token falls onto the shelf too. Reward tokens rain onto the upper moving shelf; the wheel does not directly add the displayed award to the credit wallet. Slider / A D / arrows choose the drop lane.

The upper shelf advances and retracts on a 3.8-second cycle above a fixed lower floor. Coins are present on both tiers at the start. The sliding upper shelf lets tokens fall onto the lower tier as its front edge retracts. Its front face and falling tokens push the dense lower pile toward the collection ledge. Closed rear and side walls contain coins and stones. Only the front ledge is open. The extended upper shelf overlaps the rear wall throughout its stroke.

Starting board: 80–95 randomized coins, including a prefilled upper shelf, plus two or three random-color stones. Every front coin awards +1 point only; credits never refill. Every 50 points earned from front coins releases one random-color stone onto the upper shelf; side losses and upper-to-lower transfers do not count toward this milestone. Collected or side-lost stones do not auto-respawn.

Every front stone counts regardless of color: +20 points and a separate Bonus Spin awarding physical coins, stones, or points. Every sixth stone additionally awards +100 points and a Super Bonus / Jackpot spin with triple payouts. Duplicate colors and subsequent sets of six work identically.

P pauses physics, flights, dispensing and bonus timers. Esc confirms Home; cancel preserves pause state. After the last credit, shooting stops while physics, flights, dispensing and bonus chains finish. With queues empty, the pusher runs for at least eight seconds (over two cycles), stops, and falling pieces settle for two seconds. New collections or bonuses restart completion timing. Best score remains browser-local.

Fixed 60 Hz rigid-body physics, SAP broadphase, sleeping bodies, reduced contact friction equations, 160-piece cap (one temporary overflow slot during final payouts) and instanced coin rendering. Exact queued payouts wait for capacity rather than disappearing. Coin radius/height are 0.28/0.105 units and stone radius is 0.35 units, 40% larger than before, shared by physics and rendering. Shelf friction is calibrated for visible two-tier transfer in this simplified browser model; no cloth/card simulation. Rendering uses a maximum 1.5 pixel ratio and 512-pixel shadow map.

Credits decrease only when firing and never refill. Front coins award +1 point. Each stone opens a separate reward wheel (8/15/25 physical coins, 1/2 new stones, or 50/100/150 points). Any six stones trigger an additional Super Bonus ×3. The two wheels run independently; physical prizes drop onto the upper shelf.

The interface defaults to English. Use the language selector to switch to Vietnamese. The selection persists across Sky Club games; changing language reloads the page and starts a new round.
