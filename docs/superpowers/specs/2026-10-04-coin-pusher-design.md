# Coin Pusher — approved design

User approved 2026-10-04: add a 3D coin pusher inspired by Andamiro Avengers to Sky Club, test, push and deploy.

50 starting tokens. Aim horizontally and time shots against a moving target wheel. Tokens land on a crowded playfield. A reciprocating pusher drives physical coins and stones of any color toward the front collection ledge; side gutters lose objects. Front coins award points and replacement tokens. Each collected stone triggers a bonus spin; every six collected stones trigger a larger bonus. No paid economy. Use original geometric cabinet and stone art.

Three.js renders a cabinet, wheel, launcher, physical discs and gems. Cannon ES handles rigid-body gravity, friction, collisions and stacking at a fixed timestep. Session state handles token spending, target hits, collection, bonuses and game over. Limit body count for browser/mobile performance. The last shot gets a settling period before ending the round; pause freezes physics and timers. Keep existing Home/escape confirmation behavior and browser-local best score.

Checks: token/cooldown rules, target timing, coin/stone collection and side losses, one-time rewards, all-six bonus, game-over grace and restart, gravity/collision/pusher movement. Full arcade tests and build, desktop/mobile browser verification, then production route/exit verification.

User refinement during implementation: dense, randomized starting pile (157–187 board coins), so newly dropped tokens can cause front-edge falls. No color-set collection: every stone counts, duplicate colors included; each group of six grants Super Bonus. Stones recycle after collection. Physical forces must propagate through the whole pile, including sleeping front rows. Fire exactly one token per click/Space press.

## Final user refinement: actual arcade loop

The user clarified credit → fire one visible token → rotating numbered target wheel → exact physical token award → upper moving shelf → lower fixed pile → front ledge. Increase starting board coins and stones by 50%: 236–281 coins, 9 stones. Tokens occupy both tiers at startup. Sector 15 produces 15 additional physical coins; the original projectile also falls onto the shelf. Payout is physical rather than a wallet increment. Each 20 front coin drops releases a new random-color stone. Each stone grants Bonus Spin; every sixth grants Super Bonus / Jackpot. Colors never gate collection. No immediate stone recycling; replenishment follows the twenty-coin milestone. Preserve the 50-credit starting wallet and existing Home/pause/escape controls.

Verification includes exact numbered payouts, queued-capacity preservation, upper-to-lower physical transfer, milestones across multiple groups of twenty, duplicate-color bonuses and pending-flight game-over grace.
