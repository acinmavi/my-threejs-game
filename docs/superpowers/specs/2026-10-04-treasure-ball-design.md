# Treasure Ball design

User supplied Plinko → reward → ball pusher → bonus wheel design, requested implementation as a separate sixth arcade game.

50 virtual credits per round; one white ball per button/Space press. Aim slider and A/D choose release location. Real peg collisions decide the seven bottom channels: big ball, eight small balls, 25 points, key, empty, two big balls, twelve small balls. Fired ball also enters the pusher. Three keys award 200 points and two big balls.

Prefilled closed-side two-tier pusher contains white small balls and gold big balls. Front small falls award two points, never credits; front big falls award ten points and queue a separate visible wheel. Wheel rewards small balls, big balls, points, or 500-point Jackpot. Every sixth big ball queues one triple wheel spin. Physical payouts rain onto upper shelf. Queues preserve payouts at the 360-piece limit. New round resets all state; no purchases or real prizes.

Pause freezes peg board, table and wheel. Esc uses existing confirm-Home dialog. Finish only after remaining Plinko balls, payouts and spins resolve plus ten seconds settling. Best score browser-local. Three.js and Cannon ES; geometric art; independent game.js simulation and main.js rendering, home card and Vite entry.

Verification: real peg outcomes and no stuck ball, physical upper/lower transfer, side/rear containment, front collection exactly once, rewards and keys, all wheel branches/no credit refunds, six-ball repeat jackpot, queue cap, pause/reset/end lifecycle, full existing tests/build, desktop/mobile smoke and production verification.
