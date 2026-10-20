import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json({ success: false, error: 'Verification code required.' }, { status: 400 });
    }

    const certificate = await queryOne(`
      SELECT c.*, 
             u.full_name AS volunteer_name, u.email AS volunteer_email,
             n.org_name, n.org_name AS organization_name, n.cause_category, 
             COALESCE(n.darpan_id, n.registration_number) AS darpan_id,
             o.title AS opportunity_title, o.cause_category AS opp_cause
      FROM certificates c
      JOIN volunteers v ON c.volunteer_id = v.volunteer_id
      JOIN users u ON v.volunteer_id = u.user_id
      JOIN opportunities o ON c.opportunity_id = o.opportunity_id
      JOIN ngos n ON (c.ngo_id = n.ngo_id OR o.ngo_id = n.ngo_id)
      WHERE c.certificate_code = ?
    `, [code]);

    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Invalid or non-existent certificate verification hash.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, certificate });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
