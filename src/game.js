export const HOP_TIME = .18;
const colors = ['#ee735c', '#f2c568', '#83bed0', '#e8ead5', '#a99acf'];
const seed = (row, salt = 0) => {
  const n = Math.sin(row * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function laneAt(row) {
  const road = row >= 3 && row % 7 < 4;
  const blocked = new Set();
  if (!road && row > 1) {
    for (let x = -4; x <= 4; x++) if (x !== 0 && seed(row, x + 8) > .85) blocked.add(x);
  }
  return {
    row, type: road ? 'road' : 'grass', blocked,
    direction: row % 2 ? 1 : -1,
    speed: road ? Math.min(4.5, 1.5 + seed(row, 1) * .8 + row * .022) : 0,
    cars: road ? Array.from({ length: 3 }, (_, i) => ({
      offset: seed(row, 2) * 26 + i * 26 / 3,
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
  const game = { phase: 'ready', x: 0, row: 0, score: 0, time: 0, hop: null, lanes: new Map() };
  ensureLanes(game); return game;
}
export function move(game, dx, dr) {
  if (game.phase !== 'playing' || game.hop || Math.abs(dx) + Math.abs(dr) !== 1) return false;
  const x = game.x + dx, row = game.row + dr;
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
  return ((car.offset + lane.direction * lane.speed * time) % 26 + 26) % 26 - 13;
}
export function step(game, dt) {
  if (game.phase !== 'playing') return;
  game.time += dt;
  if (game.hop) game.hop.elapsed += dt;
  const p = position(game);
  for (const lane of game.lanes.values()) {
    if (lane.type !== 'road' || Math.abs(lane.row - p.row) > .42) continue;
    for (const car of lane.cars) {
      if (Math.abs(carX(lane, car, game.time) - p.x) < car.length / 2 + .24) {
        game.phase = 'over'; return;
      }
    }
  }
  if (game.hop?.elapsed >= HOP_TIME) {
    game.x = game.hop.toX; game.row = game.hop.toRow;
    game.score = Math.max(game.score, game.row); game.hop = null;
  }
  ensureLanes(game);
}
