import * as THREE from "three";
import "./style.css";
import {
  createGame,
  shoot,
  step,
  setAim,
  MAX_PIECES,
  CHANNELS,
  BONUS_REWARDS,
  rewardLabel,
} from "./game.js";
import { setupGameExit } from "../../../src/exit-dialog.js";
const $ = (id) => document.getElementById(id);
let game = createGame(),
  paused = false,
  last = 0,
  accumulator = 0,
  best = 0,
  muted = true,
  audio;
const keys = new Set();
try {
  best = Number(localStorage.getItem("treasure-ball-best")) || 0;
} catch {}
$("best").textContent = String(best).padStart(2, "0");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#c7c1d3");
const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 60);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$("world").appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight("#fff5dc", "#6b587e", 2.8));
const sun = new THREE.DirectionalLight("#fff3ce", 3);
sun.position.set(-4, 9, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
scene.add(sun);
const materials = new Map();
function mat(color, metal = false) {
  const key = color + metal;
  if (!materials.has(key))
    materials.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: metal ? 0.28 : 0.6,
        metalness: metal ? 0.65 : 0,
      }),
    );
  return materials.get(key);
}
function box(color, size, pos) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color));
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
function label(text, x, y, z, size = 0.25, color = "#fff2ce") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(text, 256, 78);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      depthTest: false,
    }),
  );
  sprite.position.set(x, y, z);
  sprite.scale.set(size * 4, size, 1);
  scene.add(sprite);
  return sprite;
}
function badge(number, unit, size = 0.36) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff4d2";
  ctx.textAlign = "center";
  ctx.font = "bold 60px sans-serif";
  ctx.fillText(String(number), 64, 65);
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(unit, 64, 99);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      depthTest: false,
    }),
  );
  sprite.scale.set(size, size, 1);
  return sprite;
}
box("#625273", [5.7, 0.9, 6.8], [0, -0.85, 0.3]);
box("#c4b8c7", [4.9, 0.25, 6.2], [0, -0.13, -0.55]);
box("#463950", [4.9, 0.12, 0.75], [0, -0.3, 2.92]);
box("#e2bd70", [4.9, 0.06, 0.06], [0, -0.01, 2.52]);
box("#453749", [3.5, 0.5, 0.1], [0, -0.83, 3.72]);
box("#c8a367", [3.7, 0.07, 0.15], [0, -1.09, 3.75]);
const glass = new THREE.MeshPhysicalMaterial({
  color: "#e7d9f4",
  transparent: true,
  opacity: 0.13,
  depthWrite: false,
});
for (const x of [-2.55, 2.55]) {
  box("#92769f", [0.2, 0.35, 6.25], [x, 0.1, -0.575]);
  box("#e0ba75", [0.21, 0.06, 6.25], [x, 0.28, -0.575]);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.95, 6.25), glass);
  panel.position.set(x, 1.3, -0.575);
  scene.add(panel);
}
const pusher = box("#b7a7bf", [4.9, 0.6, 2.6], [0, 0.3, -2.3]);
const trim = box("#e2bf76", [4.9, 0.06, 0.05], [0, 0.6, -0.98]);
// Peg board is vertical; the physical Plinko world runs in its x/y plane.
box("#514060", [4.65, 4.1, 0.2], [0, 2.7, -2.82]);
box("#dbb475", [4.85, 0.13, 0.27], [0, 4.79, -2.8]);
for (const x of [-2.27, 2.27])
  box("#b899bd", [0.15, 4.1, 0.24], [x, 2.7, -2.68]);
label("TREASURE DROP", 0, 4.88, -2.55, 0.32);
const pegGeometry = new THREE.SphereGeometry(0.065, 10, 8);
for (const peg of game.pegs) {
  const mesh = new THREE.Mesh(pegGeometry, mat("#e1bb79", true));
  mesh.position.set(peg.x, peg.y, -2.6);
  scene.add(mesh);
}
const channelPanels = [];
CHANNELS.forEach((reward, i) => {
  const x = -2.1 + (i + 0.5) * 0.6;
  const panel = box(
    reward.kind === "big"
      ? "#a58142"
      : reward.kind === "key"
        ? "#b595bd"
        : "#79688a",
    [0.56, 0.49, 0.1],
    [x, 1.13, -2.6],
  );
  channelPanels.push(panel);
  panel.material = panel.material.clone();
  const unit = {
    big: "LỚN",
    small: "NHỎ",
    points: "ĐIỂM",
    key: "CHÌA",
    none: "TRỐNG",
  }[reward.kind];
  const sprite = badge(
    reward.kind === "key" ? "⚿" : reward.kind === "none" ? "–" : reward.amount,
    unit,
    0.4,
  );
  sprite.position.set(x, 1.15, -2.49);
  scene.add(sprite);
});
const launcher = box("#e4bc72", [0.27, 0.16, 0.25], [0, 4.52, -2.55]);
const smallGeometry = new THREE.SphereGeometry(0.14, 12, 8),
  bigGeometry = new THREE.SphereGeometry(0.28, 16, 12);
const smallBalls = new THREE.InstancedMesh(
  smallGeometry,
  mat("#fff8e6"),
  MAX_PIECES,
);
const bigBalls = new THREE.InstancedMesh(
  bigGeometry,
  mat("#e6b347", true),
  MAX_PIECES,
);
for (const mesh of [smallBalls, bigBalls]) {
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);
}
const dropViews = new Map(),
  dropGeometry = new THREE.SphereGeometry(0.1, 12, 8),
  transform = new THREE.Object3D();
// Gold balls use a distinct wheel on the right side of the cabinet.
box("#574568", [1.95, 2.45, 0.2], [3.35, 3.2, -2.82]);
label("GOLD BALL BONUS", 3.35, 4.48, -2.5, 0.22);
const wheel = new THREE.Group();
wheel.position.set(3.35, 3.22, -2.6);
scene.add(wheel);
wheel.add(
  new THREE.Mesh(
    new THREE.TorusGeometry(0.84, 0.04, 8, 64),
    mat("#ebc27c", true),
  ),
);
const rotor = new THREE.Group();
wheel.add(rotor);
BONUS_REWARDS.forEach((reward, i) => {
  const sector = (Math.PI * 2) / BONUS_REWARDS.length,
    angle = i * sector;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  for (let j = 0; j <= 16; j++) {
    const a = angle - sector / 2 + (j * sector) / 16;
    shape.lineTo(Math.sin(a) * 0.81, Math.cos(a) * 0.81);
  }
  shape.closePath();
  rotor.add(
    new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color:
          reward.amount === 500 ? "#ba8845" : i % 2 ? "#8c709e" : "#69577a",
        side: THREE.DoubleSide,
      }),
    ),
  );
  const sprite = badge(
    reward.amount,
    reward.kind === "small" ? "NHỎ" : reward.kind === "big" ? "LỚN" : "ĐIỂM",
    0.3,
  );
  sprite.position.set(Math.sin(angle) * 0.56, Math.cos(angle) * 0.56, 0.02);
  rotor.add(sprite);
});
const pointer = new THREE.Mesh(
  new THREE.ConeGeometry(0.11, 0.2, 3),
  mat("#ffe4a1"),
);
pointer.rotation.z = Math.PI;
pointer.position.set(3.35, 4.16, -2.48);
scene.add(pointer);
const chest = box("#b38b48", [1.2, 0.5, 0.55], [3.35, 1.92, -2.53]);
box("#e5be70", [1.27, 0.13, 0.6], [3.35, 2.22, -2.53]);
label("3 CHÌA → RƯƠNG", 3.35, 1.48, -2.3, 0.18);
function tone(freq) {
  if (muted) return;
  try {
    audio ??= new AudioContext();
    audio.resume();
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.03, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.15);
  } catch {}
}
function clearInput() {
  keys.clear();
}
function card(label, title, copy, button) {
  $("card-label").textContent = label;
  $("card-title").textContent = title;
  $("card-copy").textContent = copy;
  $("play").textContent = button;
  $("overlay").hidden = false;
}
function start() {
  game = createGame();
  game.phase = "playing";
  paused = false;
  last = 0;
  accumulator = 0;
  clearInput();
  $("aim").value = 0;
  $("overlay").hidden = true;
  $("pause").disabled = false;
  $("pause").textContent = "Ⅱ";
  $("pause").setAttribute("aria-label", "Tạm dừng");
  document.activeElement?.blur();
}
function togglePause() {
  if (game.phase !== "playing") return;
  paused = !paused;
  last = 0;
  accumulator = 0;
  clearInput();
  $("pause").textContent = paused ? "▶" : "Ⅱ";
  $("pause").setAttribute("aria-label", paused ? "Tiếp tục" : "Tạm dừng");
  if (paused)
    card(
      "DỪNG MỘT CHÚT",
      "Bàn đẩy cũng nghỉ.",
      "Bóng, bảng đinh và vòng thưởng đã dừng. Tiếp tục khi bạn sẵn sàng.",
      "Tiếp tục →",
    );
  else $("overlay").hidden = true;
  document.activeElement?.blur();
}
function fire() {
  if (!paused && shoot(game)) tone(320);
}
function finish() {
  best = Math.max(best, game.score);
  try {
    localStorage.setItem("treasure-ball-best", String(best));
  } catch {}
  $("best").textContent = String(best).padStart(2, "0");
  $("pause").disabled = true;
  clearInput();
  card(
    "HẾT CREDIT",
    "Một ván thật đã.",
    `${game.score} điểm · ${game.frontBig} bóng lớn · ${game.chests} rương · ${game.shots} bóng đã thả. Chọn vị trí trên bảng đinh và căn nhịp bàn đẩy.`,
    "Chơi ván mới →",
  );
  tone(180);
}
$("play").addEventListener("click", () => (paused ? togglePause() : start()));
$("pause").addEventListener("click", togglePause);
$("sound").addEventListener("click", () => {
  muted = !muted;
  $("sound").textContent = muted ? "♪ Âm thanh: tắt" : "♪ Âm thanh: bật";
  $("sound").setAttribute("aria-pressed", String(!muted));
  $("sound").setAttribute(
    "aria-label",
    muted ? "Bật âm thanh" : "Tắt âm thanh",
  );
  tone(520);
});
$("aim").addEventListener("input", () => setAim(game, $("aim").value));
$("fire").addEventListener("click", () => {
  fire();
  $("fire").blur();
});
window.addEventListener("keydown", (event) => {
  if (event.target.closest("button,a,select")) return;
  if (event.target.closest("input") && !["Space", "KeyP"].includes(event.code))
    return;
  if (
    ["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space"].includes(event.code)
  ) {
    event.preventDefault();
    if (event.code !== "Space") keys.add(event.code);
    if (event.code === "Space" && !event.repeat) {
      if (game.phase === "ready") start();
      else fire();
    }
  }
  if (event.code === "KeyP" && !event.repeat) togglePause();
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", clearInput);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.phase === "playing" && !paused) togglePause();
  clearInput();
  last = 0;
});
function resize() {
  const w = $("world").clientWidth,
    h = $("world").clientHeight;
  renderer.setSize(w, h, false);
  const half = Math.max(4.65, (4.6 * w) / h);
  camera.left = -half;
  camera.right = half;
  camera.top = (half * h) / w;
  camera.bottom = -camera.top;
  camera.position.set(5, 8, 12);
  camera.lookAt(0.65, 1.65, 0.3);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe($("world"));
resize();
function frame(now) {
  const dt = last ? Math.min((now - last) / 1000, 0.075) : 0;
  last = now;
  if (game.phase === "playing" && !paused) {
    accumulator += dt;
    while (accumulator >= 1 / 60 && game.phase === "playing") {
      const direction =
        (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) -
        (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
      if (direction) {
        setAim(game, game.aim + (direction * 1.8) / 60);
        $("aim").value = game.aim;
      }
      step(game, 1 / 60);
      accumulator -= 1 / 60;
    }
    if (game.phase === "over") finish();
  }
  pusher.position.z = game.pusher.position.z;
  trim.position.z = pusher.position.z + 1.32;
  rotor.rotation.z = game.bonusWheel;
  launcher.position.x = game.aim;
  let small = 0,
    big = 0;
  for (const p of game.pieces) {
    transform.position.copy(p.body.position);
    transform.quaternion.copy(p.body.quaternion);
    transform.updateMatrix();
    if (p.kind === "small") smallBalls.setMatrixAt(small++, transform.matrix);
    else bigBalls.setMatrixAt(big++, transform.matrix);
  }
  smallBalls.count = small;
  bigBalls.count = big;
  smallBalls.instanceMatrix.needsUpdate = true;
  bigBalls.instanceMatrix.needsUpdate = true;
  const active = new Set();
  for (const ball of game.plinkoBalls) {
    active.add(ball.id);
    if (!dropViews.has(ball.id)) {
      const mesh = new THREE.Mesh(dropGeometry, mat("#ffffff"));
      scene.add(mesh);
      dropViews.set(ball.id, mesh);
    }
    const mesh = dropViews.get(ball.id);
    mesh.position.set(ball.body.position.x, ball.body.position.y, -2.45);
  }
  for (const [id, mesh] of dropViews)
    if (!active.has(id)) {
      scene.remove(mesh);
      dropViews.delete(id);
    }
  channelPanels.forEach((panel, i) => {
    panel.material.emissive.set(i === game.lastChannel ? "#936933" : "#000000");
    panel.material.emissiveIntensity = 0.3;
  });
  chest.rotation.z = Math.sin(game.time * 4) * (game.keys % 3) * 0.015;
  $("tokens").textContent = `${game.tokens} CREDIT`;
  $("score").textContent = `${game.score} ĐIỂM`;
  $("ball-progress").textContent =
    `BÓNG LỚN ${game.frontBig} · BỘ ${game.frontBig % 6}/6`;
  $("key-progress").textContent =
    `CHÌA ${game.keys % 3}/3 · RƯƠNG ${game.chests}`;
  $("bonus").textContent = game.spin
    ? `${game.spin.reward.superBonus ? "SUPER BONUS ×3" : "BONUS"} · ĐANG QUAY 🎡`
    : game.lastBonus
      ? `THƯỞNG: +${rewardLabel(game.lastBonus)}`
      : "BÓNG LỚN RƠI → VÒNG THƯỞNG";
  $("wheel-status").textContent = game.plinkoBalls.length
    ? `${game.plinkoBalls.length} BÓNG QUA ĐINH`
    : game.lastChannel >= 0
      ? `Ô TRÚNG: ${rewardLabel(CHANNELS[game.lastChannel])}`
      : "PLINKO → BÀN ĐẨY";
  $("tip").textContent = game.message;
  $("aim-value").textContent =
    Math.abs(game.aim) < 0.15
      ? "GIỮA"
      : `${game.aim < 0 ? "TRÁI" : "PHẢI"} ${Math.round((Math.abs(game.aim) / 1.9) * 100)}%`;
  const inactive = paused || game.phase !== "playing";
  $("aim").disabled = inactive;
  $("fire").disabled =
    inactive ||
    game.tokens <= 0 ||
    game.cooldown > 0 ||
    game.pieces.length >= MAX_PIECES ||
    game.pendingSmall + game.pendingBig > 70 ||
    game.plinkoBalls.length >= 6;
  if (game.pieces.length >= MAX_PIECES)
    $("tip").textContent = "Bàn đang đầy. Chờ bóng rơi xuống mép rồi thả tiếp.";
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setupGameExit({
  isPlaying: () => game.phase === "playing",
  isPaused: () => paused,
  togglePause,
});
