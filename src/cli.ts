#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const mode = args[0] || 'local';

if (mode === 'http') {
    const httpServer = join(__dirname, 'index_http.js');
    spawn('node', [httpServer], { stdio: 'inherit' });
} else if (mode === 'local') {
    const localServer = join(__dirname, 'index.js');
    spawn('node', [localServer], { stdio: 'inherit' });
} else {
    console.error('Invalid mode. Use "local" or "http"');
    process.exit(1);
} 