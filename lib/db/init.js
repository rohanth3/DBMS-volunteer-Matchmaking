// ============================================================================
// DBMS Level 3 Project: NGO Volunteer Matchmaking System
// Team: Rishi (PES1UG24AM224) & Rohanth (PES1UG24AM227)
// File: lib/db/init.js
// Automated Database Bootstrapper & Vector Embedding Generator
// ============================================================================

import { generateEmbedding, buildVolunteerEmbeddingText, buildOpportunityEmbeddingText } from '../vector/embeddings.js';

export function initializeDatabase(db) {
  // Step 1: Execute Table Definitions (DDL)
  db.exec(`
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS impact_metrics;
    DROP TABLE IF EXISTS certificates;
    DROP TABLE IF EXISTS shift_assignments;
    DROP TABLE IF EXISTS volunteer_applications;
    DROP TABLE IF EXISTS shifts;
    DROP TABLE IF EXISTS opportunities;
    DROP TABLE IF EXISTS ngos;
    DROP TABLE IF EXISTS volunteers;
    DROP TABLE IF EXISTS users;

    -- USERS
    CREATE TABLE users (
        user_id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('ADMIN', 'NGO', 'VOLUNTEER')),
        full_name TEXT NOT NULL,
        phone TEXT,
        avatar_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- VOLUNTEERS
    CREATE TABLE volunteers (
        volunteer_id TEXT PRIMARY KEY,
        bio TEXT,
        skills TEXT NOT NULL,
        interests TEXT NOT NULL,
        experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0 AND experience_years <= 60),
        location_city TEXT NOT NULL,
        location_state TEXT NOT NULL,
        availability_type TEXT DEFAULT 'FLEXIBLE' CHECK (availability_type IN ('WEEKDAYS', 'WEEKENDS', 'FLEXIBLE', 'FULL_TIME')),
        weekly_hours_capacity INTEGER DEFAULT 10 CHECK (weekly_hours_capacity > 0 AND weekly_hours_capacity <= 168),
        total_hours_contributed REAL DEFAULT 0.0 CHECK (total_hours_contributed >= 0),
        volunteer_level TEXT DEFAULT 'BRONZE' CHECK (volunteer_level IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
        profile_vector TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (volunteer_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    -- NGOS
    CREATE TABLE ngos (
        ngo_id TEXT PRIMARY KEY,
        org_name TEXT NOT NULL,
        registration_number TEXT NOT NULL UNIQUE,
        darpan_id TEXT UNIQUE,
        website_url TEXT,
        cause_category TEXT NOT NULL CHECK (cause_category IN ('Education', 'Healthcare', 'Environment', 'Animal Welfare', 'Disaster Relief', 'Women Empowerment', 'Elderly Care', 'Community Development')),
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
        verified_by TEXT,
        verified_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ngo_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL
    );

    -- OPPORTUNITIES
    CREATE TABLE opportunities (
        opportunity_id TEXT PRIMARY KEY,
        ngo_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        cause_category TEXT NOT NULL,
        required_skills TEXT NOT NULL,
        experience_required INTEGER DEFAULT 0 CHECK (experience_required >= 0),
        location_city TEXT NOT NULL,
        location_type TEXT DEFAULT 'ON_SITE' CHECK (location_type IN ('ON_SITE', 'REMOTE', 'HYBRID')),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT DEFAULT 'OPEN' CHECK (status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
        max_volunteers INTEGER DEFAULT 10 CHECK (max_volunteers > 0),
        tags TEXT DEFAULT 'community,volunteering',
        opportunity_vector TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_opportunity_dates CHECK (end_date >= start_date),
        FOREIGN KEY (ngo_id) REFERENCES ngos(ngo_id) ON DELETE CASCADE
    );

    -- SHIFTS
    CREATE TABLE shifts (
        shift_id TEXT PRIMARY KEY,
        opportunity_id TEXT NOT NULL,
        shift_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        hours REAL NOT NULL CHECK (hours > 0 AND hours <= 24),
        capacity INTEGER NOT NULL CHECK (capacity > 0),
        filled_count INTEGER DEFAULT 0 CHECK (filled_count >= 0),
        shift_status TEXT DEFAULT 'SCHEDULED' CHECK (shift_status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
        CONSTRAINT chk_shift_capacity CHECK (filled_count <= capacity),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE CASCADE
    );

    -- VOLUNTEER_APPLICATIONS
    CREATE TABLE volunteer_applications (
        application_id TEXT PRIMARY KEY,
        volunteer_id TEXT NOT NULL,
        opportunity_id TEXT NOT NULL,
        status TEXT DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
        semantic_match_score REAL DEFAULT 0.0 CHECK (semantic_match_score >= 0.0 AND semantic_match_score <= 1.0),
        notes TEXT,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME,
        UNIQUE(volunteer_id, opportunity_id),
        FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE CASCADE
    );

    -- SHIFT_ASSIGNMENTS
    CREATE TABLE shift_assignments (
        assignment_id TEXT PRIMARY KEY,
        shift_id TEXT NOT NULL,
        volunteer_id TEXT NOT NULL,
        application_id TEXT NOT NULL,
        attendance_status TEXT DEFAULT 'REGISTERED' CHECK (attendance_status IN ('REGISTERED', 'ATTENDED', 'ABSENT', 'EXCUSED')),
        hours_logged REAL DEFAULT 0.0 CHECK (hours_logged >= 0),
        verified_by_ngo INTEGER DEFAULT 0,
        feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(shift_id, volunteer_id),
        FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE CASCADE,
        FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
        FOREIGN KEY (application_id) REFERENCES volunteer_applications(application_id) ON DELETE CASCADE
    );

    -- CERTIFICATES
    CREATE TABLE certificates (
        certificate_id TEXT PRIMARY KEY,
        certificate_code TEXT NOT NULL UNIQUE,
        volunteer_id TEXT NOT NULL,
        ngo_id TEXT NOT NULL,
        opportunity_id TEXT NOT NULL,
        title TEXT NOT NULL,
        total_hours_credited REAL NOT NULL CHECK (total_hours_credited > 0),
        issued_date TEXT NOT NULL,
        signatory_name TEXT NOT NULL,
        signatory_role TEXT NOT NULL,
        verification_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
        FOREIGN KEY (ngo_id) REFERENCES ngos(ngo_id) ON DELETE CASCADE,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE CASCADE
    );

    -- IMPACT_METRICS
    CREATE TABLE impact_metrics (
        metric_id TEXT PRIMARY KEY,
        opportunity_id TEXT NOT NULL,
        ngo_id TEXT NOT NULL,
        beneficiaries_served INTEGER DEFAULT 0 CHECK (beneficiaries_served >= 0),
        meals_distributed INTEGER DEFAULT 0 CHECK (meals_distributed >= 0),
        trees_planted INTEGER DEFAULT 0 CHECK (trees_planted >= 0),
        students_tutored INTEGER DEFAULT 0 CHECK (students_tutored >= 0),
        waste_cleaned_kg REAL DEFAULT 0.0 CHECK (waste_cleaned_kg >= 0),
        recorded_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
        FOREIGN KEY (ngo_id) REFERENCES ngos(ngo_id) ON DELETE CASCADE
    );

    -- AUDIT_LOGS
    CREATE TABLE audit_logs (
        log_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
        record_id TEXT NOT NULL,
        changed_by TEXT,
        change_details TEXT,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL
    );
  `);

  // Step 2: Create Performance Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_volunteers_city_avail ON volunteers(location_city, availability_type);
    CREATE INDEX IF NOT EXISTS idx_opp_status_cause_city ON opportunities(status, cause_category, location_city);
    CREATE INDEX IF NOT EXISTS idx_shifts_opp_date ON shifts(opportunity_id, shift_date);
    CREATE INDEX IF NOT EXISTS idx_applications_vol_status ON volunteer_applications(volunteer_id, status);
    CREATE INDEX IF NOT EXISTS idx_assignments_shift_status ON shift_assignments(shift_id, attendance_status);
    CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);
    CREATE INDEX IF NOT EXISTS idx_impact_opp_date ON impact_metrics(opportunity_id, recorded_date);
    CREATE INDEX IF NOT EXISTS idx_ngos_verification ON ngos(verification_status);
  `);

  // Step 3: Create Views
  db.exec(`
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

    CREATE VIEW IF NOT EXISTS vw_ngo_impact_summary AS
    SELECT 
        n.ngo_id,
        n.org_name,
        n.cause_category,
        n.city,
        n.verification_status,
        COUNT(DISTINCT o.opportunity_id) AS total_campaigns,
        COUNT(DISTINCT sa.volunteer_id) AS unique_volunteers_engaged,
        COALESCE(SUM(sa.hours_logged), 0.0) AS total_volunteer_hours_verified,
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
        ROUND((CAST(s.filled_count AS REAL) / CAST(s.capacity AS REAL)) * 100, 1) AS occupancy_percentage,
        s.shift_status
    FROM shifts s
    JOIN opportunities o ON s.opportunity_id = o.opportunity_id
    JOIN ngos n ON o.ngo_id = n.ngo_id;

    CREATE VIEW IF NOT EXISTS volunteer_hours AS
    SELECT 
        sa.assignment_id AS record_id,
        sa.assignment_id,
        sa.shift_id,
        sa.volunteer_id,
        sa.application_id,
        sa.attendance_status,
        sa.hours_logged,
        sa.verified_by_ngo,
        sa.feedback AS feedback_notes,
        sa.feedback,
        sa.created_at
    FROM shift_assignments sa;

    CREATE VIEW IF NOT EXISTS applications AS
    SELECT 
        va.application_id,
        va.volunteer_id,
        va.opportunity_id,
        va.status,
        va.semantic_match_score,
        va.notes,
        va.applied_at,
        va.reviewed_at
    FROM volunteer_applications va;
  `);

  // Step 4: Create Triggers
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_instead_update_volunteer_hours
    INSTEAD OF UPDATE ON volunteer_hours
    FOR EACH ROW
    BEGIN
        UPDATE shift_assignments
        SET verified_by_ngo = NEW.verified_by_ngo,
            hours_logged = NEW.hours_logged,
            attendance_status = CASE WHEN NEW.verified_by_ngo = 1 THEN 'ATTENDED' ELSE attendance_status END,
            feedback = COALESCE(NEW.feedback_notes, NEW.feedback, feedback)
        WHERE assignment_id = OLD.record_id OR assignment_id = OLD.assignment_id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_instead_insert_volunteer_hours
    INSTEAD OF INSERT ON volunteer_hours
    FOR EACH ROW
    BEGIN
        INSERT OR REPLACE INTO shift_assignments (
            assignment_id, shift_id, volunteer_id, application_id, 
            attendance_status, hours_logged, verified_by_ngo, feedback, created_at
        ) VALUES (
            COALESCE(NEW.record_id, NEW.assignment_id, hex(randomblob(8))),
            NEW.shift_id,
            NEW.volunteer_id,
            COALESCE(NEW.application_id, 'app-direct'),
            COALESCE(NEW.attendance_status, 'REGISTERED'),
            COALESCE(NEW.hours_logged, 0.0),
            COALESCE(NEW.verified_by_ngo, 0),
            COALESCE(NEW.feedback_notes, NEW.feedback),
            COALESCE(NEW.created_at, datetime('now'))
        );
    END;

    CREATE TRIGGER IF NOT EXISTS trg_instead_insert_applications
    INSTEAD OF INSERT ON applications
    FOR EACH ROW
    BEGIN
        INSERT OR REPLACE INTO volunteer_applications (
            application_id, volunteer_id, opportunity_id, status, semantic_match_score, notes, applied_at
        ) VALUES (
            NEW.application_id,
            NEW.volunteer_id,
            NEW.opportunity_id,
            COALESCE(NEW.status, 'APPLIED'),
            COALESCE(NEW.semantic_match_score, 0.0),
            NEW.notes,
            COALESCE(NEW.applied_at, datetime('now'))
        );
    END;
    CREATE TRIGGER IF NOT EXISTS trg_increment_shift_filled_count
    AFTER INSERT ON shift_assignments
    FOR EACH ROW
    BEGIN
        UPDATE shifts 
        SET filled_count = filled_count + 1
        WHERE shift_id = NEW.shift_id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_decrement_shift_filled_count
    AFTER DELETE ON shift_assignments
    FOR EACH ROW
    BEGIN
        UPDATE shifts 
        SET filled_count = CASE WHEN filled_count > 0 THEN filled_count - 1 ELSE 0 END
        WHERE shift_id = OLD.shift_id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_update_volunteer_hours
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
            datetime('now')
        );
    END;

    CREATE TRIGGER IF NOT EXISTS trg_audit_opportunity_insert
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
            datetime('now')
        );
    END;

    CREATE TRIGGER IF NOT EXISTS trg_audit_ngo_verification
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
            datetime('now')
        );
    END;
  `);

  // Step 5: Insert Seed Data
  db.exec(`
    INSERT INTO users (user_id, email, password_hash, role, full_name, phone, is_active) VALUES
    ('u_admin_1', 'rishi.admin@pes.edu', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'ADMIN', 'Rishi (Admin - PES1UG24AM224)', '+91-9876543210', 1),
    ('u_admin_2', 'rohanth.admin@pes.edu', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'ADMIN', 'Rohanth (Admin - PES1UG24AM227)', '+91-9876543211', 1),
    ('u_vol_1', 'rishi@pes.edu', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'VOLUNTEER', 'Rishi (PES1UG24AM224)', '+91-9845012345', 1),
    ('u_vol_2', 'rohanth@pes.edu', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'VOLUNTEER', 'Rohanth (PES1UG24AM227)', '+91-9845067890', 1),
    ('u_vol_3', 'priya.sharma@gmail.com', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'VOLUNTEER', 'Priya Sharma', '+91-9123456789', 1),
    ('u_vol_4', 'amit.patel@gmail.com', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'VOLUNTEER', 'Amit Patel', '+91-9988776655', 1),
    ('u_vol_5', 'sneha.reddy@gmail.com', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'VOLUNTEER', 'Sneha Reddy', '+91-9011223344', 1),
    ('u_ngo_1', 'contact@teachfortomorrow.org', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'NGO', 'Teach For Tomorrow Foundation', '+91-8023456789', 1),
    ('u_ngo_2', 'info@greenearthkarnataka.org', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'NGO', 'Green Earth Karnataka', '+91-8034567890', 1),
    ('u_ngo_3', 'help@careandcure.org', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'NGO', 'Care & Cure Health Trust', '+91-8045678901', 1),
    ('u_ngo_4', 'support@pawsandtails.org', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'NGO', 'Paws & Tails Animal Shelter', '+91-8056789012', 1),
    ('u_ngo_5', 'relief@hoperelief.org', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'NGO', 'Hope Disaster Relief Aid', '+91-8067890123', 1),
    ('ngo-001', 'contact@brightfutures.org', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'NGO', 'Bright Futures Trust', '+91-8012345678', 1);

    INSERT INTO volunteers (volunteer_id, bio, skills, interests, experience_years, location_city, location_state, availability_type, weekly_hours_capacity, total_hours_contributed, volunteer_level) VALUES
    ('u_vol_1', 'Computer Science student passionate about teaching underprivileged children and environmental cleanup.', 'Teaching, Python, Web Development, Mathematics, English, Community Organizing', 'Education, Environment, Youth Empowerment', 3, 'Bengaluru', 'Karnataka', 'WEEKENDS', 15, 34.50, 'SILVER'),
    ('u_vol_2', 'Data Science enthusiast and certified first aid responder with experience in disaster management and animal rescue.', 'First Aid, Data Analysis, Logistics, Animal Care, Emergency Management, Event Coordination', 'Healthcare, Animal Welfare, Disaster Relief', 2, 'Bengaluru', 'Karnataka', 'FLEXIBLE', 20, 48.00, 'SILVER'),
    ('u_vol_3', 'Mathematics teacher and STEM mentor aiming to build strong educational foundations for girl students.', 'STEM Mentorship, Mathematics, Physics, Public Speaking, Content Writing', 'Education, Women Empowerment', 4, 'Bengaluru', 'Karnataka', 'WEEKDAYS', 10, 62.00, 'GOLD'),
    ('u_vol_4', 'Paramedic volunteer with rapid response training and disaster relief field experience.', 'Emergency First Aid, CPR, Fleet Management, Supply Distribution, Search & Rescue', 'Healthcare, Disaster Relief, Community Development', 5, 'Bengaluru', 'Karnataka', 'WEEKENDS', 12, 115.00, 'PLATINUM'),
    ('u_vol_5', 'Environmental biology student engaged in urban afforestation, seed ball making, and waste segregation drives.', 'Tree Plantation, Soil Testing, Miyawaki Forests, Waste Management, Environmental Advocacy', 'Environment, Climate Action', 2, 'Bengaluru', 'Karnataka', 'FLEXIBLE', 10, 18.00, 'BRONZE');

    INSERT INTO ngos (ngo_id, org_name, registration_number, darpan_id, website_url, cause_category, address, city, state, contact_person, contact_email, contact_phone, verification_status, verified_by, verified_at) VALUES
    ('u_ngo_1', 'Teach For Tomorrow Foundation', 'REG-KA-2018-00912', 'KA/2018/0192834', 'https://teachfortomorrow.org', 'Education', '12th Main, Indiranagar', 'Bengaluru', 'Karnataka', 'Dr. Sunita Rao', 'contact@teachfortomorrow.org', '+91-8023456789', 'VERIFIED', 'u_admin_1', '2026-01-10 10:00:00'),
    ('u_ngo_2', 'Green Earth Karnataka', 'REG-KA-2019-01452', 'KA/2019/0283741', 'https://greenearthkarnataka.org', 'Environment', 'Jayanagar 4th Block', 'Bengaluru', 'Karnataka', 'Vikram Joshi', 'info@greenearthkarnataka.org', '+91-8034567890', 'VERIFIED', 'u_admin_1', '2026-01-15 11:30:00'),
    ('u_ngo_3', 'Care & Cure Health Trust', 'REG-KA-2016-00341', 'KA/2016/0091823', 'https://careandcure.org', 'Healthcare', 'Koramangala 5th Block', 'Bengaluru', 'Karnataka', 'Dr. Anita Deshmukh', 'help@careandcure.org', '+91-8045678901', 'VERIFIED', 'u_admin_2', '2026-02-01 09:15:00'),
    ('u_ngo_4', 'Paws & Tails Animal Shelter', 'REG-KA-2021-02981', 'KA/2021/0349182', 'https://pawsandtails.org', 'Animal Welfare', 'Whitefield Main Road', 'Bengaluru', 'Karnataka', 'Rahul Menon', 'support@pawsandtails.org', '+91-8056789012', 'VERIFIED', 'u_admin_2', '2026-02-10 14:00:00'),
    ('u_ngo_5', 'Hope Disaster Relief Aid', 'REG-KA-2023-04112', 'KA/2023/0481920', 'https://hoperelief.org', 'Disaster Relief', 'Hebbal Ring Road', 'Bengaluru', 'Karnataka', 'Sanjay Hegde', 'relief@hoperelief.org', '+91-8067890123', 'PENDING', NULL, NULL),
    ('ngo-001', 'Bright Futures Trust', 'REG-KA-2020-05891', 'KA/2020/0391024', 'https://brightfutures.org', 'Education', 'Indiranagar 100ft Road', 'Bengaluru', 'Karnataka', 'Ananya Sen', 'contact@brightfutures.org', '+91-8012345678', 'VERIFIED', 'u_admin_1', '2026-01-20 12:00:00');

    INSERT INTO opportunities (opportunity_id, ngo_id, title, description, cause_category, required_skills, experience_required, location_city, location_type, start_date, end_date, status, max_volunteers, tags) VALUES
    ('opp_1', 'u_ngo_1', 'Underprivileged Youth Coding & Math Boot Camp', 'Conduct interactive weekend classes teaching foundational arithmetic, problem-solving, and introductory Python/Scratch programming to middle school students from low-income communities.', 'Education', 'Teaching, Mathematics, Python, English, Mentorship', 1, 'Bengaluru', 'HYBRID', '2026-11-05', '2026-12-20', 'OPEN', 15, 'coding,education,kids,python,math'),
    ('opp_2', 'u_ngo_2', 'Urban Lake Afforestation & Miyawaki Forest Drive', 'Hands-on weekend drive to restore native biodiversity around Bellandur lake by planting 1,000 indigenous saplings using the dense Miyawaki methodology and installing drip irrigation.', 'Environment', 'Tree Plantation, Soil Preparation, Environmental Science, Physical Fitness', 0, 'Bengaluru', 'ON_SITE', '2026-11-08', '2026-11-29', 'OPEN', 40, 'environment,tree-planting,climate,miyawaki'),
    ('opp_3', 'u_ngo_3', 'Free Community Health Screening & First Aid Camp', 'Support medical doctors in conducting non-communicable disease screenings (blood glucose, blood pressure, BMI) and lead basic community first aid workshops in urban slums.', 'Healthcare', 'First Aid, Nursing, Vital Signs Measurement, Patient Assistance, Hindi/Kannada', 1, 'Bengaluru', 'ON_SITE', '2026-11-12', '2026-11-26', 'OPEN', 20, 'healthcare,medical,first-aid,screening'),
    ('opp_4', 'u_ngo_4', 'Shelter Dog Rehabilitation & Adoption Festival Support', 'Assist shelter caretakers in grooming, socializing rescued stray dogs, managing adoption inquiry desks, and guiding visiting families during the weekend adoption festival.', 'Animal Welfare', 'Animal Care, Dog Walking, Event Coordination, Empathy, Customer Service', 0, 'Bengaluru', 'ON_SITE', '2026-11-15', '2026-11-16', 'OPEN', 25, 'animals,pets,dog-rescue,adoption'),
    ('opp_5', 'u_ngo_5', 'Emergency Flood Relief Kit Packaging & Dispatch', 'Sort, assemble, and pack essential emergency relief kits containing dry rations, water purification tablets, and first aid supplies for flood-affected coastal taluks.', 'Disaster Relief', 'Logistics, Supply Chain, Inventory Sorting, Teamwork, Physical Endurance', 0, 'Bengaluru', 'ON_SITE', '2026-11-10', '2026-11-17', 'OPEN', 50, 'disaster-relief,emergency,packing,logistics');

    INSERT INTO shifts (shift_id, opportunity_id, shift_date, start_time, end_time, hours, capacity, filled_count, shift_status) VALUES
    ('shift_101', 'opp_1', '2026-11-08', '09:00:00', '13:00:00', 4.00, 10, 0, 'SCHEDULED'),
    ('shift_102', 'opp_1', '2026-11-15', '09:00:00', '13:00:00', 4.00, 10, 0, 'SCHEDULED'),
    ('shift_201', 'opp_2', '2026-11-09', '07:00:00', '11:30:00', 4.50, 25, 0, 'SCHEDULED'),
    ('shift_202', 'opp_2', '2026-11-16', '07:00:00', '11:30:00', 4.50, 25, 0, 'SCHEDULED'),
    ('shift_301', 'opp_3', '2026-11-14', '08:30:00', '14:30:00', 6.00, 15, 0, 'SCHEDULED'),
    ('shift_401', 'opp_4', '2026-11-15', '10:00:00', '16:00:00', 6.00, 25, 0, 'SCHEDULED'),
    ('shift_501', 'opp_5', '2026-11-11', '09:00:00', '15:00:00', 6.00, 30, 0, 'SCHEDULED');

    INSERT INTO volunteer_applications (application_id, volunteer_id, opportunity_id, status, semantic_match_score, notes, applied_at, reviewed_at) VALUES
    ('app_1', 'u_vol_1', 'opp_1', 'ACCEPTED', 0.9420, 'Strong match: CS student with experience in Python and math tutoring.', '2026-10-25 10:00:00', '2026-10-26 12:00:00'),
    ('app_2', 'u_vol_3', 'opp_1', 'ACCEPTED', 0.9680, 'Outstanding match: Experienced STEM educator.', '2026-10-26 11:30:00', '2026-10-26 14:00:00'),
    ('app_3', 'u_vol_1', 'opp_2', 'ACCEPTED', 0.8150, 'Good secondary interest in environmental restoration.', '2026-10-27 09:00:00', '2026-10-27 15:00:00'),
    ('app_4', 'u_vol_5', 'opp_2', 'ACCEPTED', 0.9780, 'Top match: Environmental science specialist.', '2026-10-27 14:00:00', '2026-10-28 09:00:00'),
    ('app_5', 'u_vol_2', 'opp_3', 'ACCEPTED', 0.9310, 'Certified first aid responder and health enthusiast.', '2026-10-28 11:00:00', '2026-10-28 16:30:00'),
    ('app_6', 'u_vol_4', 'opp_3', 'ACCEPTED', 0.9850, 'Professional paramedic with extensive clinical screening skills.', '2026-10-29 08:30:00', '2026-10-29 10:00:00'),
    ('app_7', 'u_vol_2', 'opp_4', 'ACCEPTED', 0.8920, 'Enthusiastic animal lover with rescue experience.', '2026-10-29 15:00:00', '2026-10-30 11:00:00');

    -- Insert shift assignments (which will activate the trigger to update shift filled_count!)
    INSERT INTO shift_assignments (assignment_id, shift_id, volunteer_id, application_id, attendance_status, hours_logged, verified_by_ngo, feedback) VALUES
    ('sa_1', 'shift_101', 'u_vol_1', 'app_1', 'ATTENDED', 4.00, 1, 'Rishi did an outstanding job leading the Python algorithm problem-solving module!'),
    ('sa_2', 'shift_101', 'u_vol_3', 'app_2', 'ATTENDED', 4.00, 1, 'Priya handled the foundational mathematics session with great patience and clarity.'),
    ('sa_3', 'shift_201', 'u_vol_1', 'app_3', 'ATTENDED', 4.50, 1, 'Rishi helped plant 45 saplings and set up the drip watering system.'),
    ('sa_4', 'shift_201', 'u_vol_5', 'app_4', 'ATTENDED', 4.50, 1, 'Sneha demonstrated expert knowledge in sapling positioning and soil aeration.'),
    ('sa_5', 'shift_301', 'u_vol_2', 'app_5', 'ATTENDED', 6.00, 1, 'Rohanth managed triage and blood pressure checks smoothly for 75 patients.'),
    ('sa_6', 'shift_301', 'u_vol_4', 'app_6', 'ATTENDED', 6.00, 1, 'Amit handled diabetic screening and identified 12 high-risk cases for doctor referral.'),
    ('sa_7', 'shift_401', 'u_vol_2', 'app_7', 'ATTENDED', 6.00, 1, 'Rohanth coordinated the adoption paperwork desk with high dedication.');

    INSERT INTO certificates (certificate_id, certificate_code, volunteer_id, ngo_id, opportunity_id, title, total_hours_credited, issued_date, signatory_name, signatory_role, verification_url) VALUES
    ('cert_1', 'e7b8a1c3d5f9e2b4a7c0d8e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1', 'u_vol_1', 'u_ngo_1', 'opp_1', 'Certificate of Excellence in STEM Mentorship', 24.00, '2026-02-15', 'Dr. Sunita Rao', 'Executive Director', '/verify/e7b8a1c3d5f9e2b4a7c0d8e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1'),
    ('cert_2', 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0', 'u_vol_2', 'u_ngo_3', 'opp_3', 'Distinguished Healthcare Volunteer Award', 30.00, '2026-02-20', 'Dr. Anita Deshmukh', 'Chief Medical Officer', '/verify/a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0'),
    ('cert_3', 'b9c8d7e6f5a43210fe9dcba0987654321fedcba9876543210fedcba987654321', 'u_vol_3', 'u_ngo_1', 'opp_1', 'Master Educator & Community Leader Citation', 50.00, '2026-02-22', 'Dr. Sunita Rao', 'Executive Director', '/verify/b9c8d7e6f5a43210fe9dcba0987654321fedcba9876543210fedcba987654321');

    INSERT INTO impact_metrics (metric_id, opportunity_id, ngo_id, beneficiaries_served, meals_distributed, trees_planted, students_tutored, waste_cleaned_kg, recorded_date) VALUES
    ('im_1', 'opp_1', 'u_ngo_1', 120, 0, 0, 120, 0.0, '2026-10-30'),
    ('im_2', 'opp_2', 'u_ngo_2', 500, 0, 850, 0, 1250.5, '2026-10-28'),
    ('im_3', 'opp_3', 'u_ngo_3', 380, 0, 0, 0, 0.0, '2026-10-25'),
    ('im_4', 'opp_4', 'u_ngo_4', 65, 0, 0, 0, 0.0, '2026-10-20');

    INSERT INTO audit_logs (log_id, table_name, action, record_id, changed_by, change_details, logged_at) VALUES
    ('log_1', 'ngos', 'UPDATE', 'u_ngo_1', 'u_admin_1', 'Verified NGO: Teach For Tomorrow Foundation after document audit.', '2026-01-10 10:00:00'),
    ('log_2', 'ngos', 'UPDATE', 'u_ngo_2', 'u_admin_1', 'Verified NGO: Green Earth Karnataka on Darpan validation.', '2026-01-15 11:30:00'),
    ('log_3', 'opportunities', 'INSERT', 'opp_1', 'u_ngo_1', 'Created opportunity: Underprivileged Youth Coding & Math Boot Camp', '2026-10-24 09:30:00'),
    ('log_4', 'shift_assignments', 'UPDATE', 'sa_1', 'u_ngo_1', 'Verified 4.0 hours for volunteer Rishi (PES1UG24AM224)', '2026-10-26 13:00:00'),
    ('log_5', 'certificates', 'INSERT', 'cert_1', 'u_ngo_1', 'Issued Certificate of Excellence in STEM Mentorship to Rishi', '2026-02-15 12:00:00');
  `);

  // Step 6: Generate and Store Vector Embeddings for Volunteers and Opportunities
  console.log('[DB] Generating 384-dimensional dense semantic vectors...');
  
  // Volunteers
  const volunteers = db.prepare(`
    SELECT v.*, u.full_name 
    FROM volunteers v 
    JOIN users u ON v.volunteer_id = u.user_id
  `).all();

  const updateVolVector = db.prepare(`
    UPDATE volunteers 
    SET profile_vector = ? 
    WHERE volunteer_id = ?
  `);

  for (const vol of volunteers) {
    const text = buildVolunteerEmbeddingText(vol, { full_name: vol.full_name });
    const vector = generateEmbedding(text);
    updateVolVector.run(JSON.stringify(vector), vol.volunteer_id);
  }

  // Opportunities
  const opportunities = db.prepare(`
    SELECT o.*, n.org_name 
    FROM opportunities o 
    JOIN ngos n ON o.ngo_id = n.ngo_id
  `).all();

  const updateOppVector = db.prepare(`
    UPDATE opportunities 
    SET opportunity_vector = ? 
    WHERE opportunity_id = ?
  `);

  for (const opp of opportunities) {
    const text = buildOpportunityEmbeddingText(opp, { org_name: opp.org_name });
    const vector = generateEmbedding(text);
    updateOppVector.run(JSON.stringify(vector), opp.opportunity_id);
  }

  console.log('[DB] Initialization complete! Relational schema, triggers, views, and vectors initialized.');
}

