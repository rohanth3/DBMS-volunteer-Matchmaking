-- ============================================================================
-- DBMS Level 3 Project: NGO Volunteer Matchmaking System
-- Course: DBMS Experiential Learning - PES University
-- Team Members:
--   1. Rishi   (SRN: PES1UG24AM224)
--   2. Rohanth (SRN: PES1UG24AM227)
-- File: 07_seed_data.sql - Comprehensive Realistic Benchmark Dataset
-- Demonstrates: Multi-table DML INSERT, realistic relational integrity
-- ============================================================================

-- Clean prior seed data
DELETE FROM audit_logs;
DELETE FROM impact_metrics;
DELETE FROM certificates;
DELETE FROM shift_assignments;
DELETE FROM volunteer_applications;
DELETE FROM shifts;
DELETE FROM opportunities;
DELETE FROM ngos;
DELETE FROM volunteers;
DELETE FROM users;

-- ============================================================================
-- 1. USERS SEED (Admins, Volunteers, NGOs)
-- Passwords hashed: password123 (hashed with bcrypt / salt)
-- ============================================================================
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
('u_ngo_5', 'relief@hoperelief.org', '$2a$10$wN9iL6M65e4Fp2Xo3.i/K.u7y5h1qC4bX41xZkL47A83uV7u3s9aC', 'NGO', 'Hope Disaster Relief Aid', '+91-8067890123', 1);

-- ============================================================================
-- 2. VOLUNTEERS SEED
-- ============================================================================
INSERT INTO volunteers (volunteer_id, bio, skills, interests, experience_years, location_city, location_state, availability_type, weekly_hours_capacity, total_hours_contributed, volunteer_level) VALUES
('u_vol_1', 'Computer Science student passionate about teaching underprivileged children and environmental cleanup.', 'Teaching, Python, Web Development, Mathematics, English, Community Organizing', 'Education, Environment, Youth Empowerment', 3, 'Bengaluru', 'Karnataka', 'WEEKENDS', 15, 34.50, 'SILVER'),
('u_vol_2', 'Data Science enthusiast and certified first aid responder with experience in disaster management and animal rescue.', 'First Aid, Data Analysis, Logistics, Animal Care, Emergency Management, Event Coordination', 'Healthcare, Animal Welfare, Disaster Relief', 2, 'Bengaluru', 'Karnataka', 'FLEXIBLE', 20, 48.00, 'SILVER'),
('u_vol_3', 'Mathematics teacher and STEM mentor aiming to build strong educational foundations for girl students.', 'STEM Mentorship, Mathematics, Physics, Public Speaking, Content Writing', 'Education, Women Empowerment', 4, 'Bengaluru', 'Karnataka', 'WEEKDAYS', 10, 62.00, 'GOLD'),
('u_vol_4', 'Paramedic volunteer with rapid response training and disaster relief field experience.', 'Emergency First Aid, CPR, Fleet Management, Supply Distribution, Search & Rescue', 'Healthcare, Disaster Relief, Community Development', 5, 'Bengaluru', 'Karnataka', 'WEEKENDS', 12, 115.00, 'PLATINUM'),
('u_vol_5', 'Environmental biology student engaged in urban afforestation, seed ball making, and waste segregation drives.', 'Tree Plantation, Soil Testing, Miyawaki Forests, Waste Management, Environmental Advocacy', 'Environment, Climate Action', 2, 'Bengaluru', 'Karnataka', 'FLEXIBLE', 10, 18.00, 'BRONZE');

-- ============================================================================
-- 3. NGOS SEED
-- ============================================================================
INSERT INTO ngos (ngo_id, org_name, registration_number, darpan_id, website_url, cause_category, address, city, state, contact_person, contact_email, contact_phone, verification_status, verified_by, verified_at) VALUES
('u_ngo_1', 'Teach For Tomorrow Foundation', 'REG-KA-2018-00912', 'KA/2018/0192834', 'https://teachfortomorrow.org', 'Education', '12th Main, Indiranagar', 'Bengaluru', 'Karnataka', 'Dr. Sunita Rao', 'contact@teachfortomorrow.org', '+91-8023456789', 'VERIFIED', 'u_admin_1', '2026-01-10 10:00:00'),
('u_ngo_2', 'Green Earth Karnataka', 'REG-KA-2019-01452', 'KA/2019/0283741', 'https://greenearthkarnataka.org', 'Environment', 'Jayanagar 4th Block', 'Bengaluru', 'Karnataka', 'Vikram Joshi', 'info@greenearthkarnataka.org', '+91-8034567890', 'VERIFIED', 'u_admin_1', '2026-01-15 11:30:00'),
('u_ngo_3', 'Care & Cure Health Trust', 'REG-KA-2016-00341', 'KA/2016/0091823', 'https://careandcure.org', 'Healthcare', 'Koramangala 5th Block', 'Bengaluru', 'Karnataka', 'Dr. Anita Deshmukh', 'help@careandcure.org', '+91-8045678901', 'VERIFIED', 'u_admin_2', '2026-02-01 09:15:00'),
('u_ngo_4', 'Paws & Tails Animal Shelter', 'REG-KA-2021-02981', 'KA/2021/0349182', 'https://pawsandtails.org', 'Animal Welfare', 'Whitefield Main Road', 'Bengaluru', 'Karnataka', 'Rahul Menon', 'support@pawsandtails.org', '+91-8056789012', 'VERIFIED', 'u_admin_2', '2026-02-10 14:00:00'),
('u_ngo_5', 'Hope Disaster Relief Aid', 'REG-KA-2023-04112', 'KA/2023/0481920', 'https://hoperelief.org', 'Disaster Relief', 'Hebbal Ring Road', 'Bengaluru', 'Karnataka', 'Sanjay Hegde', 'relief@hoperelief.org', '+91-8067890123', 'PENDING', NULL, NULL);

-- ============================================================================
-- 4. OPPORTUNITIES SEED
-- ============================================================================
INSERT INTO opportunities (opportunity_id, ngo_id, title, description, cause_category, required_skills, experience_required, location_city, location_type, start_date, end_date, status, max_volunteers, tags) VALUES
('opp_1', 'u_ngo_1', 'Underprivileged Youth Coding & Math Boot Camp', 'Conduct interactive weekend classes teaching foundational arithmetic, problem-solving, and introductory Python/Scratch programming to middle school students from low-income communities.', 'Education', 'Teaching, Mathematics, Python, English, Mentorship', 1, 'Bengaluru', 'HYBRID', '2026-11-05', '2026-12-20', 'OPEN', 15, 'coding,education,kids,python,math'),
('opp_2', 'u_ngo_2', 'Urban Lake Afforestation & Miyawaki Forest Drive', 'Hands-on weekend drive to restore native biodiversity around Bellandur lake by planting 1,000 indigenous saplings using the dense Miyawaki methodology and installing drip irrigation.', 'Environment', 'Tree Plantation, Soil Preparation, Environmental Science, Physical Fitness', 0, 'Bengaluru', 'ON_SITE', '2026-11-08', '2026-11-29', 'OPEN', 40, 'environment,tree-planting,climate,miyawaki'),
('opp_3', 'u_ngo_3', 'Free Community Health Screening & First Aid Camp', 'Support medical doctors in conducting non-communicable disease screenings (blood glucose, blood pressure, BMI) and lead basic community first aid workshops in urban slums.', 'Healthcare', 'First Aid, Nursing, Vital Signs Measurement, Patient Assistance, Hindi/Kannada', 1, 'Bengaluru', 'ON_SITE', '2026-11-12', '2026-11-26', 'OPEN', 20, 'healthcare,medical,first-aid,screening'),
('opp_4', 'u_ngo_4', 'Shelter Dog Rehabilitation & Adoption Festival Support', 'Assist shelter caretakers in grooming, socializing rescued stray dogs, managing adoption inquiry desks, and guiding visiting families during the weekend adoption festival.', 'Animal Welfare', 'Animal Care, Dog Walking, Event Coordination, Empathy, Customer Service', 0, 'Bengaluru', 'ON_SITE', '2026-11-15', '2026-11-16', 'OPEN', 25, 'animals,pets,dog-rescue,adoption'),
('opp_5', 'u_ngo_5', 'Emergency Flood Relief Kit Packaging & Dispatch', 'Sort, assemble, and pack essential emergency relief kits containing dry rations, water purification tablets, and first aid supplies for flood-affected coastal taluks.', 'Disaster Relief', 'Logistics, Supply Chain, Inventory Sorting, Teamwork, Physical Endurance', 0, 'Bengaluru', 'ON_SITE', '2026-11-10', '2026-11-17', 'OPEN', 50, 'disaster-relief,emergency,packing,logistics');

-- ============================================================================
-- 5. SHIFTS SEED
-- ============================================================================
INSERT INTO shifts (shift_id, opportunity_id, shift_date, start_time, end_time, hours, capacity, filled_count, shift_status) VALUES
('shift_101', 'opp_1', '2026-11-08', '09:00:00', '13:00:00', 4.00, 10, 2, 'SCHEDULED'),
('shift_102', 'opp_1', '2026-11-15', '09:00:00', '13:00:00', 4.00, 10, 1, 'SCHEDULED'),
('shift_201', 'opp_2', '2026-11-09', '07:00:00', '11:30:00', 4.50, 25, 3, 'SCHEDULED'),
('shift_202', 'opp_2', '2026-11-16', '07:00:00', '11:30:00', 4.50, 25, 0, 'SCHEDULED'),
('shift_301', 'opp_3', '2026-11-14', '08:30:00', '14:30:00', 6.00, 15, 2, 'SCHEDULED'),
('shift_401', 'opp_4', '2026-11-15', '10:00:00', '16:00:00', 6.00, 20, 2, 'SCHEDULED'),
('shift_501', 'opp_5', '2026-11-11', '09:00:00', '15:00:00', 6.00, 30, 1, 'SCHEDULED');

-- ============================================================================
-- 6. VOLUNTEER_APPLICATIONS SEED
-- ============================================================================
INSERT INTO volunteer_applications (application_id, volunteer_id, opportunity_id, status, semantic_match_score, notes, applied_at, reviewed_at) VALUES
('app_1', 'u_vol_1', 'opp_1', 'ACCEPTED', 0.9420, 'Strong match: CS student with experience in Python and math tutoring.', '2026-10-25 10:00:00', '2026-10-26 12:00:00'),
('app_2', 'u_vol_3', 'opp_1', 'ACCEPTED', 0.9680, 'Outstanding match: Experienced STEM educator.', '2026-10-26 11:30:00', '2026-10-26 14:00:00'),
('app_3', 'u_vol_1', 'opp_2', 'ACCEPTED', 0.8150, 'Good secondary interest in environmental restoration.', '2026-10-27 09:00:00', '2026-10-27 15:00:00'),
('app_4', 'u_vol_5', 'opp_2', 'ACCEPTED', 0.9780, 'Top match: Environmental science specialist.', '2026-10-27 14:00:00', '2026-10-28 09:00:00'),
('app_5', 'u_vol_2', 'opp_3', 'ACCEPTED', 0.9310, 'Certified first aid responder and health enthusiast.', '2026-10-28 11:00:00', '2026-10-28 16:30:00'),
('app_6', 'u_vol_4', 'opp_3', 'ACCEPTED', 0.9850, 'Professional paramedic with extensive clinical screening skills.', '2026-10-29 08:30:00', '2026-10-29 10:00:00'),
('app_7', 'u_vol_2', 'opp_4', 'ACCEPTED', 0.8920, 'Enthusiastic animal lover with rescue experience.', '2026-10-29 15:00:00', '2026-10-30 11:00:00');

-- ============================================================================
-- 7. SHIFT_ASSIGNMENTS SEED
-- ============================================================================
INSERT INTO shift_assignments (assignment_id, shift_id, volunteer_id, application_id, attendance_status, hours_logged, verified_by_ngo, feedback) VALUES
('sa_1', 'shift_101', 'u_vol_1', 'app_1', 'ATTENDED', 4.00, 1, 'Rishi did an outstanding job leading the Python algorithm problem-solving module!'),
('sa_2', 'shift_101', 'u_vol_3', 'app_2', 'ATTENDED', 4.00, 1, 'Priya handled the foundational mathematics session with great patience and clarity.'),
('sa_3', 'shift_201', 'u_vol_1', 'app_3', 'ATTENDED', 4.50, 1, 'Rishi helped plant 45 saplings and set up the drip watering system.'),
('sa_4', 'shift_201', 'u_vol_5', 'app_4', 'ATTENDED', 4.50, 1, 'Sneha demonstrated expert knowledge in sapling positioning and soil aeration.'),
('sa_5', 'shift_301', 'u_vol_2', 'app_5', 'ATTENDED', 6.00, 1, 'Rohanth managed triage and blood pressure checks smoothly for 75 patients.'),
('sa_6', 'shift_301', 'u_vol_4', 'app_6', 'ATTENDED', 6.00, 1, 'Amit handled diabetic screening and identified 12 high-risk cases for doctor referral.'),
('sa_7', 'shift_401', 'u_vol_2', 'app_7', 'ATTENDED', 6.00, 1, 'Rohanth coordinated the adoption paperwork desk with high dedication.');

-- ============================================================================
-- 8. CERTIFICATES SEED
-- ============================================================================
INSERT INTO certificates (certificate_id, certificate_code, volunteer_id, ngo_id, opportunity_id, title, total_hours_credited, issued_date, signatory_name, signatory_role, verification_url) VALUES
('cert_1', 'e7b8a1c3d5f9e2b4a7c0d8e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1', 'u_vol_1', 'u_ngo_1', 'opp_1', 'Certificate of Excellence in STEM Mentorship', 24.00, '2026-02-15', 'Dr. Sunita Rao', 'Executive Director', '/verify/e7b8a1c3d5f9e2b4a7c0d8e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1'),
('cert_2', 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0', 'u_vol_2', 'u_ngo_3', 'opp_3', 'Distinguished Healthcare Volunteer Award', 30.00, '2026-02-20', 'Dr. Anita Deshmukh', 'Chief Medical Officer', '/verify/a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0'),
('cert_3', 'b9c8d7e6f5a43210fe9dcba0987654321fedcba9876543210fedcba987654321', 'u_vol_3', 'u_ngo_1', 'opp_1', 'Master Educator & Community Leader Citation', 50.00, '2026-02-22', 'Dr. Sunita Rao', 'Executive Director', '/verify/b9c8d7e6f5a43210fe9dcba0987654321fedcba9876543210fedcba987654321');

-- ============================================================================
-- 9. IMPACT_METRICS SEED
-- ============================================================================
INSERT INTO impact_metrics (metric_id, opportunity_id, ngo_id, beneficiaries_served, meals_distributed, trees_planted, students_tutored, waste_cleaned_kg, recorded_date) VALUES
('im_1', 'opp_1', 'u_ngo_1', 120, 0, 0, 120, 0.0, '2026-10-30'),
('im_2', 'opp_2', 'u_ngo_2', 500, 0, 850, 0, 1250.5, '2026-10-28'),
('im_3', 'opp_3', 'u_ngo_3', 380, 0, 0, 0, 0.0, '2026-10-25'),
('im_4', 'opp_4', 'u_ngo_4', 65, 0, 0, 0, 0.0, '2026-10-20');

-- ============================================================================
-- 10. AUDIT_LOGS SEED
-- ============================================================================
INSERT INTO audit_logs (log_id, table_name, action, record_id, changed_by, change_details, logged_at) VALUES
('log_1', 'ngos', 'UPDATE', 'u_ngo_1', 'u_admin_1', 'Verified NGO: Teach For Tomorrow Foundation after document audit.', '2026-01-10 10:00:00'),
('log_2', 'ngos', 'UPDATE', 'u_ngo_2', 'u_admin_1', 'Verified NGO: Green Earth Karnataka on Darpan validation.', '2026-01-15 11:30:00'),
('log_3', 'opportunities', 'INSERT', 'opp_1', 'u_ngo_1', 'Created opportunity: Underprivileged Youth Coding & Math Boot Camp', '2026-10-24 09:30:00'),
('log_4', 'shift_assignments', 'UPDATE', 'sa_1', 'u_ngo_1', 'Verified 4.0 hours for volunteer Rishi (PES1UG24AM224)', '2026-10-26 13:00:00'),
('log_5', 'certificates', 'INSERT', 'cert_1', 'u_ngo_1', 'Issued Certificate of Excellence in STEM Mentorship to Rishi', '2026-02-15 12:00:00');

