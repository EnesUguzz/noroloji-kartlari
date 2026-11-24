// Kart seçimi, çalışma oturumu (turlar ve geri alma) ve bölüm özeti. Saf fonksiyonlar.
import { cevapla, kategori, gecikme } from './srs.js';

const FILTRE = {
  tumu: () => true,
  yeni: (k) => k === 'yeni',
  bilmediklerim: (k) => k === 'bilmiyorum',
  bugun: (k) => k === 'bugun',
  ogrendiklerim: (k) => k === 'bugun' || k === 'bekliyor' || k === 'kalici',
};

export function kartSec(bolumler, ilerleme, { nolar, filtre }, bugun) {
  const uyar = FILTRE[filtre] || FILTRE.tumu;
  const sonuc = [];
  for (const b of bolumler) {
    if (!nolar.includes(b.no)) continue;
    for (const kart of b.kartlar) {
      if (uyar(kategori(ilerleme.kartlar[kart.id], bugun))) sonuc.push({ ...kart, no: b.no });
    }
  }
  if (filtre === 'bugun') {
    const sira = new Map(sonuc.map((k, i) => [k.id, i]));
    sonuc.sort((x, y) =>
      gecikme(ilerleme.kartlar[y.id], bugun) - gecikme(ilerleme.kartlar[x.id], bugun) || sira.get(x.id) - sira.get(y.id));
  }
  return sonuc;
}

function karistir(dizi, rng) {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function oturumKur(kartlar, { karistir: kar }, rng = Math.random) {
  const liste = kartlar.map((k) => k.id);
  return { liste: kar ? karistir(liste, rng) : liste, pos: 0, tur: 1, sonuc: {}, gecmis: [] };
}

export function oturumCevap(oturum, ilerleme, biliyor, bugun) {
  const id = oturum.liste[oturum.pos];
  if (id === undefined) return { oturum, ilerleme };
  const onceki = ilerleme.kartlar[id];
  return {
    oturum: {
      ...oturum,
      pos: oturum.pos + 1,
      sonuc: { ...oturum.sonuc, [id]: biliyor ? 'k' : 'u' },
      gecmis: [...oturum.gecmis, { id, onceki }],
    },
    ilerleme: { ...ilerleme, kartlar: { ...ilerleme.kartlar, [id]: cevapla(onceki, biliyor, bugun) } },
  };
}

export function oturumGeriAl(oturum, ilerleme) {
  if (!oturum.gecmis.length) return { oturum, ilerleme };
  const { id, onceki } = oturum.gecmis[oturum.gecmis.length - 1];
  const kartlar = { ...ilerleme.kartlar };
  if (onceki === undefined) delete kartlar[id];
  else kartlar[id] = onceki;
  const sonuc = { ...oturum.sonuc };
  delete sonuc[id];
  return {
    oturum: { ...oturum, pos: oturum.pos - 1, sonuc, gecmis: oturum.gecmis.slice(0, -1) },
    ilerleme: { ...ilerleme, kartlar },
  };
}

export function sonrakiTur(oturum) {
  const liste = oturum.liste.filter((id) => oturum.sonuc[id] === 'u');
  if (!liste.length) return null;
  return { liste, pos: 0, tur: oturum.tur + 1, sonuc: {}, gecmis: [] };
}

export function bolumOzeti(bolum, ilerleme, bugun) {
  const o = { toplam: bolum.kartlar.length, bugun: 0, bilmiyorum: 0, ogrenilen: 0, kalici: 0 };
  for (const kart of bolum.kartlar) {
    const k = kategori(ilerleme.kartlar[kart.id], bugun);
    if (k === 'bugun') o.bugun++;
    if (k === 'bilmiyorum') o.bilmiyorum++;
    if (k === 'kalici') o.kalici++;
    if (k === 'bugun' || k === 'bekliyor' || k === 'kalici') o.ogrenilen++;
  }
  return o;
}
