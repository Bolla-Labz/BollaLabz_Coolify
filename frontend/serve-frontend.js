// Simple static file server for Railway deployment
// Last Modified: 2025-11-24 23:00
// Serves the pre-built Vite frontend from dist/ directory

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Try multiple possible dist/ locations for Railway deployment
const possibleDistPaths = [
  path.resolve(process.cwd(), 'dist'),           // /app/dist (if root=frontend)
  path.resolve(process.cwd(), 'frontend/dist'),  // /app/frontend/dist (if root=repo)
  '/app/dist',
  '/app/frontend/dist'
];

// Find the first existing dist/ directory
let DIST_DIR = null;
for (const distPath of possibleDistPaths) {
  if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
    DIST_DIR = distPath;
    break;
  }
}

if (!DIST_DIR) {
  console.error('❌ FATAL: Could not find dist/ directory in any expected location!');
  console.error('Tried:', possibleDistPaths);
  process.exit(1);
}

// Log startup info
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('DIST_DIR:', DIST_DIR);

// Debug: List all files in current directory
console.log('\n=== FILES IN CURRENT DIR ===');
try {
  const cwdFiles = fs.readdirSync(process.cwd());
  console.log('Files in cwd:', cwdFiles);
} catch (e) {
  console.error('Cannot read cwd:', e.message);
}

// Debug: Check /app directory
console.log('\n=== FILES IN /app ===');
try {
  const appFiles = fs.readdirSync('/app');
  console.log('Files in /app:', appFiles);
} catch (e) {
  console.error('Cannot read /app:', e.message);
}

console.log('\n=== DIST_DIR CHECK ===');
console.log('DIST_DIR exists:', fs.existsSync(DIST_DIR));
if (fs.existsSync(DIST_DIR)) {
  console.log('Files in DIST_DIR:', fs.readdirSync(DIST_DIR).slice(0, 10));
} else {
  console.log('DIST_DIR DOES NOT EXIST!');
  // Try alternative paths
  console.log('Checking ./dist:', fs.existsSync('./dist'));
  console.log('Checking ../dist:', fs.existsSync('../dist'));
  console.log('Checking /app/frontend/dist:', fs.existsSync('/app/frontend/dist'));
}

// Health check endpoint - must come before static middleware
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'bollalabz-frontend' });
});

// Serve static files from dist directory (only if it exists)
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  console.log('✅ Serving static files from:', DIST_DIR);
} else {
  console.error('❌ Cannot serve static files - dist/ directory not found!');
  console.error('Expected location:', DIST_DIR);
}

// SPA fallback - serve index.html for all other routes
// Use a middleware function instead of route pattern to avoid path-to-regexp issues
app.use((req, res, next) => {
  // Only handle GET requests that aren't for static files
  if (req.method === 'GET' && !req.path.includes('.')) {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Serving files from: ${DIST_DIR}`);
});