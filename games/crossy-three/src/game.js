export const HOP_TIME = .18;
export const DIFFICULTIES = {
  easy: { label: 'Dễ', startSpeed: 1, maxSpeed: 2.5, widthStep: 48, rampRows: 240, grace: 8, cameraSpeed: .2, cameraMax: .3, gapTime: 3 },
  normal: { label: 'Thường', startSpeed: 1.6, maxSpeed: 3.8, widthStep: 24, rampRows: 120, grace: 5, cameraSpeed: .45, cameraMax: .75, gapTime: 1.35 },
  hard: { label: 'Khó', startSpeed: 2.2, maxSpeed: 5.5, widthStep: 16, rampRows: 96, grace: 3, cameraSpeed: .8, cameraMax: 1.2, gapTime: .8 },
  expert: { label: 'Rất khó', startSpeed: 3, maxSpeed: 7, widthStep: 12, rampRows: 72, grace: 2, cameraSpeed: 1.05, cameraMax: 1.55, gapTime: .6 },
  extreme: { label: 'Siêu khó', startSpeed: 4, maxSpeed: 9, widthStep: 8, rampRows: 48, grace: 1.5, cameraSpeed: 1.3, cameraMax: 1.85, gapTime: .42 },
};
export function difficulty(row, mode = 'normal') {
  const settings = DIFFICULTIES[mode] ?? DIFFICULTIES.normal;
  const distance = Math.min(Math.max(row, 0), settings.rampRows);
  return { roadWidth: Math.min(5, 2 + Math.floor(distance / settings.widthStep)),
    speedMultiplier: settings.startSpeed + distance / settings.rampRows * (settings.maxSpeed - settings.startSpeed),
    level: 1 + Math.floor(distance / settings.widthStep) };
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
function laneAt(row, mode) {
  const part = row % 24;
  const level = difficulty(row, mode);
  const settings = DIFFICULTIES[mode];
  const roadPart = (part >= 3 && part < 3 + level.roadWidth) ||
    (part >= 19 && part < 19 + level.roadWidth) || [13, 14].includes(part) || (part === 6 && level.roadWidth === 2);
  const type = row < 3 ? 'grass' : [9, 10].includes(part) ? 'river' : part === 16 ? 'train' : roadPart ? 'road' : 'grass';
  const road = type === 'road';
  const speed = road ? (.95 + seed(part, 1) * 1.1) * level.speedMultiplier : type === 'river' ? .8 + seed(row, 3) * .45 : 0;
  const period = road ? Math.max(26, 2 * (2.25 + .48 + speed * settings.gapTime)) : 26;
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
    if (!game.lanes.has(row)) game.lanes.set(row, laneAt(row, game.mode));
  }
  for (const row of game.lanes.keys()) if (row < game.score - 9) game.lanes.delete(row);
}
export function createGame(mode = 'normal') {
  if (!DIFFICULTIES[mode]) mode = 'normal';
  const game = { mode, phase: 'ready', x: 0, row: 0, score: 0, time: 0, hop: null, lanes: new Map(), cameraRow: 0, reason: null };
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
  const settings = DIFFICULTIES[game.mode];
  const cameraSpeed = Math.min(settings.cameraMax, settings.cameraSpeed + game.score * .003 + Math.max(0, game.time - settings.grace) * .002);
  game.cameraRow = Math.max(game.score, game.cameraRow + (game.time > settings.grace ? cameraSpeed * dt : 0));
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
