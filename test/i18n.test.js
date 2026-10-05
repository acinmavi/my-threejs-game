import test from 'node:test';
import assert from 'node:assert/strict';
import { getLanguage, t } from '../src/i18n.js';

test('English is default, including unsupported saved languages', () => {
  for (const value of [null, 'en', 'fr', 'VI']) {
    globalThis.localStorage = { getItem: () => value };
    assert.equal(getLanguage(), 'en');
    assert.equal(t('Play', 'Chơi'), 'Play');
  }
});
test('Vietnamese uses the shared saved preference', () => {
  globalThis.localStorage = { getItem: key => key === 'sky-club-language' ? 'vi' : null };
  assert.equal(getLanguage(), 'vi');
  assert.equal(t('Play', 'Chơi'), 'Chơi');
});
test('English remains usable when storage is blocked or absent', () => {
  globalThis.localStorage = { getItem() { throw new Error('blocked'); } };
  assert.equal(t('Play', 'Chơi'), 'Play');
  delete globalThis.localStorage;
  assert.equal(getLanguage(), 'en');
});
