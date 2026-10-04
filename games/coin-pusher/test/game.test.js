import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  addPiece,
  shoot,
  step,
  setAim,
  wheelAward,
  WHEEL_VALUES,
  MAX_PIECES,
  UPPER_Y,
} from "../src/game.js";
const fresh = () => {
  const g = createGame(() => 0.5, false);
  g.phase = "playing";
  return g;
};
const advance = (g, seconds) => {
  for (let i = 0; i < seconds * 60; i++) step(g, 1 / 60);
};
const fall = (g, kind = "coin", x = 0, z = 2.8, stone = -1) =>
  addPiece(g, kind, x, -1.5, z, stone);
function seeded() {
  let seed = 42;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test("round starts lighter with 50 credits, 156–180 coins and four or five stones", () => {
  const g = createGame(seeded());
  assert.equal(g.tokens, 50);
  assert.equal(g.phase, "ready");
  assert.ok(g.initialCoins >= 156 && g.initialCoins <= 180);
  assert.ok([4, 5].includes(g.pieces.filter((p) => p.kind === "stone").length));
  assert.equal(MAX_PIECES, 260);
  assert.ok(
    g.pieces.filter((p) => p.kind === "coin" && p.body.position.y > 0.5)
      .length >= 30,
  );
  for (const p of g.pieces) assert.ok(Number.isFinite(p.body.position.y));
  step(g, 1);
  assert.equal(g.time, 0);
});
test("one credit shoots one visible token; cooldown and empty balance reject extra shots", () => {
  const g = fresh();
  assert.equal(shoot(g), true);
  assert.equal(g.tokens, 49);
  assert.equal(g.flights.length, 1);
  assert.equal(g.pieces.length, 0);
  assert.equal(shoot(g), false);
  advance(g, 0.8);
  g.tokens = 0;
  assert.equal(shoot(g), false);
  g.phase = "over";
  g.tokens = 10;
  assert.equal(shoot(g), false);
});
test("wheel selects the numbered sector under the marker including 15", () => {
  WHEEL_VALUES.forEach((value, i) =>
    assert.equal(wheelAward((i * Math.PI * 2) / WHEEL_VALUES.length), value),
  );
  assert.equal(wheelAward(-Math.PI / 4), WHEEL_VALUES[7]);
  assert.equal(wheelAward(Math.PI * 2), WHEEL_VALUES[0]);
});
test("15-sector produces exactly fifteen reward coins plus the original fired token on upper shelf", () => {
  const g = fresh();
  setAim(g, 1.2);
  g.time = (6 * Math.PI * 2) / 8 / 1.25 - 0.6;
  shoot(g);
  advance(g, 0.6);
  assert.equal(g.lastWheel, 15);
  assert.equal(g.tokens, 49);
  assert.equal(
    g.pendingCoins + g.pieces.filter((p) => p.kind === "coin").length,
    16,
  );
  advance(g, 1.3);
  assert.equal(g.pendingCoins, 0);
  assert.equal(g.pieces.filter((p) => p.kind === "coin").length, 16);
  assert.ok(g.pieces.some((p) => p.body.position.y > UPPER_Y));
  assert.ok(g.pieces.every((p) => Math.abs(p.body.position.x - 1.2) < 0.5));
});
test("aim clamps and is captured when firing instead of changing an in-flight reward lane", () => {
  const g = fresh();
  setAim(g, 100);
  assert.equal(g.aim, 2.1);
  shoot(g);
  setAim(g, -100);
  assert.equal(g.aim, -2.1);
  assert.equal(g.flights[0].aim, 2.1);
});
test("front coin rewards exactly once and side losses do not advance stone progress", () => {
  const g = fresh();
  fall(g);
  step(g, 1 / 60);
  assert.equal(g.score, 1);
  assert.equal(g.tokens, 50);
  assert.equal(g.frontCoins, 1);
  step(g, 1 / 60);
  assert.equal(g.score, 1);
  fall(g, "coin", 2.9, 1);
  step(g, 1 / 60);
  assert.equal(g.lost, 1);
  assert.equal(g.frontCoins, 1);
});
test("every fifty coin points create one random stone, ignoring other points", () => {
  const g = fresh();
  g.score = 500; // Bonus points never advance the coin-only milestone.
  for (let i = 0; i < 49; i++) {
    fall(g);
    step(g, 1 / 60);
  }
  assert.equal(g.generatedStones, 0);
  fall(g);
  step(g, 1 / 60);
  step(g, 1 / 60);
  assert.equal(g.frontCoins, 50);
  assert.equal(g.generatedStones, 1);
  assert.equal(g.pieces.filter((p) => p.kind === "stone").length, 1);
  for (let i = 0; i < 100; i++) {
    fall(g);
    step(g, 1 / 60);
  }
  advance(g, 0.4);
  assert.equal(g.frontCoins, 150);
  assert.equal(g.generatedStones, 3);
  assert.equal(g.pieces.filter((p) => p.kind === "stone").length, 3);
});
test("each stone queues its own wheel, with coins, stones or points and no credits", () => {
  for (const [random, kind, amount] of [
    [0, "coins", 8],
    [0.26, "stones", 1],
    [0.14, "points", 50],
  ]) {
    const g = fresh();
    g.random = () => random;
    fall(g, "stone", 0, 2.8, 0);
    step(g, 1 / 60);
    assert.equal(g.collected, 1);
    assert.equal(g.spin.reward.kind, kind);
    assert.equal(g.tokens, 50);
    advance(g, 2.5);
    assert.equal(g.lastBonus.amount, amount);
    assert.equal(g.tokens, 50);
    if (kind === "coins")
      assert.equal(
        g.pendingCoins + g.pieces.filter((p) => p.kind === "coin").length,
        amount,
      );
    if (kind === "stones")
      assert.equal(g.pendingStones + g.generatedStones, amount);
    if (kind === "points") assert.equal(g.score, 20 + amount);
    const angle =
      ((g.bonusWheel % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    assert.ok(Math.abs(angle - (Math.floor(random * 8) * Math.PI) / 4) < 1e-8);
  }
});
test("any six stones queue six spins and a triple Super Bonus; side loss does not count", () => {
  const g = fresh();
  g.random = () => 0.14; // points keep the assertion independent of physical coin drops
  fall(g, "stone", 2.9, 1, 0);
  step(g, 1 / 60);
  assert.equal(g.collected, 0);
  for (let i = 0; i < 6; i++) fall(g, "stone", 0, 2.8, 0);
  step(g, 1 / 60);
  assert.equal(g.bonuses.length, 6);
  assert.equal(g.score, 220);
  advance(g, 18);
  assert.equal(g.tokens, 50);
  assert.equal(g.lastBonus.superBonus, true);
  assert.equal(g.lastBonus.amount, 150);
  assert.equal(g.score, 670);
  assert.equal(g.spin, null);
  assert.equal(g.bonuses.length, 0);
});
test("last credit waits for in-flight token, reward rain, bonuses and settling grace", () => {
  const g = fresh();
  g.tokens = 1;
  shoot(g);
  advance(g, 0.5);
  assert.equal(g.phase, "playing");
  assert.equal(g.grace, 0);
  advance(g, 6);
  assert.equal(g.phase, "playing");
  fall(g);
  step(g, 1 / 60);
  assert.equal(g.tokens, 0);
  assert.ok(g.grace < 0.02);
  advance(g, 8.1);
  assert.equal(g.phase, "over");
  const t = g.time;
  step(g, 1);
  assert.equal(g.time, t);
  assert.equal(fresh().tokens, 50);
});
test("upper shelf supports physical tokens and its retreat drops them to lower level", () => {
  const g = fresh();
  g.time = 1.9;
  g.pusher.position.z = -1.5;
  const coin = addPiece(g, "coin", 0, 0.65, -0.3);
  advance(g, 0.1);
  assert.ok(coin.body.position.y > 0.5);
  advance(g, 1.8);
  assert.ok(
    coin.body.position.y < 0.3,
    "upper coin should fall onto stationary lower floor",
  );
  assert.ok(coin.body.position.y > 0.01);
});
test("piece cap preserves credits and queues an exact reward instead of discarding it", () => {
  const g = fresh();
  for (let i = 0; i < MAX_PIECES; i++) addPiece(g, "coin", 0, 10 + i, 0);
  assert.equal(shoot(g), false);
  assert.equal(g.tokens, 50);
  g.rewards.push({ remaining: 15, aim: 0 });
  g.pendingCoins = 15;
  step(g, 1 / 60);
  assert.equal(g.pendingCoins, 15);
});
test("starting pile varies across rounds and real two-tier strokes produce front coin drops", () => {
  const g = createGame(seeded()),
    other = createGame(() => 0.9);
  assert.notEqual(g.initialCoins, other.initialCoins);
  g.phase = "playing";
  advance(g, 5);
  assert.ok(
    g.frontCoins > 0,
    "dense starting pile must have physical front drops",
  );
});

test("side walls contain coins and stones; rear shelf stays covered throughout stroke", () => {
  const g = fresh();
  const coin = addPiece(g, "coin", 2.2, 0.1, 1);
  coin.body.velocity.x = 3;
  const stone = addPiece(g, "stone", -2.1, 0.4, 0);
  stone.body.velocity.x = -3;
  for (let i = 0; i < 60 * 4; i++) {
    step(g, 1 / 60);
    assert.ok(g.pusher.position.z - g.pusher.shapes[0].halfExtents.z < -2.7);
    assert.ok(coin.body.position.x < 2.5 && stone.body.position.x > -2.5);
  }
  assert.equal(g.lost, 0);
  assert.ok(coin.body.position.y >= 0);
  assert.ok(stone.body.position.y >= 0);
});
