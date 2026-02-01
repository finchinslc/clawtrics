#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const LOG_DIR = '/tmp/clawdbot';
const OPENCLAW_LOG_DIR = join(homedir(), '.openclaw', 'logs');

/**
 * Parse a single log file and extract metrics
 */
function parseLogFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  const runs = [];
  const tools = {};
  const sessions = new Set();
  
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const subsystem = entry['0'];
      const message = entry['1'];
      const time = entry.time || entry._meta?.date;
      
      // Track run completions
      if (typeof message === 'string' && message.includes('embedded run done:')) {
        const durationMatch = message.match(/durationMs=(\d+)/);
        const sessionMatch = message.match(/sessionId=([a-f0-9-]+)/);
        const runMatch = message.match(/runId=([a-f0-9-]+)/);
        
        if (durationMatch) {
          runs.push({
            runId: runMatch?.[1],
            sessionId: sessionMatch?.[1],
            durationMs: parseInt(durationMatch[1], 10),
            time,
          });
          
          if (sessionMatch) {
            sessions.add(sessionMatch[1]);
          }
        }
      }
      
      // Track tool usage
      if (typeof message === 'string' && message.includes('embedded run tool start:')) {
        const toolMatch = message.match(/tool=(\w+)/);
        if (toolMatch) {
          const tool = toolMatch[1];
          tools[tool] = (tools[tool] || 0) + 1;
        }
      }
      
      // Track run starts with model info
      if (typeof message === 'string' && message.includes('embedded run start:')) {
        const modelMatch = message.match(/model=([^\s]+)/);
        const providerMatch = message.match(/provider=([^\s]+)/);
        // Could extract more data here
      }
      
    } catch (e) {
      // Skip malformed lines
    }
  }
  
  return {
    runs,
    tools,
    sessionCount: sessions.size,
    totalRuns: runs.length,
    totalDurationMs: runs.reduce((sum, r) => sum + r.durationMs, 0),
  };
}

/**
 * Get all available log files
 */
function getLogFiles() {
  const files = [];
  
  if (existsSync(LOG_DIR)) {
    const logFiles = readdirSync(LOG_DIR)
      .filter(f => f.endsWith('.log'))
      .map(f => ({
        path: join(LOG_DIR, f),
        date: f.match(/clawdbot-(\d{4}-\d{2}-\d{2})\.log/)?.[1],
      }))
      .filter(f => f.date);
    
    files.push(...logFiles);
  }
  
  return files.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Parse all logs and aggregate metrics
 */
function parseAllLogs() {
  const files = getLogFiles();
  const dailyMetrics = {};
  
  for (const file of files) {
    const metrics = parseLogFile(file.path);
    dailyMetrics[file.date] = metrics;
  }
  
  // Aggregate totals
  const totals = {
    totalRuns: 0,
    totalDurationMs: 0,
    totalSessions: 0,
    tools: {},
    dailyMetrics,
  };
  
  for (const [date, metrics] of Object.entries(dailyMetrics)) {
    totals.totalRuns += metrics.totalRuns;
    totals.totalDurationMs += metrics.totalDurationMs;
    totals.totalSessions += metrics.sessionCount;
    
    for (const [tool, count] of Object.entries(metrics.tools)) {
      totals.tools[tool] = (totals.tools[tool] || 0) + count;
    }
  }
  
  return totals;
}

/**
 * Format duration for display
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// CLI entry point
if (process.argv[1].endsWith('index.js')) {
  const metrics = parseAllLogs();
  
  console.log('\n📊 Clawtrics Summary\n');
  console.log(`Total Runs: ${metrics.totalRuns}`);
  console.log(`Total Duration: ${formatDuration(metrics.totalDurationMs)}`);
  console.log(`Avg Duration: ${formatDuration(metrics.totalDurationMs / metrics.totalRuns || 0)}`);
  console.log(`Sessions: ${metrics.totalSessions}`);
  
  console.log('\n🔧 Tool Usage:');
  const sortedTools = Object.entries(metrics.tools)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  for (const [tool, count] of sortedTools) {
    console.log(`  ${tool}: ${count}`);
  }
  
  console.log('\n📅 Daily Breakdown:');
  for (const [date, daily] of Object.entries(metrics.dailyMetrics)) {
    console.log(`  ${date}: ${daily.totalRuns} runs, ${formatDuration(daily.totalDurationMs)}`);
  }
}

export { parseLogFile, getLogFiles, parseAllLogs };
