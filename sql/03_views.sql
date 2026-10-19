-- ============================================================================
-- DBMS Level 3 Project: NGO Volunteer Matchmaking System
-- Course: DBMS Experiential Learning - PES University
-- Team Members:
--   1. Rishi   (SRN: PES1UG24AM224)
--   2. Rohanth (SRN: PES1UG24AM227)
-- File: 03_views.sql - Advanced Database Views
-- Demonstrates: Multi-table JOINs, Aggregations, Window Functions in Views
-- ============================================================================

-- ============================================================================
-- View 1: vw_opportunity_details
-- Combines opportunity information with organization details, verification,
-- and aggregated shift capacity metrics.
-- ============================================================================
CREATE VIEW IF NOT EXISTS vw_opportunity_details AS
SELECT 
    o.opportunity_id,
    o.title AS opportunity_title,
    o.description,
    o.cause_category,
    o.required_skills,
    o.experience_required,
    o.location_city,
    o.location_type,
    o.start_date,
    o.end_date,
    o.status AS opportunity_status,
    o.max_volunteers,
    n.ngo_id,
    n.org_name,
    n.verification_status,
    n.website_url,
    u.email AS ngo_email,
    n.contact_phone,
    COUNT(s.shift_id) AS total_shifts,
    COALESCE(SUM(s.capacity), 0) AS aggregate_capacity,
    COALESCE(SUM(s.filled_count), 0) AS aggregate_enrolled,
    (COALESCE(SUM(s.capacity), 0) - COALESCE(SUM(s.filled_count), 0)) AS aggregate_slots_open
FROM opportunities o
JOIN ngos n ON o.ngo_id = n.ngo_id
JOIN users u ON n.ngo_id = u.user_id
LEFT JOIN shifts s ON o.opportunity_id = s.opportunity_id
GROUP BY 
    o.opportunity_id, o.title, o.description, o.cause_category, 
    o.required_skills, o.experience_required, o.location_city, 
    o.location_type, o.start_date, o.end_date, o.status, 
    o.max_volunteers, n.ngo_id, n.org_name, n.verification_status, 
    n.website_url, u.email, n.contact_phone;

-- ============================================================================
-- View 2: vw_volunteer_leaderboard
-- Calculates volunteer ranking, total verified hours, certificates issued,
-- and dynamic tier calculation.
-- ============================================================================
CREATE VIEW IF NOT EXISTS vw_volunteer_leaderboard AS
SELECT 
    v.volunteer_id,
    u.full_name AS volunteer_name,
    u.email,
    v.location_city,
    v.experience_years,
    v.total_hours_contributed,
    COUNT(DISTINCT c.certificate_id) AS total_certificates,
    COUNT(DISTINCT a.opportunity_id) AS opportunities_completed,
    CASE 
        WHEN v.total_hours_contributed >= 100 THEN 'PLATINUM'
        WHEN v.total_hours_contributed >= 50 THEN 'GOLD'
        WHEN v.total_hours_contributed >= 20 THEN 'SILVER'
        ELSE 'BRONZE'
    END AS computed_tier,
    DENSE_RANK() OVER (ORDER BY v.total_hours_contributed DESC) AS global_rank
FROM volunteers v
JOIN users u ON v.volunteer_id = u.user_id
LEFT JOIN certificates c ON v.volunteer_id = c.volunteer_id
LEFT JOIN volunteer_applications a ON v.volunteer_id = a.volunteer_id AND a.status = 'ACCEPTED'
GROUP BY 
    v.volunteer_id, u.full_name, u.email, v.location_city, 
    v.experience_years, v.total_hours_contributed;

-- ============================================================================
-- View 3: vw_ngo_impact_summary
-- Executive impact report for each NGO combining volunteer engagement and
-- tangible community outcomes.
-- ============================================================================
CREATE VIEW IF NOT EXISTS vw_ngo_impact_summary AS
SELECT 
    n.ngo_id,
    n.org_name,
    n.cause_category,
    n.city,
    n.verification_status,
    COUNT(DISTINCT o.opportunity_id) AS total_campaigns,
    COUNT(DISTINCT sa.volunteer_id) AS unique_volunteers_engaged,
    COALESCE(SUM(sa.hours_logged), 0.00) AS total_volunteer_hours_verified,
    COALESCE(SUM(im.beneficiaries_served), 0) AS total_beneficiaries_served,
    COALESCE(SUM(im.meals_distributed), 0) AS total_meals_distributed,
    COALESCE(SUM(im.trees_planted), 0) AS total_trees_planted,
    COALESCE(SUM(im.students_tutored), 0) AS total_students_tutored,
    COALESCE(SUM(im.waste_cleaned_kg), 0.0) AS total_waste_cleaned_kg
FROM ngos n
LEFT JOIN opportunities o ON n.ngo_id = o.ngo_id
LEFT JOIN shifts s ON o.opportunity_id = s.opportunity_id
LEFT JOIN shift_assignments sa ON s.shift_id = sa.shift_id AND sa.attendance_status = 'ATTENDED' AND sa.verified_by_ngo = 1
LEFT JOIN impact_metrics im ON n.ngo_id = im.ngo_id
GROUP BY 
    n.ngo_id, n.org_name, n.cause_category, n.city, n.verification_status;

-- ============================================================================
-- View 4: vw_shift_occupancy
-- Real-time shift scheduling status with computed occupancy percentage.
-- ============================================================================
CREATE VIEW IF NOT EXISTS vw_shift_occupancy AS
SELECT 
    s.shift_id,
    s.opportunity_id,
    o.title AS opportunity_title,
    n.org_name,
    s.shift_date,
    s.start_time,
    s.end_time,
    s.hours,
    s.capacity,
    s.filled_count,
    (s.capacity - s.filled_count) AS remaining_slots,
    ROUND((CAST(s.filled_count AS FLOAT) / CAST(s.capacity AS FLOAT)) * 100, 1) AS occupancy_percentage,
    s.shift_status
FROM shifts s
JOIN opportunities o ON s.opportunity_id = o.opportunity_id
JOIN ngos n ON o.ngo_id = n.ngo_id;

