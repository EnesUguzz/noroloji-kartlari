// Aralıklı tekrar durum geçişleri. Saf fonksiyonlar; girdi değiştirilmez.
import { gunEkle, gunFarki } from './tarih.js';

export const ARALIKLAR = [1, 3, 7, 15];

export function vadesiGeldi(ks, bugun) {
  return !!ks && ks.d === 'tekrar' && ks.vade != null && ks.vade <= bugun;
}

export function gecikme(ks, bugun) {
  return gunFarki(ks.vade, bugun);
}

export function kategori(ks, bugun) {
  if (!ks || ks.d === 'yeni') return 'yeni';
  if (ks.d === 'bilmiyorum') return 'bilmiyorum';
  if (ks.d === 'kalici') return 'kalici';
  return vadesiGeldi(ks, bugun) ? 'bugun' : 'bekliyor';
}

export function cevapla(ks, biliyor, bugun) {
  if (!biliyor) return { d: 'bilmiyorum', a: 0, son: bugun, vade: null };
  const d = ks ? ks.d : 'yeni';
  if (d === 'yeni' || d === 'bilmiyorum') {
    return { d: 'tekrar', a: 1, son: bugun, vade: gunEkle(bugun, ARALIKLAR[0]) };
  }
  if (d === 'kalici') return { ...ks };
  if (!vadesiGeldi(ks, bugun)) return { ...ks }; // erken bilmek takvimi değiştirmez
  if (ks.a >= ARALIKLAR.length) return { d: 'kalici', a: ARALIKLAR.length, son: bugun, vade: null };
  return { d: 'tekrar', a: ks.a + 1, son: bugun, vade: gunEkle(bugun, ARALIKLAR[ks.a]) };
}
