# DBMS Level 3 Project — Comprehensive Testing & Quality Assurance Report

**Project Title:** NGO Volunteer Matchmaking System (VolunTrack.AI)  
**Academic Institution:** PES University — Department of Computer Science & Engineering  
**Course:** DBMS Experiential Learning — Level 3  
**Team Members:**  
1. Rishi (SRN: PES1UG24AM224)  
2. Rohanth (SRN: PES1UG24AM227)  
**Test Harness Script:** `scripts/test-db.js` (`npm run db:test`)  
**Database Engines Tested:** SQLite 3 (WAL mode) / MySQL 8.0 Primary  
**Vector Engine Tested:** ChromaDB Vector Database (`chroma_data/chroma.sqlite3`)  
**Date of Execution:** November 1, 2026  

---

## 1. Executive Testing Summary

A total of **21 automated verification tests** were executed across 7 distinct database and application layers. All 21 tests passed with **100% success rate**.

| Test Section | Total Checks | Passed | Failed | Success Rate |
|:---|:---:|:---:|:---:|:---:|
| **Section 1: Relational SQL Engine & 3NF Schema** | 2 | 2 | 0 | 100% |
| **Section 2: Multi-Table Analytical Views** | 4 | 4 | 0 | 100% |
| **Section 3: Database Triggers Live Execution** | 3 | 3 | 0 | 100% |
| **Section 4: ACID Transactions & Concurrency** | 1 | 1 | 0 | 100% |
| **Section 5: ChromaDB Vector Database & Semantic Match** | 3 | 3 | 0 | 100% |
| **Section 6: Authentication, Bcrypt Hashing & RBAC** | 4 | 4 | 0 | 100% |
| **Section 7: Analytical SQL Operations (Rubric Queries)** | 4 | 4 | 0 | 100% |
| **TOTAL** | **21** | **21** | **0** | **100.0%** |

---

## 2. Granular Test Case Results Matrix

| Test ID | Category | Test Description | Expected Result | Actual Execution Evidence | Status |
|:---:|:---|:---|:---|:---|:---:|
| **T01** | Relational Engine | Relational Database Engine Active Connection | Active connection pool established | Connected via SQLite WAL mode fallback in `data/ngo_volunteer.db` (MySQL 8 ready) | **PASS** |
| **T02** | Schema Integrity | 10 3NF Relational Tables Verification | All 10 required entity tables exist in catalog | Verified catalog contains `users`, `volunteers`, `ngos`, `opportunities`, `shifts`, `volunteer_applications`, `shift_assignments`, `certificates`, `impact_metrics`, `audit_logs` | **PASS** |
| **T03** | Analytical Views | `vw_volunteer_leaderboard` Multi-Table Aggregation | Aggregates hours, computes tier, calculates global rank | Top volunteer: Amit Patel (115 hrs, Tier: PLATINUM, Global Rank #1 via `DENSE_RANK()`) | **PASS** |
| **T04** | Analytical Views | `vw_opportunity_details` Multi-Table JOIN | Aggregates shift capacity, enrolled count, open slots | Retrieved "Underprivileged Youth Coding & Math Boot Camp" hosted by Teach For Tomorrow (18 slots open) | **PASS** |
| **T05** | Analytical Views | `vw_ngo_impact_summary` Impact Rollup | Aggregates campaigns, volunteer hours, beneficiaries | NGO: Teach For Tomorrow Foundation (Campaigns: 1, Hours verified: 8.0) | **PASS** |
| **T06** | Analytical Views | `vw_shift_occupancy` Live Fill Percentage | Calculates capacity fill percentage | Shift on 2026-11-08: Capacity 10, Filled 2 (20.0% occupancy) | **PASS** |
| **T07** | Triggers | Database Trigger Catalog Registration | Required reactive business triggers exist | Catalog contains `trg_increment_shift_filled_count`, `trg_decrement_shift_filled_count`, `trg_update_volunteer_hours`, `trg_audit_opportunity_insert`, `trg_audit_ngo_verification` | **PASS** |
| **T08** | Triggers | `trg_increment_shift_filled_count` Live Execution | Inserting shift assignment automatically increments `shifts.filled_count` | Shift filled count automatically increased: `0 ➔ 1` upon assignment insertion | **PASS** |
| **T09** | Triggers | `trg_decrement_shift_filled_count` Live Execution | Deleting shift assignment automatically decrements `shifts.filled_count` | Shift filled count automatically decremented: `1 ➔ 0` upon assignment removal | **PASS** |
| **T10** | Transactions | ACID Transaction Isolation & Atomic Commit | Atomic execution of statements with rollback safety | Transaction committed with full write isolation | **PASS** |
| **T11** | Vector DB | 384-dimensional Normalized Embedding Vector | Generates 384-d float vector with \(L_2\) norm = 1.0000 | Vector length = 384, Euclidean norm = 1.0000, domain anchor projection verified | **PASS** |
| **T12** | Vector DB | ChromaDB Vector Indexing & Upsert | Upserts embedding vector, document text, and metadata | Indexed in Chroma collection `ngo_opportunities` (`chroma_persistent_store`) | **PASS** |
| **T13** | Vector DB | ChromaDB Nearest-Neighbor Cosine Similarity Retrieval | Returns top-k similar opportunities ranked by cosine distance | Retrieved 3 nearest vector matches. Top match cosine similarity: `1.0000` | **PASS** |
| **T14** | Authentication | Bcrypt Salt-Hashed Password Verification (Valid) | Authenticates valid credentials and extracts user role | Authenticated user "Rishi (Admin - PES1UG24AM224)" with role "ADMIN" | **PASS** |
| **T15** | Security | Bcrypt Password Rejection (Invalid Password) | Rejects illegitimate credentials with null | Correctly rejected illegitimate password attempt with null | **PASS** |
| **T16** | Authorization | RBAC Route Guard (Admin Authorized) | Grants authorized access to admin role | Authorized admin route execution (`authorized: true`) | **PASS** |
| **T17** | Authorization | RBAC Route Guard (Admin Denied on NGO-only) | Forbids unauthorized role with HTTP 403 | Correctly denied access with HTTP status 403 Forbidden | **PASS** |
| **T18** | SQL Operations | Query 1: Multi-Table JOIN with Aggregations | Joins 4 tables, computes `COUNT`, `SUM`, `AVG` | Executed query 1 live: NGO "Care & Cure Health Trust" served 12 total verified hours | **PASS** |
| **T19** | SQL Operations | Query 2: GROUP BY with HAVING Filter | Filters aggregated groups above quantitative threshold | Executed query 2 live: Identified 4 high-impact organizations with > 5 verified hours | **PASS** |
| **T20** | SQL Operations | Query 3: Correlated Subquery | Compares individual volunteer hours to city average | Executed query 3 live: Top volunteer: Rohanth (PES1UG24AM227) (12 hrs) | **PASS** |
| **T21** | SQL Operations | Query 4: Window Functions (`DENSE_RANK`) | Ranks records using windowing over partitioned dataset | Executed query 4 live: Rank #1: Rohanth (PES1UG24AM227) (12 hrs) | **PASS** |

---

## 3. Application Route Testing

In addition to the database verification harness, all Next.js application routes were verified:

| Route | HTTP Method | Expected Behavior | Actual Behavior | Result |
|:---|:---:|:---|:---|:---:|
| `/` | GET | Render homepage with live DB platform stats | Displays active opportunities, verified NGOs, total hours, and volunteers from database | **PASS** |
| `/login` | GET / POST | Authenticate persona with bcrypt | Validates credentials, sets HTTP-only cookie `ngo_auth_session`, routes to dashboard | **PASS** |
| `/opportunities` | GET | List opportunities with cause/city filtering | Fetches from `vw_opportunity_details` and returns opportunities with shifts | **PASS** |
| `/api/opportunities/match` | POST | Calculate hybrid AI semantic matchmaking | Computes 384-d cosine similarity and returns ranked opportunities | **PASS** |
| `/api/shifts/apply` | POST | Transactional shift enrollment | Enforces capacity check, prevents double booking, increments shift count via trigger | **PASS** |
| `/api/shifts/attendance` | POST | Verify volunteer shift attendance | Sets `verified_by_ngo = 1`, activates `trg_update_volunteer_hours`, updates tier badge | **PASS** |
| `/api/certificates/issue` | POST | Issue verifiable certificate | Generates SHA-256 cryptographic hash and writes record to database ledger | **PASS** |
| `/verify/[code]` | GET | Public certificate authentication | Verifies cryptographic hash against database and displays official certificate | **PASS** |
| `/admin/dashboard` | GET | Admin overview and live SQL Lab | Loads platform metrics and allows live execution/profiling of custom SQL queries | **PASS** |

