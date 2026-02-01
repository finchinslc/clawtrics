#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const LOG_DIRS = ['/tmp/clawdbot', '/tmp/openclaw'];

// Estimated average tokens per tool output
const TOOL_TOKEN_ESTIMATES = {
  read: 1000,
  web_fetch: 2000,
  browser: 1000,
  exec: 500,
  process: 300,
  web_search: 800,
  memory_search: 400,
  memory_get: 500,
  image: 200,
  write: 200,
  edit: 200,
  cron: 100,
  message: 100,
  gateway: 100,
  sessions_list: 200,
  sessions_history: 500,
  sessions_send: 100,
  session_status: 100,
  nodes: 200,
  canvas: 300,
  tts: 50,
  agents_list: 100,
};

const DEFAULT_TOOL_TOKENS = 300;

// Model pricing per 1M tokens (input/output)
// Prices as of Jan 2025 - update as needed
const MODEL_PRICING = {
  // Anthropic
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  'claude-opus-4-20250514': { input: 15.00, output: 75.00 },
  'anthropic/claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  'anthropic/claude-opus-4-20250514': { input: 15.00, output: 75.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
  // OpenAI
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'o1': { input: 15.00, output: 60.00 },
  'o1-mini': { input: 3.00, output: 12.00 },
  'o3-mini': { input: 1.10, output: 4.40 },
  // GitHub Copilot (proxied models - use base pricing)
  'github-copilot/claude-sonnet-4': { input: 3.00, output: 15.00 },
  'github-copilot/claude-opus-4': { input: 15.00, output: 75.00 },
  'github-copilot/claude-opus-4.5': { input: 15.00, output: 75.00 },
  'github-copilot/gpt-4o': { input: 2.50, output: 10.00 },
  'github-copilot/o1': { input: 15.00, output: 60.00 },
  'github-copilot/o3-mini': { input: 1.10, output: 4.40 },
  // Google
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  // xAI
  'grok-2': { input: 2.00, output: 10.00 },
  'grok-3': { input: 3.00, output: 15.00 },
  // OpenRouter (add prefix handling)
  'openrouter/anthropic/claude-sonnet-4': { input: 3.00, output: 15.00 },
  'openrouter/anthropic/claude-opus-4': { input: 15.00, output: 75.00 },
};

// Default pricing for unknown models (assume mid-tier)
const DEFAULT_PRICING = { input: 3.00, output: 15.00 };

/**
 * Get pricing for a model, handling various naming conventions
 */
function getModelPricing(modelName) {
  if (!modelName) return DEFAULT_PRICING;
  
  // Direct match
  if (MODEL_PRICING[modelName]) return MODEL_PRICING[modelName];
  
  // Try lowercase
  const lower = modelName.toLowerCase();
  if (MODEL_PRICING[lower]) return MODEL_PRICING[lower];
  
  // Try to match partial names
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return pricing;
    }
  }
  
  // Heuristics based on model name patterns
  if (lower.includes('opus')) return { input: 15.00, output: 75.00 };
  if (lower.includes('sonnet')) return { input: 3.00, output: 15.00 };
  if (lower.includes('haiku')) return { input: 0.80, output: 4.00 };
  if (lower.includes('gpt-4o-mini')) return { input: 0.15, output: 0.60 };
  if (lower.includes('gpt-4o')) return { input: 2.50, output: 10.00 };
  if (lower.includes('o1-mini') || lower.includes('o3-mini')) return { input: 1.10, output: 4.40 };
  if (lower.includes('o1') || lower.includes('o3')) return { input: 15.00, output: 60.00 };
  if (lower.includes('gemini') && lower.includes('flash')) return { input: 0.10, output: 0.40 };
  if (lower.includes('gemini') && lower.includes('pro')) return { input: 1.25, output: 5.00 };
  
  return DEFAULT_PRICING;
}

// NOTE: calculateRunCost removed - cost estimation disabled until OpenClaw logs actual token usage

/**
 * Extract the base command from a shell command string
 * e.g., "cd ~/foo && docker compose up" -> "docker"
 * e.g., "brew install foo" -> "brew"
 * e.g., "export PATH=... && npm run build" -> "npm"
 */
function extractBaseCommand(cmdString) {
  if (!cmdString) return 'unknown';
  
  // Remove common prefixes
  let cmd = cmdString
    .replace(/^(elevated command |command |spawning )/i, '')
    .trim();
  
  // Split by && or || or ; and take the last meaningful command
  const parts = cmd.split(/\s*(?:&&|\|\||;)\s*/);
  
  // Find the first part that's not just cd, export, or env setting
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (/^(cd|export|source|\.)\s/.test(trimmed)) continue;
    
    // Get first word
    const firstWord = trimmed.split(/\s+/)[0];
    if (firstWord && !['cd', 'export', 'source', '.'].includes(firstWord)) {
      // Handle path-based commands like /usr/bin/git
      const basename = firstWord.split('/').pop();
      return basename || firstWord;
    }
  }
  
  // Fallback to first word of original
  const firstWord = cmd.split(/\s+/)[0];
  return firstWord?.split('/').pop() || 'unknown';
}

/**
 * Parse a single log file and extract metrics
 */
function parseLogFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  const runs = [];
  const runStarts = new Map();
  const runTools = new Map();
  const tools = {};
  const toolChains = {};
  const sessions = new Set();
  const models = {};
  const providers = {};
  const channels = {};
  const shellCommands = {};
  
  let compactionCount = 0;
  const compactionsBySession = new Map();
  const compactionsByRun = new Map();
  
  let lastToolByRun = new Map();
  
  // Error tracking
  const errors = {
    total: 0,
    byType: {},
  };
  
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const message = entry['1'] || entry['0'];
      const time = entry.time || entry._meta?.date;
      const logLevel = entry._meta?.logLevelName;
      
      // Track errors
      if (logLevel === 'ERROR') {
        errors.total++;
        
        // Categorize error type
        let errorType = 'other';
        const msgStr = String(message);
        
        if (msgStr.includes('exec failed')) errorType = 'exec_failed';
        else if (msgStr.includes('edit failed')) errorType = 'edit_failed';
        else if (msgStr.includes('No API key')) errorType = 'auth_error';
        else if (msgStr.includes('rate limit') || msgStr.includes('429')) errorType = 'rate_limit';
        else if (msgStr.includes('timeout') || msgStr.includes('ETIMEDOUT')) errorType = 'timeout';
        else if (msgStr.includes('ECONNREFUSED') || msgStr.includes('ENOTFOUND')) errorType = 'network_error';
        else if (msgStr.includes('DeprecationWarning')) errorType = 'deprecation';
        else if (msgStr.includes('lane task error')) errorType = 'lane_error';
        
        errors.byType[errorType] = (errors.byType[errorType] || 0) + 1;
      }
      
      // Track shell commands from exec subsystem logs ONLY
      // Format: {"0":"{\"subsystem\":\"exec\"}","1":"elevated command ..."}
      const subsystem = entry['0'];
      if (typeof subsystem === 'string' && subsystem.includes('"subsystem":"exec"') &&
          typeof message === 'string' && message.startsWith('elevated command ')) {
        // Extract and categorize the command
        const baseCmd = extractBaseCommand(message);
        if (baseCmd && baseCmd !== 'unknown') {
          shellCommands[baseCmd] = (shellCommands[baseCmd] || 0) + 1;
        }
      }
      
      // Track compaction events
      if (typeof message === 'string' && message.includes('compaction start:')) {
        compactionCount++;
        const runMatch = message.match(/runId=([a-f0-9-]+)/);
        const sessionMatch = message.match(/sessionId=([a-f0-9-]+)/);
        
        if (runMatch) {
          compactionsByRun.set(runMatch[1], (compactionsByRun.get(runMatch[1]) || 0) + 1);
        }
        if (sessionMatch) {
          compactionsBySession.set(sessionMatch[1], (compactionsBySession.get(sessionMatch[1]) || 0) + 1);
        }
      }
      
      // Track run starts
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
          runTools.set(runMatch[1], []);
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
          const toolsList = runTools.get(runId) || [];
          
          const estimatedTokens = toolsList.reduce((sum, tool) => {
            return sum + (TOOL_TOKEN_ESTIMATES[tool] || DEFAULT_TOOL_TOKENS);
          }, 0);
          
          const modelName = startInfo.model || 'unknown';
          
          const run = {
            runId,
            sessionId: sessionMatch?.[1],
            durationMs: parseInt(durationMatch[1], 10),
            aborted: abortedMatch?.[1] === 'true',
            time,
            model: modelName,
            provider: startInfo.provider || 'unknown',
            channel: startInfo.channel || 'unknown',
            thinking: startInfo.thinking || 'off',
            tools: toolsList,
            estimatedTokens,
            compactions: compactionsByRun.get(runId) || 0,
          };
          
          runs.push(run);
          
          if (sessionMatch) {
            sessions.add(sessionMatch[1]);
          }
          
          models[run.model] = (models[run.model] || 0) + 1;
          providers[run.provider] = (providers[run.provider] || 0) + 1;
          channels[run.channel] = (channels[run.channel] || 0) + 1;
          
          lastToolByRun.delete(runId);
        }
      }
      
      // Track tool usage
      if (typeof message === 'string' && message.includes('embedded run tool start:')) {
        const toolMatch = message.match(/tool=(\w+)/);
        const runMatch = message.match(/runId=([a-f0-9-]+)/);
        
        if (toolMatch) {
          const tool = toolMatch[1];
          const runId = runMatch?.[1];
          
          tools[tool] = (tools[tool] || 0) + 1;
          
          if (runId && runTools.has(runId)) {
            runTools.get(runId).push(tool);
          }
          
          if (runId) {
            const lastTool = lastToolByRun.get(runId);
            if (lastTool && lastTool !== tool) {
              const chain = `${lastTool}→${tool}`;
              toolChains[chain] = (toolChains[chain] || 0) + 1;
            }
            lastToolByRun.set(runId, tool);
          }
        }
      }
      
    } catch (e) {
      // Skip malformed lines
    }
  }
  
  const durations = runs.map(r => r.durationMs);
  const totalDurationMs = durations.reduce((sum, d) => sum + d, 0);
  const avgDurationMs = runs.length > 0 ? totalDurationMs / runs.length : 0;
  const maxDurationMs = Math.max(...durations, 0);
  const minDurationMs = runs.length > 0 ? Math.min(...durations) : 0;
  
  const totalEstimatedTokens = runs.reduce((sum, r) => sum + (r.estimatedTokens || 0), 0);
  const heavySessions = [...compactionsBySession.values()].filter(c => c >= 3).length;
  
  // Thinking mode stats
  const thinkingModes = {};
  const thinkingDurations = {};
  runs.forEach(run => {
    const mode = run.thinking || 'off';
    thinkingModes[mode] = (thinkingModes[mode] || 0) + 1;
    if (!thinkingDurations[mode]) thinkingDurations[mode] = [];
    thinkingDurations[mode].push(run.durationMs);
  });
  
  // Calculate average duration per thinking mode
  const thinkingAvgDurations = {};
  for (const [mode, durations] of Object.entries(thinkingDurations)) {
    thinkingAvgDurations[mode] = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  return {
    runs,
    tools,
    toolChains,
    shellCommands,
    models,
    providers,
    channels,
    thinkingModes,
    thinkingAvgDurations,
    sessionCount: sessions.size,
    totalRuns: runs.length,
    totalDurationMs,
    avgDurationMs,
    maxDurationMs,
    minDurationMs,
    abortedRuns: runs.filter(r => r.aborted).length,
    compactionCount,
    totalEstimatedTokens,
    avgEstimatedTokens: runs.length > 0 ? totalEstimatedTokens / runs.length : 0,
    heavySessions,
    runsWithCompaction: runs.filter(r => r.compactions > 0).length,
    errors,
  };
}

/**
 * Get all available log files from all log directories
 */
function getLogFiles() {
  const files = [];
  
  for (const logDir of LOG_DIRS) {
    if (existsSync(logDir)) {
      const logFiles = readdirSync(logDir)
        .filter(f => f.endsWith('.log'))
        .map(f => {
          // Match various date patterns in log filenames
          const dateMatch = f.match(/(\d{4}-\d{2}-\d{2})/);
          return {
            path: join(logDir, f),
            date: dateMatch?.[1],
            source: logDir.includes('openclaw') ? 'openclaw' : 'clawdbot',
          };
        })
        .filter(f => f.date);
      
      files.push(...logFiles);
    }
  }
  
  // Sort by date descending, then dedupe by date (prefer openclaw)
  files.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    // Prefer openclaw logs as they have more detail
    return a.source === 'openclaw' ? -1 : 1;
  });
  
  return files;
}

/**
 * Parse all logs and aggregate metrics
 */
function parseAllLogs(options = {}) {
  const { days = 30 } = options;
  const files = getLogFiles().slice(0, days * 2); // Get more files since we have 2 sources
  const dailyMetrics = {};
  const seenDates = new Set();
  
  for (const file of files) {
    // Skip if we already have this date from a preferred source
    if (seenDates.has(file.date)) {
      // Merge shell commands from both sources
      const existing = dailyMetrics[file.date];
      const metrics = parseLogFile(file.path);
      for (const [cmd, count] of Object.entries(metrics.shellCommands || {})) {
        existing.shellCommands[cmd] = (existing.shellCommands[cmd] || 0) + count;
      }
      continue;
    }
    
    const metrics = parseLogFile(file.path);
    dailyMetrics[file.date] = metrics;
    seenDates.add(file.date);
  }
  
  // Aggregate totals
  const totals = {
    totalRuns: 0,
    totalDurationMs: 0,
    totalSessions: 0,
    abortedRuns: 0,
    tools: {},
    toolChains: {},
    shellCommands: {},
    models: {},
    providers: {},
    channels: {},
    dailyMetrics,
    compactionCount: 0,
    totalEstimatedTokens: 0,
    heavySessions: 0,
    runsWithCompaction: 0,
    thinkingModes: {},
    errors: { total: 0, byType: {} },
  };
  
  const allDurations = [];
  const thinkingDurationsByMode = {};
  
  for (const [date, metrics] of Object.entries(dailyMetrics)) {
    totals.totalRuns += metrics.totalRuns;
    totals.totalDurationMs += metrics.totalDurationMs;
    totals.totalSessions += metrics.sessionCount;
    totals.abortedRuns += metrics.abortedRuns;
    totals.compactionCount += metrics.compactionCount;
    totals.totalEstimatedTokens += metrics.totalEstimatedTokens;
    totals.heavySessions += metrics.heavySessions;
    totals.runsWithCompaction += metrics.runsWithCompaction;
    
    // Aggregate errors
    if (metrics.errors) {
      totals.errors.total += metrics.errors.total || 0;
      for (const [type, count] of Object.entries(metrics.errors.byType || {})) {
        totals.errors.byType[type] = (totals.errors.byType[type] || 0) + count;
      }
    }
    
    metrics.runs.forEach(r => {
      allDurations.push(r.durationMs);
      const mode = r.thinking || 'off';
      if (!thinkingDurationsByMode[mode]) thinkingDurationsByMode[mode] = [];
      thinkingDurationsByMode[mode].push(r.durationMs);
    });
    
    for (const [mode, count] of Object.entries(metrics.thinkingModes || {})) {
      totals.thinkingModes[mode] = (totals.thinkingModes[mode] || 0) + count;
    }
    
    for (const [tool, count] of Object.entries(metrics.tools)) {
      totals.tools[tool] = (totals.tools[tool] || 0) + count;
    }
    for (const [chain, count] of Object.entries(metrics.toolChains)) {
      totals.toolChains[chain] = (totals.toolChains[chain] || 0) + count;
    }
    for (const [cmd, count] of Object.entries(metrics.shellCommands || {})) {
      totals.shellCommands[cmd] = (totals.shellCommands[cmd] || 0) + count;
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
  
  // Calculate average duration per thinking mode
  totals.thinkingAvgDurations = {};
  for (const [mode, durations] of Object.entries(thinkingDurationsByMode)) {
    totals.thinkingAvgDurations[mode] = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  allDurations.sort((a, b) => a - b);
  totals.avgDurationMs = totals.totalRuns > 0 ? totals.totalDurationMs / totals.totalRuns : 0;
  totals.p50DurationMs = allDurations[Math.floor(allDurations.length * 0.5)] || 0;
  totals.p95DurationMs = allDurations[Math.floor(allDurations.length * 0.95)] || 0;
  totals.maxDurationMs = allDurations[allDurations.length - 1] || 0;
  totals.avgEstimatedTokens = totals.totalRuns > 0 ? totals.totalEstimatedTokens / totals.totalRuns : 0;
  
  return totals;
}

function formatDuration(ms) {
  if (!ms || ms === 0) return '0s';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatTokens(tokens) {
  if (!tokens || tokens === 0) return '0';
  if (tokens < 1000) return String(Math.round(tokens));
  return `${(tokens / 1000).toFixed(1)}K`;
}

function printBar(label, value, max, width = 30) {
  const barLen = Math.round((value / max) * width);
  const bar = '█'.repeat(barLen) + '░'.repeat(width - barLen);
  console.log(`  ${label.padEnd(15)} ${bar} ${value}`);
}

// CLI entry point
const args = process.argv.slice(2);
const command = args[0] || 'summary';

if (command === 'summary' || command === 'daily' || command === 'tools' || command === 'models' || command === 'chains' || command === 'context' || command === 'shell') {
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
    
    console.log('\n📏 \x1b[1mContext Pressure:\x1b[0m');
    console.log(`  Compactions:      ${metrics.compactionCount}`);
    console.log(`  Est. Tokens:      ${formatTokens(metrics.totalEstimatedTokens)}`);
    console.log(`  Avg Tokens/Run:   ${formatTokens(metrics.avgEstimatedTokens)}`);
    console.log(`  Heavy Sessions:   ${metrics.heavySessions}`);
    
    console.log('\n🔧 \x1b[1mTop Tools:\x1b[0m');
    const sortedTools = Object.entries(metrics.tools)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const maxToolCount = sortedTools[0]?.[1] || 1;
    for (const [tool, count] of sortedTools) {
      printBar(tool, count, maxToolCount);
    }
    
    console.log('\n💻 \x1b[1mTop Shell Commands:\x1b[0m');
    const sortedShell = Object.entries(metrics.shellCommands)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const maxShellCount = sortedShell[0]?.[1] || 1;
    for (const [cmd, count] of sortedShell) {
      printBar(cmd, count, maxShellCount);
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
    
    console.log('\n🔗 \x1b[1mTop Tool Chains:\x1b[0m');
    const sortedChains = Object.entries(metrics.toolChains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    for (const [chain, count] of sortedChains) {
      console.log(`  ${chain.padEnd(20)} ${count}`);
    }
    
  } else if (command === 'daily') {
    console.log('\n📅 \x1b[1mDaily Breakdown\x1b[0m\n');
    const days = Object.entries(metrics.dailyMetrics)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 14);
    
    console.log('  Date        Runs    Avg       Total     Compacts  Est.Tokens');
    console.log('  ' + '-'.repeat(65));
    for (const [date, daily] of days) {
      const avg = daily.totalRuns > 0 ? daily.totalDurationMs / daily.totalRuns : 0;
      console.log(`  ${date}    ${String(daily.totalRuns).padEnd(7)} ${formatDuration(avg).padEnd(9)} ${formatDuration(daily.totalDurationMs).padEnd(9)} ${String(daily.compactionCount).padEnd(9)} ${formatTokens(daily.totalEstimatedTokens)}`);
    }
    
  } else if (command === 'tools') {
    console.log('\n🔧 \x1b[1mTool Usage\x1b[0m\n');
    const sortedTools = Object.entries(metrics.tools)
      .sort((a, b) => b[1] - a[1]);
    const maxCount = sortedTools[0]?.[1] || 1;
    for (const [tool, count] of sortedTools) {
      printBar(tool, count, maxCount, 40);
    }
    
  } else if (command === 'shell') {
    console.log('\n💻 \x1b[1mShell Commands\x1b[0m\n');
    const sortedShell = Object.entries(metrics.shellCommands)
      .sort((a, b) => b[1] - a[1]);
    const maxCount = sortedShell[0]?.[1] || 1;
    for (const [cmd, count] of sortedShell) {
      printBar(cmd, count, maxCount, 40);
    }
    
  } else if (command === 'models') {
    console.log('\n🤖 \x1b[1mModel Usage\x1b[0m\n');
    const sortedModels = Object.entries(metrics.models)
      .sort((a, b) => b[1] - a[1]);
    const maxCount = sortedModels[0]?.[1] || 1;
    for (const [model, count] of sortedModels) {
      printBar(model, count, maxCount, 40);
    }
    
  } else if (command === 'chains') {
    console.log('\n🔗 \x1b[1mTool Chains\x1b[0m\n');
    const sortedChains = Object.entries(metrics.toolChains)
      .sort((a, b) => b[1] - a[1]);
    const maxCount = sortedChains[0]?.[1] || 1;
    for (const [chain, count] of sortedChains) {
      printBar(chain, count, maxCount, 30);
    }
  } else if (command === 'context') {
    console.log('\n📏 \x1b[1mContext Pressure Analysis\x1b[0m\n');
    console.log(`Total Compactions:     ${metrics.compactionCount}`);
    console.log(`Runs with Compaction:  ${metrics.runsWithCompaction} (${metrics.totalRuns > 0 ? ((metrics.runsWithCompaction / metrics.totalRuns) * 100).toFixed(1) : 0}%)`);
    console.log(`Heavy Sessions:        ${metrics.heavySessions} (3+ compactions)`);
    console.log('');
    console.log(`Est. Tool Tokens:      ${formatTokens(metrics.totalEstimatedTokens)}`);
    console.log(`Avg Tokens/Run:        ${formatTokens(metrics.avgEstimatedTokens)}`);
    console.log('');
    console.log('\x1b[2mNote: Token estimates based on average tool output sizes.\x1b[0m');
    console.log('\x1b[2mCompaction indicates context window hit ~80% capacity.\x1b[0m');
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
  shell     Show shell command breakdown
  models    Show model usage breakdown
  chains    Show tool chain patterns
  context   Show context pressure analysis
  help      Show this help

Examples:
  clawtrics              # Show summary
  clawtrics daily        # Show last 14 days
  clawtrics tools        # Tool usage chart
  clawtrics shell        # Shell commands (docker, git, curl, etc.)
  clawtrics chains       # Tool sequence patterns
  clawtrics context      # Context pressure details
`);
}

export { parseLogFile, getLogFiles, parseAllLogs, TOOL_TOKEN_ESTIMATES, extractBaseCommand, MODEL_PRICING, getModelPricing };
