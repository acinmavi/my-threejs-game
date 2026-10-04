import * as THREE from "three";
import "./style.css";
import { createGame, step, grab, CHUTE } from "./game.js";
import { setupGameExit } from "../../../src/exit-dialog.js";
const $ = (id) => document.getElementById(id);
let game = createGame(),
  paused = false,
  best = 0,
  muted = true,
  audio,
  last = 0,
  accumulator = 0,
  rightView = false;
try {
  best = Number(localStorage.getItem("claw-club-best")) || 0;
} catch {}
$("best").textContent = String(best).padStart(2, "0");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#becfc2");
const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$("world").appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight("#fff9df", "#7b8f7d", 2.5));
const sun = new THREE.DirectionalLight("#fff6d9", 3);
sun.position.set(-4, 9, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
scene.add(sun);
const materials = new Map();
function mat(color) {
  if (!materials.has(color))
    materials.set(
      color,
      new THREE.MeshStandardMaterial({ color, roughness: 0.6 }),
    );
  return materials.get(color);
}
function box(parent, color, size, pos) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color));
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function ball(parent, color, size, pos) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat(color));
  mesh.scale.set(...size);
  mesh.position.set(...pos);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
const machine = new THREE.Group();
scene.add(machine);
box(machine, "#9ebcad", [6, 0.18, 4.7], [0, -0.15, 0]);
// Separate floor panels leave an actual hole above the prize chute.
box(machine, "#e6dbc4", [6, 0.15, 3.3], [0, -0.05, -0.7]);
box(machine, "#e6dbc4", [3.3, 0.15, 1.4], [1.35, -0.05, 1.65]);
box(machine, "#e6dbc4", [0.5, 0.15, 1.4], [-2.75, -0.05, 1.65]);
box(machine, "#749588", [6, 1, 4.7], [0, -0.75, 0]);
box(machine, "#334f48", [1.15, 0.65, 0.08], [CHUTE.x, -0.72, 2.39]);
box(machine, "#d9b76e", [1.25, 0.09, 0.15], [CHUTE.x, -1.06, 2.4]);
for (const x of [-2.8, 2.8])
  for (const z of [-2.1, 2.1])
    box(machine, "#6e9180", [0.14, 4.7, 0.14], [x, 2.18, z]);
for (const z of [-2.13, 2.13])
  box(machine, "#779b83", [5.9, 0.28, 0.25], [0, 4.48, z]);
for (const x of [-2.83, 2.83])
  box(machine, "#779b83", [0.24, 0.28, 4.1], [x, 4.48, 0]);
box(machine, "#e2c17e", [5.9, 0.13, 0.14], [0, 4.55, 2.3]);
const glass = new THREE.MeshPhysicalMaterial({
  color: "#c7e5df",
  transparent: true,
  opacity: 0.1,
  roughness: 0.1,
  depthWrite: false,
  side: THREE.DoubleSide,
});
for (const x of [-2.85, 2.85]) {
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.3), glass);
  pane.rotation.y = Math.PI / 2;
  pane.position.set(x, 2.2, 0);
  machine.add(pane);
}
const back = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.3), glass);
back.position.set(0, 2.2, -2.15);
machine.add(back);
box(machine, "#e3c483", [1.06, 0.04, 1.04], [CHUTE.x, -0.02, CHUTE.z]);
box(machine, "#304b44", [0.92, 0.045, 0.91], [CHUTE.x, 0.01, CHUTE.z]);
const rail = box(machine, "#b0bbb0", [5.3, 0.09, 0.09], [0, 4.05, 0]);
const carriage = box(machine, "#e0bc6e", [0.48, 0.22, 0.45], [0, 4.02, 0]);
const cable = box(machine, "#56685b", [0.035, 1, 0.035], [0, 3.8, 0]);
const claw = new THREE.Group();
machine.add(claw);
ball(claw, "#d6dcd0", [0.15, 0.14, 0.15], [0, 0, 0]);
const fingers = [];
for (let i = 0; i < 3; i++) {
  const pivot = new THREE.Group();
  pivot.rotation.y = (i * Math.PI * 2) / 3;
  claw.add(pivot);
  const arm = new THREE.Group();
  pivot.add(arm);
  box(arm, "#c7cec4", [0.055, 0.36, 0.065], [0, -0.17, 0.18]);
  box(arm, "#d6dcd0", [0.055, 0.08, 0.18], [0, -0.34, 0.1]);
  fingers.push(arm);
}
const marker = new THREE.Mesh(
  new THREE.RingGeometry(0.14, 0.18, 32),
  new THREE.MeshBasicMaterial({ color: "#b07e37", side: THREE.DoubleSide }),
);
marker.rotation.x = -Math.PI / 2;
marker.position.y = 0.05;
machine.add(marker);
const bears = new Map();
function populate() {
  for (const view of bears.values()) machine.remove(view);
  bears.clear();
  for (const bear of game.bears) {
    const view = new THREE.Group();
    machine.add(view);
    bears.set(bear.id, view);
    ball(view, bear.color, [0.29, 0.34, 0.23], [0, 0, 0]);
    ball(view, bear.color, [0.24, 0.23, 0.22], [0, 0.43, 0]);
    for (const side of [-1, 1]) {
      ball(view, bear.color, [0.1, 0.1, 0.09], [side * 0.19, 0.61, 0]);
      ball(view, bear.color, [0.12, 0.22, 0.12], [side * 0.32, -0.02, 0]);
      ball(view, bear.color, [0.13, 0.13, 0.19], [side * 0.17, -0.29, 0.11]);
      ball(view, "#263a32", [0.025, 0.028, 0.02], [side * 0.09, 0.47, 0.205]);
    }
    ball(view, "#f5e6c9", [0.13, 0.08, 0.055], [0, 0.36, 0.2]);
    ball(view, "#263a32", [0.037, 0.029, 0.025], [0, 0.39, 0.25]);
    ball(view, "#f5e6c9", [0.17, 0.22, 0.02], [0, -0.03, 0.225]);
  }
}
populate();
function tone(frequency) {
  if (muted) return;
  try {
    audio ??= new AudioContext();
    audio.resume();
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.16);
  } catch {}
}
const keys = new Set(),
  held = new Map();
function clearInput() {
  keys.clear();
  held.clear();
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
      "Máy cũng nghỉ.",
      "Đồng hồ và càng đã dừng. Tiếp tục khi bạn sẵn sàng.",
      "Tiếp tục →",
    );
  else $("overlay").hidden = true;
  document.activeElement?.blur();
}
function attempt() {
  if (!paused && grab(game)) {
    clearInput();
    tone(350);
  }
}
function finish() {
  best = Math.max(best, game.score);
  try {
    localStorage.setItem("claw-club-best", String(best));
  } catch {}
  $("best").textContent = String(best).padStart(2, "0");
  $("pause").disabled = true;
  clearInput();
  card(
    "HẾT 3 LƯỢT",
    game.score ? "Gấu đã về với bạn!" : "Suýt được rồi…",
    `Bạn mang về ${game.score}/3 gấu. Gắp lệch sẽ yếu; thử căn giữa thân và đổi góc nhìn để chỉnh chiều sâu.`,
    "Chơi ván mới →",
  );
  tone(game.score ? 780 : 170);
}
$("play").addEventListener("click", () => (paused ? togglePause() : start()));
$("grab").addEventListener("click", () => {
  attempt();
  $("grab").blur();
});
$("pause").addEventListener("click", togglePause);
$("view").addEventListener("click", () => {
  rightView = !rightView;
  $("view").textContent = rightView ? "Góc nhìn: phải ↔" : "Góc nhìn: trái ↔";
  resize();
  $("view").blur();
});
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
const directions = {
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
};
window.addEventListener("keydown", (event) => {
  if (event.target.closest("button,a,input,select")) return;
  if (directions[event.code]) {
    event.preventDefault();
    keys.add(event.code);
  }
  if (event.repeat) return;
  if (event.code === "Space") {
    event.preventDefault();
    if (game.phase === "ready") start();
    else attempt();
  }
  if (event.code === "KeyP") togglePause();
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", clearInput);
for (const button of document.querySelectorAll(".dpad button")) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    held.set(event.pointerId, [
      Number(button.dataset.dx),
      Number(button.dataset.dz),
    ]);
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(name, (event) => held.delete(event.pointerId));
  button.addEventListener("click", (event) => {
    if (
      event.detail === 0 &&
      game.phase === "playing" &&
      game.stage === "aim" &&
      !paused
    )
      step(game, 0.1, Number(button.dataset.dx), Number(button.dataset.dz));
  });
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.phase === "playing" && !paused) togglePause();
  clearInput();
  last = 0;
});
function resize() {
  const w = $("world").clientWidth,
    h = $("world").clientHeight;
  renderer.setSize(w, h, false);
  const halfWidth = Math.max(4.7, (4.4 * w) / h);
  camera.left = -halfWidth;
  camera.right = halfWidth;
  camera.top = (halfWidth * h) / w;
  camera.bottom = -camera.top;
  camera.position.set(rightView ? -8 : 8, 7.5, 10);
  camera.lookAt(0, 1.9, 0);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe($("world"));
resize();
function frame(now) {
  const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
  last = now;
  if (game.phase === "playing" && !paused) {
    let dx = 0,
      dz = 0;
    for (const key of keys) {
      const d = directions[key];
      if (d) {
        dx += d[0];
        dz += d[1];
      }
    }
    for (const d of held.values()) {
      dx += d[0];
      dz += d[1];
    }
    accumulator += dt;
    while (accumulator >= 1 / 120 && game.phase === "playing") {
      step(game, 1 / 120, Math.sign(dx), Math.sign(dz));
      accumulator -= 1 / 120;
    }
    if (game.phase === "over") finish();
  }
  carriage.position.set(game.x, 4.02, game.z);
  rail.position.z = game.z;
  claw.position.set(game.x, game.y, game.z);
  const length = 4.02 - game.y;
  cable.scale.y = Math.max(0.02, length);
  cable.position.set(game.x, game.y + length / 2, game.z);
  const openness =
    game.stage === "close"
      ? 1 - Math.min(game.stageTime / 0.55, 1)
      : ["lift", "return"].includes(game.stage)
        ? 0
        : 1;
  for (const arm of fingers) arm.rotation.x = -openness * 0.6;
  for (const bear of game.bears) {
    const view = bears.get(bear.id);
    view.visible = !bear.collected;
    view.position.set(bear.x, bear.y, bear.z);
    view.rotation.z =
      bear.tilt +
      (bear === game.carried ? Math.sin(game.stageTime * 5) * 0.12 : 0);
  }
  marker.position.set(game.x, 0.05, game.z);
  marker.visible = game.stage === "aim";
  $("attempts").textContent = `${game.attempts} LƯỢT`;
  $("score").textContent = `${game.score} GẤU`;
  $("timer").textContent =
    game.stage === "aim" ? `${Math.ceil(game.timer)} GIÂY CĂN` : "ĐANG GẮP";
  $("tip").textContent = game.message;
  $("grab").disabled =
    game.phase !== "playing" || paused || game.stage !== "aim";
  for (const button of document.querySelectorAll(".dpad button"))
    button.disabled = $("grab").disabled;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setupGameExit({
  isPlaying: () => game.phase === "playing",
  isPaused: () => paused,
  togglePause,
});
