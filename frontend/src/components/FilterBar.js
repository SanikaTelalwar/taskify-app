import React from 'react';

const filters = [
  { key: 'all',       label: 'All',       icon: '📋' },
  { key: 'active',    label: 'Active',    icon: '🔥' },
  { key: 'completed', label: 'Done',      icon: '✅' },
];

function FilterBar({ filter, setFilter, counts }) {
  return (
    <div className="filter-bar">
      {filters.map(({ key, label, icon }) => (
        <button
          key={key}
          className={`filter-btn ${filter === key ? 'active' : ''}`}
          onClick={() => setFilter(key)}
        >
          {icon} {label}
          <span className="filter-count">{counts[key]}</span>
        </button>
      ))}
    </div>
  );
}

export default FilterBar;