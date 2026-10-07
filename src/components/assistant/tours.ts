// Everything the assistant says, in one place: the per-page tours, the plain
// "what can I do here" lines, and the glossary. Targets are [data-coach] hooks
// placed on the real elements of each screen (or a nav link where noted).

import type { Mood } from '../ui/Niri';
import { DEMOTE, PROMOTE, XP } from '../../lib/engine/progress.ts';
import type { Face } from './util';

export type KurumRoute = 'kurum' | 'ihtiyaclar' | 'ihtiyac-yeni' | 'ihtiyac-detay' | 'kesfet' | 'pilotlar' | 'pilot-detay';
export type GencRoute = 'bugun' | 'gorevler' | 'lig' | 'topluluk' | 'profil' | 'kanit-bagla';
export type RouteKey = KurumRoute | GencRoute | 'diger';

export interface CoachStep {
  /** CSS selector; the first visible match is used, a missing one is skipped. */
  target: string;
  title: string;
  text: string;
  /** Niri's pose on this step; the tour points when left out. */
  mood?: Mood;
  /** Where the card prefers to sit; the engine falls back when there is no room. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function routeKey(pathname: string): RouteKey {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/kurum') return 'kurum';
  if (p === '/ihtiyaclar') return 'ihtiyaclar';
  if (p === '/ihtiyaclar/yeni') return 'ihtiyac-yeni';
  if (p.startsWith('/ihtiyaclar/')) return 'ihtiyac-detay';
  if (p === '/kesfet') return 'kesfet';
  if (p === '/pilotlar') return 'pilotlar';
  if (p.startsWith('/pilotlar/')) return 'pilot-detay';
  if (p === '/bugun') return 'bugun';
  if (p === '/gorevler') return 'gorevler';
  if (p === '/lig') return 'lig';
  if (p === '/topluluk') return 'topluluk';
  if (p === '/profil') return 'profil';
  if (p === '/kanit-bagla') return 'kanit-bagla';
  return 'diger';
}

const c = (name: string) => `[data-coach="${name}"]`;

export const TOURS: Partial<Record<RouteKey, CoachStep[]>> = {
  kurum: [
    {
      target: c('sira'),
      title: 'Bugün seni bekleyenler',
      text: 'Yapman gereken işler burada, en acili en üstte: onay bekleyen aşamalar, yeni adaylar, yarım kalan taslaklar. Düğmeye basınca doğrudan o işe gidersin.',
      placement: 'bottom',
    },
    {
      target: c('ihtiyaclar-satir'),
      title: 'Yazdığın ihtiyaçlar',
      text: 'Her satır çözmek istediğin bir problem. Halkadaki sayı netlik puanı: ihtiyacın ne kadar net yazıldığını gösterir. 70’e ulaşınca yayımlayabilirsin.',
      placement: 'right',
    },
    {
      target: c('ihtiyaclar-bos'),
      title: 'İlk ihtiyacını yaz',
      text: 'Çözmek istediğin problemi buradan yazarsın; yayımlayınca bu işi daha önce yapmış gençler karşına çıkar.',
      placement: 'right',
    },
    {
      target: c('projeler'),
      title: 'Süren deneme projeleri',
      text: 'Bir adayla başladığın deneme projeleri burada. Çubuk, kaç aşamanın iki tarafça da onaylandığını gösterir.',
      placement: 'left',
    },
    {
      target: 'nav[aria-label="Sekmeler"] a[href="/ihtiyaclar"], aside[aria-label="Ana menü"] a[href="/ihtiyaclar"]',
      title: 'İhtiyaçlar sekmesi',
      text: 'Bütün ihtiyaçların burada durur; yenisini de buradan yazarsın, ben de yanında olurum.',
      placement: 'right',
    },
  ],

  ihtiyaclar: [
    {
      target: c('ihtiyac-yeni'),
      title: 'Buradan başla',
      text: 'Yeni bir problem yazmak için bu düğmeye bas. Birkaç kısa soruya cevap vermen yeterli.',
      placement: 'bottom',
    },
    {
      target: c('ihtiyac-satir'),
      title: 'İhtiyaçların',
      text: 'Her satır bir ihtiyaç. Soldaki halka netlik puanı: 70 ve üstü olunca yayımlayabilirsin. Yayımlayınca uyan gençler görünmeye başlar.',
      placement: 'bottom',
    },
    {
      target: c('ihtiyac-filtre'),
      title: 'Duruma göre bak',
      text: 'Taslak: henüz yayımlanmamış. Yayında: gençler görebilir. Denemede: bir adayla deneme projesi başlamış.',
      placement: 'bottom',
    },
    {
      target: c('ihtiyac-bos'),
      title: 'İlk ihtiyacını yaz',
      text: 'Henüz ihtiyacın yok. İlkini yazmak birkaç dakika sürer; sorununu kendi cümlelerinle anlatman yeterli.',
      placement: 'top',
    },
  ],

  'ihtiyac-yeni': [
    {
      target: c('wiz-ilerleme'),
      title: 'Kısa bir yol',
      text: 'Birkaç kısa soru var. Çubuk nerede olduğunu gösterir. Yarıda kalırsan taslak olarak kaydedebilirsin.',
      placement: 'bottom',
    },
    {
      target: c('wiz-soru'),
      title: 'Her adımda tek soru',
      text: 'Soruyu kendi cümlelerinle cevapla. İpucum ve “İyi bir örnek” kutusu ne yazacağını gösterir.',
      placement: 'right',
    },
    {
      target: c('wiz-netlik'),
      title: 'Netlik puanı',
      text: 'İhtiyacın ne kadar net yazıldığını gösterir. Yazdıkça yükselir; 70’e ulaşınca yayımlanabilir. “Neden?” düğmesi eksikleri sıralar.',
      placement: 'bottom',
    },
    {
      target: c('wiz-devam'),
      title: 'Hazır olunca ilerle',
      text: 'Devam’a bas. Son adımda her şeyi tek ekranda görür, yayımlar ya da taslak olarak saklarsın.',
      placement: 'top',
    },
  ],

  'ihtiyac-detay': [
    {
      target: c('need-baslik'),
      title: 'İhtiyacının özeti',
      text: 'Başlık, durum ve netlik puanı burada. Netlik puanı, ihtiyacın ne kadar net yazıldığını gösterir.',
      placement: 'bottom',
    },
    {
      target: c('need-taslak'),
      title: 'Henüz taslak',
      text: 'Bu ihtiyaç yayında değil. Düzenleyebilir, netlik puanı 70’e ulaşınca yayımlayabilirsin.',
      placement: 'bottom',
    },
    {
      target: c('need-kart'),
      title: 'İhtiyaç kartı',
      text: 'Yazdığın her şey burada: mevcut durum, hedef, başarı kriterleri. Deneme projesi başlayınca kriterler aşamalara dönüşür.',
      placement: 'bottom',
    },
    {
      target: c('need-adaylar'),
      title: 'Uyan adaylar',
      text: 'Bu ihtiyaca doğrulanmış işiyle uyan gençler, en uyumlu olan en üstte. İsimleri ilk temasa kadar gizlidir.',
      placement: 'bottom',
    },
    {
      target: c('need-aday'),
      title: 'Bir adaya dokun',
      text: 'Puanın nereden geldiğini, işinin kaynağını ve eksiklerini görürsün. Beğenirsen “Projeye davet et” ile deneme projesini başlatırsın.',
      placement: 'bottom',
    },
  ],

  kesfet: [
    {
      target: c('kesfet-ara'),
      title: 'Problemi yazarak ara',
      text: 'Unvan değil, çözmek istediğin işi yaz: “dosya dağıtımını üretimde çözmüş biri” gibi. Sonuçlar gerçek işten gelir.',
      placement: 'bottom',
    },
    {
      target: c('kesfet-ihtiyac'),
      title: 'Bir ihtiyaç seç',
      text: 'İhtiyaçlarından birini seçersen herkes ona göre puanlanır ve en uygun olanlar öne çıkar.',
      placement: 'bottom',
    },
    {
      target: c('kesfet-liste'),
      title: 'Gençler ve işleri',
      text: 'Her kartta işin doğrulanma düzeyi görünür: Beyan, Doğrulandı ya da Kurum onaylı. Adlar ilk temasa kadar gizlidir.',
      placement: 'top',
    },
    {
      target: c('kesfet-filtre'),
      title: 'Daralt',
      text: 'Beceri, doğrulama düzeyi ve sıralamayı buradan seçersin.',
      placement: 'left',
    },
  ],

  pilotlar: [
    {
      target: c('proje-kart'),
      title: 'Deneme projelerin',
      text: 'Her kart, bir gençle yürüttüğün bir deneme projesi. Karta dokununca aşamaları görürsün.',
      placement: 'bottom',
    },
    {
      target: c('proje-yol'),
      title: 'Aşamalar',
      text: 'Her yuvarlak bir aşama. Yeşil: iki taraf da onayladı. Yıldız: onayını bekliyor. Boş yuvarlak: genç henüz teslim etmedi.',
      placement: 'bottom',
    },
    {
      target: c('proje-siradaki'),
      title: 'Şimdi ne yapmalı?',
      text: 'Bu satır sıradaki işi söyler. “Onayını bekleyen 1 aşama” görürsen karta dokunup incele.',
      placement: 'top',
    },
    {
      target: c('proje-bos'),
      title: 'Henüz deneme projen yok',
      text: 'Bir ihtiyacın adaylarından birini projeye davet edince deneme projesi burada başlar.',
      placement: 'top',
    },
  ],

  'pilot-detay': [
    {
      target: c('proje-ozet'),
      title: 'Projenin özeti',
      text: 'Taraflar ve ilerleme burada. Çubuk yalnız iki tarafın da onayladığı aşamaları sayar.',
      placement: 'bottom',
    },
    {
      target: c('proje-onay'),
      title: 'Sıra sendeyse',
      text: 'Genç bir aşamayı teslim edince bu düğmeden incelersin. Onaylarsan aşama biter ve gencin profiline “Kurum onaylı” iş olarak yazılır.',
      placement: 'top',
    },
    {
      target: c('proje-yol'),
      title: 'Aşamalar',
      text: 'Aşamalar, ihtiyaç kartındaki başarı kriterlerinden doğdu. Birine dokun: teslim notunu gör, onayla ya da düzeltme iste.',
      placement: 'right',
    },
    {
      target: c('proje-defter'),
      title: 'Kayıt defteri',
      text: 'Projede olan her şey değiştirilemeyen bir kayıt defterine yazılır; her kayıt öncekine bağlıdır. İstersen zincirin bozulmadığını buradan doğrulayabilirsin.',
      placement: 'top',
    },
  ],
};

// ---------------------------------------------------------------- "Bu sayfada ne yapabilirim?"

export const HELP: Record<KurumRoute | 'diger', string[]> = {
  kurum: [
    'Burada seni bekleyen işleri görürsün: onay bekleyen aşamalar, yeni adaylar ve yarım kalan taslaklar.',
    'Bir işin yanındaki düğmeye basınca doğrudan o ekrana gidersin.',
    'Yeni bir problem yazmak için İhtiyaçlar sekmesine geç.',
  ],
  ihtiyaclar: [
    'Burada kurumunun yazdığı bütün ihtiyaçlar var: taslaklar, yayındakiler ve deneme projesine dönenler.',
    '“Yeni ihtiyaç” ile yeni bir problem yazarsın. Bir satıra dokunursan ihtiyacı ve uyan adayları görürsün.',
    'Halkadaki sayı netlik puanıdır; 70 ve üstü olunca ihtiyacı yayımlayabilirsin.',
  ],
  'ihtiyac-yeni': [
    'Burada çözmek istediğin bir problemi, kısa sorulara cevap vererek yazarsın.',
    'Yazdıkça netlik puanı yükselir. 70’e ulaşınca ihtiyacı yayımlayabilirsin.',
    'Yarıda kalırsan taslak olarak kaydedebilir, sonra kaldığın yerden devam edebilirsin.',
  ],
  'ihtiyac-detay': [
    'Burada tek bir ihtiyacı görürsün: yazdıkların, netlik puanı ve ihtiyaca uyan gençler.',
    'Bir adaya dokunursan neden uyduğunu görürsün. Beğenirsen “Projeye davet et” ile deneme projesini başlatırsın.',
    'Taslaktaysa düzenleyebilir, hazır olunca yayımlayabilirsin.',
  ],
  kesfet: [
    'Burada çözmek istediğin işi yazarak, bu işi daha önce yapmış gençleri bulursun.',
    'Bir ihtiyacını seçersen herkes ona göre puanlanır.',
    'Adlar ilk temasa kadar gizlidir; karar işe bakılarak verilir.',
  ],
  pilotlar: [
    'Burada gençlerle yürüttüğün deneme projeleri var.',
    'Bir karta dokunursan aşamaları ve sıradaki işi görürsün.',
    '“Onayını bekleyen aşama” yazan projeler seni bekliyor demektir.',
  ],
  'pilot-detay': [
    'Burada tek bir deneme projesinin aşamalarını görürsün.',
    'Genç bir aşamayı teslim ettiğinde incelersin; onaylarsan aşama biter. Eksik görürsen düzeltme istersin.',
    'Her hareket değiştirilemeyen kayıt defterine yazılır.',
  ],
  diger: [
    'Üst menüden ihtiyaçlarına, gençleri keşfetmeye ve deneme projelerine geçebilirsin.',
    'Takıldığında buradan beni çağırabilir, turu yeniden başlatabilirsin.',
  ],
};

// ---------------------------------------------------------------- Sözlük

export const GLOSSARY: { term: string; text: string }[] = [
  { term: 'İhtiyaç', text: 'Kurumunun çözmek istediği tek bir problem. Sayıyla ölçülür ve küçük bir deneme projesiyle sınanır.' },
  { term: 'Netlik puanı', text: 'İhtiyacının ne kadar net yazıldığını 100 üzerinden gösterir. 70 ve üstü olunca yayımlayabilirsin.' },
  { term: 'Aday', text: 'İhtiyacına uyan genç. Uyum, yaptığı doğrulanmış işlerin ihtiyacınla ne kadar örtüştüğünden hesaplanır.' },
  {
    term: 'Doğrulanmış iş',
    text: 'Gencin yaptığı işin ne kadar kontrol edildiği. Beyan: kendi sözü. Doğrulandı: sistem kontrol etti, örneğin GitHub hesabı ya da alan adı. Kurum onaylı: bir kurum imzaladı.',
  },
  { term: 'Deneme projesi (pilot)', text: 'Bir adayla yaptığın küçük, süreli deneme. İşe başlamadan önce gencin seninle çalışıp çalışamayacağını görürsün.' },
  { term: 'Aşama', text: 'Deneme projesinin bir adımı. Genç teslim eder, sen onaylarsın. İhtiyaç kartındaki başarı kriterlerinden doğar.' },
  { term: 'Onay', text: 'Bir aşama ancak iki taraf da onaylayınca biter: genç teslim ederek, sen de inceleyip onaylayarak.' },
  { term: 'Kayıt defteri', text: 'Projede olan her şey değiştirilemeyen bir deftere yazılır. Her kayıt öncekine bağlıdır; sonradan kimse sessizce değiştiremez.' },
  { term: 'İsimsiz inceleme', text: 'İlk temasa kadar adaylar isimsiz görünür: ad, okul ve şehir gizlidir, yalnız işleri görünür. Karar işe bakılarak verilir, önyargı azalır.' },
];

// ---------------------------------------------------------------- genç tours
// Same engine, the young side: "sen" voice, and Niri's mood changes step by step
// (point for "look here", think for how it works, cheer for rewards).

export const TOURS_GENC: Partial<Record<RouteKey, CoachStep[]>> = {
  bugun: [
    {
      target: c('g-hafta'),
      mood: 'point',
      title: 'Bu haftan',
      text: 'Her üçgen bir gün: üretim yaptığın gün dolar. Haftada kaç gün üreteceğini üstteki “Hedef” düğmesinden sen seçersin.',
      placement: 'bottom',
    },
    {
      target: c('g-sirada'),
      mood: 'point',
      title: 'Sıradaki adımın',
      text: 'Bugün ne yapacağını tek kartta söyler. Düğmeye basınca doğrudan oraya gidersin.',
      placement: 'bottom',
    },
    {
      target: c('g-pafta'),
      mood: 'think',
      title: 'Paftan',
      text: 'Her doğrulanmış iş haritana bir nokta ekler. Aşağıdan başlar, zirveye tırmanırsın; sıradaki nokta işaretli.',
      placement: 'top',
    },
    {
      target: c('g-ihtiyaclar'),
      mood: 'happy',
      title: 'Sana uyan ihtiyaçlar',
      text: 'Kurumların yazdığı ihtiyaçlar işine göre sıralanır. Doğrulanmış iş eklemek puanını yükseltir.',
      placement: 'top',
    },
  ],

  gorevler: [
    {
      target: c('g-waypoints'),
      mood: 'point',
      title: 'Haftanın rotası',
      text: 'Her hafta üç kısa görevin var; her biri rotada bir durak. Sıradaki durak ışıldar.',
      placement: 'bottom',
    },
    {
      target: c('g-bayrak'),
      mood: 'cheer',
      title: 'Bayrağı dik',
      text: 'Görev bitince bu düğme çıkar. Basınca bayrağın dikilir ve XP’ni alırsın.',
      placement: 'top',
    },
    {
      target: c('g-gelisim'),
      mood: 'think',
      title: 'Gelişim görevleri',
      text: 'Sana özel: profilinle açık ihtiyaçlar arasındaki boşluktan çıkar. Doğrulanan her iş XP verir ve uyumunu artırır.',
      placement: 'bottom',
    },
    {
      target: c('g-oss'),
      mood: 'point',
      title: 'Açık kaynak görevleri',
      text: 'GitHub’daki gerçek issue’lar. PR’ın birleştirilince sayılır; bunu GitHub’dan biz doğrularız.',
      placement: 'top',
    },
  ],

  lig: [
    {
      target: c('g-lig-profil'),
      mood: 'point',
      title: 'Ligin',
      text: 'Zemin’den Zirve’ye beş basamak var. Dolu üçgenler geçtiklerin, büyük olan şu an olduğun basamak.',
      placement: 'bottom',
    },
    {
      target: c('g-lig-ben'),
      mood: 'think',
      title: 'Sıran',
      text: 'Çerçeveli satır sensin. Sıralama bu haftanın XP’sine göre; her hafta yeniden başlar.',
      placement: 'top',
    },
    {
      target: c('g-lig-bolge'),
      mood: 'think',
      title: 'Yükselme ve düşme',
      text: 'Yükselme çizgisinin üstündekiler bir üst lige çıkar, düşme çizgisinin altındakiler bir alta düşer.',
      placement: 'top',
    },
    {
      target: c('g-lig-adil'),
      mood: 'happy',
      title: 'Bu lig nasıl adil?',
      text: 'Benzer tempodakilerle yarışırsın ve XP yalnız doğrulanabilir işten gelir. Ayrıntısı bu düğmede.',
      placement: 'top',
    },
  ],

  topluluk: [
    {
      target: c('g-topluluk-yaz'),
      mood: 'point',
      title: 'Paylaş',
      text: 'Çalıştığını göster, takıldığını sor ya da birine teşekkür et. Yazıp “Paylaş”a basman yeter.',
      placement: 'bottom',
    },
    {
      target: c('g-topluluk-tur'),
      mood: 'think',
      title: 'Türünü seç',
      text: 'Paylaşımının türünü seçersin: Üzerinde çalışıyorum, Soru, Bitirdim ya da Teşekkür.',
      placement: 'bottom',
    },
    {
      target: c('g-topluluk-akis'),
      mood: 'think',
      title: 'Akış',
      text: 'Akışı buradan süzersin. Bir soruya cevap verirsen ve soran “İşe yaradı” derse XP kazanırsın.',
      placement: 'top',
    },
    {
      target: c('g-destek'),
      mood: 'cheer',
      title: 'Destek ver',
      text: 'Bir paylaşımı beğendiysen destek ver. Aldığın her destek XP olur ama haftalık hedefine sayılmaz.',
      placement: 'top',
    },
  ],

  profil: [
    {
      target: c('g-profil-sayilar'),
      mood: 'think',
      title: 'Sayıların',
      text: 'Serin, XP’in ve doğrulanmış işlerin burada. Hepsi yalnız doğrulanabilir olaylardan gelir.',
      placement: 'bottom',
    },
    {
      target: c('g-profil-rozet'),
      mood: 'cheer',
      title: 'Rozet haritası',
      text: 'Rozetler belirli ölçütleri tamamlayınca açılır. Sıradaki rozet işaretli; ona bakıp hedef seçebilirsin.',
      placement: 'top',
    },
    {
      target: c('g-profil-kanit'),
      mood: 'think',
      title: 'Kanıtların',
      text: 'Her iş kendi doğrulama düzeyiyle durur: Beyan, Doğrulandı ya da Kurum onaylı. Kurumlar seni bu işlere bakarak bulur.',
      placement: 'top',
    },
    {
      target: c('g-profil-bagla'),
      mood: 'point',
      title: 'Kanıt bağla',
      text: 'GitHub hesabını ya da alan adını bağla; ilk işin doğrulanınca profilinde görünür.',
      placement: 'bottom',
    },
  ],
};

// ---------------------------------------------------------------- genç "Bu sayfada ne yapabilirim?"

export const HELP_GENC: Record<GencRoute | 'ihtiyac-detay' | 'pilot-detay' | 'diger', string[]> = {
  bugun: [
    'Bu hafta kaç gün üretim yaptığını üçgenlerden görürsün; haftada kaç gün üreteceğini “Hedef” düğmesinden sen seçersin.',
    'Sıradaki adım kartı, bugün ne yapacağını tek cümleyle söyler.',
    'Paftan doğrulanmış işlerinin haritasıdır. Aşağıda sana uyan ihtiyaçları da görürsün.',
  ],
  gorevler: [
    'Her hafta üç kısa görevin var; hepsi rotada birer durak.',
    'Bir görev bitince “Bayrağı dik” düğmesi çıkar; basınca XP’ni alırsın.',
    'Gelişim görevleri sana özel, açık kaynak görevleri GitHub’daki gerçek issue’lardır.',
  ],
  lig: [
    'Benzer tempodaki gençlerle bu haftanın XP’sine göre yarışırsın.',
    `İlk ${PROMOTE} kişi bir üst lige çıkar, son ${DEMOTE} kişi bir alta düşer; sıralama her hafta yeniden başlar.`,
    'XP yalnız doğrulanabilir işten gelir; sohbet ve beğeni sıralamayı belirlemez.',
  ],
  topluluk: [
    'Burada çalıştığını gösterir, takıldığın yeri sorar ya da birine teşekkür edersin.',
    'Bir soruya cevap verirsen ve soran “İşe yaradı” derse XP kazanırsın.',
    'Paylaşım ve destek XP verir ama haftalık hedefine sayılmaz.',
  ],
  profil: [
    'Kurumların seni gördüğü sayfa burası: serin, XP’in, rozetlerin ve doğrulanmış işlerin.',
    '“Kanıt bağla” ile GitHub hesabını ya da alan adını bağlarsın; iş doğrulanınca profilinde görünür.',
    'Her iş kendi doğrulama düzeyiyle durur: Beyan, Doğrulandı, Kurum onaylı.',
  ],
  'kanit-bagla': [
    'Burada işini bağlayıp doğrulatırsın: GitHub hesabını ya da alan adını.',
    'Doğrulanan iş profiline eklenir; “Doğrulandı” düzeyi beyandan güçlüdür.',
  ],
  'ihtiyac-detay': [
    'Bir kurumun yazdığı ihtiyaç burada. Uyum puanın, doğrulanmış işlerinin bu ihtiyaca ne kadar uyduğunu gösterir.',
    'Puanı yükseltmek için eksik olan alanda bir doğrulanmış iş eklemen yeter.',
  ],
  'pilot-detay': [
    'Bu, bir kurumla yürüttüğün deneme projesi. Aşamayı teslim edersin, kurum onaylayınca aşama biter.',
    'Her onay profiline “Kurum onaylı” iş olarak yazılır.',
  ],
  diger: [
    'Menüden Bugün, Görevler, Lig, Topluluk ve Profil sayfalarına geçebilirsin.',
    'Takıldığında buradan beni çağırabilir, turu yeniden başlatabilirsin.',
  ],
};

// ---------------------------------------------------------------- genç Sözlük

export const GLOSSARY_GENC: { term: string; text: string }[] = [
  { term: 'Seri', text: 'Hedefini tutturduğun art arda hafta sayısı. Hedefi düşürmek ceza değildir; seri yalnız tutturduğun haftaları sayar.' },
  { term: 'Mola haftası', text: 'Vize, final ya da yoğun bir iş haftasında serini bozmadan bekletirsin. Lig yine o haftanın XP’sine göre hesaplanır.' },
  { term: 'XP', text: `Yalnız doğrulanabilir olaylardan gelir: üretim günü, doğrulanmış iş, kurum onayı, işe yarayan cevap. Günde en fazla ${XP.dailyCap} XP sayılır.` },
  { term: 'Lig', text: 'Benzer tempodaki gençlerle haftalık XP yarışı. Zemin’den Zirve’ye beş basamak var; hafta bitince yukarı çıkabilir ya da aşağı düşebilirsin.' },
  { term: 'Rota ve görev', text: 'Her hafta üç kısa görevin olur; hepsi rotanda birer duraktır. Bitirince bayrağı dikip XP alırsın.' },
  { term: 'Beyan', text: 'Kendi sözün. Henüz kimse kontrol etmedi, en düşük düzeydir.' },
  { term: 'Doğrulandı', text: 'Sistem işi kontrol etti: örneğin GitHub hesabının ya da alan adının senin olduğunu doğruladı.' },
  { term: 'Kurum onaylı', text: 'Bir kurum, seninle yürüttüğü deneme projesinin bir aşamasını onayladı. En güçlü düzeydir.' },
  { term: 'İhtiyaç', text: 'Bir kurumun çözmek istediği tek bir problem. “Sana uyan ihtiyaçlar”, doğrulanmış işlerinle eşleşenlerdir.' },
  { term: 'Deneme projesi (pilot)', text: 'Bir kurumla yaptığın küçük, süreli deneme. Birlikte çalışıp çalışamayacağınızı işe girmeden önce görürsünüz.' },
  { term: 'Aşama ve onay', text: 'Deneme projesi aşamalara bölünür. Sen teslim edersin, kurum onaylar; iki taraf da onaylayınca aşama biter.' },
  { term: 'Kayıt defteri', text: 'Projede olan her şey değiştirilemeyen bir deftere yazılır. Her kayıt öncekine bağlıdır.' },
  { term: 'İsimsiz inceleme', text: 'İlk temasa kadar kurum adını, okulunu ve şehrini görmez; yalnız işini görür.' },
];

// ---------------------------------------------------------------- per-face lookups

export const toursFor = (face: Face) => (face === 'genc' ? TOURS_GENC : TOURS);
export const helpFor = (face: Face, route: RouteKey): string[] =>
  face === 'genc'
    ? (HELP_GENC as Partial<Record<RouteKey, string[]>>)[route] ?? HELP_GENC.diger
    : (HELP as Partial<Record<RouteKey, string[]>>)[route] ?? HELP.diger;
export const glossaryFor = (face: Face) => (face === 'genc' ? GLOSSARY_GENC : GLOSSARY);
