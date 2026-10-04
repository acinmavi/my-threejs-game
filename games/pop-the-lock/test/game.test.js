import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, tap } from '../src/game.js';
const playing = level => { const g = createGame(level, () => .5); g.phase = 'playing'; return g; };
const hit = g => { step(g, g.distance / g.speed); assert.equal(tap(g), true); };
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
  for (const side of [-1, 1]) { const g = playing(2); step(g, (g.distance + side * g.tolerance * .9) / g.speed); assert.equal(tap(g), true); }
});
test('speed rises, target window narrows, and high levels stay capped', () => {
  const first = createGame(1), later = createGame(15), high = createGame(1000);
  assert.ok(later.speed > first.speed); assert.ok(later.tolerance < first.tolerance);
  assert.equal(high.speed, 5.5); assert.equal(high.tolerance, .075);
});
test('frame partitioning does not change hits or angular motion across wrap', () => {
  const a = playing(2), b = playing(2); a.angle = b.angle = 6;
  const time = a.distance / a.speed; step(a, time); for (let i = 0; i < 120; i++) step(b, time / 120);
  assert.ok(Math.abs(a.angle - b.angle) < 1e-10); assert.equal(tap(a), true); assert.equal(tap(b), true);
});
test('retries reset hits, direction and progress while retaining the level', () => {
  const g = playing(4); hit(g); tap(g); const retry = createGame(g.level, () => .5);
  assert.equal(retry.level, 4); assert.equal(retry.hits, 0); assert.equal(retry.direction, 1); assert.equal(retry.progress, 0); assert.equal(retry.phase, 'ready');
});
