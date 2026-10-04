import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, move, step, position, carX, trainState, difficulty } from '../src/game.js';
const playing = () => { const g = createGame('easy'); g.phase = 'playing'; return g; };
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
  for (const lane of g.lanes.values()) assert.ok(lane.speed <= 5.2);
});

test('camera gives initial grace then advances and eliminates a stranded player', () => {
  const g = playing(); step(g, 1); assert.equal(g.cameraRow, 0);
  for (let i = 0; i < 3600 && g.phase === 'playing'; i++) step(g, 1 / 120);
  assert.equal(g.phase, 'over'); assert.equal(g.reason, 'camera');
});
test('roads offer larger vehicle gaps and distinct lane speeds', () => {
  const g = createGame('easy'), a = g.lanes.get(3), b = g.lanes.get(4);
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
      assert.ok(((lane.period ?? 26) / 2 - largestCar - .48) / lane.speed > 2.9);
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
  const g = createGame('easy'); assert.equal(g.time, 0); assert.equal(g.cameraRow, 0); assert.equal(g.reason, null);
});

test('distance increases consecutive road lanes and traffic speed', () => {
  assert.equal(difficulty(0, 'easy').roadWidth, 2);
  assert.equal(difficulty(48, 'easy').roadWidth, 3);
  assert.equal(difficulty(96, 'easy').roadWidth, 4);
  assert.equal(difficulty(144, 'easy').roadWidth, 5);
  assert.ok(difficulty(144, 'easy').speedMultiplier > difficulty(48, 'easy').speedMultiplier);
  assert.deepEqual(difficulty(10000, 'easy'), difficulty(240, 'easy'));
  const g = playing(); g.score = 144; g.row = 144; step(g, .001);
  for (let row = 147; row <= 151; row++) assert.equal(g.lanes.get(row).type, 'road');
  assert.equal(g.lanes.get(152).type, 'grass');
  assert.equal(g.lanes.get(153).type, 'river');
  assert.equal(g.lanes.get(159).type, 'grass');
  assert.equal(g.lanes.get(160).type, 'train');
});

test('later matching lanes are faster while retaining different lane speeds', () => {
  const early = createGame('easy'), late = playing(); late.score = 240; late.row = 240; step(late, .001);
  assert.ok(late.lanes.get(243).speed > early.lanes.get(3).speed * 2);
  assert.notEqual(late.lanes.get(243).speed, late.lanes.get(244).speed);
  assert.ok(late.lanes.get(243).period > 26);
});

test('vehicles wrap at their expanded lane period', () => {
  const lane = { speed: 4, direction: 1, period: 40 }, car = { offset:20 };
  assert.equal(carX(lane, car, 1), 4);
  assert.equal(carX(lane, car, 11), 4);
});

test('normal is default and hard starts faster with earlier wide roads', () => {
  assert.equal(createGame().mode, 'normal'); assert.equal(createGame('unknown').mode, 'normal');
  const easy = createGame('easy'), normal = createGame('normal'), hard = createGame('hard');
  assert.ok(normal.lanes.get(3).speed > easy.lanes.get(3).speed * 1.5);
  assert.ok(hard.lanes.get(3).speed > normal.lanes.get(3).speed);
  assert.equal(difficulty(48, 'normal').roadWidth, 4); assert.equal(difficulty(48, 'hard').roadWidth, 5);
  assert.ok(difficulty(48, 'hard').speedMultiplier > difficulty(48, 'normal').speedMultiplier);
});
test('all modes retain usable crossing gaps at maximum speed', () => {
  for (const mode of ['easy', 'normal', 'hard']) {
    const g = createGame(mode);
    for (let score = 0; score <= 288; score += 24) {
      g.score = g.row = score; g.phase = 'playing'; step(g, .001);
      for (const lane of g.lanes.values()) if (lane.type === 'road') {
        const largestCar = Math.max(...lane.cars.map(car => car.length));
        const gap = (lane.period / 2 - largestCar - .48) / lane.speed;
        assert.ok(gap >= .8 - 1e-9, `${mode} row ${lane.row}: ${gap}`);
      }
    }
  }
});
test('hard camera starts earlier and pause freezes its clock', () => {
  const normal = createGame('normal'), hard = createGame('hard'); normal.phase = hard.phase = 'playing';
  for (let i = 0; i < 480; i++) { step(normal, 1 / 120); step(hard, 1 / 120); }
  assert.equal(normal.cameraRow, 0); assert.ok(hard.cameraRow > .7);
  const time = hard.time, camera = hard.cameraRow; hard.phase = 'ready'; step(hard, 10);
  assert.equal(hard.time, time); assert.equal(hard.cameraRow, camera);
  const replay = createGame('hard'); assert.equal(replay.mode, 'hard'); assert.equal(replay.time, 0);
});
