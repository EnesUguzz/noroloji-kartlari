import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARALIKLAR, cevapla, vadesiGeldi, gecikme, kategori } from '../js/srs.js';

const T = '2026-11-24';

test('ARALIKLAR is [1,3,7,15]', () => {
  assert.deepEqual(ARALIKLAR, [1, 3, 7, 15]);
});
test('new card known -> tekrar(1) tomorrow', () => {
  assert.deepEqual(cevapla(undefined, true, T), { d: 'tekrar', a: 1, son: T, vade: '2026-11-25' });
});
test('new card unknown -> bilmiyorum', () => {
  assert.deepEqual(cevapla(undefined, false, T), { d: 'bilmiyorum', a: 0, son: T, vade: null });
});
test('bilmiyorum known -> due tomorrow', () => {
  const r = cevapla({ d: 'bilmiyorum', a: 0, son: '2026-11-20', vade: null }, true, T);
  assert.equal(r.vade, '2026-11-25');
  assert.equal(r.a, 1);
});
test('due tekrar(1) known -> a2, +3', () => {
  const r = cevapla({ d: 'tekrar', a: 1, son: '2026-11-24', vade: '2026-11-25' }, true, '2026-11-25');
  assert.equal(r.a, 2);
  assert.equal(r.vade, '2026-11-28');
});
test('missed day: interval counts from actual review day', () => {
  const r = cevapla({ d: 'tekrar', a: 2, son: '2026-11-25', vade: '2026-11-28' }, true, '2026-11-29');
  assert.equal(r.a, 3);
  assert.equal(r.vade, '2026-12-06');
});
test('a4 due known -> kalici', () => {
  const r = cevapla({ d: 'tekrar', a: 4, son: '2026-11-01', vade: '2026-11-16' }, true, T);
  assert.equal(r.d, 'kalici');
  assert.equal(r.vade, null);
});
test('due tekrar unknown -> bilmiyorum a0', () => {
  const r = cevapla({ d: 'tekrar', a: 3, son: '2026-11-17', vade: T }, false, T);
  assert.equal(r.d, 'bilmiyorum');
  assert.equal(r.a, 0);
});
test('not-due tekrar known -> unchanged', () => {
  const ks = { d: 'tekrar', a: 2, son: '2026-11-23', vade: '2026-11-26' };
  assert.deepEqual(cevapla(ks, true, T), ks);
});
test('not-due tekrar unknown -> bilmiyorum', () => {
  const ks = { d: 'tekrar', a: 2, son: '2026-11-23', vade: '2026-11-26' };
  assert.equal(cevapla(ks, false, T).d, 'bilmiyorum');
});
test('kalici known stays, unknown -> bilmiyorum', () => {
  const ks = { d: 'kalici', a: 4, son: '2026-11-01', vade: null };
  assert.equal(cevapla(ks, true, T).d, 'kalici');
  assert.equal(cevapla(ks, false, T).d, 'bilmiyorum');
});
test('kategori bugun / bekliyor / yeni / kalici', () => {
  assert.equal(kategori({ d: 'tekrar', a: 1, son: null, vade: T }, T), 'bugun');
  assert.equal(kategori({ d: 'tekrar', a: 1, son: null, vade: '2026-11-20' }, T), 'bugun');
  assert.equal(kategori({ d: 'tekrar', a: 1, son: null, vade: '2026-11-25' }, T), 'bekliyor');
  assert.equal(kategori(undefined, T), 'yeni');
  assert.equal(kategori({ d: 'kalici', a: 4, son: null, vade: null }, T), 'kalici');
  assert.equal(kategori({ d: 'bilmiyorum', a: 0, son: null, vade: null }, T), 'bilmiyorum');
});
test('vadesiGeldi', () => {
  assert.equal(vadesiGeldi({ d: 'tekrar', a: 1, son: null, vade: T }, T), true);
  assert.equal(vadesiGeldi({ d: 'tekrar', a: 1, son: null, vade: '2026-11-25' }, T), false);
  assert.equal(vadesiGeldi(undefined, T), false);
});
test('gecikme', () => {
  assert.equal(gecikme({ vade: '2026-11-20' }, T), 4);
});
test('cevapla does not mutate input', () => {
  const ks = Object.freeze({ d: 'tekrar', a: 1, son: '2026-11-23', vade: T });
  assert.doesNotThrow(() => cevapla(ks, true, T));
  assert.doesNotThrow(() => cevapla(ks, false, T));
});
