# NGO Volunteer Matchmaking System (VolunTrack.AI)
### PES University — Department of Computer Science & Engineering
**Course:** DBMS Experiential Learning – Level 3 Project  
**Option Chosen:** Option 2: Relational SQL Database + Vector Database  

---

### Team Information
- **Rishi** — Student Registration Number: `PES1UG24AM224`
- **Rohanth** — Student Registration Number: `PES1UG24AM227`
- **Faculty In-Charge:** Dr. Nagasundari S

---

## 1. Executive Summary

The **NGO Volunteer Matchmaking System** is a dual-paradigm database application built to satisfy all **18 requirements** of the DBMS Experiential Learning Level 3 curriculum. The system integrates:
1. **Primary Relational Database Engine (MySQL 8.0 with SQLite WAL fallback):** Guarantees strict ACID transactional integrity, enforces 3NF relational schemas, executes event-driven database triggers (`AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE`), evaluates multi-table analytical views, and runs transactional shift enrollments.
2. **Dedicated Vector Database (ChromaDB):** Operates on high-dimensional vector spaces (384-dimensional dense semantic embeddings), indexing volunteer capability matrices and NGO opportunity briefings to deliver nearest-neighbor cosine similarity matchmaking.
3. **Enterprise Web Application (Next.js 14 App Router):** Fully integrated with the backend databases, featuring Role-Based Access Control (`ADMIN`, `NGO`, `VOLUNTEER`), bcrypt password encryption, secure HTTP-only session cookies, interactive SQL profiling laboratory, and cryptographic SHA-256 certificate verification.

---

## 2. Official 18-Requirement Compliance Matrix

| No. | Requirement | Status | Implementation Files / Evidence | Verification Details |
|:---:|:---|:---:|:---|:---|
| **1** | **Project Title** | **PASS** | `README.md`, `DOCUMENTATION.md`, `package.json`, `app/layout.js` | Clear, real-world, beyond-CRUD title: "NGO Volunteer Matchmaking System" (*Note: Section-wide uniqueness requires faculty roster cross-check). |
| **2** | **Team Formation** | **PASS** | `DOCUMENTATION.md` (Sections 0, 14), Git log | 2-member team: Rishi (PES1UG24AM224) & Rohanth (PES1UG24AM227) with balanced DB & app contributions. |
| **3** | **Database Requirement** | **PASS** | `lib/db/index.js`, `lib/vector/chroma.js` | Dual-paradigm architecture: Relational SQL (MySQL 8.0 / SQLite WAL fallback) + ChromaDB Vector Store. |
| **4** | **Database Design** | **PASS** | `DOCUMENTATION.md` (Sections 5, 6, 8) | Mermaid ER diagram (10 entities), 3NF normalized schema, data dictionary, and 384-d vector data model. |
| **5** | **SQL Implementation** | **PASS** | `sql/01_ddl_schema.sql`, `sql/02_indexes.sql`, `sql/03_views.sql` | CREATE, ALTER, DROP, PK, FK (`ON DELETE CASCADE`), CHECK constraints, 9 indexes, 4 analytical views. |
| **6** | **Database Operations** | **PASS** | `sql/06_advanced_queries.sql`, `app/api/**` | INSERT, UPDATE, DELETE, SELECT, JOIN, GROUP BY, HAVING, ORDER BY, Aggregates, Correlated subqueries. |
| **7** | **Advanced Database Features** | **PASS** | `sql/04_triggers.sql`, `sql/05_procedures.sql`, `lib/vector/` | 4+ SQL features (ACID Transactions, Triggers, Views, Indexes, Window Functions) + ChromaDB vector similarity. |
| **8** | **Vector Database / Semantic Search**| **PASS** | `lib/vector/embeddings.js`, `lib/vector/similarity.js` | 384-d dense embeddings, anchor domain clusters, unit \(L_2\) normalization, Cosine Similarity, hybrid ranking. |
| **9** | **Web Application Interface** | **PASS** | `app/` (Next.js 14 App Router, Tailwind CSS) | 21 compiled routes, interactive filtering, opportunity explorer, volunteer/NGO dashboards, SQL Lab. |
| **10**| **Database–Application Integration** | **PASS** | `lib/db/index.js`, `app/api/**` | Clean API layer, parameterized SQL queries, zero hardcoded secrets, robust connection error handling. |
| **11**| **Authentication & Authorization** | **PASS** | `lib/auth.js`, `app/api/auth/` | 3 discrete roles (`ADMIN`, `NGO`, `VOLUNTEER`), bcrypt hashing, HTTP-only cookies, backend RBAC route guards. |
| **12**| **Data Validation & Integrity** | **PASS** | `sql/01_ddl_schema.sql`, `lib/db/init.js` | Database CHECK constraints, FK cascades, UNIQUE constraints on email, code, and shift enrollments. |
| **13**| **Security** | **PASS** | `lib/auth.js`, `.gitignore`, `.env.example` | Bcrypt salt-hashing, parameterized queries (SQLi immune), `.env.local` excluded from Git, secrets protected. |
| **14**| **Project Documentation** | **PASS** | `DOCUMENTATION.md`, `PROJECT_DOCUMENTATION.md` | Covers all 15 chapters: Problem, Objectives, ERD, 3NF schema, Data Dictionary, Queries, Test Matrix. |
| **15**| **Git / GitHub** | **PASS** | `.git/`, Git commit log | Active Git repository with contribution history from both members, comprehensive README and `.gitignore`. |
| **16**| **Evaluation / Demonstration** | **PASS** | `DEMONSTRATION_GUIDE.md`, `scripts/test-db.js` | Complete 10-point demonstration guide covering live query execution, trigger firing, and vector matching. |
| **17**| **Originality** | **PASS** | Repository codebase | Custom domain combining NGO impact tracking with 384-d AI vector search and cryptographic SHA-256 certs. |
| **18**| **Level 3 Expectation** | **PASS** | Full application architecture | Substantially exceeds simple CRUD: AI semantic matchmaking, reactive triggers, verifiable credential ledger. |

---

## 3. System Architecture

```
[ Client Browser / User Roles: Admin | NGO | Volunteer ]
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js 14 App Router (Web & API)          │
│  - Secure HTTP-Only Cookie Session (`ngo_auth_session`)    │
│  - RBAC Route Protection (Admin, NGO, Volunteer)           │
│  - Bcrypt Password Hashing (`lib/auth.js`)                 │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Relational Engine       │ │   Vector Database Engine   │
│     MySQL 8.0 / SQLite WAL   │ │          ChromaDB          │
│                              │ │  (Collection:              │
│  - 10 Tables (3NF Schema)    │ │   ngo_opportunities)       │
│  - ACID Transactions         │ │  - 384-d Dense Embeddings  │
│  - Triggers & Views          │ │  - Cosine Distance Metric  │
│  - Stored Procedures         │ │  - Semantic Skill Matcher  │
│  - Automated Audit Logging   │ │  - Hybrid Weighted Score   │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 4. Default Seed Test Accounts

All pre-configured test personas use the standardized test password: `Password@123`

| Role | Persona Name | Email | Password | Role Description & Purpose |
|:---|:---|:---|:---|:---|
| **ADMIN** | Rishi (Platform Admin) | `rishi.admin@pes.edu` | `Password@123` | System Administrator — NGO approvals, trigger audits, SQL Lab |
| **ADMIN** | Rohanth (Platform Admin) | `rohanth.admin@pes.edu` | `Password@123` | System Administrator — System configuration & analytical queries |
| **VOLUNTEER** | Rishi (Volunteer) | `rishi@pes.edu` | `Password@123` | CS student • STEM & coding mentor • Volunteer applications |
| **VOLUNTEER** | Rohanth (Volunteer) | `rohanth@pes.edu` | `Password@123` | Emergency responder • First aid responder • Hours & badges |
| **NGO** | Teach For Tomorrow Foundation | `contact@teachfortomorrow.org` | `Password@123` | Verified Education NGO — Shift rosters & certificate issuance |
| **NGO** | Bright Futures Trust | `contact@brightfutures.org` | `Password@123` | Verified Education NGO — Opportunity publishing |

---

## 5. Step-by-Step Installation & Setup

### Step 1: Open Project Directory
```powershell
cd "<path_to_project_directory>"
```

### Step 2: Install Node.js Dependencies
```powershell
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env.local` if not already present:
```powershell
cp .env.example .env.local
```
Configure your environment variables in `.env.local`:
```env
# Database Configuration (MySQL 8.0 Primary with SQLite fallback)
DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD="your_mysql_password"
DB_NAME=ngo_volunteer_db

# ChromaDB Configuration (Vector Database)
CHROMA_SERVICE_URL=http://127.0.0.1:8000
CHROMA_PATH=./chroma_data
CHROMA_COLLECTION=ngo_opportunities

# Vector Dimension Configuration
VECTOR_EMBEDDING_DIMENSIONS=384
VECTOR_SIMILARITY_METRIC=cosine

# Next.js Application Environment
PORT=3000
NODE_ENV=development
```

### Step 4: Seed Database & Initialize Vectors
To initialize the schema, triggers, views, benchmark data, and 384-dimensional dense semantic vectors:
```powershell
npm run seed
```

### Step 5: Execute Automated Verification Test Suite
Run the automated test harness:
```powershell
npm run db:test
```
*Executes all 21 verification checks across Relational SQL, Views, Triggers, ACID Transactions, ChromaDB Vectors, Bcrypt Authentication, and Rubric Queries.*

### Step 6: Launch Web Application
```powershell
npm run dev
```
Open your browser and navigate to: **`http://localhost:3000`**

To run a production build:
```powershell
npm run build
npm start
```

---

## 6. Key Demonstration Workflows

### 1. AI Semantic Matchmaker (`/opportunities`)
- Log in as a Volunteer (`rishi@pes.edu` / `Password@123`).
- Go to **Explore & Match** (`/opportunities`).
- Click **"Match With My Profile (AI)"**.
- The system extracts the volunteer's competencies and queries ChromaDB for 384-dimensional cosine nearest neighbors, returning percentage compatibility and semantic explanations.

### 2. Transactional Shift Enrollment & Trigger Count
- Click **"View Shifts & Enroll"** on any opportunity card.
- Click **"Enroll in Shift"**.
- Enforces shift capacity limits, prevents duplicate enrollments, records the assignment, and triggers `trg_increment_shift_filled_count` to increment `shifts.filled_count`.

### 3. Reactive Hours Accumulation & Tier Elevation
- Log in as an NGO Representative (`contact@teachfortomorrow.org` / `Password@123`).
- Go to the **NGO Portal** (`/ngo/dashboard`).
- In the **Shift Attendance Roster**, click **"Verify & Log Hours"**.
- Triggers `trg_update_volunteer_hours`: credits volunteer hours, updates tier rank (`BRONZE` → `SILVER` → `GOLD` → `PLATINUM`), and records an entry in `audit_logs`.

### 4. Cryptographic SHA-256 Certificate Verification
- In the NGO Portal, click **"Issue Certificate"** for an enrolled volunteer.
- Generates a unique SHA-256 cryptographic verification code and writes it to the database ledger.
- Open the public URL `/verify/<certificate_code>` to view and print the tamper-proof certificate.

### 5. Interactive SQL Laboratory (`/admin/dashboard`)
- Log in as Platform Administrator (`rishi.admin@pes.edu` / `Password@123`).
- Navigate to the **Admin Control Center & SQL Lab**.
- Execute and profile analytical queries live:
  - Multi-Table JOIN with Aggregations
  - GROUP BY with HAVING Filter
  - Correlated Subquery
  - Window Functions (`DENSE_RANK()`)
- Inspect execution profiling times (in milliseconds) and live result tables.

---

## 7. Submission Deliverables

- `README.md`: Official project overview, quickstart instructions, and compliance mapping.
- `REQUIREMENT_TRACEABILITY.md`: 54-item granular traceability matrix across all 18 requirements.
- `CLEANUP_REPORT.md`: Workspace file classification and safe cleanup audit log.
- `TESTING_REPORT.md`: 21-point automated verification results matrix.
- `PROJECT_DOCUMENTATION.md`: 15-chapter comprehensive academic project documentation report.
- `DEMONSTRATION_GUIDE.md`: Step-by-step evaluator demonstration script.
- `sql/`: 7 canonical SQL scripts covering DDL, indexes, views, triggers, procedures, queries, and seed data.
