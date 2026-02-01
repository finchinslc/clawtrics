'use client';

import { useState, useEffect } from 'react';

function formatDuration(ms) {
  if (!ms) return '0s';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function StatCard({ title, value, color = '#fff' }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '12px 16px',
      border: '1px solid #333',
    }}>
      <div style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '22px', fontWeight: 'bold', color }}>{value}</div>
    </div>
  );
}

function MiniStatRow({ items }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '12px 16px',
      border: '1px solid #333',
      display: 'flex',
      justifyContent: 'space-between',
    }}>
      {items.map((item, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '10px', marginBottom: '2px' }}>{item.label}</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: item.color || '#fff' }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function CompactBarChart({ title, data, color = '#ef4444', emoji = '📊', maxItems = 5 }) {
  const sortedData = Object.entries(data || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems);
  
  const maxCount = sortedData[0]?.[1] || 1;
  
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '12px 16px',
      border: '1px solid #333',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ color: '#888', fontSize: '11px', marginBottom: '10px' }}>{emoji} {title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {sortedData.length === 0 ? (
          <div style={{ color: '#555', fontSize: '11px' }}>No data</div>
        ) : sortedData.map(([name, count]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '70px', fontSize: '11px', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ flex: 1, height: '14px', backgroundColor: '#333', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${(count / maxCount) * 100}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ width: '30px', fontSize: '10px', color: '#888', textAlign: 'right' }}>{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyChart({ dailyMetrics }) {
  const days = Object.entries(dailyMetrics || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7);
  
  const maxRuns = Math.max(...days.map(d => d[1].totalRuns), 1);
  
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '12px 16px',
      border: '1px solid #333',
    }}>
      <div style={{ color: '#888', fontSize: '11px', marginBottom: '10px' }}>📅 Last 7 Days</div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '80px' }}>
        {days.length === 0 ? (
          <div style={{ color: '#555', fontSize: '11px' }}>No data</div>
        ) : days.map(([date, metrics]) => (
          <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
            <div style={{
              width: '100%',
              height: `${Math.max((metrics.totalRuns / maxRuns) * 60, 3)}px`,
              backgroundColor: '#ef4444',
              borderRadius: '3px 3px 0 0',
              transition: 'height 0.3s ease',
            }} />
            <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
              {date.slice(8)}
            </div>
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
    const interval = setInterval(() => {
      if (autoRefresh) fetchMetrics();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);
  
  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: '18px' }}>📊 Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#ef4444', marginBottom: '12px' }}>Error: {error}</div>
        <button onClick={fetchMetrics} style={{
          padding: '8px 16px',
          backgroundColor: '#333',
          border: 'none',
          borderRadius: '6px',
          color: '#fff',
          cursor: 'pointer',
        }}>
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '16px 20px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📊</span> Clawtrics
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer', width: '14px', height: '14px' }}
            />
            <span style={{ color: '#888', fontSize: '11px' }}>Auto</span>
          </label>
          <button onClick={fetchMetrics} style={{
            padding: '6px 12px',
            backgroundColor: '#333',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
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
        <StatCard title="Runs" value={metrics.totalRuns} />
        <StatCard title="Duration" value={formatDuration(metrics.totalDurationMs)} />
        <StatCard title="Sessions" value={metrics.totalSessions} />
        <StatCard 
          title="Aborted" 
          value={metrics.abortedRuns} 
          color={metrics.abortedRuns > 0 ? '#f59e0b' : '#22c55e'}
        />
      </div>
      
      {/* Duration Percentiles */}
      <div style={{ marginBottom: '12px' }}>
        <MiniStatRow items={[
          { label: 'Avg', value: formatDuration(metrics.avgDurationMs) },
          { label: 'P50', value: formatDuration(metrics.p50DurationMs) },
          { label: 'P95', value: formatDuration(metrics.p95DurationMs), color: '#f59e0b' },
          { label: 'Max', value: formatDuration(metrics.maxDurationMs), color: '#ef4444' },
        ]} />
      </div>
      
      {/* Charts Row 1: Tools + Models */}
      <div style={{ 
        display: 'flex', 
        gap: '10px',
        marginBottom: '12px',
      }}>
        <CompactBarChart title="Tools" data={metrics.tools} color="#ef4444" emoji="🔧" maxItems={5} />
        <CompactBarChart title="Models" data={metrics.models} color="#3b82f6" emoji="🤖" maxItems={5} />
      </div>
      
      {/* Charts Row 2: Channels + Providers */}
      <div style={{ 
        display: 'flex', 
        gap: '10px',
        marginBottom: '12px',
      }}>
        <CompactBarChart title="Channels" data={metrics.channels} color="#22c55e" emoji="📱" maxItems={5} />
        <CompactBarChart title="Providers" data={metrics.providers} color="#a855f7" emoji="☁️" maxItems={5} />
      </div>
      
      {/* Daily Activity */}
      <div style={{ marginBottom: '12px' }}>
        <DailyChart dailyMetrics={metrics.dailyMetrics} />
      </div>
      
      {/* Footer */}
      <div style={{ 
        padding: '8px 12px', 
        backgroundColor: '#1a1a1a', 
        borderRadius: '6px',
        border: '1px solid #333',
        fontSize: '10px',
        color: '#555',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{lastUpdate?.toLocaleTimeString()}</span>
        <span>{autoRefresh ? '🔄 30s' : '⏸️'}</span>
      </div>
    </div>
  );
}
