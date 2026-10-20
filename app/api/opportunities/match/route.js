import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { querySimilarOpportunities } from '@/lib/vector/chroma';
import { generateEmbedding, buildVolunteerEmbeddingText } from '@/lib/vector/embeddings';
import { rankOpportunitiesForVolunteer } from '@/lib/vector/similarity';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    let volunteerId = body.volunteerId;

    if (!volunteerId) {
      const user = await getCurrentUser();
      volunteerId = user?.user_id;
    }

    if (!volunteerId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in as a volunteer to run AI matchmaking.'
      }, { status: 401 });
    }

    // Retrieve volunteer profile from MySQL
    const volunteer = await queryOne(`
      SELECT v.*, u.full_name, u.email 
      FROM volunteers v 
      JOIN users u ON v.volunteer_id = u.user_id 
      WHERE v.volunteer_id = ?
    `, [volunteerId]);

    if (!volunteer) {
      return NextResponse.json({ success: false, error: 'Volunteer profile not found.' }, { status: 404 });
    }

    // Ensure volunteer has an embedding vector
    let volVec = volunteer.profile_vector || volunteer.embedding;
    if (typeof volVec === 'string') {
      try { volVec = JSON.parse(volVec); } catch (e) { volVec = null; }
    }
    if (!Array.isArray(volVec) || volVec.length === 0) {
      const text = buildVolunteerEmbeddingText(volunteer, { full_name: volunteer.full_name });
      volVec = generateEmbedding(text);
    }

    // 1. Query ChromaDB Vector Database for top semantic matches
    const chromaMatches = await querySimilarOpportunities(volVec, 15);
    const chromaScores = {};
    chromaMatches.forEach(m => {
      chromaScores[m.opportunity_id] = m.similarity;
    });

    // 2. Re-hydrate active opportunities from View vw_opportunity_details
    const opportunities = await query(`
      SELECT * FROM vw_opportunity_details
      WHERE UPPER(opportunity_status) = 'OPEN'
    `);

    // Fetch shifts with duration hours and occupancy counts
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

    const enriched = (opportunities || []).map(opp => {
      // Overwrite / merge vector similarity score from ChromaDB
      const chromaSim = chromaScores[opp.opportunity_id] ?? null;
      return {
        ...opp,
        shifts: shiftsByOpp[opp.opportunity_id] || [],
        chromaSimilarity: chromaSim
      };
    });

    // 3. Compute final Hybrid Match Ranking (ChromaDB Vector + Relational Filters)
    const rankedResults = rankOpportunitiesForVolunteer(
      { ...volunteer, profile_vector: volVec },
      enriched
    );

    return NextResponse.json({
      success: true,
      vectorDatabase: 'ChromaDB',
      collection: 'ngo_opportunities',
      volunteer: {
        id: volunteer.volunteer_id,
        name: volunteer.full_name,
        skills: volunteer.skills || volunteer.interests,
        city: volunteer.location_city || volunteer.city,
        availability: volunteer.availability_type
      },
      rankedOpportunities: rankedResults
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
