import { Request, Response } from 'express'
import { sseClients } from '../lib/constants'
import { generateTryoutInBackground } from '../services/mistral.service'

export const streamProgress = (req: Request, res: Response): void => {
  const userId = req.params['userId'] as string

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*')
  res.flushHeaders()

  res.write(`data: ${JSON.stringify({ progress: 0, status: 'Menghubungkan...' })}\n\n`)

  sseClients.set(userId, { res, done: false })

  const keepAlive = setInterval(() => {
    const client = sseClients.get(userId)
    if (!client || client.done) {
      clearInterval(keepAlive)
      return
    }
    try {
      res.write(': keepalive\n\n')
    } catch {
      clearInterval(keepAlive)
      sseClients.delete(userId)
    }
  }, 15000)

  req.on('close', () => {
    clearInterval(keepAlive)
    sseClients.delete(userId)
  })
}

export const generateTryout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body as { userId: string }
    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' })
      return
    }

    generateTryoutInBackground(userId).catch((err) =>
      console.error('Background generation error:', err)
    )

    res.json({ success: true, message: 'Generation started. Listen to SSE for progress.' })
  } catch (error) {
    console.error('Generate tryout error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
