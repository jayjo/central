import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    // Find the most recent verification token for this email
    // NextAuth stores tokens with the email as identifier
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        expires: {
          gt: new Date(),
        },
      },
      orderBy: {
        expires: 'desc',
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Code not found or expired. Please request a new code.' },
        { status: 404 }
      )
    }

    // Check if the code matches - first try the stored code, then fall back to token prefix
    const providedCode = code.toUpperCase().trim().replace(/[^A-Z0-9]/g, '')
    const storedCode = verificationToken.code?.toUpperCase()
    const tokenCode = verificationToken.token.slice(0, 6).toUpperCase()
    
    console.log('Verifying code:', {
      email,
      providedCode,
      storedCode,
      tokenCode,
      matchesStored: storedCode === providedCode,
      matchesToken: tokenCode === providedCode,
      tokenExpires: verificationToken.expires,
      now: new Date(),
    })

    // Check against stored code first (what we actually sent), then fall back to token prefix
    const codeMatches = storedCode === providedCode || tokenCode === providedCode

    if (!codeMatches) {
      console.log('Code mismatch:', { providedCode, storedCode, tokenCode })
      return NextResponse.json(
        { 
          error: 'Invalid code. Please check the code from your most recent email and try again.',
        },
        { status: 401 }
      )
    }

    console.log('Token matched successfully')

    // Return the full token so NextAuth can complete the sign-in
    return NextResponse.json({
      token: matchingToken.token,
      email: matchingToken.identifier,
    })
  } catch (error: any) {
    console.error('Code verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}
