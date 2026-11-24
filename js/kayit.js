// İlerlemenin localStorage'a kaydı ve metin yedeği.
export const ANAHTAR = 'noroloji-kartlari:v1';
const BOZUK = 'noroloji-kartlari:bozuk:';
const APP = 'noroloji-kartlari';
const DURUMLAR = ['yeni', 'bilmiyorum', 'tekrar', 'kalici'];

export function bosIlerleme() {
  return { v: 1, kartlar: {}, testYanlis: [], ayar: { karistir: false } };
}

const nesneMi = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

// Geçerliyse eksik alanları tamamlanmış ilerleme, değilse null döner.
function normallestir(p) {
  if (!nesneMi(p) || p.v !== 1 || !nesneMi(p.kartlar)) return null;
  for (const ks of Object.values(p.kartlar)) {
    if (!nesneMi(ks) || !DURUMLAR.includes(ks.d)) return null;
  }
  if (p.testYanlis !== undefined && !Array.isArray(p.testYanlis)) return null;
  if (p.ayar !== undefined && !nesneMi(p.ayar)) return null;
  const testYanlis = (p.testYanlis || []).filter((x) => typeof x === 'string');
  return { v: 1, kartlar: p.kartlar, testYanlis, ayar: { karistir: false, ...(p.ayar || {}) } };
}

export function loadProgress(storage, now = Date.now()) {
  let ham = null;
  try { ham = storage.getItem(ANAHTAR); } catch { return bosIlerleme(); }
  if (ham == null) return bosIlerleme();
  let p = null;
  try { p = normallestir(JSON.parse(ham)); } catch { p = null; }
  if (p) return p;
  try { storage.setItem(BOZUK + now, ham); } catch { /* yer yoksa da açılış sürer */ }
  return bosIlerleme();
}

export function saveProgress(storage, p) {
  try {
    storage.setItem(ANAHTAR, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

export function exportBackup(p, now = new Date()) {
  return JSON.stringify({ app: APP, v: 1, tarih: now.toISOString(), ilerleme: p });
}

export function importBackup(text) {
  let o;
  try { o = JSON.parse(String(text).trim()); } catch {
    return { ok: false, hata: 'Bu metin bir yedek değil; tamamını kopyaladığınızdan emin olun.' };
  }
  if (!nesneMi(o) || o.app !== APP) {
    return { ok: false, hata: 'Bu yedek Nöroloji Kartları uygulamasına ait değil.' };
  }
  const p = normallestir(o.ilerleme);
  if (!p) return { ok: false, hata: 'Yedeğin içeriği bozuk ya da tanınmayan bir sürümden.' };
  return { ok: true, ilerleme: p };
}
