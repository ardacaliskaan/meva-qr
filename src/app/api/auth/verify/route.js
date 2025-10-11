// src/app/api/auth/verify/route.js

import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    const authResult = await verifyToken(request)

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authResult.user.id,
        name: authResult.user.name,
        username: authResult.user.username,
        role: authResult.user.role,
        permissions: authResult.user.permissions,
        avatar: authResult.user.avatar,
        lastLogin: authResult.user.metadata?.lastLogin
      }
    })

  } catch (error) {
    console.error('Auth verify error:', error)
    return NextResponse.json(
      { success: false, error: 'Doğrulama hatası' },
      { status: 500 }
    )
  }
}