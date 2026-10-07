// Demo ecosystem. All organizations and people are fictional; dates are
// generated relative to the moment of seeding so the demo never looks stale.

import type { Evidence, LogEntry, Milestone, NetEvent, Need, Org, Peer, Person, Pilot, Post, State, WeeklyGoal } from './types.ts';
import { appendEntry } from './engine/ledger.ts';
import { daysAgo, daysFromNow } from './format.ts';
import { dayKey, weekKey } from './engine/progress.ts';

export const STATE_VERSION = 5;
export const ROUND = '2026·Ç4';

type EvInput = Omit<Evidence, 'producedAt' | 'verifiedAt'> & { ago: number; verifiedAgo?: number };

const ev = (e: EvInput): Evidence => {
  const { ago, verifiedAgo, ...rest } = e;
  return {
    ...rest,
    producedAt: daysAgo(ago),
    verifiedAt: e.level === 'S1' ? undefined : daysAgo(verifiedAgo ?? Math.max(0, ago - 2)),
  };
};

const orgs: Org[] = [
  {
    id: 'o-kuzey',
    name: 'Kuzey Lojistik',
    sector: 'lojistik',
    scale: 'kobi',
    city: 'İstanbul · Tuzla',
    about: "Marmara'da günde 3.000 teslimat yapan bölgesel lojistik firması.",
  },
  {
    id: 'o-marmara',
    name: 'Marmara Akıllı Şehir Lab.',
    sector: 'kamu',
    scale: 'kamu',
    city: 'İstanbul · Şişhane',
    about: 'Şehir verisiyle girişimlerle pilot projeler yürüten belediye iştiraki açık inovasyon birimi.',
  },
  {
    id: 'o-pera',
    name: 'Pera Finans Lab',
    sector: 'fintek',
    scale: 'kurumsal',
    city: 'İstanbul · Levent',
    about: 'Bir katılım bankasının girişimlerle ortak ürün denediği inovasyon merkezi.',
  },
  {
    id: 'o-anka',
    name: 'Anka Oyun Stüdyosu',
    sector: 'oyun',
    scale: 'girisim',
    city: 'İzmir · Bornova',
    about: '11 kişilik mobil oyun stüdyosu; yıllık 2 oyun yayınlıyor.',
  },
  {
    id: 'o-sifa',
    name: 'Şifa Dijital Sağlık',
    sector: 'saglik',
    scale: 'girisim',
    city: 'Ankara · Çankaya',
    about: 'Aile hekimlikleri için randevu ve hatırlatma uygulaması geliştiren girişim.',
  },
  {
    id: 'o-atolye',
    name: 'Atölye Tekstil Kooperatifi',
    sector: 'uretim',
    scale: 'kobi',
    city: 'Denizli · Buldan',
    about: '42 üyeli kadın dokuma kooperatifi; el dokuması ürünlerini çevrim içi satmaya hazırlanıyor.',
  },
];

function people(): Person[] {
  return [
    {
      id: 'p-can',
      handle: 'canaksoy',
      name: 'Can Aksoy',
      headline: 'Backend geliştirici · Go',
      city: 'İstanbul',
      age: 24,
      school: 'YTÜ Bilgisayar Mühendisliği (mezun)',
      bio: 'Yüksek trafikli servisler ve dağıtık kuyruk sistemleri üzerinde çalışıyorum. Üretimde ölçülmeyen optimizasyona inanmam.',
      availability: 'open',
      weeklyHours: 20,
      joinedAt: daysAgo(210),
      links: { github: 'canaksoy', domain: 'canaksoy.dev' },
      evidence: [
        ev({
          id: 'e-can-1',
          title: 'edge-mirror — yüksek trafikli dosya dağıtım katmanı',
          summary: 'Go ile yazılmış, 3 bölgede çalışan, günde 2,1 TB trafik taşıyan dosya dağıtım ve önbellek katmanı.',
          source: 'github',
          level: 'S2',
          skills: ['go', 'distributed', 'perf'],
          url: 'https://github.com/canaksoy/edge-mirror',
          metrics: [
            { label: 'yıldız', value: '612' },
            { label: 'commit', value: '1.140' },
            { label: 'üretimde', value: '2,1 TB/gün' },
          ],
          verifier: 'GitHub API · hesap sahipliği',
          ago: 60,
        }),
        ev({
          id: 'e-can-2',
          title: 'tunnelq — Go ile dağıtık iş kuyruğu',
          summary: 'Tekrar denemeli, önceliklendirilmiş iş kuyruğu. REST ve gRPC uçları var.',
          source: 'github',
          level: 'S2',
          skills: ['go', 'distributed', 'api'],
          url: 'https://github.com/canaksoy/tunnelq',
          metrics: [
            { label: 'yıldız', value: '412' },
            { label: 'commit', value: '380' },
          ],
          verifier: 'GitHub API · hesap sahipliği',
          ago: 140,
        }),
        ev({
          id: 'e-can-3',
          title: 'canaksoy.dev — teknik yazılar',
          summary: 'Kuyruk teorisi ve Go performans ölçümü üzerine 18 yazı.',
          source: 'domain',
          level: 'S2',
          skills: ['docs', 'go'],
          url: 'https://canaksoy.dev',
          verifier: 'DNS TXT kaydı',
          ago: 300,
        }),
        ev({
          id: 'e-can-4',
          title: 'Kilometre taşı: 3.000 noktalık rota 5 dakikanın altında',
          summary: 'Kuzey Lojistik deneme projesinde ilk başarı kriteri karşılandı: ölçülen süre 3 dk 40 sn.',
          source: 'pilot',
          level: 'S3',
          skills: ['go', 'optimization', 'perf'],
          verifier: 'Kuzey Lojistik · Operasyon Direktörü',
          context: { sector: 'lojistik', scale: 'kobi' },
          pilotId: 'pl-rota',
          ago: 8,
          verifiedAgo: 8,
        }),
        ev({
          id: 'e-can-5',
          title: 'Rust ile rota motoru denemeleri',
          summary: 'Kişisel deneme projesi; henüz yayımlanmadı.',
          source: 'claim',
          level: 'S1',
          skills: ['rust', 'optimization'],
          ago: 30,
        }),
      ],
    },
    {
      id: 'p-elif',
      handle: 'elifsari',
      name: 'Elif Sarı',
      headline: 'Arayüz geliştirici · React',
      city: 'Ankara',
      age: 22,
      school: 'ODTÜ Bilgisayar Mühendisliği (4. sınıf)',
      bio: 'Erişilebilir bileşenler ve canlı veri gösteren arayüzler yapıyorum. Son altı ayda üç açık kaynak paket yayımladım.',
      availability: 'open',
      weeklyHours: 15,
      joinedAt: daysAgo(70),
      links: { github: 'elifsari' },
      evidence: [
        ev({
          id: 'e-elif-1',
          title: 'kart-ui — erişilebilir React bileşen kütüphanesi',
          summary: 'Klavye ve ekran okuyucu testleriyle gelen 34 bileşen. WCAG 2.2 AA denetiminden geçti.',
          source: 'github',
          level: 'S2',
          skills: ['react', 'typescript', 'a11y'],
          url: 'https://github.com/elifsari/kart-ui',
          metrics: [
            { label: 'yıldız', value: '268' },
            { label: 'katkıcı', value: '9' },
          ],
          verifier: 'GitHub API · hesap sahipliği',
          ago: 45,
        }),
        ev({
          id: 'e-elif-2',
          title: '@kart/ui npm paketi',
          summary: 'Paketin yayıncısı olarak npm kayıt defterinde doğrulandı.',
          source: 'npm',
          level: 'S2',
          skills: ['react', 'typescript'],
          url: 'https://www.npmjs.com/package/@kart/ui',
          metrics: [{ label: 'indirme', value: '3,4 bin/hafta' }],
          verifier: 'npm kayıt defteri · yayıncı',
          ago: 40,
        }),
        ev({
          id: 'e-elif-3',
          title: 'Durak — otobüs saatlerini canlı gösteren PWA',
          summary: 'Ankara açık verisinden beslenen, haritada araç konumunu WebSocket ile güncelleyen uygulama.',
          source: 'github',
          level: 'S2',
          skills: ['react', 'realtime', 'maps'],
          url: 'https://github.com/elifsari/durak',
          metrics: [{ label: 'aylık kullanıcı', value: '1.900' }],
          verifier: 'GitHub API · hesap sahipliği',
          context: { sector: 'kamu' },
          ago: 25,
        }),
        ev({
          id: 'e-elif-4',
          title: 'Figma ile tasarım sistemi kurulumu',
          summary: 'Staj döneminde ekip için bileşen kütüphanesi hazırladığını beyan ediyor.',
          source: 'claim',
          level: 'S1',
          skills: ['figma', 'uiux'],
          ago: 200,
        }),
      ],
    },
    {
      id: 'p-mert',
      handle: 'mertkilic',
      name: 'Mert Kılıç',
      headline: 'Oyun geliştirici · Unity & shader',
      city: 'İzmir',
      age: 27,
      school: 'Dokuz Eylül Üniversitesi (mezun)',
      bio: 'Düşük donanımda güzel görünen oyunlar. GPU profilleme ve shader optimizasyonu.',
      availability: 'partial',
      weeklyHours: 10,
      joinedAt: daysAgo(330),
      links: { github: 'mertkilic' },
      evidence: [
        ev({
          id: 'e-mert-1',
          title: 'Pilot: düşük segment Android’de 60 FPS su sahnesi',
          summary: 'Anka Oyun ile 3 kilometre taşının tamamı çift onaylı. Test cihazında 58 FPS ölçüldü.',
          source: 'pilot',
          level: 'S3',
          skills: ['shader', 'perf', 'unity'],
          verifier: 'Anka Oyun Stüdyosu · Teknik Direktör',
          context: { sector: 'oyun', scale: 'girisim' },
          pilotId: 'pl-shader',
          ago: 70,
        }),
        ev({
          id: 'e-mert-2',
          title: 'Dalga — mobil su shader paketi (URP)',
          summary: 'Kırılma, köpük ve sıçrama efektli; tek geçişte çizilen su shader’ı.',
          source: 'github',
          level: 'S2',
          skills: ['unity', 'shader', 'perf'],
          url: 'https://github.com/mertkilic/dalga',
          metrics: [{ label: 'yıldız', value: '530' }],
          verifier: 'GitHub API · hesap sahipliği',
          ago: 200,
        }),
        ev({
          id: 'e-mert-3',
          title: 'Kule Savunması: Ege',
          summary: 'Google Play’de yayımlanan strateji oyunu. Geliştirici hesabı doğrulandı.',
          source: 'store',
          level: 'S2',
          skills: ['unity'],
          metrics: [
            { label: 'indirme', value: '120 bin+' },
            { label: 'puan', value: '4,5' },
          ],
          verifier: 'Google Play · geliştirici hesabı',
          context: { sector: 'oyun' },
          ago: 320,
        }),
      ],
    },
    {
      id: 'p-zeynep',
      handle: 'zeynepyalcin',
      name: 'Zeynep Yalçın',
      headline: 'Veri bilimci · Türkçe NLP',
      city: 'İstanbul',
      age: 25,
      school: 'Boğaziçi Üniversitesi (yüksek lisans)',
      bio: 'Türkçe metin sınıflandırma, açıklanabilir modeller. Etiketli veri olmadan model kurmam.',
      availability: 'open',
      weeklyHours: 20,
      joinedAt: daysAgo(260),
      links: { github: 'zeynepyalcin' },
      evidence: [
        ev({
          id: 'e-zey-1',
          title: 'turkce-sikayet — şikâyet sınıflandırma modeli',
          summary: '18 kategoride Türkçe şikâyet sınıflandırma; açık veri seti ve gerekçe gösteren model.',
          source: 'github',
          level: 'S2',
          skills: ['nlp', 'ml', 'python'],
          url: 'https://github.com/zeynepyalcin/turkce-sikayet',
          metrics: [
            { label: 'makro F1', value: '0,88' },
            { label: 'yıldız', value: '190' },
          ],
          verifier: 'GitHub API · hesap sahipliği',
          ago: 90,
        }),
        ev({
          id: 'e-zey-2',
          title: 'Türkçe müşteri metinlerinde çok etiketli sınıflandırma',
          summary: 'Hakemli konferans bildirisi, birinci yazar.',
          source: 'doi',
          level: 'S2',
          skills: ['nlp', 'ml'],
          url: 'https://doi.org/10.0000/nirengi-demo',
          verifier: 'DOI · Crossref yazar eşleşmesi',
          ago: 210,
        }),
        ev({
          id: 'e-zey-3',
          title: 'Haliç Teknopark veri atölyesi mentörlüğü',
          summary: '8 girişime 12 hafta boyunca veri analizi mentörlüğü.',
          source: 'endorsement',
          level: 'S3',
          skills: ['data', 'python'],
          verifier: 'Haliç Teknopark · Program Yöneticisi',
          ago: 150,
        }),
      ],
    },
    {
      id: 'p-baran',
      handle: 'baranozturk',
      name: 'Baran Öztürk',
      headline: 'Gömülü sistemler · IoT',
      city: 'Kocaeli',
      age: 21,
      school: 'Gebze Teknik Üniversitesi (3. sınıf)',
      bio: 'Sensörden haritaya kadar uçtan uca IoT. Kendi lehimimi kendim yaparım.',
      availability: 'open',
      weeklyHours: 20,
      joinedAt: daysAgo(40),
      links: { github: 'baranozturk' },
      evidence: [
        ev({
          id: 'e-bar-1',
          title: 'parkla — ESP32 + LoRa otopark doluluk sensörü',
          summary: 'Kampüs otoparkında 24 sensörle 3 ay çalıştı; MQTT ile canlı panele veri basıyor.',
          source: 'github',
          level: 'S2',
          skills: ['iot', 'cpp', 'realtime'],
          url: 'https://github.com/baranozturk/parkla',
          metrics: [
            { label: 'sensör', value: '24' },
            { label: 'çalışma', value: '3 ay' },
          ],
          verifier: 'GitHub API · hesap sahipliği',
          ago: 20,
        }),
        ev({
          id: 'e-bar-2',
          title: 'Teknofest Akıllı Ulaşım finalisti',
          summary: 'Takım kaptanı olarak final aşamasına kalan otopark yönlendirme sistemi.',
          source: 'endorsement',
          level: 'S3',
          skills: ['iot', 'maps'],
          verifier: 'Teknofest · Yarışma Komitesi',
          ago: 35,
        }),
        ev({
          id: 'e-bar-3',
          title: 'MQTT ile canlı izleme paneli',
          summary: 'Sensör verisini React ile canlı gösteren panel yaptığını beyan ediyor.',
          source: 'claim',
          level: 'S1',
          skills: ['realtime', 'react'],
          ago: 10,
        }),
      ],
    },
    {
      id: 'p-defne',
      handle: 'defnearslan',
      name: 'Defne Arslan',
      headline: 'Ürün tasarımcısı · UI/UX & marka',
      city: 'İstanbul',
      age: 23,
      school: 'Mimar Sinan Güzel Sanatlar Üniversitesi',
      bio: 'Küçük üreticiler için marka ve dijital vitrin. Erişilebilir tasarım sistemleri.',
      availability: 'partial',
      weeklyHours: 12,
      joinedAt: daysAgo(150),
      links: { web: 'behance.net/defnearslan' },
      evidence: [
        ev({
          id: 'e-def-1',
          title: 'Pusula — açık kaynak tasarım sistemi',
          summary: 'Figma Community’de yayımlanan, token tabanlı, kontrast denetimli tasarım sistemi.',
          source: 'figma',
          level: 'S2',
          skills: ['uiux', 'figma', 'a11y'],
          url: 'https://www.figma.com/community/file/pusula',
          metrics: [{ label: 'kopya', value: '2,8 bin' }],
          verifier: 'Figma · yayıncı hesabı',
          ago: 80,
        }),
        ev({
          id: 'e-def-2',
          title: 'Kooperatif ambalaj ve kimlik serisi',
          summary: 'Üç yerel üretici için logo, ambalaj ve etiket sistemi.',
          source: 'behance',
          level: 'S2',
          skills: ['brand', 'visual'],
          url: 'https://www.behance.net/defnearslan',
          verifier: 'Behance · hesap bağlantısı',
          ago: 120,
        }),
        ev({
          id: 'e-def-3',
          title: 'Kilometre taşı: marka kimliği ve kılavuz teslimi',
          summary: 'Kapanan Atölye Kooperatifi deneme projesinin çift onaylı ilk kriteri. Proje kapandı ama bu teslim kanıt olarak kalır.',
          source: 'pilot',
          level: 'S3',
          skills: ['brand', 'uiux'],
          verifier: 'Atölye Tekstil Kooperatifi · Kooperatif Başkanı',
          context: { sector: 'uretim', scale: 'kobi' },
          pilotId: 'pl-kimlik',
          ago: 62,
        }),
      ],
    },
    {
      id: 'p-emir',
      handle: 'emirdogan',
      name: 'Emir Doğan',
      headline: 'Platform mühendisi · Kubernetes',
      city: 'Bursa',
      age: 29,
      school: 'Uludağ Üniversitesi (mezun)',
      bio: 'Altyapıyı sıkıcı hale getirmek işim. Kubernetes operatörleri ve gözlemlenebilirlik.',
      availability: 'closed',
      weeklyHours: 0,
      joinedAt: daysAgo(420),
      links: { github: 'emirdogan' },
      evidence: [
        ev({
          id: 'e-emir-1',
          title: 'kuyruk-operator — Kubernetes operatörü',
          summary: 'Kuyruk derinliğine göre ölçeklenen iş yükleri için operatör.',
          source: 'github',
          level: 'S2',
          skills: ['devops', 'go'],
          url: 'https://github.com/emirdogan/kuyruk-operator',
          metrics: [{ label: 'yıldız', value: '880' }],
          verifier: 'GitHub API · hesap sahipliği',
          ago: 400,
        }),
        ev({
          id: 'e-emir-2',
          title: '40 servisin Kubernetes’e taşınması',
          summary: 'Bankacılık altyapısında sıfır kesintiyle taşıma; rolü ve süresi kurumca imzalandı.',
          source: 'endorsement',
          level: 'S3',
          skills: ['devops', 'distributed'],
          verifier: 'Pera Finans Lab · Altyapı Lideri',
          context: { sector: 'fintek', scale: 'kurumsal' },
          ago: 250,
        }),
      ],
    },
    {
      id: 'p-irem',
      handle: 'iremkoc',
      name: 'İrem Koç',
      headline: 'Teknik yazar · API dokümantasyonu',
      city: 'Eskişehir',
      age: 20,
      school: 'Anadolu Üniversitesi (2. sınıf)',
      bio: 'Geliştiricinin ilk 10 dakikasını kolaylaştıran dokümantasyon yazıyorum.',
      availability: 'open',
      weeklyHours: 15,
      joinedAt: daysAgo(32),
      links: { github: 'iremkoc', domain: 'iremkoc.dev' },
      evidence: [
        ev({
          id: 'e-irem-1',
          title: 'acik-veri-rehberi — açık veri API kılavuzu',
          summary: 'Bir büyükşehir açık veri portalı için gönüllü yazılan, örnekli Türkçe API kılavuzu.',
          source: 'github',
          level: 'S2',
          skills: ['docs', 'api'],
          url: 'https://github.com/iremkoc/acik-veri-rehberi',
          metrics: [{ label: 'birleştirilen PR', value: '14' }],
          verifier: 'GitHub API · hesap sahipliği',
          ago: 15,
        }),
        ev({
          id: 'e-irem-2',
          title: 'iremkoc.dev',
          summary: 'Teknik yazı portfolyosu.',
          source: 'domain',
          level: 'S2',
          skills: ['docs'],
          url: 'https://iremkoc.dev',
          verifier: 'DNS TXT kaydı',
          ago: 12,
        }),
        ev({
          id: 'e-irem-3',
          title: 'OpenAPI şeması yazımı',
          summary: 'Ders projesinde OpenAPI 3.1 şeması yazdığını beyan ediyor.',
          source: 'claim',
          level: 'S1',
          skills: ['api', 'docs'],
          ago: 50,
        }),
      ],
    },
    {
      id: 'p-kaan',
      handle: 'kaaner',
      name: 'Kaan Er',
      headline: 'Mobil geliştirici · Flutter',
      city: 'Antalya',
      age: 26,
      school: 'Akdeniz Üniversitesi (mezun)',
      bio: 'Sağlık ve randevu uygulamaları. Erişilebilirlik testlerini CI’a koymayı seviyorum.',
      availability: 'open',
      weeklyHours: 20,
      joinedAt: daysAgo(180),
      links: { github: 'kaaner' },
      evidence: [
        ev({
          id: 'e-kaan-1',
          title: 'Randevum — klinik randevu uygulaması',
          summary: 'App Store ve Google Play’de yayında; 14 klinik kullanıyor.',
          source: 'store',
          level: 'S2',
          skills: ['flutter'],
          metrics: [{ label: 'aktif klinik', value: '14' }],
          verifier: 'App Store · yayıncı hesabı',
          context: { sector: 'saglik', scale: 'girisim' },
          ago: 100,
        }),
        ev({
          id: 'e-kaan-2',
          title: 'flutter-a11y-lint — erişilebilirlik denetleyicisi',
          summary: 'Flutter widget ağacında eksik etiketleri ve kontrast sorunlarını CI’da yakalar.',
          source: 'github',
          level: 'S2',
          skills: ['flutter', 'a11y'],
          url: 'https://github.com/kaaner/flutter-a11y-lint',
          metrics: [{ label: 'yıldız', value: '147' }],
          verifier: 'GitHub API · hesap sahipliği',
          ago: 55,
        }),
        ev({
          id: 'e-kaan-3',
          title: 'Pusula — açık kaynak tasarım sistemi',
          summary: 'Tasarım sistemini kendisinin hazırladığını beyan ediyor.',
          source: 'claim',
          level: 'S1',
          skills: ['uiux', 'figma'],
          url: 'https://www.figma.com/community/file/pusula',
          ago: 18,
        }),
      ],
    },
    {
      id: 'p-selin',
      handle: 'selinyurt',
      name: 'Selin Yurt',
      headline: 'Veri mühendisi · PostgreSQL',
      city: 'İstanbul',
      age: 28,
      school: 'İTÜ Endüstri Mühendisliği (mezun)',
      bio: 'Zaman serisi verisi, rota ve filo analitiği. Önce ölç, sonra optimize et.',
      availability: 'partial',
      weeklyHours: 8,
      joinedAt: daysAgo(240),
      links: { github: 'selinyurt' },
      evidence: [
        ev({
          id: 'e-sel-1',
          title: 'pg-zaman — zaman serisi sıkıştırma eklentisi',
          summary: 'PostgreSQL için sütun bazlı sıkıştırma; filo telemetrisinde depolamayı %71 azalttı.',
          source: 'github',
          level: 'S2',
          skills: ['postgres', 'data', 'perf'],
          url: 'https://github.com/selinyurt/pg-zaman',
          metrics: [{ label: 'yıldız', value: '320' }],
          verifier: 'GitHub API · hesap sahipliği',
          ago: 180,
        }),
        ev({
          id: 'e-sel-2',
          title: 'Lojistik veri ambarı ve rota analitiği',
          summary: 'Önceki işinde araç rotası analitiği yaptığını beyan ediyor.',
          source: 'claim',
          level: 'S1',
          skills: ['data', 'optimization'],
          context: { sector: 'lojistik' },
          ago: 400,
        }),
      ],
    },
  ];
}

const crit = (id: string, text: string) => ({ id, text });

function needs(): Need[] {
  return [
    {
      id: 'n-rota',
      orgId: 'o-kuzey',
      title: 'Sabah rota hesaplamasını 45 dakikadan 5 dakikanın altına indirmek',
      status: 'piloting',
      createdAt: daysAgo(40),
      publishedAt: daysAgo(38),
      round: ROUND,
      skills: ['go', 'optimization', 'distributed', 'api'],
      canvas: {
        current: 'Günlük 3.000 teslimat noktasının rotası her sabah Python ile yazılmış tek iş parçacıklı bir betikle hesaplanıyor.',
        pain: 'Hesaplama bitmeden araçlar depodan çıkamıyor; sabahın ilk teslimatları gecikiyor.',
        painMetric: 'Hesaplama süresi ortalama 45 dk; sabah ilk teslimat gecikmesi %18',
        outcome: 'Aynı kısıtlarla çalışan, eşzamanlı ve ölçülebilir hızda yeni bir rota servisi.',
        criteria: [
          crit('c-rota-1', '3.000 noktalık rota hesaplaması 5 dakikanın altında tamamlanır'),
          crit('c-rota-2', 'Toplam rota mesafesi mevcut çözüme göre en fazla %2 uzun olur'),
          crit('c-rota-3', 'Servis sipariş sistemine REST API ile 2 hafta içinde bağlanır'),
        ],
        constraints: [
          { kind: 'veri', text: 'Gerçek adres yerine anonimleştirilmiş koordinat verisi verilir' },
          { kind: 'sure', text: 'Deneme projesi süresi 6 hafta' },
          { kind: 'butce', text: 'Deneme projesi bütçesi 60.000 TL' },
        ],
        decisionMaker: 'Operasyon Direktörü',
        scope: 'Yalnız Tuzla deposu ve 1 haftalık geçmiş sipariş verisi.',
      },
    },
    {
      id: 'n-otopark',
      orgId: 'o-marmara',
      title: 'Otopark doluluk verisini sürücülere 30 saniyede canlı haritada göstermek',
      status: 'published',
      createdAt: daysAgo(12),
      publishedAt: daysAgo(10),
      round: ROUND,
      skills: ['iot', 'realtime', 'maps', 'react'],
      canvas: {
        current: 'Şişhane ve Karaköy’deki 4 otoparkta 220 sensör kurulu; veri yalnızca belediye içi haftalık Excel raporlarına akıyor.',
        pain: 'Sürücüler boş yer ararken bölgede tur atıyor; trafik ve şikâyet artıyor.',
        painMetric: 'Boş yer arama süresi ortalama 11 dk; bölgeden ayda 340 şikâyet',
        outcome: 'Sensör verisini 30 saniyeden kısa gecikmeyle gösteren, mobil uyumlu açık harita.',
        criteria: [
          crit('c-otp-1', 'Doluluk bilgisi sahadan haritaya 30 saniyeden kısa sürede yansır'),
          crit('c-otp-2', 'Harita orta segment telefonda 3 saniyenin altında açılır'),
          crit('c-otp-3', 'Deneme bölgesinde boş yer arama süresi %25 azalır'),
        ],
        constraints: [
          { kind: 'mevzuat', text: 'Açık veri lisansıyla yayımlanır; kişisel veri tutulmaz' },
          { kind: 'teknoloji', text: 'Sensörler LoRaWAN üzerinden MQTT yayını yapıyor' },
          { kind: 'sure', text: '8 hafta' },
        ],
        decisionMaker: 'Akıllı Şehir Lab. Koordinatörü',
        scope: 'Şişhane otoparkı (60 sensör) ile sınırlı.',
      },
    },
    {
      id: 'n-sikayet',
      orgId: 'o-pera',
      title: 'Müşteri şikâyetlerini ilk 10 dakikada doğru ekibe yönlendirmek',
      status: 'published',
      createdAt: daysAgo(9),
      publishedAt: daysAgo(7),
      round: ROUND,
      skills: ['nlp', 'ml', 'python', 'api'],
      canvas: {
        current: 'Günde yaklaşık 4.000 şikâyet e-posta ve uygulama içi formla geliyor; 12 kişilik ekip elle etiketliyor.',
        pain: 'Yanlış ekibe giden şikâyetler el değiştiriyor, çözüm süresi uzuyor.',
        painMetric: 'Yanlış yönlendirme oranı %27; ilk yanıt süresi ortalama 9 saat',
        outcome: 'Türkçe şikâyet metnini 14 kategoriye ayıran ve gerekçesini gösteren sınıflandırma servisi.',
        criteria: [
          crit('c-sik-1', 'Ayrılmış test setinde makro F1 en az 0,85'),
          crit('c-sik-2', 'Yanlış yönlendirme oranı %10’un altına iner'),
          crit('c-sik-3', 'Her tahmin için en etkili 3 ifade gösterilir'),
        ],
        constraints: [
          { kind: 'mevzuat', text: 'KVKK: veri maskelenir ve yalnız kurum içi ortamda işlenir' },
          { kind: 'veri', text: 'Etiketli 60.000 geçmiş şikâyet sağlanır' },
          { kind: 'sure', text: '10 hafta' },
        ],
        decisionMaker: 'Müşteri Deneyimi Direktörü',
        scope: 'Yalnız kredi kartı ürün ailesine gelen şikâyetler.',
      },
    },
    {
      id: 'n-api-docs',
      orgId: 'o-marmara',
      title: 'Açık veri API’leri için 10 dakikada başlatan Türkçe geliştirici kılavuzu',
      status: 'piloting',
      createdAt: daysAgo(48),
      publishedAt: daysAgo(45),
      round: ROUND,
      skills: ['docs', 'api'],
      canvas: {
        current: 'Portaldaki 12 API uç noktasının yalnız İngilizce, örneksiz bir listesi var.',
        pain: 'Girişimler API’yi kullanmaya başlayamadan vazgeçiyor; destek e-postaları birikiyor.',
        painMetric: 'Kayıt olan geliştiricilerin %64’ü hiç istek atmıyor; ayda 90 destek e-postası',
        outcome: 'Örnekli, Türkçe, OpenAPI şemasıyla desteklenen geliştirici kılavuzu.',
        criteria: [
          crit('c-doc-1', '12 uç noktanın tamamı örnek istek ve yanıtla belgelenir'),
          crit('c-doc-2', 'OpenAPI 3.1 şeması doğrulayıcıdan 0 hatayla geçer'),
          crit('c-doc-3', 'İlk başarılı isteğe ulaşma süresi 10 dakikanın altına iner'),
        ],
        constraints: [
          { kind: 'sure', text: '5 hafta' },
          { kind: 'mevzuat', text: 'Kılavuz CC BY 4.0 ile yayımlanır' },
        ],
        decisionMaker: 'Açık Veri Ekip Lideri',
        scope: 'Ulaşım ve otopark kategorisindeki 12 uç nokta.',
      },
    },
    {
      id: 'n-shader',
      orgId: 'o-anka',
      title: 'Düşük segment Android cihazlarda su sahnesini 55+ FPS’e çıkarmak',
      status: 'closed',
      createdAt: daysAgo(125),
      publishedAt: daysAgo(122),
      round: '2026·Ç2',
      skills: ['unity', 'shader', 'perf'],
      canvas: {
        current: 'Yeni oyunun su parkı sahnesi yerleşik Unity sıvı çözümüyle çiziliyor.',
        pain: '2 GB RAM’li cihazlarda kare hızı düşüyor, kullanıcılar ilk gün oyunu bırakıyor.',
        painMetric: 'Test cihazında 17 FPS; ilk gün bırakma oranı %41',
        outcome: 'Görselden ödün vermeden mobilde akıcı çalışan su shader’ı.',
        criteria: [
          crit('c-sh-1', 'Test cihazında (2 GB RAM) en az 55 FPS'),
          crit('c-sh-2', 'Unity URP ile uyumlu shader paketi teslim edilir'),
          crit('c-sh-3', 'Sıçrama efektinin GPU süresi 1 ms’nin altında kalır'),
        ],
        constraints: [
          { kind: 'teknoloji', text: 'Unity 2022 LTS, URP' },
          { kind: 'butce', text: '45.000 TL' },
        ],
        decisionMaker: 'Teknik Direktör',
        scope: 'Tek sahne, tek test cihazı.',
      },
    },
    {
      id: 'n-kimlik',
      orgId: 'o-atolye',
      title: 'Kooperatif ürünleri için marka kimliği ve e-ticaret görselleri',
      status: 'closed',
      createdAt: daysAgo(100),
      publishedAt: daysAgo(98),
      round: '2026·Ç3',
      skills: ['brand', 'visual', 'uiux'],
      canvas: {
        current: 'Ürünler yalnızca pazar yerlerinde ve tanıdık çevresinde satılıyor; ortak bir marka yok.',
        pain: 'Çevrim içi satışa geçmek istiyoruz ama ürünlerin fotoğrafı ve markası yok.',
        painMetric: 'Çevrim içi satış: ayda 0 sipariş',
        outcome: 'Kooperatifin ortak kimliği ve satışa hazır ürün görselleri.',
        criteria: [
          crit('c-kim-1', 'Logo ve kimlik kılavuzu teslim edilir'),
          crit('c-kim-2', '40 ürünün e-ticaret fotoğrafları hazırlanır'),
          crit('c-kim-3', 'Çevrim içi satış ilk ay 50 siparişe ulaşır'),
        ],
        constraints: [{ kind: 'butce', text: '25.000 TL (stüdyo dahil)' }],
        decisionMaker: 'Kooperatif Başkanı',
        scope: 'Dokuma ürün grubundaki 40 ürün.',
      },
    },
    {
      id: 'n-erisim',
      orgId: 'o-sifa',
      title: 'Uygulamamızı daha erişilebilir yapmak',
      status: 'draft',
      createdAt: daysAgo(2),
      round: ROUND,
      skills: ['flutter', 'a11y'],
      canvas: {
        current: 'Randevu uygulamamız var.',
        pain: 'Bazı kullanıcılar zorlanıyor.',
        painMetric: '',
        outcome: 'Daha iyi bir deneyim.',
        criteria: [crit('c-eri-1', 'Kullanıcılar memnun olsun')],
        constraints: [],
        decisionMaker: '',
        scope: '',
      },
    },
  ];
}

type LogSpec = { ago: number; actor: LogEntry['actor']; kind: LogEntry['kind']; text: string };

const ledger = (specs: LogSpec[]) =>
  specs.reduce<LogEntry[]>((log, s) => appendEntry(log, { at: daysAgo(s.ago), actor: s.actor, kind: s.kind, text: s.text }), []);

const ms = (
  id: string,
  criterionId: string,
  title: string,
  due: string,
  state: Milestone['state'],
  person?: number,
  org?: number,
  note?: string,
): Milestone => ({
  id,
  criterionId,
  title,
  due,
  state,
  submittedNote: note,
  approvals: {
    person: person === undefined ? undefined : daysAgo(person),
    org: org === undefined ? undefined : daysAgo(org),
  },
});

function pilots(): Pilot[] {
  return [
    {
      id: 'pl-rota',
      needId: 'n-rota',
      orgId: 'o-kuzey',
      personId: 'p-can',
      title: 'Eşzamanlı rota servisi — Tuzla deposu',
      status: 'active',
      startedAt: daysAgo(24),
      milestones: [
        ms('m-rota-1', 'c-rota-1', '3.000 noktalık rota hesaplaması 5 dakikanın altında tamamlanır', daysAgo(6), 'approved', 9, 8),
        ms(
          'm-rota-2',
          'c-rota-2',
          'Toplam rota mesafesi mevcut çözüme göre en fazla %2 uzun olur',
          daysFromNow(3),
          'submitted',
          1,
          undefined,
          '1 haftalık geçmiş veride ortalama fark +%1,3 (en kötü gün +%1,9). Karşılaştırma tablosu ekte.',
        ),
        ms('m-rota-3', 'c-rota-3', 'Servis sipariş sistemine REST API ile 2 hafta içinde bağlanır', daysFromNow(12), 'open'),
      ],
      log: ledger([
        { ago: 24, actor: 'system', kind: 'open', text: 'Deneme projesi açıldı. İhtiyaç kartındaki 3 başarı kriteri aşamaya dönüştü.' },
        { ago: 21, actor: 'org', kind: 'decision', text: 'Anonim koordinat verisi ve 1 haftalık sipariş dökümü paylaşıldı.' },
        { ago: 19, actor: 'person', kind: 'decision', text: 'Yöntem: genetik algoritma + 2-opt yerel iyileştirme. Hazır çözücü lisansı gerektirmediği için seçildi.' },
        { ago: 11, actor: 'person', kind: 'update', text: 'İlk ölçüm: 3.000 nokta 3 dk 40 sn (8 çekirdek).' },
        { ago: 9, actor: 'person', kind: 'submit', text: 'Kilometre taşı teslim edildi: 3.000 noktalık rota hesaplaması 5 dakikanın altında tamamlanır' },
        { ago: 8, actor: 'org', kind: 'approve', text: 'Kurum onayı: ölçüm depo sunucusunda tekrarlandı (3 dk 52 sn).' },
        { ago: 8, actor: 'system', kind: 'approve', text: 'Çift onay tamamlandı → kişinin profiline Kurum onaylı kanıt olarak işlendi.' },
        { ago: 5, actor: 'person', kind: 'blocker', text: 'Sipariş sistemi test ortamına erişim bekleniyor.' },
        { ago: 1, actor: 'person', kind: 'submit', text: 'Kilometre taşı teslim edildi: Toplam rota mesafesi mevcut çözüme göre en fazla %2 uzun olur' },
      ]),
    },
    {
      id: 'pl-docs',
      needId: 'n-api-docs',
      orgId: 'o-marmara',
      personId: 'p-irem',
      title: 'Açık veri geliştirici kılavuzu',
      status: 'active',
      startedAt: daysAgo(30),
      milestones: [
        ms('m-doc-1', 'c-doc-1', '12 uç noktanın tamamı örnek istek ve yanıtla belgelenir', daysAgo(9), 'submitted', 11, undefined, '12/12 uç nokta, curl ve JavaScript örnekleriyle. Önizleme bağlantısı paylaşıldı.'),
        ms('m-doc-2', 'c-doc-2', 'OpenAPI 3.1 şeması doğrulayıcıdan 0 hatayla geçer', daysFromNow(4), 'open'),
        ms('m-doc-3', 'c-doc-3', 'İlk başarılı isteğe ulaşma süresi 10 dakikanın altına iner', daysFromNow(14), 'open'),
      ],
      log: ledger([
        { ago: 30, actor: 'system', kind: 'open', text: 'Deneme projesi açıldı. İhtiyaç kartındaki 3 başarı kriteri aşamaya dönüştü.' },
        { ago: 26, actor: 'org', kind: 'decision', text: 'Kılavuz dili Türkçe; terimler için TDK karşılıkları kullanılacak.' },
        { ago: 11, actor: 'person', kind: 'submit', text: 'Kilometre taşı teslim edildi: 12 uç noktanın tamamı örnek istek ve yanıtla belgelenir' },
      ]),
    },
    {
      id: 'pl-shader',
      needId: 'n-shader',
      orgId: 'o-anka',
      personId: 'p-mert',
      title: 'Mobil su shader’ı — Anka su parkı sahnesi',
      status: 'succeeded',
      startedAt: daysAgo(110),
      closedAt: daysAgo(70),
      closure: {
        reason: '3/3 başarı kriteri karşılandı.',
        summary: 'Test cihazında 58 FPS ölçüldü; shader paketi oyunun 1.4 sürümüyle yayına girdi.',
        publicConsent: { person: true, org: true },
      },
      milestones: [
        ms('m-sh-1', 'c-sh-1', 'Test cihazında (2 GB RAM) en az 55 FPS', daysAgo(85), 'approved', 88, 87),
        ms('m-sh-2', 'c-sh-2', 'Unity URP ile uyumlu shader paketi teslim edilir', daysAgo(78), 'approved', 79, 78),
        ms('m-sh-3', 'c-sh-3', 'Sıçrama efektinin GPU süresi 1 ms’nin altında kalır', daysAgo(72), 'approved', 72, 71),
      ],
      log: ledger([
        { ago: 110, actor: 'system', kind: 'open', text: 'Deneme projesi açıldı. İhtiyaç kartındaki 3 başarı kriteri aşamaya dönüştü.' },
        { ago: 104, actor: 'person', kind: 'update', text: 'Profil ölçümü: darboğaz şeffaflık sıralaması ve 4 ayrı geçiş.' },
        { ago: 88, actor: 'person', kind: 'submit', text: 'Kilometre taşı teslim edildi: Test cihazında (2 GB RAM) en az 55 FPS' },
        { ago: 87, actor: 'org', kind: 'approve', text: 'Kurum onayı: 58 FPS, 10 dakikalık oturumda ölçüldü.' },
        { ago: 79, actor: 'person', kind: 'submit', text: 'Kilometre taşı teslim edildi: Unity URP ile uyumlu shader paketi teslim edilir' },
        { ago: 78, actor: 'org', kind: 'approve', text: 'Kurum onayı: paket ana dala birleştirildi.' },
        { ago: 72, actor: 'person', kind: 'submit', text: 'Kilometre taşı teslim edildi: Sıçrama efektinin GPU süresi 1 ms’nin altında kalır' },
        { ago: 71, actor: 'org', kind: 'approve', text: 'Kurum onayı: 0,6 ms.' },
        { ago: 70, actor: 'system', kind: 'close', text: 'Deneme projesi başarıyla kapandı. Taraflar kamuya açık özet kartını onayladı.' },
      ]),
    },
    {
      id: 'pl-kimlik',
      needId: 'n-kimlik',
      orgId: 'o-atolye',
      personId: 'p-defne',
      title: 'Kooperatif kimliği ve ürün görselleri',
      status: 'failed',
      startedAt: daysAgo(95),
      closedAt: daysAgo(40),
      closure: {
        reason: 'Ürün çekimi için gereken stüdyo bütçesi kooperatif tarafından ayrılamadı. 1/3 kriter karşılandı.',
        summary: 'Kimlik çalışması teslim edildi ve kullanımda. Fotoğraf ve satış kriterleri bütçe nedeniyle ertelendi; yeni turda yeniden yazılacak.',
        publicConsent: { person: true, org: true },
      },
      milestones: [
        ms('m-kim-1', 'c-kim-1', 'Logo ve kimlik kılavuzu teslim edilir', daysAgo(70), 'approved', 63, 62),
        ms('m-kim-2', 'c-kim-2', '40 ürünün e-ticaret fotoğrafları hazırlanır', daysAgo(50), 'open'),
        ms('m-kim-3', 'c-kim-3', 'Çevrim içi satış ilk ay 50 siparişe ulaşır', daysAgo(40), 'open'),
      ],
      log: ledger([
        { ago: 95, actor: 'system', kind: 'open', text: 'Deneme projesi açıldı. İhtiyaç kartındaki 3 başarı kriteri aşamaya dönüştü.' },
        { ago: 63, actor: 'person', kind: 'submit', text: 'Kilometre taşı teslim edildi: Logo ve kimlik kılavuzu teslim edilir' },
        { ago: 62, actor: 'org', kind: 'approve', text: 'Kurum onayı: kimlik genel kurulda kabul edildi.' },
        { ago: 55, actor: 'org', kind: 'blocker', text: 'Stüdyo kiralama bütçesi bu çeyrekte ayrılamıyor.' },
        { ago: 41, actor: 'system', kind: 'nudge', text: 'Sessizlik uyarısı: 14 gündür güncelleme yok. İki tarafa da hatırlatma gönderildi.' },
        { ago: 40, actor: 'system', kind: 'close', text: 'Pilot gerekçesiyle kapandı. Onaylanan kilometre taşı kanıt olarak korundu.' },
      ]),
    },
  ];
}

function events(): NetEvent[] {
  const e = (ago: number, kind: NetEvent['kind'], text: string, refs: Partial<NetEvent> = {}): NetEvent => ({
    id: `ev-${kind}-${ago}-${text.length}`,
    at: daysAgo(ago),
    kind,
    text,
    ...refs,
  });
  return [
    e(1, 'micro', 'Zeynep Yalçın, Pera Finans Lab ekibine 30 dakikalık uzman görüşü verdi.', { personId: 'p-zeynep', orgId: 'o-pera' }),
    e(1, 'evidence_verified', 'İrem Koç’un kanıtı “iremkoc.dev” DNS TXT ile doğrulandı.', { personId: 'p-irem' }),
    e(2, 'micro', 'Defne Arslan, Şifa Dijital Sağlık’ın taslak ihtiyacına erişilebilirlik incelemesi bıraktı.', { personId: 'p-defne', orgId: 'o-sifa' }),
    e(7, 'need_published', 'Pera Finans Lab yeni ihtiyaç yayımladı: “Müşteri şikâyetlerini ilk 10 dakikada doğru ekibe yönlendirmek”.', { orgId: 'o-pera', needId: 'n-sikayet' }),
    e(8, 'milestone_approved', 'Kuzey Lojistik × Can Aksoy: “3.000 noktalık rota 5 dakikanın altında” çift onaylandı.', { orgId: 'o-kuzey', personId: 'p-can', pilotId: 'pl-rota' }),
    e(10, 'need_published', 'Marmara Akıllı Şehir Lab. yeni ihtiyaç yayımladı: “Otopark doluluk verisini canlı haritada göstermek”.', { orgId: 'o-marmara', needId: 'n-otopark' }),
    e(20, 'evidence_verified', 'Baran Öztürk’ün “parkla” deposu GitHub ile doğrulandı.', { personId: 'p-baran' }),
    e(24, 'pilot_opened', 'Kuzey Lojistik × Can Aksoy deneme projesi açıldı.', { orgId: 'o-kuzey', personId: 'p-can', pilotId: 'pl-rota' }),
    e(30, 'pilot_opened', 'Marmara Akıllı Şehir Lab. × İrem Koç deneme projesi açıldı.', { orgId: 'o-marmara', personId: 'p-irem', pilotId: 'pl-docs' }),
    e(32, 'person_joined', 'İrem Koç NİRENGİ’ye katıldı ve ilk kanıtını bağladı.', { personId: 'p-irem' }),
    e(40, 'pilot_closed', 'Atölye Kooperatifi × Defne Arslan deneme projesi gerekçesiyle kapandı (1/3 kriter).', { orgId: 'o-atolye', personId: 'p-defne', pilotId: 'pl-kimlik' }),
    e(40, 'person_joined', 'Baran Öztürk NİRENGİ’ye katıldı.', { personId: 'p-baran' }),
    e(70, 'pilot_closed', 'Anka Oyun × Mert Kılıç deneme projesi başarıyla kapandı (3/3 kriter).', { orgId: 'o-anka', personId: 'p-mert', pilotId: 'pl-shader' }),
  ];
}

// ---------------------------------------------------------------- progress & community

/** Deterministic generator so every reset produces the same demo history. */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

interface Pace {
  pace: number; // typical active days per week in past weeks
  tier: number;
  goal: WeeklyGoal;
  thisWeek: number[]; // active weekdays this week, 0 = Monday
  rest?: number[]; // past weeks (1 = last week) announced as rest
  off?: number[]; // past weeks with no output and no rest: real people miss weeks
}

const PACE: Record<string, Pace> = {
  'p-can': { pace: 4, tier: 2, goal: 3, thisWeek: [0, 1] },
  'p-elif': { pace: 5, tier: 2, goal: 5, thisWeek: [0, 1, 2] },
  'p-mert': { pace: 2, tier: 2, goal: 1, thisWeek: [1], off: [4] },
  'p-zeynep': { pace: 4, tier: 2, goal: 3, thisWeek: [0, 2] },
  'p-baran': { pace: 3, tier: 0, goal: 3, thisWeek: [0, 1, 2], off: [6, 9] },
  'p-defne': { pace: 3, tier: 2, goal: 3, thisWeek: [1], rest: [3] },
  'p-emir': { pace: 1, tier: 2, goal: 1, thisWeek: [], off: [2, 5, 6] },
  'p-irem': { pace: 3, tier: 0, goal: 3, thisWeek: [0, 2], off: [7] },
  'p-kaan': { pace: 4, tier: 2, goal: 3, thisWeek: [0, 1, 2] },
  'p-selin': { pace: 2, tier: 2, goal: 1, thisWeek: [2], off: [3, 8] },
};

function withProgress(person: Person): Person {
  const cfg = PACE[person.id];
  if (!cfg) return person;
  const r = rng(person.id);
  const monday = new Date(`${weekKey(Date.now())}T12:00:00`);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const day = (weeksAgo: number, idx: number) => {
    const d = new Date(monday);
    d.setDate(d.getDate() - weeksAgo * 7 + idx);
    return dayKey(d);
  };
  const activity = cfg.thisWeek.filter((i) => i <= todayIdx).map((i) => day(0, i));
  for (let w = 1; w <= 12; w++) {
    if (cfg.rest?.includes(w) || cfg.off?.includes(w)) continue;
    const n = Math.max(0, Math.min(7, Math.round(cfg.pace + (r() - 0.5) * 2.2)));
    const idx = [0, 1, 2, 3, 4, 5, 6];
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    for (const i of idx.slice(0, n)) activity.push(day(w, i));
  }
  return { ...person, activity, tier: cfg.tier, weeklyGoal: cfg.goal, restWeeks: (cfg.rest ?? []).map((w) => day(w, 0)) };
}

/** Fictional league members; they exist only to make the demo league a race. */
function peers(): Peer[] {
  const p = (id: string, name: string, area: string, tier: number, weekly: number[]): Peer => ({ id: `peer-${id}`, name, area, tier, weekly });
  return [
    p('ada', 'Ada Kurt', 'React', 2, [210, 180, 240]),
    p('bora', 'Bora Şen', 'Go', 2, [160, 190, 150]),
    p('cem', 'Cem Aydın', 'Python', 2, [130, 120, 170]),
    p('dila', 'Dila Er', 'Figma', 2, [120, 140, 90]),
    p('efe', 'Efe Yıldız', 'Rust', 2, [110, 60, 130]),
    p('gizem', 'Gizem Tan', 'Veri analizi', 2, [90, 110, 100]),
    p('hakan', 'Hakan Bulut', 'Kotlin', 2, [70, 90, 60]),
    p('ilke', 'İlke Çınar', 'Teknik yazım', 2, [50, 80, 70]),
    p('kerem', 'Kerem Ateş', 'DevOps', 2, [40, 30, 90]),
    p('lale', 'Lale Ok', 'Unity', 2, [20, 50, 40]),
    p('mina', 'Mina Doğru', 'React', 0, [140, 90, 120]),
    p('nehir', 'Nehir Kaya', 'Python', 0, [120, 130, 80]),
    p('onur', 'Onur Güneş', 'Flutter', 0, [100, 70, 110]),
    p('pelin', 'Pelin Ay', 'UI/UX', 0, [90, 100, 60]),
    p('rüzgar', 'Rüzgar Taş', 'Go', 0, [80, 40, 70]),
    p('sena', 'Sena Yurt', 'IoT', 0, [70, 90, 50]),
    p('tuna', 'Tuna Erdem', 'TypeScript', 0, [60, 30, 80]),
    p('umut', 'Umut Sarp', 'C++', 0, [50, 60, 30]),
    p('yaren', 'Yaren Göl', 'Veri analizi', 0, [40, 20, 60]),
    p('zafer', 'Zafer Ilgın', 'Node.js', 0, [30, 50, 20]),
    p('aras', 'Aras Polat', 'Kubernetes', 0, [20, 10, 40]),
    p('beren', 'Beren Uz', 'Figma', 0, [10, 30, 0]),
  ];
}

function posts(): Post[] {
  const at = (ago: number, h = 0) => daysAgo(ago + h / 24);
  return [
    {
      id: 'post-irem-openapi',
      personId: 'p-irem',
      kind: 'soru',
      text: 'OpenAPI şemasında aynı hata gövdesini 12 uç noktada tekrar yazmamak için en temiz yol ne? components/responses mu, yoksa her yerde $ref mi?',
      at: at(0, 3),
      supports: ['p-elif'],
      replies: [
        {
          id: 'r-irem-1',
          personId: 'p-zeynep',
          text: 'components/responses altında bir kez tanımla, uç noktalarda $ref ile çağır. Hata kodlarını da tek bir enum’da topla; istemci tarafı sana teşekkür eder.',
          at: at(0, 1),
        },
      ],
    },
    {
      id: 'post-can-rota',
      personId: 'p-can',
      kind: 'calisiyorum',
      text: 'Kuzey Lojistik pilotunda ikinci kilometre taşındayım: rota mesafesini mevcut çözümün en fazla %2 üstünde tutmam gerekiyor. 2-opt sonrası or-opt deniyorum, ilk ölçümde %3,1.',
      at: at(1, 2),
      supports: ['p-mert', 'p-zeynep', 'p-kaan'],
      replies: [
        {
          id: 'r-can-1',
          personId: 'p-kaan',
          text: 'Depoya yakın noktaları önce kümelersen or-opt’un arama alanı küçülür. Biz otobüs duraklarında böyle yapmıştık.',
          at: at(1),
        },
      ],
    },
    {
      id: 'post-baran-lora',
      personId: 'p-baran',
      kind: 'soru',
      text: 'ESP32’de LoRa paketleri ara ara kayboluyor. Yeniden deneme mi eklemeliyim, yoksa ACK mekanizması mı kurmalıyım? Pil ömrü kritik.',
      at: at(2, 5),
      supports: ['p-can'],
      replies: [
        {
          id: 'r-baran-1',
          personId: 'p-can',
          text: 'Pil kritikse önce ACK’siz, sıra numaralı gönderim dene ve alıcıda eksik numaraları say. Kayıp oranını ölçmeden yeniden deneme eklemek pili boşa harcar.',
          at: at(2, 3),
          helpful: true,
        },
        {
          id: 'r-baran-2',
          personId: 'p-kaan',
          text: 'Spreading factor’ü bir kademe artırmak çoğu zaman yetiyor. Menzil ile pil arasındaki dengeyi ölçerek seç.',
          at: at(2, 2),
        },
      ],
    },
    {
      id: 'post-elif-kartui',
      personId: 'p-elif',
      kind: 'gosteri',
      text: 'kart-ui 2.0 yayında. Bütün bileşenler ekran okuyucuyla test edildi ve ilk dış katkımızı aldık.',
      at: at(3, 4),
      evidenceId: 'e-elif-1',
      supports: ['p-defne', 'p-irem', 'p-can', 'p-selin', 'p-kaan'],
      replies: [
        {
          id: 'r-elif-1',
          personId: 'p-defne',
          text: 'Odak halkaları çok iyi olmuş. Kontrast testlerini CI’a eklemeyi düşünür müsün?',
          at: at(3, 2),
        },
      ],
    },
    {
      id: 'post-zeynep-model',
      personId: 'p-zeynep',
      kind: 'gosteri',
      text: 'turkce-sikayet modeline 8 yeni kategori ekledim, F1 0,87’ye çıktı. Etiketli veri setini de açık lisansla paylaştım.',
      at: at(4, 6),
      supports: ['p-irem', 'p-selin'],
      replies: [],
    },
    {
      id: 'post-mert-tesekkur',
      personId: 'p-mert',
      kind: 'tesekkur',
      text: 'Anka Oyun pilotundaki shader optimizasyonunun ilk ipucunu burada Kaan’dan almıştım. Pilot başarıyla kapandı, teşekkürler.',
      at: at(5, 1),
      supports: ['p-kaan', 'p-can', 'p-elif'],
      replies: [],
    },
    {
      id: 'post-defne-foto',
      personId: 'p-defne',
      kind: 'soru',
      text: 'Kooperatif için ürün fotoğraflarını stüdyo kiralamadan çekmenin yolu var mı? Uygun maliyetli ışık kutusu önerisi olan?',
      at: at(6, 2),
      supports: [],
      replies: [
        {
          id: 'r-defne-1',
          personId: 'p-selin',
          text: 'İki LED panel ve beyaz köpük levhayla kurduğumuz düzen 40 ürünü bir günde çıkardı. Arka plan için mat beyaz karton yeterli.',
          at: at(6),
          helpful: true,
        },
      ],
    },
  ];
}

export function buildSeed(): State {
  return {
    version: STATE_VERSION,
    seededAt: new Date().toISOString(),
    people: people().map(withProgress),
    orgs,
    needs: needs(),
    pilots: pilots(),
    events: events(),
    quests: [],
    posts: posts(),
    peers: peers(),
    demo: {},
  };
}
