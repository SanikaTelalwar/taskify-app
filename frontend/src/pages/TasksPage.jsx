import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { fetchTasks, createTask, updateTask, deleteTaskAPI, fetchSuggestions } from '../api';

const PRI_COLOR = { high:'#f87171', medium:'#fbbf24', low:'#34d399' };
const CAT_ICON  = { personal:'◎', work:'▦', study:'◈', health:'⬢', other:'◉' };
const CAT_COLOR = { personal:'#a78bfa', work:'#60a5fa', study:'#34d399', health:'#f472b6', other:'#fbbf24' };

export default function TasksPage() {
  const [tasks, setTasks]           = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [showAI, setShowAI]         = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [editText, setEditText]     = useState('');
  const [filter, setFilter]         = useState('all');
  const [category, setCategory]     = useState('all');
  const [sortBy, setSortBy]         = useState('newest');
  const [search, setSearch]         = useState('');
  const [error, setError]           = useState('');

  const [form, setForm] = useState({
    title:'', priority:'medium', category:'personal', dueDate:''
  });

  useEffect(() => {
    Promise.all([fetchTasks(), fetchSuggestions()])
      .then(([tasksRes, sugRes]) => {
        setTasks(tasksRes.data);
        setSuggestions(sugRes.data.suggestions || []);
      })
      .catch(() => setError('Could not load data.'))
      .finally(() => setLoading(false));
  }, []);

  /* ── CRUD ── */
  const addTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const res = await createTask({
        title: form.title.trim(),
        priority: form.priority,
        category: form.category,
        dueDate: form.dueDate || null
      });
      setTasks(p => [res.data, ...p]);
      setForm({ title:'', priority:'medium', category:'personal', dueDate:'' });
      setShowForm(false);
    } catch { setError('Failed to add task.'); }
  };

  const addFromSuggestion = async (s) => {
    try {
      const res = await createTask({
        title: s.title, priority: s.priority,
        category: s.category, isAISuggested: true
      });
      setTasks(p => [res.data, ...p]);
      setSuggestions(prev => prev.filter(x => x.title !== s.title));
    } catch { setError('Failed to add suggestion.'); }
  };

  const toggleTask = async (id, completed) => {
    const res = await updateTask(id, { completed: !completed });
    setTasks(p => p.map(t => t._id === id ? res.data : t));
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    const res = await updateTask(id, { title: editText.trim() });
    setTasks(p => p.map(t => t._id === id ? res.data : t));
    setEditingId(null);
  };

  const deleteTask = async (id) => {
    await deleteTaskAPI(id);
    setTasks(p => p.filter(t => t._id !== id));
  };

  const clearCompleted = async () => {
    const done = tasks.filter(t => t.completed);
    for (const t of done) await deleteTaskAPI(t._id);
    setTasks(p => p.filter(t => !t.completed));
  };

  /* ── Filtering + Sorting ── */
  const visible = useMemo(() => {
    let r = [...tasks];
    if (filter === 'active')    r = r.filter(t => !t.completed);
    if (filter === 'completed') r = r.filter(t =>  t.completed);
    if (category !== 'all')     r = r.filter(t => t.category === category);
    if (search.trim())          r = r.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    const order = { high:0, medium:1, low:2 };
    if (sortBy === 'newest')   r.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
    if (sortBy === 'oldest')   r.sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt));
    if (sortBy === 'alpha')    r.sort((a,b) => a.title.localeCompare(b.title));
    if (sortBy === 'priority') r.sort((a,b) => (order[a.priority]??1)-(order[b.priority]??1));
    return r;
  }, [tasks, filter, category, search, sortBy]);

  const counts = {
    all: tasks.length,
    active: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length
  };
  const progress = tasks.length ? Math.round((counts.completed/tasks.length)*100) : 0;

  if (loading) return (
    <div className="page-wrapper">
      <Navbar/>
      <div className="page-loading"><div className="big-spinner"/><p>Loading tasks...</p></div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar/>
      <main className="main-content">

        {/* ── Header ── */}
        <div className="tasks-header">
          <div>
            <h2 className="page-title">▤ My Tasks</h2>
            <p className="page-sub">{counts.active} active · {counts.completed} done</p>
          </div>
          <div className="tasks-header-btns">
            <button
              className={`btn-ai ${showAI ? 'active' : ''}`}
              onClick={() => setShowAI(!showAI)}
            >
              ◈ AI Suggest {suggestions.length > 0 && <span className="ai-badge">{suggestions.length}</span>}
            </button>
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cancel' : '＋ New Task'}
            </button>
          </div>
        </div>

        {/* ── Progress ── */}
        {tasks.length > 0 && (
          <div className="mini-progress">
            <div className="mini-prog-bar">
              <div className="mini-prog-fill" style={{ width:`${progress}%` }}/>
            </div>
            <span className="mini-prog-label">{progress}% complete</span>
          </div>
        )}

        {error && <div className="error-toast">⚠ {error}</div>}

        {/* ── AI Suggestions Panel ── */}
        {showAI && (
          <div className="ai-panel">
            <div className="ai-panel-header">
              <span>◈ AI Smart Suggestions</span>
              <span className="ai-panel-sub">Based on your task patterns</span>
            </div>
            <div className="ai-suggestions-grid">
              {suggestions.length === 0 ? (
                <p className="ai-empty">Add more tasks to get personalised suggestions!</p>
              ) : suggestions.map((s, i) => (
                <div className="ai-suggestion-card" key={i}>
                  <div className="ai-s-title">{s.title}</div>
                  <div className="ai-s-meta">
                    <span style={{ color: CAT_COLOR[s.category] }}>
                      {CAT_ICON[s.category]} {s.category}
                    </span>
                    <span style={{ color: PRI_COLOR[s.priority] }}>{s.priority}</span>
                  </div>
                  <div className="ai-s-reason">◎ {s.reason}</div>
                  <button className="ai-add-btn" onClick={() => addFromSuggestion(s)}>
                    ＋ Add Task
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Add Task Form ── */}
        {showForm && (
          <form className="task-form-card" onSubmit={addTask}>
            <h3 className="form-card-title">◈ New Task</h3>
            <input
              className="tf-title-input"
              type="text"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
            <div className="tf-options-row">
              <div className="tf-option">
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="high">⬢ High</option>
                  <option value="medium">◎ Medium</option>
                  <option value="low">◉ Low</option>
                </select>
              </div>
              <div className="tf-option">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="personal">◎ Personal</option>
                  <option value="work">▦ Work</option>
                  <option value="study">◈ Study</option>
                  <option value="health">⬢ Health</option>
                  <option value="other">◉ Other</option>
                </select>
              </div>
              <div className="tf-option">
                <label>Due Date</label>
                <input type="date" value={form.dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}/>
              </div>
            </div>
            <div className="tf-actions">
              <button type="submit" className="btn-primary">＋ Add Task</button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        {/* ── Filters ── */}
        <div className="filters-row">
          <div className="filter-tabs">
            {['all','active','completed'].map(f => (
              <button key={f}
                className={`filter-tab ${filter===f?'active':''}`}
                onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
                <span className="ftab-count">{counts[f]??tasks.length}</span>
              </button>
            ))}
          </div>

          <div className="filter-controls">
            <input className="search-input" type="text"
              placeholder="⌕ Search tasks..."
              value={search} onChange={e => setSearch(e.target.value)}/>

            <select className="sort-select" value={sortBy}
              onChange={e => setSortBy(e.target.value)}>
              <option value="newest">↓ Newest</option>
              <option value="oldest">↑ Oldest</option>
              <option value="alpha">A→Z</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        {/* Category quick filter */}
        <div className="cat-filter-row">
          {['all','personal','work','study','health','other'].map(c => (
            <button key={c}
              className={`cat-chip ${category===c?'active':''}`}
              style={category===c && c!=='all' ? { borderColor: CAT_COLOR[c], color: CAT_COLOR[c] } : {}}
              onClick={() => setCategory(c)}>
              {c === 'all' ? '◈ All' : `${CAT_ICON[c]} ${c}`}
            </button>
          ))}
          {counts.completed > 0 && (
            <button className="clear-done-btn" onClick={clearCompleted}>
              ✕ Clear done ({counts.completed})
            </button>
          )}
        </div>

        {/* ── Task List ── */}
        {visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◈</div>
            <h3>No tasks found</h3>
            <p>Try a different filter or add a new task above</p>
          </div>
        ) : (
          <ul className="task-list">
            {visible.map(task => {
              const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <li key={task._id}
                  className={`task-item ${task.completed ? 'done' : ''} ${isOverdue ? 'overdue' : ''}`}
                  style={{ borderLeftColor: PRI_COLOR[task.priority] }}>

                  {/* Checkbox */}
                  <button
                    className={`check-btn ${task.completed ? 'checked' : ''}`}
                    onClick={() => toggleTask(task._id, task.completed)}
                  >
                    {task.completed ? '◉' : '○'}
                  </button>

                  {/* Task Body */}
                  <div className="task-body">
                    {/* Badges */}
                    <div className="task-badges">
                      <span className="badge-pri" style={{ color: PRI_COLOR[task.priority], background: PRI_COLOR[task.priority]+'18' }}>
                        {task.priority}
                      </span>
                      <span className="badge-cat" style={{ color: CAT_COLOR[task.category], background: CAT_COLOR[task.category]+'18' }}>
                        {CAT_ICON[task.category]} {task.category}
                      </span>
                      {task.isAISuggested && (
                        <span className="badge-ai">◈ AI</span>
                      )}
                      {isOverdue && (
                        <span className="badge-overdue">⚑ Overdue</span>
                      )}
                      {task.dueDate && !isOverdue && (
                        <span className="badge-due">
                          ◷ {new Date(task.dueDate).toLocaleDateString('en-US',{ month:'short', day:'numeric' })}
                        </span>
                      )}
                      {task.focusMinutes > 0 && (
                        <span className="badge-focus">◎ {task.focusMinutes}m</span>
                      )}
                    </div>

                    {/* Title or Edit Input */}
                    {editingId === task._id ? (
                      <input
                        className="edit-inline-input"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(task._id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="task-title">{task.title}</div>
                    )}

                    <div className="task-time">
                      ◷ {new Date(task.createdAt).toLocaleDateString('en-US',{
                        month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="task-actions">
                    {editingId === task._id ? (
                      <>
                        <button className="act-btn save" onClick={() => saveEdit(task._id)}>✓</button>
                        <button className="act-btn cancel" onClick={() => setEditingId(null)}>✕</button>
                      </>
                    ) : (
                      <>
                        <button className="act-btn edit"
                          disabled={task.completed}
                          onClick={() => { setEditingId(task._id); setEditText(task.title); }}>
                          ✎
                        </button>
                        <button className="act-btn delete" onClick={() => deleteTask(task._id)}>
                          ⌫
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}