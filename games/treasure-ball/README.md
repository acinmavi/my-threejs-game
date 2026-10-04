# Treasure Ball

Original Three.js / Cannon ES arcade inspired by the user-supplied ball-pusher concept. `/games/treasure-ball/`.

50 credits per round, one white Plinko ball per press (Space/button). A/D, arrows or slider choose release. Real peg collisions choose one of seven channels: 1 big ball, 8 small balls, 25 points, key, empty, 2 big balls, 12 small balls. Original ball also goes onto the upper shelf. Three keys: 200 points and two big balls.

Closed-side two-tier table starts with 210–230 white small balls and seven gold big balls. Small falls: 2 points. Big falls: 10 points and a separate wheel awarding 12/20/30 small balls, 1/2 big balls, 100/200 points, or 500-point Jackpot. Every sixth big fall queues a triple-payout spin. Physical prizes rain onto upper shelf; credits never refill.

P pauses both physics worlds, dispensing and wheel. Esc opens confirm-Home dialog. Finish pending work and ten seconds settling before game over. Scores stored locally under `treasure-ball-best`; all credits/prizes virtual. Piece limit 360 preserves queued payouts.

Tests cover channels, credits, keys, all wheel rewards, repeated six-ball bonuses, physical Plinko traversal, cap, containment and lifecycle. Use root `npm test`, `npm run build`.
