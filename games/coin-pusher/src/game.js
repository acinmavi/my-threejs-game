import * as CANNON from "cannon-es";
export const COLORS = [
  "#a88bdf",
  "#f0b957",
  "#6eb4dc",
  "#df7885",
  "#91c57b",
  "#e7854d",
];
export const WHEEL_VALUES = [1, 3, 5, 10, 2, 8, 15, 5];
export const BONUS_REWARDS = [
  { kind: "coins", amount: 8 },
  { kind: "points", amount: 50 },
  { kind: "stones", amount: 1 },
  { kind: "coins", amount: 15 },
  { kind: "points", amount: 100 },
  { kind: "stones", amount: 2 },
  { kind: "coins", amount: 25 },
  { kind: "points", amount: 150 },
];
export function bonusLabel(reward) {
  return `${reward.amount} ${{ coins: "XU", stones: "ĐÁ", points: "ĐIỂM" }[reward.kind]}`;
}
export const FRONT = 2.55;
export const SIDE = 2.55;
export const MAX_PIECES = 260;
export const STONE_THRESHOLD = 50;
export const SHOT_DELAY = 0.7;
export const UPPER_Y = 0.6;
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
      ? new CANNON.Cylinder(0.2, 0.2, 0.075, 8)
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
  world.narrowphase.enableFrictionReduction = true;
  const material = new CANNON.Material("tokens");
  world.addContactMaterial(
    new CANNON.ContactMaterial(material, material, {
      friction: 0.22,
      restitution: 0.08,
    }),
  );
  fixedBox(world, [2.45, 0.15, 3.1], [0, -0.15, -0.55], material);
  for (const x of [-2.55, 2.55])
    fixedBox(world, [0.1, 1.2, 3.125], [x, 1.1, -0.575], material);
  // Fixed rear wall strips coins from the upper shelf as it retracts.
  fixedBox(world, [2.6, 1.25, 0.12], [0, 1.1, -2.82], material);
  const shelfMaterial = new CANNON.Material("polished shelf");
  world.addContactMaterial(
    new CANNON.ContactMaterial(material, shelfMaterial, {
      friction: 0.0001,
      restitution: 0.02,
    }),
  );
  const pusher = fixedBox(
    world,
    [2.45, 0.3, 1.3],
    [0, 0.3, -2.3],
    shelfMaterial,
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
    lastBonus: null,
    bonusWheel: 0,
    flights: [],
    nextFlight: 0,
    rewards: [],
    pendingCoins: 0,
    pendingStones: 0,
    dropCooldown: 0,
    lastWheel: 0,
    frontCoins: 0,
    generatedStones: 0,
    initialCoins: 0,
    message:
      "Thả xu qua vòng quay. Xu thưởng rơi lên bàn trên rồi đẩy xuống bàn dưới.",
  };
  if (populated) {
    game.initialCoins = 156 + Math.floor(random() * 25);
    // Keep the front ledge populated without deep, expensive stacks.
    for (let row = 0; row < 8; row++)
      for (let col = 0; col < 12; col++)
        addPiece(
          game,
          "coin",
          (col - 5.5) * 0.39 + (random() - 0.5) * 0.03,
          0.055,
          -0.15 + row * 0.38 + (random() - 0.5) * 0.025,
        );
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 12; col++)
        addPiece(
          game,
          "coin",
          (col - 5.5) * 0.39 + (random() - 0.5) * 0.02,
          UPPER_Y + 0.055,
          -2.52 + row * 0.35,
        );
    for (let i = 144; i < game.initialCoins; i++)
      addPiece(
        game,
        "coin",
        (random() - 0.5) * 4.2,
        0.17 + Math.floor((i - 144) / 35) * 0.08,
        -0.5 + random() * 2.9,
      );
    const initialStones = 4 + Math.floor(random() * 2);
    for (let i = 0; i < initialStones; i++)
      addPiece(
        game,
        "stone",
        ((i % 3) - 1) * 1.35 + (random() - 0.5) * 0.25,
        0.45,
        1.3 + Math.floor(i / 3) * 0.8,
        Math.floor(random() * COLORS.length),
      );
    for (let i = 0; i < 45; i++) world.step(1 / 60);
  }
  return game;
}
export function setAim(game, value) {
  game.aim = clamp(Number(value) || 0, -2.1, 2.1);
}
export function wheelAward(angle) {
  const sector = TAU / WHEEL_VALUES.length;
  const index =
    ((Math.round(angle / sector) % WHEEL_VALUES.length) + WHEEL_VALUES.length) %
    WHEEL_VALUES.length;
  return WHEEL_VALUES[index];
}
export function shoot(game) {
  if (
    game.phase !== "playing" ||
    game.tokens <= 0 ||
    game.cooldown > 0 ||
    game.pieces.length >= MAX_PIECES ||
    game.pendingCoins > 60
  )
    return false;
  game.tokens--;
  game.shots++;
  game.cooldown = SHOT_DELAY;
  game.grace = 0;
  game.flights.push({ id: game.nextFlight++, age: 0, aim: game.aim });
  game.message =
    "Xu đang đi qua vòng quay… ô trúng quyết định số xu rơi lên bàn đẩy.";
  return true;
}
function collect(game, piece, front) {
  if (!front) {
    game.lost++;
    game.message = "Rơi khe bên: mất vật phẩm.";
    return;
  }
  if (piece.kind === "coin") {
    game.score++;
    game.frontCoins++;
    game.grace = 0;
    if (game.frontCoins % STONE_THRESHOLD === 0) {
      game.pendingStones++;
      game.message =
        "Đủ 50 điểm từ xu cửa trước! Máy thả thêm một đá ngẫu nhiên.";
    } else
      game.message = `Xu cửa trước: +1 điểm. Tiến độ đá ${game.frontCoins % STONE_THRESHOLD}/${STONE_THRESHOLD} điểm từ xu.`;
  } else {
    game.collected++;
    game.score += 20;
    game.bonuses.push(false);
    game.message = `Đã nhận ${game.collected} đá! Màu nào cũng tính, bộ ${game.collected % 6}/6.`;
    if (game.collected % 6 === 0) {
      game.bonuses.push(true);
      game.score += 100;
    }
  }
}
function dispense(game, dt) {
  game.dropCooldown = Math.max(0, game.dropCooldown - dt);
  if (game.dropCooldown > 0 || game.pieces.length >= MAX_PIECES) return;
  if (game.pendingStones) {
    addPiece(
      game,
      "stone",
      (game.random() - 0.5) * 3.6,
      1.5,
      -2.28,
      Math.floor(game.random() * COLORS.length),
    );
    game.pendingStones--;
    game.generatedStones++;
    game.dropCooldown = 0.12;
  } else if (game.rewards.length) {
    const reward = game.rewards[0];
    addPiece(
      game,
      "coin",
      clamp(reward.aim + (game.random() - 0.5) * 0.55, -2.1, 2.1),
      1.4,
      -2.35 + (game.random() - 0.5) * 0.1,
    );
    reward.remaining--;
    game.pendingCoins--;
    game.dropCooldown = 0.065;
    if (reward.remaining === 0) game.rewards.shift();
  }
}
export function step(game, dt) {
  if (game.phase !== "playing" || dt <= 0) return;
  game.time += dt;
  game.cooldown = Math.max(0, game.cooldown - dt);
  game.wheel = game.time * 1.25;
  for (let i = game.flights.length - 1; i >= 0; i--) {
    const flight = game.flights[i];
    flight.age += dt;
    if (flight.age >= 0.6) {
      const award = wheelAward(game.wheel);
      game.lastWheel = award;
      // The fired token falls onto the shelf too; the wheel award is additional.
      game.pendingCoins += award + 1;
      game.rewards.push({ remaining: award + 1, aim: flight.aim });
      game.flights.splice(i, 1);
      game.message = `Trúng ô ${award} xu! ${award} xu đang rơi lên bàn đẩy trên.`;
    }
  }
  dispense(game, dt);
  const targetZ = -2.3 + (0.8 * (1 - Math.cos((game.time * TAU) / 3.8))) / 2;
  game.pusher.velocity.z = (targetZ - game.pusher.position.z) / dt;
  // Every layer must wake so force can propagate to the front, not stop at sleeping bodies.
  if (game.pusher.velocity.z > 0)
    for (const piece of game.pieces) piece.body.wakeUp();
  game.world.step(dt);
  for (let i = game.pieces.length - 1; i >= 0; i--) {
    const piece = game.pieces[i],
      p = piece.body.position;
    if (p.y < -0.4) {
      const front = p.z > FRONT && Math.abs(p.x) < SIDE;
      game.world.removeBody(piece.body);
      game.pieces.splice(i, 1);
      collect(game, piece, front);
    }
  }
  if (!game.spin && game.bonuses.length) {
    const superBonus = game.bonuses.shift();
    const index = Math.floor(game.random() * BONUS_REWARDS.length);
    const base = BONUS_REWARDS[index];
    const reward = {
      ...base,
      amount: base.amount * (superBonus ? 3 : 1),
      superBonus,
    };
    const start = game.bonusWheel;
    const sectorAngle = (index * TAU) / BONUS_REWARDS.length;
    const end = start + 4 * TAU + ((sectorAngle - (start % TAU) + TAU) % TAU);
    game.spin = { reward, index, elapsed: 0, start, end };
  }
  if (game.spin) {
    const spin = game.spin;
    spin.elapsed += dt;
    const progress = Math.min(spin.elapsed / 2.5, 1);
    game.bonusWheel =
      spin.start + (spin.end - spin.start) * (1 - (1 - progress) ** 3);
    if (progress === 1) {
      const reward = spin.reward;
      if (reward.kind === "coins") {
        game.pendingCoins += reward.amount;
        game.rewards.push({ remaining: reward.amount, aim: game.aim });
      } else if (reward.kind === "stones") game.pendingStones += reward.amount;
      else game.score += reward.amount;
      game.lastBonus = reward;
      game.grace = 0;
      game.message = `${reward.superBonus ? "SUPER BONUS / JACKPOT ×3" : "Bonus Spin"}: +${bonusLabel(reward)}! Credit không tăng.`;
      game.spin = null;
    }
  }
  const pending =
    game.spin ||
    game.bonuses.length ||
    game.flights.length ||
    game.pendingCoins ||
    game.pendingStones;
  if (game.tokens === 0 && !pending) {
    game.grace += dt;
    if (game.grace >= 8) game.phase = "over";
  } else game.grace = 0;
}
