import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, move, step, position, carX, trainState } from '../src/game.js';
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

test('camera gives initial grace then advances and eliminates a stranded player', () => {
  const g = playing(); step(g, 1); assert.equal(g.cameraRow, 0);
  for (let i = 0; i < 3600 && g.phase === 'playing'; i++) step(g, 1 / 120);
  assert.equal(g.phase, 'over'); assert.equal(g.reason, 'camera');
});
test('roads offer larger vehicle gaps and distinct lane speeds', () => {
  const g = createGame(), a = g.lanes.get(3), b = g.lanes.get(4);
  assert.equal(a.cars.length, 2); assert.notEqual(a.speed, b.speed);
  assert.ok(Math.abs(a.cars[1].offset - a.cars[0].offset) >= 12);
});
test('river logs carry the player and unsupported water is fatal', () => {
  const g = playing(); g.row = 9; g.score = 9;
  const lane = g.lanes.get(9); lane.speed = 1; lane.direction = 1;
  lane.logs = [{ offset: 13, length: 3.8 }]; step(g, .1);
  assert.equal(g.phase, 'playing'); assert.ok(g.x > 0);
  lane.logs = []; step(g, .01); assert.equal(g.reason, 'water');
});
test('train warnings precede passage and crossing during passage is fatal', () => {
  const lane = { trainOffset: 0, direction: 1 };
  assert.equal(trainState(lane, 7.5).warning, true);
  assert.equal(trainState(lane, 7.5).active, false);
  assert.equal(trainState(lane, 9.8).active, true);
  const g = playing(); g.row = 16; g.score = 16; g.time = 9.8;
  g.lanes.get(16).trainOffset = 0; step(g, .001);
  assert.equal(g.phase, 'over'); assert.equal(g.reason, 'train');
});

test('every road leaves enough time to cross even at maximum traffic speed', () => {
  const g = playing();
  for (let score = 0; score < 240; score += 20) {
    g.score = score; g.row = score; g.phase = 'playing'; step(g, .001);
    for (const lane of g.lanes.values()) if (lane.type === 'road') {
      const largestCar = Math.max(...lane.cars.map(car => car.length));
      assert.ok((13 - largestCar - .48) / lane.speed > 2.9);
    }
  }
});

test('jumping over water is allowed but landing off a log kills the player', () => {
  const g = playing(); g.row = 8; g.score = 8; g.lanes.get(9).logs = [];
  assert.equal(move(g, 0, 1), true); step(g, .08);
  assert.equal(g.phase, 'playing'); step(g, .11);
  assert.equal(g.phase, 'over'); assert.equal(g.reason, 'water');
});

test('replaying resets camera pressure, traffic clock and death reason', () => {
  const g = createGame(); assert.equal(g.time, 0); assert.equal(g.cameraRow, 0); assert.equal(g.reason, null);
});
