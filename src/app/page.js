'use client';

import { useState, useEffect, useCallback } from 'react';

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
    barBg: '#333',
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
    barBg: '#e5e5e5',
  },
};

function formatDuration(ms) {
  if (!ms) return '0s';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatRelativeTime(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
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
    }} title={tooltip}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '4px' }}>{title}</div>
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
        <div key={i} style={{ textAlign: 'center' }} title={item.tooltip}>
          <div style={{ color: t.textMuted, fontSize: '10px', marginBottom: '2px' }}>{item.label}</div>
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
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px' }} title={tooltip}>{emoji} {title}</div>
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
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px' }} title={tooltip}>📅 Last 7 Days</div>
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
    .slice(0, 5);
  
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
    }}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px' }} title={tooltip}>🔗 Tool Chains</div>
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
    .slice(0, 5);
  
  return (
    <div style={{
      backgroundColor: t.card,
      borderRadius: '8px',
      padding: '12px 16px',
      border: `1px solid ${t.border}`,
    }}>
      <div style={{ color: t.textMuted, fontSize: '11px', marginBottom: '10px' }} title={tooltip}>🐢 Slowest Runs</div>
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

export default function Home() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [activeFilter, setActiveFilter] = useState(null);
  const [relativeTime, setRelativeTime] = useState('');
  
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
  
  // Update relative time every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdate) {
        setRelativeTime(formatRelativeTime(lastUpdate));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);
  
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
  
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMetrics(data);
      setLastUpdate(new Date());
      setRelativeTime('just now');
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => {
      if (autoRefresh) fetchMetrics();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);
  
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
        <h1 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: t.text }}>
          <span>📊</span> Clawtrics
        </h1>
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer', width: '14px', height: '14px' }}
            />
            <span style={{ color: t.textMuted, fontSize: '11px' }}>Auto</span>
          </label>
          <button onClick={fetchMetrics} style={{
            padding: '6px 12px',
            backgroundColor: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: '4px',
            color: t.text,
            cursor: 'pointer',
            fontSize: '11px',
          }}>
            ↻
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
        <StatCard title="Runs" value={filteredMetrics.totalRuns} theme={theme} tooltip="Total number of AI runs (conversations/turns)" />
        <StatCard title="Duration" value={formatDuration(filteredMetrics.totalDurationMs)} theme={theme} tooltip="Total time spent in AI runs" />
        <StatCard title="Sessions" value={metrics.totalSessions} theme={theme} tooltip="Unique conversation sessions" />
        <StatCard 
          title="Aborted" 
          value={metrics.abortedRuns} 
          color={metrics.abortedRuns > 0 ? t.accentYellow : t.accentGreen}
          theme={theme}
          tooltip="Runs that were cancelled or failed"
        />
      </div>
      
      {/* Duration Percentiles */}
      <div style={{ marginBottom: '12px' }}>
        <MiniStatRow 
          theme={theme}
          items={[
            { label: 'Avg', value: formatDuration(filteredMetrics.avgDurationMs || metrics.avgDurationMs), tooltip: 'Average run duration' },
            { label: 'P50', value: formatDuration(metrics.p50DurationMs), tooltip: 'Median duration (50% of runs are faster)' },
            { label: 'P95', value: formatDuration(metrics.p95DurationMs), color: t.accentYellow, tooltip: '95th percentile (only 5% of runs are slower)' },
            { label: 'Max', value: formatDuration(metrics.maxDurationMs), color: t.accent, tooltip: 'Longest single run' },
          ]} 
        />
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
          tooltip="OpenClaw tools invoked (exec, read, write, etc.)"
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
          tooltip="AI models used for runs"
        />
      </div>
      
      {/* Charts Row 2: Channels + Providers */}
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
          tooltip="Message sources (webchat, discord, heartbeat, etc.)"
        />
        <CompactBarChart 
          title="Providers" 
          data={metrics.providers} 
          color={t.accentPurple} 
          emoji="☁️" 
          maxItems={5} 
          theme={theme}
          onBarClick={handleBarClick}
          activeFilter={activeFilter}
          filterType="provider"
          tooltip="API providers routing AI requests"
        />
      </div>
      
      {/* Row 3: Tool Chains + Slowest Runs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <ToolChains 
          chains={metrics.toolChains} 
          theme={theme} 
          tooltip="Common tool sequences (A→B means B often follows A)"
        />
        <SlowestRuns 
          runs={allRuns} 
          theme={theme}
          tooltip="Longest running individual turns"
        />
      </div>
      
      {/* Daily Activity */}
      <div style={{ marginBottom: '12px' }}>
        <DailyChart 
          dailyMetrics={metrics.dailyMetrics} 
          theme={theme}
          tooltip="Number of runs per day"
        />
      </div>
      
      {/* Footer */}
      <div style={{ 
        padding: '8px 12px', 
        backgroundColor: t.card, 
        borderRadius: '6px',
        border: `1px solid ${t.border}`,
        fontSize: '10px',
        color: t.textDim,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>Updated {relativeTime}</span>
        <span>{autoRefresh ? '🔄 30s' : '⏸️'}</span>
      </div>
    </div>
  );
}
