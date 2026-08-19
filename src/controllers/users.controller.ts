import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const createOrGetUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, picture } = req.body as { name: string; email: string; picture?: string }

    if (!name || !email) {
      res.status(400).json({ success: false, error: 'name and email are required' })
      return
    }

    const user = await prisma.user.upsert({
      where: { email },
      create: { name, email, picture },
      update: { name, picture },
    })

    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const getUserTryouts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params['userId'] as string

    const tryouts = await prisma.tryout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        scoreTotal: true,
        createdAt: true,
        _count: { select: { questions: true } },
      },
    })

    res.json({ success: true, data: tryouts })
  } catch (error) {
    console.error('Get user tryouts error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

// Auto-creates guest user if not exists, returns user + tryout history.
// Used by dashboard so no account registration is required.
export const getSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params['userId'] as string
    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' })
      return
    }

    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: `Guest ${userId.slice(0, 6)}`,
          email: `${userId}@guest.utbk.id`,
        },
      })
    }

    const tryouts = await prisma.tryout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { questions: true, userAnswers: true } },
      },
    })

    res.json({ success: true, data: { user, tryouts } })
  } catch (error) {
    console.error('Get session error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

import { AuthRequest } from '../middleware/auth'

export const getMeSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
        createdAt: true,
      },
    })
    
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    const tryouts = await prisma.tryout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { questions: true, userAnswers: true } },
      },
    })

    res.json({ success: true, data: { user, tryouts } })
  } catch (error) {
    console.error('Get me session error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
