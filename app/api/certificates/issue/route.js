import { NextResponse } from 'next/server';
import { query, getActiveEngine, execute } from '@/lib/db';
import { getCurrentUser, enforceRole } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const roleCheck = enforceRole(user, ['NGO', 'ADMIN']);
    if (!roleCheck.authorized) {
      return NextResponse.json({ success: false, error: roleCheck.error }, { status: roleCheck.status });
    }

    const { volunteerId, opportunityId, title, totalHours, certificateUrl } = await request.json();

    if (!volunteerId || !opportunityId || !totalHours) {
      return NextResponse.json({ success: false, error: 'Volunteer ID, Opportunity ID, and Total Hours are required.' }, { status: 400 });
    }

    const certificateId = 'cert-' + crypto.randomUUID().substring(0, 8);
    const rawPayload = `${volunteerId}:${opportunityId}:${user.user_id}:${Date.now()}:${Math.random()}`;
    const certificateCode = crypto.createHash('sha256').update(rawPayload).digest('hex').substring(0, 40);
    const finalUrl = certificateUrl || `/verify/${certificateCode}`;

    let issuerNgoId = user.user_id;
    const oppRow = await queryOne('SELECT ngo_id FROM opportunities WHERE opportunity_id = ?', [opportunityId]);
    if (oppRow?.ngo_id) {
      issuerNgoId = oppRow.ngo_id;
    }
    const certTitle = title || 'Certificate of Commendable Community Service';
    const signatoryName = user.full_name || 'Executive Director';
    const signatoryRole = user.role === 'ADMIN' ? 'Platform Administrator' : 'Executive Director';

    const engine = await getActiveEngine();

    if (engine === 'mysql') {
      // Execute the MySQL Stored Procedure sp_verify_and_issue_certificate
      await query('CALL sp_verify_and_issue_certificate(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @status_code, @message)', [
        certificateId,
        certificateCode,
        volunteerId,
        issuerNgoId,
        opportunityId,
        certTitle,
        Number(totalHours),
        signatoryName,
        signatoryRole,
        finalUrl
      ]).catch(async () => {
        // Fallback standard insert if procedure signature differs
        await execute(`
          INSERT INTO certificates (
            certificate_id, certificate_code, volunteer_id, ngo_id, 
            opportunity_id, title, total_hours_credited, issued_date, 
            signatory_name, signatory_role, verification_url, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, NOW())
        `, [
          certificateId, certificateCode, volunteerId, issuerNgoId, 
          opportunityId, certTitle, Number(totalHours), 
          signatoryName, signatoryRole, finalUrl
        ]);
      });

      return NextResponse.json({
        success: true,
        message: 'Certificate issued successfully via database ledger.',
        certificate: {
          certificateId,
          certificateCode,
          verificationUrl: finalUrl
        }
      });
    } else {
      await execute(`
        INSERT INTO certificates (
          certificate_id, certificate_code, volunteer_id, ngo_id, 
          opportunity_id, title, total_hours_credited, issued_date, 
          signatory_name, signatory_role, verification_url, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, ?, datetime('now'))
      `, [
        certificateId, certificateCode, volunteerId, issuerNgoId, 
        opportunityId, certTitle, Number(totalHours), 
        signatoryName, signatoryRole, finalUrl
      ]);

      return NextResponse.json({
        success: true,
        message: 'Certificate issued successfully.',
        certificate: { certificateId, certificateCode, verificationUrl: finalUrl }
      });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
