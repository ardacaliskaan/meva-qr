// src/app/api/auth/login/route.js

import { NextResponse } from 'next/server'
import { authenticateUser, createToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    // Input validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      )
    }

    // Authenticate user
    const authResult = await authenticateUser(username.trim(), password)

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = createToken(authResult.user)

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Başarıyla giriş yapıldı',
      user: {
        id: authResult.user.id,
        name: authResult.user.name,
        username: authResult.user.username,
        role: authResult.user.role,
        permissions: authResult.user.permissions,
        avatar: authResult.user.avatar
      }
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 saat
      path: '/'
    })

    console.log(`✅ User logged in: ${authResult.user.username} (${authResult.user.role})`)

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}