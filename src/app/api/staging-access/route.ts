import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    const stagingPassword = process.env.STAGING_ACCESS_PASSWORD
    
    // If no staging password is set, don't allow access (safety check)
    if (!stagingPassword) {
      return NextResponse.json(
        { error: 'Staging access is not configured' },
        { status: 500 }
      )
    }
    
    if (password === stagingPassword) {
      // Set cookie that expires in 7 days
      const response = NextResponse.json({ success: true })
      response.cookies.set('staging-access', 'granted', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      
      return response
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify access' },
      { status: 500 }
    )
  }
}
