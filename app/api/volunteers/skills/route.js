import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { generateEmbedding, buildVolunteerEmbeddingText } from '@/lib/vector/embeddings';
import { getCurrentUser, enforceRole } from '@/lib/auth';

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    const roleCheck = enforceRole(user, ['VOLUNTEER']);
    if (!roleCheck.authorized) {
      return NextResponse.json({ success: false, error: roleCheck.error }, { status: roleCheck.status });
    }

    const { bio, skills, interests, city, location_city, state, location_state, availability_type } = await request.json();

    const activeCity = location_city || city || 'Bengaluru';
    const activeState = location_state || state || 'Karnataka';
    const activeSkills = skills || interests || 'Community Service';
    const activeInterests = interests || skills || 'Education, Environment';
    const upperAvail = (availability_type || 'FLEXIBLE').toUpperCase();
    const validAvails = ['WEEKDAYS', 'WEEKENDS', 'FLEXIBLE', 'FULL_TIME'];
    const safeAvail = validAvails.includes(upperAvail) ? upperAvail : 'FLEXIBLE';

    const embeddingText = buildVolunteerEmbeddingText(
      { skills: activeSkills, interests: activeInterests, bio, location_city: activeCity, availability_type: safeAvail },
      { full_name: user.full_name }
    );
    const newVector = generateEmbedding(embeddingText);

    // Update Relational Database
    await execute(`
      UPDATE volunteers
      SET bio = ?,
          skills = ?,
          interests = ?,
          location_city = ?,
          location_state = ?,
          availability_type = ?,
          profile_vector = ?
      WHERE volunteer_id = ?
    `, [
      bio || '', activeSkills, activeInterests, activeCity, activeState,
      safeAvail, JSON.stringify(newVector), user.user_id
    ]);

    const updated = await queryOne('SELECT * FROM volunteers WHERE volunteer_id = ?', [user.user_id]);

    return NextResponse.json({
      success: true,
      message: 'Volunteer profile and 384-d semantic embedding vector updated in database!',
      volunteer: updated
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
