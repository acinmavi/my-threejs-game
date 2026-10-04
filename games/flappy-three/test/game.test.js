import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, flap, step, difficulty } from '../src/game.js';

test('first flap starts a run and gives upward velocity', () => {
  const g = createGame(); flap(g);
  assert.equal(g.phase, 'playing'); assert.ok(g.velocity > 0);
});
test('gravity eventually kills an unattended bird', () => {
  const g = createGame(); flap(g);
  for (let i = 0; i < 240; i++) step(g, 1 / 60);
  assert.equal(g.phase, 'over');
});
test('a pipe intersecting the bird outside its gap kills it', () => {
  const g = createGame(); flap(g); g.y = 2.5;
  g.pipes = [{ x: 0, gapY: 0, passed: false }]; step(g, 1 / 120);
  assert.equal(g.phase, 'over');
});
test('passing through a gap awards exactly one point', () => {
  const g = createGame(); flap(g); g.velocity = 0;
  g.pipes = [{ x: -0.85, gapY: 0, passed: false }];
  step(g, 1 / 60); step(g, 1 / 60);
  assert.equal(g.phase, 'playing'); assert.equal(g.score, 1);
});
test('dead runs freeze until reset', () => {
  const g = createGame(); g.phase = 'over'; const y = g.y;
  flap(g); step(g, 1); assert.equal(g.y, y); assert.equal(g.phase, 'over');
});
test('equivalent elapsed time gives consistent physics across frame rates', () => {
  const a = createGame(), b = createGame(); flap(a); flap(b);
  for (let i = 0; i < 30; i++) step(a, 1 / 60);
  for (let i = 0; i < 60; i++) step(b, 1 / 120);
  assert.ok(Math.abs(a.y - b.y) < 0.001);
});

test('speed rises and pipe gaps narrow over active play time with a cap', () => {
  const start = difficulty(0), middle = difficulty(45), end = difficulty(90);
  assert.ok(start.speed < middle.speed && middle.speed < end.speed);
  assert.ok(start.gap > middle.gap && middle.gap > end.gap);
  assert.ok(end.spacing < start.spacing);
  assert.ok(end.heightRange > start.heightRange);
  assert.deepEqual(difficulty(1000), end);
});

test('elapsed difficulty time advances only during active gameplay and resets', () => {
  const g = createGame(); step(g, 1); assert.equal(g.elapsed, 0);
  flap(g); step(g, .1); assert.equal(g.elapsed, .1);
  g.phase = 'over'; step(g, 1); assert.equal(g.elapsed, .1);
  assert.equal(createGame().elapsed, 0);
});

test('late pipes use narrower gaps and limit vertical jumps between neighbors', () => {
  const g = createGame(); flap(g); g.elapsed = 90;
  g.pipes = [{ x: 3, gapY: -1.5, gap: 2.7, passed: false }];
  step(g, 1 / 120, () => 1);
  const pipe = g.pipes.at(-1);
  assert.equal(pipe.gap, difficulty(90).gap);
  assert.ok(Math.abs(pipe.gapY - g.pipes[0].gapY) <= 1.6);
  assert.equal(g.pipes[0].gap, 2.7);
});

test('collision follows each pipe gap rather than the initial gap size', () => {
  const g = createGame(); flap(g); g.y = 1;
  g.pipes = [{ x: 0, gapY: 0, gap: 1.7, passed: false }];
  step(g, 1 / 120); assert.equal(g.phase, 'over');
});
