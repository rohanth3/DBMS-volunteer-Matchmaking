-- ============================================================================
-- DBMS Level 3 Project: NGO Volunteer Matchmaking System
-- Course: DBMS Experiential Learning - PES University
-- Team Members:
--   1. Rishi   (SRN: PES1UG24AM224)
--   2. Rohanth (SRN: PES1UG24AM227)
-- File: 04_triggers.sql - Advanced Database Triggers
-- Demonstrates: Automated business rules, state synchronization, audit logging
-- ============================================================================

-- Clean drop of triggers if previously created
DROP TRIGGER IF EXISTS trg_increment_shift_filled_count;
DROP TRIGGER IF EXISTS trg_decrement_shift_filled_count;
DROP TRIGGER IF EXISTS trg_update_volunteer_hours;
DROP TRIGGER IF EXISTS trg_audit_opportunity_insert;
DROP TRIGGER IF EXISTS trg_audit_ngo_verification;

-- ============================================================================
-- Trigger 1: Automatically increment shift filled_count when volunteer enrolls
-- ============================================================================
CREATE TRIGGER trg_increment_shift_filled_count
AFTER INSERT ON shift_assignments
FOR EACH ROW
BEGIN
    UPDATE shifts 
    SET filled_count = filled_count + 1
    WHERE shift_id = NEW.shift_id;
END;

-- ============================================================================
-- Trigger 2: Automatically decrement shift filled_count when enrollment is cancelled
-- ============================================================================
CREATE TRIGGER trg_decrement_shift_filled_count
AFTER DELETE ON shift_assignments
FOR EACH ROW
BEGIN
    UPDATE shifts 
    SET filled_count = CASE WHEN filled_count > 0 THEN filled_count - 1 ELSE 0 END
    WHERE shift_id = OLD.shift_id;
END;

-- ============================================================================
-- Trigger 3: Automatically update volunteer total hours and tier upon verification
-- ============================================================================
CREATE TRIGGER trg_update_volunteer_hours
AFTER UPDATE ON shift_assignments
FOR EACH ROW
WHEN (NEW.attendance_status = 'ATTENDED' AND NEW.verified_by_ngo = 1 AND (OLD.verified_by_ngo = 0 OR OLD.attendance_status != 'ATTENDED'))
BEGIN
    UPDATE volunteers 
    SET total_hours_contributed = total_hours_contributed + NEW.hours_logged,
        volunteer_level = CASE 
            WHEN (total_hours_contributed + NEW.hours_logged) >= 100 THEN 'PLATINUM'
            WHEN (total_hours_contributed + NEW.hours_logged) >= 50 THEN 'GOLD'
            WHEN (total_hours_contributed + NEW.hours_logged) >= 20 THEN 'SILVER'
            ELSE 'BRONZE'
        END
    WHERE volunteer_id = NEW.volunteer_id;
    
    INSERT INTO audit_logs (log_id, table_name, action, record_id, changed_by, change_details, logged_at)
    VALUES (
        hex(randomblob(16)),
        'shift_assignments',
        'UPDATE',
        NEW.assignment_id,
        NEW.volunteer_id,
        'Logged and verified ' || CAST(NEW.hours_logged AS TEXT) || ' volunteer hours.',
        CURRENT_TIMESTAMP
    );
END;

-- ============================================================================
-- Trigger 4: Audit logging on new opportunity creation
-- ============================================================================
CREATE TRIGGER trg_audit_opportunity_insert
AFTER INSERT ON opportunities
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (log_id, table_name, action, record_id, changed_by, change_details, logged_at)
    VALUES (
        hex(randomblob(16)),
        'opportunities',
        'INSERT',
        NEW.opportunity_id,
        NEW.ngo_id,
        'Created opportunity: ' || NEW.title || ' in category ' || NEW.cause_category,
        CURRENT_TIMESTAMP
    );
END;

-- ============================================================================
-- Trigger 5: Audit logging on NGO verification status change
-- ============================================================================
CREATE TRIGGER trg_audit_ngo_verification
AFTER UPDATE OF verification_status ON ngos
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (log_id, table_name, action, record_id, changed_by, change_details, logged_at)
    VALUES (
        hex(randomblob(16)),
        'ngos',
        'UPDATE',
        NEW.ngo_id,
        NEW.verified_by,
        'Verification status changed from ' || OLD.verification_status || ' to ' || NEW.verification_status,
        CURRENT_TIMESTAMP
    );
END;

