import * as THREE from "three";
import "./style.css";
import {
  createGame,
  shoot,
  step,
  setAim,
  COLORS,
  MAX_PIECES,
  STONE_THRESHOLD,
  WHEEL_VALUES,
  wheelAward,
  BONUS_REWARDS,
  bonusLabel,
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
  best = Number(localStorage.getItem("coin-pusher-best")) || 0;
} catch {}
$("best").textContent = String(best).padStart(2, "0");
$("stone-list").innerHTML = COLORS.map(
  (color, i) =>
    `<span class="stone" style="--color:#d6ad62" aria-label="Đá ${i + 1}: chưa thu"></span>`,
).join("");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#aabfbb");
const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 60);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$("world").appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight("#fff7d7", "#648d86", 2.7));
const sun = new THREE.DirectionalLight("#fff4d4", 3);
sun.position.set(-4, 9, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(512, 512);
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
scene.add(sun);
const materialCache = new Map();
function mat(color, metal = false) {
  const key = color + metal;
  if (!materialCache.has(key))
    materialCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: metal ? 0.3 : 0.65,
        metalness: metal ? 0.65 : 0.05,
      }),
    );
  return materialCache.get(key);
}
function box(color, size, pos) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color));
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
box("#527f73", [6.15, 0.9, 6.8], [0, -0.85, 0.3]);
box("#d8c991", [4.9, 0.25, 6.2], [0, -0.13, -0.55]);
// Closed side walls meet the floor; only the front collection ledge stays open.
const sideGlass = new THREE.MeshPhysicalMaterial({
  color: "#d8ebe3",
  transparent: true,
  opacity: 0.15,
  depthWrite: false,
  side: THREE.DoubleSide,
});
for (const x of [-2.55, 2.55]) {
  box("#729489", [0.2, 0.35, 6.25], [x, 0.1, -0.575]);
  box("#d4b474", [0.21, 0.06, 6.25], [x, 0.28, -0.575]);
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 1.95, 6.25),
    sideGlass,
  );
  panel.position.set(x, 1.3, -0.575);
  scene.add(panel);
}
box("#244c47", [4.9, 0.12, 0.75], [0, -0.3, 2.92]);
box("#e4bf72", [4.9, 0.06, 0.06], [0, -0.01, 2.52]);
box("#355d55", [3.5, 0.5, 0.1], [0, -0.83, 3.72]);
box("#bfa065", [3.7, 0.07, 0.15], [0, -1.09, 3.75]);
box("#456b63", [5.9, 2.9, 0.24], [0, 1.25, -2.9]);
box("#d3b270", [5.9, 0.15, 0.3], [0, 2.74, -2.9]);
for (const x of [-2.92, 2.92])
  box("#73978a", [0.15, 3.5, 0.15], [x, 1.15, -2.8]);
const pusher = box("#b4c9bb", [4.9, 0.6, 2.6], [0, 0.3, -2.3]);
box("#dfb965", [4.9, 0.06, 0.05], [0, 0.6, -0.98]);
const pusherTrim = scene.children[scene.children.length - 1];
const wheel = new THREE.Group();
wheel.position.set(-1.05, 1.65, -2.7);
scene.add(wheel);
wheel.add(
  new THREE.Mesh(new THREE.RingGeometry(0.27, 0.89, 64), mat("#254840")),
);
wheel.add(
  new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.035, 8, 64),
    mat("#d4b46f", true),
  ),
);
const rotor = new THREE.Group();
rotor.position.z = 0.04;
wheel.add(rotor);
for (let i = 0; i < WHEEL_VALUES.length; i++) {
  const sector = (Math.PI * 2) / WHEEL_VALUES.length,
    centerAngle = i * sector;
  const shape = new THREE.Shape();
  for (let j = 0; j <= 12; j++) {
    const a = centerAngle - sector / 2 + (j * sector) / 12;
    if (j === 0) shape.moveTo(Math.sin(a) * 0.86, Math.cos(a) * 0.86);
    else shape.lineTo(Math.sin(a) * 0.86, Math.cos(a) * 0.86);
  }
  for (let j = 12; j >= 0; j--) {
    const a = centerAngle - sector / 2 + (j * sector) / 12;
    shape.lineTo(Math.sin(a) * 0.29, Math.cos(a) * 0.29);
  }
  shape.closePath();
  const wedge = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({
      color: WHEEL_VALUES[i] === 15 ? "#c09043" : i % 2 ? "#436d60" : "#315547",
      side: THREE.DoubleSide,
    }),
  );
  rotor.add(wedge);
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff2c5";
  context.font = "bold 70px sans-serif";
  context.textAlign = "center";
  context.fillText(String(WHEEL_VALUES[i]), 64, 74);
  context.font = "22px sans-serif";
  context.fillText("XU", 64, 104);
  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      depthTest: false,
    }),
  );
  label.position.set(
    Math.sin(centerAngle) * 0.61,
    Math.cos(centerAngle) * 0.61,
    0.015,
  );
  label.scale.set(0.35, 0.35, 1);
  rotor.add(label);
}
const throat = new THREE.Mesh(
  new THREE.CircleGeometry(0.27, 32),
  new THREE.MeshBasicMaterial({ color: "#172f2b" }),
);
throat.position.z = 0.02;
wheel.add(throat);
// A separate stone reward wheel: its pointer and payouts never affect credits.
const bonusWheel = new THREE.Group();
bonusWheel.position.set(1.25, 1.65, -2.65);
bonusWheel.scale.setScalar(0.85);
scene.add(bonusWheel);
bonusWheel.add(
  new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.04, 8, 64),
    mat("#d4b46f", true),
  ),
);
const bonusRotor = new THREE.Group();
bonusWheel.add(bonusRotor);
for (let i = 0; i < BONUS_REWARDS.length; i++) {
  const sector = (Math.PI * 2) / BONUS_REWARDS.length;
  const angle = i * sector;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  for (let j = 0; j <= 16; j++) {
    const a = angle - sector / 2 + (j * sector) / 16;
    shape.lineTo(Math.sin(a) * 0.86, Math.cos(a) * 0.86);
  }
  shape.closePath();
  bonusRotor.add(
    new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? "#654e79" : "#846695",
        side: THREE.DoubleSide,
      }),
    ),
  );
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff2c5";
  ctx.textAlign = "center";
  ctx.font = "bold 58px sans-serif";
  ctx.fillText(String(BONUS_REWARDS[i].amount), 64, 65);
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(
    bonusLabel(BONUS_REWARDS[i]).split(" ").slice(1).join(" "),
    64,
    100,
  );
  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      depthTest: false,
    }),
  );
  label.position.set(Math.sin(angle) * 0.6, Math.cos(angle) * 0.6, 0.02);
  label.scale.set(0.37, 0.37, 1);
  bonusRotor.add(label);
}
const bonusPointer = new THREE.Mesh(
  new THREE.ConeGeometry(0.13, 0.25, 3),
  mat("#ffe09a"),
);
bonusPointer.rotation.z = Math.PI;
bonusPointer.position.set(1.25, 2.5, -2.5);
scene.add(bonusPointer);
const flightViews = new Map();
const pointer = new THREE.Mesh(
  new THREE.ConeGeometry(0.13, 0.25, 3),
  mat("#ffe09a"),
);
pointer.rotation.z = Math.PI;
pointer.position.set(-1.05, 2.65, -2.56);
scene.add(pointer);
const targetLamp = new THREE.Mesh(
  new THREE.SphereGeometry(0.065, 12, 8),
  new THREE.MeshStandardMaterial({
    color: "#ffda77",
    emissive: "#ddb041",
    emissiveIntensity: 0.5,
  }),
);
targetLamp.position.set(-1.05, 2.32, -2.56);
scene.add(targetLamp);
const launcher = box("#d4b578", [0.32, 0.25, 0.55], [0, 1.52, -1.3]);
const aimLine = new THREE.Mesh(
  new THREE.PlaneGeometry(0.035, 2.25),
  new THREE.MeshBasicMaterial({
    color: "#fff4b7",
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  }),
);
aimLine.rotation.x = -Math.PI / 2;
aimLine.position.set(0, 0.045, -0.25);
scene.add(aimLine);
const coinGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.075, 16);
const coins = new THREE.InstancedMesh(
  coinGeometry,
  mat("#dbb152", true),
  MAX_PIECES,
);
coins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
coins.castShadow = true;
coins.receiveShadow = true;
coins.frustumCulled = false;
scene.add(coins);
const gems = new Map();
const gemGeometry = new THREE.IcosahedronGeometry(0.25, 0);
const transform = new THREE.Object3D();
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
      "Xu, vòng mục tiêu và bonus đã dừng. Tiếp tục khi bạn sẵn sàng.",
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
    localStorage.setItem("coin-pusher-best", String(best));
  } catch {}
  $("best").textContent = String(best).padStart(2, "0");
  $("pause").disabled = true;
  clearInput();
  card(
    "HẾT CREDIT",
    "Một ván thật đã.",
    `${game.score} điểm · ${game.collected} đá · ${game.shots} xu đã bắn. Căn ô thưởng trên vòng quay và tránh khe hai bên để chơi lâu hơn.`,
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
  const halfWidth = Math.max(4.15, (4.1 * w) / h);
  camera.left = -halfWidth;
  camera.right = halfWidth;
  camera.top = (halfWidth * h) / w;
  camera.bottom = -camera.top;
  camera.position.set(3.5, 7.5, 10);
  camera.lookAt(0, 0.4, 0.35);
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
  pusherTrim.position.z = pusher.position.z + 1.32;
  rotor.rotation.z = game.wheel;
  bonusRotor.rotation.z = game.bonusWheel;
  targetLamp.material.emissiveIntensity =
    wheelAward(game.wheel) === 15 ? 2.5 : 0.4;
  const liveFlights = new Set();
  for (const flight of game.flights) {
    liveFlights.add(flight.id);
    if (!flightViews.has(flight.id)) {
      const mesh = new THREE.Mesh(coinGeometry, mat("#ffe294", true));
      mesh.scale.setScalar(1.2);
      scene.add(mesh);
      flightViews.set(flight.id, mesh);
    }
    const mesh = flightViews.get(flight.id),
      t = Math.min(flight.age / 0.6, 1);
    mesh.position.set(
      flight.aim * (1 - t) - 1.05 * t,
      1.52 + (1.65 - 1.52) * t + Math.sin(t * Math.PI) * 0.6,
      -1.3 - 1.35 * t,
    );
    mesh.rotation.set(Math.PI / 2, t * 8, 0);
  }
  for (const [id, mesh] of flightViews)
    if (!liveFlights.has(id)) {
      scene.remove(mesh);
      flightViews.delete(id);
    }
  launcher.position.x = game.aim;
  aimLine.position.x = game.aim;
  let count = 0;
  const activeGems = new Set();
  for (const piece of game.pieces) {
    const body = piece.body;
    if (piece.kind === "coin") {
      transform.position.copy(body.position);
      transform.quaternion.copy(body.quaternion);
      transform.updateMatrix();
      coins.setMatrixAt(count++, transform.matrix);
    } else {
      activeGems.add(piece.id);
      if (!gems.has(piece.id)) {
        const gem = new THREE.Mesh(gemGeometry, mat(COLORS[piece.stone]));
        gem.castShadow = true;
        scene.add(gem);
        gems.set(piece.id, gem);
      }
      const gem = gems.get(piece.id);
      gem.position.copy(body.position);
      gem.quaternion.copy(body.quaternion);
    }
  }
  for (const [id, gem] of gems) {
    if (!activeGems.has(id)) {
      scene.remove(gem);
      gems.delete(id);
    }
  }
  coins.count = count;
  coins.instanceMatrix.needsUpdate = true;
  $("tokens").textContent = `${game.tokens} CREDIT`;
  $("score").textContent = `${game.score} ĐIỂM`;
  $("stone-label").textContent =
    `ĐÁ ${game.collected} · BỘ ${game.collected % 6}/6`;
  for (const [i, el] of [...$("stone-list").children].entries()) {
    el.classList.toggle("collected", i < game.collected % 6);
    el.setAttribute(
      "aria-label",
      `Tiến độ ${i + 1}/6: ${i < game.collected % 6 ? "đã thu" : "chưa thu"}`,
    );
  }
  $("bonus").textContent = game.spin
    ? `${game.spin.reward.superBonus ? "SUPER BONUS ×3" : "ĐÁ → BONUS SPIN"} 🎡 · ĐANG QUAY`
    : game.lastBonus
      ? `${game.lastBonus.superBonus ? "JACKPOT ×3" : "BONUS"}: +${bonusLabel(game.lastBonus)}`
      : "VÒNG ĐÁ: XU / ĐÁ / ĐIỂM · 6 ĐÁ → ×3";
  $("wheel-status").textContent = game.flights.length
    ? "TOKEN → VÒNG QUAY"
    : game.pendingCoins
      ? `ĐANG THẢ ${game.pendingCoins} XU`
      : game.lastWheel
        ? `Ô VỪA TRÚNG: ${game.lastWheel} XU`
        : `Ô ĐANG QUA: ${wheelAward(game.wheel)} XU`;
  $("stone-progress").textContent =
    `${game.frontCoins % STONE_THRESHOLD}/${STONE_THRESHOLD} ĐIỂM TỪ XU → ĐÁ MỚI`;
  $("tip").textContent = game.message;
  $("aim-value").textContent =
    Math.abs(game.aim) < 0.15
      ? "GIỮA"
      : `${game.aim < 0 ? "TRÁI" : "PHẢI"} ${Math.round((Math.abs(game.aim) / 2.1) * 100)}%`;
  const inactive = paused || game.phase !== "playing";
  $("aim").disabled = inactive;
  $("fire").disabled =
    inactive ||
    game.tokens <= 0 ||
    game.pieces.length >= MAX_PIECES ||
    game.pendingCoins > 60;
  if (game.pieces.length >= MAX_PIECES)
    $("tip").textContent =
      "Bàn xu đang đầy. Chờ bàn đẩy dồn xu xuống rồi bắn tiếp.";
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setupGameExit({
  isPlaying: () => game.phase === "playing",
  isPaused: () => paused,
  togglePause,
});
