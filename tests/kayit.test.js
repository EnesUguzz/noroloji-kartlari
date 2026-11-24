import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANAHTAR, bosIlerleme, loadProgress, saveProgress, exportBackup, importBackup } from '../js/kayit.js';

function sahteDepo(baslangic = {}) {
  const m = new Map(Object.entries(baslangic));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _m: m,
  };
}

const ornek = () => ({
  v: 1,
  kartlar: { 'b1-k001': { d: 'tekrar', a: 2, son: '2026-11-24', vade: '2026-11-27' } },
  testYanlis: ['b1-t003'],
  ayar: { karistir: true },
});

test('ANAHTAR value', () => assert.equal(ANAHTAR, 'noroloji-kartlari:v1'));

test('loadProgress on empty storage returns bosIlerleme()', () => {
  assert.deepEqual(loadProgress(sahteDepo()), bosIlerleme());
  assert.deepEqual(bosIlerleme(), { v: 1, kartlar: {}, testYanlis: [], ayar: { karistir: false } });
});

test('save then load round-trips', () => {
  const s = sahteDepo();
  assert.equal(saveProgress(s, ornek()), true);
  assert.deepEqual(loadProgress(s), ornek());
});

test('loadProgress moves corrupt data aside', () => {
  for (const ham of ['{bozuk', JSON.stringify({ v: 99 })]) {
    const s = sahteDepo({ [ANAHTAR]: ham });
    assert.deepEqual(loadProgress(s, 1234), bosIlerleme());
    assert.equal(s.getItem('noroloji-kartlari:bozuk:1234'), ham);
    assert.equal(s.getItem(ANAHTAR), ham, 'yükleme sırasında üzerine yazılmaz');
  }
});

test('loadProgress fills missing fields', () => {
  const s = sahteDepo({ [ANAHTAR]: JSON.stringify({ v: 1, kartlar: {} }) });
  const p = loadProgress(s);
  assert.deepEqual(p.testYanlis, []);
  assert.equal(p.ayar.karistir, false);
});

test('importBackup accepts exportBackup output', () => {
  const r = importBackup('  \n' + exportBackup(ornek()) + '\n  ');
  assert.equal(r.ok, true);
  assert.deepEqual(r.ilerleme, ornek());
  assert.equal(JSON.parse(exportBackup(ornek())).app, 'noroloji-kartlari');
});

test('importBackup rejects foreign or broken text', () => {
  const diziKart = JSON.stringify({ app: 'noroloji-kartlari', v: 1, ilerleme: { v: 1, kartlar: [], testYanlis: [], ayar: {} } });
  const kotuDurum = JSON.stringify({ app: 'noroloji-kartlari', v: 1, ilerleme: { v: 1, kartlar: { x: { d: 'uydurma' } } } });
  for (const t of ['merhaba', '{"app":"baska"}', diziKart, kotuDurum]) {
    const r = importBackup(t);
    assert.equal(r.ok, false, t);
    assert.match(r.hata, /[a-zçğıöşü].*\.$/i);
  }
});

test('saveProgress returns false when setItem throws', () => {
  const s = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); } };
  assert.equal(saveProgress(s, ornek()), false);
});
