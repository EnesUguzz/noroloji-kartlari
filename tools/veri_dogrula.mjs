// Bölüm verisi denetimi. Kullanım: node tools/veri_dogrula.mjs  (hata varsa çıkış kodu 1)
const bosMu = (x) => typeof x !== 'string' || !x.trim();

export function dogrula(bolum) {
  const h = [];
  const { no, sayfalar, altBolumler = {}, kartlar = [], sorular = [] } = bolum;
  if (!Number.isInteger(no)) h.push('no tamsayı değil');
  if (bosMu(bolum.baslik)) h.push('baslik boş');
  if (!Array.isArray(sayfalar) || sayfalar.length !== 2) h.push('sayfalar [ilk, son] değil');
  const [ilk, son] = sayfalar || [0, 0];
  const kimlikler = new Set();
  const ortak = (o, tip, desen) => {
    if (!desen.test(o.id || '')) h.push(`${o.id}: kimlik biçimi ${tip} için yanlış`);
    if (kimlikler.has(o.id)) h.push(`${o.id}: tekrarlayan kimlik`);
    kimlikler.add(o.id);
    if (!Number.isInteger(o.s) || o.s < ilk || o.s > son) h.push(`${o.id}: sayfa ${o.s} ${ilk}–${son} dışında`);
    if (!(o.b in altBolumler)) h.push(`${o.id}: alt bölüm ${o.b} tanımsız`);
  };
  const kDesen = new RegExp(`^b${no}-k[0-9]{3}$`);
  const tDesen = new RegExp(`^b${no}-t[0-9]{3}$`);
  for (const k of kartlar) {
    ortak(k, 'kart', kDesen);
    if (bosMu(k.q) || bosMu(k.a)) h.push(`${k.id}: soru ya da cevap boş`);
  }
  let vaka = 0;
  for (const q of sorular) {
    ortak(q, 'soru', tDesen);
    if (q.tur !== 'bilgi' && q.tur !== 'vaka') h.push(`${q.id}: tur bilgi/vaka değil`);
    if (q.tur === 'vaka') vaka++;
    if (!Array.isArray(q.siklar) || q.siklar.length !== 5) h.push(`${q.id}: 5 şık yok`);
    else {
      if (q.siklar.some(bosMu)) h.push(`${q.id}: boş şık`);
      if (new Set(q.siklar).size !== 5) h.push(`${q.id}: aynı şık iki kez`);
    }
    if (!Number.isInteger(q.dogru) || q.dogru < 0 || q.dogru > 4) h.push(`${q.id}: dogru 0–4 dışında`);
    if (bosMu(q.kok) || bosMu(q.aciklama)) h.push(`${q.id}: kök ya da açıklama boş`);
  }
  if (sorular.length > 10) {
    const oran = vaka / sorular.length;
    if (oran < 0.4 || oran > 0.6) h.push(`vaka oranı %${Math.round(oran * 100)}, %40–60 olmalı`);
  }
  return h;
}

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_KLASORLERI = ['css', 'fonts', 'icons', 'js', 'data'];
const KOK_DOSYALARI = ['index.html', 'manifest.webmanifest'];

// Sitede yayınlanan ve internetsiz çalışmak için önbelleğe girmesi gereken dosyalar (kök göreli, / ile).
export function siteDosyalari(kok = KOK) {
  const sonuc = [...KOK_DOSYALARI];
  const gez = (goreli) => {
    for (const ad of readdirSync(join(kok, goreli)).sort()) {
      const g = goreli + '/' + ad;
      if (statSync(join(kok, g)).isDirectory()) gez(g);
      else if (!ad.endsWith('.txt')) sonuc.push(g);
    }
  };
  for (const k of SITE_KLASORLERI) gez(k);
  return sonuc;
}

// sw.js içindeki CACHE_VERSION ve DOSYALAR listesi.
export function swBilgisi(kok = KOK) {
  const metin = readFileSync(join(kok, 'sw.js'), 'utf8');
  const surum = (metin.match(/CACHE_VERSION\s*=\s*'([^']+)'/) || [])[1];
  const liste = (metin.match(/DOSYALAR\s*=\s*\[([\s\S]*?)\]/) || [])[1] || '';
  const dosyalar = [...liste.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  return { surum, dosyalar };
}

import { pathToFileURL } from 'node:url';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { default: bolumler } = await import('../data/index.js');
  let hata = 0;
  for (const b of bolumler) {
    const h = dogrula(b);
    const vaka = b.sorular.filter((q) => q.tur === 'vaka').length;
    console.log(`Bölüm ${b.no}: ${b.kartlar.length} kart, ${b.sorular.length} soru (${vaka} vaka) — ${h.length ? h.length + ' hata' : 'temiz'}`);
    h.forEach((x) => console.log('  ' + x));
    hata += h.length;
  }
  const { surum, dosyalar } = swBilgisi();
  const { SURUM } = await import('../js/surum.js');
  const eksik = siteDosyalari().filter((f) => !dosyalar.includes(f));
  if (eksik.length) { console.log('sw.js DOSYALAR eksik: ' + eksik.join(', ')); hata++; }
  if (surum !== SURUM) { console.log(`sw.js CACHE_VERSION (${surum}) ile js/surum.js SURUM (${SURUM}) farklı`); hata++; }
  process.exit(hata ? 1 : 0);
}
