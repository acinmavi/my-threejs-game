# Crossy 3D · Sky Club

A Three.js arcade game inspired by tile-based road crossing. Original procedural voxel chicken, trees, vehicles, floating logs and trains; no downloaded game assets.

## Run

```sh
rtk npm install
rtk npm run dev
```

Open http://127.0.0.1:5174/. Requires Node.js 20.19+ or 22.12+ and WebGL 2. Google Fonts is optional; a system font works offline.

## Controls

- Arrow keys / WASD: hop one tile; hold to keep hopping.
- Space, click or tap the scene: forward.
- Swipe the scene or use the direction buttons: move on touch screens.
- P or pause button: pause and resume.
- Enter after a collision, or replay button: new run.
- Sound button: enable generated sound effects.

New furthest rows award points. Cars travel in both directions at different speeds and lengths. Road crossings grow from 2 to 3, 4 and 5 consecutive lanes at distances 0, 48, 96 and 144. Traffic speed scales continuously with distance up to 2.5× at row 240; each lane keeps its own base speed. The HUD shows the current level, maximum road width and speed multiplier.

Two cars per loop leave larger crossing windows. At speeds above 3.4 units/s, vehicle spacing increases proportionally, so even the fastest lane leaves more than 2.9 seconds of clear crossing time at a fixed column. Grass banks before rivers and train tracks remain available for waiting. Existing lanes retain their generated properties.

After eight seconds of grace, the camera advances at 0.2–0.3 rows/s and follows forward progress. Falling 3.5 rows behind ends the run. A red trailing line and warning show when you are falling behind. Grass breaks let you wait between hazards.

River lanes have moving logs that carry you sideways. Land on a log; falling into water or drifting beyond the playable width ends the run. Trains have a 12-second cycle with two seconds of flashing warning lights before a 1.6-second passage. A nearby warning also appears in the HUD, with a horn when sound is enabled.

Trees block cells; the center column of grass lanes stays open. The playable width is nine cells. You can backtrack up to six rows behind your furthest position, subject to the trailing camera limit. Pausing freezes traffic, logs, train timing and camera pressure; switching tabs pauses automatically. Best score persists in the browser.

## Verify

```sh
rtk npm test
rtk npm run build
```

Simulation runs at 120 Hz. Tests cover hop completion, scoring, interpolation, blocked moves, traffic collision, traffic wrapping and bounded lane generation.

In the Sky Club collection, Escape and Home open an exit confirmation. Cancel resumes the prior play/pause state.

## Độ khó

Chọn Dễ / Thường / Khó / Rất khó / Siêu khó trước khi bắt đầu hoặc chơi lại. Lựa chọn được lưu trên trình duyệt; lượt đang chơi không đổi độ khó. Mặc định Thường.

| Chế độ | Tốc độ xe ban đầu → tối đa | Đạt tốc độ tối đa | Đường đạt 5 làn | Camera bắt đầu kéo |
| --- | --- | --- | --- | --- |
| Dễ | 1× → 2.5× | 240 hàng | 144 hàng | Sau 8 giây |
| Thường | 1.6× → 3.8× | 120 hàng | 72 hàng | Sau 5 giây |
| Khó | 2.2× → 5.5× | 96 hàng | 48 hàng | Sau 3 giây |
| Rất khó | 3× → 7× | 72 hàng | 36 hàng | Sau 2 giây |
| Siêu khó | 4× → 9× | 48 hàng | 24 hàng | Sau 1.5 giây |

Mỗi làn có tốc độ riêng. Khoảng trống xe có tối thiểu 3 / 1.35 / 0.8 / 0.6 / 0.42 giây theo chế độ, so với 0.18 giây mỗi bước nhảy. Camera tăng áp lực theo quãng đường và thời gian chơi, có giới hạn tốc độ.
