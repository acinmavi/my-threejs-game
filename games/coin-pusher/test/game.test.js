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

test("round starts with 50 credits, 50% more board coins and nine stones", () => {
  const g = createGame(seeded());
  assert.equal(g.tokens, 50);
  assert.equal(g.phase, "ready");
  assert.ok(g.initialCoins >= 236 && g.initialCoins <= 281);
  assert.equal(g.pieces.filter((p) => p.kind === "stone").length, 9);
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
  assert.equal(g.tokens, 51);
  assert.equal(g.frontCoins, 1);
  step(g, 1 / 60);
  assert.equal(g.score, 1);
  fall(g, "coin", 2.9, 1);
  step(g, 1 / 60);
  assert.equal(g.lost, 1);
  assert.equal(g.frontCoins, 1);
});
test("every twenty front coins create one random stone, including repeated milestones", () => {
  const g = fresh();
  for (let i = 0; i < 19; i++) {
    fall(g);
    step(g, 1 / 60);
  }
  assert.equal(g.generatedStones, 0);
  fall(g);
  step(g, 1 / 60);
  step(g, 1 / 60);
  assert.equal(g.frontCoins, 20);
  assert.equal(g.generatedStones, 1);
  assert.equal(g.pieces.filter((p) => p.kind === "stone").length, 1);
  for (let i = 0; i < 40; i++) {
    fall(g);
    step(g, 1 / 60);
  }
  advance(g, 0.4);
  assert.equal(g.frontCoins, 60);
  assert.equal(g.generatedStones, 3);
  assert.equal(g.pieces.filter((p) => p.kind === "stone").length, 3);
});
test("each stone triggers Bonus Spin even when every color is identical", () => {
  const g = fresh();
  fall(g, "stone", 0, 2.8, 0);
  step(g, 1 / 60);
  assert.equal(g.collected, 1);
  assert.equal(g.score, 20);
  assert.equal(g.tokens, 50);
  advance(g, 1.3);
  assert.equal(g.tokens, 58);
  fall(g, "stone", 0, 2.8, 0);
  step(g, 1 / 60);
  advance(g, 1.3);
  assert.equal(g.collected, 2);
  assert.equal(g.score, 40);
  assert.equal(g.tokens, 66);
  assert.equal(
    g.pieces.length,
    0,
    "collected stones only replenish through twenty-coin milestones",
  );
});
test("each six stones grant Super Bonus and Jackpot; side loss grants neither bonus nor respawn", () => {
  const g = fresh();
  fall(g, "stone", 2.9, 1, 0);
  step(g, 1 / 60);
  assert.equal(g.collected, 0);
  assert.equal(g.pieces.length, 0);
  for (let i = 0; i < 6; i++) fall(g, "stone", 0, 2.8, 0);
  step(g, 1 / 60);
  assert.equal(g.score, 220);
  advance(g, 9);
  assert.equal(g.tokens, 128);
  assert.equal(g.lastBonus, 30);
  for (let i = 0; i < 6; i++) fall(g, "stone", 0, 2.8, 0);
  step(g, 1 / 60);
  advance(g, 9);
  assert.equal(g.collected, 12);
  assert.equal(g.score, 440);
  assert.equal(g.tokens, 206);
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
  assert.equal(g.tokens, 1);
  assert.equal(g.grace, 0);
  g.tokens = 0;
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
  g.pusher.position.z = -1.05;
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
