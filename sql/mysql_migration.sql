-- ============================================================================
-- DBMS Level 3 Project: NGO Volunteer Matchmaking System
-- Course: DBMS Experiential Learning - PES University
-- Authors: Rishi (PES1UG24AM224) & Rohanth (PES1UG24AM227)
-- Database Engine: MySQL 8.0 Native Execution Script
-- File: sql/mysql_migration.sql
-- ============================================================================

USE ngo_volunteer_db;

-- 1. Authentication & Base Identity Table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'NGO', 'VOLUNTEER') NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed initial authenticated personas with bcrypt hashes (Password: Password@123)
-- Hash generated via bcrypt: $2a$10$l7Ny/X1EhuitrgTFSNl4/eptOkPUJDXMkn0l.FobkpFKyFLHR9nR6
INSERT IGNORE INTO users (user_id, email, password_hash, role, full_name, phone, is_active) VALUES
('usr-admin-1', 'rishi.admin@pes.edu', '$2a$10$l7Ny/X1EhuitrgTFSNl4/eptOkPUJDXMkn0l.FobkpFKyFLHR9nR6', 'ADMIN', 'Rishi (Admin - PES1UG24AM224)', '+91-9876543210', 1),
('usr-admin-2', 'rohanth.admin@pes.edu', '$2a$10$l7Ny/X1EhuitrgTFSNl4/eptOkPUJDXMkn0l.FobkpFKyFLHR9nR6', 'ADMIN', 'Rohanth (Admin - PES1UG24AM227)', '+91-9876543211', 1),
('usr-vol-rishi', 'rishi@pes.edu', '$2a$10$l7Ny/X1EhuitrgTFSNl4/eptOkPUJDXMkn0l.FobkpFKyFLHR9nR6', 'VOLUNTEER', 'Rishi (PES1UG24AM224)', '+91-9845012345', 1),
('usr-vol-rohanth', 'rohanth@pes.edu', '$2a$10$l7Ny/X1EhuitrgTFSNl4/eptOkPUJDXMkn0l.FobkpFKyFLHR9nR6', 'VOLUNTEER', 'Rohanth (PES1UG24AM227)', '+91-9845067890', 1);

-- Synchronize existing volunteers into users table
INSERT IGNORE INTO users (user_id, email, password_hash, role, full_name, phone, is_active)
SELECT volunteer_id, email, '$2a$10$l7Ny/X1EhuitrgTFSNl4/eptOkPUJDXMkn0l.FobkpFKyFLHR9nR6', 'VOLUNTEER', full_name, phone, 1
FROM volunteers;

-- Synchronize existing NGOs into users table
INSERT IGNORE INTO users (user_id, email, password_hash, role, full_name, phone, is_active)
SELECT ngo_id, email, '$2a$10$l7Ny/X1EhuitrgTFSNl4/eptOkPUJDXMkn0l.FobkpFKyFLHR9nR6', 'NGO', organization_name, contact_phone, 1
FROM ngos;

-- Ensure Rishi & Rohanth exist in volunteers table
INSERT IGNORE INTO volunteers (volunteer_id, full_name, email, phone, city, state, bio, interests, availability_type) VALUES
('usr-vol-rishi', 'Rishi (PES1UG24AM224)', 'rishi@pes.edu', '+91-9845012345', 'Bengaluru', 'Karnataka', 'CS student passionate about teaching coding and math to underprivileged children.', 'Education, Environment, Coding', 'weekends'),
('usr-vol-rohanth', 'Rohanth (PES1UG24AM227)', 'rohanth@pes.edu', '+91-9845067890', 'Bengaluru', 'Karnataka', 'Certified emergency responder and healthcare coordinator with disaster relief training.', 'Healthcare, Animal Welfare, Disaster Relief', 'flexible');

-- ============================================================================
-- 2. Performance Indexes
-- ============================================================================
CREATE INDEX idx_opportunities_status_ngo ON opportunities(status, ngo_id);
CREATE INDEX idx_applications_vol_opp ON applications(volunteer_id, opportunity_id);
CREATE INDEX idx_shifts_opp_date ON shifts(opportunity_id, shift_date);
CREATE INDEX idx_vol_hours_vol_verified ON volunteer_hours(volunteer_id, verified_by_ngo);
CREATE INDEX idx_cert_code ON certificates(certificate_code);

-- ============================================================================
-- 3. Multi-Table Analytical Views
-- ============================================================================
DROP VIEW IF EXISTS vw_opportunity_details;
CREATE VIEW vw_opportunity_details AS
SELECT 
    o.opportunity_id,
    o.title AS opportunity_title,
    o.description,
    o.city AS location_city,
    o.state AS location_state,
    o.start_date,
    o.end_date,
    o.status AS opportunity_status,
    o.required_volunteers,
    o.accepted_volunteers,
    n.ngo_id,
    n.organization_name AS org_name,
    n.cause_category,
    n.verification_status,
    n.email AS ngo_email,
    n.contact_phone,
    COUNT(s.shift_id) AS total_shifts,
    COALESCE(SUM(s.capacity), 0) AS aggregate_capacity
FROM opportunities o
JOIN ngos n ON o.ngo_id = n.ngo_id
LEFT JOIN shifts s ON o.opportunity_id = s.opportunity_id
GROUP BY 
    o.opportunity_id, o.title, o.description, o.city, o.state,
    o.start_date, o.end_date, o.status, o.required_volunteers,
    o.accepted_volunteers, n.ngo_id, n.organization_name,
    n.cause_category, n.verification_status, n.email, n.contact_phone;

DROP VIEW IF EXISTS vw_volunteer_leaderboard;
CREATE VIEW vw_volunteer_leaderboard AS
SELECT 
    v.volunteer_id,
    v.full_name AS volunteer_name,
    v.email,
    v.city,
    COALESCE(vh.total_hours, 0.00) AS total_hours_contributed,
    COALESCE(c.total_certificates, 0) AS total_certificates,
    COALESCE(a.opportunities_completed, 0) AS opportunities_completed,
    CASE 
        WHEN COALESCE(vh.total_hours, 0) >= 100 THEN 'PLATINUM'
        WHEN COALESCE(vh.total_hours, 0) >= 50 THEN 'GOLD'
        WHEN COALESCE(vh.total_hours, 0) >= 20 THEN 'SILVER'
        ELSE 'BRONZE'
    END AS computed_tier,
    DENSE_RANK() OVER (ORDER BY COALESCE(vh.total_hours, 0) DESC) AS global_rank
FROM volunteers v
LEFT JOIN (
    SELECT volunteer_id, SUM(hours_logged) AS total_hours
    FROM volunteer_hours
    WHERE verified_by_ngo = 1
    GROUP BY volunteer_id
) vh ON v.volunteer_id = vh.volunteer_id
LEFT JOIN (
    SELECT volunteer_id, COUNT(*) AS total_certificates
    FROM certificates
    GROUP BY volunteer_id
) c ON v.volunteer_id = c.volunteer_id
LEFT JOIN (
    SELECT volunteer_id, COUNT(DISTINCT opportunity_id) AS opportunities_completed
    FROM applications
    WHERE status = 'accepted'
    GROUP BY volunteer_id
) a ON v.volunteer_id = a.volunteer_id;

DROP VIEW IF EXISTS vw_ngo_impact_summary;
CREATE VIEW vw_ngo_impact_summary AS
SELECT 
    n.ngo_id,
    n.organization_name AS org_name,
    n.cause_category,
    n.city,
    n.verification_status,
    COUNT(DISTINCT o.opportunity_id) AS total_campaigns,
    COUNT(DISTINCT vh.volunteer_id) AS unique_volunteers_engaged,
    COALESCE(SUM(vh.hours_logged), 0.00) AS total_volunteer_hours_verified
FROM ngos n
LEFT JOIN opportunities o ON n.ngo_id = o.ngo_id
LEFT JOIN shifts s ON o.opportunity_id = s.opportunity_id
LEFT JOIN volunteer_hours vh ON s.shift_id = vh.shift_id AND vh.verified_by_ngo = 1
GROUP BY n.ngo_id, n.organization_name, n.cause_category, n.city, n.verification_status;

DROP VIEW IF EXISTS vw_shift_occupancy;
CREATE VIEW vw_shift_occupancy AS
SELECT 
    s.shift_id,
    s.opportunity_id,
    o.title AS opportunity_title,
    n.organization_name AS org_name,
    s.shift_date,
    s.start_time,
    s.end_time,
    s.capacity,
    s.status AS shift_status
FROM shifts s
JOIN opportunities o ON s.opportunity_id = o.opportunity_id
JOIN ngos n ON o.ngo_id = n.ngo_id;

-- ============================================================================
-- 4. Database Triggers
-- ============================================================================
DROP TRIGGER IF EXISTS trg_audit_opportunity_insert;
DELIMITER //
CREATE TRIGGER trg_audit_opportunity_insert
AFTER INSERT ON opportunities
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (table_name, action_type, entity_id, details, performed_at)
    VALUES (
        'opportunities',
        'INSERT',
        NEW.opportunity_id,
        JSON_OBJECT('title', NEW.title, 'ngo_id', NEW.ngo_id, 'city', NEW.city),
        NOW()
    );
END //
DELIMITER ;

DROP TRIGGER IF EXISTS trg_audit_ngo_verification;
DELIMITER //
CREATE TRIGGER trg_audit_ngo_verification
AFTER UPDATE ON ngos
FOR EACH ROW
BEGIN
    IF OLD.verification_status != NEW.verification_status THEN
        INSERT INTO audit_logs (table_name, action_type, entity_id, details, performed_at)
        VALUES (
            'ngos',
            'UPDATE_STATUS',
            NEW.ngo_id,
            JSON_OBJECT('old_status', OLD.verification_status, 'new_status', NEW.verification_status),
            NOW()
        );
    END IF;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS trg_update_volunteer_hours_after_verification;
DELIMITER //
CREATE TRIGGER trg_update_volunteer_hours_after_verification
AFTER UPDATE ON volunteer_hours
FOR EACH ROW
BEGIN
    IF OLD.verified_by_ngo = 0 AND NEW.verified_by_ngo = 1 THEN
        INSERT INTO audit_logs (table_name, action_type, entity_id, details, performed_at)
        VALUES (
            'volunteer_hours',
            'VERIFY_HOURS',
            NEW.record_id,
            JSON_OBJECT('volunteer_id', NEW.volunteer_id, 'hours_logged', NEW.hours_logged),
            NOW()
        );
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- 5. Stored Procedures with ACID Transactions
-- ============================================================================
DROP PROCEDURE IF EXISTS sp_apply_for_shift;
DELIMITER //
CREATE PROCEDURE sp_apply_for_shift (
    IN p_application_id VARCHAR(36),
    IN p_opportunity_id VARCHAR(36),
    IN p_volunteer_id VARCHAR(36),
    OUT p_status_code INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_required INT;
    DECLARE v_accepted INT;
    DECLARE v_already_applied INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = 500;
        SET p_message = 'Transaction rolled back: Database error during shift enrollment.';
    END;

    START TRANSACTION;

    -- 1. Check opportunity capacity with lock
    SELECT required_volunteers, accepted_volunteers INTO v_required, v_accepted
    FROM opportunities
    WHERE opportunity_id = p_opportunity_id FOR UPDATE;

    IF v_required IS NULL THEN
        ROLLBACK;
        SET p_status_code = 404;
        SET p_message = 'Error: Target opportunity not found.';
    ELSEIF v_accepted >= v_required THEN
        ROLLBACK;
        SET p_status_code = 409;
        SET p_message = 'Error: Opportunity has already reached maximum volunteer capacity.';
    ELSE
        -- 2. Check duplicate application
        SELECT COUNT(*) INTO v_already_applied
        FROM applications
        WHERE opportunity_id = p_opportunity_id AND volunteer_id = p_volunteer_id;

        IF v_already_applied > 0 THEN
            ROLLBACK;
            SET p_status_code = 400;
            SET p_message = 'Error: Volunteer has already applied for this opportunity.';
        ELSE
            -- 3. Insert application record
            INSERT INTO applications (application_id, opportunity_id, volunteer_id, status, match_score, applied_at)
            VALUES (p_application_id, p_opportunity_id, p_volunteer_id, 'accepted', 0.88, NOW());

            -- 4. Atomically update accepted count
            UPDATE opportunities 
            SET accepted_volunteers = accepted_volunteers + 1 
            WHERE opportunity_id = p_opportunity_id;

            -- 5. Record audit trail
            INSERT INTO audit_logs (table_name, action_type, entity_id, details, performed_at)
            VALUES ('applications', 'ENROLL_VOLUNTEER', p_application_id, JSON_OBJECT('volunteer_id', p_volunteer_id, 'opportunity_id', p_opportunity_id), NOW());

            COMMIT;
            SET p_status_code = 200;
            SET p_message = 'Success: Volunteer enrolled atomically in opportunity shift.';
        END IF;
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_verify_and_issue_certificate;
DELIMITER //
CREATE PROCEDURE sp_verify_and_issue_certificate (
    IN p_certificate_id VARCHAR(36),
    IN p_certificate_code VARCHAR(50),
    IN p_volunteer_id VARCHAR(36),
    IN p_opportunity_id VARCHAR(36),
    IN p_total_hours DECIMAL(5,2),
    IN p_certificate_url VARCHAR(255),
    OUT p_status_code INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_already_issued INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = 500;
        SET p_message = 'Transaction aborted: Internal error issuing certificate.';
    END;

    START TRANSACTION;

    SELECT COUNT(*) INTO v_already_issued
    FROM certificates
    WHERE volunteer_id = p_volunteer_id AND opportunity_id = p_opportunity_id;

    IF v_already_issued > 0 THEN
        ROLLBACK;
        SET p_status_code = 409;
        SET p_message = 'Error: A certificate has already been issued for this volunteer and campaign.';
    ELSE
        INSERT INTO certificates (certificate_id, certificate_code, volunteer_id, opportunity_id, issue_date, total_hours_credited, certificate_url)
        VALUES (p_certificate_id, p_certificate_code, p_volunteer_id, p_opportunity_id, CURDATE(), p_total_hours, p_certificate_url);

        INSERT INTO audit_logs (table_name, action_type, entity_id, details, performed_at)
        VALUES ('certificates', 'ISSUE_CERTIFICATE', p_certificate_id, JSON_OBJECT('volunteer_id', p_volunteer_id, 'code', p_certificate_code), NOW());

        COMMIT;
        SET p_status_code = 200;
        SET p_message = 'Success: Certificate issued and registered in immutable database ledger.';
    END IF;
END //
DELIMITER ;
