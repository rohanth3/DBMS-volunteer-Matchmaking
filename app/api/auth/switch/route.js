import { NextResponse } from 'next/server';
import { getCurrentUser, setAuthCookie } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    // Security Check: Only active ADMIN users can perform switch, or users in development mode
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Unrestricted account switching is disabled. Please log in with your credentials.'
      }, { status: 403 });
    }

    const targetUser = await queryOne('SELECT * FROM users WHERE user_id = ? AND is_active = 1', [userId]);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Target user not found.' }, { status: 404 });
    }

    setAuthCookie(targetUser.user_id);

    return NextResponse.json({
      success: true,
      message: `Admin switched session to ${targetUser.full_name}`,
      user: targetUser
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
