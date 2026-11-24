// Yerel takvim günü yardımcıları. Tarihler 'YYYY-MM-DD' metinleridir; UTC kullanılmaz.
const iki = (n) => String(n).padStart(2, '0');

function bicimle(d) {
  return `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
}

function coz(tarih) {
  const [y, m, d] = tarih.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function bugun(now = new Date()) {
  return bicimle(now);
}

export function gunEkle(tarih, n) {
  const d = coz(tarih);
  d.setDate(d.getDate() + n);
  return bicimle(d);
}

export function gunFarki(a, b) {
  // Öğle saatine sabitlenmiş UTC karşılıklarıyla, yaz saati kaymasından etkilenmeden.
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}
