import * as THREE from 'three';
import './style.css';
import { createGame, move, step, position, carX } from './game.js';

const $ = id => document.getElementById(id);
let game = createGame(), paused = false, muted = true, audio, best = 0;
let last = 0, accumulator = 0, cameraRow = 0, facing = 0;
try { best = Number(localStorage.getItem('crossy-sky-best')) || 0; } catch {}
$('best').textContent = String(best).padStart(2, '0');
const scene = new THREE.Scene(); scene.background = new THREE.Color('#bad1ab');
scene.fog = new THREE.Fog('#bad1ab', 26, 52);
const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('world').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight('#fff6da', '#7e8b71', 2.4));
const sun = new THREE.DirectionalLight('#fff0ce', 3.2);
sun.position.set(-6, 14, 8); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, far: 50 });
sun.shadow.bias = -.0007; scene.add(sun); scene.add(sun.target);
const cube = new THREE.BoxGeometry(1, 1, 1);
const wheelGeometry = new THREE.CylinderGeometry(.15, .15, .08, 8);
const materials = new Map();
function mat(color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .85, flatShading: true }));
  return materials.get(color);
}
function box(parent, color, size, xyz) {
  const mesh = new THREE.Mesh(cube, mat(color)); mesh.scale.set(...size); mesh.position.set(...xyz);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function tree(parent, x, z, tall = false) {
  const group = new THREE.Group(); group.position.set(x, 0, z);
  box(group, '#9b7550', [.17, .6, .18], [0, .3, 0]);
  box(group, tall ? '#4e7751' : '#69894e', [.65, .58, .65], [0, .75, 0]);
  box(group, tall ? '#5d8956' : '#7d9a5e', [.43, .3, .43], [.03, 1.1, -.02]);
  parent.add(group);
}
const chicken = new THREE.Group(); scene.add(chicken);
box(chicken, '#fff8dc', [.46, .43, .5], [0, .47, .05]);
box(chicken, '#fffce8', [.34, .34, .36], [0, .81, -.08]);
box(chicken, '#e5674e', [.09, .13, .25], [0, 1.045, -.08]);
box(chicken, '#edb449', [.14, .1, .18], [0, .77, -.34]);
box(chicken, '#e5674e', [.08, .12, .08], [0, .66, -.29]);
for (const side of [-1, 1]) {
  box(chicken, '#253b34', [.025, .05, .05], [side * .178, .86, -.19]);
  box(chicken, '#e6a94b', [.065, .22, .06], [side * .12, .16, .03]);
  box(chicken, '#e6a94b', [.1, .05, .2], [side * .12, .055, -.025]);
}
const wings = [-1, 1].map(side => box(chicken, '#e8e4c7', [.07, .22, .33], [side * .26, .47, .07]));
box(chicken, '#efecd6', [.25, .24, .1], [0, .66, .31]);
const marker = new THREE.Mesh(new THREE.RingGeometry(.36, .4, 32), new THREE.MeshBasicMaterial({ color:'#fff8d8', transparent:true, opacity:.7, side:THREE.DoubleSide }));
marker.rotation.x = -Math.PI / 2; marker.position.y = .02; scene.add(marker);
const laneMeshes = new Map();
function carModel(car, direction) {
  const group = new THREE.Group();
  box(group, car.color, [car.length, .3, .66], [0, .32, 0]);
  box(group, car.color, [car.length * .48, .3, .55], [-.12, .59, 0]);
  box(group, '#485d62', [.035, .19, .46], [car.length * .24 - .1, .6, 0]);
  box(group, '#53686b', [car.length * .34, .19, .015], [-.12, .6, .281]);
  box(group, '#53686b', [car.length * .34, .19, .015], [-.12, .6, -.281]);
  box(group, '#e7ead4', [.055, .1, .48], [car.length / 2, .3, 0]);
  for (const x of [-car.length * .31, car.length * .31]) for (const z of [-.34, .34]) {
    const wheel = new THREE.Mesh(wheelGeometry, mat('#354540'));
    wheel.rotation.x = Math.PI / 2; wheel.position.set(x, .18, z); wheel.castShadow = true; group.add(wheel);
  }
  group.scale.x = direction; return group;
}
function makeLane(lane) {
  const group = new THREE.Group(); group.position.z = -lane.row;
  const vehicles = [];
  if (lane.type === 'road') {
    box(group, '#68726a', [26, .15, .98], [0, -.09, 0]);
    for (let x = -12; x < 13; x += 1.5) box(group, '#c0c5aa', [.55, .012, .025], [x, -.009, -.44]);
    for (const car of lane.cars) { const vehicle = carModel(car, lane.direction); group.add(vehicle); vehicles.push(vehicle); }
  } else {
    box(group, lane.row % 2 ? '#96b476' : '#9dbb7e', [26, .18, .98], [0, -.09, 0]);
    for (let x = -4; x <= 4; x++) box(group, (x + lane.row) % 2 ? '#a4bd82' : '#a9c488', [.98, .022, .96], [x, .001, 0]);
    for (const x of lane.blocked) tree(group, x, 0, (x + lane.row) % 2 === 0);
    for (const side of [-1, 1]) {
      if (lane.row % 2 === 0) tree(group, side * (5.6 + Math.abs(lane.row % 3)), 0, true);
      box(group, '#d0d9a2', [.13, .09, .13], [side * 4.7, .045, .2]);
    }
    if (lane.row === 0) {
      // A small start line makes the initial position easy to read.
      for (let x = -4; x <= 4; x++) box(group, '#e3e4b9', [.4, .015, .09], [x, .022, .4]);
    }
  }
  scene.add(group); return { group, vehicles };
}
function syncWorld() {
  for (const [row, view] of laneMeshes) if (!game.lanes.has(row)) { scene.remove(view.group); laneMeshes.delete(row); }
  for (const [row, lane] of game.lanes) {
    if (!laneMeshes.has(row)) laneMeshes.set(row, makeLane(lane));
    const view = laneMeshes.get(row);
    lane.cars.forEach((car, i) => { view.vehicles[i].position.x = carX(lane, car, game.time); });
  }
}
function tone(frequency, duration = .07) {
  if (muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(frequency, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * .6, audio.currentTime + duration);
    gain.gain.setValueAtTime(.07, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + duration);
  } catch {}
}
function card(label, title, copy, button, hint) {
  $('card-label').textContent = label; $('card-title').textContent = title; $('card-copy').textContent = copy;
  $('play').innerHTML = `${button} <span>→</span>`; $('card-hint').textContent = hint; $('overlay').hidden = false;
}
function start() {
  document.activeElement?.blur();
  game = createGame(); game.phase = 'playing'; paused = false; accumulator = 0; cameraRow = 0; facing = 0;
  for (const view of laneMeshes.values()) scene.remove(view.group); laneMeshes.clear(); syncWorld();
  $('overlay').hidden = true; $('score').textContent = '0'; $('pause').disabled = false;
  $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Tạm dừng');
  $('tip').textContent = 'Nhìn xe trước khi nhảy!';
}
function hop(dx, dr) {
  if (paused || game.phase !== 'playing') return;
  if (move(game, dx, dr)) {
    facing = Math.atan2(-dx, dr); tone(520);
    $('tip').textContent = game.score < 3 ? 'Nhìn xe trước khi nhảy!' : 'Tiến lên — mỗi hàng mới thêm một điểm.';
  }
}
function togglePause() {
  if (game.phase !== 'playing') return;
  document.activeElement?.blur(); paused = !paused; accumulator = 0;
  $('pause').textContent = paused ? '▶' : 'Ⅱ'; $('pause').setAttribute('aria-label', paused ? 'Tiếp tục' : 'Tạm dừng');
  if (paused) card('DỪNG LẠI MỘT CHÚT', 'Không cần vội.', 'Xe cũng tạm dừng. Tiếp tục khi bạn sẵn sàng.', 'Tiếp tục đi', 'P / NÚT TIẾP TỤC ĐỂ CHƠI TIẾP');
  else $('overlay').hidden = true;
}
function endRun() {
  tone(120, .3); const record = game.score > best; best = Math.max(best, game.score);
  try { localStorage.setItem('crossy-sky-best', String(best)); } catch {}
  $('best').textContent = String(best).padStart(2, '0'); $('pause').disabled = true;
  $('flash').classList.remove('hit'); void $('flash').offsetWidth; $('flash').classList.add('hit');
  $('tip').textContent = 'Lần sau, nhìn cả hai bên nhé.';
  card(record ? 'KỶ LỤC MỚI!' : 'THỬ THÊM MỘT CHUYẾN?', 'Ối, gặp xe rồi!', `Bạn đi được ${game.score} hàng. Kỷ lục: ${best}.`, 'Đi lần nữa', 'ENTER / NÚT ĐI LẦN NỮA ĐỂ CHƠI LẠI');
}
$('play').addEventListener('click', () => paused ? togglePause() : start());
$('pause').addEventListener('click', togglePause);
$('sound').addEventListener('click', () => {
  $('sound').blur(); muted = !muted;
  $('sound').querySelector('span').textContent = `Âm thanh: ${muted ? 'tắt' : 'bật'}`;
  $('sound').setAttribute('aria-pressed', String(!muted)); $('sound').setAttribute('aria-label', muted ? 'Bật âm thanh' : 'Tắt âm thanh'); tone(850);
});
const directions = { ArrowUp:[0,1], KeyW:[0,1], ArrowDown:[0,-1], KeyS:[0,-1], ArrowLeft:[-1,0], KeyA:[-1,0], ArrowRight:[1,0], KeyD:[1,0], Space:[0,1] };
window.addEventListener('keydown', event => {
  if (event.target.closest('button, a, input')) return;
  if (directions[event.code]) {
    event.preventDefault(); if (game.phase === 'ready') start(); else hop(...directions[event.code]);
  }
  if (!event.repeat && (event.code === 'KeyP' || event.code === 'Escape')) togglePause();
  if (!event.repeat && event.code === 'Enter' && game.phase === 'over') start();
});
document.querySelectorAll('.dpad button').forEach(button => button.addEventListener('click', () => {
  button.blur(); hop(Number(button.dataset.dx), Number(button.dataset.dr));
}));
let pointer;
$('world').addEventListener('pointerdown', event => {
  event.preventDefault(); pointer = { id:event.pointerId, x:event.clientX, y:event.clientY };
  $('world').setPointerCapture(event.pointerId);
});
$('world').addEventListener('pointerup', event => {
  if (!pointer || event.pointerId !== pointer.id) return;
  const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y; pointer = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) hop(0, 1);
  else if (Math.abs(dx) > Math.abs(dy)) hop(Math.sign(dx), 0);
  else hop(0, -Math.sign(dy));
});
$('world').addEventListener('pointercancel', () => { pointer = null; });
document.addEventListener('visibilitychange', () => { if (document.hidden && !paused && game.phase === 'playing') togglePause(); last = 0; });
new ResizeObserver(() => {
  const width = $('world').clientWidth, height = $('world').clientHeight;
  renderer.setSize(width, height);
  const halfWidth = width < height ? 6.4 : 8.5;
  camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfWidth * height / width; camera.bottom = -camera.top;
  camera.updateProjectionMatrix();
}).observe($('world'));
syncWorld();
renderer.setAnimationLoop(time => {
  const dt = last ? Math.min((time - last) / 1000, .05) : 0; last = time;
  const before = game.phase, previousScore = game.score;
  if (!paused && game.phase === 'playing') {
    accumulator += dt;
    while (accumulator >= 1 / 120) { step(game, 1 / 120); accumulator -= 1 / 120; }
  }
  if (before === 'playing' && game.phase === 'over') endRun();
  if (game.score !== previousScore) $('score').textContent = game.score;
  syncWorld(); const p = position(game);
  chicken.position.set(p.x, p.height, -p.row); chicken.rotation.y = facing;
  chicken.rotation.z = game.phase === 'over' ? -Math.PI / 2 : 0;
  wings.forEach((wing, i) => { wing.rotation.z = game.hop ? Math.sin(p.height * 4) * (i ? -.5 : .5) : 0; });
  marker.position.set(p.x, .025, -p.row); marker.visible = game.phase !== 'over';
  cameraRow += (game.score - cameraRow) * (1 - Math.exp(-dt * 6));
  const focus = -cameraRow - 2.5;
  camera.position.set(8, 11, focus + 12); camera.lookAt(0, 0, focus);
  sun.position.set(-6, 14, focus + 8); sun.target.position.set(0, 0, focus);
  renderer.render(scene, camera);
});
