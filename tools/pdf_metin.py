"""Kitaptan bir sayfa aralığının metnini [s.N] işaretleriyle çıkarır.

Kullanım: python -I tools/pdf_metin.py <ilk_kitap_s> <son_kitap_s> <cikti.txt>
Kitap sayfası = PDF sayfası - 13. Kaynakça blokları ve "CC BY" sayfa başlıkları atılır.
Çıktı yalnızca içerik yazarken okumak içindir; repoya girmez.
"""
import re
import sys

import pymupdf

PDF = r"C:\Users\ENES OĞUZ\Downloads\58.pdf"
KAYMA = 13
KAYNAK_BASI = re.compile(r"^(Kaynaklar|KAYNAKLAR|Kaynakça|KAYNAKÇA)\s*$")
GURULTU = re.compile(r"^(\d{1,3}|Nöroloji Ders Kitabı II|lisans altında lisanslanmıştır\.?|Bölüm \d+\.\d+: .*)$")
BOLUM_BASI = re.compile(r"^(\d+\.\d+(\.\d+)?\.?\s+\S|BÖLÜM\s+\d+)")


def main(ilk: int, son: int, cikti: str) -> None:
    doc = pymupdf.open(PDF)
    son = min(son, doc.page_count - KAYMA)
    satirlar = []
    kaynakta = False
    for s in range(ilk, son + 1):
        satirlar.append(f"[s.{s}]")
        for satir in doc[s - 1 + KAYMA].get_text().splitlines():
            t = satir.strip()
            if not t or GURULTU.match(t) or "CC BY" in t:
                continue
            if KAYNAK_BASI.match(t):
                kaynakta = True
                continue
            if kaynakta and BOLUM_BASI.match(t):
                kaynakta = False
            if not kaynakta:
                satirlar.append(t)
    with open(cikti, "w", encoding="utf-8") as f:
        f.write("\n".join(satirlar) + "\n")
    print(f"{cikti}: {len(satirlar)} satır, kitap s. {ilk}-{son}")


if __name__ == "__main__":
    main(int(sys.argv[1]), int(sys.argv[2]), sys.argv[3])
