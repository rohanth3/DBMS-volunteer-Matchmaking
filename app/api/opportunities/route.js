import { NextResponse } from 'next/server';
import { query, queryOne, execute, getActiveEngine } from '@/lib/db';
import { generateEmbedding, buildOpportunityEmbeddingText } from '@/lib/vector/embeddings';
import { upsertOpportunityVector } from '@/lib/vector/chroma';
import { getCurrentUser, enforceRole } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cause = searchParams.get('cause');
    const city = searchParams.get('city');

    let sql = 'SELECT * FROM vw_opportunity_details WHERE 1=1';
    const params = [];

    if (cause && cause !== 'ALL') {
      sql += ' AND cause_category = ?';
      params.push(cause);
    }
    if (city && city !== 'ALL') {
      sql += ' AND location_city = ?';
      params.push(city);
    }

    sql += ' ORDER BY start_date ASC';

    const opportunities = await query(sql, params);

    // Fetch shifts for each opportunity with duration hours and occupancy counts
    const shifts = await query(`
      SELECT s.shift_id, s.opportunity_id, s.shift_date, s.start_time, s.end_time,
             COALESCE(s.hours, 4.0) AS hours,
             COALESCE(s.capacity, 10) AS capacity,
             COALESCE(s.filled_count, (
               SELECT COUNT(*) FROM shift_assignments sa 
               WHERE sa.shift_id = s.shift_id
             ), 0) AS filled_count,
             s.shift_status
      FROM shifts s
      ORDER BY s.shift_date ASC, s.start_time ASC
    `).catch(() => []);
    const shiftsByOpp = {};
    (shifts || []).forEach(s => {
      if (!shiftsByOpp[s.opportunity_id]) shiftsByOpp[s.opportunity_id] = [];
      shiftsByOpp[s.opportunity_id].push(s);
    });

    const enriched = (opportunities || []).map(opp => ({
      ...opp,
      shifts: shiftsByOpp[opp.opportunity_id] || []
    }));

    return NextResponse.json({ success: true, opportunities: enriched });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const roleCheck = enforceRole(user, ['NGO', 'ADMIN']);
    if (!roleCheck.authorized) {
      return NextResponse.json({ success: false, error: roleCheck.error }, { status: roleCheck.status });
    }

    const body = await request.json();
    const {
      title, description, cause_category = 'community_development',
      location_city = 'Bengaluru', location_state = 'Karnataka',
      start_date, end_date, required_volunteers = 10
    } = body;

    if (!title || !description || !start_date || !end_date) {
      return NextResponse.json({ success: false, error: 'Title, description, and dates are mandatory.' }, { status: 400 });
    }

    // Determine the host NGO ID (admins can publish on behalf of verified NGOs)
    let hostNgoId = user.user_id;
    let orgName = user.org_name || user.full_name;
    if (user.role === 'ADMIN') {
      const activeNgo = await queryOne('SELECT ngo_id, org_name FROM ngos ORDER BY UPPER(verification_status) = "VERIFIED" DESC LIMIT 1');
      hostNgoId = body.ngo_id || (activeNgo ? activeNgo.ngo_id : 'u_ngo_1');
      if (activeNgo) orgName = activeNgo.org_name;
    }

    const opportunityId = 'opp-' + crypto.randomUUID().substring(0, 8);

    // 1. Generate 384-dimensional dense semantic embedding vector
    const embeddingText = buildOpportunityEmbeddingText(
      { title, cause_category, description, location_city },
      { org_name: orgName }
    );
    const vector = generateEmbedding(embeddingText);

    // 2. Insert into database (fires trg_audit_opportunity_insert trigger!)
    await execute(`
      INSERT INTO opportunities (
        opportunity_id, ngo_id, title, description, cause_category,
        required_skills, experience_required, location_city, location_type,
        start_date, end_date, status, max_volunteers, tags, opportunity_vector
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?)
    `, [
      opportunityId, hostNgoId, title, description, cause_category,
      body.required_skills || 'Community Volunteering', Number(body.experience_required || 0),
      location_city, body.location_type || 'ON_SITE', start_date, end_date,
      Number(required_volunteers || 10), body.tags || 'community,volunteering', JSON.stringify(vector)
    ]);

    // 3. Insert default shift
    const defaultShiftId = 'sh-' + crypto.randomUUID().substring(0, 8);
    await execute(`
      INSERT INTO shifts (shift_id, opportunity_id, shift_date, start_time, end_time, hours, capacity, filled_count, shift_status)
      VALUES (?, ?, ?, '09:00:00', '13:00:00', 4.0, ?, 0, 'SCHEDULED')
    `, [defaultShiftId, opportunityId, start_date, Number(required_volunteers || 10)]);

    // 4. Upsert into ChromaDB vector database!
    await upsertOpportunityVector(
      opportunityId,
      vector,
      { title, cause_category, city: location_city, ngo_id: hostNgoId },
      embeddingText
    ).catch(e => console.warn('[ChromaDB Indexing Warning]:', e.message));

    return NextResponse.json({
      success: true,
      opportunityId,
      message: 'Opportunity created in MySQL and indexed in ChromaDB vector database!'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
