// ============================================================================
// DBMS Level 3 Project: NGO Volunteer Matchmaking System
// Team: Rishi (PES1UG24AM224) & Rohanth (PES1UG24AM227)
// File: scripts/seed.js
// Manual Database Reset & Re-seeding Script
// ============================================================================

import { getDatabase } from '../lib/db/index.js';
import { initializeDatabase } from '../lib/db/init.js';

console.log('Resetting and re-seeding database...');
const db = getDatabase();
initializeDatabase(db);
console.log('Database successfully re-seeded with benchmark data.');

