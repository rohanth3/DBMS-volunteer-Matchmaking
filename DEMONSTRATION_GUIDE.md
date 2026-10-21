# DBMS Level 3 Project — Comprehensive Evaluation & Demonstration Guide

**Project Title:** NGO Volunteer Matchmaking System (VolunTrack.AI)  
**Academic Institution:** PES University — Department of Computer Science and Engineering  
**Course:** DBMS Experiential Learning – Level 3  
**Team Members:**  
1. Rishi (SRN: PES1UG24AM224)  
2. Rohanth (SRN: PES1UG24AM227)  
**Evaluator In-Charge:** Dr. Nagasundari S  

---

## 1. Demonstration Readiness Checklist

| Evaluation Rubric Item | Demonstration Target Screen / Artifact | Preloaded Test Action / Execution Script | Readiness Status |
|:---|:---|:---|:---:|
| **1. Problem Statement & Motivation** | Homepage (`/`) & `DOCUMENTATION.md` Section 1 | Walk through pain points: keyword search limits, shift overbooking, unverified hours | **READY** |
| **2. ER Diagram & Database Design** | `DOCUMENTATION.md` Section 5 | Display 10 entities, cardinalities (1:1, 1:N, M:N), primary keys, and foreign keys | **READY** |
| **3. Relational Schema (3NF)** | `DOCUMENTATION.md` Section 6, `sql/01_ddl_schema.sql` | Explain functional dependencies, elimination of partial/transitive dependencies | **READY** |
| **4. Database Implementation** | SQLite (`data/ngo_volunteer.db`) & MySQL (`sql/`) | Show 10 tables, domain CHECK constraints, indexes, and seed records | **READY** |
| **5. Important Queries & Operations** | Admin SQL Lab (`/admin/dashboard`) | Live execution of JOIN, GROUP BY, HAVING, Correlated Subquery, and Window Functions | **READY** |
| **6. Next.js Interface** | Full web portal on `http://localhost:3000` | Demonstrate responsive navigation, dynamic filters, modals, and user dashboards | **READY** |
| **7. Database–Application Integration** | Browser DevTools Network tab + API routes | Demonstrate real API communication with zero hardcoded credentials or mock traps | **READY** |
| **8. Advanced Database Features** | Trigger execution + ChromaDB Vector Matcher | Live shift enrollment trigger, volunteer hours accumulation trigger, 384-d cosine search | **READY** |
| **9. Test Cases Verification** | Terminal execution of `npm run db:test` | Run automated test suite: 21 / 21 tests passing (100% success rate) | **READY** |
| **10. Team Member Contributions** | Git commit log & Contribution Matrix | Demonstrate commit history attributing DB and application tasks to both members | **READY** |

---

## 2. Step-by-Step Live Demonstration Script for Evaluator

### Step 1: Automated Verification Test Run (2 Minutes)
Open a terminal in the project directory and run:
```powershell
npm run db:test
```
**What to point out to the evaluator:**
- Shows **21 / 21 automated tests passing** (100%).
- Demonstrates active relational database connection, views, trigger activation, ACID transactions, 384-d vector embeddings, ChromaDB cosine similarity retrieval, bcrypt password verification, and RBAC authorization.

---

### Step 2: Problem Statement & Homepage Overview (1 Minute)
1. Launch the web application:
   ```powershell
   npm run dev
   ```
2. Open `http://localhost:3000` in your web browser.
3. Show the live aggregate platform statistics:
   - Active Community Campaigns
   - Government Verified NGOs
   - Verified Volunteer Hours
   - Registered Platform Volunteers
4. Point out the team credits in the hero banner: **Rishi (PES1UG24AM224)** & **Rohanth (PES1UG24AM227)**.

---

### Step 3: AI Semantic Matchmaking Demonstration (Option 2: Vector DB) (3 Minutes)
1. Navigate to `/login` and click **"Quick Fill: Rishi (Volunteer)"** (`rishi@pes.edu` / `Password@123`).
2. Click **"Sign In"**. You are redirected to the **Volunteer Portal** (`/volunteer/dashboard`).
3. Click **"Explore & Match"** (`/opportunities`) in the navigation bar.
4. Click the purple glowing button: **"Match With My Profile (AI)"**.
5. **What to point out to the evaluator:**
   - The backend converts the volunteer's unstructured skills, interests, and bio into a **384-dimensional dense semantic embedding vector** (\(L_2\) norm = 1.0000).
   - ChromaDB queries the `ngo_opportunities` vector collection using **Cosine Similarity**.
   - Opportunities are dynamically re-ordered by a hybrid compatibility score (60% Vector Semantic Alignment + 20% Location Match + 10% Experience + 10% NGO Trust).
   - Show the explainable recommendation tags (e.g. *"Strong semantic skill & interest alignment"*, *"Local city match"*).

---

### Step 4: ACID Transaction & Trigger-Driven Shift Enrollment (2 Minutes)
1. On any opportunity (e.g., "Underprivileged Youth Coding & Math Boot Camp"), click **"View Shifts & Enroll"**.
2. Notice the current capacity progress bar (e.g. *2 / 10 slots filled*).
3. Click **"Enroll in Shift"**.
4. **What to point out to the evaluator:**
   - The system executes a concurrency-safe enrollment.
   - Database trigger `trg_increment_shift_filled_count` fires automatically and increments the shift's filled count by 1 in the database.
   - Attempting to enroll again returns immediate duplicate prevention error (`Volunteer is already enrolled in this shift`).

---

### Step 5: NGO Operations & Reactive Hours Accumulation Trigger (3 Minutes)
1. Switch to the NGO persona: Click the profile avatar in the navbar, click **Sign Out**, and log in as `contact@teachfortomorrow.org` (`Password@123`).
2. Navigate to the **NGO Portal** (`/ngo/dashboard`).
3. View the **Shift Attendance Roster**.
4. Click **"Verify & Log Hours"** on a registered volunteer.
5. **What to point out to the evaluator:**
   - Database trigger `trg_update_volunteer_hours` fires:
     - Automatically accumulates verified hours onto `volunteers.total_hours_contributed`.
     - Automatically recalculates and promotes the volunteer's badge level (`BRONZE` ➔ `SILVER` ➔ `GOLD` ➔ `PLATINUM`).
     - Appends an immutable security record in `audit_logs`.

---

### Step 6: Verifiable SHA-256 Certificate Issuance & Public Lookup (2 Minutes)
1. In the NGO Portal, click **"Issue Certificate"**.
2. Select a volunteer and opportunity, and click **"Generate & Issue Certificate"**.
3. Open the public certificate verification link:
   `http://localhost:3000/verify/<certificate_code>`
4. **What to point out to the evaluator:**
   - Demonstrates the cryptographic SHA-256 hash ledger lookup.
   - Shows the verified badge, signatory details, credited hours, and printable PDF layout.

---

### Step 7: Platform Administrator & Live Interactive SQL Lab (3 Minutes)
1. Log in as Platform Administrator (`rishi.admin@pes.edu` / `Password@123`).
2. Navigate to the **Admin & SQL Lab** (`/admin/dashboard`).
3. View the system overview: Total Volunteers, Verified NGOs, Open Campaigns, Total Verified Hours, Certificates Issued.
4. Scroll to the **Interactive DBMS Laboratory & Query Runner**.
5. Select each preloaded query from the dropdown and click **"Run Query Live"**:
   - **Query 1: Multi-Table JOIN with Aggregations** (Combines `ngos`, `opportunities`, `shifts`, `shift_assignments`).
   - **Query 2: Aggregation with HAVING Filter** (Filters NGOs with `COUNT(DISTINCT ...) >= 1 AND SUM(...) > 5.0`).
   - **Query 3: Correlated Subquery** (Finds volunteers exceeding the average hours of their respective city).
   - **Query 4: Subquery with NOT IN** (Finds verified NGOs with 0 active campaigns).
   - **Query 5: Window Functions (`DENSE_RANK()`)** (Calculates volunteer global and partitioned city ranks).
   - **Query 6: Cause-Wise Impact Rollup** (Aggregates community metrics grouped by cause category).
6. **What to point out to the evaluator:**
   - Millisecond execution latency profiling.
   - Returned row counts and formatted result tables.
   - Shows live, unmocked database query execution.

---

### Step 8: Git Contribution History & Division of Responsibilities (1 Minute)
Run in terminal:
```powershell
git log --format="%h | %an <%ae> | %s" -n 10
```
**What to point out to the evaluator:**
- Balanced commit distribution from both team members across database schemas, triggers, backend API routes, and frontend portals.

