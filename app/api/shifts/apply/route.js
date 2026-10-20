import { NextResponse } from 'next/server';
import { query, queryOne, getActiveEngine, execute } from '@/lib/db';
import { getCurrentUser, enforceRole } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const roleCheck = enforceRole(user, ['VOLUNTEER', 'ADMIN']);
    if (!roleCheck.authorized) {
      return NextResponse.json({ success: false, error: roleCheck.error }, { status: roleCheck.status });
    }

    const { shiftId, opportunityId } = await request.json();
    if (!opportunityId && !shiftId) {
      return NextResponse.json({ success: false, error: 'Opportunity ID or Shift ID is required.' }, { status: 400 });
    }

    // Resolve the real target opportunity ID
    let targetOppId = opportunityId;
    if (!targetOppId && shiftId) {
      const shiftRow = await queryOne('SELECT opportunity_id FROM shifts WHERE shift_id = ?', [shiftId]);
      targetOppId = shiftRow?.opportunity_id || shiftId;
    }

    // Verify whether targetOppId is actually a shift_id
    const oppCheck = await queryOne('SELECT opportunity_id FROM opportunities WHERE opportunity_id = ?', [targetOppId]);
    if (!oppCheck) {
      const shiftLookup = await queryOne('SELECT opportunity_id FROM shifts WHERE shift_id = ?', [targetOppId]);
      if (shiftLookup) {
        targetOppId = shiftLookup.opportunity_id;
      }
    }

    // If Admin is enrolling as a demo, use a valid volunteer_id
    let volunteerId = user.user_id;
    if (user.role === 'ADMIN') {
      const volUser = await queryOne('SELECT volunteer_id FROM volunteers LIMIT 1');
      if (volUser) volunteerId = volUser.volunteer_id;
    }

    const engine = await getActiveEngine();
    const applicationId = 'app-' + crypto.randomUUID().substring(0, 8);

    if (engine === 'mysql') {
      // Execute the MySQL ACID Stored Procedure sp_apply_for_shift
      await query('CALL sp_apply_for_shift(?, ?, ?, @status_code, @message)', [
        applicationId,
        targetOppId,
        volunteerId
      ]);

      const result = await query('SELECT @status_code AS statusCode, @message AS message');
      const statusCode = result[0]?.statusCode || 200;
      const message = result[0]?.message || 'Enrolled successfully';

      if (statusCode >= 400) {
        return NextResponse.json({ success: false, error: message }, { status: statusCode });
      }

      // Record assignment for the shift
      if (shiftId) {
        const assignmentId = 'sa-' + crypto.randomUUID().substring(0, 8);
        await execute(`
          INSERT INTO shift_assignments (assignment_id, shift_id, volunteer_id, application_id, attendance_status, hours_logged, verified_by_ngo, feedback)
          VALUES (?, ?, ?, ?, 'REGISTERED', 0.0, 0, 'Registered for scheduled shift.')
        `, [assignmentId, shiftId, volunteerId, applicationId]).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message,
        applicationId
      });
    } else {
      // Relational execution for SQLite
      // 1. Ensure shift is resolved
      let targetShift = shiftId;
      if (!targetShift) {
        const sRow = await queryOne('SELECT shift_id FROM shifts WHERE opportunity_id = ? LIMIT 1', [targetOppId]);
        targetShift = sRow?.shift_id;
      }

      if (targetShift) {
        const sInfo = await queryOne('SELECT capacity, filled_count FROM shifts WHERE shift_id = ?', [targetShift]);
        if (sInfo && sInfo.filled_count >= sInfo.capacity) {
          return NextResponse.json({ success: false, error: 'Shift is already at maximum capacity.' }, { status: 409 });
        }

        const existing = await queryOne('SELECT assignment_id FROM shift_assignments WHERE shift_id = ? AND volunteer_id = ?', [targetShift, volunteerId]);
        if (existing) {
          return NextResponse.json({ success: false, error: 'Volunteer is already enrolled in this shift.' }, { status: 400 });
        }
      }

      // 2. Insert application record
      await execute(`
        INSERT OR REPLACE INTO volunteer_applications (application_id, opportunity_id, volunteer_id, status, applied_at)
        VALUES (?, ?, ?, 'ACCEPTED', datetime('now'))
      `, [applicationId, targetOppId, volunteerId]);

      // 3. Insert shift assignment (triggers trg_increment_shift_filled_count)
      if (targetShift) {
        const assignmentId = 'sa-' + crypto.randomUUID().substring(0, 8);
        await execute(`
          INSERT INTO shift_assignments (assignment_id, shift_id, volunteer_id, application_id, attendance_status, hours_logged, verified_by_ngo, feedback)
          VALUES (?, ?, ?, ?, 'REGISTERED', 0.0, 0, 'Registered for scheduled shift.')
        `, [assignmentId, targetShift, volunteerId, applicationId]);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Successfully enrolled in shift! Capacity increment trigger executed.', 
        applicationId 
      });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
