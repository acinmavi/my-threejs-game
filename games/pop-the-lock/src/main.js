import { staticPairs } from './translations.js';
import { t, setupLanguageUI } from '../../../src/i18n.js';
import * as THREE from 'three';
import './style.css';
import { createGame, step, tap, MODES } from './game.js';
import { setupGameExit } from '../../../src/exit-dialog.js';
const $ = id => document.getElementById(id);
let selectedMode = 'normal';
try { const saved = localStorage.getItem('pop-lock-mode'); if (MODES[saved]) selectedMode = saved; } catch {}
$('mode').value = selectedMode;
let selectedStyle = 'endless';
let game = createGame(1, Math.random, { mode: selectedMode }), paused = false, best = 0, muted = true, audio, last = 0;
function recordKey() { return selectedStyle === 'endless' ? 'pop-lock-endless-best' : 'pop-lock-best'; }
function loadBest() {
  best = 0; try { best = Number(localStorage.getItem(recordKey())) || 0; } catch {}
  $('best').textContent = String(best).padStart(2, '0');
  $('record-label').textContent = selectedStyle === 'endless' ? t("ENDLESS BEST", "KỶ LỤC ENDLESS") : t("HIGHEST LEVEL CLEARED", "MÀN CAO NHẤT ĐÃ QUA");
}
loadBest();
const scene = new THREE.Scene(); scene.background = new THREE.Color('#203e3b');
const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, .1, 30); camera.position.set(0, 0, 12);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); $('world').appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight('#fff5d3', 2)); const light = new THREE.DirectionalLight('#ffffff', 3); light.position.set(-4, 5, 6); scene.add(light);
const lock = new THREE.Group(); lock.position.y = .45; scene.add(lock);
const material = (color, metalness = .1) => new THREE.MeshStandardMaterial({ color, metalness, roughness: .45 });
const ring = new THREE.Mesh(new THREE.TorusGeometry(2, .13, 12, 96), material('#e5c071', .5)); lock.add(ring);
const halo = new THREE.Mesh(new THREE.TorusGeometry(2.28, .012, 6, 96), material('#5c8271')); lock.add(halo);
for (let i = 0; i < 48; i++) {
  const angle = i / 48 * Math.PI * 2, tick = new THREE.Mesh(new THREE.BoxGeometry(.018, i % 4 ? .07 : .14, .02), material('#6a8a76'));
  tick.position.set(Math.sin(angle) * 2.48, Math.cos(angle) * 2.48, 0); tick.rotation.z = -angle; lock.add(tick);
}
const shackle = new THREE.Mesh(new THREE.TorusGeometry(.65, .1, 10, 48, Math.PI), material('#547866')); shackle.position.set(0, .77, -.2); lock.add(shackle);
const plate = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.45, .25), material('#34584c')); plate.position.set(0, -.15, -.2); lock.add(plate);
const targetGroup = new THREE.Group(); lock.add(targetGroup);
const target = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 16), material('#bcde98')); targetGroup.add(target);
const needle = new THREE.Mesh(new THREE.BoxGeometry(.10, .6, .2), material('#fff2ac', .3)); lock.add(needle);
let zone;
function refreshZone() {
  if (zone) { lock.remove(zone); zone.geometry.dispose(); zone.material.dispose(); }
  zone = new THREE.Mesh(new THREE.TorusGeometry(2, .19, 10, 30, game.tolerance * 2), material('#729e65'));
  lock.add(zone);
}
refreshZone();
function tone(frequency) {
  if (muted) return;
  try {
    audio ??= new AudioContext(); audio.resume();
    const osc = audio.createOscillator(), gain = audio.createGain(); osc.frequency.value = frequency;
    gain.gain.setValueAtTime(.04, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .12);
    osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + .12);
  } catch {}
}
function card(label, title, copy, button) {
  $('card-label').textContent = label; $('card-title').textContent = title; $('card-copy').textContent = copy;
  $('mode-picker').hidden = game.phase === 'playing';
  $('style-picker').hidden = game.phase === 'playing';
  $('play').textContent = button; $('overlay').hidden = false; $('tap').disabled = true;
}
function start() {
  const level = selectedStyle === 'endless' ? 1 : game.phase === 'won' ? game.level + 1 : game.phase === 'over' ? game.level : 1;
  const elapsed = game.phase === 'won' ? game.elapsed : 0;
  game = createGame(level, Math.random, { mode: selectedMode, elapsed, style: selectedStyle }); game.phase = 'playing'; paused = false; last = 0;
  refreshZone(); $('overlay').hidden = true; $('tap').disabled = false; $('pause').disabled = false;
  $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', t("Pause", "Tạm dừng"));
  $('tip').textContent = t("Tap when the needle is in the green zone. Each hit reverses direction.", "Bấm khi kim nằm trong vùng xanh. Mỗi lần trúng sẽ đổi chiều.");
  document.activeElement?.blur();
}
function finish() {
  $('pause').disabled = true; $('tap').disabled = true;
  if (game.style === 'endless') {
    best = Math.max(best, game.hits); try { localStorage.setItem(recordKey(), String(best)); } catch {}
    $('best').textContent = String(best).padStart(2, '0'); tone(160);
    card(t("ENDLESS · MISSED THE BEAT", "ENDLESS · LỆCH MỘT NHỊP"), t("Try to beat your record.", "Thử phá kỷ lục nhé."), t(`You scored ${game.hits} hits in ${game.elapsed.toFixed(1)} seconds. Best: ${best} hits.`, `Bạn trúng ${game.hits} lần trong ${game.elapsed.toFixed(1)} giây. Kỷ lục: ${best} lần trúng.`), t("Play Endless again →", "Chơi lại Endless →"));
  } else if (game.phase === 'won') {
    best = Math.max(best, game.level); try { localStorage.setItem('pop-lock-best', String(best)); } catch {}
    $('best').textContent = String(best).padStart(2, '0'); tone(880);
    card(t("LOCK OPENED", "MỞ KHÓA THÀNH CÔNG"), t("Right on beat!", "Đúng nhịp rồi!"), t(`Level ${game.level} cleared. Next level needs ${game.level + 1} hits, with a faster needle and a narrower green zone.`, `Đã qua màn ${game.level}. Màn tiếp theo cần ${game.level + 1} lần trúng, kim nhanh hơn và vùng xanh hẹp hơn.`), t(`Level ${game.level + 1} →`, `Màn ${game.level + 1} →`));
  } else {
    tone(160); card(t("MISSED THE BEAT", "LỆCH MỘT NHỊP"), t("Try again.", "Thử lại nhé."), t(`Level ${game.level}: you hit ${game.hits}/${game.level} targets. Tapping early or passing the target closes the lock.`, `Màn ${game.level}: bạn trúng ${game.hits}/${game.level} lần. Bấm sớm hoặc để kim đi quá đều làm khóa đóng lại.`), t(`Retry level ${game.level} →`, `Thử lại màn ${game.level} →`));
  }
}
function attempt() { if (paused || game.phase !== 'playing') return; if (tap(game)) tone(520); if (game.phase !== 'playing') finish(); }
function togglePause() {
  if (game.phase !== 'playing') return;
  paused = !paused; last = 0; $('pause').textContent = paused ? '▶' : 'Ⅱ'; $('pause').setAttribute('aria-label', paused ? t("Resume", "Tiếp tục") : t("Pause", "Tạm dừng"));
  if (paused) card(t("TAKE A BEAT", "DỪNG MỘT NHỊP"), t("The lock can wait.", "Khóa cũng chờ bạn."), t("The needle has stopped. Resume when ready.", "Kim đã dừng. Tiếp tục khi bạn sẵn sàng."), t("Resume →", "Tiếp tục →"));
  else { $('overlay').hidden = true; $('tap').disabled = false; }
  document.activeElement?.blur();
}
const modeDescriptions = { easy: t("Slow acceleration: +0.075 rad/s every 10 seconds of play.", "Tăng chậm: +0.075 rad/s mỗi 10 giây chơi."), normal: t("Moderate acceleration: +0.20 rad/s every 10 seconds of play.", "Tăng vừa: +0.20 rad/s mỗi 10 giây chơi."), hard: t("Fast acceleration: +0.40 rad/s every 10 seconds of play.", "Tăng nhanh: +0.40 rad/s mỗi 10 giây chơi."), extreme: t("Extreme: +0.80 rad/s every 10 seconds of play.", "Siêu khó: +0.80 rad/s mỗi 10 giây chơi.") };
function updateSettings() {
  selectedMode = $('mode').value; selectedStyle = $('style').value; loadBest();
  $('mode-description').textContent = modeDescriptions[selectedMode];
  try { localStorage.setItem('pop-lock-mode', selectedMode); } catch {}
  game = createGame(1, Math.random, { mode: selectedMode, style: selectedStyle }); refreshZone();
  const endless = selectedStyle === 'endless';
  $('tip').textContent = endless ? t("Endless: each hit adds one point.", "Endless: mỗi lần trúng thêm một điểm.") : t("Level N needs N consecutive hits.", "Màn N cần N lần trúng liên tiếp.");
  card(endless ? t("ENDLESS CHALLENGE", "THỬ THÁCH KHÔNG GIỚI HẠN") : t("OPEN YOUR FIRST LOCK", "MỞ KHÓA ĐẦU TIÊN"), t("Hit the beat.", "Bắt đúng nhịp."), endless ? t("Tap when the gold needle is in the green zone. Hits reverse direction and add points. Keep going until you mistime or miss a tap!", "Bấm khi kim vàng nằm trong vùng xanh. Trúng đổi chiều và cộng điểm. Chơi liên tục tới khi bấm sai hoặc bỏ lỡ!") : t("Each level needs more hits. Clearing a level keeps acceleration time; retrying resets it to zero.", "Mỗi màn cần số lần trúng tăng dần. Qua màn giữ thời gian tăng tốc; thử lại đặt thời gian về 0."), t("Start →", "Bắt đầu →"));
}
$('mode').addEventListener('change', updateSettings);
$('style').addEventListener('change', updateSettings);
$('mode-description').textContent = modeDescriptions[selectedMode];
$('play').addEventListener('click', () => paused ? togglePause() : start());
$('tap').addEventListener('pointerdown', event => { event.preventDefault(); attempt(); });
$('tap').addEventListener('click', event => { if (event.detail === 0) attempt(); });
renderer.domElement.addEventListener('pointerdown', event => { event.preventDefault(); attempt(); });
$('pause').addEventListener('click', togglePause);
$('sound').addEventListener('click', () => { muted = !muted; $('sound').textContent = muted ? t("♪ Sound: off", "♪ Âm thanh: tắt") : t("♪ Sound: on", "♪ Âm thanh: bật"); $('sound').setAttribute('aria-pressed', String(!muted)); $('sound').setAttribute('aria-label', muted ? t("Enable sound", "Bật âm thanh") : t("Mute sound", "Tắt âm thanh")); tone(520); });
window.addEventListener('keydown', event => {
  if (event.repeat || event.target.closest('button, a, input, select')) return;
  if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); if (paused) togglePause(); else if (game.phase === 'playing') attempt(); else start(); }
  if (event.code === 'KeyP') togglePause();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && game.phase === 'playing' && !paused) togglePause(); last = 0; });
function resize() { const width = $('world').clientWidth, height = $('world').clientHeight; renderer.setSize(width, height, false); const halfHeight = Math.max(3.2, 2.8 * height / width); camera.left = -halfHeight * width / height; camera.right = -camera.left; camera.top = halfHeight; camera.bottom = -halfHeight; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe($('world')); resize();
function frame(now) {
  const dt = last ? Math.min((now - last) / 1000, .1) : 0; last = now;
  if (!paused && game.phase === 'playing') { step(game, dt); if (game.phase === 'over') finish(); }
  needle.position.set(Math.sin(game.angle) * 2, Math.cos(game.angle) * 2, .2); needle.rotation.z = -game.angle;
  target.position.set(Math.sin(game.target) * 2, Math.cos(game.target) * 2, .2);
  zone.rotation.z = Math.PI / 2 - game.target - game.tolerance;
  $('remaining').textContent = game.style === 'endless' ? game.hits : game.level - game.hits;
  $('counter-label').textContent = game.style === 'endless' ? t("HITS", "LẦN TRÚNG") : t("HITS TO GO", "LẦN CẦN BẤM");
  $('level').textContent = game.style === 'endless' ? 'ENDLESS' : t(`LEVEL ${String(game.level).padStart(2, '0')}`, `MÀN ${String(game.level).padStart(2, '0')}`); $('speed').textContent = `${MODES[game.mode].label.toUpperCase()} · ${game.speed.toFixed(2)} RAD/S · ${Math.floor(game.elapsed)}s`;
  renderer.render(scene, camera); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setupGameExit({ isPlaying: () => game.phase === 'playing', isPaused: () => paused, togglePause });

setupLanguageUI(staticPairs);
