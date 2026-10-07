# Sahne akışı — 5 dakika

Sağ alttaki **Demo turu** paneli adımları gerçek durum değişikliklerinden işaretler; sunum sırasında ilerlemeyi gösterir. Başlamadan önce panelden **Sıfırla**.

## Hazırlık (sunumdan önce)

- [ ] `npm run build && npm run preview` ile üretim derlemesini aç (dev sunucusu değil).
- [ ] Sunumda bağlanacak GitHub hesabının bio’suna `/kanit-bagla` sayfasının verdiği kodu **önceden** ekle. Kod sayfa her açıldığında değişir; sayfayı açık bırak ya da gist yöntemini kullan. GitHub önbelleği ~1 dk gecikebilir.
- [ ] İki tarayıcı penceresi: solda **Kurum**, sağda **Yetenek** rolü (rol sekme başınadır, veri anında senkronlanır).
- [ ] İnternet yoksa: `/kanit-bagla` → “Çevrim dışı örnekle dene”.

## Akış

| Süre | Ekran | Söylenecek |
|------|-------|------------|
| 0:00 | `/` | “Altı problemin tek kök nedeni var: kanıt katmanı yok.” Problemler listesi her maddeyi çalışan ekrana bağlıyor. |
| 0:40 | `/kanit-bagla` | GitHub kullanıcı adını gir → depolar gelir (S1) → **Sahipliği doğrula** → S2. CV yok, eser var. |
| 1:30 | `/ihtiyaclar/yeni` | **Örnek şikâyeti yükle** → **Kanvas taslağına dönüştür**. Skor düşük, yayın kapalı. İki ölçülebilir kriter, karar verici ve kapsam ekle → kapı açılır → **Yayımla**. |
| 2:30 | `/ihtiyaclar/:id#adaylar` | Kör keşif açık: isim yok, kanıt var. Skorun dört bileşeni, “eşleşti çünkü”, adaya giden eksik kanıt geri bildirimi, takım önerisi. **Bu adayla pilot aç**. |
| 3:20 | `/pilotlar/:id` | Kriterler kilometre taşına dönüştü. Sağ pencerede (Yetenek) **Teslim et**, sol pencerede (Kurum) **Onayla**. Mühür düşer. **Zinciri doğrula** → **Kurcalamayı dene** → zincir kırılır. |
| 4:10 | `/profil/:kullanici` | “Döngü kapandı”: onay, profilde yeni S3 kanıt. |
| 4:30 | `/nabiz`, `/yontem` | Olay akışı ve bağlantı sağlığı; her sayının formülü açık. 4 aylık plan. |

## Yedek senaryo

Canlı akış takılırsa: `/pilotlar/pl-rota` hazır bekler — K2 kurum onayı bekliyor. Kurum rolünde **Onayla** → `/profil/canaksoy` yeni S3 kanıtı gösterir.
