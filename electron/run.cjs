// Wrapper that unsets ELECTRON_RUN_AS_NODE before spawning Electron.
// VS Code's extension host sets this, making Electron act as plain Node.js.
const { spawn } = require('child_process');
const electronPath = require('electron');

delete process.env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, process.argv.slice(2), {
  stdio: 'inherit',
  env: process.env,
  windowsHide: false,
});

child.on('close', (code) => process.exit(code));
