import type { Availability, ConstraintKind, EvidenceSource, Level, NeedStatus, PilotStatus, Scale, Sector } from './types.ts';

export const SECTOR: Record<Sector, string> = {
  lojistik: 'Lojistik',
  fintek: 'Finansal teknoloji',
  oyun: 'Oyun',
  saglik: 'Sağlık',
  kamu: 'Kamu / şehir',
  uretim: 'Üretim',
  egitim: 'Eğitim',
  eticaret: 'E-ticaret',
};

export const SCALE: Record<Scale, string> = {
  girisim: 'Girişim',
  kobi: 'KOBİ',
  kurumsal: 'Kurumsal',
  kamu: 'Kamu',
};

export const CONSTRAINT: Record<ConstraintKind, string> = {
  butce: 'Bütçe',
  veri: 'Veri',
  mevzuat: 'Mevzuat',
  sure: 'Süre',
  teknoloji: 'Teknoloji',
};

export const AVAILABILITY: Record<Availability, string> = {
  open: 'Pilota açık',
  partial: 'Kısmi müsait',
  closed: 'Şu an kapalı',
};

export const NEED_STATUS: Record<NeedStatus, string> = {
  draft: 'Taslak',
  published: 'Yayında',
  piloting: 'Pilotta',
  closed: 'Kapandı',
};

export const PILOT_STATUS: Record<PilotStatus, string> = {
  active: 'Sürüyor',
  succeeded: 'Başarıyla kapandı',
  failed: 'Gerekçesiyle kapandı',
};

export const SOURCE: Record<EvidenceSource, string> = {
  github: 'GitHub',
  domain: 'Alan adı',
  npm: 'npm paketi',
  store: 'Uygulama mağazası',
  doi: 'Yayın (DOI)',
  behance: 'Behance',
  figma: 'Figma',
  pilot: 'NİRENGİ pilotu',
  endorsement: 'Kurum tasdiki',
  claim: 'Beyan',
};

export interface LevelInfo {
  code: Level;
  name: string;
  short: string;
  weight: number;
  blurb: string;
}

/** Weight caps how much an unverified claim can ever contribute to a match. */
export const LEVELS: Record<Level, LevelInfo> = {
  S1: {
    code: 'S1',
    name: 'Beyan',
    short: 'Kişinin kendi ifadesi',
    weight: 0.3,
    blurb: 'Kişinin kendi ifadesi. Görünür ama eşleşme skorunda ağırlığı düşüktür.',
  },
  S2: {
    code: 'S2',
    name: 'Makine doğrulaması',
    short: 'Otomatik, insan yorumu yok',
    weight: 0.8,
    blurb: 'GitHub hesap sahipliği, DNS TXT ile alan adı, paket yayıncılığı, mağaza hesabı, DOI. Tartışmasız ve otomatik.',
  },
  S3: {
    code: 'S3',
    name: 'Kurum tasdiki',
    short: 'Kurumsal kimlikle imzalı',
    weight: 1,
    blurb: 'Birlikte çalışılan kurumun belirli bir iddiayı imzalaması. Zaman damgalı, kaynağı belli, geri alınabilir.',
  },
};
