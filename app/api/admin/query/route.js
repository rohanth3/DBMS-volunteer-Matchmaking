import { NextResponse } from 'next/server';
import { query, getActiveEngine } from '@/lib/db';
import { getCurrentUser, enforceRole } from '@/lib/auth';

const PRESET_QUERIES = {
  join_aggregate: {
    title: '1. Multi-Table JOIN with Aggregations',
    description: 'Summarizes verified NGO engagement, total volunteer hours, and average hours per shift on relational engine.',
    sql: `SELECT 
    n.ngo_id,
    n.org_name,
    n.cause_category,
    COUNT(DISTINCT o.opportunity_id) AS total_opportunities,
    COUNT(DISTINCT sa.volunteer_id) AS active_volunteers_count,
    COALESCE(SUM(sa.hours_logged), 0.0) AS total_hours_served,
    ROUND(COALESCE(AVG(sa.hours_logged), 0.0), 2) AS avg_hours_per_record
FROM ngos n
INNER JOIN opportunities o ON n.ngo_id = o.ngo_id
LEFT JOIN shifts s ON o.opportunity_id = s.opportunity_id
LEFT JOIN shift_assignments sa ON s.shift_id = sa.shift_id AND sa.verified_by_ngo = 1
WHERE UPPER(n.verification_status) = 'VERIFIED'
GROUP BY n.ngo_id, n.org_name, n.cause_category
ORDER BY total_hours_served DESC;`
  },
  having_filter: {
    title: '2. Aggregation with HAVING Clause',
    description: 'Identifies organizations that have hosted opportunities and mobilized verified volunteer hours above threshold.',
    sql: `SELECT 
    n.org_name,
    n.city,
    n.cause_category,
    COUNT(DISTINCT o.opportunity_id) AS campaigns_hosted,
    SUM(sa.hours_logged) AS total_verified_hours
FROM ngos n
JOIN opportunities o ON n.ngo_id = o.ngo_id
JOIN shifts s ON o.opportunity_id = s.opportunity_id
JOIN shift_assignments sa ON s.shift_id = sa.shift_id
WHERE sa.verified_by_ngo = 1
GROUP BY n.ngo_id, n.org_name, n.city, n.cause_category
HAVING COUNT(DISTINCT o.opportunity_id) >= 1 
   AND SUM(sa.hours_logged) > 5.0
ORDER BY total_verified_hours DESC;`
  },
  correlated_subquery: {
    title: '3. Correlated Subquery',
    description: 'Selects volunteers whose total contributed hours exceed the average contributed hours in their same city.',
    sql: `SELECT 
    v.volunteer_id,
    u.full_name,
    v.location_city AS city,
    COALESCE((SELECT SUM(sa.hours_logged) FROM shift_assignments sa WHERE sa.volunteer_id = v.volunteer_id AND sa.verified_by_ngo = 1), 0.0) AS my_hours,
    ROUND((
        SELECT AVG(sub.city_hrs) 
        FROM (
            SELECT v2.location_city AS city, SUM(sa2.hours_logged) AS city_hrs
            FROM volunteers v2
            JOIN shift_assignments sa2 ON v2.volunteer_id = sa2.volunteer_id AND sa2.verified_by_ngo = 1
            GROUP BY v2.volunteer_id, v2.location_city
        ) sub
        WHERE sub.city = v.location_city
    ), 2) AS city_avg_hours
FROM volunteers v
JOIN users u ON v.volunteer_id = u.user_id
WHERE COALESCE((SELECT SUM(sa.hours_logged) FROM shift_assignments sa WHERE sa.volunteer_id = v.volunteer_id AND sa.verified_by_ngo = 1), 0.0) > 0
ORDER BY v.location_city, my_hours DESC;`
  },
  subquery_notin: {
    title: '4. Subquery with NOT IN',
    description: 'Finds verified NGOs that currently have zero open opportunities posted.',
    sql: `SELECT 
    n.ngo_id,
    n.org_name,
    n.cause_category,
    n.contact_email AS email,
    n.contact_phone
FROM ngos n
WHERE UPPER(n.verification_status) = 'VERIFIED'
  AND n.ngo_id NOT IN (
      SELECT DISTINCT o.ngo_id 
      FROM opportunities o 
      WHERE UPPER(o.status) = 'OPEN'
  );`
  },
  window_functions: {
    title: '5. Window Functions (DENSE_RANK)',
    description: 'Calculates volunteer rankings partitioned within each city alongside global rank on relational engine.',
    sql: `SELECT 
    u.full_name,
    v.location_city AS city,
    COALESCE(SUM(sa.hours_logged), 0.0) AS total_hours,
    DENSE_RANK() OVER (
        PARTITION BY v.location_city 
        ORDER BY COALESCE(SUM(sa.hours_logged), 0.0) DESC
    ) AS city_rank,
    DENSE_RANK() OVER (
        ORDER BY COALESCE(SUM(sa.hours_logged), 0.0) DESC
    ) AS global_rank
FROM volunteers v
JOIN users u ON v.volunteer_id = u.user_id
JOIN shift_assignments sa ON v.volunteer_id = sa.volunteer_id AND sa.verified_by_ngo = 1
GROUP BY v.volunteer_id, u.full_name, v.location_city
ORDER BY v.location_city, city_rank;`
  },
  impact_cause: {
    title: '6. Cause-Wise Impact Metrics',
    description: 'Aggregates community campaigns and volunteer engagements grouped by cause category.',
    sql: `SELECT 
    o.cause_category,
    COUNT(DISTINCT o.opportunity_id) AS total_events,
    COUNT(DISTINCT sa.volunteer_id) AS total_active_volunteers,
    COALESCE(SUM(sa.hours_logged), 0.0) AS total_verified_hours
FROM opportunities o
LEFT JOIN shifts s ON o.opportunity_id = s.opportunity_id
LEFT JOIN shift_assignments sa ON s.shift_id = sa.shift_id AND sa.verified_by_ngo = 1
GROUP BY o.cause_category
ORDER BY total_verified_hours DESC;`
  }
};

export async function GET() {
  return NextResponse.json({ success: true, presetQueries: PRESET_QUERIES });
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const roleCheck = enforceRole(user, ['ADMIN', 'NGO', 'VOLUNTEER']);
    if (!roleCheck.authorized) {
      return NextResponse.json({ success: false, error: roleCheck.error }, { status: roleCheck.status });
    }

    const { queryKey, customSql } = await request.json();
    let sqlToRun = customSql;

    if (queryKey && PRESET_QUERIES[queryKey]) {
      sqlToRun = PRESET_QUERIES[queryKey].sql;
    }

    if (!sqlToRun) {
      return NextResponse.json({ success: false, error: 'No SQL query specified.' }, { status: 400 });
    }

    const trimmed = sqlToRun.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
      return NextResponse.json({
        success: false,
        error: 'Security restriction: Only SELECT/WITH statements are permitted in this runner.'
      }, { status: 400 });
    }

    const startTime = performance.now();
    const rows = await query(sqlToRun);
    const durationMs = Number((performance.now() - startTime).toFixed(2));
    const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : [];

    return NextResponse.json({
      success: true,
      engine: await getActiveEngine(),
      durationMs,
      rowCount: rows ? rows.length : 0,
      columns,
      rows: rows || []
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
