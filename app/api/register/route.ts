import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../../../lib/db'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = await request.json()
    
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const client = await pool.connect()
    
    try {
      const result = await client.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, hashedPassword]
      )
      
      const user = result.rows[0]
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      )
      
      return NextResponse.json({ token, user: { id: user.id, email: user.email } })
    } catch (dbError: any) {
      if (dbError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
      throw dbError
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}