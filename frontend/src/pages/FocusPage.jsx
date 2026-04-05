import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { fetchTasks, saveFocusSession, fetchFocusHistory } from '../api';

const MODES = {
  work:       { label:'Focus',       duration:25, color:'#a78bfa' },
  short_break:{ label:'Short Break', duration:5,  color:'#34d399' },
  long_break: { label:'Long Break',  duration:15, color:'#60a5fa' },
};

export default function FocusPage() {
  const [mode, setMode]           = useState('work');
  const [timeLeft, setTimeLeft]   = useState(25 * 60);
  const [running, setRunning]     = useState(false);
  const [sessions, setSessions]   = useState(0);       // Completed pomodoros this sitting
  const [history, setHistory]     = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [customMins, setCustomMins] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const intervalRef = useRef(null);
  const startedAt   = useRef(null);

  useEffect(() => {
    fetchTasks().then(r => setTasks(r.data.filter(t => !t.completed)));
    fetchFocusHistory().then(r => setHistory(r.data));
  }, []);

  // When mode or custom time changes, reset timer
  useEffect(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    const mins = showCustom && customMins
      ? parseInt(customMins)
      : MODES[mode].duration;
    setTimeLeft((isNaN(mins) ? MODES[mode].duration : mins) * 60);
  }, [mode, customMins, showCustom]);

  useEffect(() => {
    if (running) {
      startedAt.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSessionComplete = async () => {
    setRunning(false);
    const mins = showCustom && customMins
      ? parseInt(customMins) : MODES[mode].duration;

    if (mode === 'work') {
      setSessions(s => s + 1);
      const task = tasks.find(t => t._id === selectedTask);
      try {
        const saved = await saveFocusSession({
          taskId:          selectedTask || null,
          taskTitle:       task?.title || 'General Focus',
          durationMinutes: mins,
          type:            'work'
        });
        setHistory(h => [saved.data, ...h].slice(0, 10));
      } catch (e) { console.error(e); }
    }

    // Auto-suggest break
    if (mode === 'work') {
      setTimeout(() => {
        const suggestion = sessions > 0 && (sessions + 1) % 4 === 0
          ? 'Take a long break! You earned it. ▲'
          : 'Nice work! Take a short break. ◎';
        alert(suggestion);
      }, 300);
    }
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    const mins = showCustom && customMins
      ? parseInt(customMins) : MODES[mode].duration;
    setTimeLeft((isNaN(mins) ? MODES[mode].duration : mins) * 60);
  };

  const totalMins  = (showCustom && parseInt(customMins)) || MODES[mode].duration;
  const pct        = Math.round(((totalMins * 60 - timeLeft) / (totalMins * 60)) * 100);
  const mm         = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss         = String(timeLeft % 60).padStart(2, '0');
  const activeColor = MODES[mode].color;

  const totalFocusToday = history
    .filter(h => h.type === 'work' && new Date(h.completedAt).toDateString() === new Date().toDateString())
    .reduce((s, h) => s + h.durationMinutes, 0);

  return (
    <div className="page-wrapper">
      <Navbar/>
      <main className="main-content">

        <div className="focus-page">

          {/* ── Left — Timer ── */}
          <div className="focus-left">
            <h2 className="page-title">◎ Focus Mode</h2>
            <p className="page-sub">Deep work · Pomodoro technique</p>

            {/* Mode Tabs */}
            <div className="focus-mode-tabs">
              {Object.entries(MODES).map(([key, val]) => (
                <button key={key}
                  className={`focus-mode-tab ${mode===key?'active':''}`}
                  style={mode===key ? { borderColor: val.color, color: val.color } : {}}
                  onClick={() => { setMode(key); setShowCustom(false); }}>
                  {val.label}
                </button>
              ))}
              <button
                className={`focus-mode-tab ${showCustom?'active':''}`}
                style={showCustom ? { borderColor:'#fbbf24', color:'#fbbf24' } : {}}
                onClick={() => setShowCustom(!showCustom)}>
                Custom
              </button>
            </div>

            {showCustom && (
              <div className="custom-time-row">
                <input
                  type="number" min="1" max="120"
                  className="custom-time-input"
                  placeholder="Minutes (1–120)"
                  value={customMins}
                  onChange={e => setCustomMins(e.target.value)}
                />
                <span style={{ color:'#6b7280', fontSize:'0.85rem' }}>minutes</span>
              </div>
            )}

            {/* Timer Ring */}
            <div className="timer-ring-wrap">
              <svg className="timer-svg" viewBox="0 0 200 200">
                {/* Background circle */}
                <circle cx="100" cy="100" r="88"
                  fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
                {/* Progress arc */}
                <circle cx="100" cy="100" r="88"
                  fill="none" stroke={activeColor} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - pct / 100)}`}
                  transform="rotate(-90 100 100)"
                  style={{ transition:'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="timer-center">
                <div className="timer-display" style={{ color: activeColor }}>
                  {mm}:{ss}
                </div>
                <div className="timer-mode-label">{MODES[mode]?.label}</div>
                <div className="timer-pct">{pct}%</div>
              </div>
            </div>

            {/* Controls */}
            <div className="timer-controls">
              <button className="timer-btn reset" onClick={reset}>↺ Reset</button>
              <button
                className={`timer-btn main ${running ? 'pause' : 'play'}`}
                style={{ background: activeColor }}
                onClick={() => setRunning(r => !r)}>
                {running ? '⏸ Pause' : '▶ Start'}
              </button>
              <button className="timer-btn skip" onClick={handleSessionComplete}>Skip ▷</button>
            </div>

            {/* Task Selector */}
            <div className="task-selector">
              <label>Focusing on:</label>
              <select value={selectedTask}
                onChange={e => setSelectedTask(e.target.value)}>
                <option value="">— General Focus —</option>
                {tasks.map(t => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))}
              </select>
            </div>

            {/* Session dots */}
            <div className="session-dots">
              <span className="sd-label">Sessions today:</span>
              <div className="sd-dots">
                {Array.from({ length: Math.max(4, sessions) }, (_, i) => (
                  <span key={i} className={`sd-dot ${i < sessions ? 'done' : ''}`}
                    style={i < sessions ? { background: activeColor } : {}} />
                ))}
              </div>
              <span className="sd-count">{sessions} done</span>
            </div>

          </div>

          {/* ── Right — Stats + History ── */}
          <div className="focus-right">

            {/* Today Stats */}
            <div className="focus-stats-card">
              <h3 className="fsc-title">▦ Today's Focus</h3>
              <div className="fsc-grid">
                <div className="fsc-item">
                  <span className="fsc-val" style={{ color:'#fbbf24' }}>{totalFocusToday}</span>
                  <span className="fsc-label">Minutes</span>
                </div>
                <div className="fsc-item">
                  <span className="fsc-val" style={{ color:'#a78bfa' }}>{sessions}</span>
                  <span className="fsc-label">Sessions</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="focus-tips-card">
              <h3 className="fsc-title">◈ Pomodoro Tips</h3>
              <ul className="tips-list">
                {[
                  'Work 25 mins, then take a 5 min break',
                  'After 4 sessions, take a 15 min break',
                  'Remove all distractions before starting',
                  'One task per session for best results',
                  'Keep water nearby and stay hydrated',
                ].map((tip, i) => (
                  <li key={i} className="tip-item">
                    <span className="tip-icon">◎</span> {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Session History */}
            <div className="focus-history-card">
              <h3 className="fsc-title">▤ Recent Sessions</h3>
              {history.length === 0 ? (
                <p className="history-empty">No sessions yet. Start focusing!</p>
              ) : (
                <ul className="history-list">
                  {history.map((h, i) => (
                    <li key={i} className="history-item">
                      <span className={`h-dot ${h.type}`}/>
                      <div className="h-info">
                        <span className="h-title">{h.taskTitle}</span>
                        <span className="h-time">
                          {new Date(h.completedAt).toLocaleTimeString('en-US',{
                            hour:'2-digit', minute:'2-digit'
                          })}
                        </span>
                      </div>
                      <span className="h-dur" style={{ color: h.type==='work' ? '#a78bfa' : '#34d399' }}>
                        {h.durationMinutes}m
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}