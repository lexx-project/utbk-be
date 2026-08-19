import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { gradeShortAnswers } from '../services/mistral.service'
import { SubmitAnswerPayload } from '../types'

type PrismaQuestion = {
  id: string
  tryoutId: string
  subject: string
  type: string
  text: string
  options: Prisma.JsonValue
  correctAnswer: string
  explanation: string
  orderIndex: number
}

export const getTryout = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string
    const tryout = await prisma.tryout.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!tryout) {
      res.status(404).json({ success: false, error: 'Tryout not found' })
      return
    }

    res.json({ success: true, data: tryout })
  } catch (error) {
    console.error('Get tryout error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const submitTryout = async (req: Request, res: Response): Promise<void> => {
  try {
    const tryoutId = req.params['id'] as string
    const { answers } = req.body as SubmitAnswerPayload

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ success: false, error: 'answers array is required' })
      return
    }

    const questions = await prisma.question.findMany({ where: { tryoutId } })
    const questionMap = new Map(questions.map((q) => [q.id, q]))

    const multipleChoiceResults: Array<{ questionId: string; userAnswer: string; isCorrect: boolean }> = []
    const shortAnswerInputs: Array<{
      questionId: string
      userAnswer: string
      correctAnswer: string
      question: string
    }> = []

    for (const answer of answers) {
      const question = questionMap.get(answer.questionId)
      if (!question) continue

      if (question.type === 'MULTIPLE_CHOICE') {
        const isCorrect =
          answer.userAnswer.trim().toUpperCase() === question.correctAnswer.trim().toUpperCase()
        multipleChoiceResults.push({ questionId: answer.questionId, userAnswer: answer.userAnswer, isCorrect })
      } else if (question.type === 'SHORT_ANSWER') {
        shortAnswerInputs.push({
          questionId: answer.questionId,
          userAnswer: answer.userAnswer,
          correctAnswer: question.correctAnswer,
          question: question.text,
        })
      }
    }

    let shortAnswerResults: Record<string, boolean> = {}
    if (shortAnswerInputs.length > 0) {
      shortAnswerResults = await gradeShortAnswers(shortAnswerInputs)
    }

    const allResults = [
      ...multipleChoiceResults,
      ...shortAnswerInputs.map((sa) => ({
        questionId: sa.questionId,
        userAnswer: sa.userAnswer,
        isCorrect: shortAnswerResults[sa.questionId] ?? false,
      })),
    ]

    await Promise.all(
      allResults.map((result) =>
        prisma.userAnswer.upsert({
          where: { tryoutId_questionId: { tryoutId, questionId: result.questionId } },
          create: { tryoutId, questionId: result.questionId, userAnswer: result.userAnswer, isCorrect: result.isCorrect },
          update: { userAnswer: result.userAnswer, isCorrect: result.isCorrect },
        })
      )
    )

    const subjectScores: Record<string, { correct: number; total: number }> = {}
    for (const result of allResults) {
      const question = questionMap.get(result.questionId)
      if (!question) continue
      if (!subjectScores[question.subject]) subjectScores[question.subject] = { correct: 0, total: 0 }
      subjectScores[question.subject].total++
      if (result.isCorrect) subjectScores[question.subject].correct++
    }

    const totalCorrect = allResults.filter((r) => r.isCorrect).length
    const totalAnswered = allResults.length
    const scoreTotal = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 1000) / 10 : 0

    await prisma.tryout.update({ where: { id: tryoutId }, data: { scoreTotal } })

    res.json({ success: true, data: { tryoutId, scoreTotal, totalCorrect, totalAnswered, subjectScores } })
  } catch (error) {
    console.error('Submit tryout error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const getTryoutResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const tryoutId = req.params['id'] as string

    const tryout = await prisma.tryout.findUnique({
      where: { id: tryoutId },
      include: {
        user: { select: { id: true, name: true } },
        questions: { orderBy: { orderIndex: 'asc' } },
        userAnswers: true,
      },
    })

    if (!tryout) {
      res.status(404).json({ success: false, error: 'Tryout not found' })
      return
    }

    const answerMap = new Map(tryout.userAnswers.map((a) => [a.questionId, a]))

    const questionsWithAnswers = tryout.questions.map((q) => {
      const userAnswer = answerMap.get(q.id)
      return {
        ...q,
        userAnswer: userAnswer?.userAnswer ?? null,
        isCorrect: userAnswer?.isCorrect ?? null,
      }
    })

    const subjectBreakdown: Record<string, { correct: number; total: number; score: number }> = {}
    for (const q of questionsWithAnswers) {
      if (!subjectBreakdown[q.subject]) subjectBreakdown[q.subject] = { correct: 0, total: 0, score: 0 }
      subjectBreakdown[q.subject].total++
      if (q.isCorrect) subjectBreakdown[q.subject].correct++
    }

    for (const subject of Object.keys(subjectBreakdown)) {
      const { correct, total } = subjectBreakdown[subject]
      subjectBreakdown[subject].score = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0
    }

    res.json({
      success: true,
      data: {
        tryout: { id: tryout.id, scoreTotal: tryout.scoreTotal, createdAt: tryout.createdAt, user: tryout.user },
        questions: questionsWithAnswers,
        subjectBreakdown,
      },
    })
  } catch (error) {
    console.error('Get tryout result error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
