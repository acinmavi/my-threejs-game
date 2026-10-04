# Infinity Pusher

Three.js / Cannon ES two-tier coin pusher inspired by Andamiro Avengers. Original geometric art; virtual credits and points.

## Core loop

50 starting credits. Press Space / fire button to spend one credit and fire one visible token at the rotating target wheel. The wheel has sectors 1, 3, 5, 10, 2, 8, 15 and 5. The sector at the fixed marker when the projectile arrives (0.6 seconds) awards that exact number of additional physical tokens. The fired token falls onto the shelf too. Reward tokens rain onto the upper moving shelf; the wheel does not directly add the displayed award to the credit wallet. Slider / A D / arrows choose the drop lane.

The upper shelf advances and retracts on a 3.8-second cycle above a fixed lower floor. Coins are present on both tiers at the start. The sliding upper shelf lets tokens fall onto the lower tier as its front edge retracts. Its front face and falling tokens push the dense lower pile toward the collection ledge. Side gutters lose objects.

Starting board: 236–281 randomized coins (50% more than the previous 157–187), including a prefilled upper shelf, plus nine random-color stones (previously six). Every front coin awards +1 point and +1 credit. Every 20 front coins releases one random-color stone onto the upper shelf; side losses and upper-to-lower transfers do not count toward this milestone. Collected or side-lost stones do not auto-respawn.

Every front stone counts regardless of color: +20 points and Bonus Spin awarding 4, 6, 8 or 12 credits. Every sixth stone additionally awards Super Bonus / Jackpot: +100 points and +30 credits. Duplicate colors and subsequent sets of six work identically.

P pauses physics, flights, dispensing and bonus timers. Esc confirms Home; cancel preserves pause state. When credits run out, finish pending flights, reward rain, stones and bonus spins, then allow eight seconds for physical settling before ending. Best score remains browser-local.

Fixed 60 Hz rigid-body physics, SAP broadphase, sleeping bodies, reduced contact friction equations, 420-piece cap and instanced coin rendering. Exact queued payouts wait for capacity rather than disappearing. Shelf friction is calibrated for visible two-tier transfer in this simplified browser model; no cloth/card simulation.
