// Uygulama çatısı: ilerleme durumu, kayıt ve hash ile ekran geçişi (#ana, #calis, #test, #ayarlar).
import bolumler from '../data/index.js';
import { loadProgress, saveProgress } from './kayit.js';
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

const app = { durum, kaydet, git, paylasim };

function ciz() {
  if (temizle) { temizle(); temizle = null; }
  const ad = location.hash.slice(1) || 'ana';
  const ekran = EKRANLAR[ad] || ana;
  const kok = document.getElementById('kok');
  kok.innerHTML = '';
  kok.className = '';
  window.scrollTo(0, 0);
  temizle = ekran.goster(kok, app) || null;
}

window.addEventListener('hashchange', ciz);
ciz();
