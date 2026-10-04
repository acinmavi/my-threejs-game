const TAU = Math.PI * 2;
export function createGame(level = 1, random = Math.random) {
  level = Math.max(1, Math.floor(level));
  const game = { level, phase: 'ready', angle: 0, direction: 1, hits: 0, progress: 0,
    speed: Math.min(5.5, 1.8 + (level - 1) * .2), tolerance: Math.max(.075, .17 - (level - 1) * .004), random };
  nextTarget(game); return game;
}
function nextTarget(game) {
  game.progress = 0;
  game.distance = .85 + game.random() * 1.8;
  game.target = (game.angle + game.direction * game.distance + TAU) % TAU;
}
export function step(game, dt) {
  if (game.phase !== 'playing' || dt <= 0) return;
  const travel = game.speed * dt;
  game.progress += travel;
  game.angle = ((game.angle + game.direction * travel) % TAU + TAU) % TAU;
  if (game.progress > game.distance + game.tolerance) game.phase = 'over';
}
export function tap(game) {
  if (game.phase !== 'playing') return false;
  if (Math.abs(game.progress - game.distance) > game.tolerance) { game.phase = 'over'; return false; }
  game.hits++;
  if (game.hits === game.level) game.phase = 'won';
  else { game.direction *= -1; nextTarget(game); }
  return true;
}
