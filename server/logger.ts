export function log(message: string, context: string = 'app', level: 'info' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌ ERROR' : 'ℹ️ INFO';
  console.log(`[${timestamp}] ${prefix} [${context}] ${message}`);
} 