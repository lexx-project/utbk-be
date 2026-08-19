import { Request, Response } from 'express'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// --- EMAIL/PASSWORD AUTHENTICATION ---

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Nama, email, dan password wajib diisi.' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password minimal 6 karakter.' })
      return
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email sudah terdaftar.' })
      return
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Berikan JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      data: {
        token: jwtToken,
        user: { id: user.id, name: user.name, email: user.email },
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, error: 'Pendaftaran gagal karena kesalahan server.' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email dan password wajib diisi.' })
      return
    }

    // Cari user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(401).json({ success: false, error: 'Email atau password salah.' })
      return
    }

    // Cek apakah user mendaftar lewat Google tanpa set password sebelumnya
    if (!user.password) {
      res.status(401).json({ success: false, error: 'Akun ini terdaftar via Google. Silakan login menggunakan opsi Google.' })
      return
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Email atau password salah.' })
      return
    }

    // Berikan JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      data: {
        token: jwtToken,
        user: { id: user.id, name: user.name, email: user.email },
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: 'Login gagal karena kesalahan server.' })
  }
}

// --- GOOGLE OAUTH ---

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body as { token: string }
    if (!token) {
      res.status(400).json({ success: false, error: 'Token is required' })
      return
    }

    // 1. Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    
    const payload = ticket.getPayload()
    console.log('--- GOOGLE LOGIN PAYLOAD ---', payload)
    if (!payload || !payload.email) {
      res.status(400).json({ success: false, error: 'Invalid Google token payload' })
      return
    }

    const email = payload.email
    const name = payload.name || 'User'
    const picture = payload.picture || null

    // 2. Upsert user in database
    const user = await prisma.user.upsert({
      where: { email },
      create: { name, email, picture },
      update: { name, picture },
    })

    // 3. Create our own JWT token
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, picture: user.picture },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' } // Session valid for 7 days
    )

    // 4. Send response
    res.json({
      success: true,
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.picture,
        }
      }
    })
  } catch (error) {
    console.error('Google login error:', error)
    res.status(500).json({ success: false, error: 'Authentication failed' })
  }
}
