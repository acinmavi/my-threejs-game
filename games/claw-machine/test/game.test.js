import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, step, grab, CHUTE } from "../src/game.js";
const playing = () => {
  const g = createGame(() => 0.5);
  g.phase = "playing";
  return g;
};
function cycle(g) {
  for (let i = 0; i < 1100 && g.phase === "playing" && g.stage !== "aim"; i++)
    step(g, 1 / 120);
}
test("round has three attempts and grabbing cannot consume twice during animation", () => {
  const g = playing();
  assert.equal(g.attempts, 3);
  assert.equal(grab(g), true);
  assert.equal(g.attempts, 2);
  assert.equal(grab(g), false);
  assert.equal(g.attempts, 2);
  cycle(g);
  assert.equal(g.stage, "aim");
  assert.equal(g.timer, 20);
});
test("carriage respects cabinet bounds and diagonal movement has equal speed", () => {
  const a = playing(),
    b = playing();
  step(a, 1, 1, 0);
  step(b, 1, 1, 1);
  assert.ok(Math.abs(Math.hypot(b.x, b.z) - a.x) < 1e-10);
  step(a, 10, 1, 1);
  assert.equal(a.x, 2.2);
  assert.equal(a.z, 1.45);
});
test("centered grip can deliver a bear into the chute", () => {
  const g = playing(),
    b = g.bears[0];
  g.x = b.x;
  g.z = b.z;
  grab(g);
  cycle(g);
  assert.equal(g.score, 1);
  assert.equal(b.collected, true);
  assert.equal(g.attempts, 2);
});
test("an off-center grip slips and does not award a bear", () => {
  const g = playing(),
    b = g.bears[0];
  g.x = b.x + 0.22;
  g.z = b.z;
  grab(g);
  cycle(g);
  assert.equal(g.score, 0);
  assert.equal(b.collected, false);
  assert.ok(b.y >= 0.48);
});
test("three empty attempts finish the round after the full animation", () => {
  const g = playing();
  for (let i = 0; i < 3; i++) {
    g.x = 2.1;
    g.z = -1.4;
    grab(g);
    assert.equal(g.phase, "playing");
    cycle(g);
  }
  assert.equal(g.attempts, 0);
  assert.equal(g.phase, "over");
  const time = g.stageTime;
  step(g, 10);
  assert.equal(g.stageTime, time);
  assert.equal(grab(g), false);
});
test("aiming timeout uses exactly one attempt and ready state freezes the clock", () => {
  const g = createGame(() => 0.5);
  step(g, 30);
  assert.equal(g.timer, 20);
  g.phase = "playing";
  step(g, 20);
  assert.equal(g.stage, "descend");
  assert.equal(g.attempts, 2);
  step(g, 0.1);
  assert.equal(g.attempts, 2);
});
test("prizes count once only after falling into the delivery chute", () => {
  const g = playing(),
    b = g.bears[0];
  b.x = CHUTE.x;
  b.z = CHUTE.z;
  b.y = 0.02;
  step(g, 0.01);
  assert.equal(g.score, 1);
  step(g, 1);
  assert.equal(g.score, 1);
});
test("new rounds reset attempts, score, carried prize and countdown", () => {
  const g = playing();
  g.score = 2;
  grab(g);
  const fresh = createGame(() => 0.5);
  assert.equal(fresh.attempts, 3);
  assert.equal(fresh.score, 0);
  assert.equal(fresh.carried, null);
  assert.equal(fresh.timer, 20);
  assert.equal(fresh.phase, "ready");
});
