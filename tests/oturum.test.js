import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kartSec, oturumKur, oturumCevap, oturumGeriAl, sonrakiTur, bolumOzeti } from '../js/oturum.js';

const T = '2026-11-24';
const k = (id, b, s) => ({ id, b, s, q: 'q' + id, a: 'a' + id });
const bolumler = [
  { no: 1, kartlar: [k('b1-k001', '1.1', 2), k('b1-k002', '1.1', 3), k('b1-k003', '1.2', 9)] },
  { no: 2, kartlar: [k('b2-k001', '2.1', 61), k('b2-k002', '2.1', 62), k('b2-k003', '2.2', 70)] },
];
const ilerleme = () => ({
  v: 1,
  kartlar: {
    'b1-k001': { d: 'tekrar', a: 2, son: '2026-11-20', vade: '2026-11-23' }, // 1 gün gecikmiş
    'b1-k002': { d: 'bilmiyorum', a: 0, son: '2026-11-23', vade: null },
    'b2-k001': { d: 'tekrar', a: 1, son: '2026-11-19', vade: '2026-11-20' }, // 4 gün gecikmiş
    'b2-k002': { d: 'tekrar', a: 3, son: '2026-11-22', vade: '2026-11-29' }, // bekliyor
    'b2-k003': { d: 'kalici', a: 4, son: '2026-11-01', vade: null },
  },
  testYanlis: [],
  ayar: { karistir: false },
});
const ids = (l) => l.map((x) => x.id);

test('kartSec filters by nolar and filtre', () => {
  const p = ilerleme();
  const sec = (nolar, filtre) => ids(kartSec(bolumler, p, { nolar, filtre }, T));
  assert.deepEqual(sec([1, 2], 'tumu'), ['b1-k001', 'b1-k002', 'b1-k003', 'b2-k001', 'b2-k002', 'b2-k003']);
  assert.deepEqual(sec([1], 'tumu'), ['b1-k001', 'b1-k002', 'b1-k003']);
  assert.deepEqual(sec([1, 2], 'yeni'), ['b1-k003']);
  assert.deepEqual(sec([1, 2], 'bilmediklerim'), ['b1-k002']);
  assert.deepEqual(sec([2], 'ogrendiklerim'), ['b2-k001', 'b2-k002', 'b2-k003']);
  assert.equal(kartSec(bolumler, p, { nolar: [2], filtre: 'tumu' }, T)[0].no, 2);
});

test('kartSec bugun sorts most overdue first', () => {
  assert.deepEqual(ids(kartSec(bolumler, ilerleme(), { nolar: [1, 2], filtre: 'bugun' }, T)), ['b2-k001', 'b1-k001']);
});

test('kartSec returns [] for empty filters', () => {
  assert.deepEqual(kartSec(bolumler, ilerleme(), { nolar: [], filtre: 'tumu' }, T), []);
  assert.deepEqual(kartSec(bolumler, ilerleme(), { nolar: [1], filtre: 'bugun' }, '2026-11-01'), []);
});

test('oturumKur with karistir:false keeps order; with seeded rng permutes', () => {
  const kartlar = kartSec(bolumler, ilerleme(), { nolar: [1, 2], filtre: 'tumu' }, T);
  const o = oturumKur(kartlar, { karistir: false });
  assert.deepEqual(o.liste, ids(kartlar));
  assert.equal(o.pos, 0);
  assert.equal(o.tur, 1);
  let seed = 7;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const k2 = oturumKur(kartlar, { karistir: true }, rng);
  assert.notDeepEqual(k2.liste, ids(kartlar));
  assert.deepEqual([...k2.liste].sort(), [...ids(kartlar)].sort());
});

test('oturumCevap applies srs and records onceki', () => {
  const p = ilerleme();
  const o = oturumKur([{ id: 'b1-k003' }, { id: 'b1-k001' }], { karistir: false });
  const r = oturumCevap(o, p, true, T);
  assert.deepEqual(r.ilerleme.kartlar['b1-k003'], { d: 'tekrar', a: 1, son: T, vade: '2026-11-25' });
  assert.equal(r.oturum.pos, 1);
  assert.equal(r.oturum.sonuc['b1-k003'], 'k');
  assert.deepEqual(r.oturum.gecmis, [{ id: 'b1-k003', onceki: undefined }]);
  assert.equal(p.kartlar['b1-k003'], undefined, 'girdi ilerleme değişmez');
  assert.equal(o.pos, 0, 'girdi oturum değişmez');
});

test('oturumGeriAl restores exact previous state', () => {
  const p = ilerleme();
  const once = structuredClone(p);
  const o = oturumKur([{ id: 'b1-k001' }], { karistir: false });
  const r1 = oturumCevap(o, p, true, T);
  assert.equal(r1.ilerleme.kartlar['b1-k001'].a, 3);
  const r2 = oturumGeriAl(r1.oturum, r1.ilerleme);
  assert.deepEqual(r2.ilerleme, once);
  assert.equal(r2.oturum.pos, 0);
  assert.deepEqual(r2.oturum.sonuc, {});
  // yeni kartın geri alınması kaydı tamamen kaldırır
  const o3 = oturumKur([{ id: 'b1-k003' }], { karistir: false });
  const r3 = oturumGeriAl(...Object.values(oturumCevap(o3, p, false, T)));
  assert.equal('b1-k003' in r3.ilerleme.kartlar, false);
  // geri alınacak bir şey yoksa aynen döner
  const r4 = oturumGeriAl(o3, p);
  assert.equal(r4.oturum.pos, 0);
});

test('card unknown then known in next round becomes tekrar(1) due tomorrow', () => {
  let p = ilerleme();
  let o = oturumKur([{ id: 'b2-k002' }, { id: 'b1-k003' }], { karistir: false });
  ({ oturum: o, ilerleme: p } = oturumCevap(o, p, false, T));
  ({ oturum: o, ilerleme: p } = oturumCevap(o, p, true, T));
  const o2 = sonrakiTur(o);
  assert.deepEqual(o2.liste, ['b2-k002']);
  assert.equal(o2.tur, 2);
  assert.equal(o2.pos, 0);
  ({ oturum: o, ilerleme: p } = oturumCevap(o2, p, true, T));
  assert.deepEqual(p.kartlar['b2-k002'], { d: 'tekrar', a: 1, son: T, vade: '2026-11-25' });
  assert.equal(sonrakiTur(o), null);
});

test('oturumCevap uses the today argument passed per call', () => {
  let p = ilerleme();
  let o = oturumKur([{ id: 'b1-k003' }, { id: 'b1-k002' }], { karistir: false });
  ({ oturum: o, ilerleme: p } = oturumCevap(o, p, true, '2026-11-24'));
  ({ oturum: o, ilerleme: p } = oturumCevap(o, p, true, '2026-11-25'));
  assert.equal(p.kartlar['b1-k003'].vade, '2026-11-25');
  assert.equal(p.kartlar['b1-k002'].vade, '2026-11-26');
});

test('bolumOzeti counts', () => {
  assert.deepEqual(bolumOzeti(bolumler[1], ilerleme(), T), { toplam: 3, bugun: 1, bilmiyorum: 0, ogrenilen: 3, kalici: 1 });
  assert.deepEqual(bolumOzeti(bolumler[0], ilerleme(), T), { toplam: 3, bugun: 1, bilmiyorum: 1, ogrenilen: 1, kalici: 0 });
});

test('bolumOzeti ignores ids not in content', () => {
  const p = ilerleme();
  p.kartlar['b1-k999'] = { d: 'bilmiyorum', a: 0, son: T, vade: null };
  assert.deepEqual(bolumOzeti(bolumler[0], p, T), { toplam: 3, bugun: 1, bilmiyorum: 1, ogrenilen: 1, kalici: 0 });
  assert.deepEqual(ids(kartSec(bolumler, p, { nolar: [1], filtre: 'bilmediklerim' }, T)), ['b1-k002']);
});
