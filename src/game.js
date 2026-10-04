export const RULES = { gravity: 12, flap: 4.6, speed: 3.2, radius: 0.28, pipeHalf: 0.58, gap: 2.7, floor: -3.2, ceiling: 3.8, spacing: 5.5 };
export function difficulty(elapsed) {
  const progress = Math.min(Math.max(elapsed / 90, 0), 1);
  return {
    speed: RULES.speed * (1 + progress),
    gap: RULES.gap - progress,
    spacing: RULES.spacing - progress * .7,
    heightRange: 2.1 + progress * 1.1,
  };
}
export const createGame = () => ({ phase: 'ready', y: 0, velocity: 0, score: 0, pipes: [], distance: 0, elapsed: 0 });
export function flap(game) {
  if (game.phase === 'over') return;
  game.phase = 'playing';
  game.velocity = RULES.flap;
}
export function step(game, dt, random = Math.random) {
  if (game.phase !== 'playing') return;
  const speed = difficulty(game.elapsed + dt / 2).speed;
  game.elapsed += dt;
  const level = difficulty(game.elapsed);
  game.y += game.velocity * dt - RULES.gravity * dt * dt / 2;
  game.velocity -= RULES.gravity * dt;
  game.distance += speed * dt;
  if (!game.pipes.length || game.pipes.at(-1).x < 9 - level.spacing) {
    const previous = game.pipes.at(-1);
    let gapY = (random() - 0.5) * level.heightRange;
    if (previous) gapY = Math.max(previous.gapY - 1.6, Math.min(previous.gapY + 1.6, gapY));
    game.pipes.push({ x: 9, gapY, gap: level.gap, passed: false });
  }
  for (const pipe of game.pipes) {
    pipe.x -= speed * dt;
    if (Math.abs(pipe.x) < RULES.pipeHalf + RULES.radius &&
      Math.abs(game.y - pipe.gapY) + RULES.radius > (pipe.gap ?? RULES.gap) / 2) game.phase = 'over';
  }
  if (game.y - RULES.radius <= RULES.floor || game.y + RULES.radius >= RULES.ceiling) game.phase = 'over';
  if (game.phase === 'playing') {
    for (const pipe of game.pipes) {
      if (!pipe.passed && pipe.x + RULES.pipeHalf < -RULES.radius) {
        pipe.passed = true; game.score++;
      }
    }
  }
  game.pipes = game.pipes.filter(pipe => pipe.x > -12);
}
