# Product

<!-- impeccable:product-schema 1 -->

> Kaynak: `docs/BASVURU.md` (başvuru metni), `README.md`, çalışan kod. Görüşme turu yapılmadı;
> alanlar bu belgelerden çıkarıldı ve kullanıcının 5 Ekim 2026 talimatlarıyla teyit edildi.

## Platform

web

## Users

- **Hackathon jürisi (Zemin360, 9–11 Ekim 2026):** GİRVAK, İSTKA, İstanbul Bilgi Üniversitesi temsilcileri. Birkaç dakikada ürünün altı problemi gerçekten çözdüğünü, çalıştığını ve açık kaynak web hizmeti olduğunu görmek ister.
- **Kurum (işletme, kamu birimi, STK):** Muğlak bir şikâyeti çözülebilir bir ihtiyaca çevirmek, kanıtı doğrulanmış genç yetenek bulmak, pilotu şeffaf takip etmek ister.
- **Genç yetenek / girişim:** CV yazmadan, ürettiği doğrulanabilir işle görünür olmak; eşleşmediğinde eksiğini bilmek ister.

## Product Purpose

Kurum–girişim ekosistemi için kanıt tabanlı eşleşme ve iş birliği altyapısı. Üç nesne: **Kanıt** (doğrulanmış üretim), **İhtiyaç** (yapılandırılmış problem), **Pilot** (ölçülen iş birliği). Başarı: jüri döngüyü canlı izler — kanvas → yayın → açıklanabilir eşleşme → pilot → çift onay → profilde S3 kanıt.

## Positioning

Beyan değil, kanıt. Kariyer/CV platformlarının tersine özgeçmiş, güven puanı ya da kara kutu öneri yoktur: her iddia S1/S2/S3 seviyesi taşır, her skorun formülü görünür, her iş birliği hash zincirli deftere iki tarafın onayıyla yazılır. Bir altyapı/ölçüm sistemidir, kariyer sitesi değildir.

## Operating Context

- Sahne demosu: projektör, iki tarayıcı penceresi (Kurum / Yetenek rolü), sekmeler arası canlı senkron; internet kesilse de arayüz çalışmalı (fontlar gömülü).
- Gerçek S2 doğrulaması: GitHub (bio/gist kodu), DNS TXT (DoH).
- Ritim: çeyreklik ihtiyaç turları.

## Capabilities and Constraints

- Açıklanabilir eşleşme (4 bileşen), kopya eser tespiti, takım kompozisyonu, yükselen sinyal, problemle arama, çözülebilirlik skoru + yayın eşiği (70), kural tabanlı taslak motoru, SHA-256 zincirli defter, sessizlik göstergesi.
- Demo verisi tarayıcıda (localStorage); üretimde Cloudflare D1 planlı.
- Astro 7 + React 19 + Tailwind 4; fontlar ve kütüphaneler paket içi.
- Açık kaynak web hizmeti olmak zorunlu; lisans kararı açık.

## Brand Commitments

- Ad: NİRENGİ (haritacılıkta üzerine güvenle ölçüm yapılan sabit referans noktası). Slogan: “Beyan değil, kanıt.”
- Renkler organizatör Zemin360 ailesine yakın olmalı (indigo #6451E7, mor #9B04DA, turuncu #F99400, camgöbeği #00B4D8) — kullanıcı talimatı.
- Kullanıcı talimatı (5 Ekim): site bir mühendislik sistemi gibi işlemeli; yapay zekâ üretimi gibi görünmemeli; anbeankampus.co gibi kariyer platformu görünümünden ayrışmalı. Önceki “pafta” (kâğıt/mürekkep) görünümü beğenilmedi.

## Evidence on Hand

- Çalışan motor ve 12 birim testi (`tests/engine.test.ts`), uçtan uca Playwright akışı.
- Kurum/kişi verisi **kurgusaldır** ve öyle etiketlenmelidir. Gerçek kullanıcı, müşteri, istatistik, referans yok — uydurulamaz.

## Product Principles

1. Her sayı yeniden hesaplanabilir olmalı: arayüzdeki skor, motorun o an ürettiği skordur.
2. Gerekçe görünür: hiçbir sonuç kara kutu değildir.
3. Gerçek ile demo ayrımı her zaman açık.
4. Önyargı kapalı varsayılan: kör keşif.
5. Kayıt değiştirilemez: çift onay + zincir.

## Accessibility & Inclusion

Türkçe karakter desteği zorunlu (latin-ext). `prefers-reduced-motion` tam desteklenir. Projektörde okunabilir kontrast.
