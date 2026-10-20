import { NextResponse } from 'next/server';
import { verifyCredentials, setAuthCookie, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await verifyCredentials(email, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Please verify your email and password.' },
        { status: 401 }
      );
    }

    await setAuthCookie(user.user_id);

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      user
    });

    response.cookies.set(AUTH_COOKIE_NAME, user.user_id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

