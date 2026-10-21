// ============================================================================
// DBMS Level 3 Project: NGO Volunteer Matchmaking System
// Team: Rishi (PES1UG24AM224) & Rohanth (PES1UG24AM227)
// File: lib/vector/chroma.js
// ChromaDB Vector Database Connector & Indexer
// ============================================================================

import { ChromaClient } from 'chromadb';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { cosineSimilarity } from './similarity.js';

const CHROMA_URL = process.env.CHROMA_SERVICE_URL || 'http://127.0.0.1:8000';
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || 'ngo_opportunities';
const CHROMA_DIR = path.join(process.cwd(), 'chroma_data');

let chromaClient = null;
let isServiceAvailable = null;

/**
 * Check if the standalone ChromaDB HTTP service is reachable
 */
export async function checkChromaHealth() {
  if (isServiceAvailable !== null) return isServiceAvailable;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    const res = await fetch(`${CHROMA_URL}/api/v1/heartbeat`, {
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(timeout);

    if (res && res.ok) {
      isServiceAvailable = true;
      chromaClient = new ChromaClient({ path: CHROMA_URL });
      return true;
    }
  } catch (e) {
    // Service offline
  }

  isServiceAvailable = false;
  return false;
}

/**
 * Access persistent Chroma SQLite database direct fallback
 */
function getPersistentChromaDb() {
  if (!fs.existsSync(CHROMA_DIR)) {
    fs.mkdirSync(CHROMA_DIR, { recursive: true });
  }
  const dbPath = path.join(CHROMA_DIR, 'chroma.sqlite3');
  const db = new Database(dbPath);

  // Initialize dedicated persistent vector records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chroma_vector_records (
      id TEXT PRIMARY KEY,
      collection_name TEXT NOT NULL,
      embedding TEXT NOT NULL,
      document TEXT,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_cvr_col ON chroma_vector_records(collection_name);
  `);

  return db;
}

/**
 * Upsert opportunity embedding and metadata into ChromaDB
 */
export async function upsertOpportunityVector(opportunityId, embedding, metadata = {}, document = '') {
  const hasService = await checkChromaHealth();

  if (hasService && chromaClient) {
    try {
      const collection = await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME });
      await collection.upsert({
        ids: [`opp-${opportunityId}`],
        embeddings: [embedding],
        metadatas: [metadata],
        documents: [document]
      });
      return { success: true, mode: 'chroma_http_service' };
    } catch (err) {
      console.warn('[ChromaDB Service Warning]:', err.message);
    }
  }

  // Persistent Chroma SQLite store
  try {
    const db = getPersistentChromaDb();
    const id = `opp-${opportunityId}`;
    db.prepare(`
      INSERT INTO chroma_vector_records (id, collection_name, embedding, document, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        embedding = excluded.embedding,
        document = excluded.document,
        metadata = excluded.metadata,
        created_at = CURRENT_TIMESTAMP
    `).run(id, COLLECTION_NAME, JSON.stringify(embedding), document, JSON.stringify(metadata));

    return { success: true, mode: 'chroma_persistent_store' };
  } catch (error) {
    console.error('[ChromaDB Error]:', error.message);
    throw error;
  }
}

/**
 * Query ChromaDB for top-K nearest opportunities using vector Cosine Similarity
 */
export async function querySimilarOpportunities(queryVector, limit = 5) {
  const hasService = await checkChromaHealth();

  if (hasService && chromaClient) {
    try {
      const collection = await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME });
      const results = await collection.query({
        queryEmbeddings: [queryVector],
        nResults: limit
      });

      if (results && results.ids && results.ids[0]?.length > 0) {
        return results.ids[0].map((idWithPrefix, idx) => {
          const rawId = idWithPrefix.replace(/^opp-/, '');
          const distance = results.distances?.[0]?.[idx] ?? 0.5;
          const similarity = Math.max(0, Math.min(1, 1 - distance));
          return {
            opportunity_id: rawId,
            similarity: Number(similarity.toFixed(4)),
            metadata: results.metadatas?.[0]?.[idx] || {},
            document: results.documents?.[0]?.[idx] || ''
          };
        });
      }
    } catch (err) {
      console.warn('[ChromaDB Query Warning]:', err.message);
    }
  }

  // Query from persistent Chroma SQLite store
  try {
    const db = getPersistentChromaDb();
    const rows = db.prepare('SELECT id, embedding, document, metadata FROM chroma_vector_records WHERE collection_name = ?').all(COLLECTION_NAME);

    const scored = rows.map(r => {
      let vec = [];
      try { vec = JSON.parse(r.embedding); } catch (e) {}
      const sim = cosineSimilarity(queryVector, vec);
      let meta = {};
      try { meta = JSON.parse(r.metadata); } catch (e) {}

      return {
        opportunity_id: r.id.replace(/^opp-/, ''),
        similarity: Number(sim.toFixed(4)),
        metadata: meta,
        document: r.document || ''
      };
    });

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error('[ChromaDB Query Error]:', error.message);
    return [];
  }
}

/**
 * Synchronize multiple opportunities into ChromaDB
 */
export async function syncOpportunitiesToChroma(opportunities) {
  let count = 0;
  for (const opp of opportunities) {
    let vec = opp.embedding || opp.opportunity_vector;
    if (typeof vec === 'string') {
      try { vec = JSON.parse(vec); } catch (e) { vec = []; }
    }
    if (Array.isArray(vec) && vec.length > 0) {
      const doc = `${opp.title}. ${opp.description || ''}. Cause: ${opp.cause_category || ''}. City: ${opp.city || opp.location_city || ''}`;
      const meta = {
        title: opp.title,
        cause_category: opp.cause_category || 'Community',
        city: opp.city || opp.location_city || 'Bengaluru',
        ngo_id: opp.ngo_id
      };
      await upsertOpportunityVector(opp.opportunity_id, vec, meta, doc);
      count++;
    }
  }
  return count;
}
