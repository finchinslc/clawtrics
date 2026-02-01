'use client';

import { useState, useEffect } from 'react';

// Theme colors
const themes = {
  dark: {
    bg: '#0a0a0a',
    card: '#1a1a1a',
    border: '#333',
    text: '#fff',
    textMuted: '#888',
    textDim: '#555',
    accent: '#ef4444',
    accentBlue: '#3b82f6',
    accentGreen: '#22c55e',
    accentPurple: '#a855f7',
    accentYellow: '#f59e0b',
    accentOrange: '#f97316',
    barBg: '#333',
    tooltipBg: '#333',
    tooltipText: '#fff',
  },
  light: {
    bg: '#f5f5f5',
    card: '#ffffff',
    border: '#e0e0e0',
    text: '#1a1a1a',
    textMuted: '#666',
    textDim: '#999',
    accent: '#dc2626',
    accentBlue: '#2563eb',
    accentGreen: '#16a34a',
    accentPurple: '#9333ea',
    accentYellow: '#d97706',
    accentOrange: '#ea580c',
    barBg: '#e5e5e5',
    tooltipBg: '#1a1a1a',
    tooltipText: '#fff',
  },
};

function formatDuration(ms) {
  if (!ms) return '0s';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatTokens(tokens) {
  if (!tokens || tokens === 0) return '0';
  if (tokens < 1000) return String(Math.round(tokens));
  return `${(tokens / 1000).toFixed(1)}K`;
}

// Info icon for inline help
function InfoIcon({ tooltip, theme }) {
  const [show, setShow] = useState(false);
  const t = themes[theme];
  
  return (
    <span 
      style={{ 
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        backgroundColor: t.barBg,
        color: t.textMuted,
        fontSize: '9px',
        cursor: 'help',
        marginLeft: '4px',
        position: 'relative',
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      ?
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '8px 12px',
          backgroundColor: t.tooltipBg,
          color: t.tooltipText,
          fontSize: '11px',
          borderRadius: '6px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
          maxWidth: '200px',
          whiteSpace: 'normal',
          textAlign: 'left',
        }}>
          {tooltip}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${t.tooltipBg}`,
          }} />
        </div>
      )}
    </span>
  );
}

function StatCard({ title, value, tooltip, color, theme }) {
  const t = themes[theme];
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
      position: 'relative',
    }}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
        {title}
        {tooltip && <InfoIcon tooltip={tooltip} theme={theme} />}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 'bold', color: color || t.text }}>{value}</div>
    </div>
  );
}

function MiniStatRow({ items, theme }) {
  const t = themes[theme];
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
      display: 'flex',
      justifyContent: 'space-between',
    }}>
      {items.map((item, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ color: t.textMuted, fontSize: '10px', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.label}
            {item.tooltip && <InfoIcon tooltip={item.tooltip} theme={theme} />}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: item.color || t.text }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function CompactBarChart({ title, data, color, emoji, maxItems = 5, theme, onBarClick, activeFilter, filterType, tooltip }) {
  const t = themes[theme];
  const sortedData = Object.entries(data || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems);
  
  const maxCount = sortedData[0]?.[1] || 1;
  
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
        {emoji} {title}
        {tooltip && <InfoIcon tooltip={tooltip} theme={theme} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {sortedData.length === 0 ? (
          <div style={{ color: t.textDim, fontSize: '11px' }}>No data</div>
        ) : sortedData.map(([name, count]) => {
          const isActive = activeFilter?.type === filterType && activeFilter?.value === name;
          return (
            <div 
              key={name} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer',
                opacity: activeFilter && !isActive ? 0.4 : 1,
                transition: 'opacity 0.2s',
              }}
              onClick={() => onBarClick?.(filterType, name)}
            >
              <div style={{ 
                width: '70px', 
                fontSize: '11px', 
                color: isActive ? color : t.text, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 'bold' : 'normal',
              }}>{name}</div>
              <div style={{ flex: 1, height: '14px', backgroundColor: t.barBg, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${(count / maxCount) * 100}%`,
                  height: '100%',
                  backgroundColor: color,
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ width: '30px', fontSize: '10px', color: t.textMuted, textAlign: 'right' }}>{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyChart({ dailyMetrics, theme, tooltip }) {
  const t = themes[theme];
  const days = Object.entries(dailyMetrics || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7);
  
  const maxRuns = Math.max(...days.map(d => d[1].totalRuns), 1);
  
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
    }}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
        📅 Last 7 Days
        {tooltip && <InfoIcon tooltip={tooltip} theme={theme} />}
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '80px' }}>
        {days.length === 0 ? (
          <div style={{ color: t.textDim, fontSize: '11px' }}>No data</div>
        ) : days.map(([date, metrics]) => (
          <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
            <div style={{
              width: '100%',
              height: `${Math.max((metrics.totalRuns / maxRuns) * 60, 3)}px`,
              backgroundColor: t.accent,
              borderRadius: '3px 3px 0 0',
              transition: 'height 0.3s ease',
            }} />
            <div style={{ fontSize: '9px', color: t.textMuted, marginTop: '4px' }}>
              {date.slice(8)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolChains({ chains, theme, tooltip }) {
  const t = themes[theme];
  const topChains = Object.entries(chains || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
      flex: 1,
    }}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
        🔗 Tool Chains
        {tooltip && <InfoIcon tooltip={tooltip} theme={theme} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {topChains.length === 0 ? (
          <div style={{ color: t.textDim, fontSize: '11px' }}>No chains detected</div>
        ) : topChains.map(([chain, count]) => (
          <div key={chain} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: t.text }}>{chain}</span>
            <span style={{ color: t.textMuted }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlowestRuns({ runs, theme, tooltip }) {
  const t = themes[theme];
  const slowest = [...(runs || [])]
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 3);
  
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
      flex: 1,
    }}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
        🐢 Slowest Runs
        {tooltip && <InfoIcon tooltip={tooltip} theme={theme} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {slowest.length === 0 ? (
          <div style={{ color: t.textDim, fontSize: '11px' }}>No runs yet</div>
        ) : slowest.map((run, i) => (
          <div key={run.runId || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: t.text }}>{run.channel || 'unknown'} · {run.model?.slice(0, 12) || '?'}</span>
            <span style={{ color: t.accentYellow, fontWeight: 'bold' }}>{formatDuration(run.durationMs)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThinkingBreakdown({ metrics, theme }) {
  const t = themes[theme];
  const { thinkingModes = {}, thinkingAvgDurations = {}, totalRuns = 0 } = metrics || {};
  
  // Order: off, low, medium, high
  const modeOrder = ['off', 'low', 'medium', 'high'];
  const modeColors = {
    off: t.textMuted,
    low: t.accentGreen,
    medium: t.accentYellow,
    high: t.accentOrange,
  };
  const modeLabels = {
    off: 'Off',
    low: 'Low',
    medium: 'Med',
    high: 'High',
  };
  
  const modes = modeOrder.filter(m => thinkingModes[m] > 0);
  
  if (modes.length === 0) {
    return null;
  }
  
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
    }}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
        🧠 Thinking Mode
        <InfoIcon tooltip="Distribution of reasoning levels and their average run durations." theme={theme} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${modes.length}, 1fr)`, gap: '12px' }}>
        {modes.map(mode => {
          const count = thinkingModes[mode] || 0;
          const pct = totalRuns > 0 ? ((count / totalRuns) * 100).toFixed(0) : 0;
          const avgDuration = thinkingAvgDurations[mode] || 0;
          
          return (
            <div key={mode} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: modeColors[mode] }}>
                {pct}%
              </div>
              <div style={{ fontSize: '9px', color: t.textMuted }}>
                {modeLabels[mode]} · {count} · ~{formatDuration(avgDuration)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ErrorSummary({ metrics, theme }) {
  const t = themes[theme];
  const { errors = { total: 0, byType: {} } } = metrics || {};
  
  if (errors.total === 0) {
    return null;
  }
  
  const errorLabels = {
    exec_failed: 'Exec Failed',
    edit_failed: 'Edit Failed',
    auth_error: 'Auth Error',
    rate_limit: 'Rate Limit',
    timeout: 'Timeout',
    network_error: 'Network',
    deprecation: 'Deprecation',
    lane_error: 'Lane Error',
    other: 'Other',
  };
  
  const sortedErrors = Object.entries(errors.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
    }}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
        ⚠️ Errors
        <InfoIcon tooltip="Errors logged during runs. Includes tool failures, auth issues, and network errors." theme={theme} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'center', minWidth: '50px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: errors.total > 10 ? t.accent : t.accentYellow }}>
            {errors.total}
          </div>
          <div style={{ fontSize: '9px', color: t.textMuted }}>Total</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {sortedErrors.map(([type, count]) => (
            <span key={type} style={{
              padding: '3px 8px',
              backgroundColor: t.bg,
              borderRadius: '4px',
              fontSize: '10px',
              color: t.text,
            }}>
              {errorLabels[type] || type} <span style={{ color: t.textMuted }}>×{count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContextPressure({ metrics, theme }) {
  const t = themes[theme];
  const { compactionCount = 0, totalEstimatedTokens = 0, avgEstimatedTokens = 0, heavySessions = 0, runsWithCompaction = 0, totalRuns = 0 } = metrics || {};
  
  // Determine pressure level for color coding
  const compactionRate = totalRuns > 0 ? (runsWithCompaction / totalRuns) * 100 : 0;
  const pressureColor = compactionRate > 20 ? t.accent : compactionRate > 10 ? t.accentYellow : t.accentGreen;
  
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
    }}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
        📏 Context Pressure
        <InfoIcon tooltip="Estimates based on tool output sizes. Compaction = context hit ~80% capacity." theme={theme} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: pressureColor }}>{compactionCount}</div>
          <div style={{ fontSize: '9px', color: t.textMuted }}>Compactions</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: t.text }}>{formatTokens(totalEstimatedTokens)}</div>
          <div style={{ fontSize: '9px', color: t.textMuted }}>Est. Tokens</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: t.text }}>{formatTokens(avgEstimatedTokens)}</div>
          <div style={{ fontSize: '9px', color: t.textMuted }}>Avg/Run</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: heavySessions > 0 ? t.accentOrange : t.accentGreen }}>{heavySessions}</div>
          <div style={{ fontSize: '9px', color: t.textMuted }}>Heavy Sessions</div>
        </div>
      </div>
    </div>
  );
}

function SessionModal({ session, runs, theme, onClose }) {
  const t = themes[theme];
  
  if (!session) return null;
  
  const sessionRuns = runs.filter(r => r.sessionId === session.sessionId);
  const totalDuration = sessionRuns.reduce((sum, r) => sum + r.durationMs, 0);
  const totalCompactions = sessionRuns.reduce((sum, r) => sum + (r.compactions || 0), 0);
  
  // Group tools across all runs
  const toolCounts = {};
  sessionRuns.forEach(run => {
    (run.tools || []).forEach(tool => {
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
    });
  });
  const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: t.card,
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        border: `1px solid ${t.border}`,
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', color: t.text }}>🔍 Session Deep-Dive</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: t.textMuted,
            fontSize: '20px',
            cursor: 'pointer',
          }}>×</button>
        </div>
        
        {/* Session ID */}
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: t.bg, 
          borderRadius: '6px', 
          marginBottom: '16px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: t.textMuted,
        }}>
          {session.sessionId}
        </div>
        
        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: t.bg, borderRadius: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: t.text }}>{sessionRuns.length}</div>
            <div style={{ fontSize: '10px', color: t.textMuted }}>Runs</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: t.bg, borderRadius: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: t.text }}>{formatDuration(totalDuration)}</div>
            <div style={{ fontSize: '10px', color: t.textMuted }}>Duration</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', backgroundColor: t.bg, borderRadius: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: totalCompactions > 0 ? t.accentYellow : t.text }}>{totalCompactions}</div>
            <div style={{ fontSize: '10px', color: t.textMuted }}>Compactions</div>
          </div>
        </div>
        
        {/* Top Tools */}
        {topTools.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: t.textMuted, marginBottom: '8px' }}>🔧 Tools Used</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {topTools.map(([tool, count]) => (
                <span key={tool} style={{
                  padding: '4px 8px',
                  backgroundColor: t.bg,
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: t.text,
                }}>
                  {tool} <span style={{ color: t.textMuted }}>×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Runs Timeline */}
        <div>
          <div style={{ fontSize: '11px', color: t.textMuted, marginBottom: '8px' }}>📋 Run Timeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessionRuns.map((run, i) => (
              <div key={run.runId || i} style={{
                padding: '10px 12px',
                backgroundColor: t.bg,
                borderRadius: '6px',
                borderLeft: `3px solid ${run.aborted ? t.accent : t.accentGreen}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: t.text }}>
                    {run.model || 'unknown'}
                  </span>
                  <span style={{ fontSize: '11px', color: t.accentBlue, fontWeight: 'bold' }}>
                    {formatDuration(run.durationMs)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: t.textMuted }}>
                  <span>📱 {run.channel}</span>
                  <span>🔧 {(run.tools || []).length} tools</span>
                  {run.compactions > 0 && <span style={{ color: t.accentYellow }}>📏 {run.compactions} compact</span>}
                  {run.aborted && <span style={{ color: t.accent }}>⚠️ Aborted</span>}
                </div>
                {(run.tools || []).length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '10px', color: t.textDim }}>
                    {(run.tools || []).slice(0, 10).join(' → ')}
                    {(run.tools || []).length > 10 && ` (+${(run.tools || []).length - 10} more)`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentSessions({ runs, theme, onSessionClick, tooltip }) {
  const t = themes[theme];
  
  // Group runs by session and get recent unique sessions
  const sessionMap = new Map();
  (runs || []).forEach(run => {
    if (!run.sessionId) return;
    if (!sessionMap.has(run.sessionId)) {
      sessionMap.set(run.sessionId, {
        sessionId: run.sessionId,
        runs: [],
        firstTime: run.time,
        lastTime: run.time,
        channel: run.channel,
      });
    }
    const session = sessionMap.get(run.sessionId);
    session.runs.push(run);
    if (run.time > session.lastTime) session.lastTime = run.time;
    if (run.time < session.firstTime) session.firstTime = run.time;
  });
  
  const sessions = [...sessionMap.values()]
    .sort((a, b) => (b.lastTime || '').localeCompare(a.lastTime || ''))
    .slice(0, 3);
  
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
      flex: 1,
    }}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
        📂 Recent Sessions
        {tooltip && <InfoIcon tooltip={tooltip} theme={theme} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {sessions.length === 0 ? (
          <div style={{ color: t.textDim, fontSize: '11px' }}>No sessions</div>
        ) : sessions.map(session => {
          const totalDuration = session.runs.reduce((sum, r) => sum + r.durationMs, 0);
          return (
            <div 
              key={session.sessionId} 
              onClick={() => onSessionClick(session)}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '11px',
                padding: '6px 8px',
                backgroundColor: t.bg,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = t.border}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = t.bg}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: t.textMuted }}>{session.channel || '?'}</span>
                <span style={{ color: t.text }}>{session.runs.length} runs</span>
              </div>
              <span style={{ color: t.accentBlue }}>{formatDuration(totalDuration)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [activeFilter, setActiveFilter] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'
  const [selectedSession, setSelectedSession] = useState(null);
  
  const t = themes[theme];
  
  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem('clawtrics-theme');
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('clawtrics-theme', newTheme);
  };
  
  const handleBarClick = (type, value) => {
    if (activeFilter?.type === type && activeFilter?.value === value) {
      setActiveFilter(null);
    } else {
      setActiveFilter({ type, value });
    }
  };
  
  // SSE connection for real-time updates
  useEffect(() => {
    let eventSource;
    let reconnectTimer;
    
    const connect = () => {
      setConnectionStatus('connecting');
      eventSource = new EventSource('/api/stream');
      
      eventSource.onopen = () => {
        setConnectionStatus('connected');
      };
      
      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'metrics') {
            setMetrics(message.data);
            setLoading(false);
            setError(null);
            setConnectionStatus('connected');
          } else if (message.type === 'error') {
            setError(message.error);
          }
          // Ignore heartbeat messages
        } catch (e) {
          console.error('Failed to parse SSE message:', e);
        }
      };
      
      eventSource.onerror = () => {
        setConnectionStatus('disconnected');
        eventSource.close();
        
        // Reconnect after 5 seconds
        reconnectTimer = setTimeout(connect, 5000);
      };
    };
    
    connect();
    
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, []);
  
  // Apply filter to metrics
  const filteredMetrics = metrics ? (() => {
    if (!activeFilter) return metrics;
    
    const allRuns = Object.values(metrics.dailyMetrics || {}).flatMap(d => d.runs || []);
    const filtered = allRuns.filter(run => {
      if (activeFilter.type === 'model') return run.model === activeFilter.value;
      if (activeFilter.type === 'channel') return run.channel === activeFilter.value;
      if (activeFilter.type === 'provider') return run.provider === activeFilter.value;
      if (activeFilter.type === 'tool') return true; // Tools don't filter runs directly
      return true;
    });
    
    return {
      ...metrics,
      totalRuns: filtered.length,
      totalDurationMs: filtered.reduce((sum, r) => sum + r.durationMs, 0),
      avgDurationMs: filtered.length > 0 ? filtered.reduce((sum, r) => sum + r.durationMs, 0) / filtered.length : 0,
    };
  })() : null;
  
  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#888', backgroundColor: t.bg, minHeight: '100vh' }}>
        <div style={{ fontSize: '18px' }}>📊 Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', backgroundColor: t.bg, minHeight: '100vh' }}>
        <div style={{ fontSize: '16px', color: t.accent, marginBottom: '12px' }}>Error: {error}</div>
        <button onClick={fetchMetrics} style={{
          padding: '8px 16px',
          backgroundColor: t.card,
          border: `1px solid ${t.border}`,
          borderRadius: '6px',
          color: t.text,
          cursor: 'pointer',
        }}>
          Retry
        </button>
      </div>
    );
  }
  
  // Get all runs for slowest runs display
  const allRuns = Object.values(metrics?.dailyMetrics || {}).flatMap(d => d.runs || []);
  
  return (
    <div style={{ padding: '16px 20px', maxWidth: '960px', margin: '0 auto', backgroundColor: t.bg, minHeight: '100vh', transition: 'background-color 0.3s' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: t.text }}>
            <span>📊</span> Clawtrics
          </h1>
          {/* Connection Status */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: t.card,
            borderRadius: '12px',
            border: `1px solid ${t.border}`,
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: connectionStatus === 'connected' ? t.accentGreen : 
                             connectionStatus === 'connecting' ? t.accentYellow : t.accent,
              animation: connectionStatus === 'connecting' ? 'pulse 1s infinite' : 'none',
            }} />
            <span style={{ fontSize: '11px', color: t.textMuted }}>
              {connectionStatus === 'connected' ? 'Live' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {activeFilter && (
            <button onClick={() => setActiveFilter(null)} style={{
              padding: '4px 8px',
              backgroundColor: t.accent,
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '10px',
            }}>
              ✕ {activeFilter.value}
            </button>
          )}
          <button onClick={toggleTheme} style={{
            padding: '6px 10px',
            backgroundColor: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: '4px',
            color: t.text,
            cursor: 'pointer',
            fontSize: '12px',
          }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      
      {/* Top Stats Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '10px',
        marginBottom: '12px',
      }}>
        <StatCard title="Runs" value={filteredMetrics.totalRuns} theme={theme} tooltip="Total AI conversation turns processed" />
        <StatCard title="Duration" value={formatDuration(filteredMetrics.totalDurationMs)} theme={theme} tooltip="Cumulative time spent in AI runs" />
        <StatCard title="Sessions" value={metrics.totalSessions} theme={theme} tooltip="Unique conversation threads" />
        <StatCard 
          title="Aborted" 
          value={metrics.abortedRuns} 
          color={metrics.abortedRuns > 0 ? t.accentYellow : t.accentGreen}
          theme={theme}
          tooltip="Runs cancelled or interrupted"
        />
      </div>
      
      {/* Duration Percentiles */}
      <div style={{ marginBottom: '12px' }}>
        <MiniStatRow 
          theme={theme}
          items={[
            { label: 'Avg', value: formatDuration(filteredMetrics.avgDurationMs || metrics.avgDurationMs), tooltip: 'Mean run duration' },
            { label: 'P50', value: formatDuration(metrics.p50DurationMs), tooltip: 'Median — 50% of runs are faster' },
            { label: 'P95', value: formatDuration(metrics.p95DurationMs), color: t.accentYellow, tooltip: '95th percentile — only 5% slower' },
            { label: 'Max', value: formatDuration(metrics.maxDurationMs), color: t.accent, tooltip: 'Longest single run recorded' },
          ]} 
        />
      </div>
      
      {/* Context Pressure + Thinking Mode */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <ContextPressure metrics={metrics} theme={theme} />
        </div>
        <div style={{ flex: 1 }}>
          <ThinkingBreakdown metrics={metrics} theme={theme} />
        </div>
      </div>
      
      {/* Error Summary (only shows if errors exist) */}
      <div style={{ marginBottom: '12px' }}>
        <ErrorSummary metrics={metrics} theme={theme} />
      </div>
      
      {/* Charts Row 1: Tools + Models */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <CompactBarChart 
          title="Tools" 
          data={metrics.tools} 
          color={t.accent} 
          emoji="🔧" 
          maxItems={5} 
          theme={theme}
          onBarClick={handleBarClick}
          activeFilter={activeFilter}
          filterType="tool"
          tooltip="Tool calls: exec, read, write, browser, etc."
        />
        <CompactBarChart 
          title="Models" 
          data={metrics.models} 
          color={t.accentBlue} 
          emoji="🤖" 
          maxItems={5} 
          theme={theme}
          onBarClick={handleBarClick}
          activeFilter={activeFilter}
          filterType="model"
          tooltip="AI models used (click to filter)"
        />
      </div>
      
      {/* Charts Row 2: Channels + Shell Commands */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <CompactBarChart 
          title="Channels" 
          data={metrics.channels} 
          color={t.accentGreen} 
          emoji="📱" 
          maxItems={5} 
          theme={theme}
          onBarClick={handleBarClick}
          activeFilter={activeFilter}
          filterType="channel"
          tooltip="Message sources: webchat, discord, etc."
        />
        <CompactBarChart 
          title="Shell Commands" 
          data={metrics.shellCommands} 
          color={t.accentOrange} 
          emoji="💻" 
          maxItems={5} 
          theme={theme}
          onBarClick={handleBarClick}
          activeFilter={activeFilter}
          filterType="shell"
          tooltip="CLI tools: docker, git, curl, npm, etc."
        />
      </div>
      
      {/* Row 3: Tool Chains + Slowest Runs + Recent Sessions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <ToolChains 
          chains={metrics.toolChains} 
          theme={theme} 
          tooltip="Sequential tool patterns (A→B)"
        />
        <SlowestRuns 
          runs={allRuns} 
          theme={theme}
          tooltip="Longest running turns"
        />
        <RecentSessions 
          runs={allRuns} 
          theme={theme}
          onSessionClick={setSelectedSession}
          tooltip="Click to view session details"
        />
      </div>
      
      {/* Daily Activity */}
      <div style={{ marginBottom: '12px' }}>
        <DailyChart 
          dailyMetrics={metrics.dailyMetrics} 
          theme={theme}
          tooltip="Runs per day"
        />
      </div>
      
      {/* Session Modal */}
      {selectedSession && (
        <SessionModal 
          session={selectedSession}
          runs={allRuns}
          theme={theme}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
