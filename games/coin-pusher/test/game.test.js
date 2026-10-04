import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  addPiece,
  shoot,
  step,
  setAim,
  targetHit,
  MAX_PIECES,
} from "../src/game.js";
const fresh = () => {
  const game = createGame(() => 0.5, false);
  game.phase = "playing";
  return game;
};
const advance = (g, seconds) => {
  for (let i = 0; i < seconds * 120; i++) step(g, 1 / 120);
};
const fall = (g, kind = "coin", x = 0, z = 2.8, stone = -1) =>
  addPiece(g, kind, x, -0.5, z, stone);

test("round starts with 50 tokens, six stones, finite settled bodies", () => {
  const g = createGame(() => 0.5);
  assert.equal(g.tokens, 50);
  assert.equal(g.phase, "ready");
  assert.equal(g.pieces.filter((p) => p.kind === "stone").length, 6);
  for (const p of g.pieces) assert.ok(Number.isFinite(p.body.position.y));
  const t = g.time;
  step(g, 1);
  assert.equal(g.time, t);
});
test("shot costs one token, cooldown and empty balance prevent extra shots", () => {
  const g = fresh();
  g.wheel = 0.3;
  assert.equal(shoot(g), true);
  assert.equal(g.tokens, 49);
  assert.equal(g.pieces.length, 1);
  assert.equal(shoot(g), false);
  advance(g, 0.3);
  g.tokens = 0;
  assert.equal(shoot(g), false);
  g.phase = "over";
  g.tokens = 10;
  assert.equal(shoot(g), false);
});
test("aim clamps and token spawns in selected lane", () => {
  const g = fresh();
  setAim(g, 100);
  assert.equal(g.aim, 2.1);
  g.wheel = 0.3;
  shoot(g);
  assert.equal(g.pieces[0].body.position.x, 2.1);
  setAim(g, -100);
  assert.equal(g.aim, -2.1);
});
test("moving target timing gives two bonus tokens only within window", () => {
  assert.equal(targetHit(0), true);
  assert.equal(targetHit(Math.PI / 3), true);
  assert.equal(targetHit(-0.04), true);
  assert.equal(targetHit(0.3), false);
  const g = fresh();
  g.wheel = 0;
  shoot(g);
  assert.equal(g.tokens, 51);
  assert.equal(g.wheelHits, 1);
});
test("front coin rewards exactly once; side gutter loses coin", () => {
  const g = fresh();
  fall(g);
  step(g, 1 / 120);
  assert.equal(g.score, 1);
  assert.equal(g.tokens, 51);
  step(g, 1 / 120);
  assert.equal(g.score, 1);
  fall(g, "coin", 2.9, 1);
  step(g, 1 / 120);
  assert.equal(g.lost, 1);
  assert.equal(g.score, 1);
});
test("every stone counts, including repeated colors, and grants delayed bonus", () => {
  const g = fresh();
  fall(g, "stone", 0, 2.8, 0);
  step(g, 1 / 120);
  assert.equal(g.collected, 1);
  assert.equal(g.score, 20);
  assert.equal(g.tokens, 50);
  advance(g, 1.3);
  assert.equal(g.tokens, 58);
  fall(g, "stone", 0, 2.8, 0);
  step(g, 1 / 120);
  assert.equal(g.collected, 2);
  assert.equal(g.score, 40);
  advance(g, 1.3);
  assert.equal(g.tokens, 66);
});
test("every six stones of the same color earn Super Bonus; side loss recycles", () => {
  const g = fresh();
  fall(g, "stone", 2.9, 1, 0);
  step(g, 1 / 120);
  assert.equal(g.collected, 0);
  assert.equal(g.pieces.filter((p) => p.kind === "stone").length, 1);
  for (let i = 0; i < 6; i++) fall(g, "stone", 0, 2.8, 0);
  step(g, 1 / 120);
  assert.equal(g.collected, 6);
  assert.equal(g.score, 220);
  advance(g, 9);
  assert.equal(g.tokens, 128);
  assert.equal(g.lastBonus, 30);
  for (let i = 0; i < 6; i++) fall(g, "stone", 0, 2.8, 0);
  step(g, 1 / 120);
  assert.equal(g.collected, 12);
  assert.equal(g.score, 440);
  advance(g, 9);
  assert.equal(g.tokens, 206);
});
test("last shot gets settling grace; a front win resumes play", () => {
  const g = fresh();
  g.tokens = 0;
  advance(g, 7);
  assert.equal(g.phase, "playing");
  fall(g);
  step(g, 1 / 120);
  assert.equal(g.tokens, 1);
  assert.equal(g.grace, 0);
  g.tokens = 0;
  advance(g, 8.1);
  assert.equal(g.phase, "over");
  const t = g.time;
  step(g, 1);
  assert.equal(g.time, t);
  const restarted = fresh();
  assert.equal(restarted.tokens, 50);
  assert.equal(restarted.score, 0);
});
test("real rigid bodies fall, rest on floor and pusher moves at fixed timestep", () => {
  const g = fresh();
  const coin = addPiece(g, "coin", 0, 1, 1);
  const start = g.pusher.position.z;
  advance(g, 0.5);
  assert.ok(coin.body.position.y < 0.8);
  assert.ok(g.pusher.position.z > start);
  advance(g, 2);
  assert.ok(coin.body.position.y >= 0.02 && coin.body.position.y < 0.2);
});
test("piece cap prevents spending a token without creating a shot", () => {
  const g = fresh();
  for (let i = 0; i < MAX_PIECES; i++) addPiece(g, "coin", 0, 10 + i, 0);
  assert.equal(shoot(g), false);
  assert.equal(g.tokens, 50);
});

test("starting pile count is dense and random across rounds", () => {
  const low = createGame(() => 0.1),
    high = createGame(() => 0.9);
  const count = (g) => g.pieces.filter((p) => p.kind === "coin").length;
  assert.equal(count(low), 160);
  assert.equal(count(high), 184);
  assert.notEqual(
    low.pieces[0].body.position.x,
    high.pieces[0].body.position.x,
  );
});
test("pusher wakes the full pile so sleeping front rows can move and fall", () => {
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const g = createGame(random);
  g.phase = "playing";
  for (let i = 0; i < 60 * 5; i++) step(g, 1 / 60);
  assert.ok(g.score > 0, "dense starting pile must produce front coin drops");
});
