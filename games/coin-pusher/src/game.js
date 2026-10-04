import * as CANNON from "cannon-es";

export const COLORS = [
  "#a88bdf",
  "#f0b957",
  "#6eb4dc",
  "#df7885",
  "#91c57b",
  "#e7854d",
];
export const FRONT = 2.55;
export const SIDE = 2.55;
export const MAX_PIECES = 260;
export const SHOT_DELAY = 0.25;
const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function fixedBox(world, half, position, material, type = CANNON.Body.STATIC) {
  const body = new CANNON.Body({ type, material });
  body.addShape(new CANNON.Box(new CANNON.Vec3(...half)));
  body.position.set(...position);
  world.addBody(body);
  return body;
}

export function addPiece(game, kind, x, y, z, stone = -1) {
  if (game.pieces.length >= MAX_PIECES) return null;
  const shape =
    kind === "coin"
      ? new CANNON.Cylinder(0.19, 0.19, 0.075, 8)
      : new CANNON.Sphere(0.25);
  const body = new CANNON.Body({
    mass: kind === "coin" ? 1 : 2.2,
    material: game.material,
  });
  body.addShape(shape);
  body.position.set(x, y, z);
  body.linearDamping = 0.3;
  body.angularDamping = 0.5;
  body.allowSleep = true;
  body.sleepSpeedLimit = 0.08;
  body.sleepTimeLimit = 0.4;
  game.world.addBody(body);
  const piece = { id: game.nextId++, kind, stone, body };
  game.pieces.push(piece);
  return piece;
}

export function createGame(random = Math.random, populated = true) {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.8, 0),
    allowSleep: true,
  });
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.solver.iterations = 8;
  const material = new CANNON.Material("tokens");
  world.addContactMaterial(
    new CANNON.ContactMaterial(material, material, {
      friction: 0.22,
      restitution: 0.08,
    }),
  );
  fixedBox(world, [2.45, 0.15, 2.55], [0, -0.15, 0], material);
  fixedBox(world, [2.6, 0.5, 0.12], [0, 0.4, -2.65], material);
  const pusher = fixedBox(
    world,
    [2.3, 0.3, 0.55],
    [0, 0.3, -2.35],
    material,
    CANNON.Body.KINEMATIC,
  );
  const game = {
    world,
    material,
    pusher,
    pieces: [],
    nextId: 0,
    random,
    phase: "ready",
    tokens: 50,
    score: 0,
    shots: 0,
    lost: 0,
    aim: 0,
    time: 0,
    wheel: 0,
    cooldown: 0,
    grace: 0,
    collected: 0,
    bonuses: [],
    spin: null,
    lastBonus: 0,
    wheelHits: 0,
    message: "50 xu. Căn vị trí và nhịp bàn đẩy. Đá rơi phía trước mở bonus.",
  };
  if (populated) {
    // Dense lower layer reaches the ledge; random top layers vary every round.
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 12; col++) {
        addPiece(
          game,
          "coin",
          (col - 5.5) * 0.39 + (random() - 0.5) * 0.035,
          0.055,
          -1.32 + row * 0.38 + (random() - 0.5) * 0.025,
        );
      }
    }
    const extraCoins = 25 + Math.floor(random() * 31);
    for (let i = 0; i < extraCoins; i++) {
      addPiece(
        game,
        "coin",
        (random() - 0.5) * 4.2,
        0.16 + Math.floor(i / 20) * 0.08,
        -0.9 + random() * 3.3,
      );
    }
    for (let i = 0; i < 6; i++) {
      addPiece(
        game,
        "stone",
        ((i % 3) - 1) * 1.4 + (random() - 0.5) * 0.3,
        0.4,
        0.9 + Math.floor(i / 3) * 1.1,
        Math.floor(random() * COLORS.length),
      );
    }
    // Settle the starting pile before the clock and pusher start.
    for (let i = 0; i < 45; i++) world.step(1 / 60);
  }
  return game;
}

export function setAim(game, value) {
  game.aim = clamp(Number(value) || 0, -2.1, 2.1);
}

export function targetHit(angle) {
  // Six moving lights cross the fixed top marker; the timing window is narrow.
  const sector = TAU / 6;
  const offset = ((angle % sector) + sector) % sector;
  return Math.min(offset, sector - offset) <= 0.075;
}

export function shoot(game) {
  if (
    game.phase !== "playing" ||
    game.tokens <= 0 ||
    game.cooldown > 0 ||
    game.pieces.length >= MAX_PIECES
  )
    return false;
  game.tokens--;
  game.shots++;
  game.cooldown = SHOT_DELAY;
  game.grace = 0;
  const piece = addPiece(game, "coin", game.aim, 1.65, -0.97);
  piece.body.velocity.set(0, -0.5, 0);
  piece.body.angularVelocity.set(0.5, 0, 0.2);
  if (targetHit(game.wheel)) {
    game.wheelHits++;
    game.tokens += 2;
    game.message = "Trúng đèn mục tiêu! +2 xu. Xu đã rơi vào bàn đẩy.";
  } else game.message = "Xu đã bắn. Chờ bàn đẩy dồn lớp xu về phía trước.";
  return true;
}

function collect(game, piece, front) {
  if (!front) {
    game.lost++;
    game.message = "Rơi vào khe bên: mất vật phẩm. Thử bắn gần giữa hơn.";
    if (piece.kind === "stone") {
      // The cabinet recycles stones, regardless of their color.
      addPiece(
        game,
        "stone",
        ((piece.stone % 3) - 1) * 1.3,
        0.8,
        -0.7,
        piece.stone,
      );
    }
    return;
  }
  if (piece.kind === "coin") {
    game.score++;
    game.tokens++;
    game.grace = 0;
    game.message = "Xu rơi cửa trước: +1 điểm, +1 xu để bắn tiếp.";
  } else {
    game.collected++;
    game.score += 20;
    game.bonuses.push([4, 6, 8, 12][Math.floor(game.random() * 4)]);
    game.message = `Đã thu đá ${game.collected} viên, bộ ${game.collected % 6}/6! Bonus Spin đang quay…`;
    if (game.collected % 6 === 0) {
      game.bonuses.push(30);
      game.score += 100;
    }
    addPiece(
      game,
      "stone",
      (game.random() - 0.5) * 3.5,
      0.8,
      -0.2,
      Math.floor(game.random() * COLORS.length),
    );
  }
}

export function step(game, dt) {
  if (game.phase !== "playing" || dt <= 0) return;
  game.time += dt;
  game.cooldown = Math.max(0, game.cooldown - dt);
  game.wheel = game.time * 1.45;
  const targetZ = -2.35 + (0.85 * (1 - Math.cos((game.time * TAU) / 3.8))) / 2;
  game.pusher.velocity.z = (targetZ - game.pusher.position.z) / dt;
  game.world.step(dt);
  // Wake the entire pile so contact forces propagate through resting front rows.
  if (game.pusher.velocity.z > 0) {
    for (const piece of game.pieces) {
      piece.body.wakeUp();
    }
  }
  for (let i = game.pieces.length - 1; i >= 0; i--) {
    const piece = game.pieces[i];
    const p = piece.body.position;
    if (p.y < -0.4) {
      const front = p.z > FRONT && Math.abs(p.x) < SIDE;
      game.world.removeBody(piece.body);
      game.pieces.splice(i, 1);
      collect(game, piece, front);
    }
  }
  if (!game.spin && game.bonuses.length)
    game.spin = { reward: game.bonuses.shift(), time: 1.2 };
  if (game.spin) {
    game.spin.time -= dt;
    if (game.spin.time <= 0) {
      const reward = game.spin.reward;
      game.tokens += reward;
      game.lastBonus = reward;
      game.grace = 0;
      game.message =
        reward === 30
          ? "SUPER BONUS! Đủ 6 đá: +30 xu, +100 điểm!"
          : `Bonus Spin: +${reward} xu!`;
      game.spin = null;
    }
  }
  // Allow the last shot to land and two full pusher strokes to finish.
  if (game.tokens === 0 && !game.spin && !game.bonuses.length) {
    game.grace += dt;
    if (game.grace >= 8) game.phase = "over";
  } else game.grace = 0;
}
