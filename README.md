# NİRENGİ

**Beyan değil, kanıt.** Gençlerin ürettiği doğrulanabilir işi kurumların yapılandırılmış ihtiyaçlarıyla buluşturan ve iş birliğini iki tarafın onayıyla kayda geçiren açık kaynak web hizmeti. Zemin360 Hackathon (9–11 Ekim 2026) için geliştirildi.

> Nirengi noktası: haritacılıkta üzerine güvenle ölçüm yapılan sabit referans.

## Altı problem, çalışan ekranlar

| # | Problem | Mekanizma | Ekran |
|---|---------|-----------|-------|
| 01 | Genç yeteneklerin keşfi | Kör keşif (isim/yaş/okul gizli), problemle arama, takipçiden bağımsız yükselen sinyal | `/kesfet` |
| 02 | Profil & portfolyo doğruluğu | S1/S2/S3 Doğrulama Merdiveni, **gerçek** GitHub hesap sahipliği ve DNS TXT doğrulaması, kopya eser tespiti, şeffaf itiraz | `/kanit-bagla`, `/profil/:kullanici` |
| 03 | Kurum–kişi eşleşmesi | Dört bileşenli açıklanabilir skor, gerekçe kartı, eksik kanıt geri bildirimi, takım kompozisyonu | `/ihtiyaclar/:id#adaylar` |
| 04 | Yaşayan bir ağ | Olay akışı, bağlantı sağlığı ve somut sebepli yeniden temas, mikro-etkileşimler, çeyreklik ihtiyaç turu | `/nabiz` |
| 05 | İhtiyaçların net tanımı | Yedi alanlı İhtiyaç Kanvası, çözülebilirlik skoru, yayın eşiği, serbest metinden taslak, ekosistem hafızası | `/ihtiyaclar/yeni` |
| 06 | Şeffaf iş birliği takibi | Kriterden doğan kilometre taşları, çift onay, SHA-256 zincirli defter, sessizlik göstergesi, adil kapanış, kamuya açık özet kartı | `/pilotlar/:id`, `/kart/:id` |

Döngü: pilotta çift onaylanan her kilometre taşı kişinin profiline **S3 kanıt** olarak işlenir; kanıt keşfi ve eşleşmeyi güçlendirir; olaylar ağı canlı tutar.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:4321
npm test           # eşleşme motoru, kanvas, defter testleri (node:test)
npm run typecheck
npm run build && npm run preview
```

Node 22+ gerekir (testler TypeScript’i doğrudan çalıştırır).

## Mimari

```
src/
  lib/
    engine/match.ts    eşleşme, kopya tespiti, takım, yükselen sinyal, problemle arama
    engine/canvas.ts   çözülebilirlik denetimi + kural tabanlı taslak motoru
    engine/ledger.ts   senkron SHA-256 + append-only hash zinciri
    verify.ts          GitHub (bio/gist sınaması) ve DNS TXT (DoH) doğrulaması
    store.ts           localStorage + sekmeler arası senkron durum; rol (kurum/yetenek) sekme başına
    seed.ts            kurgusal demo ekosistemi (tarihler göreli üretilir)
    motion.ts          sinyal yolu kaydırma animasyonu (tek hareket anı)
  components/
    landing/           Astro bölümleri + Bench.tsx (canlı ölçüm tezgâhı); raporlar motorla derlenir
    app/               React adaları (client:only)
  pages/               Astro rotaları
```

- **Astro 7 + React 19 + Tailwind 4**, fontlar (Archivo genişlik eksenli, JetBrains Mono) paket olarak gömülü: sahnede internet kesilse de arayüz çalışır.
- **Görsel dil: ölçüm tezgâhı.** Sayfa bir laboratuvar cihazı gibi çalışır: açık gri gövde, koyu ekranlar, gerçek ızgara. Dört eşleşme bileşeni dört kanaldır (CH1 kanıt turuncu, CH2 bağlam camgöbeği, CH3 kapasite mor, CH4 geçmiş indigo — Zemin360 renkleri). Ana sayfadaki tezgâh motoru canlı çalıştırır: bir kanalı kapatınca sıralama yeniden hesaplanır; KANIT modu adayın üretim izini, DEFTER modu hash zincirini (kurcala → kırık) gösterir. Doğrulama seviyesi her yerde çizgi kalınlığıyla yazılır (S1 kesik ince, S2 çizgi, S3 kalın).
- Renkler `src/styles/global.css` tokenlarından gelir; `.screen` bir bölgeyi cihaz ekranına çevirir.
- Bütün skorlar her görüntülemede motor tarafından yeniden hesaplanır; formüller `/yontem` sayfasında.
- Demo verisi tarayıcıda tutulur. İki pencere açıp birinde **Kurum**, diğerinde **Yetenek** rolünü seçerek çift onayı canlı gösterebilirsiniz; durum sekmeler arasında anında senkronlanır.

## Gerçek olan, demo olan

| Bileşen | Durum |
|---------|-------|
| GitHub hesap sahipliği (bio/gist kodu), DNS TXT | Gerçek servislere gider |
| Eşleşme, kanvas skoru, takım önerisi, defter bütünlüğü | Gerçek hesaplama |
| Taslak motoru | Kural tabanlı, çevrim dışı |
| Kurumlar, kişiler, S3 tasdikleri | Kurgusal demo verisi |
| Kalıcılık | Tarayıcı (üretimde Cloudflare D1) |

## Yol haritası (4 ay)

1. Cloudflare Workers + D1 + R2 + KV, GitHub OAuth, kurum hesapları
2. npm, mağaza, DOI/Crossref, Behance/Figma doğrulayıcıları; S3 için kurumsal imza
3. GİRVAK / Zemin360 kurumlarıyla ilk gerçek ihtiyaç turu
4. Açık API, Open Badges 3.0 / W3C Verifiable Credentials dışa aktarımı

Sahne akışı için: [`docs/DEMO.md`](docs/DEMO.md). Başvuru metni (altı probleme cevap): [`docs/BASVURU.md`](docs/BASVURU.md).

## Lisans

[MIT](LICENSE)
