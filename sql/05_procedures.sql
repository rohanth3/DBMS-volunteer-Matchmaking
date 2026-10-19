-- ============================================================================
-- DBMS Level 3 Project: NGO Volunteer Matchmaking System
-- Course: DBMS Experiential Learning - PES University
-- Team Members:
--   1. Rishi   (SRN: PES1UG24AM224)
--   2. Rohanth (SRN: PES1UG24AM227)
-- File: 05_procedures.sql - Stored Procedures and Transaction Workflows
-- Demonstrates: ACID Transactions, Conditional Logic, Error Handling, Atomic Rollbacks
-- ============================================================================

-- ============================================================================
-- PROCEDURE 1: sp_apply_for_shift
-- Transactional shift application with capacity validation and duplicate prevention.
-- ============================================================================
-- In MySQL:
DELIMITER //
CREATE PROCEDURE sp_apply_for_shift (
    IN p_assignment_id VARCHAR(36),
    IN p_shift_id VARCHAR(36),
    IN p_volunteer_id VARCHAR(36),
    IN p_application_id VARCHAR(36),
    OUT p_status_code INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_capacity INT;
    DECLARE v_filled INT;
    DECLARE v_existing_count INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = 500;
        SET p_message = 'Transaction aborted: Internal database error during shift enrollment.';
    END;

    START TRANSACTION;

    -- 1. Check if shift exists and retrieve capacity
    SELECT capacity, filled_count INTO v_capacity, v_filled
    FROM shifts
    WHERE shift_id = p_shift_id FOR UPDATE;

    IF v_capacity IS NULL THEN
        ROLLBACK;
        SET p_status_code = 404;
        SET p_message = 'Error: Target shift does not exist.';
    ELSEIF v_filled >= v_capacity THEN
        ROLLBACK;
        SET p_status_code = 409;
        SET p_message = 'Error: Shift is already at maximum capacity.';
    ELSE
        -- 2. Check if volunteer is already enrolled in this shift
        SELECT COUNT(*) INTO v_existing_count
        FROM shift_assignments
        WHERE shift_id = p_shift_id AND volunteer_id = p_volunteer_id;

        IF v_existing_count > 0 THEN
            ROLLBACK;
            SET p_status_code = 400;
            SET p_message = 'Error: Volunteer is already enrolled in this shift.';
        ELSE
            -- 3. Insert assignment record
            INSERT INTO shift_assignments (
                assignment_id, shift_id, volunteer_id, application_id, 
                attendance_status, hours_logged, verified_by_ngo, feedback, created_at
            ) VALUES (
                p_assignment_id, p_shift_id, p_volunteer_id, p_application_id, 
                'REGISTERED', 0.00, FALSE, NULL, NOW()
            );

            -- 4. Update shift filled count
            UPDATE shifts 
            SET filled_count = filled_count + 1 
            WHERE shift_id = p_shift_id;

            -- 5. Record audit log
            INSERT INTO audit_logs (log_id, table_name, action, record_id, changed_by, change_details, logged_at)
            VALUES (UUID(), 'shift_assignments', 'INSERT', p_assignment_id, p_volunteer_id, 'Successfully applied to shift', NOW());

            COMMIT;
            SET p_status_code = 200;
            SET p_message = 'Success: Volunteer successfully enrolled in shift.';
        END IF;
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- PROCEDURE 2: sp_verify_and_issue_certificate
-- Atomically generates and issues a verifiable certificate with verification code.
-- ============================================================================
DELIMITER //
CREATE PROCEDURE sp_verify_and_issue_certificate (
    IN p_certificate_id VARCHAR(36),
    IN p_certificate_code VARCHAR(64),
    IN p_volunteer_id VARCHAR(36),
    IN p_ngo_id VARCHAR(36),
    IN p_opportunity_id VARCHAR(36),
    IN p_title VARCHAR(255),
    IN p_hours DECIMAL(10, 2),
    IN p_signatory_name VARCHAR(150),
    IN p_signatory_role VARCHAR(100),
    IN p_verification_url VARCHAR(500),
    OUT p_status_code INT,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_already_issued INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = 500;
        SET p_message = 'Transaction aborted: Failed to issue certificate.';
    END;

    START TRANSACTION;

    SELECT COUNT(*) INTO v_already_issued
    FROM certificates
    WHERE volunteer_id = p_volunteer_id AND opportunity_id = p_opportunity_id;

    IF v_already_issued > 0 THEN
        ROLLBACK;
        SET p_status_code = 409;
        SET p_message = 'A certificate has already been issued for this volunteer and opportunity.';
    ELSE
        INSERT INTO certificates (
            certificate_id, certificate_code, volunteer_id, ngo_id, 
            opportunity_id, title, total_hours_credited, issued_date, 
            signatory_name, signatory_role, verification_url, created_at
        ) VALUES (
            p_certificate_id, p_certificate_code, p_volunteer_id, p_ngo_id, 
            p_opportunity_id, p_title, p_hours, CURDATE(), 
            p_signatory_name, p_signatory_role, p_verification_url, NOW()
        );

        INSERT INTO audit_logs (log_id, table_name, action, record_id, changed_by, change_details, logged_at)
        VALUES (UUID(), 'certificates', 'INSERT', p_certificate_id, p_ngo_id, 'Issued certificate of completion', NOW());

        COMMIT;
        SET p_status_code = 200;
        SET p_message = 'Certificate generated and registered successfully.';
    END IF;
END //
DELIMITER ;

