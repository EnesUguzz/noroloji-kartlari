// Ana ekran: günlük özet, karışık çalışma seçimi ve bölüm listesi.
import { bugun } from '../tarih.js';
import { bolumOzeti } from '../oturum.js';
import { esc, IKON, FILTRE_ADI } from './ortak.js';

let acikBolum = null; // [Kartlar] filtre listesi açık olan bölüm no

export function goster(kok, app) {
  const { ilerleme, bolumler, kayitHatasi } = app.durum();
  const T = bugun();
  const ozetler = new Map(bolumler.map((b) => [b.no, bolumOzeti(b, ilerleme, T)]));
  let toplamBugun = 0, toplamBilmiyorum = 0;
  for (const o of ozetler.values()) { toplamBugun += o.bugun; toplamBilmiyorum += o.bilmiyorum; }
  const tumNolar = bolumler.map((b) => b.no);
  const karistir = !!ilerleme.ayar.karistir;

  const bolumHtml = bolumler.map((b) => {
    const o = ozetler.get(b.no);
    const yeni = o.toplam - o.ogrenilen - o.bilmiyorum;
    const sayi = { tumu: o.toplam, yeni, bilmediklerim: o.bilmiyorum, bugun: o.bugun, ogrendiklerim: o.ogrenilen };
    const kal = o.toplam ? (o.kalici / o.toplam) * 100 : 0;
    const ogr = o.toplam ? ((o.ogrenilen - o.kalici) / o.toplam) * 100 : 0;
    const acik = acikBolum === b.no;
    return `
      <article class="kutu bolum" data-no="${b.no}">
        <div class="bolum-ust">
          <div class="bolum-no" aria-hidden="true">${b.no}</div>
          <div class="bolum-ad">
            <h3>${esc(b.baslik)}</h3>
            <div class="sayilar">
              <span>${o.toplam} kart · ${(b.sorular || []).length} soru</span>
              <span>Öğrenilen ${o.ogrenilen}</span>
              ${o.bugun ? `<span class="b">Bugün ${o.bugun}</span>` : ''}
              ${o.bilmiyorum ? `<span class="u">Bilmiyorum ${o.bilmiyorum}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="cubuk" aria-hidden="true"><span class="kal" style="width:${kal}%"></span><span class="ogr" style="width:${ogr}%"></span></div>
        <div class="bolum-btn">
          <button class="btn kucuk" type="button" data-eylem="kartlar" aria-expanded="${acik}">Kartlar</button>
          <button class="btn kucuk" type="button" data-eylem="test" ${(b.sorular || []).length ? '' : 'disabled'}>Test</button>
        </div>
        ${acik ? `<div class="filtreler">${Object.keys(FILTRE_ADI).map((f) => `
          <button class="btn kucuk" type="button" data-filtre="${f}" ${sayi[f] ? '' : 'disabled'}>${FILTRE_ADI[f]} <em>${sayi[f]}</em></button>`).join('')}
        </div>` : ''}
      </article>`;
  }).join('');

  kok.innerHTML = `
    <div class="sayfa">
      <header class="ust">
        <div>
          <div class="eyebrow">Nöroloji Ders Kitabı II</div>
          <h1>Nöroloji Kartları</h1>
        </div>
        <button class="ikon-btn" type="button" id="ayarBtn" aria-label="Ayarlar ve yedek">${IKON.ayar}</button>
      </header>
      ${app.guncellemeVar && app.guncellemeVar() ? '<div class="uyari bilgi" role="status">Yeni sürüm hazır. <button class="btn kucuk" type="button" id="yenileBtn">Yenile</button></div>' : ''}
      ${kayitHatasi ? `<div class="uyari hata" role="alert">Kayıt yapılamadı, yedek alın. <button class="btn kucuk" type="button" id="yedekBtn">Yedek</button></div>` : ''}

      <section class="ozet" aria-label="Bugün">
        <div class="ozet-kart bugun">
          <div><b>${toplamBugun}</b><br><span>Bugün tekrar</span></div>
          <button class="btn kucuk" type="button" id="bugunBtn" ${toplamBugun ? '' : 'disabled'}>Çalış</button>
        </div>
        <div class="ozet-kart bilmiyorum">
          <div><b>${toplamBilmiyorum}</b><br><span>Bilmediklerim</span></div>
          <button class="btn kucuk" type="button" id="bilmiyorumBtn" ${toplamBilmiyorum ? '' : 'disabled'}>Çalış</button>
        </div>
      </section>
      ${toplamBugun === 0 ? '<p class="alt-yazi">Bugün tekrarı gelen kart yok. Yeni kartlarla ya da karışık çalışabilirsin.</p>' : ''}

      <section class="kutu alan" aria-labelledby="karisikBaslik">
        <h2 id="karisikBaslik">Karışık çalış</h2>
        <div class="alan">
          <span class="etiket">Bölümler</span>
          <div class="cipler" id="karisikBolumler">
            ${bolumler.map((b) => `<label class="cip"><input type="checkbox" value="${b.no}" checked><span>${b.no}. ${esc(b.baslik)}</span></label>`).join('')}
          </div>
        </div>
        <div class="alan">
          <span class="etiket">Kartlar</span>
          <div class="cipler" id="karisikFiltre">
            ${Object.entries(FILTRE_ADI).map(([f, ad]) => `<label class="cip"><input type="radio" name="filtre" value="${f}" ${f === 'tumu' ? 'checked' : ''}><span>${ad}</span></label>`).join('')}
          </div>
        </div>
        <div class="satir">
          <label class="toggle"><input type="checkbox" id="karistir" ${karistir ? 'checked' : ''}> Kartları karıştır</label>
          <button class="btn primary" type="button" id="karisikBtn">Başla</button>
        </div>
        <p class="alt-yazi" id="karisikMesaj" role="status"></p>
      </section>

      <section class="bolumler" aria-label="Bölümler">${bolumHtml}</section>
    </div>`;

  const $ = (s) => kok.querySelector(s);
  const calis = (secim) => { app.paylasim.calis = secim; app.git('#calis'); };

  $('#ayarBtn').addEventListener('click', () => app.git('#ayarlar'));
  $('#yenileBtn')?.addEventListener('click', () => app.guncelle());
  $('#yedekBtn')?.addEventListener('click', () => app.git('#ayarlar'));
  $('#bugunBtn').addEventListener('click', () => calis({ nolar: tumNolar, filtre: 'bugun', baslik: 'Bugün tekrar' }));
  $('#bilmiyorumBtn').addEventListener('click', () => calis({ nolar: tumNolar, filtre: 'bilmediklerim', baslik: 'Bilmediklerim' }));
  $('#karistir').addEventListener('change', (e) => {
    const { ilerleme: p } = app.durum();
    app.kaydet({ ...p, ayar: { ...p.ayar, karistir: e.target.checked } });
  });
  $('#karisikBtn').addEventListener('click', () => {
    const nolar = [...kok.querySelectorAll('#karisikBolumler input:checked')].map((i) => Number(i.value));
    const filtre = kok.querySelector('#karisikFiltre input:checked').value;
    if (!nolar.length) { $('#karisikMesaj').textContent = 'En az bir bölüm seç.'; return; }
    calis({ nolar, filtre, baslik: 'Karışık · ' + FILTRE_ADI[filtre] });
  });

  kok.querySelector('.bolumler').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const no = Number(btn.closest('.bolum').dataset.no);
    const b = bolumler.find((x) => x.no === no);
    if (btn.dataset.eylem === 'kartlar') {
      acikBolum = acikBolum === no ? null : no;
      const y = window.scrollY;
      goster(kok, app);
      window.scrollTo(0, y);
      kok.querySelector(`.bolum[data-no="${no}"] [data-eylem="kartlar"]`).focus();
    } else if (btn.dataset.eylem === 'test') {
      app.paylasim.test = { nolar: [no] };
      app.git('#test');
    } else if (btn.dataset.filtre) {
      calis({ nolar: [no], filtre: btn.dataset.filtre, baslik: `Bölüm ${no} · ${FILTRE_ADI[btn.dataset.filtre]}`, altBaslik: b.baslik });
    }
  });
}
