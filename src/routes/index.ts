import { Router } from 'express'
import { streamProgress, generateTryout } from '../controllers/tryout.controller'
import { getTryout, submitTryout, getTryoutResult } from '../controllers/questions.controller'
import { createOrGetUser, getUserTryouts, getSession } from '../controllers/users.controller'
import { googleLogin, register, login } from '../controllers/auth.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Auth
router.post('/auth/register', register)
router.post('/auth/login', login)
router.post('/auth/google', googleLogin)

// User routes
router.post('/users', createOrGetUser)
router.get('/users/:userId/tryouts', getUserTryouts)

// Endpoint lama dengan :userId param (guest support)
router.get('/session/:userId', getSession)

// Endpoint baru pakai auth
import { getMeSession } from '../controllers/users.controller'
router.get('/session', requireAuth, getMeSession)

// SSE stream
router.get('/stream-progress/:userId', streamProgress)

// Tryout generation
router.post('/generate-tryout', generateTryout)

// Tryout operations
router.get('/tryout/:id', getTryout)
router.post('/tryout/:id/submit', submitTryout)
router.get('/tryout/:id/result', getTryoutResult)

export default router
