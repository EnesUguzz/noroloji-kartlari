// Çoktan seçmeli test kurulumu ve yanlış takibi. Saf fonksiyonlar.
export const HARFLER = ['A', 'B', 'C', 'D', 'E'];

function karistir(dizi, rng) {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function testKur(bolumler, { nolar, tur, adet, sadeceYanlislar }, testYanlis, rng = Math.random) {
  const yanlis = new Set(testYanlis);
  const havuz = [];
  for (const b of bolumler) {
    if (!nolar.includes(b.no)) continue;
    for (const q of b.sorular || []) {
      if (tur !== 'karisik' && q.tur !== tur) continue;
      if (sadeceYanlislar && !yanlis.has(q.id)) continue;
      havuz.push(q);
    }
  }
  const secilen = karistir(havuz, rng).slice(0, adet === 'hepsi' ? havuz.length : adet);
  return secilen.map((q) => {
    const sira = karistir([0, 1, 2, 3, 4], rng);
    return {
      id: q.id, b: q.b, s: q.s, tur: q.tur, kok: q.kok, aciklama: q.aciklama,
      siklar: sira.map((i) => q.siklar[i]),
      dogru: sira.indexOf(q.dogru),
    };
  });
}

export function yanlisGuncelle(testYanlis, id, dogruMu) {
  if (dogruMu) return testYanlis.filter((x) => x !== id);
  return testYanlis.includes(id) ? [...testYanlis] : [...testYanlis, id];
}
