// ============================================================================
// DBMS Level 3 Project: NGO Volunteer Matchmaking System
// Team: Rishi (PES1UG24AM224) & Rohanth (PES1UG24AM227)
// File: lib/vector/embeddings.js
// Vector Database Component - Feature Extraction & Dense Semantic Embeddings
// ============================================================================

/**
 * Domain-specific semantic semantic dimensions (384-dimensional space projection)
 * Maps unstructured text (skills, bio, causes, requirements) into dense vectors.
 */

const VECTOR_DIMENSIONS = 384;

// High-impact semantic anchor domains for volunteer-NGO matchmaking
const DOMAIN_CLUSTERS = {
  education: [
    'teach', 'teaching', 'tutor', 'tutoring', 'math', 'mathematics', 'coding', 
    'python', 'programming', 'stem', 'physics', 'curriculum', 'school', 'children', 
    'kids', 'learning', 'literacy', 'english', 'mentorship', 'academic', 'college'
  ],
  environment: [
    'tree', 'planting', 'plantation', 'forest', 'miyawaki', 'sapling', 'nature', 
    'climate', 'lake', 'water', 'conservation', 'soil', 'compost', 'biodiversity', 
    'ecology', 'cleanup', 'waste', 'recycle', 'green', 'pollution', 'earth'
  ],
  healthcare: [
    'health', 'medical', 'medicine', 'doctor', 'nurse', 'nursing', 'first aid', 
    'cpr', 'emergency', 'triage', 'blood', 'clinic', 'patient', 'hospital', 
    'screening', 'disease', 'hygiene', 'vital', 'glucose', 'mental', 'care'
  ],
  animal_welfare: [
    'animal', 'animals', 'dog', 'dogs', 'cat', 'cats', 'pet', 'shelter', 'rescue', 
    'rehabilitation', 'vet', 'veterinary', 'adoption', 'grooming', 'feeding', 
    'stray', 'wildlife', 'canine', 'feline', 'puppy'
  ],
  disaster_relief: [
    'disaster', 'relief', 'flood', 'earthquake', 'emergency', 'ration', 'packaging', 
    'distribution', 'logistics', 'supply', 'rescue', 'evacuation', 'shelter', 
    'first responder', 'kit', 'warehouse', 'truck', 'coastal'
  ],
  community_empowerment: [
    'women', 'empowerment', 'elderly', 'community', 'poverty', 'slum', 'rights', 
    'legal', 'art', 'music', 'fundraising', 'advocacy', 'outreach', 'organizing'
  ]
};

/**
 * Hash a string token into a deterministic integer seed
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Pseudo-random generator with seed
 */
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate a dense 384-dimensional normalized vector embedding from unstructured text
 * @param {string} text - Raw input text (skills, bio, description, etc.)
 * @returns {Array<number>} - 384-dimensional unit vector
 */
export function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    return new Array(VECTOR_DIMENSIONS).fill(0);
  }

  const normalizedText = text.toLowerCase();
  const tokens = normalizedText.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  const vector = new Array(VECTOR_DIMENSIONS).fill(0);

  // 1. Process Domain Cluster Anchors (Semantic projection)
  const clusterNames = Object.keys(DOMAIN_CLUSTERS);
  const segmentSize = Math.floor(VECTOR_DIMENSIONS / (clusterNames.length + 1));

  clusterNames.forEach((clusterName, clusterIndex) => {
    const keywords = DOMAIN_CLUSTERS[clusterName];
    let matchCount = 0;

    keywords.forEach(kw => {
      if (normalizedText.includes(kw)) {
        matchCount += 1;
      }
    });

    if (matchCount > 0) {
      const startIdx = clusterIndex * segmentSize;
      const endIdx = startIdx + segmentSize;
      const weight = Math.log1p(matchCount) * 1.5;

      for (let i = startIdx; i < endIdx; i++) {
        const factor = Math.sin((i - startIdx + 1) * 0.45);
        vector[i] += weight * factor;
      }
    }
  });

  // 2. Sub-word N-gram Feature Projection across remaining vector space
  tokens.forEach((token) => {
    const tokenHash = hashString(token);
    const primaryIdx = tokenHash % VECTOR_DIMENSIONS;
    const secondaryIdx = (tokenHash * 31 + 17) % VECTOR_DIMENSIONS;
    const tertiaryIdx = (tokenHash * 97 + 43) % VECTOR_DIMENSIONS;

    const baseVal = 0.5 + (token.length > 5 ? 0.3 : 0.1);
    vector[primaryIdx] += baseVal;
    vector[secondaryIdx] += baseVal * 0.7;
    vector[tertiaryIdx] += baseVal * 0.4;

    // Character bi-grams for morphological variations (e.g. "teach", "teaching", "teacher")
    for (let j = 0; j < token.length - 1; j++) {
      const bigram = token.substring(j, j + 2);
      const bgHash = hashString(bigram);
      const bgIdx = bgHash % VECTOR_DIMENSIONS;
      vector[bgIdx] += 0.15;
    }
  });

  // 3. L2 Normalization (Euclidean norm = 1.0)
  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }
  }

  return vector;
}

/**
 * Format volunteer profile for embedding generation
 */
export function buildVolunteerEmbeddingText(volunteer, user) {
  return [
    `Name: ${user?.full_name || ''}`,
    `Skills: ${volunteer?.skills || ''}`,
    `Interests & Causes: ${volunteer?.interests || ''}`,
    `Bio: ${volunteer?.bio || ''}`,
    `City: ${volunteer?.location_city || ''}`,
    `Availability: ${volunteer?.availability_type || ''}`,
    `Experience: ${volunteer?.experience_years || 0} years`
  ].join('. ');
}

/**
 * Format opportunity profile for embedding generation
 */
export function buildOpportunityEmbeddingText(opportunity, ngo) {
  return [
    `Title: ${opportunity?.title || ''}`,
    `Cause: ${opportunity?.cause_category || ''}`,
    `Description: ${opportunity?.description || ''}`,
    `Required Skills: ${opportunity?.required_skills || ''}`,
    `Tags: ${opportunity?.tags || ''}`,
    `Location: ${opportunity?.location_city || ''} (${opportunity?.location_type || ''})`,
    `Organization: ${ngo?.org_name || ''}`
  ].join('. ');
}

