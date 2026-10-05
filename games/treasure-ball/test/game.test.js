import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  addBall,
  shoot,
  step,
  setAim,
  channelIndex,
  CHANNELS,
  BONUS_REWARDS,
  MAX_PIECES,
  SMALL_RADIUS,
  BIG_RADIUS,
  PLINKO_RADIUS,
} from "../src/game.js";
function fresh(random = () => 0.14) {
  const g = createGame(random, false);
  g.phase = "playing";
  return g;
}
function advance(g, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) step(g, 1 / 60);
}
function fall(g, kind = "small", x = 0, z = 2.9) {
  return addBall(g, kind, x, -0.6, z);
}
test("new round has fewer larger balls, 30 credits and a lower body cap", () => {
  const g = createGame(() => 0.5);
  assert.equal(g.tokens, 30);
  assert.equal(g.phase, "ready");
  assert.ok(g.pieces.filter((p) => p.kind === "small").length >= 100);
  assert.ok(g.pieces.filter((p) => p.kind === "small").length <= 110);
  assert.equal(MAX_PIECES, 180);
  assert.equal(SMALL_RADIUS, 0.2);
  assert.equal(BIG_RADIUS, 0.38);
  assert.equal(PLINKO_RADIUS, 0.13);
  for (const p of g.pieces)
    assert.equal(
      p.body.shapes[0].radius,
      p.kind === "small" ? SMALL_RADIUS : BIG_RADIUS,
    );
  assert.ok([3, 4].includes(g.pieces.filter((p) => p.kind === "big").length));
  assert.ok(g.pieces.some((p) => p.body.position.y > 0.6));
});
test("one press spends one credit; cooldown, zero credits and ready reject extra shots", () => {
  const g = fresh();
  setAim(g, 100);
  assert.equal(g.aim, 1.9);
  assert.ok(shoot(g));
  assert.equal(g.tokens, 29);
  assert.equal(g.plinkoBalls.length, 1);
  assert.equal(shoot(g), false);
  g.tokens = 0;
  g.cooldown = 0;
  assert.equal(shoot(g), false);
  g.phase = "ready";
  g.tokens = 5;
  assert.equal(shoot(g), false);
});
test("channel boundaries clamp and each physical exit grants its declared reward", () => {
  assert.equal(channelIndex(-5), 0);
  assert.equal(channelIndex(5), 6);
  CHANNELS.forEach((channel, i) => {
    const g = fresh();
    shoot(g);
    const b = g.plinkoBalls[0].body;
    b.position.set(-2.1 + (i + 0.5) * 0.6, 0.7, 0);
    step(g, 1 / 60);
    assert.equal(g.lastChannel, i);
    assert.equal(g.plinkoBalls.length, 0);
    assert.equal(g.tokens, 29);
    assert.equal(
      g.pendingSmall + g.pieces.filter((p) => p.kind === "small").length,
      1 + (channel.kind === "small" ? channel.amount : 0),
    );
    if (channel.kind === "big")
      assert.equal(g.pendingBig + g.generatedBig, channel.amount);
    if (channel.kind === "points") assert.equal(g.score, channel.amount);
    if (channel.kind === "key") assert.equal(g.keys, 1);
  });
});
test("three keys open a chest once and repeat without refilling credits", () => {
  const g = fresh();
  for (let i = 0; i < 6; i++) {
    g.cooldown = 0;
    shoot(g);
    g.plinkoBalls.at(-1).body.position.set(0, 0.7, 0);
    step(g, 1 / 60);
  }
  assert.equal(g.keys, 6);
  assert.equal(g.chests, 2);
  assert.equal(g.score, 400);
  assert.equal(g.tokens, 24);
  assert.equal(g.pendingBig + g.generatedBig, 2);
});
test("front small balls score once; side drops award nothing", () => {
  const g = fresh();
  fall(g);
  step(g, 1 / 60);
  assert.equal(g.score, 2);
  assert.equal(g.tokens, 30);
  step(g, 1 / 60);
  assert.equal(g.score, 2);
  fall(g, "small", 3, 1);
  step(g, 1 / 60);
  assert.equal(g.score, 2);
  assert.equal(g.frontSmall, 1);
});
test("big falls spin every reward type; physical payouts never credit the wallet", () => {
  BONUS_REWARDS.forEach((reward, i) => {
    const g = fresh(() => (i + 0.1) / BONUS_REWARDS.length);
    fall(g, "big");
    step(g, 1 / 60);
    assert.ok(g.spin);
    advance(g, 2.6);
    assert.equal(g.tokens, 30);
    assert.equal(g.lastBonus.kind, reward.kind);
    assert.equal(g.lastBonus.amount, reward.amount);
    if (reward.kind === "points") assert.equal(g.score, 10 + reward.amount);
    if (reward.kind === "small")
      assert.equal(
        g.pendingSmall + g.pieces.filter((p) => p.kind === "small").length,
        reward.amount,
      );
    if (reward.kind === "big")
      assert.equal(g.pendingBig + g.generatedBig, reward.amount);
    const selected =
      Math.round(g.bonusWheel / ((Math.PI * 2) / BONUS_REWARDS.length)) %
      BONUS_REWARDS.length;
    assert.equal(selected, i);
  });
});
test("six big balls queue six spins plus triple jackpot, including repeated sets", () => {
  const g = fresh(() => 0.2);
  for (let i = 0; i < 12; i++) fall(g, "big");
  step(g, 1 / 60);
  assert.equal(g.bonuses.length, 13);
  advance(g, 36);
  assert.equal(g.frontBig, 12);
  assert.equal(g.lastBonus.superBonus, true);
  assert.equal(g.lastBonus.amount, 300);
  assert.equal(g.tokens, 30);
  assert.equal(g.spin, null);
  assert.equal(g.bonuses.length, 0);
});
test("piece cap preserves payout queues and rejects new shots", () => {
  const g = fresh();
  for (let i = 0; i < MAX_PIECES; i++) addBall(g, "small", 0, 0.2, 0);
  g.pendingSmall = 8;
  g.rewards.push({ kind: "small", remaining: 8, aim: 0 });
  assert.equal(shoot(g), false);
  step(g, 1 / 60);
  assert.equal(g.pendingSmall, 8);
  assert.equal(g.tokens, 30);
});
test("real Plinko balls traverse pegs and finish within eight seconds", () => {
  for (const aim of [-1.8, -0.6, 0, 0.7, 1.8]) {
    const g = fresh();
    setAim(g, aim);
    shoot(g);
    advance(g, 8);
    assert.equal(g.plinkoBalls.length, 0);
    assert.ok(g.lastChannel >= 0);
    assert.equal(g.tokens, 29);
  }
});
test("final credit settles Plinko, scoring and bonus chains before game over", () => {
  const g = fresh(() => 0.14);
  g.tokens = 1;
  assert.ok(shoot(g));
  assert.equal(g.phase, "settling");
  assert.equal(shoot(g), false);
  g.plinkoBalls[0].body.position.set(-0.6, 0.7, 0);
  fall(g, "big");
  step(g, 1 / 60);
  assert.equal(g.lastChannel, 2);
  assert.equal(g.score, 35);
  assert.ok(g.spin);
  advance(g, 3);
  assert.equal(g.lastBonus.amount, 100);
  assert.ok(g.score >= 135);
  assert.equal(g.phase, "settling");
  advance(g, 15);
  assert.equal(g.phase, "over");
  assert.equal(g.tokens, 0);
  assert.equal(g.plinkoBalls.length, 0);
  assert.equal(g.rewards.length, 0);
  assert.equal(g.spin, null);
  const before = g.time;
  step(g, 1);
  assert.equal(g.time, before);
});
test("zero credits continue pending payouts; pausing skips both physics worlds", () => {
  const g = fresh();
  shoot(g);
  g.tokens = 0;
  g.pendingBig = 1;
  g.rewards.push({ kind: "big", remaining: 1, aim: 0 });
  step(g, 1 / 60);
  assert.equal(g.phase, "settling");
  assert.equal(g.generatedBig, 1);
  assert.ok(g.time > 0);
  const y = g.plinkoBalls[0].body.position.y;
  const time = g.time;
  // The UI freezes pause by skipping step; inactive phases remain frozen too.
  g.phase = "ready";
  advance(g, 1);
  assert.equal(g.time, time);
  assert.equal(g.plinkoBalls[0].body.position.y, y);
});
test("full settling table drains physical prizes with only one overflow slot", () => {
  const g = fresh(() => 0.14);
  for (let i = 0; i < MAX_PIECES; i++)
    addBall(g, "small", ((i % 10) - 4.5) * 0.44, 0.21 + Math.floor(i / 70) * 0.42, -0.18 + (Math.floor(i / 10) % 7) * 0.44);
  g.tokens = 0;
  g.pendingSmall = 8;
  g.rewards.push({ kind: "small", remaining: 8, aim: 0 });
  for (let i = 0; i < 120 * 60 && g.phase !== "over"; i++) {
    step(g, 1 / 60);
    assert.ok(g.pieces.length <= MAX_PIECES + 1);
  }
  assert.equal(g.pendingSmall, 0);
  assert.equal(g.rewards.length, 0);
  assert.equal(g.phase, "over");
});
test("table walls contain moving balls and shelf never opens a rear gap", () => {
  const g = fresh();
  const small = addBall(g, "small", 2.1, 0.15, 1);
  small.body.velocity.x = 3;
  const big = addBall(g, "big", -2, 0.4, 0);
  big.body.velocity.x = -3;
  for (let i = 0; i < 240; i++) {
    step(g, 1 / 60);
    assert.ok(g.pusher.position.z - 1.3 < -2.7);
  }
  assert.ok(small.body.position.x < 2.45);
  assert.ok(big.body.position.x > -2.45);
  assert.equal(g.lost, 0);
});

test("upper shelf carries balls, then retracts to transfer them onto lower tray", () => {
  const g = fresh();
  g.time = 1.9;
  g.pusher.position.z = -1.5;
  const ball = addBall(g, "small", 0, 0.805, -0.3);
  advance(g, 0.1);
  assert.ok(ball.body.position.y > 0.6);
  advance(g, 1.8);
  assert.ok(ball.body.position.y > 0.1 && ball.body.position.y < 0.3);
  assert.equal(g.frontSmall, 0);
  assert.equal(g.tokens, 30);
});
