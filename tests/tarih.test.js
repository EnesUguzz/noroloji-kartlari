import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bugun, gunEkle, gunFarki } from '../js/tarih.js';

test('gunEkle crosses month end', () => {
  assert.equal(gunEkle('2026-02-27', 3), '2026-03-02');
});
test('gunFarki is b - a in days', () => {
  assert.equal(gunFarki('2026-11-20', '2026-11-24'), 4);
});
test('bugun uses local date', () => {
  assert.equal(bugun(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});
