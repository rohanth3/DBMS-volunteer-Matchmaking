-- ============================================================================
-- DBMS Level 3 Project: NGO Volunteer Matchmaking System
-- Course: DBMS Experiential Learning - PES University
-- Team Members:
--   1. Rishi   (SRN: PES1UG24AM224)
--   2. Rohanth (SRN: PES1UG24AM227)
-- File: 02_indexes.sql - Database Indexing Strategy
-- Demonstrates: B-Tree Indexes, Composite Indexes, Unique Indexes
-- ============================================================================

-- 1. Index on User Email for rapid authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Index on Volunteer Location and Availability for geographical filtering
CREATE INDEX IF NOT EXISTS idx_volunteers_city_avail ON volunteers(location_city, availability_type);

-- 3. Composite Index on Opportunities for status, cause, and city filtering
CREATE INDEX IF NOT EXISTS idx_opp_status_cause_city ON opportunities(status, cause_category, location_city);

-- 4. Composite Index on Shifts for opportunity scheduling lookups
CREATE INDEX IF NOT EXISTS idx_shifts_opp_date ON shifts(opportunity_id, shift_date);

-- 5. Index on Applications by Volunteer and Status
CREATE INDEX IF NOT EXISTS idx_applications_vol_status ON volunteer_applications(volunteer_id, status);

-- 6. Index on Shift Assignments for attendance verification
CREATE INDEX IF NOT EXISTS idx_assignments_shift_status ON shift_assignments(shift_id, attendance_status);

-- 7. Index on Certificates for fast public hash lookup
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);

-- 8. Index on Impact Metrics by Opportunity and Date
CREATE INDEX IF NOT EXISTS idx_impact_opp_date ON impact_metrics(opportunity_id, recorded_date);

-- 9. Index on Audit Logs by Table and Timestamp
CREATE INDEX IF NOT EXISTS idx_audit_table_date ON audit_logs(table_name, logged_at);

-- 10. Index on NGO verification status for admin review queues
CREATE INDEX IF NOT EXISTS idx_ngos_verification ON ngos(verification_status);

