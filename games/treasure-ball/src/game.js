import { t } from "../../../src/i18n.js";
import * as CANNON from "cannon-es";
export const MAX_PIECES = 180;
export const SMALL_RADIUS = 0.2;
export const BIG_RADIUS = 0.38;
export const PLINKO_RADIUS = 0.13;
export const FRONT = 2.55;
export const CHANNELS = [
  { kind: "big", amount: 1 },
  { kind: "small", amount: 4 },
  { kind: "points", amount: 25 },
  { kind: "key", amount: 1 },
  { kind: "none", amount: 0 },
  { kind: "big", amount: 1 },
  { kind: "small", amount: 6 },
];
export const BONUS_REWARDS = [
  { kind: "small", amount: 6 },
  { kind: "points", amount: 100 },
  { kind: "big", amount: 1 },
  { kind: "small", amount: 10 },
  { kind: "points", amount: 200 },
  { kind: "big", amount: 1 },
  { kind: "small", amount: 15 },
  { kind: "points", amount: 500 },
];
export function rewardLabel(reward) {
  if (reward.kind === "none") return t("EMPTY", "TRỐNG");
  if (reward.kind === "key") return t("KEY", "CHÌA KHÓA");
  return t(`${reward.amount} ${{ small: "SMALL BALLS", big: "BIG BALLS", points: "POINTS" }[reward.kind]}`, `${reward.amount} ${{ small: "BÓNG NHỎ", big: "BÓNG LỚN", points: "ĐIỂM" }[reward.kind]}`);
}
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function channelIndex(x) {
  return clamp(Math.floor((x + 2.1) / 0.6), 0, 6);
}
function fixedBox(world, half, pos, material, type = CANNON.Body.STATIC) {
  const body = new CANNON.Body({ type, material });
  body.addShape(new CANNON.Box(new CANNON.Vec3(...half)));
  body.position.set(...pos);
  world.addBody(body);
  return body;
}
export function addBall(game, kind, x, y, z, overflow = false) {
  if (game.pieces.length >= MAX_PIECES + (overflow ? 1 : 0)) return null;
  const body = new CANNON.Body({
    mass: kind === "small" ? 1 : 3,
    material: game.material,
    shape: new CANNON.Sphere(kind === "small" ? SMALL_RADIUS : BIG_RADIUS),
  });
  body.position.set(x, y, z);
  body.linearDamping = 0.42;
  body.angularDamping = 0.6;
  body.allowSleep = true;
  body.sleepSpeedLimit = 0.08;
  body.sleepTimeLimit = 0.4;
  game.world.addBody(body);
  const piece = { id: game.nextId++, kind, body };
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
  world.narrowphase.enableFrictionReduction = true;
  const material = new CANNON.Material("balls");
  world.addContactMaterial(
    new CANNON.ContactMaterial(material, material, {
      friction: 0.28,
      restitution: 0.03,
    }),
  );
  fixedBox(world, [2.45, 0.15, 3.1], [0, -0.15, -0.55], material);
  for (const x of [-2.55, 2.55])
    fixedBox(world, [0.1, 1.2, 3.125], [x, 1.1, -0.575], material);
  fixedBox(world, [2.6, 1.25, 0.12], [0, 1.1, -2.82], material);
  const shelf = new CANNON.Material("shelf");
  world.addContactMaterial(
    new CANNON.ContactMaterial(material, shelf, {
      friction: 0.0001,
      restitution: 0.02,
    }),
  );
  const pusher = fixedBox(
    world,
    [2.45, 0.3, 1.3],
    [0, 0.3, -2.3],
    shelf,
    CANNON.Body.KINEMATIC,
  );
  const plinkoWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -5.5, 0),
  });
  plinkoWorld.solver.iterations = 8;
  const pegMaterial = new CANNON.Material("pegs");
  plinkoWorld.addContactMaterial(
    new CANNON.ContactMaterial(pegMaterial, pegMaterial, {
      friction: 0.04,
      restitution: 0.5,
    }),
  );
  const pegs = [];
  for (let row = 0; row < 7; row++)
    for (let col = 0; col < (row % 2 ? 8 : 7); col++) {
      const x = (col - (row % 2 ? 3.5 : 3)) * 0.5,
        y = 4.03 - row * 0.36;
      const peg = new CANNON.Body({
        mass: 0,
        material: pegMaterial,
        shape: new CANNON.Sphere(0.065),
      });
      peg.position.set(x, y, 0);
      plinkoWorld.addBody(peg);
      pegs.push({ x, y });
    }
  for (const x of [-2.2, 2.2])
    fixedBox(plinkoWorld, [0.1, 2, 0.3], [x, 2.7, 0], pegMaterial);
  const game = {
    world,
    material,
    pusher,
    plinkoWorld,
    pegMaterial,
    pegs,
    plinkoBalls: [],
    pieces: [],
    nextId: 0,
    random,
    phase: "ready",
    tokens: 30,
    drainTime: 0,
    restTime: 0,
    score: 0,
    shots: 0,
    aim: 0,
    time: 0,
    cooldown: 0,
    lost: 0,
    pendingSmall: 0,
    pendingBig: 0,
    rewards: [],
    dropCooldown: 0,
    generatedBig: 0,
    frontSmall: 0,
    frontBig: 0,
    keys: 0,
    chests: 0,
    lastChannel: -1,
    bonuses: [],
    spin: null,
    lastBonus: null,
    bonusWheel: 0,
    message: t("Aim, then drop through the peg board. Big balls unlock the bonus wheel.", "Căn vị trí rồi thả bóng qua bảng đinh. Bóng lớn mở vòng thưởng."),
  };
  if (populated) {
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 10; col++)
        addBall(
          game,
          "small",
          (col - 4.5) * 0.44 + (random() - 0.5) * 0.02,
          SMALL_RADIUS + 0.005,
          -0.18 + row * 0.44,
        );
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 10; col++)
        addBall(
          game,
          "small",
          (col - 4.5) * 0.44,
          0.6 + SMALL_RADIUS + 0.005,
          -2.48 + row * 0.45,
        );
    for (let i = 0; i < Math.floor(random() * 11); i++)
      addBall(game, "small", (random() - 0.5) * 4, 0.45, random() * 2.4);
    const initialBig = 3 + Math.floor(random() * 2);
    for (let i = 0; i < initialBig; i++)
      addBall(
        game,
        "big",
        ((i % 2) - 0.5) * 2.4 + (random() - 0.5) * 0.2,
        0.75,
        0.7 + Math.floor(i / 2) * 1.3,
      );
    for (let i = 0; i < 40; i++) world.step(1 / 60);
  }
  return game;
}
export function setAim(game, value) {
  game.aim = clamp(Number(value) || 0, -1.9, 1.9);
}
export function shoot(game) {
  if (
    game.phase !== "playing" ||
    game.tokens <= 0 ||
    game.cooldown > 0 ||
    game.pieces.length >= MAX_PIECES ||
    game.pendingSmall + game.pendingBig > 70 ||
    game.plinkoBalls.length >= 6
  )
    return false;
  const body = new CANNON.Body({
    mass: 1,
    material: game.pegMaterial,
    shape: new CANNON.Sphere(PLINKO_RADIUS),
  });
  body.position.set(game.aim, 4.52, 0);
  body.linearFactor.set(1, 1, 0);
  body.angularFactor.set(0, 0, 1);
  body.velocity.x = Math.sin(game.time * 2.4) * 0.18;
  body.linearDamping = 0.03;
  game.plinkoWorld.addBody(body);
  game.plinkoBalls.push({ id: game.nextId++, body, age: 0, aim: game.aim });
  game.tokens--;
  if (game.tokens === 0) game.phase = "settling";
  game.shots++;
  game.cooldown = 0.65;
  game.message = t("The ball is crossing the peg board… wait for the reward channel below.", "Bóng đang qua bảng đinh… chờ ô thưởng bên dưới.");
  return true;
}
function queueBalls(game, kind, amount, aim = game.aim) {
  if (kind === "small") game.pendingSmall += amount;
  else game.pendingBig += amount;
  game.rewards.push({ kind, remaining: amount, aim });
}
function resolveChannel(game, ball) {
  const index = channelIndex(ball.body.position.x),
    reward = CHANNELS[index];
  game.lastChannel = index;
  // The original fired ball enters the table as well as any channel reward.
  queueBalls(game, "small", 1, ball.aim);
  if (reward.kind === "small" || reward.kind === "big")
    queueBalls(game, reward.kind, reward.amount, ball.body.position.x);
  else if (reward.kind === "points") game.score += reward.amount;
  else if (reward.kind === "key") {
    game.keys++;
    if (game.keys % 3 === 0) {
      game.chests++;
      game.score += 200;
      queueBalls(game, "big", 1);
      game.message = t("CHEST OPEN! +200 points and 1 big ball onto the table.", "MỞ RƯƠNG! +200 điểm và 1 bóng lớn xuống bàn.");
      return;
    }
  }
  game.message = t(`Plinko: ${rewardLabel(reward)}. The original ball also lands on the pusher.`, `Plinko: ${rewardLabel(reward)}. Bóng thả ban đầu cũng xuống bàn đẩy.`);
}
function collect(game, piece) {
  const pos = piece.body.position;
  if (pos.z <= FRONT || Math.abs(pos.x) > 2.55) {
    game.lost++;
    return;
  }
  if (piece.kind === "small") {
    game.frontSmall++;
    game.score += 2;
    game.message = t("Front small ball: +2 points. Credits do not refill.", "Bóng nhỏ cửa trước: +2 điểm. Credit không tăng.");
  } else {
    game.frontBig++;
    game.score += 10;
    game.bonuses.push(false);
    if (game.frontBig % 6 === 0) game.bonuses.push(true);
    game.message = t("Big ball collected! The bonus wheel is starting.", "Bóng lớn đã rơi! Vòng thưởng đang khởi động.");
  }
}
function dispense(game, dt) {
  game.dropCooldown = Math.max(0, game.dropCooldown - dt);
  if (
    game.dropCooldown > 0 ||
    game.pieces.length >= MAX_PIECES + (game.phase === "settling" ? 1 : 0) ||
    !game.rewards.length
  )
    return;
  const reward = game.rewards[0];
  // One temporary overflow slot lets a full shelf release queued end-of-round prizes.
  const overflow = game.phase === "settling" && game.pieces.length >= MAX_PIECES;
  addBall(
    game,
    reward.kind,
    clamp(reward.aim + (game.random() - 0.5) * 0.45, -2, 2),
    reward.kind === "big" ? 1.45 : 1.2,
    -2.25,
    overflow,
  );
  if (reward.kind === "small") game.pendingSmall--;
  else {
    game.pendingBig--;
    game.generatedBig++;
  }
  reward.remaining--;
  game.dropCooldown = reward.kind === "big" ? 0.22 : 0.07;
  if (!reward.remaining) game.rewards.shift();
}
function spinBonus(game, dt) {
  if (!game.spin && game.bonuses.length) {
    const superBonus = game.bonuses.shift(),
      index = Math.floor(game.random() * BONUS_REWARDS.length),
      base = BONUS_REWARDS[index];
    const reward = {
      ...base,
      amount: base.amount * (superBonus ? 3 : 1),
      superBonus,
    };
    const start = game.bonusWheel,
      target = (index * TAU) / BONUS_REWARDS.length;
    game.spin = {
      reward,
      index,
      start,
      end: start + 4 * TAU + ((target - (start % TAU) + TAU) % TAU),
      elapsed: 0,
    };
  }
  if (!game.spin) return;
  const spin = game.spin;
  spin.elapsed += dt;
  const t = Math.min(spin.elapsed / 2.5, 1);
  game.bonusWheel = spin.start + (spin.end - spin.start) * (1 - (1 - t) ** 3);
  if (t === 1) {
    const reward = spin.reward;
    if (reward.kind === "points") game.score += reward.amount;
    else queueBalls(game, reward.kind, reward.amount);
    game.lastBonus = reward;
    game.spin = null;
    game.message = `${reward.superBonus ? "SUPER BONUS ×3" : reward.amount === 500 ? "JACKPOT" : "Bonus"}: +${rewardLabel(reward)}!`;
  }
}
export function step(game, dt) {
  if (!["playing", "settling"].includes(game.phase) || dt <= 0) return;
  if (game.tokens <= 0) game.phase = "settling";
  game.time += dt;
  game.cooldown = Math.max(0, game.cooldown - dt);
  game.plinkoWorld.step(dt);
  for (let i = game.plinkoBalls.length - 1; i >= 0; i--) {
    const ball = game.plinkoBalls[i];
    ball.age += dt;
    // A symmetric release can perch on a peg. A tiny nudge dislodges it, never picks a reward.
    if (ball.age > 1 && ball.body.velocity.length() < 0.04)
      ball.body.velocity.x = 0.15;
    if (ball.body.position.y < 1.05) {
      resolveChannel(game, ball);
      game.plinkoWorld.removeBody(ball.body);
      game.plinkoBalls.splice(i, 1);
    }
  }
  dispense(game, dt);
  const resting = game.phase === "settling" && game.drainTime >= 8;
  const target = resting
    ? Math.max(-2.3, game.pusher.position.z - dt * 0.8)
    : -2.3 + (0.8 * (1 - Math.cos((game.time * TAU) / 3.8))) / 2;
  game.pusher.velocity.z = (target - game.pusher.position.z) / dt;
  if (game.pusher.velocity.z > 0) for (const p of game.pieces) p.body.wakeUp();
  game.world.step(dt);
  for (let i = game.pieces.length - 1; i >= 0; i--) {
    const p = game.pieces[i];
    if (p.body.position.y < -0.4) {
      collect(game, p);
      game.world.removeBody(p.body);
      game.pieces.splice(i, 1);
    }
  }
  spinBonus(game, dt);
  if (game.phase === "settling") {
    const pending = game.plinkoBalls.length || game.rewards.length || game.spin || game.bonuses.length;
    if (pending) {
      game.drainTime = 0;
      game.restTime = 0;
    } else {
      game.drainTime += dt;
      if (resting && game.pusher.position.z <= -2.3 + 1e-6) {
        game.restTime += dt;
        if (game.restTime >= 2) game.phase = "over";
      }
    }
  }
}
