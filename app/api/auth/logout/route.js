import { NextResponse } from 'next/server';
import { clearAuthCookie, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  try {
    await clearAuthCookie();
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.'
    });

    response.cookies.set(AUTH_COOKIE_NAME, '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

