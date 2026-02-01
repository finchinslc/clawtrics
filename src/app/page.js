'use client';

import { useState, useEffect } from 'react';

function formatDuration(ms) {
  if (!ms) return '0s';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function StatCard({ title, value, subtitle }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #333',
    }}>
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{value}</div>
      {subtitle && <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>{subtitle}</div>}
    </div>
  );
}

function ToolChart({ tools }) {
  const sortedTools = Object.entries(tools || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  const maxCount = sortedTools[0]?.[1] || 1;
  
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #333',
    }}>
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>Tool Usage</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedTools.map(([tool, count]) => (
          <div key={tool} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '80px', fontSize: '13px', color: '#ccc' }}>{tool}</div>
            <div style={{ flex: 1, height: '20px', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${(count / maxCount) * 100}%`,
                height: '100%',
                backgroundColor: '#ef4444',
                borderRadius: '4px',
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
    .slice(-7);
  
  const maxRuns = Math.max(...days.map(d => d[1].totalRuns), 1);
  
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #333',
    }}>
      <div style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>Daily Activity</div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '120px' }}>
        {days.map(([date, metrics]) => (
          <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '100%',
              height: `${(metrics.totalRuns / maxRuns) * 100}px`,
              backgroundColor: '#ef4444',
              borderRadius: '4px 4px 0 0',
              minHeight: '4px',
            }} />
            <div style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>
              {date.split('-').slice(1).join('/')}
            </div>
            <div style={{ fontSize: '11px', color: '#888' }}>{metrics.totalRuns}</div>
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
  
  useEffect(() => {
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);
  
  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px' }}>Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#ef4444' }}>
        <div style={{ fontSize: '24px' }}>Error: {error}</div>
      </div>
    );
  }
  
  const avgDuration = metrics.totalRuns > 0 
    ? metrics.totalDurationMs / metrics.totalRuns 
    : 0;
  
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>📊</span> Clawtrics
        </h1>
        <p style={{ color: '#888', margin: '8px 0 0' }}>OpenClaw Metrics Dashboard</p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px',
      }}>
        <StatCard title="Total Runs" value={metrics.totalRuns} />
        <StatCard title="Total Duration" value={formatDuration(metrics.totalDurationMs)} />
        <StatCard title="Avg Duration" value={formatDuration(avgDuration)} />
        <StatCard title="Sessions" value={metrics.totalSessions} />
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '16px',
      }}>
        <ToolChart tools={metrics.tools} />
        <DailyChart dailyMetrics={metrics.dailyMetrics} />
      </div>
      
      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        backgroundColor: '#1a1a1a', 
        borderRadius: '12px',
        border: '1px solid #333',
        fontSize: '12px',
        color: '#666',
      }}>
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}
