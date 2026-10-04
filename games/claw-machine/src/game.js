export const CHUTE = { x: -2.05, z: 1.45 };
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
export function createGame(random = Math.random) {
  const colors = [
    "#d6a779",
    "#b9c98d",
    "#dfa8ab",
    "#a3c8cf",
    "#ddca8b",
    "#b8afd2",
  ];
  const bears = colors.map((color, id) => ({
    id,
    color,
    x: ((id % 3) - 1) * 1.35 + (random() - 0.5) * 0.25,
    z: (Math.floor(id / 3) - 0.5) * 1.5 + (random() - 0.5) * 0.2,
    y: 0.48,
    vy: 0,
    weight: 0.6 + random() * 0.5,
    tilt: (random() - 0.5) * 0.7,
    collected: false,
  }));
  return {
    phase: "ready",
    stage: "aim",
    stageTime: 0,
    timer: 20,
    attempts: 3,
    score: 0,
    x: 0,
    z: 0,
    y: 3.6,
    grip: 0,
    carried: null,
    bears,
    message: "Căn càng vào giữa thân gấu. Mỗi ván có 3 lượt.",
  };
}
export function grab(game) {
  if (game.phase !== "playing" || game.stage !== "aim" || game.attempts <= 0)
    return false;
  game.attempts--;
  game.stage = "descend";
  game.stageTime = 0;
  game.message = "Càng đang hạ…";
  return true;
}
function transition(game, stage) {
  game.stage = stage;
  game.stageTime = 0;
}
function release(game, slipped = false) {
  if (!game.carried) return;
  game.carried.vy = 0;
  game.carried = null;
  if (slipped) game.message = "Gấu tuột rồi! Cần gắp sâu vào giữa thân hơn.";
}
function capture(game) {
  const nearest = game.bears
    .filter((b) => !b.collected)
    .sort(
      (a, b) =>
        Math.hypot(a.x - game.x, a.z - game.z) -
        Math.hypot(b.x - game.x, b.z - game.z),
    )[0];
  const distance = nearest
    ? Math.hypot(nearest.x - game.x, nearest.z - game.z)
    : Infinity;
  if (distance > 0.32) {
    game.message = "Càng khép hụt. Thử chỉnh cả chiều ngang lẫn chiều sâu.";
    return;
  }
  const crowded = game.bears.some(
    (b) =>
      b !== nearest &&
      !b.collected &&
      Math.hypot(b.x - nearest.x, b.z - nearest.z) < 0.6,
  );
  game.grip =
    1 -
    distance / 0.32 -
    nearest.weight * 0.17 -
    Math.abs(nearest.tilt) * 0.12 -
    (crowded ? 0.12 : 0);
  game.carried = nearest;
  game.message = "Đã kẹp được gấu… chờ xem có giữ nổi không!";
}
function physics(game, dt) {
  for (const bear of game.bears) {
    if (bear.collected || bear === game.carried) continue;
    bear.y += bear.vy * dt - 4.9 * dt * dt;
    bear.vy -= 9.8 * dt;
    const inChute =
      Math.abs(bear.x - CHUTE.x) < 0.48 && Math.abs(bear.z - CHUTE.z) < 0.48;
    if (inChute && bear.y < 0.05) {
      bear.collected = true;
      game.score++;
      game.message = "Nhận được gấu! +1 điểm 🧸";
      continue;
    }
    if (!inChute && bear.y < 0.48) {
      bear.y = 0.48;
      bear.vy = Math.abs(bear.vy) > 1 ? -bear.vy * 0.12 : 0;
    }
  }
}
export function step(game, dt, dx = 0, dz = 0) {
  if (game.phase !== "playing" || dt <= 0) return;
  game.stageTime += dt;
  const t = game.stageTime;
  if (game.stage === "aim") {
    const length = Math.max(1, Math.hypot(dx, dz));
    game.x = clamp(game.x + (dx / length) * 1.2 * dt, -2.2, 2.2);
    game.z = clamp(game.z + (dz / length) * 1.2 * dt, -1.45, 1.45);
    game.timer = Math.max(0, game.timer - dt);
    if (game.timer === 0) grab(game);
  } else if (game.stage === "descend") {
    game.y = 3.6 - 2.55 * Math.min(t / 1.3, 1);
    if (t >= 1.3) transition(game, "close");
  } else if (game.stage === "close") {
    if (t >= 0.55) {
      capture(game);
      transition(game, "lift");
    }
  } else if (game.stage === "lift") {
    const fraction = Math.min(t / 1.6, 1);
    game.y = 1.05 + 2.55 * fraction;
    if (game.carried && game.y > 1.6 && game.grip < 0.46 + fraction * 0.17)
      release(game, true);
    if (t >= 1.6) {
      game.origin = { x: game.x, z: game.z };
      transition(game, "return");
    }
  } else if (game.stage === "return") {
    const fraction = Math.min(t / 1.8, 1);
    game.x = game.origin.x + (CHUTE.x - game.origin.x) * fraction;
    game.z = game.origin.z + (CHUTE.z - game.origin.z) * fraction;
    if (game.carried && t > 0.2 && game.grip < 0.72 + Math.sin(t * 5) * 0.025)
      release(game, true);
    if (t >= 1.8) {
      release(game);
      transition(game, "drop");
    }
  } else if (game.stage === "drop") {
    if (t >= 1.2) {
      game.origin = { x: game.x, z: game.z };
      transition(game, "reset");
    }
  } else if (game.stage === "reset") {
    const fraction = Math.min(t / 0.7, 1);
    game.x = game.origin.x * (1 - fraction);
    game.z = game.origin.z * (1 - fraction);
    if (t >= 0.7) {
      if (game.attempts === 0) game.phase = "over";
      else {
        transition(game, "aim");
        game.timer = 20;
        game.message = `Còn ${game.attempts} lượt. Căn giữa thân gấu trước khi gắp.`;
      }
    }
  }
  if (game.carried) {
    game.carried.x = game.x + Math.sin(t * 5) * 0.035;
    game.carried.z = game.z;
    game.carried.y = game.y - 0.55;
    game.carried.vy = 0;
  }
  physics(game, dt);
}
