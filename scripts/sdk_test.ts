import { Mistral } from '@mistralai/mistralai'
import 'dotenv/config'

async function main() {
  const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! })
  const prompt = `Kamu adalah pembuat soal UTBK/SNBT profesional. Buatkan tepat 3 soal pilihan ganda (4 opsi A/B/C/D) untuk subtes Penalaran Umum (PU) pada ujian UTBK SNBT Indonesia.

Kembalikan HANYA JSON valid dengan format berikut (tanpa markdown, tanpa komentar):
{
  "questions": [
    {
      "text": "teks soal lengkap",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correctAnswer": "A" (hanya hurufnya),
      "explanation": "pembahasan detail"
    }
  ]
}`

  const models = ['mistral-small-latest', 'ministral-8b-latest', 'labs-leanstral-1-5-1', 'ministral-3b-latest']
  for (const model of models) {
    try {
      const started = Date.now()
      const response = await mistral.chat.complete({
        model,
        messages: [{ role: 'user', content: prompt }],
        responseFormat: { type: 'json_object' },
        temperature: 0.7,
        maxTokens: 4096,
      })
      const elapsed = Date.now() - started
      const content = String(response.choices?.[0]?.message?.content ?? '')
      let questions = 0
      try { questions = JSON.parse(content).questions?.length ?? 0 } catch {}
      console.log(`${model}: ${elapsed}ms | questions: ${questions}`)
    } catch (e) {
      console.log(`${model}: ERROR - ${String((e as Error)?.message ?? e).slice(0, 120)}`)
    }
  }
}

main()
