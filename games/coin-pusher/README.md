# Infinity Pusher

Three.js / Cannon ES two-tier coin pusher inspired by Andamiro Avengers. Original geometric art; virtual credits and points.

## Core loop

50 starting credits. Press Space / fire button to spend one credit and fire one visible token at the rotating target wheel. The wheel has sectors 1, 3, 5, 10, 2, 8, 15 and 5. The sector at the fixed marker when the projectile arrives (0.6 seconds) awards that exact number of additional physical tokens. The fired token falls onto the shelf too. Reward tokens rain onto the upper moving shelf; the wheel does not directly add the displayed award to the credit wallet. Slider / A D / arrows choose the drop lane.

The upper shelf advances and retracts on a 3.8-second cycle above a fixed lower floor. Coins are present on both tiers at the start. The sliding upper shelf lets tokens fall onto the lower tier as its front edge retracts. Its front face and falling tokens push the dense lower pile toward the collection ledge. Closed rear and side walls contain coins and stones. Only the front ledge is open. The extended upper shelf overlaps the rear wall throughout its stroke.

Starting board: 156–180 randomized coins, including a prefilled upper shelf, plus four or five random-color stones (half the previous nine on average). Every front coin awards +1 point only; credits never refill. Every 50 points earned from front coins releases one random-color stone onto the upper shelf; side losses and upper-to-lower transfers do not count toward this milestone. Collected or side-lost stones do not auto-respawn.

Every front stone counts regardless of color: +20 points and a separate Bonus Spin awarding physical coins, stones, or points. Every sixth stone additionally awards +100 points and a Super Bonus / Jackpot spin with triple payouts. Duplicate colors and subsequent sets of six work identically.

P pauses physics, flights, dispensing and bonus timers. Esc confirms Home; cancel preserves pause state. When credits run out, finish pending flights, reward rain, stones and bonus spins, then allow eight seconds for physical settling before ending. Best score remains browser-local.

Fixed 60 Hz rigid-body physics, SAP broadphase, sleeping bodies, reduced contact friction equations, 260-piece cap and instanced coin rendering. Exact queued payouts wait for capacity rather than disappearing. Shelf friction is calibrated for visible two-tier transfer in this simplified browser model; no cloth/card simulation. Rendering uses a maximum 1.5 pixel ratio and 512-pixel shadow map.

Credit chỉ giảm khi bắn, không tự bổ sung. Xu cửa trước +1 điểm. Mỗi đá mở vòng thưởng riêng (8/15/25 xu trên bàn, 1/2 đá mới, hoặc 50/100/150 điểm). Đủ 6 đá bất kỳ mở thêm Super Bonus ×3. Hai vòng quay độc lập; thưởng vật phẩm được thả lên bàn trên.
