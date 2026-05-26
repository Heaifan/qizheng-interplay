// Wrapper that kills existing Electron processes before spawning a new one,
// and unsets ELECTRON_RUN_AS_NODE (VS Code extension host sets this).
const { spawn, execSync } = require('child_process');
const electronPath = require('electron');

delete process.env.ELECTRON_RUN_AS_NODE;

// Kill any existing Electron processes before starting a new instance
try {
  execSync('taskkill /f /im electron.exe 2>nul', { stdio: 'ignore' });
} catch (_) { /* no existing process */ }

const child = spawn(electronPath, process.argv.slice(2), {
  stdio: 'inherit',
  env: process.env,
  windowsHide: false,
});

child.on('close', (code) => process.exit(code));
