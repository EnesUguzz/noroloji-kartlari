# Nöroloji Kartları: Tasarım

Tarih: 2026-11-24 · Durum: onaylandı (yaklaşım ve kapsam konuşmada onaylandı)

## Amaç ve neden

Nöroloji uzmanlık öğrencisi bir kullanıcı, *Nöroloji Ders Kitabı II: Sinir Sistemi Hastalıkları ve Tedavi* (İÜC Üniversite Yayınevi, 2024, CC BY 4.0, 366 sayfa PDF) kitabını **kalıcı olarak öğrenmek** istiyor. Sınav için değil. Bu yüzden uygulamanın merkezi aralıklı tekrar. Kartlar ve testler kitabın 6 bölümünden üretilir. Uygulama kullanıcının **iPhone'unda** çalışacak.

Bölüm 1 için 50 kartlık bir prototip yapıldı ve beğenildi. Prototipte soru önde, cevap arkada; sağa kaydırınca biliyorum, sola kaydırınca bilmiyorum; kitap sayfa numarası gösteriliyor. Prototip `index.html` ve `bolum1.js` dosyalarında. Bu tasarım prototipi tam uygulamaya genişletir.

## Hedefler

1. **6 bölümün hepsi için kartlar.** Kart sayısı bölüm uzunluğuyla orantılı; bölüm başına kabaca 25–80.
2. **6 bölümün hepsi için çoktan seçmeli testler.**
   - Soruların yarısı bilgi sorusu, yarısı vaka sorusu.
   - Yanlış cevapta doğru şık, açıklama ve kitap sayfa numarası gösterilir.
3. **Aralıklı tekrar.**
   - Bilinen kart 1, 3, 7 ve 15 gün sonra tekrar edilir.
   - Tekrarda bilinemeyen kart "bilmediklerim"e düşer.
4. **Bölümler bağımsız, kilit yok.** Japonca uygulamasındaki seviye mantığı burada yok, her bölüm her zaman açık.
5. **Karışık çalışma.** Kullanıcı hangi bölümlerin karışacağını ve hangi kartların gireceğini seçer: tümü, öğrendiklerim, bilmediklerim ya da bugün tekrar edilecekler.
6. **iPhone'da uygulama gibi çalışma.**
   - Ana ekrana eklenir, tam ekran açılır.
   - İlk açılıştan sonra internetsiz çalışır.
   - İlerleme cihazda kalır.
   - Yedek alınıp geri yüklenebilir.

## Hedef olmayanlar

- Hesap, giriş ve cihazlar arası senkronizasyon. Cihaz değiştirme yedekle yapılır.
- Bildirimler. Sunucu gerektirir; ilk sürümde yok.
- App Store'da ya da native uygulama olarak dağıtım.
- Seviye ve kilit sistemi.
- Günlük kart sınırı.

## Olmaması gerekenler (çalışsa bile başarısızlık sayılır)

- **Kitapla çelişen ya da kitapta olmayan tıbbi bilgi.** Her kart ve her soru kitaptaki metne dayanır ve sayfa numarası taşır. Vaka sorularının doğru şıkkı kitapta açıkça desteklenmelidir. Kitabın net cevap vermediği konudan vaka sorusu yazılmaz.
- **İlerlemenin kaybolması.** Bu şu durumları kapsar:
  - içerik güncellemesi,
  - uygulama sürüm güncellemesi,
  - bozuk ya da eski formatlı kayıt.
- **Kullanıcıyı kısıtlayan ya da dırdır eden akış:** sınır, zorunlu sıra, kilit.

## Kısıtlar

- **Hedef cihaz** iPhone, Safari, ana ekrana eklenmiş web uygulaması. Safari'nin "7 gün girilmeyen sitenin verisini sil" kuralı ana ekrana eklenmiş uygulamalara uygulanmaz. Yine de yedek özelliği zorunludur.
- **Yayın** GitHub Pages üzerinden, EnesUguzz hesabında **herkese açık** repo. İçerik CC BY 4.0 olduğu için kaynak gösterilir: kitap adı, yayınevi, lisans ve DOI 10.5152/5800.
- **Commit kuralı.** Commit'lerde Claude'a ait "Co-Authored-By" ya da "Generated with" satırı olmaz. Repo yalnızca EnesUguzz adına görünür. Git e-postası noreply adresidir.
- **Dışarıdan hiçbir dosya çekilmez.** Yazı tipleri dahil her şey uygulamayla birlikte paketlenir. Google Fonts kullanılmaz.
- **Arayüz dili** Türkçe.

## Seçilen yaklaşımlar

Konuşmada şu üç yol karşılaştırıldı:

| Yol | Artısı | Eksisi |
|---|---|---|
| **A. Claude artifact sayfası** | İlerleme claude.ai hesabında senkronize olur | Hesap ve giriş gerekir; iPhone'da uygulama gibi durmaz; internetsiz çalışmaz |
| **B. Ana ekrana eklenen web uygulaması (seçildi)** | Hesap gerekmez, internetsiz çalışır, ücretsiz, iPhone'da uygulamaya en yakın sonuç | Cihazlar arası senkron yok, yedekle çözülür |
| **C. Native uygulama** | Gerçek mobil uygulama | iOS için Apple geliştirici hesabı gerekir (yıllık 99 dolar); ücretsiz yükleme 7 günde bir sona erer; bu iş için gereğinden ağır |

Kullanıcı, B'nin web uygulaması olduğunu, internetsiz çalıştığını ve güncellemelerin internet varken geldiğini anlayarak B'yi onayladı.

## Kullanıcının verdiği kararlar

### Test soruları

- Soruların **yarısı bilgi**, **yarısı vaka** sorusu.
- Yanlış cevapta doğru şık, açıklama ve sayfa numarası gösterilir.

### Tekrar takvimi

Aralıklar: öğrendikten 1 gün sonra, 3 gün sonra, 7 gün sonra, 14–16 gün sonra. Uygulamada 15 gün kullanılır. 15 günlük tekrarı da geçen kart **kalıcı öğrenildi** olur. Bu kart takvimden çıkar ama karışık çalışmada yine seçilebilir.

**Tekrar günü kaçırılırsa:**
- Kart kaybolmaz ve kilitlenmez. Uygulama ilk açıldığında "bugün tekrar" listesinde gecikmiş olarak durur.
- Liste en çok gecikmiş karttan başlar.
- Sonraki aralık, planlanan günden değil, **kartın gerçekten tekrar edildiği günden** sayılır.

**Tekrarda bilinemeyen kart:**
- "Bilmediklerim"e düşer ve takvimde **en baştan** başlar.
- Kullanıcı kartı çalışırken tekrar "biliyorum" dediğinde, ertesi gün 1. tekrara girer.

**Sınır:** Günlük kart sınırı yoktur. Kullanıcı istediği kadar çalışır, istediği an bırakır.

### Bilmediklerim ve karışık çalışma

- Her kart her zaman kendi bölümüne aittir. "Bilmediklerim", "bugün tekrar" ve "öğrendiklerim" ayrı yerler değil, kartın durumudur.
- Bu durumlar hem bölümün içinden hem tüm bölümler genelinde çalışılabilir.

### Ana ekran

Şöyle görünür:

```
Bugün tekrar: 14 kart              [Hepsini çalış]
Bilmediklerim: 9 kart              [Hepsini çalış]
Karışık çalış (bölüm ve kart türü seç)

Bölüm 1  Beyin Damar     tekrar 6 · bilmediğim 4 · öğrenilen 20/49   [Kartlar] [Test]
...
```

## Kart durum modeli (tek bir kartın yaşamı)

| Durum | Anlamı |
|---|---|
| `yeni` | Hiç çalışılmamış |
| `bilmiyorum` | Çalışmada ya da tekrarda "bilmiyorum" denmiş. Takvimde değil; kullanıcı onu çalışıp "biliyorum" diyene kadar bilmediklerimde kalır |
| `tekrar(aşama 1–4)` | "Biliyorum" dendi. Bir sonraki tekrar günü `sonGörülme + aralık[aşama]` ile bulunur; aralıklar [1, 3, 7, 15] |
| `kalici` | 4. aşamada da bilindi |

**Geçişler:**

| Bulunduğu durum | Ne oldu | Yeni durum |
|---|---|---|
| `yeni` ya da `bilmiyorum` | Biliyorum | `tekrar(1)`, tarih yarın |
| `yeni` ya da `bilmiyorum` | Bilmiyorum | `bilmiyorum` |
| `tekrar(n)`, günü gelmiş | Biliyorum | n<4 ise `tekrar(n+1)`, tarih bugün + aralık[n+1]; n=4 ise `kalici` |
| `tekrar(n)`, günü gelmiş | Bilmiyorum | `bilmiyorum` |
| `tekrar(n)`, günü gelmemiş (karışık çalışmada) | Biliyorum | Takvim değişmez |
| `tekrar(n)`, günü gelmemiş (karışık çalışmada) | Bilmiyorum | `bilmiyorum` |
| `kalici` | Bilmiyorum | `bilmiyorum` |

Günü gelmemiş kartı erken bilmek takvimi ilerletmez. Böylece aralıklar bozulmaz.

**Gün hesabı:** Telefonun yerel takvim günüyle yapılır, saatle değil. "Yarın" demek ertesi takvim günü demektir.

## Teknik iskelet

Bu bölüm konuşmada değil, yapımcı tarafından belirlendi:

- **Yapı.** Derleme adımı olmayan statik site: HTML, CSS ve sade JavaScript modülleri. Bağımlılık yoktur.
- **Mantık ve test.** Tekrar takvimi ve durum geçişleri saf fonksiyonlardır, Node'un yerleşik test aracıyla test edilir.
- **İnternetsiz çalışma.** `manifest.webmanifest`, ana ekran simgeleri (apple-touch-icon dahil) ve tüm dosyaları önbelleğe alan bir service worker. Önbellek adı sürüme bağlıdır; yeni sürüm yayınlanınca eski önbellek silinir.
- **Veri dosyaları.** İçerik bölüm başına bir veri dosyasında durur, her öğenin kalıcı bir kimliği vardır:
  - kart: kimlik (örn. `b1-k001`), alt bölüm, sayfa, soru, cevap;
  - test sorusu: kimlik (örn. `b1-t001`), tür (bilgi ya da vaka), soru kökü, şıklar, doğru şık, açıklama, sayfa.

  İlerleme kimliklere bağlıdır. İçerik düzeltilse de ilerleme korunur; silinen öğenin kaydı yok sayılır.
- **Saklama.** `localStorage`, tek bir anahtar altında sürüm numaralı bir kayıt. Sürüm değişirse kayıt yükseltilir; bozuk kayıt sessizce silinmez, yedek olarak ayrı bir anahtara alınır.
- **Yedek.** "Yedeği kopyala" metni panoya koyar. iOS'ta indirme sorunlu olabileceği için metin seçilebilir olarak da gösterilir. "Yedeği geri yükle" yapıştırılan metni doğrular, sonra uygular.

## Testler

- Testler bölüm bazında ya da karışık başlatılabilir. Kullanıcı soru sayısını ve türünü (bilgi, vaka, karışık) seçer.
- Şıklar her soruda karıştırılır.
- Cevaplanınca hemen geri bildirim verilir:
  - doğruysa yeşil;
  - yanlışsa seçilen şık kırmızı, doğru şık yeşil, altında açıklama ve "Kitap s. N".
- Test sonunda skor ve "Yanlışlarımı tekrar çöz" seçeneği gösterilir.
- **Yapımcının kararı:** Test yanlışları kart takvimini etkilemez; ayrı bir "test yanlışlarım" listesinde tutulur. Kartlar ve sorular ayrı içerik olduğu için birini ötekine bağlamak eşlemeyi belirsizleştirirdi.

## Çalışma oturumu (yapımcının kararı)

- **Oturumun kart listesi baştan sabitlenir.** Kartın durumu oturum ortasında değişse de liste aynı kalır.
- **Turlar ve geri alma kalır.** Prototipteki gibi tur sonunda "Bilmediklerimi çalış" ile o oturumda bilinmeyenler yeniden çalışılabilir. Kaydırma geri alınabilir.
- **Geri alma kartın önceki durumunu geri getirir.** Kart takvimdeyse, takvimdeki yeri ve tarihi de eski haline döner. Bunun için her kararda kartın önceki durumu saklanır.
- **Aynı oturumda önce bilinmeyip sonra bilinen kart** geçiş tablosuna göre `tekrar(1)` olur ve ertesi gün tekrar edilir.

## Prototipten geçiş

- Prototip yalnızca bilgisayarda Claude önizlemesi olarak açıldı, telefonda kullanılmadı. Bu yüzden prototipteki ilerlemeyi taşımaya gerek yok.
- Yeni uygulama GitHub Pages adresinde sıfırdan başlar.

## Kaynak ve bölümler

PDF dosyası `C:\Users\ENES OĞUZ\Downloads\58.pdf`. Kitap sayfası, PDF sayfa numarasının 13 eksiğidir.

| Bölüm | Başlık | Kitap sayfaları |
|---|---|---|
| 1 | Beyin Damar Hastalıkları | 1–59 |
| 2 | Epilepsiler | 60–146 |
| 3 | Baş Ağrıları | 147–187 |
| 4 | Uyku Bozuklukları | 188–209 |
| 5 | Hareket ve Denge Bozuklukları | 210–305 |
| 6 | Hafıza, Bilişsel İşlev Bozuklukları, Demanslar | 306–kitap sonu |

Alt bölümler kitabın içindekiler sayfasından alınır.

## İçerik üretimi

- PDF metni bölüm bölüm çıkarılır; kaynakça çıkarılır. Her öğe yalnızca kitaptaki metinden yazılır ve kitap sayfa numarası taşır. Sayfa numarası kitabınkidir, PDF'inki değil; PDF sayfası eksi 13.
- Her bölüm yazıldıktan sonra öğeler yeniden metinle karşılaştırılır ve doğrulanır.
- Vaka sorusunun yanlış şıkları gerçekçi olmalıdır, ama kitaba göre açıkça yanlış olmalıdır.
- Mevcut Bölüm 1 kartları korunur, yalnızca yeni kimlik biçimine taşınır.

**Hedef sayılar (yapımcının kararı; bölüm uzunluğu ve konu yoğunluğuna göre esneyebilir):**

| Bölüm | Sayfa | Kart | Test sorusu |
|---|---|---|---|
| 1 | 59 | 50 (mevcut) | ~40 |
| 2 | 87 | ~70 | ~55 |
| 3 | 41 | ~35 | ~30 |
| 4 | 22 | ~25 | ~20 |
| 5 | 96 | ~75 | ~60 |
| 6 | 60 | ~50 | ~40 |

Toplam yaklaşık 305 kart ve 245 soru.

## Yapımcıya bırakılanlar

- Görsel ayrıntılar. Prototipin dili korunur: renkler, kart çevirme, kaydırma, damga.
- Dosya düzeni ve modül ayrımı.
- Service worker güncelleme akışının ayrıntısı: sessiz güncelleme ya da "yeni sürüm var" uyarısı.
