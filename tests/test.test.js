import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testKur, yanlisGuncelle, HARFLER } from '../js/test.js';

const soru = (id, tur, dogru = 0) => ({
  id, b: '1.1', s: 5, tur, kok: 'kök ' + id,
  siklar: ['s0-' + id, 's1-' + id, 's2-' + id, 's3-' + id, 's4-' + id], dogru, aciklama: 'açıklama',
});
const bolumler = [
  { no: 1, sorular: [soru('b1-t001', 'bilgi', 2), soru('b1-t002', 'vaka', 4), soru('b1-t003', 'bilgi', 0)] },
  { no: 2, sorular: [soru('b2-t001', 'vaka', 1), soru('b2-t002', 'vaka', 3)] },
];
const tohumlu = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

test('HARFLER', () => assert.deepEqual(HARFLER, ['A', 'B', 'C', 'D', 'E']));

test('testKur shuffles options but keeps the correct text at dogru', () => {
  let farkliSira = false;
  for (let s = 1; s <= 50; s++) {
    const t = testKur(bolumler, { nolar: [1, 2], tur: 'karisik', adet: 'hepsi', sadeceYanlislar: false }, [], tohumlu(s));
    assert.equal(t.length, 5);
    for (const q of t) {
      const asil = [...bolumler[0].sorular, ...bolumler[1].sorular].find((x) => x.id === q.id);
      assert.equal(q.siklar[q.dogru], asil.siklar[asil.dogru]);
      assert.deepEqual([...q.siklar].sort(), [...asil.siklar].sort());
      if (q.siklar.join() !== asil.siklar.join()) farkliSira = true;
    }
  }
  assert.ok(farkliSira);
  // kaynak veri değişmez
  assert.equal(bolumler[0].sorular[0].dogru, 2);
  assert.equal(bolumler[0].sorular[0].siklar[0], 's0-b1-t001');
});

test('testKur respects tur, nolar and adet', () => {
  const ids = (o) => testKur(bolumler, o, [], tohumlu(3)).map((q) => q.id).sort();
  assert.deepEqual(ids({ nolar: [1], tur: 'bilgi', adet: 'hepsi', sadeceYanlislar: false }), ['b1-t001', 'b1-t003']);
  assert.deepEqual(ids({ nolar: [1, 2], tur: 'vaka', adet: 10, sadeceYanlislar: false }), ['b1-t002', 'b2-t001', 'b2-t002']);
  assert.equal(testKur(bolumler, { nolar: [1, 2], tur: 'karisik', adet: 2, sadeceYanlislar: false }, [], tohumlu(5)).length, 2);
  assert.deepEqual(ids({ nolar: [], tur: 'karisik', adet: 'hepsi', sadeceYanlislar: false }), []);
});

test('sadeceYanlislar limits to testYanlis ids', () => {
  const t = testKur(bolumler, { nolar: [1, 2], tur: 'karisik', adet: 'hepsi', sadeceYanlislar: true }, ['b2-t002', 'b1-t003', 'yok-t1'], tohumlu(9));
  assert.deepEqual(t.map((q) => q.id).sort(), ['b1-t003', 'b2-t002']);
});

test('yanlisGuncelle adds once and removes on correct', () => {
  let l = yanlisGuncelle([], 'b1-t001', false);
  l = yanlisGuncelle(l, 'b1-t001', false);
  assert.deepEqual(l, ['b1-t001']);
  const once = Object.freeze([...l]);
  assert.deepEqual(yanlisGuncelle(once, 'b1-t001', true), []);
  assert.deepEqual(yanlisGuncelle(once, 'b1-t009', true), ['b1-t001']);
});
