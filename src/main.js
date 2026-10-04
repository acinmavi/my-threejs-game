import * as THREE from 'three';
import './style.css';
import { createGame, move, step, position, carX, trainState, difficulty } from './game.js';

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
const deadline = box(scene, '#d48062', [26, .015, .05], [0, .032, 3.5]);
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
  const vehicles = [], logs = [], signals = [];
  let train;
  if (lane.type === 'road') {
    box(group, '#68726a', [44, .15, .98], [0, -.09, 0]);
    for (let x = -12; x < 13; x += 1.5) box(group, '#c0c5aa', [.55, .012, .025], [x, -.009, -.44]);
    for (const car of lane.cars) { const vehicle = carModel(car, lane.direction); group.add(vehicle); vehicles.push(vehicle); }
  } else if (lane.type === 'river') {
    box(group, '#65a6b0', [44, .13, .98], [0, -.14, 0]);
    for (let x = -12; x < 13; x += 1.2) box(group, '#9fc9c4', [.35, .008, .025], [x, -.07, (x % 2) * .1]);
    for (const log of lane.logs) {
      const raft = new THREE.Group();
      box(raft, '#a98355', [log.length, .22, .7], [0, .025, 0]);
      box(raft, '#c5a26e', [log.length - .08, .015, .05], [0, .142, -.18]);
      box(raft, '#c5a26e', [log.length - .08, .015, .05], [0, .142, .18]);
      group.add(raft); logs.push(raft);
    }
  } else if (lane.type === 'train') {
    box(group, '#a6a18d', [44, .13, .98], [0, -.085, 0]);
    for (let x = -12; x <= 12; x += .65) box(group, '#806b56', [.15, .045, .8], [x, -.01, 0]);
    for (const z of [-.28, .28]) box(group, '#d1d2c2', [44, .07, .06], [0, .025, z]);
    for (const x of [-4.8, 4.8]) {
      box(group, '#535f50', [.09, 1.1, .09], [x, .55, .37]);
      box(group, '#39493e', [.35, .3, .14], [x, 1.13, .37]);
      signals.push(box(group, '#bbbd82', [.2, .15, .03], [x, 1.13, .46]));
    }
    train = new THREE.Group(); train.scale.x = lane.direction;
    for (const x of [-2.6, 0, 2.6]) {
      box(train, '#bd594b', [2.45, .75, .7], [x, .48, 0]);
      box(train, '#ead3a0', [2.4, .14, .72], [x, .9, 0]);
      for (const offset of [-.7, 0, .7]) box(train, '#475f62', [.4, .22, .025], [x + offset, .62, .367]);
      box(train, '#3e4b42', [2, .12, .78], [x, .14, 0]);
    }
    box(train, '#f9e3a2', [.05, .14, .42], [3.85, .45, 0]);
    group.add(train);
  } else {
    box(group, lane.row % 2 ? '#96b476' : '#9dbb7e', [44, .18, .98], [0, -.09, 0]);
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
  scene.add(group); return { group, vehicles, logs, train, signals, warned: false };
}
function syncWorld() {
  for (const [row, view] of laneMeshes) if (!game.lanes.has(row)) { scene.remove(view.group); laneMeshes.delete(row); }
  for (const [row, lane] of game.lanes) {
    if (!laneMeshes.has(row)) laneMeshes.set(row, makeLane(lane));
    const view = laneMeshes.get(row);
    lane.cars.forEach((car, i) => { view.vehicles[i].position.x = carX(lane, car, game.time); });
    lane.logs.forEach((log, i) => { view.logs[i].position.x = carX(lane, log, game.time); });
    if (view.train) {
      const state = trainState(lane, game.time);
      view.train.visible = state.active; view.train.position.x = state.x;
      view.signals.forEach(signal => { signal.material = mat((state.warning || state.active) && Math.floor(game.time * 5) % 2 ? '#f65e42' : '#e2c784'); });
      if (state.warning && !view.warned && game.phase === 'playing' && Math.abs(lane.row - game.row) < 5) tone(220, .3);
      view.warned = state.warning;
    }
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
  const messages = { car: ['Ối, gặp xe rồi!', 'Nhìn hai bên trước khi qua đường nhé.'], water: ['Tõm! Rơi xuống sông.', 'Nhảy lên khúc gỗ và đừng trôi ra ngoài bờ.'], train: ['Tàu chạy qua rồi!', 'Đèn đỏ báo tàu tới — đợi tàu đi qua nhé.'], camera: ['Bạn bị bỏ lại rồi!', 'Camera kéo dần. Đừng đứng yên quá lâu nhé.'] };
  const [title, advice] = messages[game.reason] ?? messages.car;
  $('tip').textContent = advice;
  card(record ? 'KỶ LỤC MỚI!' : 'THỬ THÊM MỘT CHUYẾN?', title, `Bạn đi được ${game.score} hàng. ${advice}`, 'Đi lần nữa', 'ENTER / NÚT ĐI LẦN NỮA ĐỂ CHƠI LẠI');
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
  const onRiver = game.lanes.get(Math.round(p.row))?.type === 'river';
  chicken.position.set(p.x, p.height + (onRiver ? .14 : 0), -p.row); chicken.rotation.y = facing;
  chicken.rotation.z = game.phase === 'over' ? -Math.PI / 2 : 0;
  wings.forEach((wing, i) => { wing.rotation.z = game.hop ? Math.sin(p.height * 4) * (i ? -.5 : .5) : 0; });
  marker.position.set(p.x, onRiver ? .15 : .025, -p.row); marker.visible = game.phase !== 'over';
  deadline.position.z = -(game.cameraRow - 3.5);
  deadline.visible = game.phase === 'playing' && game.time > 8;
  if (!paused) cameraRow += (game.cameraRow - cameraRow) * (1 - Math.exp(-dt * 6));
  const lag = game.cameraRow - p.row;
  const level = difficulty(game.score);
  $('difficulty').textContent = `CẤP ${level.level} · ĐƯỜNG ${level.roadWidth} LÀN · XE ${level.speedMultiplier.toFixed(2)}×`;
  $('pressure').textContent = game.time < 8 ? `CHUẨN BỊ: ${Math.ceil(8 - game.time)} GIÂY` : lag > 2.2 ? '⚠ TIẾN LÊN — SẮP BỊ BỎ LẠI' : '↑ CAMERA ĐANG KÉO';
  $('pressure').classList.toggle('urgent', lag > 2.2);
  if (game.phase === 'playing' && !paused) {
    const nearbyTrain = [...game.lanes.values()].find(lane => lane.type === 'train' && lane.row >= p.row && lane.row - p.row < 4 && (trainState(lane, game.time).warning || trainState(lane, game.time).active));
    $('tip').textContent = lag > 2.2 ? 'Tiến lên! Vạch đỏ sắp tới rồi.' : nearbyTrain ? '⚠ Tàu sắp tới — đợi ở bãi cỏ!' : onRiver ? 'Khúc gỗ đang trôi — đừng ra khỏi bờ!' : 'Né xe · Nhảy lên gỗ · Chú ý đèn tàu';
  }
  const focus = -cameraRow - 2.5;
  camera.position.set(8, 11, focus + 12); camera.lookAt(0, 0, focus);
  sun.position.set(-6, 14, focus + 8); sun.target.position.set(0, 0, focus);
  renderer.render(scene, camera);
});
