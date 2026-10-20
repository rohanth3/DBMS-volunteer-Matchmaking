import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { getCurrentUser, enforceRole } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const roleCheck = enforceRole(user, ['ADMIN']);
    if (!roleCheck.authorized) {
      return NextResponse.json({ success: false, error: roleCheck.error }, { status: roleCheck.status });
    }

    const { ngoId, status } = await request.json();
    const validStatuses = ['pending', 'verified', 'rejected'];
    const normalizedStatus = (status || '').toLowerCase();

    if (!ngoId || !validStatuses.includes(normalizedStatus)) {
      return NextResponse.json({ success: false, error: 'Valid NGO ID and status (pending, verified, rejected) required.' }, { status: 400 });
    }

    const upperStatus = normalizedStatus.toUpperCase();

    // Updating fires trigger: trg_audit_ngo_verification
    await execute(`
      UPDATE ngos
      SET verification_status = ?,
          verified_by = ?,
          verified_at = CURRENT_TIMESTAMP
      WHERE ngo_id = ?
    `, [upperStatus, user.user_id, ngoId]);

    const updated = await queryOne('SELECT * FROM ngos WHERE ngo_id = ?', [ngoId]);

    return NextResponse.json({
      success: true,
      message: `NGO status updated to ${upperStatus}. Database trigger registered audit log.`,
      ngo: updated
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
