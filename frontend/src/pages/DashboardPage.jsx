import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import Navbar from '../components/Navbar';
import { fetchStats } from '../api';
import { useAuth } from '../context/AuthContext';

const CAT_COLORS = {
  personal: '#a78bfa', work: '#60a5fa',
  study: '#34d399', health: '#f472b6', other: '#fbbf24'
};

const TOOLTIP_STYLE = {
  background: 'rgba(15,12,41,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#e5e7eb',
  fontSize: '13px'
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardPage() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const { user }  = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    fetchStats()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-loading">
        <div className="big-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    </div>
  );

  const progress = stats.total
    ? Math.round((stats.completed / stats.total) * 100) : 0;

  const pieData = stats.byCategory
    .filter(c => c.total > 0)
    .map(c => ({ name: c.name, value: c.total, color: CAT_COLORS[c.name] }));

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">

        {/* ── Welcome Header ── */}
        <div className="dash-header">
          <div>
            <h2 className="dash-greeting">
              {greeting()}, {user?.name?.split(' ')[0]} ◎
            </h2>
            <p className="dash-sub">Here's your productivity snapshot</p>
          </div>
          <div className="dash-header-actions">
            <button className="btn-primary" onClick={() => navigate('/tasks')}>
              ▤ Manage Tasks
            </button>
            <button className="btn-secondary" onClick={() => navigate('/focus')}>
              ◎ Start Focus
            </button>
          </div>
        </div>

        {/* ── Streak Banner ── */}
        {stats.streak > 0 && (
          <div className="streak-banner">
            <span className="streak-fire">▲</span>
            <span>
              <strong>{stats.streak}-day streak!</strong> Keep it up — you're on a roll!
            </span>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="stat-grid">
          {[
            { label: 'Total Tasks',   value: stats.total,              color: '#a78bfa', icon: '◈', sub: 'all time'         },
            { label: 'Completed',     value: stats.completed,          color: '#34d399', icon: '◉', sub: `${progress}% rate` },
            { label: 'In Progress',   value: stats.active,             color: '#60a5fa', icon: '▦', sub: 'remaining'         },
            { label: 'Overdue',       value: stats.overdue,            color: '#f87171', icon: '⚑', sub: 'need attention'    },
            { label: 'Focus Time',    value: `${stats.totalFocusMinutes}m`, color: '#fbbf24', icon: '◎', sub: 'total focused' },
            { label: 'Sessions',      value: stats.totalSessions,      color: '#f472b6', icon: '▤', sub: 'pomodoros done'    },
          ].map(({ label, value, color, icon, sub }) => (
            <div className="stat-card" key={label}>
              <div className="sc-top">
                <span className="sc-icon" style={{ color }}>{icon}</span>
                <span className="sc-value" style={{ color }}>{value}</span>
              </div>
              <div className="sc-label">{label}</div>
              <div className="sc-sub">{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Progress Bar ── */}
        <div className="progress-card">
          <div className="prog-header">
            <span className="prog-title">▦ Overall Completion Rate</span>
            <span className="prog-pct" style={{ color: '#a78bfa' }}>{progress}%</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="prog-footer">
            <span style={{ color:'#34d399' }}>◉ {stats.completed} done</span>
            <span style={{ color:'#60a5fa' }}>▦ {stats.active} left</span>
            <span style={{ color:'#f87171' }}>⚑ {stats.overdue} overdue</span>
          </div>
        </div>

        {/* ── Charts Row 1 ── */}
        <div className="charts-row">

          {/* Area Chart — 7 day activity */}
          <div className="chart-card wide">
            <h3 className="chart-title">▤ 7-Day Activity</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.daily} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="day" stroke="#4b5563" tick={{ fill:'#6b7280', fontSize:12 }}/>
                <YAxis stroke="#4b5563" tick={{ fill:'#6b7280', fontSize:12 }} allowDecimals={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE}/>
                <Area type="monotone" dataKey="created"   stroke="#a78bfa" fill="url(#gc)" strokeWidth={2} name="Created"/>
                <Area type="monotone" dataKey="completed" stroke="#34d399" fill="url(#gd)" strokeWidth={2} name="Completed"/>
              </AreaChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              <span style={{ color:'#a78bfa' }}>◈ Created</span>
              <span style={{ color:'#34d399' }}>◉ Completed</span>
            </div>
          </div>

          {/* Pie Chart — Category */}
          <div className="chart-card">
            <h3 className="chart-title">◈ By Category</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%"
                      innerRadius={45} outerRadius={75}
                      paddingAngle={4} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {pieData.map(({ name, value, color }) => (
                    <div className="pie-legend-row" key={name}>
                      <span className="pie-dot" style={{ background: color }}/>
                      <span className="pie-name">{name}</span>
                      <span className="pie-val">{value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="chart-empty">No data yet. Add tasks!</div>
            )}
          </div>
        </div>

        {/* ── Charts Row 2 ── */}
        <div className="charts-row">

          {/* Bar Chart — Priority */}
          <div className="chart-card">
            <h3 className="chart-title">◎ Priority Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.byPriority} margin={{ top:5, right:10, left:-20, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="name" stroke="#4b5563" tick={{ fill:'#6b7280', fontSize:12 }}/>
                <YAxis stroke="#4b5563" tick={{ fill:'#6b7280', fontSize:12 }} allowDecimals={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE}/>
                <Legend wrapperStyle={{ fontSize:'12px', color:'#6b7280' }}/>
                <Bar dataKey="total" name="Total" fill="#6366f1" radius={[6,6,0,0]}/>
                <Bar dataKey="done"  name="Done"  fill="#34d399" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Focus Summary */}
          <div className="chart-card">
            <h3 className="chart-title">▲ Focus Summary</h3>
            <div className="focus-summary">
              <div className="fs-item">
                <span className="fs-icon" style={{ color:'#fbbf24' }}>◎</span>
                <div>
                  <div className="fs-val">{stats.totalFocusMinutes} min</div>
                  <div className="fs-label">Total Focus Time</div>
                </div>
              </div>
              <div className="fs-item">
                <span className="fs-icon" style={{ color:'#f472b6' }}>▤</span>
                <div>
                  <div className="fs-val">{stats.todayFocusMinutes} min</div>
                  <div className="fs-label">Today's Focus</div>
                </div>
              </div>
              <div className="fs-item">
                <span className="fs-icon" style={{ color:'#60a5fa' }}>◈</span>
                <div>
                  <div className="fs-val">{stats.totalSessions}</div>
                  <div className="fs-label">Total Sessions</div>
                </div>
              </div>
              <div className="fs-item">
                <span className="fs-icon" style={{ color:'#34d399' }}>▦</span>
                <div>
                  <div className="fs-val">{stats.streak} days</div>
                  <div className="fs-label">Current Streak</div>
                </div>
              </div>
            </div>
            <button className="go-focus-btn" onClick={() => navigate('/focus')}>
              ◎ Start a Focus Session →
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}