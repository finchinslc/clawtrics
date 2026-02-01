#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const LOG_DIR = '/tmp/clawdbot';

/**
 * Parse a single log file and extract metrics
 */
function parseLogFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  const runs = [];
  const runStarts = new Map(); // Track run starts to match with completions
  const tools = {};
  const sessions = new Set();
  const models = {};
  const providers = {};
  const channels = {};
  
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const message = entry['1'];
      const time = entry.time || entry._meta?.date;
      
      // Track run starts (to get model/provider/channel info)
      if (typeof message === 'string' && message.includes('embedded run start:')) {
        const runMatch = message.match(/runId=([a-f0-9-]+)/);
        const sessionMatch = message.match(/sessionId=([a-f0-9-]+)/);
        const modelMatch = message.match(/model=([^\s]+)/);
        const providerMatch = message.match(/provider=([^\s]+)/);
        const channelMatch = message.match(/messageChannel=([^\s]+)/);
        const thinkingMatch = message.match(/thinking=([^\s]+)/);
        
        if (runMatch) {
          runStarts.set(runMatch[1], {
            sessionId: sessionMatch?.[1],
            model: modelMatch?.[1] || 'unknown',
            provider: providerMatch?.[1] || 'unknown',
            channel: channelMatch?.[1] || 'unknown',
            thinking: thinkingMatch?.[1] || 'off',
            startTime: time,
          });
        }
      }
      
      // Track run completions
      if (typeof message === 'string' && message.includes('embedded run done:')) {
        const durationMatch = message.match(/durationMs=(\d+)/);
        const sessionMatch = message.match(/sessionId=([a-f0-9-]+)/);
        const runMatch = message.match(/runId=([a-f0-9-]+)/);
        const abortedMatch = message.match(/aborted=(true|false)/);
        
        if (durationMatch) {
          const runId = runMatch?.[1];
          const startInfo = runStarts.get(runId) || {};
          
          const run = {
            runId,
            sessionId: sessionMatch?.[1],
            durationMs: parseInt(durationMatch[1], 10),
            aborted: abortedMatch?.[1] === 'true',
            time,
            model: startInfo.model || 'unknown',
            provider: startInfo.provider || 'unknown',
            channel: startInfo.channel || 'unknown',
            thinking: startInfo.thinking || 'off',
          };
          
          runs.push(run);
          
          if (sessionMatch) {
            sessions.add(sessionMatch[1]);
          }
          
          // Aggregate model/provider/channel stats
          models[run.model] = (models[run.model] || 0) + 1;
          providers[run.provider] = (providers[run.provider] || 0) + 1;
          channels[run.channel] = (channels[run.channel] || 0) + 1;
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
      
    } catch (e) {
      // Skip malformed lines
    }
  }
  
  // Calculate run durations
  const durations = runs.map(r => r.durationMs);
  const totalDurationMs = durations.reduce((sum, d) => sum + d, 0);
  const avgDurationMs = runs.length > 0 ? totalDurationMs / runs.length : 0;
  const maxDurationMs = Math.max(...durations, 0);
  const minDurationMs = runs.length > 0 ? Math.min(...durations) : 0;
  
  return {
    runs,
    tools,
    models,
    providers,
    channels,
    sessionCount: sessions.size,
    totalRuns: runs.length,
    totalDurationMs,
    avgDurationMs,
    maxDurationMs,
    minDurationMs,
    abortedRuns: runs.filter(r => r.aborted).length,
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
function parseAllLogs(options = {}) {
  const { days = 30 } = options;
  const files = getLogFiles().slice(0, days);
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
    abortedRuns: 0,
    tools: {},
    models: {},
    providers: {},
    channels: {},
    dailyMetrics,
  };
  
  const allDurations = [];
  
  for (const [date, metrics] of Object.entries(dailyMetrics)) {
    totals.totalRuns += metrics.totalRuns;
    totals.totalDurationMs += metrics.totalDurationMs;
    totals.totalSessions += metrics.sessionCount;
    totals.abortedRuns += metrics.abortedRuns;
    
    // Aggregate durations for percentile calculations
    metrics.runs.forEach(r => allDurations.push(r.durationMs));
    
    for (const [tool, count] of Object.entries(metrics.tools)) {
      totals.tools[tool] = (totals.tools[tool] || 0) + count;
    }
    for (const [model, count] of Object.entries(metrics.models)) {
      totals.models[model] = (totals.models[model] || 0) + count;
    }
    for (const [provider, count] of Object.entries(metrics.providers)) {
      totals.providers[provider] = (totals.providers[provider] || 0) + count;
    }
    for (const [channel, count] of Object.entries(metrics.channels)) {
      totals.channels[channel] = (totals.channels[channel] || 0) + count;
    }
  }
  
  // Calculate percentiles
  allDurations.sort((a, b) => a - b);
  totals.avgDurationMs = totals.totalRuns > 0 ? totals.totalDurationMs / totals.totalRuns : 0;
  totals.p50DurationMs = allDurations[Math.floor(allDurations.length * 0.5)] || 0;
  totals.p95DurationMs = allDurations[Math.floor(allDurations.length * 0.95)] || 0;
  totals.maxDurationMs = allDurations[allDurations.length - 1] || 0;
  
  return totals;
}

/**
 * Format duration for display
 */
function formatDuration(ms) {
  if (!ms || ms === 0) return '0s';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Print a bar chart in terminal
 */
function printBar(label, value, max, width = 30) {
  const barLen = Math.round((value / max) * width);
  const bar = '█'.repeat(barLen) + '░'.repeat(width - barLen);
  console.log(`  ${label.padEnd(15)} ${bar} ${value}`);
}

// CLI entry point
const args = process.argv.slice(2);
const command = args[0] || 'summary';

if (command === 'summary' || command === 'daily' || command === 'tools' || command === 'models') {
  const metrics = parseAllLogs({ days: 30 });
  
  if (command === 'summary') {
    console.log('\n📊 \x1b[1mClawtrics Summary\x1b[0m\n');
    console.log(`Total Runs:     ${metrics.totalRuns}`);
    console.log(`Total Duration: ${formatDuration(metrics.totalDurationMs)}`);
    console.log(`Avg Duration:   ${formatDuration(metrics.avgDurationMs)}`);
    console.log(`P50 Duration:   ${formatDuration(metrics.p50DurationMs)}`);
    console.log(`P95 Duration:   ${formatDuration(metrics.p95DurationMs)}`);
    console.log(`Max Duration:   ${formatDuration(metrics.maxDurationMs)}`);
    console.log(`Sessions:       ${metrics.totalSessions}`);
    console.log(`Aborted:        ${metrics.abortedRuns}`);
    
    console.log('\n🔧 \x1b[1mTop Tools:\x1b[0m');
    const sortedTools = Object.entries(metrics.tools)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const maxToolCount = sortedTools[0]?.[1] || 1;
    for (const [tool, count] of sortedTools) {
      printBar(tool, count, maxToolCount);
    }
    
    console.log('\n🤖 \x1b[1mModels:\x1b[0m');
    const sortedModels = Object.entries(metrics.models)
      .sort((a, b) => b[1] - a[1]);
    const maxModelCount = sortedModels[0]?.[1] || 1;
    for (const [model, count] of sortedModels) {
      printBar(model, count, maxModelCount);
    }
    
    console.log('\n📱 \x1b[1mChannels:\x1b[0m');
    const sortedChannels = Object.entries(metrics.channels)
      .sort((a, b) => b[1] - a[1]);
    const maxChannelCount = sortedChannels[0]?.[1] || 1;
    for (const [channel, count] of sortedChannels) {
      printBar(channel, count, maxChannelCount);
    }
    
  } else if (command === 'daily') {
    console.log('\n📅 \x1b[1mDaily Breakdown\x1b[0m\n');
    const days = Object.entries(metrics.dailyMetrics)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 14);
    
    console.log('  Date        Runs    Avg       Total     Sessions');
    console.log('  ' + '-'.repeat(55));
    for (const [date, daily] of days) {
      const avg = daily.totalRuns > 0 ? daily.totalDurationMs / daily.totalRuns : 0;
      console.log(`  ${date}    ${String(daily.totalRuns).padEnd(7)} ${formatDuration(avg).padEnd(9)} ${formatDuration(daily.totalDurationMs).padEnd(9)} ${daily.sessionCount}`);
    }
    
  } else if (command === 'tools') {
    console.log('\n🔧 \x1b[1mTool Usage\x1b[0m\n');
    const sortedTools = Object.entries(metrics.tools)
      .sort((a, b) => b[1] - a[1]);
    const maxCount = sortedTools[0]?.[1] || 1;
    for (const [tool, count] of sortedTools) {
      printBar(tool, count, maxCount, 40);
    }
    
  } else if (command === 'models') {
    console.log('\n🤖 \x1b[1mModel Usage\x1b[0m\n');
    const sortedModels = Object.entries(metrics.models)
      .sort((a, b) => b[1] - a[1]);
    const maxCount = sortedModels[0]?.[1] || 1;
    for (const [model, count] of sortedModels) {
      printBar(model, count, maxCount, 40);
    }
  }
  
  console.log('');
  
} else if (command === 'help' || command === '--help' || command === '-h') {
  console.log(`
📊 Clawtrics - OpenClaw Metrics CLI

Usage: clawtrics [command]

Commands:
  summary   Show overall metrics summary (default)
  daily     Show daily breakdown
  tools     Show tool usage breakdown
  models    Show model usage breakdown
  help      Show this help

Examples:
  clawtrics              # Show summary
  clawtrics daily        # Show last 14 days
  clawtrics tools        # Tool usage chart
`);
}

export { parseLogFile, getLogFiles, parseAllLogs };
