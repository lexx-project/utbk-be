// UTBK Subtest definitions with question distribution
export const SUBTESTS = [
  {
    subject: 'PU',
    name: 'Penalaran Umum',
    description: 'Penalaran Umum',
    questionCount: 30,
    types: [
      { type: 'MULTIPLE_CHOICE', count: 20 },
      { type: 'SHORT_ANSWER', count: 10 },
    ],
  },
  {
    subject: 'PK',
    name: 'Pengetahuan dan Pemahaman Umum',
    description: 'Pengetahuan dan Pemahaman Umum',
    questionCount: 20,
    types: [{ type: 'MULTIPLE_CHOICE', count: 20 }],
  },
  {
    subject: 'PM',
    name: 'Pemahaman Bacaan dan Menulis',
    description: 'Pemahaman Bacaan dan Menulis',
    questionCount: 20,
    types: [{ type: 'MULTIPLE_CHOICE', count: 20 }],
  },
  {
    subject: 'PENG',
    name: 'Pengetahuan Kuantitatif',
    description: 'Pengetahuan Kuantitatif',
    questionCount: 20,
    types: [{ type: 'MULTIPLE_CHOICE', count: 20 }],
  },
  {
    subject: 'LB',
    name: 'Literasi dalam Bahasa Indonesia',
    description: 'Literasi Bahasa Indonesia',
    questionCount: 30,
    types: [{ type: 'MULTIPLE_CHOICE', count: 30 }],
  },
  {
    subject: 'LBI',
    name: 'Literasi dalam Bahasa Inggris',
    description: 'Literasi Bahasa Inggris',
    questionCount: 20,
    types: [{ type: 'MULTIPLE_CHOICE', count: 20 }],
  },
  {
    subject: 'PM2',
    name: 'Penalaran Matematika',
    description: 'Penalaran Matematika',
    questionCount: 15,
    types: [
      { type: 'MULTIPLE_CHOICE', count: 10 },
      { type: 'SHORT_ANSWER', count: 5 },
    ],
  },
] as const

export const TOTAL_QUESTIONS = SUBTESTS.reduce((acc, s) => acc + s.questionCount, 0)

// ==========================================
// CONTENT BLUEPRINTS: 1 Batch 1 Specific Prompt
// ==========================================
export const BLUEPRINTS: Record<string, string[]> = {
  PU: [
    'Penalaran Umum (Pilihan Ganda): Teks argumen logis — silogisme, modus ponens, dan modus tollens.',
    'Penalaran Umum (Pilihan Ganda): Analisis data deduktif dari paragraf rumpang dengan informasi tersirat.',
    'Penalaran Umum (Pilihan Ganda): Soal urutan logis: posisi tempat duduk, antrean, atau penempatan orang.',
    'Penalaran Umum (Pilihan Ganda): Pola deret angka/alphabet dan logika penyelesaiannya.',
    'Penalaran Umum (Pilihan Ganda): Penalaran analogi: menemukan hubungan sebab-akibat dalam pernyataan.',
    'Penalaran Umum (Pilihan Ganda): Evaluasi kesimpulan dari sebuah premis/kutipan berita.',
    'Penalaran Umum (Isian Singkat): Soal penalaran numerik singkat: menyelesaikan pola bilangan atau hitungan logis.',
    'Penalaran Umum (Isian Singkat): Soal penalaran verbal ringkas: sinonim, antonim, atau makna kata dalam konteks.',
    'Penalaran Umum (Isian Singkat): Analisis tabel/grafik sederhana dan ambil kesimpulan kuantitatif.',
    'Penalaran Umum (Isian Singkat): Soal logika kondisional: if-then dalam skenario sehari-hari.',
  ],
  PK: [
    'Pengetahuan Umum (Pilihan Ganda): Fakta dasar ilmu pengetahuan alam: biologi, fisika, kimia.',
    'Pengetahuan Umum (Pilihan Ganda): Pengetahuan sosial: sejarah Indonesia, geografi, dan ekonomi dasar.',
    'Pengetahuan Umum (Pilihan Ganda): Kemampuan menganalisis grafik atau data statistik sederhana.',
    'Pengetahuan Umum (Pilihan Ganda): Konsep dasar teknologi dan informasi terkini.',
    'Pengetahuan Umum (Pilihan Ganda): Pengetahuan umum tentang budaya, seni, dan lingkungan hidup.',
    'Pengetahuan Umum (Pilihan Ganda): Soal pemahaman konsep sains dalam kehidupan sehari-hari.',
    'Pengetahuan Umum (Pilihan Ganda): Analisis kasus sosial-ekonomi berdasarkan data atau paragraf singkat.',
  ],
  PM: [
    'Pemahaman Bacaan dan Menulis (Pilihan Ganda): Identifikasi ide pokok dan gagasan utama dari teks eksposisi.',
    'Pemahaman Bacaan dan Menulis (Pilihan Ganda): Menentukan simpulan yang logis dari argumen dalam teks.',
    'Pemahaman Bacaan dan Menulis (Pilihan Ganda): Menemukan makna kata/frasa berdasarkan konteks bacaan.',
    'Pemahaman Bacaan dan Menulis (Pilihan Ganda): Analisis struktur teks: kalimat utama, penjelas, dan penegas.',
    'Pemahaman Bacaan dan Menulis (Pilihan Ganda): Menyimpulkan informasi tersirat dari paragraf naratif.',
    'Pemahaman Bacaan dan Menulis (Pilihan Ganda): Evaluasi kekuatan argumentasi dalam sebuah editorial.',
    'Pemahaman Bacaan dan Menulis (Pilihan Ganda): Soal menyusun kalimat efektif dan penggunaan tanda baca yang tepat.',
  ],
  PENG: [
    'Pengetahuan Kuantitatif (Pilihan Ganda): Aljabar — sistem persamaan linear dua variabel dengan konteks jual-beli.',
    'Pengetahuan Kuantitatif (Pilihan Ganda): Geometri — luas bangun datar gabungan (persegi, segitiga, lingkaran).',
    'Pengetahuan Kuantitatif (Pilihan Ganda): Peluang dan kombinatorika tingkat menengah.',
    'Pengetahuan Kuantitatif (Pilihan Ganda): Aritmetika — persentase, untung-rugi, dan bunga berbunga.',
    'Pengetahuan Kuantitatif (Pilihan Ganda): Statistika dasar: mean, median, modus dari data kelompok.',
    'Pengetahuan Kuantitatif (Pilihan Ganda): Barisan dan deret: aritmetika dan geometri.',
    'Pengetahuan Kuantitatif (Pilihan Ganda): Soal perbandingan dan skala dalam konteks nyata.',
  ],
  LB: [
    'Literasi Bahasa Indonesia (Pilihan Ganda): Menganalisis teks eksposisi: mencari fakta dan opini.',
    'Literasi Bahasa Indonesia (Pilihan Ganda): Memahami struktur dan fungsi teks argumentatif.',
    'Literasi Bahasa Indonesia (Pilihan Ganda): Menentukan cara penyajian ide: definisi, klasifikasi, dan prosedur.',
    'Literasi Bahasa Indonesia (Pilihan Ganda): Menganalisis pengaruh bahasa dalam iklan atau teks persuasif.',
    'Literasi Bahasa Indonesia (Pilihan Ganda): Memahami teks sastra: unsur intrinsik cerpen atau puisi.',
    'Literasi Bahasa Indonesia (Pilihan Ganda): Menafsirkan data dari tabel, grafik, atau diagram dalam teks informasional.',
    'Literasi Bahasa Indonesia (Pilihan Ganda): Mengidentifikasi simpulan logis dari teks berita.',
    'Literasi Bahasa Indonesia (Pilihan Ganda): Menemukan kalimat efektif dan tidak efektif dalam paragraf.',
    'Literasi Bahasa Indonesia (Pilihan Ganda): Memahami ragam bahasa: formal vs informal dalam konteks komunikasi.',
    'Literasi Bahasa Indonesia (Pilihan Ganda): Soal sintesis informasi dari dua teks atau paragraf berbeda.',
  ],
  LBI: [
    'Literasi Bahasa Inggris (Pilihan Ganda): Reading comprehension — main idea dari teks deskriptif.',
    'Literasi Bahasa Inggris (Pilihan Ganda): Vocabulary in context — menentukan makna kata dari paragraf.',
    'Literasi Bahasa Inggris (Pilihan Ganda): Inference — menarik kesimpulan tersirat dari teks naratif.',
    'Literasi Bahasa Inggris (Pilihan Ganda): Grammar: tenses (past, present, future) dalam kalimat.',
    'Literasi Bahasa Inggris (Pilihan Ganda): Text structure: identifying topic sentences and supporting details.',
    'Literasi Bahasa Inggris (Pilihan Ganda): Soal menyusun kalimat efektif (word order dan parallelism).',
    'Literasi Bahasa Inggris (Pilihan Ganda): Analisis teks argumentatif: finding the author\'s purpose.',
  ],
  PM2: [
    'Penalaran Matematika (Pilihan Ganda): Logika matematika — pola bilangan dan penalaran kombinatorial.',
    'Penalaran Matematika (Pilihan Ganda): Aljabar lanjutan — fungsi kuadrat dan grafiknya.',
    'Penalaran Matematika (Pilihan Ganda): Geometri analitik — jarak, titik berat, dan koordinat kartesius.',
    'Penalaran Matematika (Pilihan Ganda): Kalkulus dasar — konsep limit dan turunan dalam konteks.',
    'Penalaran Matematika (Isian Singkat): Soal penyelesaian persamaan non-linear secara analitis.',
    'Penalaran Matematika (Isian Singkat): Soal statistika lanjutan: standar deviasi dan variansi data.',
  ],
}

// Delay helper for rate limiting (Mistral Free Tier: 1 RPS)
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

// SSE clients store
export const sseClients: Map<string, { res: import('express').Response; done: boolean }> =
  new Map()
