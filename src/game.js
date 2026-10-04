export const HOP_TIME = .18;
export function difficulty(row) {
  const distance = Math.min(Math.max(row, 0), 240);
  return { roadWidth: Math.min(5, 2 + Math.floor(distance / 48)),
    speedMultiplier: 1 + distance / 240 * 1.5, level: 1 + Math.floor(distance / 48) };
}
export function trainState(lane, time) {
  const phase = (time + lane.trainOffset) % 12;
  return { warning: phase >= 7 && phase < 9, active: phase >= 9 && phase < 10.6,
    x: lane.direction * (-18 + (phase - 9) / 1.6 * 36) };
}
const colors = ['#ee735c', '#f2c568', '#83bed0', '#e8ead5', '#a99acf'];
const seed = (row, salt = 0) => {
  const n = Math.sin(row * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function laneAt(row) {
  const part = row % 24;
  const level = difficulty(row);
  const roadPart = (part >= 3 && part < 3 + level.roadWidth) ||
    (part >= 19 && part < 19 + level.roadWidth) || [13, 14].includes(part) || (part === 6 && level.roadWidth === 2);
  const type = row < 3 ? 'grass' : [9, 10].includes(part) ? 'river' : part === 16 ? 'train' : roadPart ? 'road' : 'grass';
  const road = type === 'road';
  const speed = road ? (.95 + seed(part, 1) * 1.1) * level.speedMultiplier : type === 'river' ? .8 + seed(row, 3) * .45 : 0;
  const period = road ? 26 * Math.max(1, speed / 3.4) : 26;
  const blocked = new Set();
  if (type === 'grass' && row > 1) {
    for (let x = -4; x <= 4; x++) if (x !== 0 && seed(row, x + 8) > .85) blocked.add(x);
  }
  return {
    row, type, blocked,
    direction: row % 2 ? 1 : -1,
    speed, period,
    trainOffset: seed(row, 4) * 4,
    logs: type === 'river' ? Array.from({ length: 3 }, (_, i) => ({ offset: seed(row, 7) * 26 + i * 26 / 3, length: 4.5 })) : [],
    cars: road ? Array.from({ length: 2 }, (_, i) => ({
      offset: seed(row, 2) * period + i * period / 2,
      length: seed(row, i + 3) > .7 ? 2.25 : 1.5,
      color: colors[Math.floor(seed(row, i + 5) * colors.length)],
    })) : [],
  };
}
function ensureLanes(game) {
  for (let row = Math.max(-3, game.score - 9); row <= game.score + 20; row++) {
    if (!game.lanes.has(row)) game.lanes.set(row, laneAt(row));
  }
  for (const row of game.lanes.keys()) if (row < game.score - 9) game.lanes.delete(row);
}
export function createGame() {
  const game = { phase: 'ready', x: 0, row: 0, score: 0, time: 0, hop: null, lanes: new Map(), cameraRow: 0, reason: null };
  ensureLanes(game); return game;
}
export function move(game, dx, dr) {
  if (game.phase !== 'playing' || game.hop || Math.abs(dx) + Math.abs(dr) !== 1) return false;
  const x = Math.round(game.x) + dx, row = game.row + dr;
  if (x < -4 || x > 4 || row < Math.max(0, game.score - 6) || game.lanes.get(row)?.blocked.has(x)) return false;
  game.hop = { fromX: game.x, fromRow: game.row, toX: x, toRow: row, elapsed: 0 };
  return true;
}
export function position(game) {
  if (!game.hop) return { x: game.x, row: game.row, height: 0 };
  const hop = game.hop, t = Math.min(hop.elapsed / HOP_TIME, 1);
  return { x: hop.fromX + (hop.toX - hop.fromX) * t,
    row: hop.fromRow + (hop.toRow - hop.fromRow) * t, height: Math.sin(t * Math.PI) * .48 };
}
export function carX(lane, car, time) {
  const period = lane.period ?? 26;
  return ((car.offset + lane.direction * lane.speed * time) % period + period) % period - period / 2;
}
export function step(game, dt) {
  if (game.phase !== 'playing') return;
  game.time += dt;
  ensureLanes(game);
  game.cameraRow = Math.max(game.score, game.cameraRow + (game.time > 8 ? (.2 + Math.min(.1, game.score * .001)) * dt : 0));
  if (!game.hop && game.lanes.get(game.row)?.type === 'river') {
    const lane = game.lanes.get(game.row);
    game.x += lane.direction * lane.speed * dt;
  }
  if (game.hop) game.hop.elapsed += dt;
  const p = position(game);
  const die = reason => { game.phase = 'over'; game.reason = reason; };
  if (p.row < game.cameraRow - 3.5) { die('camera'); return; }
  if (Math.abs(p.x) > 4.55) { die('water'); return; }
  for (const lane of game.lanes.values()) {
    if (lane.type !== 'road' || Math.abs(lane.row - p.row) > .42) continue;
    for (const car of lane.cars) {
      if (Math.abs(carX(lane, car, game.time) - p.x) < car.length / 2 + .24) {
        die('car'); return;
      }
    }
  }
  for (const lane of game.lanes.values()) {
    if (lane.type !== 'train' || Math.abs(lane.row - p.row) > .42) continue;
    const train = trainState(lane, game.time);
    if (train.active && Math.abs(train.x - p.x) < 4.24) { die('train'); return; }
  }
  if (game.hop?.elapsed >= HOP_TIME) {
    game.x = game.hop.toX; game.row = game.hop.toRow;
    game.score = Math.max(game.score, game.row); game.hop = null;
  }
  if (!game.hop) {
    const lane = game.lanes.get(game.row);
    if (lane?.type === 'river' && !lane.logs.some(log => Math.abs(carX(lane, log, game.time) - game.x) < log.length / 2 - .1)) {
      die('water'); return;
    }
  }
  ensureLanes(game);
}
