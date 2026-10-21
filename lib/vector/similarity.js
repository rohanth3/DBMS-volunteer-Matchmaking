// ============================================================================
// DBMS Level 3 Project: NGO Volunteer Matchmaking System
// Team: Rishi (PES1UG24AM224) & Rohanth (PES1UG24AM227)
// File: lib/vector/similarity.js
// Vector Similarity Search & Hybrid Matchmaking Engine
// ============================================================================

/**
 * Computes exact Cosine Similarity between two dense numeric vectors
 * Cosine Similarity = (A . B) / (||A|| * ||B||)
 * Since vectors are pre-normalized to unit length (L2 norm = 1),
 * cosine similarity simplifies directly to the dot product.
 *
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} - Similarity score between -1.0 and 1.0 (clamped to 0.0 - 1.0)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, Number(similarity.toFixed(4))));
}

/**
 * Hybrid Semantic Matchmaking Algorithm
 * Combines high-dimensional Vector Cosine Similarity with Relational SQL constraints:
 *   - Semantic Vector Similarity: 60%
 *   - Location Proximity / Remote capability: 20%
 *   - Experience Requirements Alignment: 10%
 *   - Organization Verification Trust Factor: 10%
 *
 * @param {Object} volunteer - Volunteer record with profile_vector
 * @param {Array<Object>} opportunities - List of opportunities with opportunity_vector
 * @returns {Array<Object>} - Ranked opportunities with detailed match telemetry
 */
export function rankOpportunitiesForVolunteer(volunteer, opportunities) {
  if (!volunteer || !opportunities || !Array.isArray(opportunities)) {
    return [];
  }

  let volVec = volunteer.profile_vector;
  if (typeof volVec === 'string') {
    try {
      volVec = JSON.parse(volVec);
    } catch (e) {
      volVec = [];
    }
  }

  const results = opportunities.map((opp) => {
    let oppVec = opp.opportunity_vector;
    if (typeof oppVec === 'string') {
      try {
        oppVec = JSON.parse(oppVec);
      } catch (e) {
        oppVec = [];
      }
    }

    // 1. Semantic Vector Score (0.0 to 1.0)
    const semanticScore = cosineSimilarity(volVec, oppVec);

    // 2. Relational Location Alignment (0.0 to 1.0)
    let locationScore = 0.5; // default
    if (opp.location_type === 'REMOTE') {
      locationScore = 1.0;
    } else if (
      opp.location_city &&
      volunteer.location_city &&
      opp.location_city.toLowerCase() === volunteer.location_city.toLowerCase()
    ) {
      locationScore = 1.0;
    } else if (opp.location_type === 'HYBRID') {
      locationScore = 0.75;
    } else {
      locationScore = 0.2;
    }

    // 3. Experience Alignment (0.0 to 1.0)
    const volExp = volunteer.experience_years || 0;
    const reqExp = opp.experience_required || 0;
    let expScore = 1.0;
    if (volExp < reqExp) {
      expScore = Math.max(0.3, 1.0 - (reqExp - volExp) * 0.25);
    }

    // 4. Verification & Trust Factor
    const trustScore = opp.verification_status === 'VERIFIED' ? 1.0 : 0.7;

    // Composite Weighted Match Score
    const compositeScore = Number(
      (
        semanticScore * 0.60 +
        locationScore * 0.20 +
        expScore * 0.10 +
        trustScore * 0.10
      ).toFixed(4)
    );

    // Match explanation for transparency
    const matchReasons = [];
    if (semanticScore >= 0.80) {
      matchReasons.push('Strong semantic skill & interest alignment');
    } else if (semanticScore >= 0.60) {
      matchReasons.push('Moderate skill overlap');
    }

    if (locationScore === 1.0) {
      matchReasons.push(opp.location_type === 'REMOTE' ? 'Remote opportunity' : 'Local city match');
    }

    if (expScore === 1.0) {
      matchReasons.push('Meets experience requirements');
    }

    if (opp.verification_status === 'VERIFIED') {
      matchReasons.push('Verified partner organization');
    }

    return {
      ...opp,
      matchMetrics: {
        compositeScore,
        matchPercentage: Math.round(compositeScore * 100),
        semanticScore: Number(semanticScore.toFixed(4)),
        semanticPercentage: Math.round(semanticScore * 100),
        locationScore,
        expScore,
        matchReasons
      }
    };
  });

  // Sort descending by composite score
  return results.sort((a, b) => b.matchMetrics.compositeScore - a.matchMetrics.compositeScore);
}

