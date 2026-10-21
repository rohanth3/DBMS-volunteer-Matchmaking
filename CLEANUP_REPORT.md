# Project Directory Cleanup Report

**Project:** NGO Volunteer Matchmaking System (VolunTrack.AI)  
**Date:** November 1, 2026  
**Auditor:** Senior Software Engineer, Database Architect & Compliance Auditor  

---

## 1. Directory Inventory & Classification

All files within the workspace have been categorized into functional classifications:

### Category 1: Essential Source Files (Retained)
- `app/layout.js`, `app/globals.css`, `app/page.js`: Core Next.js App Router root layout, Tailwind styling, and platform homepage.
- `app/login/page.js`: Multi-persona authentication portal with quick-fill demo profiles.
- `app/opportunities/page.js`: Volunteer opportunity explorer with dynamic filtering and semantic AI match invocation.
- `app/admin/dashboard/page.js`: Platform administration overview and interactive SQL execution/profiling laboratory.
- `app/ngo/dashboard/page.js`: NGO campaign manager, shift scheduler, attendance roster, and certificate issuer.
- `app/volunteer/dashboard/page.js`: Volunteer contribution tracker, badge progression, verified hours, and printable certificates.
- `app/verify/[code]/page.js`: Public cryptographic SHA-256 certificate verification portal.
- `components/Navbar.js`: Role-based dynamic navigation bar with responsive layout and persona switching.
- `lib/auth.js`: Bcrypt password verification, session cookie management, and RBAC authorization guards.
- `lib/db/index.js`: Dual-engine database abstraction (MySQL 8.0 Primary with SQLite fallback), parameterized query execution, transaction support.
- `lib/db/init.js`: Automated database bootstrapper with 10 normalized tables, 9 indexes, 4 views, 5 triggers, seed records, and vector generation.
- `lib/vector/chroma.js`: ChromaDB vector database connector, HTTP client, and persistent vector record store.
- `lib/vector/embeddings.js`: 384-dimensional dense semantic feature extraction with anchor domain clusters and unit \(L_2\) normalization.
- `lib/vector/similarity.js`: Cosine similarity calculation and hybrid matchmaking ranking engine.
- `app/api/**`: 12 REST API route handlers for authentication, opportunities, shifts, attendance, certificates, and SQL execution.

### Category 2: Configuration Files (Retained)
- `package.json`, `package-lock.json`: Project manifest, scripts (`dev`, `build`, `start`, `lint`, `seed`, `db:test`), and locked dependency tree.
- `next.config.js`: Next.js configuration.
- `tailwind.config.js`, `postcss.config.js`: Tailwind CSS styling rules and post-processing pipeline.
- `jsconfig.json`: Module path alias resolution (`@/*`).
- `.env.example`: Public template documenting required environment variables with non-sensitive placeholders.
- `.env.local`: Local developer environment configuration.
- `.gitignore`: Git exclusion patterns protecting sensitive files, build artifacts, and caches.

### Category 3: Database & Migration Files (Retained)
- `data/ngo_volunteer.db`, `data/ngo_volunteer.db-shm`, `data/ngo_volunteer.db-wal`: SQLite database in WAL mode with pre-seeded benchmark data.
- `chroma_data/chroma.sqlite3`, `chroma_data/**`: ChromaDB persistent vector database index storing 384-d opportunity embeddings.
- `sql/01_ddl_schema.sql`: 3NF normalized relational DDL with CREATE, ALTER, DROP, PK, FK, and domain CHECK constraints.
- `sql/02_indexes.sql`: 9 B-Tree and composite performance indexes.
- `sql/03_views.sql`: 4 complex multi-table analytical views with window functions.
- `sql/04_triggers.sql`: 5 reactive triggers for filled counts, volunteer hour accumulation, tier calculation, and audit logging.
- `sql/05_procedures.sql`: MySQL stored procedures (`sp_apply_for_shift`, `sp_verify_and_issue_certificate`) with ACID transactions and row-level locking.
- `sql/06_advanced_queries.sql`: 6 analytical queries demonstrating JOINs, GROUP BY, HAVING, ORDER BY, Subqueries, and Window Functions.
- `sql/07_seed_data.sql`: Benchmark seed data for users, NGOs, opportunities, shifts, applications, assignments, metrics, and certificates.
- `sql/mysql_migration.sql`: Dedicated native MySQL 8.0 migration script.

### Category 4: Testing & Automation Scripts (Retained & Fixed)
- `scripts/test-db.js`: Comprehensive verification harness verifying relational engine, views, triggers, procedures, ChromaDB vectors, bcrypt auth, and RBAC guards.
- `scripts/seed.js`: Database reset and re-seeding script.

### Category 5: Documentation Files (Retained & Updated)
- `README.md`: Official project overview, quickstart instructions, and compliance mapping.
- `DOCUMENTATION.md`: 15-chapter comprehensive academic project report.
- `REQUIREMENT_TRACEABILITY.md`: 54-item requirement compliance matrix.

### Category 6: Temporary / Obsolete Files (Removed)
- `test.zip`: 44.8 KB zip archive created during prior packaging; redundant duplicate of the `app/` folder and excluded by `.gitignore`.

---

## 2. Actions Executed

| File Path | Action | Rationale |
|:---|:---:|:---|
| `test.zip` | **REMOVED** | Redundant archive of `app/` folder created at 19:17 today. Already matched by `.gitignore` `*.zip`. Not required for build, execution, or testing. |
| `lib/db/index.js` | **REMEDIATED** | Removed hardcoded fallback password `Rishi#@0617` on lines 26-30. Enforced strict environment variable lookup (`process.env.DB_PASSWORD`). |
| `scripts/seed.js` | **REMEDIATED** | Fixed invalid import of `getDatabase` (changed to `getSQLiteInstance`), enabling `npm run seed` to execute without syntax error. |
| `app/api/**` & Pages | **REMEDIATED** | Harmonized queries across routes and dashboards to match the canonical 10-table relational schema. |

---

## 3. Preserved Artifacts Confirmation

- No source code files were deleted.
- No database migrations or seed files were modified destructively.
- Existing user data in `data/ngo_volunteer.db` and vectors in `chroma_data/` were preserved intact.
- Git repository history and existing branches were left undisturbed.

