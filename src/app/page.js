'use client';

import { useState, useEffect } from 'react';

function formatDuration(ms) {
  if (!ms) return '0s';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function StatCard({ title, value, subtitle, color = '#ef4444' }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #333',
    }}>
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>{value}</div>
      {subtitle && <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>{subtitle}</div>}
    </div>
  );
}

function HorizontalBarChart({ title, data, color = '#ef4444', emoji = '📊' }) {
  const sortedData = Object.entries(data || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  const maxCount = sortedData[0]?.[1] || 1;
  
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #333',
    }}>
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>{emoji} {title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedData.length === 0 ? (
          <div style={{ color: '#555', fontSize: '13px' }}>No data yet</div>
        ) : sortedData.map(([name, count]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '100px', fontSize: '13px', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ flex: 1, height: '20px', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${(count / maxCount) * 100}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ width: '40px', fontSize: '12px', color: '#888', textAlign: 'right' }}>{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyChart({ dailyMetrics }) {
  const days = Object.entries(dailyMetrics || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14);
  
  const maxRuns = Math.max(...days.map(d => d[1].totalRuns), 1);
  
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #333',
    }}>
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>📅 Daily Activity (Last 14 Days)</div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '150px', paddingTop: '20px' }}>
        {days.length === 0 ? (
          <div style={{ color: '#555', fontSize: '13px' }}>No data yet</div>
        ) : days.map(([date, metrics]) => (
          <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
            <div style={{
              width: '100%',
              height: `${Math.max((metrics.totalRuns / maxRuns) * 120, 4)}px`,
              backgroundColor: '#ef4444',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.3s ease',
            }} />
            <div style={{ fontSize: '9px', color: '#666', marginTop: '8px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
              {date.slice(5)}
            </div>
            <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>{metrics.totalRuns}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DurationStats({ metrics }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #333',
    }}>
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>⏱️ Duration Percentiles</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <div>
          <div style={{ color: '#666', fontSize: '11px' }}>Average</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatDuration(metrics.avgDurationMs)}</div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: '11px' }}>Median (P50)</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatDuration(metrics.p50DurationMs)}</div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: '11px' }}>P95</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{formatDuration(metrics.p95DurationMs)}</div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: '11px' }}>Max</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{formatDuration(metrics.maxDurationMs)}</div>
        </div>
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
  
  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMetrics(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) fetchMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);
  
  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: '24px' }}>📊 Loading metrics...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', color: '#ef4444', marginBottom: '16px' }}>Error: {error}</div>
        <button onClick={fetchMetrics} style={{
          padding: '12px 24px',
          backgroundColor: '#333',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
        }}>
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>📊</span> Clawtrics
          </h1>
          <p style={{ color: '#888', margin: '8px 0 0' }}>OpenClaw Metrics Dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: '#888', fontSize: '13px' }}>Auto-refresh</span>
          </label>
          <button onClick={fetchMetrics} style={{
            padding: '8px 16px',
            backgroundColor: '#333',
            border: '1px solid #444',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
          }}>
            ↻ Refresh
          </button>
        </div>
      </div>
      
      {/* Top Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
        gap: '16px',
        marginBottom: '24px',
      }}>
        <StatCard title="Total Runs" value={metrics.totalRuns} />
        <StatCard title="Total Duration" value={formatDuration(metrics.totalDurationMs)} />
        <StatCard title="Sessions" value={metrics.totalSessions} />
        <StatCard 
          title="Aborted" 
          value={metrics.abortedRuns} 
          color={metrics.abortedRuns > 0 ? '#f59e0b' : '#22c55e'}
        />
      </div>
      
      {/* Duration Stats */}
      <div style={{ marginBottom: '24px' }}>
        <DurationStats metrics={metrics} />
      </div>
      
      {/* Charts Row 1 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '16px',
        marginBottom: '24px',
      }}>
        <HorizontalBarChart title="Tool Usage" data={metrics.tools} color="#ef4444" emoji="🔧" />
        <HorizontalBarChart title="Models" data={metrics.models} color="#3b82f6" emoji="🤖" />
      </div>
      
      {/* Charts Row 2 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '16px',
        marginBottom: '24px',
      }}>
        <HorizontalBarChart title="Channels" data={metrics.channels} color="#22c55e" emoji="📱" />
        <HorizontalBarChart title="Providers" data={metrics.providers} color="#a855f7" emoji="☁️" />
      </div>
      
      {/* Daily Activity */}
      <div style={{ marginBottom: '24px' }}>
        <DailyChart dailyMetrics={metrics.dailyMetrics} />
      </div>
      
      {/* Footer */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#1a1a1a', 
        borderRadius: '12px',
        border: '1px solid #333',
        fontSize: '12px',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>Last updated: {lastUpdate?.toLocaleString()}</span>
        <span>{autoRefresh ? '🔄 Auto-refresh enabled (30s)' : '⏸️ Auto-refresh paused'}</span>
      </div>
    </div>
  );
}
