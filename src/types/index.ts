export interface QuestionData {
  subject: string
  type: string
  text: string
  options?: string[]
  correctAnswer: string
  explanation: string
  orderIndex: number
}

export interface MistralQuestionBatch {
  questions: Array<{
    text: string
    step_by_step_calculation?: string
    options?: string[]
    correctAnswer: string
    explanation: string
  }>
}

export interface SubmitAnswerPayload {
  answers: Array<{
    questionId: string
    userAnswer: string
  }>
}

export interface SSEProgressData {
  progress: number
  status: string
  tryoutId?: string
  event?: 'progress' | 'done' | 'error'
}
