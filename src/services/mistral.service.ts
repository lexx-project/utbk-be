import { Mistral } from '@mistralai/mistralai'
import { Prisma } from '@prisma/client'
import { BLUEPRINTS, delay, SUBTESTS, sseClients } from '../lib/constants'
import { QuestionData, MistralQuestionBatch } from '../types'
import { prisma } from '../lib/prisma'

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })

const BATCH_SIZE = 3 // Questions per Mistral request
const REQUEST_DELAY_MS = 1500 // 1.5s delay between requests (1 RPS limit)

function sendSSEProgress(userId: string, progress: number, status: string, extra?: Record<string, unknown>) {
  const client = sseClients.get(userId)
  if (client && !client.done) {
    const data = JSON.stringify({ progress, status, ...extra })
    try {
      client.res.write(`data: ${data}\n\n`)
    } catch {
      // Client disconnected
      sseClients.delete(userId)
    }
  }
}

function sendSSEDone(userId: string, tryoutId: string) {
  const client = sseClients.get(userId)
  if (client && !client.done) {
    const data = JSON.stringify({ event: 'done', tryoutId, progress: 100, status: 'Tryout berhasil dibuat!' })
    try {
      client.res.write(`data: ${data}\n\n`)
      client.res.end()
      client.done = true
    } catch {
      // ignore
    }
  }
}

function sendSSEError(userId: string, message: string) {
  const client = sseClients.get(userId)
  if (client && !client.done) {
    const data = JSON.stringify({ event: 'error', progress: 0, status: message })
    try {
      client.res.write(`data: ${data}\n\n`)
      client.res.end()
      client.done = true
    } catch {
      // ignore
    }
  }
}

async function generateBatch(
  subject: string,
  subjectName: string,
  type: string,
  count: number,
  specificInstruction: string,
  retryCount: number = 0,
  previousError: string = ''
): Promise<MistralQuestionBatch> {
  if (retryCount > 3) {
    throw new Error(`Gagal generate batch untuk ${subjectName} setelah 3 kali percobaan perbaikan.`)
  }

  const typeLabel = type === 'MULTIPLE_CHOICE' ? 'pilihan ganda (4 opsi A/B/C/D)' : 'isian singkat'
  const optionsInstruction =
    type === 'MULTIPLE_CHOICE'
      ? `"options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correctAnswer": "A" (hanya hurufnya)`
      : `"options": null, "correctAnswer": "jawaban singkat"`

  let prompt = `Kamu adalah pembuat soal UTBK/SNBT profesional.

INSTRUKSI SPESIFIK BATCH INI:
${specificInstruction}

Buatkan tepat ${count} soal ${typeLabel} untuk subtes ${subjectName} (${subject}) pada ujian UTBK SNBT Indonesia.

ATURAN KETAT MATEMATIKA & LOGIKA:
Jika ini soal hitungan, kamu WAJIB menghitung hasil akhirnya secara akurat. Jawaban yang benar WAJIB terdapat di dalam pilihan (options). DILARANG membuat soal yang opsinya tidak memiliki jawaban yang benar.

Kembalikan HANYA JSON valid dengan format berikut (tanpa markdown, tanpa komentar):
{
  "questions": [
    {
      "text": "teks soal lengkap (bisa termasuk bacaan/stimulus jika diperlukan)",
      "step_by_step_calculation": "Tuliskan langkah-langkah perhitungan matematika atau analisis logikanya di sini SEBELUM menentukan opsi",
      ${optionsInstruction},
      "explanation": "pembahasan akhir yang dirangkum untuk user (tidak boleh mengandung kalimat ragu-ragu atau menyebut soal ini salah)"
    }
  ]
}

Pastikan:
- Soal sesuai tingkat kesulitan UTBK SNBT
- Soal HANYA membahas topik yang tertera pada INSTRUKSI SPESIFIK BATCH INI
- Bahasa Indonesia yang baik dan benar
- Pembahasan jelas dan edukatif`

  // ==========================================
  // SELF-HEALING: Injeksi error sebelumnya ke prompt
  // ==========================================
  if (previousError) {
    prompt += `\n\nPERINGATAN PENTING: Pada percobaan sebelumnya, output kamu gagal divalidasi karena error berikut:\n"${previousError}"\nTolong JANGAN ulangi kesalahan tersebut. Perbaiki format JSON dan pastikan jumlah soal tepat ${count}.`
  }

  const response = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: prompt }],
    responseFormat: { type: 'json_object' },
    temperature: 0.7,
    maxTokens: 4096,
  })

  const content = response.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    return generateBatch(subject, subjectName, type, count, specificInstruction, retryCount + 1, 'Response dari API kosong atau bukan string.')
  }

  try {
    const parsed = JSON.parse(content) as MistralQuestionBatch

    // ==========================================
    // THE JUDGE: Validasi ketat sebelum return
    // ==========================================
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("JSON tidak memiliki root array bernama 'questions'.")
    }
    if (parsed.questions.length !== count) {
      throw new Error(`Jumlah soal tidak sesuai. Diminta ${count} soal, tapi kamu memberikan ${parsed.questions.length} soal.`)
    }

    parsed.questions.forEach((q, idx) => {
      if (!q.text) throw new Error(`Soal index ke-${idx} tidak memiliki 'text'.`)
      if (!q.explanation) throw new Error(`Soal index ke-${idx} tidak memiliki 'explanation'.`)

      // --- 1. DETEKSI PENGAKUAN DOSA (HALUSINASI MATEMATIKA) ---
      const explanationLower = q.explanation.toLowerCase()
      const calcLower = (q as any).step_by_step_calculation?.toLowerCase() || ''
      const combinedCheck = explanationLower + " " + calcLower

      const forbiddenPhrases = [
        "opsi tidak tersedia", "kesalahan dalam soal", "soal perlu direvisi",
        "tidak tepat", "mohon perbaikan", "seharusnya", "direvisi",
        "tidak konsisten", "tidak masuk akal", "tidak ada pilihan yang tepat",
        "perhitungan yang benar adalah", "asumsi soal berbeda"
      ]

      for (const phrase of forbiddenPhrases) {
        if (combinedCheck.includes(phrase)) {
          throw new Error(`AI meragukan hitungannya sendiri (ditemukan kata: "${phrase}"). Buat ulang soal dengan angka yang konsisten dan opsi yang valid.`)
        }
      }
      // --------------------------------------------------------

      if (type === 'MULTIPLE_CHOICE') {
        if (!q.options || q.options.length !== 4) {
          throw new Error(`Soal index ke-${idx} ('${q.text.substring(0, 20)}...') harus memiliki tepat 4 opsi array.`)
        }
        if (!q.correctAnswer) throw new Error(`Soal index ke-${idx} tidak memiliki 'correctAnswer'.`)

        // --- 2. PASTIKAN KUNCI JAWABAN ADA DI ARRAY OPTIONS ---
        const answerExists = q.options.some((opt: string) => opt.startsWith(q.correctAnswer + "."))
        if (!answerExists) {
          throw new Error(`Kunci jawaban "${q.correctAnswer}" ternyata tidak ditemukan di dalam pilihan ganda soal index ke-${idx}.`)
        }
      }
    })

    return parsed
  } catch (error: any) {
    console.warn(`[Batch Error - Retry ${retryCount + 1}/3] ${error.message}`)
    return generateBatch(subject, subjectName, type, count, specificInstruction, retryCount + 1, error.message)
  }
}

export async function generateTryoutInBackground(userId: string): Promise<void> {
  try {
    // Find or create user (demo: use userId as both id and name)
    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      user = await prisma.user.create({
        data: { id: userId, name: `User ${userId.slice(0, 8)}`, email: `${userId}@demo.utbk.id` },
      })
    }

    sendSSEProgress(userId, 2, 'Menyiapkan soal...')

    const allQuestions: QuestionData[] = []
    let totalGenerated = 0
    const totalQuestions = SUBTESTS.reduce((acc, s) => acc + s.questionCount, 0)
    let requestCount = 0

    for (const subtest of SUBTESTS) {
      const blueprints = BLUEPRINTS[subtest.subject] ?? []

      for (const typeSpec of subtest.types) {
        const { type, count } = typeSpec
        let remaining = count
        let batchIdx = 0

        while (remaining > 0) {
          const batchCount = Math.min(BATCH_SIZE, remaining)

          const progressPct = Math.floor((totalGenerated / totalQuestions) * 90) + 5
          sendSSEProgress(
            userId,
            progressPct,
            `Membuat soal ${subtest.name} - ${type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Isian Singkat'} (${totalGenerated}/${totalQuestions})...`
          )

          if (requestCount > 0) {
            await delay(REQUEST_DELAY_MS)
          }

          const specificInstruction =
            batchIdx < blueprints.length
              ? blueprints[batchIdx]
              : `Buat soal dengan topik lanjutan acak yang relevan dengan subtes ${subtest.name}.`

          // generateBatch sudah self-healing: kalau throw, berarti gagal total setelah 3 retry
          try {
            const batch = await generateBatch(subtest.subject, subtest.name, type, batchCount, specificInstruction)

            batch.questions.slice(0, batchCount).forEach((q) => {
              allQuestions.push({
                subject: subtest.subject,
                type,
                text: q.text,
                options: q.options ?? undefined,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                orderIndex: allQuestions.length,
              })
              totalGenerated++
            })
          } catch (err) {
            console.error(`Error generating batch for ${subtest.subject}:`, err)
            sendSSEError(userId, `Gagal generate soal ${subtest.name} setelah beberapa percobaan. Silakan coba lagi.`)
            return
          }

          requestCount++
          remaining -= batchCount
          batchIdx++
        }
      }
    }

    // Save tryout + questions atomically — no DB records if this fails
    sendSSEProgress(userId, 95, 'Menyimpan soal ke database...')
    const result = await prisma.$transaction(async (tx) => {
      const tryout = await tx.tryout.create({ data: { userId: user.id } })
      await tx.question.createMany({
        data: allQuestions.map((q) => ({
          tryoutId: tryout.id,
          subject: q.subject,
          type: q.type,
          text: q.text,
          options: (q.options ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          orderIndex: q.orderIndex,
        })),
      })
      return tryout.id
    })

    sendSSEDone(userId, result)
  } catch (err) {
    console.error('Fatal error in generateTryoutInBackground:', err)
    sendSSEError(userId, 'Terjadi kesalahan internal. Silakan coba lagi.')
  }
}

export async function gradeShortAnswers(
  answers: Array<{ questionId: string; userAnswer: string; correctAnswer: string; question: string }>
): Promise<Record<string, boolean>> {
  if (answers.length === 0) return {}

  const prompt = `Kamu adalah penilai jawaban isian singkat untuk soal UTBK SNBT. Evaluasi apakah jawaban siswa benar berdasarkan makna dan konteks, bukan hanya kecocokan teks persis.

Soal dan jawaban yang perlu dinilai:
${JSON.stringify(
  answers.map((a) => ({
    id: a.questionId,
    soal: a.question,
    kunciJawaban: a.correctAnswer,
    jawabanSiswa: a.userAnswer,
  })),
  null,
  2
)}

Kembalikan HANYA JSON valid (tanpa markdown):
{
  "results": [
    { "id": "questionId", "isCorrect": true/false }
  ]
}`

  const response = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: prompt }],
    responseFormat: { type: 'json_object' },
    temperature: 0,
  })

  const content = response.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    // Default all to false if API fails
    return answers.reduce(
      (acc, a) => ({ ...acc, [a.questionId]: false }),
      {} as Record<string, boolean>
    )
  }

  const parsed = JSON.parse(content) as { results: Array<{ id: string; isCorrect: boolean }> }
  return parsed.results.reduce(
    (acc, r) => ({ ...acc, [r.id]: r.isCorrect }),
    {} as Record<string, boolean>
  )
}
