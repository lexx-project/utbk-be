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

// Delay helper for rate limiting (Mistral Free Tier: 1 RPS)
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

// SSE clients store
export const sseClients: Map<string, { res: import('express').Response; done: boolean }> =
  new Map()
