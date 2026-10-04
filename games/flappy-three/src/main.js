import { setupGameExit } from '../../../src/exit-dialog.js';
import * as THREE from 'three';
import './style.css';
import { createGame, flap, step, RULES, difficulty } from './game.js';

const $ = id => document.getElementById(id);
let game = createGame(), paused = false, muted = true, audio, last = 0, accumulator = 0, clock = 0;
let best = 0;
try { best = Number(localStorage.getItem('sky-club-best')) || 0; } catch {}
$('best').textContent = String(best).padStart(2, '0');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b5dfe4');
scene.fog = new THREE.Fog('#b5dfe4', 25, 65);
const camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 100);
camera.position.set(1.6, 0, 18); camera.lookAt(1.6, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$('world').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x698860, 2.4));
const sun = new THREE.DirectionalLight(0xfff3d2, 3);
sun.position.set(-5, 10, 8); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 10, bottom: -10 });
sun.shadow.bias = -0.001; scene.add(sun);
const material = color => new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
const yellow = material('#f7cc62'), cream = material('#fff1bd'), orange = material('#e78b42');
const green = material('#79ac76'), rimGreen = material('#a4cc87');
function mesh(geometry, mat, parent, position = [0, 0, 0]) {
  const m = new THREE.Mesh(geometry, mat); m.position.set(...position);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const sphere = new THREE.SphereGeometry(1, 24, 16);
function blob(parent, mat, position, scale) {
  const m = mesh(sphere, mat, parent, position); m.scale.set(...scale); return m;
}
const bird = new THREE.Group(); scene.add(bird);
blob(bird, yellow, [0, 0, 0], [.4, .33, .3]);
blob(bird, cream, [.12, -.09, .19], [.25, .21, .15]);
const wing = blob(bird, orange, [-.14, -.02, .29], [.22, .13, .06]);
blob(bird, cream, [.18, .12, .25], [.13, .14, .08]);
blob(bird, material('#233e42'), [.23, .13, .315], [.052, .065, .03]);
blob(bird, material('#ffffff'), [.24, .155, .34], [.015, .019, .012]);
const beak = mesh(new THREE.ConeGeometry(.105, .28, 4), orange, bird, [.46, -.015, .08]);
beak.rotation.z = -Math.PI / 2;
const tail = mesh(new THREE.ConeGeometry(.12, .29, 4), orange, bird, [-.43, .02, 0]); tail.rotation.z = Math.PI / 2;
const ground = mesh(new THREE.BoxGeometry(100, .65, 10), material('#8caf74'), scene, [0, -3.525, 0]);
mesh(new THREE.BoxGeometry(100, .09, 10.1), material('#d8dfa1'), scene, [0, -3.21, 0]);
mesh(new THREE.BoxGeometry(100, 1.8, 10), material('#d3bd8b'), scene, [0, -4.72, 0]);
const grass = new THREE.Group(); scene.add(grass);
for (let i = 0; i < 38; i++) {
  mesh(new THREE.ConeGeometry(.06, .22 + (i % 3) * .04, 3), material('#577e59'), grass, [i * .9 - 17, -3.11, 2.4]);
}
const cloudMat = material('#f6faf1');
const clouds = [];
for (let i = 0; i < 12; i++) {
  const group = new THREE.Group();
  group.position.set((i % 6) * 6 - 15, 1.8 + (i % 4) * .7, -6 - Math.floor(i / 6) * 5);
  for (let j = 0; j < 3; j++) blob(group, cloudMat, [(j - 1) * .6, j === 1 ? .2 : 0, 0], [.72, .38 + (j % 2) * .18, .3]);
  scene.add(group); clouds.push(group);
}
for (let i = 0; i < 15; i++) {
  blob(scene, material(i % 2 ? '#a0c49a' : '#8fb993'), [i * 3 - 21, -3.3, -8 - (i % 3)], [2.8, 1.3 + (i % 4) * .45, 1.5]);
}
blob(scene, material('#fff0bf'), [9, 2.9, -15], [1, 1, .3]);
const pipeMeshes = new Map();
function makePipe(pipe) {
  const group = new THREE.Group();
  const bottom = pipe.gapY - pipe.gap / 2, top = pipe.gapY + pipe.gap / 2;
  const lowerHeight = bottom - RULES.floor, upperHeight = 5.6 - top;
  mesh(new THREE.CylinderGeometry(.49, .49, lowerHeight, 32), green, group, [0, RULES.floor + lowerHeight / 2, 0]);
  mesh(new THREE.CylinderGeometry(.58, .58, .25, 32), rimGreen, group, [0, bottom - .125, 0]);
  mesh(new THREE.CylinderGeometry(.49, .49, upperHeight, 32), green, group, [0, top + upperHeight / 2, 0]);
  mesh(new THREE.CylinderGeometry(.58, .58, .25, 32), rimGreen, group, [0, top + .125, 0]);
  scene.add(group); return group;
}
function syncPipes() {
  for (const [pipe, group] of pipeMeshes) {
    if (!game.pipes.includes(pipe)) {
      scene.remove(group); group.children.forEach(m => m.geometry.dispose()); pipeMeshes.delete(pipe);
    }
  }
  for (const pipe of game.pipes) {
    if (!pipeMeshes.has(pipe)) pipeMeshes.set(pipe, makePipe(pipe));
    pipeMeshes.get(pipe).position.x = pipe.x;
  }
}
function tone(frequency, duration = .08, type = 'sine') {
  if (muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * .55, audio.currentTime + duration);
    gain.gain.setValueAtTime(.07, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + duration);
  } catch {}
}
function card(label, title, copy, button, hint) {
  $('card-label').textContent = label; $('card-title').textContent = title;
  $('card-copy').textContent = copy; $('play').innerHTML = `${button} <span>→</span>`;
  $('card-hint').textContent = hint; $('overlay').hidden = false;
}
function start() {
  document.activeElement?.blur();
  game = createGame(); paused = false; accumulator = 0; syncPipes();
  $('score').textContent = '0'; $('overlay').hidden = true; $('pause').disabled = false;
  $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', 'Tạm dừng');
  flap(game); tone(650);
}
function action() {
  if (paused) { togglePause(); return; }
  if (game.phase === 'ready') start();
  else if (game.phase === 'playing') { flap(game); tone(650); }
}
function togglePause() {
  if (game.phase !== 'playing') return;
  document.activeElement?.blur();
  paused = !paused; accumulator = 0;
  $('pause').textContent = paused ? '▶' : 'Ⅱ';
  $('pause').setAttribute('aria-label', paused ? 'Tiếp tục' : 'Tạm dừng');
  if (paused) card('NGHỈ MỘT NHỊP', 'Bầu trời vẫn đợi.', 'Chuyến bay sẽ tiếp tục ngay khi bạn sẵn sàng.', 'Tiếp tục bay', 'P / SPACE ĐỂ TIẾP TỤC');
  else $('overlay').hidden = true;
}
function endRun() {
  tone(180, .25, 'triangle');
  const newBest = game.score > best; best = Math.max(best, game.score);
  try { localStorage.setItem('sky-club-best', String(best)); } catch {}
  $('best').textContent = String(best).padStart(2, '0'); $('pause').disabled = true;
  $('flash').classList.remove('hit'); void $('flash').offsetWidth; $('flash').classList.add('hit');
  card(newBest ? 'KỶ LỤC MỚI!' : 'THÊM MỘT CHUYẾN BAY?', 'Hạ cánh rồi!', `Bạn vượt qua ${game.score} ống. Kỷ lục: ${best}. Thử bay xa hơn nhé.`, 'Bay lần nữa', 'ENTER / NÚT BAY LẦN NỮA ĐỂ CHƠI LẠI');
}
$('play').addEventListener('click', () => paused ? togglePause() : start());
$('world').addEventListener('pointerdown', event => { event.preventDefault(); action(); });
$('pause').addEventListener('click', togglePause);
$('sound').addEventListener('click', () => {
  $('sound').blur();
  muted = !muted; $('sound').querySelector('span').textContent = `Âm thanh: ${muted ? 'tắt' : 'bật'}`;
  $('sound').setAttribute('aria-pressed', String(!muted));
  $('sound').setAttribute('aria-label', muted ? 'Bật âm thanh' : 'Tắt âm thanh'); tone(750);
});
window.addEventListener('keydown', event => {
  if (event.repeat || event.target.closest('button, a, input')) return;
  if (event.code === 'Space' || event.code === 'ArrowUp') { event.preventDefault(); action(); }
  if (event.code === 'KeyP') togglePause();
  if (event.code === 'Enter' && game.phase === 'over') start();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && !paused && game.phase === 'playing') togglePause(); last = 0; });
new ResizeObserver(() => {
  const width = $('world').clientWidth, height = $('world').clientHeight;
  renderer.setSize(width, height); const halfHeight = 4.5, halfWidth = halfHeight * width / height;
  camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfHeight; camera.bottom = -halfHeight;
  camera.position.x = width < height ? .8 : 1.6; camera.lookAt(camera.position.x, 0, 0); camera.updateProjectionMatrix();
}).observe($('world'));
renderer.setAnimationLoop(time => {
  const dt = last ? Math.min((time - last) / 1000, .05) : 0; last = time;
  if (!paused) clock += dt;
  const before = game.phase, scoreBefore = game.score;
  if (!paused) {
    accumulator += dt;
    while (accumulator >= 1 / 120) { step(game, 1 / 120); accumulator -= 1 / 120; }
  }
  if (before === 'playing' && game.phase === 'over') endRun();
  if (game.score !== scoreBefore) { $('score').textContent = game.score; tone(1000, .12); }
  syncPipes();
  $('pace').textContent = `${(difficulty(game.elapsed).speed / RULES.speed).toFixed(2)}×`;
  bird.position.y = game.phase === 'ready' ? Math.sin(clock * 2.5) * .14 : game.y;
  bird.rotation.z = game.phase === 'ready' ? .07 : Math.max(-.75, Math.min(.35, game.velocity * .065));
  wing.rotation.x = Math.sin(clock * 22) * .65;
  if (game.phase !== 'over' && !paused) {
    for (const cloud of clouds) { cloud.position.x -= dt * .12; if (cloud.position.x < -20) cloud.position.x = 20; }
    grass.position.x = -(game.distance % .9);
  }
  renderer.render(scene, camera);
});

setupGameExit({ isPlaying: () => game.phase === 'playing', isPaused: () => paused, togglePause });
