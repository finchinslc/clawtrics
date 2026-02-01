import { parseAllLogs } from '../../../parser/index.js';
import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const LOG_DIRS = ['/tmp/clawdbot', '/tmp/openclaw'];

/**
 * Get the latest modification time across all log files
 */
function getLatestLogMtime() {
  let latest = 0;
  
  for (const logDir of LOG_DIRS) {
    if (existsSync(logDir)) {
      try {
        const files = readdirSync(logDir).filter(f => f.endsWith('.log'));
        for (const file of files) {
          const stat = statSync(join(logDir, file));
          if (stat.mtimeMs > latest) {
            latest = stat.mtimeMs;
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }
  
  return latest;
}

export async function GET(request) {
  const encoder = new TextEncoder();
  let lastMtime = 0;
  let isConnected = true;
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      try {
        const metrics = parseAllLogs();
        lastMtime = getLatestLogMtime();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metrics', data: metrics })}\n\n`));
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`));
      }
      
      // Poll for changes every 2 seconds
      const interval = setInterval(async () => {
        if (!isConnected) {
          clearInterval(interval);
          return;
        }
        
        try {
          const currentMtime = getLatestLogMtime();
          
          if (currentMtime > lastMtime) {
            // Log files changed, send new metrics
            lastMtime = currentMtime;
            const metrics = parseAllLogs();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metrics', data: metrics })}\n\n`));
          } else {
            // Send heartbeat to keep connection alive
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`));
          }
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`));
        }
      }, 2000);
      
      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        isConnected = false;
        clearInterval(interval);
        controller.close();
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
