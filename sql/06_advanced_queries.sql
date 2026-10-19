-- ============================================================================
-- DBMS Level 3 Project: NGO Volunteer Matchmaking System
-- Course: DBMS Experiential Learning - PES University
-- Team Members:
--   1. Rishi   (SRN: PES1UG24AM224)
--   2. Rohanth (SRN: PES1UG24AM227)
-- File: 06_advanced_queries.sql - Core DML, JOIN, Aggregation & Analytical Queries
-- Demonstrates: SELECT, INSERT, UPDATE, DELETE, JOIN, GROUP BY, HAVING, 
--               ORDER BY, Aggregate Functions, Correlated Subqueries, Window Functions
-- ============================================================================

-- ============================================================================
-- QUERY 1: Multi-Table INNER & LEFT JOIN with Aggregate Functions
-- Purpose: Get detailed summary of NGO volunteer engagement with total hours
--          and unique volunteer counts.
-- Concepts: Multiple JOINs, GROUP BY, Aggregate Functions (COUNT, SUM, AVG)
-- ============================================================================
SELECT 
    n.ngo_id,
    n.org_name,
    n.cause_category,
    COUNT(DISTINCT o.opportunity_id) AS total_opportunities,
    COUNT(DISTINCT sa.volunteer_id) AS active_volunteers_count,
    COALESCE(SUM(sa.hours_logged), 0.00) AS total_hours_served,
    ROUND(COALESCE(AVG(sa.hours_logged), 0.00), 2) AS avg_hours_per_shift
FROM ngos n
INNER JOIN opportunities o ON n.ngo_id = o.ngo_id
LEFT JOIN shifts s ON o.opportunity_id = s.opportunity_id
LEFT JOIN shift_assignments sa ON s.shift_id = sa.shift_id AND sa.attendance_status = 'ATTENDED'
WHERE n.verification_status = 'VERIFIED'
GROUP BY n.ngo_id, n.org_name, n.cause_category
ORDER BY total_hours_served DESC;

-- ============================================================================
-- QUERY 2: Aggregation with HAVING Clause and Filter Thresholds
-- Purpose: Identify high-impact NGOs that have mobilized more than 15 hours
--          of volunteer work across at least 2 distinct opportunities.
-- Concepts: GROUP BY, HAVING clause with multiple conditions, Aggregate filter
-- ============================================================================
SELECT 
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
   AND SUM(sa.hours_logged) > 10.00
ORDER BY total_verified_hours DESC;

-- ============================================================================
-- QUERY 3: Correlated Subquery
-- Purpose: Retrieve volunteers whose total contributed hours exceed the average
--          contributed hours of volunteers in their same city.
-- Concepts: Correlated Subquery, Mathematical comparison against partition average
-- ============================================================================
SELECT 
    v.volunteer_id,
    u.full_name,
    v.location_city,
    v.total_hours_contributed,
    (
        SELECT ROUND(AVG(v2.total_hours_contributed), 2)
        FROM volunteers v2
        WHERE v2.location_city = v.location_city
    ) AS city_avg_hours
FROM volunteers v
JOIN users u ON v.volunteer_id = u.user_id
WHERE v.total_hours_contributed > (
    SELECT AVG(v2.total_hours_contributed)
    FROM volunteers v2
    WHERE v2.location_city = v.location_city
)
ORDER BY v.location_city, v.total_hours_contributed DESC;

-- ============================================================================
-- QUERY 4: Subquery with IN / NOT IN
-- Purpose: Find verified NGOs that currently have ZERO active opportunities.
-- Concepts: Subquery with NOT IN / NOT EXISTS
-- ============================================================================
SELECT 
    n.ngo_id,
    n.org_name,
    n.cause_category,
    n.contact_person,
    n.contact_email
FROM ngos n
WHERE n.verification_status = 'VERIFIED'
  AND n.ngo_id NOT IN (
      SELECT DISTINCT o.ngo_id 
      FROM opportunities o 
      WHERE o.status = 'OPEN'
  );

-- ============================================================================
-- QUERY 5: Window Functions (DENSE_RANK & ROW_NUMBER)
-- Purpose: Rank volunteer contributions globally and within each cause category
-- Concepts: Window Functions: DENSE_RANK() OVER (PARTITION BY ... ORDER BY ...)
-- ============================================================================
SELECT 
    u.full_name,
    o.cause_category,
    SUM(sa.hours_logged) AS category_hours,
    DENSE_RANK() OVER (
        PARTITION BY o.cause_category 
        ORDER BY SUM(sa.hours_logged) DESC
    ) AS category_rank,
    DENSE_RANK() OVER (
        ORDER BY SUM(sa.hours_logged) DESC
    ) AS global_rank
FROM shift_assignments sa
JOIN volunteers v ON sa.volunteer_id = v.volunteer_id
JOIN users u ON v.volunteer_id = u.user_id
JOIN shifts s ON sa.shift_id = s.shift_id
JOIN opportunities o ON s.opportunity_id = o.opportunity_id
WHERE sa.attendance_status = 'ATTENDED' AND sa.verified_by_ngo = 1
GROUP BY v.volunteer_id, u.full_name, o.cause_category
ORDER BY o.cause_category, category_rank;

-- ============================================================================
-- QUERY 6: Impact Analytics by Cause Category
-- Purpose: Aggregate community outcomes (trees, meals, students) per cause.
-- Concepts: LEFT JOIN, SUM, COALESCE, GROUP BY, ORDER BY
-- ============================================================================
SELECT 
    o.cause_category,
    COUNT(DISTINCT o.opportunity_id) AS total_events,
    COUNT(DISTINCT sa.volunteer_id) AS total_volunteers,
    COALESCE(SUM(im.beneficiaries_served), 0) AS total_beneficiaries,
    COALESCE(SUM(im.meals_distributed), 0) AS total_meals,
    COALESCE(SUM(im.trees_planted), 0) AS total_trees,
    COALESCE(SUM(im.students_tutored), 0) AS total_students,
    COALESCE(SUM(sa.hours_logged), 0.00) AS total_hours
FROM opportunities o
LEFT JOIN impact_metrics im ON o.opportunity_id = im.opportunity_id
LEFT JOIN shifts s ON o.opportunity_id = s.opportunity_id
LEFT JOIN shift_assignments sa ON s.shift_id = sa.shift_id AND sa.attendance_status = 'ATTENDED'
GROUP BY o.cause_category
ORDER BY total_hours DESC;

