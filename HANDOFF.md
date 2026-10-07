# NİRENGİ — Devir-Teslim

**Son güncelleme:** 5 Ekim 2026
**Hackathon:** 9–11 Ekim 2026, İstanbul (Zemin360 · GİRVAK + İSTKA + Bilgi Üniversitesi)
**Ödül:** 200.000 TL geliştirme bütçesi + 4 aylık GİRVAK süreci · koşul: açık kaynak web hizmeti

Ürün anlatımı, çalıştırma ve mimari → `README.md`. Sahne akışı → `docs/DEMO.md`. Başvuru metni → `docs/BASVURU.md`.

## 5 Ekim: front-end baştan yazıldı

Eski arayüz (mor SaaS şablonu, sabit kodlu sayfalar, tutarsız mock veri) `../_eski-frontend-yedek/` altında duruyor. Yeni sürümde:

- **Görsel kimlik (v2, akşam v3 ile değişti):** “pafta” dili — kâğıt/mürekkep yüzeyler, tek sinyal rengi (işaret turuncusu), kontur çizgileri, koordinat etiketleri. Doğrulama seviyeleri renk + şekil taşır (S1 kesik ▵, S2 ▵, S3 dolu ▲). Aydınlık/karanlık tema. Fontlar (Instrument Serif, IBM Plex Sans/Mono) pakete gömülü — internet olmadan da çalışır.
- **Çalışan motor:** `src/lib/engine/` — açıklanabilir eşleşme (4 bileşen), kopya eser tespiti, takım kompozisyonu, yükselen sinyal, problemle arama, çözülebilirlik skoru + yayın eşiği, kural tabanlı taslak motoru, SHA-256 zincirli pilot defteri. 12 birim testi (`npm test`).
- **Gerçek S2 doğrulaması:** GitHub hesap sahipliği (bio/gist’e tek kullanımlık kod), DNS TXT (Google/Cloudflare DoH). Sunucu ve sır gerekmez.
- **Uçtan uca döngü:** kanvas → yayın → eşleşme → pilot → teslim → kurum onayı → profilde S3 kanıt. Playwright ile baştan sona doğrulandı, konsol hatası 0.
- **Demo turu paneli** (sağ alt) ve **rol anahtarı** (Kurum / Yetenek, sekme başına) — iki pencereyle çift onay canlı gösterilir.
- Eski kurulumdaki kırık bağımlılık çözüldü: `@astrojs/tailwind` Astro 7 ile uyumsuzdu, temiz `npm install` hata veriyordu → Tailwind 4 + `@tailwindcss/vite`.
- Sahte istatistikler (“200+ profil”, “%89 doğruluk”) ve sahte “GitHub ile Bağlan” kaldırıldı. Kurum/kişi verisi kurgusal ve sitede öyle etiketli; `/yontem#veri` neyin gerçek neyin demo olduğunu açıkça listeler.

## 5 Ekim (akşam): görsel kimlik v3 — Zemin360 uyumu + sinematik

- Renkler Zemin360 sitesinden alındı: #6451E7 → #9B04DA gradyan, #F99400 turuncu, #00B4D8 camgöbeği, koyu lacivert. Nokta deseni, büyük yuvarlak renkli kartlar, dönen “HEMEN DENE” mührü onların diline selam.
- Ana sayfa baştan: WebGL zemin sahnesi (three.js), çapraz kayan şeritler, kaydırdıkça aydınlanan manifesto, sabitlenen yatay altı problem şeridi, döngü hikâyesi (token halkada ilerler), yükselen merdiven çubukları, canlı motor kartı, bento kapanış.
- Uygulama sayfaları: mor başlık bantları, sayım animasyonlu skor kadranları, çift onayda tam ekran “Kanıt mühürlendi” anı.
- Önceki (pafta) sürümün ana sayfa bölümleri `../_eski-frontend-yedek/v2-landing/` altında.

## 5 Ekim (gece): görsel kimlik v4 — ölçüm tezgâhı

- v3 (mor gradyan bantlar, WebGL arazi, kayan şeritler, dönen rozet, bento) “yapay zekâ üretimi / kariyer platformu” gibi bulundu. Bölümleri `../_eski-frontend-yedek/v3-landing/` altında.
- Yeni dil: sayfa bir ölçüm cihazı. İlk ekranda canlı tezgâh (`src/components/landing/Bench.tsx`): eşleşme kanalları aç/kapa, KANIT izi, DEFTER zinciri + kurcalama. Altı problem bir veri sayfası tablosu, merdiven bir kalibrasyon tablosu, döngü bir sinyal yolu şeması, kanvas iki öz sınama raporu (derleme anında motorla üretilir), BOM + revizyon planı.
- three.js, lenis, Unbounded, Manrope kaldırıldı; Archivo (genişlik ekseni) eklendi. Ana sayfa artık önceden derleniyor (`prerender`).
- Ortak web skill’leri projeye bağlandı: `.claude/skills` → `C:\Workspace\.agents\skills` (junction). Impeccable kayıtları: `PRODUCT.md`, `.impeccable/surfaces/` (yön sözleşmesi), `.impeccable/review/` (ekran görüntüleri).

## Sırada (öncelik sırasıyla)

1. ~~**Lisans kararı.**~~ MIT seçildi (`LICENSE`).
2. ~~**GitHub deposu.**~~ Yayında: https://github.com/Finetiontr/Nirengi (CI: typecheck + test + build). Footer bağlantısı güncellendi.
3. **Canlı adres.** Şu an `output: 'server'` + Node adaptörü. Cloudflare için `@astrojs/cloudflare` adaptörüne geçiş ya da Node ile bir VPS/Pages Functions.
4. **Ekip bölümü:** `src/components/landing/Bento.astro` → isimler ve rollerin eklenmesi (şu an yalnız ürettiklerimiz listeli).
5. **Sunum provası:** `docs/DEMO.md` akışını üretim derlemesinde (`npm run preview`) iki pencereyle prova et; GitHub bio kodunu önceden hazırla.

## Bilinen sınırlar

- Demo verisi `localStorage`’da; tarayıcı/cihaz değişince başlangıç verisi yüklenir. Panelden “Sıfırla”.
- GitHub’ın kimliksiz API sınırı saatte 60 istek (IP başına). Konferans ağında sınır dolarsa “Çevrim dışı örnek” kullan.
- Taslak motoru kural tabanlı; üretimde aynı arayüzün arkasına dil modeli bağlanabilir.
