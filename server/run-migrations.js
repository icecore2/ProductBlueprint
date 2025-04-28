
#!/usr/bin/env node

// This is a simple script to run the migrations.ts file with tsx
import { spawn } from 'child_process';

const tsx = spawn('npx', ['tsx', 'server/migrations.ts'], {
  stdio: 'inherit',
  shell: true
});

tsx.on('close', (code) => {
  process.exit(code);
});
