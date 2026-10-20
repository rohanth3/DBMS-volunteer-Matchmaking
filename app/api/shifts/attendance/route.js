import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { getCurrentUser, enforceRole } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const roleCheck = enforceRole(user, ['NGO', 'ADMIN']);
    if (!roleCheck.authorized) {
      return NextResponse.json({ success: false, error: roleCheck.error }, { status: roleCheck.status });
    }

    const body = await request.json();
    const targetId = body.recordId || body.assignmentId;
    const hoursLogged = body.hoursLogged;
    const feedbackNotes = body.feedbackNotes;

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Record ID or Assignment ID is required.' }, { status: 400 });
    }

    // Updating shift_assignments fires trigger: trg_update_volunteer_hours!
    await execute(`
      UPDATE shift_assignments
      SET verified_by_ngo = 1,
          attendance_status = 'ATTENDED',
          hours_logged = COALESCE(?, hours_logged),
          feedback = ?
      WHERE assignment_id = ?
    `, [hoursLogged ? Number(hoursLogged) : null, feedbackNotes || 'Verified by NGO representative.', targetId]);

    const updated = await queryOne(`
      SELECT sa.*, sa.assignment_id AS record_id, u.full_name AS volunteer_name
      FROM shift_assignments sa
      JOIN volunteers v ON sa.volunteer_id = v.volunteer_id
      JOIN users u ON v.volunteer_id = u.user_id
      WHERE sa.assignment_id = ?
    `, [targetId]);

    return NextResponse.json({
      success: true,
      message: 'Attendance & hours verified! Database trigger trg_update_volunteer_hours updated volunteer total hours and tier!',
      record: updated
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
