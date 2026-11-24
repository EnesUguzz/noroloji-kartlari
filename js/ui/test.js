// Test ekranı: kurulum → sorular (A–E, anında geri bildirim) → sonuç.
import { testKur, yanlisGuncelle, HARFLER } from '../test.js';
import { esc, IKON } from './ortak.js';

const ADETLER = [10, 20, 40, 'hepsi'];
const TURLER = { karisik: 'Karışık', bilgi: 'Bilgi', vaka: 'Vaka' };

export function goster(kok, app) {
  const { bolumler } = app.durum();
  const onSecim = app.paylasim.test || {};
  app.paylasim.test = null;
  const bolumBul = new Map(bolumler.map((b) => [b.no, b]));
  const kimlikBolum = (id) => bolumBul.get(Number(id.slice(1, id.indexOf('-'))));

  let ayar = {
    nolar: onSecim.nolar || bolumler.filter((b) => (b.sorular || []).length).map((b) => b.no),
    tur: 'karisik', adet: 10, sadeceYanlislar: false,
  };
  let sorular = [];
  let i = 0;
  let dogrular = 0;
  let yanlislar = []; // bu testte yanlış cevaplanan sorular

  function cerceve(baslik, ust, icerik) {
    kok.innerHTML = `
      <div class="sayfa">
        <header class="ust">
          <button class="ikon-btn" type="button" id="geriBtn" aria-label="Ana ekrana dön">${IKON.geri}</button>
          <div style="flex:1;min-width:0"><div class="eyebrow">${ust}</div><h1>${baslik}</h1></div>
        </header>
        ${icerik}
      </div>`;
    kok.querySelector('#geriBtn').addEventListener('click', () => app.git('#ana'));
  }

  function kurulum(mesaj = '') {
    const { ilerleme } = app.durum();
    const secili = new Set(ayar.nolar);
    const yanlisSayisi = ilerleme.testYanlis.filter((id) => { const b = kimlikBolum(id); return b && secili.has(b.no); }).length;
    if (!yanlisSayisi) ayar.sadeceYanlislar = false;
    cerceve('Test', 'Çoktan seçmeli', `
      <section class="kutu alan">
        <div class="alan"><span class="etiket">Bölümler</span>
          <div class="cipler" id="tBolum">${bolumler.map((b) => {
            const n = (b.sorular || []).length;
            return `<label class="cip"><input type="checkbox" value="${b.no}" ${secili.has(b.no) ? 'checked' : ''} ${n ? '' : 'disabled'}><span>${b.no}. ${esc(b.baslik)} · ${n}</span></label>`;
          }).join('')}</div>
        </div>
        <div class="alan"><span class="etiket">Soru türü</span>
          <div class="cipler" id="tTur">${Object.entries(TURLER).map(([k, ad]) => `<label class="cip"><input type="radio" name="tur" value="${k}" ${ayar.tur === k ? 'checked' : ''}><span>${ad}</span></label>`).join('')}</div>
        </div>
        <div class="alan"><span class="etiket">Soru sayısı</span>
          <div class="cipler" id="tAdet">${ADETLER.map((a) => `<label class="cip"><input type="radio" name="adet" value="${a}" ${ayar.adet === a ? 'checked' : ''}><span>${a === 'hepsi' ? 'Hepsi' : a}</span></label>`).join('')}</div>
        </div>
        <label class="toggle"><input type="checkbox" id="tYanlis" ${ayar.sadeceYanlislar ? 'checked' : ''} ${yanlisSayisi ? '' : 'disabled'}> Yalnızca yanlışlarım (${yanlisSayisi})</label>
        <button class="btn primary" type="button" id="tBasla">Teste başla</button>
        <p class="mesaj hata" role="status">${esc(mesaj)}</p>
      </section>`);
    const oku = () => {
      ayar.nolar = [...kok.querySelectorAll('#tBolum input:checked')].map((x) => Number(x.value));
      ayar.tur = kok.querySelector('#tTur input:checked').value;
      const a = kok.querySelector('#tAdet input:checked').value;
      ayar.adet = a === 'hepsi' ? 'hepsi' : Number(a);
      ayar.sadeceYanlislar = kok.querySelector('#tYanlis').checked;
    };
    kok.querySelector('#tBolum').addEventListener('change', () => { oku(); kurulum(); });
    kok.querySelector('#tBasla').addEventListener('click', () => {
      oku();
      if (!ayar.nolar.length) { kurulum('En az bir bölüm seç.'); return; }
      const liste = testKur(bolumler, ayar, app.durum().ilerleme.testYanlis);
      if (!liste.length) { kurulum('Bu seçimde soru yok.'); return; }
      basla(liste);
    });
  }

  function basla(liste) {
    sorular = liste; i = 0; dogrular = 0; yanlislar = [];
    soru();
  }

  function soru() {
    const q = sorular[i];
    const b = kimlikBolum(q.id);
    const alt = (b && b.altBolumler[q.b]) || '';
    cerceve(`Soru ${i + 1} / ${sorular.length}`, `${dogrular} doğru · ${yanlislar.length} yanlış`, `
      <section class="kutu soru">
        <div class="face-head"><span class="chip">${q.tur === 'vaka' ? 'Vaka' : 'Bilgi'} · ${esc(q.b)}${alt ? ' ' + esc(alt) : ''}</span></div>
        <p class="kok">${esc(q.kok)}</p>
        <div class="siklar" role="group" aria-label="Şıklar">
          ${q.siklar.map((s, j) => `<button class="sik" type="button" data-j="${j}"><span class="harf">${HARFLER[j]}</span><span>${esc(s)}</span></button>`).join('')}
        </div>
        <div id="geri" hidden></div>
      </section>`);
    const sikler = [...kok.querySelectorAll('.sik')];
    kok.querySelector('.siklar').addEventListener('click', (e) => {
      const btn = e.target.closest('.sik');
      if (!btn || btn.disabled) return;
      const j = Number(btn.dataset.j);
      const dogruMu = j === q.dogru;
      sikler.forEach((s) => { s.disabled = true; });
      sikler[q.dogru].classList.add('dogru');
      if (!dogruMu) btn.classList.add('yanlis');
      if (dogruMu) dogrular++; else yanlislar.push(q);
      const { ilerleme } = app.durum();
      app.kaydet({ ...ilerleme, testYanlis: yanlisGuncelle(ilerleme.testYanlis, q.id, dogruMu) });
      const g = kok.querySelector('#geri');
      g.hidden = false;
      g.innerHTML = `
        <div class="geri-bildirim ${dogruMu ? 'ok' : 'hata'}" role="status">
          <strong>${dogruMu ? 'Doğru' : `Yanlış · doğru cevap ${HARFLER[q.dogru]}`}</strong>
          <p>${esc(q.aciklama)}</p>
          <p class="sayfa-no">Kitap s. ${q.s}</p>
        </div>
        <button class="btn primary" type="button" id="sonraki">${i + 1 < sorular.length ? 'Sonraki' : 'Sonucu gör'}</button>`;
      const sonraki = g.querySelector('#sonraki');
      sonraki.addEventListener('click', () => { i++; if (i < sorular.length) soru(); else sonuc(); });
      sonraki.focus({ preventScroll: true });
      g.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function sonuc() {
    cerceve(`${dogrular} / ${sorular.length} doğru`, 'Test bitti', `
      <section class="kutu alan">
        <div class="stats"><div class="stat k"><b>${dogrular}</b><span>Doğru</span></div><div class="stat u"><b>${yanlislar.length}</b><span>Yanlış</span></div></div>
        ${yanlislar.length ? `<div class="alan"><span class="etiket">Yanlışların</span><ul class="yanlis-liste">${yanlislar.map((q) =>
          `<li><span>${esc(q.kok.length > 90 ? q.kok.slice(0, 90) + '…' : q.kok)}</span><em>s. ${q.s}</em></li>`).join('')}</ul></div>` : '<p class="alt-yazi">Hepsi doğru.</p>'}
        ${yanlislar.length ? '<button class="btn primary" type="button" id="tekrarBtn">Yanlışlarımı tekrar çöz</button>' : ''}
        <button class="btn" type="button" id="yeniBtn">Yeni test</button>
        <button class="btn" type="button" id="anaBtn">Ana ekran</button>
      </section>`);
    kok.querySelector('#tekrarBtn')?.addEventListener('click', () => {
      const ids = yanlislar.map((q) => q.id);
      basla(testKur(bolumler, { nolar: bolumler.map((b) => b.no), tur: 'karisik', adet: 'hepsi', sadeceYanlislar: true }, ids));
    });
    kok.querySelector('#yeniBtn').addEventListener('click', () => kurulum());
    kok.querySelector('#anaBtn').addEventListener('click', () => app.git('#ana'));
  }

  kurulum();
}
