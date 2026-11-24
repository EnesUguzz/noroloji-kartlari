// Uygulama çatısı: ilerleme durumu, kayıt ve hash ile ekran geçişi (#ana, #calis, #test, #ayarlar).
import bolumler from '../data/index.js';
import { loadProgress, saveProgress } from './kayit.js';
import { bugun } from './tarih.js';
import * as ana from './ui/ana.js';
import * as calis from './ui/calis.js';
import * as test from './ui/test.js';
import * as ayarlar from './ui/ayarlar.js';

const EKRANLAR = { ana, calis, test, ayarlar };

function depo() {
  try { return window.localStorage; } catch { return null; }
}
const bosDepo = { getItem: () => null, setItem: () => { throw new Error('depo yok'); } };

let ilerleme = loadProgress(depo() || bosDepo);
let kayitHatasi = false;
let temizle = null;
let cizilenGun = null; // ana ekranın en son çizildiği gün

// Bir ekrandan ötekine seçim taşımak için (ör. hangi kartlarla çalışılacağı).
export const paylasim = {};

export function durum() {
  return { ilerleme, bolumler, kayitHatasi };
}

// Verilen ilerlemeyi (yoksa mevcut olanı) geçerli yapar ve kaydeder.
export function kaydet(yeni = ilerleme) {
  ilerleme = yeni;
  kayitHatasi = !saveProgress(depo() || bosDepo, ilerleme);
  return !kayitHatasi;
}

export function git(hash) {
  if (location.hash === hash) ciz();
  else location.hash = hash;
}

// Yeni sürüm: bekleyen service worker varsa ana ekranda "Yeni sürüm hazır" çubuğu çıkar.
let bekleyenSW = null;
let guncellemeIstendi = false;
export function guncellemeVar() { return !!bekleyenSW; }
export function guncelle() {
  if (!bekleyenSW) return;
  guncellemeIstendi = true;
  bekleyenSW.postMessage('GUNCELLE');
}

const app = { durum, kaydet, git, paylasim, guncellemeVar, guncelle };

function ciz() {
  if (temizle) { temizle(); temizle = null; }
  const ad = location.hash.slice(1) || 'ana';
  const ekran = EKRANLAR[ad] || ana;
  const kok = document.getElementById('kok');
  kok.innerHTML = '';
  kok.className = '';
  window.scrollTo(0, 0);
  cizilenGun = bugun();
  temizle = ekran.goster(kok, app) || null;
}

window.addEventListener('hashchange', ciz);
ciz();

// iOS uygulamayı saatlerce askıda tutabilir: geri gelindiğinde gün değiştiyse ana ekranı yeniden çiz,
// yeni sürüm olup olmadığına da bak.
let swKaydi = null;
function geriGelindi() {
  if (document.visibilityState === 'hidden') return;
  if ((location.hash || '#ana') === '#ana' && cizilenGun !== bugun()) ciz();
  if (swKaydi) swKaydi.update().catch(() => {});
}
document.addEventListener('visibilitychange', geriGelindi);
window.addEventListener('pageshow', geriGelindi);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    swKaydi = reg;
    const izle = (w) => {
      if (!w) return;
      const kontrol = () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) {
          bekleyenSW = w;
          if ((location.hash || '#ana') === '#ana') ciz();
        }
      };
      w.addEventListener('statechange', kontrol);
      kontrol();
    };
    izle(reg.waiting);
    reg.addEventListener('updatefound', () => izle(reg.installing));
  }).catch(() => { /* service worker yoksa uygulama yine çalışır */ });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (guncellemeIstendi) { guncellemeIstendi = false; location.reload(); }
  });
}
