import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, move, step, position, carX } from '../src/game.js';
const playing = () => { const g = createGame(); g.phase = 'playing'; return g; };
test('forward hop advances one row and awards a point on landing', () => {
  const g = playing(); assert.equal(move(g, 0, 1), true);
  assert.equal(g.score, 0); step(g, .2);
  assert.equal(g.row, 1); assert.equal(g.score, 1); assert.equal(g.hop, null);
});
test('sideways and backwards movement cannot farm points', () => {
  const g = playing(); move(g, 0, 1); step(g, .2);
  move(g, 1, 0); step(g, .2); move(g, 0, -1); step(g, .2);
  move(g, 0, 1); step(g, .2); assert.equal(g.score, 1);
});
test('hops cannot overlap and interpolate through the cell', () => {
  const g = playing(); move(g, 0, 1);
  assert.equal(move(g, 1, 0), false); step(g, .08);
  const p = position(g); assert.ok(p.row > 0 && p.row < 1); assert.ok(p.height > 0);
});
test('world boundaries and tree obstacles reject movement', () => {
  const g = playing(); g.x = 4; assert.equal(move(g, 1, 0), false);
  g.x = 0; g.lanes.get(1).blocked.add(0); assert.equal(move(g, 0, 1), false);
  assert.equal(move(g, 0, -1), false);
});
test('traffic collision ends the game even when standing still', () => {
  const g = playing(); g.row = 3;
  const lane = g.lanes.get(3); lane.type = 'road'; lane.speed = 0;
  lane.cars = [{ offset: 13, length: 1.6, color: '#fff' }];
  step(g, .01); assert.equal(g.phase, 'over');
  const time = g.time; step(g, 1); assert.equal(g.time, time);
  assert.equal(move(g, 0, 1), false);
});
test('traffic wraps and moves in both directions', () => {
  const car = { offset: 13 }, right = { speed: 2, direction: 1 }, left = { speed: 2, direction: -1 };
  assert.equal(carX(right, car, 1), 2); assert.equal(carX(left, car, 1), -2);
  assert.equal(carX(right, car, 14), 2);
});
test('long runs keep only nearby lanes and speed growth is capped', () => {
  const g = playing(); g.row = 100; g.score = 100; step(g, .001);
  assert.ok(g.lanes.has(118)); assert.ok(!g.lanes.has(0)); assert.ok(g.lanes.size < 35);
  for (const lane of g.lanes.values()) assert.ok(lane.speed <= 4.5);
});
