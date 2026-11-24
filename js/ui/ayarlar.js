// Ayarlar: yedek alma / geri yükleme, kaynak ve sürüm.
import { exportBackup, importBackup } from '../kayit.js';
import { SURUM } from '../surum.js';
import { IKON } from './ortak.js';

export function goster(kok, app) {
  const { ilerleme } = app.durum();
  const kartSayisi = Object.keys(ilerleme.kartlar).length;
  kok.innerHTML = `
    <div class="sayfa">
      <header class="ust">
        <button class="ikon-btn" type="button" id="geriBtn" aria-label="Ana ekrana dön">${IKON.geri}</button>
        <div style="flex:1"><div class="eyebrow">Ayarlar</div><h1>Yedek ve bilgi</h1></div>
      </header>

      <section class="kutu alan">
        <h2>Yedeği kopyala</h2>
        <p class="alt-yazi">İlerlemen yalnızca bu cihazda saklanıyor (${kartSayisi} kartın kaydı var). Yedek metnini Notlar'a ya da kendine mesaj olarak kaydet.</p>
        <button class="btn primary" type="button" id="kopyalaBtn">Yedeği kopyala</button>
        <p class="mesaj" id="kopyaMesaj" role="status"></p>
        <textarea id="yedekCikti" readonly hidden aria-label="Yedek metni"></textarea>
      </section>

      <section class="kutu alan">
        <h2>Yedeği geri yükle</h2>
        <p class="alt-yazi">Daha önce kopyaladığın yedek metnini yapıştır. Mevcut ilerlemenin yerine geçer.</p>
        <textarea id="yedekGirdi" aria-label="Yedek metnini yapıştır" placeholder='{"app":"noroloji-kartlari", …}'></textarea>
        <div class="satir">
          <button class="btn" type="button" id="uygulaBtn">Uygula</button>
          <button class="btn u" type="button" id="onaylaBtn" hidden>Eminim, ilerlememin yerine geçsin</button>
        </div>
        <p class="mesaj" id="yukleMesaj" role="status"></p>
      </section>

      <section class="kutu alan">
        <h2>Kaynak</h2>
        <p class="kaynak-metin">Kartlar ve sorular <i>Nöroloji Ders Kitabı II: Sinir Sistemi Hastalıkları ve Tedavi</i> (İÜC Üniversite Yayınevi, 2024) kitabından hazırlanmıştır. Kitap CC BY 4.0 lisanslıdır; DOI 10.5152/5800. Kartlardaki “Kitap s.” kitabın basılı sayfa numarasıdır.</p>
        <p class="alt-yazi">Sürüm ${SURUM}</p>
      </section>
    </div>`;

  const $ = (id) => kok.querySelector('#' + id);
  $('geriBtn').addEventListener('click', () => app.git('#ana'));

  $('kopyalaBtn').addEventListener('click', async () => {
    const metin = exportBackup(app.durum().ilerleme);
    try {
      await navigator.clipboard.writeText(metin);
      $('kopyaMesaj').className = 'mesaj ok';
      $('kopyaMesaj').textContent = 'Yedek panoya kopyalandı.';
      $('yedekCikti').hidden = true;
    } catch {
      $('kopyaMesaj').className = 'mesaj';
      $('kopyaMesaj').textContent = 'Otomatik kopyalanamadı; aşağıdaki metni seçip kopyala.';
      const t = $('yedekCikti');
      t.hidden = false;
      t.value = metin;
      t.focus();
      t.select();
    }
  });

  let bekleyen = null;
  $('uygulaBtn').addEventListener('click', () => {
    const r = importBackup($('yedekGirdi').value);
    const m = $('yukleMesaj');
    if (!r.ok) {
      bekleyen = null;
      $('onaylaBtn').hidden = true;
      m.className = 'mesaj hata';
      m.textContent = r.hata;
      return;
    }
    bekleyen = r.ilerleme;
    m.className = 'mesaj';
    m.textContent = `Yedekte ${Object.keys(r.ilerleme.kartlar).length} kartın kaydı var. Onaylarsan mevcut ilerlemenin yerine geçer.`;
    $('onaylaBtn').hidden = false;
  });
  $('onaylaBtn').addEventListener('click', () => {
    if (!bekleyen) return;
    const ok = app.kaydet(bekleyen);
    bekleyen = null;
    $('onaylaBtn').hidden = true;
    $('yedekGirdi').value = '';
    const m = $('yukleMesaj');
    m.className = ok ? 'mesaj ok' : 'mesaj hata';
    m.textContent = ok ? 'Yedek yüklendi.' : 'Yedek açıldı ama bu cihaza kaydedilemedi.';
  });
}
