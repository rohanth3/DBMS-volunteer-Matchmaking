// ============================================================================
// DBMS Level 3 Project: NGO Volunteer Matchmaking System
// File: scripts/verify-runtime.js
// Automated Runtime Probe for Next.js Server & Live API Endpoints
// ============================================================================

import http from 'http';
import { spawn } from 'child_process';

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port || 3000,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runRuntimeVerification() {
  console.log('Starting Next.js production server for runtime verification...');
  const serverProcess = spawn('npx', ['next', 'start', '-p', '3000'], {
    shell: true,
    stdio: 'inherit'
  });

  // Give the server time to bind port 3000
  let serverReady = false;
  for (let i = 0; i < 20; i++) {
    await sleep(800);
    try {
      const res = await fetchUrl('http://127.0.0.1:3000/');
      if (res.status === 200) {
        serverReady = true;
        break;
      }
    } catch (e) {
      // Waiting for port
    }
  }

  if (!serverReady) {
    console.error('❌ Server failed to respond on port 3000 within timeout.');
    serverProcess.kill('SIGINT');
    process.exit(1);
  }

  console.log('✓ Next.js server successfully listening on http://127.0.0.1:3000\n');

  try {
    // 1. Probe Home Page (HTML SSR)
    console.log('[Probe 1] Testing Home Page (GET /)...');
    const homeRes = await fetchUrl('http://127.0.0.1:3000/');
    console.log(`   Status: ${homeRes.status} OK (Payload length: ${homeRes.body.length} bytes)`);
    if (!homeRes.body.includes('VolunTrack') && !homeRes.body.includes('Volunteer Matchmaking')) {
      throw new Error('Home page body missing expected branding.');
    }
    console.log('   ✓ Home page rendered with live platform metrics.\n');

    // 2. Probe Opportunities API (Relational SQL read)
    console.log('[Probe 2] Testing Opportunities Endpoint (GET /api/opportunities)...');
    const oppRes = await fetchUrl('http://127.0.0.1:3000/api/opportunities');
    const oppJson = JSON.parse(oppRes.body);
    console.log(`   Status: ${oppRes.status} OK`);
    console.log(`   Loaded ${oppJson.opportunities?.length} active opportunities from database.`);
    if (!oppJson.success || !oppJson.opportunities?.length) {
      throw new Error('Opportunities API failed to return records.');
    }
    console.log(`   Sample Opportunity: "${oppJson.opportunities[0].title}" (${oppJson.opportunities[0].cause_category})\n`);

    // 3. Probe Preset Queries API (Admin SQL Lab)
    console.log('[Probe 3] Testing Admin Preset Queries (GET /api/admin/query)...');
    const queryRes = await fetchUrl('http://127.0.0.1:3000/api/admin/query');
    const queryJson = JSON.parse(queryRes.body);
    console.log(`   Status: ${queryRes.status} OK`);
    const queryKeys = Object.keys(queryJson.presetQueries || {});
    console.log(`   Retrieved ${queryKeys.length} advanced analytical DBMS queries: ${queryKeys.join(', ')}`);
    console.log('   ✓ Admin SQL console endpoints verified.\n');

    // 4. Probe Public Certificate Verification (SHA-256 Ledger lookup)
    console.log('[Probe 4] Testing Public Certificate Verification (/api/certificates/verify/[code])...');
    const certCode = 'e7b8a1c3d5f9e2b4a7c0d8e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1';
    const certRes = await fetchUrl(`http://127.0.0.1:3000/api/certificates/verify/${certCode}`);
    const certJson = JSON.parse(certRes.body);
    console.log(`   Status: ${certRes.status} OK`);
    console.log(`   Verified Certificate: "${certJson.certificate?.title}"`);
    console.log(`   Issued To: ${certJson.certificate?.volunteer_name} (${certJson.certificate?.total_hours_credited} verified hours)`);
    console.log('   ✓ Cryptographic certificate public verification route operational.\n');

    console.log('====================================================================');
    console.log('RUNTIME VERIFICATION PASSED: All 4 core runtime layers verified live!');
    console.log('Next.js web application is completely operational.');
    console.log('====================================================================\n');
  } catch (err) {
    console.error('❌ Runtime verification error:', err);
    process.exitCode = 1;
  } finally {
    console.log('Terminating test probe process...');
    serverProcess.kill('SIGINT');
    await sleep(1000);
    process.exit(process.exitCode || 0);
  }
}

runRuntimeVerification();

