import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dogrula } from '../tools/veri_dogrula.mjs';
import bolumler from '../data/index.js';

test('every chapter passes dogrula', () => {
  assert.ok(bolumler.length >= 1);
  for (const b of bolumler) assert.deepEqual(dogrula(b), [], 'Bölüm ' + b.no);
});

const soru = (i, tur) => ({
  id: 'b9-t' + String(i).padStart(3, '0'), b: '9.1', s: 10, tur,
  kok: 'kök', siklar: ['a', 'b', 'c', 'd', 'e'], dogru: 0, aciklama: 'x',
});
const temiz = () => ({
  no: 9, baslik: 'Deneme', sayfalar: [10, 20], altBolumler: { '9.1': 'alt' },
  kartlar: [{ id: 'b9-k001', b: '9.1', s: 10, q: 'q', a: 'a' }, { id: 'b9-k002', b: '9.1', s: 20, q: 'q', a: 'a' }],
  sorular: Array.from({ length: 12 }, (_, i) => soru(i + 1, i % 2 ? 'vaka' : 'bilgi')),
});

test('clean fixture passes', () => assert.deepEqual(dogrula(temiz()), []));

test('each defect yields an error', () => {
  const durumlar = {
    tekrarKimlik: (b) => { b.kartlar[1].id = 'b9-k001'; },
    sayfaDisi: (b) => { b.kartlar[0].s = 21; },
    sikSayisi: (b) => { b.sorular[0].siklar = ['a', 'b', 'c', 'd']; },
    dogruAralik: (b) => { b.sorular[0].dogru = 5; },
    kimlikBicimi: (b) => { b.sorular[0].id = 'b9-q1'; },
    vakaOrani: (b) => { b.sorular.forEach((q) => { q.tur = 'bilgi'; }); },
    altBolumYok: (b) => { b.kartlar[0].b = '9.7'; },
    bosMetin: (b) => { b.kartlar[0].a = ''; },
  };
  for (const [ad, boz] of Object.entries(durumlar)) {
    const b = temiz();
    boz(b);
    assert.ok(dogrula(b).length >= 1, ad);
  }
});

test('vaka ratio not enforced for 10 or fewer questions', () => {
  const b = temiz();
  b.sorular = b.sorular.slice(0, 10).map((q) => ({ ...q, tur: 'bilgi' }));
  assert.deepEqual(dogrula(b), []);
});
