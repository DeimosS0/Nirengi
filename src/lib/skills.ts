// Canonical skill vocabulary. Needs and evidence both speak these keys, so a
// match is a set comparison rather than fuzzy keyword overlap.

export interface SkillDef {
  label: string;
  aliases: string[];
}

export const SKILLS: Record<string, SkillDef> = {
  go: { label: 'Go', aliases: ['go', 'golang'] },
  rust: { label: 'Rust', aliases: ['rust', 'cargo'] },
  python: { label: 'Python', aliases: ['python', 'pandas', 'fastapi', 'django'] },
  typescript: { label: 'TypeScript', aliases: ['typescript', 'ts', 'javascript', 'js'] },
  react: { label: 'React', aliases: ['react', 'next.js', 'nextjs', 'frontend', 'ön yüz', 'web arayüz', 'web panel', 'web uygulama'] },
  node: { label: 'Node.js', aliases: ['node', 'node.js', 'nodejs', 'express'] },
  flutter: { label: 'Flutter', aliases: ['flutter', 'dart', 'mobil uygulama'] },
  kotlin: { label: 'Kotlin / Android', aliases: ['kotlin', 'android'] },
  cpp: { label: 'C++', aliases: ['c++', 'cpp', 'qt'] },
  unity: { label: 'Unity', aliases: ['unity', 'unity3d', 'c#', 'oyun motoru'] },
  shader: { label: 'Shader / GPU', aliases: ['shader', 'hlsl', 'glsl', 'urp', 'gpu', 'shader graph'] },
  nlp: { label: 'Türkçe NLP', aliases: ['nlp', 'doğal dil', 'dil işleme', 'metin sınıflandırma', 'duygu analizi', 'şikâyet', 'şikayet'] },
  ml: { label: 'Makine öğrenmesi', aliases: ['makine öğrenmesi', 'ml', 'pytorch', 'tensorflow', 'model', 'yapay zeka', 'yapay zekâ'] },
  data: { label: 'Veri analizi', aliases: ['veri analizi', 'sql', 'analitik', 'dashboard', 'raporlama'] },
  postgres: { label: 'PostgreSQL', aliases: ['postgres', 'postgresql', 'veritabanı'] },
  distributed: { label: 'Dağıtık sistemler', aliases: ['dağıtık', 'yüksek trafik', 'ölçeklen', 'cache', 'önbellek', 'dosya dağıtım', 'cdn', 'kuyruk'] },
  devops: { label: 'DevOps', aliases: ['kubernetes', 'docker', 'devops', 'ci/cd', 'k8s'] },
  api: { label: 'API tasarımı', aliases: ['api', 'rest', 'grpc', 'openapi', 'entegrasyon'] },
  realtime: { label: 'Gerçek zamanlı', aliases: ['websocket', 'gerçek zamanlı', 'canlı', 'anlık', 'mqtt'] },
  maps: { label: 'Harita / CBS', aliases: ['harita', 'leaflet', 'mapbox', 'gis', 'cbs', 'konum', 'gps'] },
  iot: { label: 'IoT / gömülü', aliases: ['iot', 'sensör', 'esp32', 'gömülü', 'arduino', 'lora'] },
  optimization: { label: 'Optimizasyon', aliases: ['optimizasyon', 'rota', 'vrp', 'algoritma', 'çizelgeleme'] },
  perf: { label: 'Performans', aliases: ['performans', 'fps', 'hız', 'gecikme', 'lighthouse'] },
  uiux: { label: 'UI/UX tasarımı', aliases: ['ui', 'ux', 'arayüz tasarım', 'kullanıcı deneyimi', 'tasarım sistemi'] },
  figma: { label: 'Figma', aliases: ['figma', 'prototip'] },
  a11y: { label: 'Erişilebilirlik', aliases: ['erişilebilirlik', 'wcag', 'a11y', 'ekran okuyucu'] },
  brand: { label: 'Marka kimliği', aliases: ['marka', 'logo', 'kimlik tasarımı', 'ambalaj'] },
  visual: { label: 'Görsel üretim', aliases: ['fotoğraf', 'illüstrasyon', '3d', 'render', 'görsel'] },
  docs: { label: 'Teknik yazım', aliases: ['dokümantasyon', 'teknik yazım', 'kılavuz', 'readme'] },
  product: { label: 'Ürün yönetimi', aliases: ['ürün yönetimi', 'yol haritası', 'pm', 'kullanıcı araştırması'] },
};

export const skillLabel = (key: string) => SKILLS[key]?.label ?? key;

/** Turkish-aware lowercase + whitespace collapse. */
export const norm = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();

/** Extract canonical skill keys mentioned anywhere in free text. */
export function skillsInText(text: string): string[] {
  const t = ` ${norm(text)} `;
  const found: string[] = [];
  for (const [key, def] of Object.entries(SKILLS)) {
    const hit = def.aliases.some((a) => {
      const alias = norm(a);
      // Short aliases (go, ts, ml, ui…) must stand alone to avoid false hits.
      if (alias.length <= 3) return new RegExp(`[^a-zçğıöşü0-9]${escape(alias)}[^a-zçğıöşü0-9]`).test(t);
      return t.includes(alias);
    });
    if (hit) found.push(key);
  }
  return found;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** GitHub primary language → skill keys. */
export const LANGUAGE_SKILLS: Record<string, string[]> = {
  Go: ['go'],
  Rust: ['rust'],
  Python: ['python'],
  TypeScript: ['typescript'],
  JavaScript: ['typescript'],
  Dart: ['flutter'],
  Kotlin: ['kotlin'],
  Java: ['kotlin'],
  'C++': ['cpp'],
  C: ['cpp', 'iot'],
  'C#': ['unity'],
  ShaderLab: ['shader'],
  HLSL: ['shader'],
  GLSL: ['shader'],
  QML: ['cpp', 'uiux'],
  Astro: ['react', 'typescript'],
  Vue: ['react', 'typescript'],
  Svelte: ['react', 'typescript'],
  Jupyter: ['python', 'data'],
  'Jupyter Notebook': ['python', 'data'],
  Swift: ['flutter'],
  HTML: ['react'],
  CSS: ['uiux'],
  Shell: ['devops'],
  Dockerfile: ['devops'],
};
