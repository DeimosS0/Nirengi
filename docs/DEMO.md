# Sahne akışı — 5 dakika

Kenardaki **Demo turu** paneli adımları gerçek durum değişikliklerinden işaretler; genç ve kurum için iki tur vardır. Başlamadan önce panelden **Sıfırla**.

## Hazırlık (sunumdan önce)

- [ ] `npm run build && npm run preview` ile üretim derlemesini aç (dev sunucusu değil).
- [ ] Sunumda bağlanacak GitHub hesabının bio’suna `/kanit-bagla` akışının 4. adımında verilen kodu **önceden** ekle. Kod sekme açık kaldıkça aynı kalır (sessionStorage); gist yöntemi de çalışır. GitHub önbelleği ~1 dk gecikebilir.
- [ ] İki tarayıcı penceresi: solda **Kurum**, sağda **Genç** (sol menüdeki Genç/Kurum seçimi sekme başınadır, veri anında senkronlanır).
- [ ] İnternet ya da GitHub sorgu sınırı sorunu olursa: `/kanit-bagla` → **Örnek profille devam et** (örnek veri olarak etiketlenir).

## Akış

| Süre | Ekran | Söylenecek |
|------|-------|------------|
| 0:00 | `/bugun` (Genç) | Haftalık hedef, haftalık seri, sıradaki adım ve yol. “Commit sayısı değil, üretim yaptığın gün sayılır.” |
| 0:40 | `/kanit-bagla` | GitHub kullanıcı adı → “N eserin bulundu” → haftalık hedef → **Kontrol et** ile sahiplik → Doğrulandı + kutlama. |
| 1:30 | `/kurum` → `/ihtiyaclar/yeni` (Kurum) | “Sırada ne var” kartı. Sihirbazda **Örnekle doldur** → **Taslağa dönüştür**; çözülebilirlik çubuğu 70 eşiğini geçince **Yayımla** açılır. |
| 2:30 | `/ihtiyaclar/:id#adaylar` | Kör keşif: isim yok, iş var. Adaya dokun → “Neden bu uyum?” dört parça ve eksikler. **Pilot teklif et** → kimlik açılır. |
| 3:20 | `/pilotlar/:id` | Kriterler aşamalara dönüştü. Genç pencerede **Teslim et**, kurum penceresinde **Onayla** → mühür. Defter: **Zinciri doğrula** → **Kurcalamayı dene** → zincir kırılır. |
| 4:10 | `/profil/:kullanici` | Onaylanan aşama profilde Kurum onaylı kanıt olarak görünür; rozetler ve son 10 hafta. |
| 4:30 | `/gorevler`, `/lig`, `/topluluk`, `/yontem` | Gerçek GitHub “good first issue” görevleri, benzer seviyedeki lig, “İşe yaradı” ile XP kazandıran topluluk. Her sayının kuralı `/yontem`’de. |

## Yedek senaryo

Canlı akış takılırsa: `/pilotlar/pl-rota` hazır bekler; bir aşama kurum onayı bekliyor. Kurum rolünde **Onayla** → `/profil/canaksoy` yeni Kurum onaylı kanıtı gösterir.
