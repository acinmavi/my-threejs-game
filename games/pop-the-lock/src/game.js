import { t } from '../../../src/i18n.js';
const TAU = Math.PI * 2;
export const MODES = {
  easy: { label: t("Easy", "Dễ"), acceleration: .0075 },
  normal: { label: t("Normal", "Thường"), acceleration: .02 },
  hard: { label: t("Hard", "Khó"), acceleration: .04 },
  extreme: { label: t("Extreme", "Siêu khó"), acceleration: .08 },
};
export function createGame(level = 1, random = Math.random, { mode = 'normal', elapsed = 0, style = 'endless' } = {}) {
  if (!MODES[mode]) mode = 'normal';
  if (style !== 'levels') style = 'endless';
  elapsed = Math.max(0, elapsed);
  level = Math.max(1, Math.floor(level));
  const baseSpeed = style === 'endless' ? 1.8 : Math.min(5.5, 1.8 + (level - 1) * .2);
  const game = { level, mode, style, elapsed, baseSpeed, phase: 'ready', angle: 0, direction: 1, hits: 0, progress: 0,
    speed: Math.min(5.5, baseSpeed + MODES[mode].acceleration * elapsed), tolerance: style === 'endless' ? .17 : Math.max(.075, .17 - (level - 1) * .004), random };
  nextTarget(game); return game;
}
function nextTarget(game) {
  game.progress = 0;
  game.distance = .85 + game.random() * 1.8;
  game.target = (game.angle + game.direction * game.distance + TAU) % TAU;
}
export function step(game, dt) {
  if (game.phase !== 'playing' || dt <= 0) return;
  const acceleration = MODES[game.mode].acceleration;
  const accelerating = Math.min(dt, Math.max(0, (5.5 - game.speed) / acceleration));
  const travel = game.speed * accelerating + .5 * acceleration * accelerating ** 2 + 5.5 * (dt - accelerating);
  game.elapsed += dt;
  game.speed = Math.min(5.5, game.baseSpeed + acceleration * game.elapsed);
  game.progress += travel;
  game.angle = ((game.angle + game.direction * travel) % TAU + TAU) % TAU;
  if (game.progress > game.distance + game.tolerance) game.phase = 'over';
}
export function tap(game) {
  if (game.phase !== 'playing') return false;
  if (Math.abs(game.progress - game.distance) > game.tolerance) { game.phase = 'over'; return false; }
  game.hits++;
  if (game.style === 'levels' && game.hits === game.level) game.phase = 'won';
  else { game.direction *= -1; nextTarget(game); }
  return true;
}
