// sw.js içindeki DOSYALAR listesini sitedeki dosyalarla yeniler ve sürümü yükseltir
// (sw.js CACHE_VERSION ile js/surum.js SURUM birlikte). Kullanım: node tools/sw_guncelle.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteDosyalari, swBilgisi } from './veri_dogrula.mjs';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const iki = (n) => String(n).padStart(2, '0');
const d = new Date();
const gun = `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
const eski = swBilgisi().surum || '';
const m = eski.match(/^nk-(\d{4}-\d{2}-\d{2})-(\d+)$/);
const yeni = `nk-${gun}-${m && m[1] === gun ? Number(m[2]) + 1 : 1}`;

const liste = ['./', ...siteDosyalari()].map((f) => `  '${f}',`).join('\n');
const swYolu = join(KOK, 'sw.js');
let sw = readFileSync(swYolu, 'utf8');
sw = sw.replace(/const CACHE_VERSION = '[^']*';/, `const CACHE_VERSION = '${yeni}';`);
sw = sw.replace(/const DOSYALAR = \[[\s\S]*?\];/, `const DOSYALAR = [\n${liste}\n];`);
writeFileSync(swYolu, sw);
const surumYolu = join(KOK, 'js', 'surum.js');
writeFileSync(surumYolu, readFileSync(surumYolu, 'utf8').replace(/SURUM = '[^']*'/, `SURUM = '${yeni}'`));
console.log(`${eski} → ${yeni}, ${siteDosyalari().length + 1} dosya`);
