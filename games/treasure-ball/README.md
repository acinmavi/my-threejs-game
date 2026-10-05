# Treasure Ball

Original Three.js / Cannon ES arcade inspired by the user-supplied ball-pusher concept. `/games/treasure-ball/`.

30 credits per round, one white Plinko ball per press (Space/button). A/D, arrows or slider choose release. Real peg collisions choose one of seven channels: 1 big ball, 4 small balls, 25 points, key, empty, 1 big ball, 6 small balls. Original ball also goes onto the upper shelf. Three keys: 200 points and one big ball.

Closed-side two-tier table starts with 100–110 larger white small balls and three or four larger gold big balls. Small falls: 2 points. Big falls: 10 points and a separate wheel awarding 6/10/15 small balls, 1 big ball, 100/200 points, or 500-point Jackpot. Every sixth big fall queues a triple-payout spin. Physical prizes rain onto upper shelf; credits never refill.

P pauses both physics worlds, dispensing and wheel. Esc opens confirm-Home dialog. After the final credit, a settling phase completes Plinko balls, bonus spins and queued payouts. Once queues clear, the pusher runs for two more cycles, retracts home and allows two seconds for falling balls before ending. At capacity, settling prizes use one temporary overflow slot on the upper shelf so physics can free table space. Scores stored locally under `treasure-ball-best`; all credits/prizes virtual. Piece limit 180 preserves queued payouts.

Tests cover channels, credits, keys, all wheel rewards, repeated six-ball bonuses, physical Plinko traversal, cap, containment and lifecycle. Use root `npm test`, `npm run build`.

Sphere radii: table small0.20, big0.38, Plinko0.13. Physical/render radii share constants. Maximum renderer pixel ratio1.5, shadow map512.

The interface defaults to English. Use the language selector to switch to Vietnamese. The selection persists across Sky Club games; changing language reloads the page and starts a new round.
