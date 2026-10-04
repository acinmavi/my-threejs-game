import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, tap, MODES } from '../src/game.js';
const playing = level => { const g = createGame(level, () => .5); g.phase = 'playing'; return g; };
const travelTime = (g, distance) => 2 * distance / (g.speed + Math.sqrt(g.speed ** 2 + 2 * MODES[g.mode].acceleration * distance));
const hit = g => { step(g, travelTime(g, g.distance)); assert.equal(tap(g), true); };
test('one accurate hit unlocks level one and stopped games ignore taps and time', () => {
  const g = playing(1); hit(g); assert.equal(g.phase, 'won'); assert.equal(g.hits, 1);
  const angle = g.angle; step(g, 10); assert.equal(g.angle, angle); assert.equal(tap(g), false);
});
test('early taps fail and a missed target fails even in one large step', () => {
  const early = playing(2); assert.equal(tap(early), false); assert.equal(early.phase, 'over');
  const missed = playing(2); step(missed, (missed.distance + missed.tolerance + .01) / missed.speed); assert.equal(missed.phase, 'over');
});
test('successful hits reverse direction and level requires exactly its hit count', () => {
  const g = playing(3); hit(g); assert.equal(g.direction, -1); assert.equal(g.progress, 0);
  hit(g); assert.equal(g.direction, 1); assert.equal(g.phase, 'playing'); hit(g); assert.equal(g.phase, 'won');
});
test('target hit window accepts both early and late sides', () => {
  for (const side of [-1, 1]) { const g = playing(2); step(g, travelTime(g, g.distance + side * g.tolerance * .9)); assert.equal(tap(g), true); }
});
test('speed rises, target window narrows, and high levels stay capped', () => {
  const first = createGame(1), later = createGame(15), high = createGame(1000);
  assert.ok(later.speed > first.speed); assert.ok(later.tolerance < first.tolerance);
  assert.equal(high.speed, 5.5); assert.equal(high.tolerance, .075);
});
test('frame partitioning does not change hits or angular motion across wrap', () => {
  const a = playing(2), b = playing(2); a.angle = b.angle = 6;
  const time = travelTime(a, a.distance); step(a, time); for (let i = 0; i < 120; i++) step(b, time / 120);
  assert.ok(Math.abs(a.angle - b.angle) < 1e-10); assert.equal(tap(a), true); assert.equal(tap(b), true);
});
test('retries reset hits, direction and progress while retaining the level', () => {
  const g = playing(4); hit(g); tap(g); const retry = createGame(g.level, () => .5);
  assert.equal(retry.level, 4); assert.equal(retry.hits, 0); assert.equal(retry.direction, 1); assert.equal(retry.progress, 0); assert.equal(retry.phase, 'ready');
});

test('all modes start equally and time acceleration is slow, medium, fast', () => {
  const speeds = [];
  for (const mode of Object.keys(MODES)) {
    const g = createGame(1, () => .5, { mode }); assert.equal(g.speed, 1.8);
    g.phase = 'playing'; g.distance = 100; step(g, 10);
    assert.equal(g.elapsed, 10); speeds.push(g.speed);
    assert.ok(Math.abs(g.speed - (1.8 + MODES[mode].acceleration * 10)) < 1e-10);
  }
  assert.ok(speeds[0] < speeds[1] && speeds[1] < speeds[2]);
});
test('ready and finished games freeze elapsed time and speed', () => {
  const g = createGame();
  for (const phase of ['ready', 'over', 'won']) { g.phase = phase; step(g, 30); assert.equal(g.elapsed, 0); assert.equal(g.speed, 1.8); }
});
test('next levels retain active time, retries reset time, invalid mode falls back', () => {
  const next = createGame(3, () => .5, { mode: 'hard', elapsed: 20 });
  assert.equal(next.elapsed, 20); assert.ok(next.speed > createGame(3).speed);
  const retry = createGame(3, () => .5, { mode: 'hard' }); assert.equal(retry.elapsed, 0);
  assert.equal(createGame(1, Math.random, { mode: 'invalid' }).mode, 'normal');
});
test('acceleration crossing the speed cap is independent of frame partitioning', () => {
  const a = createGame(1, () => .5, { mode: 'hard', elapsed: 45 }), b = createGame(1, () => .5, { mode: 'hard', elapsed: 45 });
  a.phase = b.phase = 'playing'; a.distance = b.distance = 100;
  step(a, 5); for (let i = 0; i < 500; i++) step(b, .01);
  assert.equal(a.speed, 5.5); assert.equal(b.speed, 5.5); assert.ok(Math.abs(a.progress - b.progress) < 1e-9);
});
