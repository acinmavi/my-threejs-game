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
export const FRONT = 2.55;
export const SIDE = 2.55;
export const MAX_PIECES = 420;
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
  fixedBox(world, [2.45, 0.15, 2.55], [0, -0.15, 0], material);
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
    [2.3, 0.3, 0.85],
    [0, 0.3, -1.85],
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
    lastBonus: 0,
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
    game.initialCoins = Math.round((157 + Math.floor(random() * 31)) * 1.5);
    // 120 lower coins reach the front ledge; 60 coins already sit on the moving shelf.
    for (let row = 0; row < 10; row++)
      for (let col = 0; col < 12; col++)
        addPiece(
          game,
          "coin",
          (col - 5.5) * 0.39 + (random() - 0.5) * 0.03,
          0.055,
          -0.9 + row * 0.38 + (random() - 0.5) * 0.025,
        );
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 12; col++)
        addPiece(
          game,
          "coin",
          (col - 5.5) * 0.39 + (random() - 0.5) * 0.02,
          UPPER_Y + 0.055,
          -2.52 + row * 0.35,
        );
    for (let i = 180; i < game.initialCoins; i++)
      addPiece(
        game,
        "coin",
        (random() - 0.5) * 4.2,
        0.17 + Math.floor((i - 180) / 35) * 0.08,
        -0.5 + random() * 2.9,
      );
    for (let i = 0; i < 9; i++)
      addPiece(
        game,
        "stone",
        ((i % 3) - 1) * 1.35 + (random() - 0.5) * 0.25,
        0.45,
        0.5 + Math.floor(i / 3) * 0.8,
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
    game.tokens++;
    game.frontCoins++;
    game.grace = 0;
    if (game.frontCoins % 20 === 0) {
      game.pendingStones++;
      game.message = "Đủ 20 xu cửa trước! Máy thả thêm một đá ngẫu nhiên.";
    } else
      game.message = `Xu cửa trước: +1 điểm, +1 lượt. Tiến độ đá ${game.frontCoins % 20}/20 xu.`;
  } else {
    game.collected++;
    game.score += 20;
    game.bonuses.push([4, 6, 8, 12][Math.floor(game.random() * 4)]);
    game.message = `Đã nhận ${game.collected} đá! Màu nào cũng tính, bộ ${game.collected % 6}/6.`;
    if (game.collected % 6 === 0) {
      game.bonuses.push(30);
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
  const targetZ = -1.85 + (0.8 * (1 - Math.cos((game.time * TAU) / 3.8))) / 2;
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
          ? "SUPER BONUS / JACKPOT! 6 đá bất kỳ: +30 credit, +100 điểm!"
          : `Bonus Spin: +${reward} lượt thả xu!`;
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
