-- ============================================================================
-- DBMS Level 3 Project: NGO Volunteer Matchmaking System
-- Course: DBMS Experiential Learning - PES University
-- Team Members:
--   1. Rishi   (SRN: PES1UG24AM224)
--   2. Rohanth (SRN: PES1UG24AM227)
-- Database Engine: MySQL / PostgreSQL Compatible DDL
-- File: 01_ddl_schema.sql - Data Definition Language (DDL)
-- Demonstrates: CREATE, ALTER, DROP, PK, FK, CHECK, UNIQUE, DEFAULT constraints
-- ============================================================================

-- Step 1: Clean drop of existing tables in reverse dependency order
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

-- ============================================================================
-- 1. USERS TABLE (Authentication & Base User Identity)
-- Role-Based Access Control (RBAC): ADMIN, NGO, VOLUNTEER
-- ============================================================================
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'NGO', 'VOLUNTEER')),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. VOLUNTEERS TABLE (Volunteer Profile, Skills, Availability & Contribution)
-- ============================================================================
CREATE TABLE volunteers (
    volunteer_id VARCHAR(36) PRIMARY KEY,
    bio TEXT,
    skills TEXT NOT NULL,                                 -- Comma-separated or JSON list of skills
    interests TEXT NOT NULL,                              -- Causes: Education, Healthcare, Environment, etc.
    experience_years INT DEFAULT 0 CHECK (experience_years >= 0 AND experience_years <= 60),
    location_city VARCHAR(100) NOT NULL,
    location_state VARCHAR(100) NOT NULL,
    availability_type VARCHAR(30) DEFAULT 'FLEXIBLE' CHECK (availability_type IN ('WEEKDAYS', 'WEEKENDS', 'FLEXIBLE', 'FULL_TIME')),
    weekly_hours_capacity INT DEFAULT 10 CHECK (weekly_hours_capacity > 0 AND weekly_hours_capacity <= 168),
    total_hours_contributed DECIMAL(10, 2) DEFAULT 0.00 CHECK (total_hours_contributed >= 0),
    profile_vector TEXT,                                  -- Dense 384-d semantic embedding JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. NGOS TABLE (Verified Organizations)
-- ============================================================================
CREATE TABLE ngos (
    ngo_id VARCHAR(36) PRIMARY KEY,
    org_name VARCHAR(200) NOT NULL,
    registration_number VARCHAR(100) NOT NULL UNIQUE,
    darpan_id VARCHAR(100) UNIQUE,
    website_url VARCHAR(255),
    cause_category VARCHAR(100) NOT NULL CHECK (cause_category IN ('Education', 'Healthcare', 'Environment', 'Animal Welfare', 'Disaster Relief', 'Women Empowerment', 'Elderly Care', 'Community Development')),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    contact_person VARCHAR(150) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verified_by VARCHAR(36),
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ngo_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ============================================================================
-- 4. OPPORTUNITIES TABLE (Volunteer Opportunities posted by verified NGOs)
-- ============================================================================
CREATE TABLE opportunities (
    opportunity_id VARCHAR(36) PRIMARY KEY,
    ngo_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    cause_category VARCHAR(100) NOT NULL,
    required_skills TEXT NOT NULL,
    experience_required INT DEFAULT 0 CHECK (experience_required >= 0),
    location_city VARCHAR(100) NOT NULL,
    location_type VARCHAR(20) DEFAULT 'ON_SITE' CHECK (location_type IN ('ON_SITE', 'REMOTE', 'HYBRID')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    max_volunteers INT DEFAULT 10 CHECK (max_volunteers > 0),
    opportunity_vector TEXT,                              -- Dense 384-d semantic embedding JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_opportunity_dates CHECK (end_date >= start_date),
    FOREIGN KEY (ngo_id) REFERENCES ngos(ngo_id) ON DELETE CASCADE
);

-- ============================================================================
-- 5. SHIFTS TABLE (Scheduled work shifts for opportunities)
-- ============================================================================
CREATE TABLE shifts (
    shift_id VARCHAR(36) PRIMARY KEY,
    opportunity_id VARCHAR(36) NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hours DECIMAL(5, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    capacity INT NOT NULL CHECK (capacity > 0),
    filled_count INT DEFAULT 0 CHECK (filled_count >= 0),
    shift_status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (shift_status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_shift_capacity CHECK (filled_count <= capacity),
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE CASCADE
);

-- ============================================================================
-- 6. VOLUNTEER_APPLICATIONS TABLE (Applications to opportunities)
-- ============================================================================
CREATE TABLE volunteer_applications (
    application_id VARCHAR(36) PRIMARY KEY,
    volunteer_id VARCHAR(36) NOT NULL,
    opportunity_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
    semantic_match_score DECIMAL(5, 4) DEFAULT 0.0000 CHECK (semantic_match_score >= 0.0000 AND semantic_match_score <= 1.0000),
    notes TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    UNIQUE(volunteer_id, opportunity_id),
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE CASCADE
);

-- ============================================================================
-- 7. SHIFT_ASSIGNMENTS TABLE (Volunteers enrolled in specific shifts)
-- ============================================================================
CREATE TABLE shift_assignments (
    assignment_id VARCHAR(36) PRIMARY KEY,
    shift_id VARCHAR(36) NOT NULL,
    volunteer_id VARCHAR(36) NOT NULL,
    application_id VARCHAR(36) NOT NULL,
    attendance_status VARCHAR(20) DEFAULT 'REGISTERED' CHECK (attendance_status IN ('REGISTERED', 'ATTENDED', 'ABSENT', 'EXCUSED')),
    hours_logged DECIMAL(5, 2) DEFAULT 0.00 CHECK (hours_logged >= 0),
    verified_by_ngo BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shift_id, volunteer_id),
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES volunteer_applications(application_id) ON DELETE CASCADE
);

-- ============================================================================
-- 8. CERTIFICATES TABLE (Verifiable certificates issued to volunteers)
-- ============================================================================
CREATE TABLE certificates (
    certificate_id VARCHAR(36) PRIMARY KEY,
    certificate_code VARCHAR(64) NOT NULL UNIQUE,          -- Cryptographic SHA-256 verification hash
    volunteer_id VARCHAR(36) NOT NULL,
    ngo_id VARCHAR(36) NOT NULL,
    opportunity_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    total_hours_credited DECIMAL(10, 2) NOT NULL CHECK (total_hours_credited > 0),
    issued_date DATE NOT NULL,
    signatory_name VARCHAR(150) NOT NULL,
    signatory_role VARCHAR(100) NOT NULL,
    verification_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    FOREIGN KEY (ngo_id) REFERENCES ngos(ngo_id) ON DELETE CASCADE,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE CASCADE
);

-- ============================================================================
-- 9. IMPACT_METRICS TABLE (Tangible community outcomes tracked per event)
-- ============================================================================
CREATE TABLE impact_metrics (
    metric_id VARCHAR(36) PRIMARY KEY,
    opportunity_id VARCHAR(36) NOT NULL,
    ngo_id VARCHAR(36) NOT NULL,
    beneficiaries_served INT DEFAULT 0 CHECK (beneficiaries_served >= 0),
    meals_distributed INT DEFAULT 0 CHECK (meals_distributed >= 0),
    trees_planted INT DEFAULT 0 CHECK (trees_planted >= 0),
    students_tutored INT DEFAULT 0 CHECK (students_tutored >= 0),
    waste_cleaned_kg DECIMAL(10, 2) DEFAULT 0.0 CHECK (waste_cleaned_kg >= 0),
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
    FOREIGN KEY (ngo_id) REFERENCES ngos(ngo_id) ON DELETE CASCADE
);

-- ============================================================================
-- 10. AUDIT_LOGS TABLE (Security & Integrity Logging)
-- ============================================================================
CREATE TABLE audit_logs (
    log_id VARCHAR(36) PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id VARCHAR(36) NOT NULL,
    changed_by VARCHAR(36),
    change_details TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ============================================================================
-- Demonstrating ALTER TABLE Statements (Requirement 5)
-- ============================================================================
-- 1. Add index note column to opportunities
ALTER TABLE opportunities ADD COLUMN tags VARCHAR(255) DEFAULT 'community,volunteering';

-- 2. Add badge level to volunteers
ALTER TABLE volunteers ADD COLUMN volunteer_level VARCHAR(30) DEFAULT 'BRONZE' CHECK (volunteer_level IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM'));

-- 3. Modify contact phone column size
ALTER TABLE ngos MODIFY COLUMN contact_phone VARCHAR(30) NOT NULL;

