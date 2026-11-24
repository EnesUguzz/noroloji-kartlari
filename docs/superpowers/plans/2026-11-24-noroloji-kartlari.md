# Nöroloji Kartları Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bölüm 1 prototipini, 6 bölümün kartlarını ve testlerini içeren, aralıklı tekrar yapan, iPhone'da ana ekrana eklenip internetsiz çalışan bir web uygulamasına dönüştürmek.

**Architecture:**
- Derleme adımı olmayan statik site. İş mantığı (tekrar takvimi, oturum, test, kayıt) saf ES modüllerinde tutulur ve Node'un yerleşik test aracıyla test edilir.
- Arayüz modülleri bu saf fonksiyonları çağırır.
- İçerik bölüm başına bir veri modülündedir.
- Service worker tüm dosyaları önbelleğe alır. Site GitHub Pages'ta yayınlanır.

**Tech Stack:**
- HTML, CSS, sade JavaScript (ES modules); bağımlılık yok.
- Testler: `node --test`.
- PDF metni için Python + PyMuPDF; ekran doğrulaması için Playwright.

**Spec:** `docs/superpowers/specs/2026-11-24-noroloji-kartlari-design.md`

## Global Constraints

**Arayüz ve tasarım**
- Arayüz metinleri Türkçe. Görsel dil prototipten (`index.html`) gelir: renk tokenları, kart çevirme, kaydırma, damga.

**Tekrar takvimi**
- Tekrar aralıkları tam olarak `[1, 3, 7, 15]` gün. 4. aşamayı geçen kart `kalici` olur.
- Gün hesabı yerel takvim günüyle yapılır, `YYYY-MM-DD` biçiminde. "Bugün", işlem anında hesaplanır.
- Günlük kart sınırı yoktur. "Bugün tekrar" listesi en çok gecikmiş karttan başlar.

**İçerik**
- Test sorularında 5 şık (A–E) olur. Bilgi ve vaka soruları bölüm içinde yarı yarıya, en fazla ±%10 sapma.
- Her kart ve her soru kitap sayfası (`s`) taşır; kitap sayfası = PDF sayfası − 13. İçerik yalnızca kitap metninden gelir.
- Kalıcı kimlik biçimleri: kart `b{bölüm}-k{3 hane}`, soru `b{bölüm}-t{3 hane}`.

**Saklama**
- localStorage anahtarı `noroloji-kartlari:v1`.
- Bozuk kayıt sessizce silinmez; `noroloji-kartlari:bozuk:<epoch ms>` anahtarına taşınır.

**Dosya, yayın ve lisans**
- Dışarıdan dosya çekilmez. Yazı tipleri `fonts/` klasöründe; Google Fonts bağlantısı yok.
- Git kimliği `EnesUguzz <121359925+EnesUguzz@users.noreply.github.com>`. Commit mesajlarında Co-Authored-By ya da "Generated with" satırı yok.
- Repo `EnesUguzz/noroloji-kartlari`, herkese açık, GitHub Pages ile yayın.
- Kaynak gösterimi: *Nöroloji Ders Kitabı II: Sinir Sistemi Hastalıkları ve Tedavi*, İÜC Üniversite Yayınevi 2024, CC BY 4.0, DOI 10.5152/5800.

## Review Focus

1. **Gece yarısı geçişi.** Uygulama açıkken gün değişirse kararlar yeni güne göre işlenir, çünkü `bugun()` her kararda yeniden çağrılır. Bunu sınayan test: Task 3, `oturumCevap uses the today argument passed per call`.
2. **Bozuk ya da tanınmayan kayıt.** Uygulama açılır ve boş ilerlemeyle başlar; eski kayıt bozuk anahtarına kopyalanmış olarak kalır. Test: Task 2, `loadProgress moves corrupt data aside`.
3. **İçerikten silinmiş kimliğin ilerlemesi.** Çökme olmaz, sayımlara girmez. Test: Task 3, `bolumOzeti ignores ids not in content`.
4. **Boş seçim.** Örneğin bugün tekrar edilecek kart yoksa boş ekran yerine açıklayıcı bir boş durum gösterilir. Test: Task 3, `kartSec returns [] for empty filters`; ekranı Task 6 çizer.
5. **Başka uygulamanın ya da bozuk yedeğin içe aktarılması.** Hata mesajı gösterilir, mevcut ilerleme değişmez. Test: Task 2, `importBackup rejects foreign or broken text`.

---

## Dosya düzeni

```
noroloji-flashcard/
  index.html              uygulama kabuğu (ekran kapsayıcıları, modül girişi)
  manifest.webmanifest
  sw.js                   önbellek, sürüm adı CACHE_VERSION
  css/app.css             prototipten taşınan tokenlar ve bileşenler
  fonts/                  Inter, Space Grotesk woff2 ve OFL.txt
  icons/                  icon-180.png, icon-192.png, icon-512.png
  js/tarih.js             bugun, gunEkle, gunFarki
  js/srs.js               kart durum geçişleri
  js/oturum.js            kart seçimi, oturum, geri alma, bölüm özeti
  js/test.js              test oluşturma, şık karıştırma, test yanlışları
  js/kayit.js             yükle, kaydet, yedek dışa ve içe aktarma
  js/ui/ana.js            ana ekran
  js/ui/calis.js          kart çalışma ekranı (prototipteki kaydırma)
  js/ui/test.js           test ekranı
  js/ui/ayarlar.js        yedek, kaynak, sürüm
  js/app.js               ekranlar arası geçiş (hash: #ana, #calis, #test, #ayarlar)
  data/index.js           export default [b1, …, b6]
  data/bolum1.js … bolum6.js
  tests/*.test.js
  tools/pdf_metin.py      bölüm metnini kitap sayfa işaretleriyle çıkarır
  tools/veri_dogrula.mjs  veri şeması ve oran denetimi
  package.json            { "type": "module", "scripts": { "test": "node --test tests/" } }
```

Prototip dosyaları (`index.html`, `bolum1.js`) bu yapıya taşınır; eski `bolum1.js` silinir.

**Veri biçimi**, `data/bolumN.js`, `export default`:

```js
{
  no: 1,
  baslik: 'Beyin Damar Hastalıkları',
  sayfalar: [1, 59],
  altBolumler: { '1.1': '…' },
  kartlar: [
    { id: 'b1-k001', b: '1.1', s: 2, q: '…', a: '…' }   // a içinde \n madde işaretine dönüşür
  ],
  sorular: [
    { id: 'b1-t001', b: '1.3', s: 26, tur: 'bilgi' /* ya da 'vaka' */,
      kok: '…', siklar: ['…', '…', '…', '…', '…'], dogru: 2, aciklama: '…' }
  ],
}
```

**İlerleme biçimi:**

```js
{
  v: 1,
  kartlar: { [id]: { d: 'yeni'|'bilmiyorum'|'tekrar'|'kalici', a: 0..4, son: 'YYYY-MM-DD'|null, vade: 'YYYY-MM-DD'|null } },
  testYanlis: [qid],
  ayar: { karistir: false },
}
```

---

### Task 1: Proje iskeleti, tarih ve tekrar takvimi

**Files:**
- Create: `package.json`, `js/tarih.js`, `js/srs.js`, `tests/tarih.test.js`, `tests/srs.test.js`, `.gitignore` (`node_modules/`, `.DS_Store`)
- Setup: `git init`; `user.name` ve `user.email` Global Constraints'teki değerlerle repo düzeyinde ayarlanır.

**Interfaces:**
- Produces:
  - `bugun(now?: Date): string` yerel tarih.
  - `gunEkle(tarih: string, n: number): string`
  - `gunFarki(a: string, b: string): number`, b − a gün.
  - `ARALIKLAR = [1, 3, 7, 15]`
  - `cevapla(ks: KartDurum|undefined, biliyor: boolean, bugun: string): KartDurum`
  - `vadesiGeldi(ks, bugun): boolean`
  - `gecikme(ks, bugun): number`
  - `kategori(ks, bugun): 'yeni'|'bilmiyorum'|'bugun'|'bekliyor'|'kalici'`
  - `KartDurum = { d, a, son, vade }`. Tanımsız durum `yeni` sayılır.

- [ ] **Step 1: Failing tests** (`tests/tarih.test.js`, `tests/srs.test.js`)

  Tarih:
  - `gunEkle('2026-02-27', 3) === '2026-03-02'`
  - `gunFarki('2026-11-20', '2026-11-24') === 4`
  - `bugun(new Date(2026, 0, 5, 23, 59)) === '2026-01-05'`

  Takvim (bugün `T = '2026-11-24'`):
  - `cevapla(undefined, true, T)` → `{ d: 'tekrar', a: 1, son: T, vade: '2026-11-25' }`
  - `cevapla(undefined, false, T)` → `{ d: 'bilmiyorum', a: 0, son: T, vade: null }`
  - `cevapla({ d: 'bilmiyorum', a: 0, … }, true, T).vade === '2026-11-25'`
  - Günü gelmiş `{ d: 'tekrar', a: 1, vade: '2026-11-25' }`, `'2026-11-25'` tarihinde bilinirse → `a: 2`, `vade: '2026-11-28'`
  - Kaçırılan gün: `{ d: 'tekrar', a: 2, vade: '2026-11-28' }`, `'2026-11-29'` tarihinde bilinirse → `a: 3`, `vade: '2026-12-06'` (29 + 7)
  - `a: 4` ve günü gelmiş, bilinirse → `{ d: 'kalici', vade: null }`
  - Günü gelmiş `tekrar`, bilinmezse → `d: 'bilmiyorum'`, `a: 0`
  - Günü gelmemiş `tekrar` (`vade > bugün`), bilinirse → girdi nesnesiyle aynı değerler (takvim değişmez)
  - Günü gelmemiş `tekrar`, bilinmezse → `bilmiyorum`
  - `kalici`, bilinirse → `kalici`; bilinmezse → `bilmiyorum`
  - `kategori`: `vade <= bugün` ise `'bugun'`, sonra ise `'bekliyor'`
  - `gecikme({ vade: '2026-11-20' }, T) === 4`
  - `cevapla` girdiyi değiştirmez (`Object.freeze` ile dondurulmuş girdiyle sınanır)

- [ ] **Step 2:** `node --test tests/` → FAIL (modül yok)
- [ ] **Step 3:** `js/tarih.js` ve `js/srs.js`'yi yaz. Tarihler `Date(y, m-1, d)` ile yerel olarak kurulur; UTC kullanılmaz.
- [ ] **Step 4:** `node --test tests/` → tüm testler PASS
- [ ] **Step 5:** Commit: `feat: tekrar takvimi ve tarih yardımcıları`

### Task 2: Kayıt ve yedek

**Files:**
- Create: `js/kayit.js`, `tests/kayit.test.js`

**Interfaces:**
- Consumes: yok
- Produces:
  - `ANAHTAR = 'noroloji-kartlari:v1'`
  - `bosIlerleme(): Ilerleme`
  - `loadProgress(storage: Storage, now = Date.now()): Ilerleme`
  - `saveProgress(storage, p): boolean`. `setItem` hata verirse `false` döner.
  - `exportBackup(p): string`. Çıktı JSON: `{ app: 'noroloji-kartlari', v: 1, tarih, ilerleme }`.
  - `importBackup(text): { ok: true, ilerleme } | { ok: false, hata: string }`

- [ ] **Step 1: Failing tests.** Testlerde `Map` tabanlı sahte bir `Storage` kullanılır.
  - `loadProgress on empty storage returns bosIlerleme()`
  - `save then load round-trips`
  - `loadProgress moves corrupt data aside`:
    - `ANAHTAR` değeri `'{bozuk'` ya da `{ v: 99 }` olabilir.
    - Sonuç `bosIlerleme()` olur ve kaydedilmez.
    - `noroloji-kartlari:bozuk:<now>` anahtarı ham metni içerir.
  - `loadProgress fills missing fields`: `{ v: 1, kartlar: {} }` yüklenince `testYanlis: []` ve `ayar.karistir: false` eklenir.
  - `importBackup accepts exportBackup output`: Ayrıca baştaki ve sondaki boşluklar kırpılır.
  - `importBackup rejects foreign or broken text`:
    - Girdiler: `'merhaba'`, `'{"app":"baska"}'` ve `kartlar` değeri dizi olan bir nesne.
    - Her biri `ok: false` döner ve `hata` Türkçe bir cümledir.
  - `saveProgress returns false when setItem throws`
- [ ] **Step 2:** Run → FAIL
- [ ] **Step 3:** `js/kayit.js`'yi yaz. Doğrulama `v === 1` ve alan tiplerini kontrol eder; her `kartlar` değerinde `d` alanı dört değerden biri olmalıdır.
- [ ] **Step 4:** Run → PASS
- [ ] **Step 5:** Commit: `feat: ilerleme kaydı ve yedek`

### Task 3: Kart seçimi, oturum ve bölüm özeti

**Files:**
- Create: `js/oturum.js`, `tests/oturum.test.js`

**Interfaces:**
- Consumes: `cevapla`, `kategori`, `gecikme` (Task 1)
- Produces:
  - `kartSec(bolumler: Bolum[], ilerleme, { nolar: number[], filtre: 'tumu'|'yeni'|'bilmediklerim'|'bugun'|'ogrendiklerim' }, bugun): Kart[]`
    - `ogrendiklerim` = `bugun` + `bekliyor` + `kalici`.
    - `bugun` filtresi en çok gecikmişten en aza, eşitlikte kitap sırasıyla sıralanır.
    - Diğer filtreler kitap sırasındadır.
  - `oturumKur(kartlar: Kart[], { karistir: boolean }, rng = Math.random): Oturum`
    - `Oturum = { liste: string[], pos, tur, sonuc: { [id]: 'k'|'u' }, gecmis: [{ id, onceki: KartDurum|undefined }] }`
    - Liste kurulduktan sonra sabittir.
  - `oturumCevap(oturum, ilerleme, biliyor, bugun): { oturum, ilerleme }`. Saf fonksiyon, yeni nesneler döner.
  - `oturumGeriAl(oturum, ilerleme): { oturum, ilerleme }`. Kartın önceki durumunu, takvim dahil, birebir geri yükler.
  - `sonrakiTur(oturum): Oturum | null`. Bu turda `'u'` alanlarla yeni tur kurar; yoksa `null`.
  - `bolumOzeti(bolum, ilerleme, bugun): { toplam, bugun, bilmiyorum, ogrenilen, kalici }`

- [ ] **Step 1: Failing tests.** 2 bölüm ve 6 kartlık bir fikstür kullanılır.
  - `kartSec filters by nolar and filtre`: Her filtre için beklenen kimlik listesi.
  - `kartSec bugun sorts most overdue first`
  - `kartSec returns [] for empty filters`
  - `oturumCevap applies srs and records onceki`
  - `oturumGeriAl restores exact previous state`: Önce günü gelmiş `tekrar(2)` kartı bilinir, sonra geri alınır. Sonuçta durum ilk haliyle derin eşittir, `pos` bir geri gider.
  - `card unknown then known in next round becomes tekrar(1) due tomorrow`
  - `oturumCevap uses the today argument passed per call`: Aynı oturumda farklı `bugun` değerleri verilir ve vadeler buna göre hesaplanır.
  - `bolumOzeti ignores ids not in content`: İlerlemede içerikte olmayan `b1-k999` kimliği bulunur, sayımlar değişmez.
  - `oturumKur with karistir:false keeps order; with seeded rng permutes`
- [ ] **Step 2:** Run → FAIL
- [ ] **Step 3:** `js/oturum.js`'yi yaz.
- [ ] **Step 4:** Run → PASS
- [ ] **Step 5:** Commit: `feat: kart seçimi, oturum ve geri alma`

### Task 4: Test mantığı

**Files:**
- Create: `js/test.js`, `tests/test.test.js`

**Interfaces:**
- Produces:
  - `testKur(bolumler, { nolar, tur: 'bilgi'|'vaka'|'karisik', adet: number|'hepsi', sadeceYanlislar: boolean }, testYanlis: string[], rng = Math.random): TestSorusu[]`
    - `TestSorusu = { id, kok, siklar: string[5], dogru: number, aciklama, s, b, tur }`.
    - Şıklar karıştırılır ve `dogru` yeni sıraya göre güncellenir.
    - Soru sırası da karıştırılır.
  - `yanlisGuncelle(testYanlis, id, dogruMu): string[]`. Yanlışsa ekler (tekrarsız), doğruysa çıkarır.
  - `HARFLER = ['A', 'B', 'C', 'D', 'E']`

- [ ] **Step 1: Failing tests**
  - `testKur shuffles options but keeps the correct text at dogru`: 50 farklı tohumla denenir. `siklar[dogru]` her seferinde orijinal doğru metindir.
  - `testKur respects tur, nolar and adet`: `adet` mevcut sorudan büyükse mevcut olan kadarı döner.
  - `sadeceYanlislar limits to testYanlis ids`
  - `yanlisGuncelle adds once and removes on correct`
- [ ] **Step 2:** Run → FAIL
- [ ] **Step 3:** `js/test.js`'yi yaz. Karıştırma Fisher–Yates ile yapılır ve `rng` parametresini kullanır.
- [ ] **Step 4:** Run → PASS
- [ ] **Step 5:** Commit: `feat: test oluşturma ve yanlış takibi`

### Task 5: Veri denetimi ve Bölüm 1 verisinin taşınması

**Files:**
- Create: `tools/pdf_metin.py`, `tools/veri_dogrula.mjs`, `data/bolum1.js`, `data/index.js`, `tests/veri.test.js`
- Delete: `bolum1.js` (kök dizindeki prototip verisi)

**Interfaces:**
- Produces:
  - `dogrula(bolum): string[]`, hata listesi; boş liste geçti demektir.
  - `tools/pdf_metin.py <ilk_kitap_s> <son_kitap_s> <çıktı.txt>`
    - Okuduğu dosya: `C:\Users\ENES OĞUZ\Downloads\58.pdf`.
    - Kaynakçaları ve "CC BY" başlıklarını çıkarır, `[s.N]` işaretleri koyar.
    - Çalıştırma: `python -I`.
    - Çıktı repoya girmez, scratchpad'e yazılır.

- [ ] **Step 1: Failing test** (`tests/veri.test.js`)
  - Her bölüm için `dogrula(b)` boş dizi döner.
  - Bozuk bir fikstürde şu durumların her biri için birer hata dönmelidir:
    - tekrarlayan kimlik,
    - `sayfalar` aralığı dışında `s`,
    - 5'ten farklı şık sayısı,
    - aralık dışında `dogru`,
    - yanlış kimlik biçimi,
    - `vaka` oranı %40–60 dışında (bölümde 10'dan çok soru varsa).
- [ ] **Step 2:** Run → FAIL
- [ ] **Step 3:** Denetimi yaz. Prototipteki 50 kartı `data/bolum1.js`'ye `b1-k001…b1-k050` kimlikleriyle taşı; sıra korunur.
- [ ] **Step 4: Bölüm 1 için yaklaşık 40 test sorusu yaz.** Yarısı bilgi, yarısı vaka sorusu olur. Önce `tools/pdf_metin.py 1 59` çıktısını oku. Her sorunun doğru şıkkı ve açıklaması kitap metnindeki bir cümleye dayanmalı; `s` o cümlenin sayfasıdır.
- [ ] **Step 5: Doğruluk geçişi.** Her soruyu metindeki sayfasıyla yeniden karşılaştır. Yanlış şıkların kitaba göre açıkça yanlış olduğunu kontrol et. Desteklenmeyen soruyu sil ya da düzelt.
- [ ] **Step 6:** `node --test tests/` → PASS
- [ ] **Step 7:** Commit: `feat: veri denetimi, Bölüm 1 kartları ve soruları`

### Task 6: Arayüz (ana ekran, kart çalışma, ayarlar)

**Files:**
- Create: `css/app.css`, `js/app.js`, `js/ui/ana.js`, `js/ui/calis.js`, `js/ui/ayarlar.js`, `fonts/*`
- Modify: `index.html` (prototip kabuğa dönüşür)

**Interfaces:**
- Consumes: Task 1–4 fonksiyonları, `data/index.js`
- Produces: `#ana`, `#calis`, `#ayarlar` ekranları. Task 7 bu çatıya `#test` ekranını ekler. `app.js` şunları dışa verir:
  - `durum()` → `{ ilerleme, bolumler }`
  - `kaydet()`
  - `git(hash)`

- [ ] **Step 1: Yazı tipleri.** Inter (400, 500, 600) ve Space Grotesk (500, 600, 700) woff2 dosyalarını `fonts/` klasörüne indir, `@font-face` ile tanımla. İndirme kaynağı jsDelivr'deki `@fontsource` paketleri, sürüm sabit. Lisansı `fonts/OFL.txt` olarak koy.
- [ ] **Step 2: Ana ekran.**
  - Üstte "Bugün tekrar: N kart [Çalış]" ve "Bilmediklerim: N kart [Çalış]". Bunlar bütün bölümleri kapsar.
  - Ardından "Karışık çalış": bölüm onay kutuları ve filtre seçimi (tümü, yeni, bilmediklerim, bugün, öğrendiklerim), bir de karıştır anahtarı.
  - Sonra 6 bölüm satırı. Her satırda `bolumOzeti` değerleri ile [Kartlar] ve [Test] düğmeleri.
  - [Kartlar] düğmesi bir filtre seçimi açar: tümü, yeni, bilmediklerim, bugün, öğrendiklerim.
- [ ] **Step 3: Çalışma ekranı.**
  - Prototipteki kaydırma, çevirme, damga ve klavye davranışı aynen kalır.
  - Her karar `oturumCevap(…, bugun())` çağırır ve hemen `kaydet()` yapar.
  - Geri alma `oturumGeriAl` ile yapılır.
  - Tur sonunda "Bilmediklerimi çalış" (`sonrakiTur`) ve "Ana ekrana dön" seçenekleri çıkar.
  - Boş seçimde "Bu seçimde kart yok" mesajı ve ana ekrana dönüş düğmesi gösterilir.
- [ ] **Step 4: Ayarlar ekranı.**
  - "Yedeği kopyala": panoya yazar. Başarısız olursa metni seçili bir textarea'da gösterir.
  - "Yedeği geri yükle": textarea ve uygula düğmesi. `importBackup` hata verirse mesajı gösterir, ilerlemeye dokunmaz.
  - Kaynak ve lisans metni, uygulama sürümü.
  - `saveProgress` `false` dönerse ana ekranda "Kayıt yapılamadı, yedek alın" uyarısı gösterilir.
- [ ] **Step 5: Ekran doğrulaması.** `npx http-server -p 8091` ile sun. Playwright'ta iPhone 13 cihaz profiliyle ve Chromium ile şunları dene:
  - ana ekran açılır;
  - Bölüm 1 kartları açılır, 3 kart kaydırılır, geri alınır;
  - sayfa yenilenince ilerleme kalır;
  - yedek kopyala ve geri yükle çalışır;
  - konsolda hata yok.

  Light ve dark ekran görüntüsü al, bir kez bak, varsa düzelt.
- [ ] **Step 6:** Commit: `feat: ana ekran, kart çalışma ve yedek arayüzü`

### Task 7: Test ekranı

**Files:**
- Create: `js/ui/test.js`
- Modify: `js/app.js` (`#test` rotası), `css/app.css`

**Interfaces:**
- Consumes: `testKur`, `yanlisGuncelle`, `HARFLER` (Task 4); `durum`, `kaydet`, `git` (Task 6)

- [ ] **Step 1: Başlangıç seçimi.**
  - Bölümler (tek, birkaç ya da hepsi).
  - Soru türü: bilgi, vaka, karışık.
  - Soru sayısı: 10, 20, 40 ya da hepsi.
  - "Yalnızca yanlışlarım" kutusu; yanlış yoksa pasif ve sayısı görünür.
- [ ] **Step 2: Soru ekranı.**
  - Kök metin, A–E şıkları. Başta "Vaka" ya da "Bilgi" etiketi ve alt bölüm görünür.
  - Şıka dokununca seçim kilitlenir. Doğruysa yeşil. Yanlışsa seçilen şık kırmızı, doğru şık yeşil olur; altında açıklama ve "Kitap s. N" çıkar.
  - Ardından [Sonraki] düğmesi. Her cevapta `yanlisGuncelle` çağrılır ve `kaydet()` yapılır.
- [ ] **Step 3: Sonuç ekranı.** "N / M doğru" ve yanlış soruların listesi (kök metnin başı ve sayfa). Altında [Yanlışlarımı tekrar çöz] ve [Ana ekran] düğmeleri.
- [ ] **Step 4: Ekran doğrulaması.** Task 6 Step 5'teki düzenle: Bölüm 1'den 5 soruluk bir test, en az bir yanlış cevap, açıklama ve sayfa görünür, yanlışları tekrar çöz çalışır.
- [ ] **Step 5:** Commit: `feat: çoktan seçmeli test ekranı`

### Task 8: İnternetsiz çalışma ve ana ekran uygulaması

**Files:**
- Create: `manifest.webmanifest`, `sw.js`, `icons/icon-180.png`, `icons/icon-192.png`, `icons/icon-512.png`
- Modify: `index.html` (manifest, `apple-touch-icon`, `apple-mobile-web-app-capable`, `theme-color`, SW kaydı)

**Interfaces:**
- Produces:
  - `sw.js` içinde `CACHE_VERSION = 'nk-<tarih>-<n>'` ve `DOSYALAR` listesi (sitedeki tüm dosyalar).
  - Strateji: önce önbellek, yoksa ağ. `activate` olayında eski önbellekler silinir.

- [ ] **Step 1: Ayarlar.**
  - Manifest: `name: "Nöroloji Kartları"`, `short_name: "Nöro Kartlar"`, `display: "standalone"`, `start_url: "./"`, `scope: "./"`.
  - Simgeyi Playwright ile bir HTML'den PNG olarak üret.
- [ ] **Step 2: Service worker.**
  - `install` olayında `DOSYALAR` önbelleğe alınır.
  - Yeni sürüm bulunduğunda ana ekranda "Yeni sürüm hazır, [Yenile]" çubuğu görünür. Bu çubuk zorla yenilemez.
- [ ] **Step 3: Denetim betiği.** `tools/veri_dogrula.mjs`'ye ekle: sitede olup `DOSYALAR`'da olmayan bir dosya varsa hata ver.
- [ ] **Step 4: İnternetsiz doğrulama.** Playwright ile şunları dene:
  - sayfa açılır, SW aktif olur;
  - `context.setOffline(true)` ile bağlantı kesilir, sayfa yenilenir;
  - ana ekran, bir kart ve bir test sorusu çalışır.
- [ ] **Step 5:** Commit: `feat: internetsiz çalışma ve ana ekran desteği`

### Task 9: Yayın

- [ ] **Step 1: Repo.** `gh repo create EnesUguzz/noroloji-kartlari --public --source . --push`
- [ ] **Step 2: Pages.** `gh api -X POST repos/EnesUguzz/noroloji-kartlari/pages -f "source[branch]=main" -f "source[path]=/"` ile Pages'ı aç.
- [ ] **Step 3: Erişim kontrolü.** `https://enesuguzz.github.io/noroloji-kartlari/` adresi 200 döner. Playwright ile canlı adreste Task 8 Step 4 tekrarlanır.
- [ ] **Step 4: Kurulum anlatımı.** Kullanıcıya iPhone kurulum adımlarını ver:
  - Safari'de adresi aç.
  - Paylaş → Ana Ekrana Ekle.
  - Uygulamayı bir kez internetle aç.

### Tasks 10–14: Bölüm 2–6 içeriği (her bölüm ayrı görev)

Her görev aynı adımları izler:

| Task | Bölüm | Kitap s. | Kart | Soru |
|---|---|---|---|---|
| 10 | 2 Epilepsiler | 60–146 | ~70 | ~55 |
| 11 | 3 Baş Ağrıları | 147–187 | ~35 | ~30 |
| 12 | 4 Uyku Bozuklukları | 188–209 | ~25 | ~20 |
| 13 | 5 Hareket ve Denge Bozuklukları | 210–305 | ~75 | ~60 |
| 14 | 6 Demanslar | 306–son | ~50 | ~40 |

**Files:**
- Create: `data/bolumN.js`
- Modify: `data/index.js`, `sw.js` (`DOSYALAR` listesi ve `CACHE_VERSION`)

- [ ] **Step 1: Metni çıkar.** `python -I tools/pdf_metin.py <ilk> <son> <scratchpad>/bN.txt`. Alt bölüm başlıklarını içindekilerden ve metinden al.
- [ ] **Step 2: Metni oku.** Alt bölümlerin hepsi okunur; kart ve soru sayısı alt bölüm uzunluğuyla orantılı dağıtılır.
- [ ] **Step 3: Kartları yaz.** Prototipteki tarz: kısa soru, maddeli cevap, `s` = cümlenin kitap sayfası.
- [ ] **Step 4: Soruları yaz.** Yarısı bilgi, yarısı vaka. Vaka soruları yalnızca kitabın net cevap verdiği konulardan kurulur. Açıklama doğrunun nedenini ve en çekici yanlış şıkkın neden yanlış olduğunu söyler.
- [ ] **Step 5: Doğruluk geçişi.** Her öğeyi metindeki sayfasıyla karşılaştır. Desteklenmeyeni düzelt ya da sil.
- [ ] **Step 6: Denetim.** `node --test tests/` → PASS. `node tools/veri_dogrula.mjs` → hata yok.
- [ ] **Step 7: Yayınla.** Commit: `feat: Bölüm N kartları ve soruları`. Push; Pages güncellenir, telefonda bir sonraki açılışta "yeni sürüm" çubuğu çıkar.
