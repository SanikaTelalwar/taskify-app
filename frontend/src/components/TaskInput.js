import React, { useState } from 'react';

function TaskInput({ onAdd }) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() === '') return;
    onAdd(title.trim());
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="task-input-wrapper">
        <span style={{ fontSize: '1.2rem' }}>✏️</span>
        <input
          type="text"
          className="task-input"
          placeholder="What do you need to do today?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="add-btn">
          + Add Task
        </button>
      </div>
    </form>
  );
}

export default TaskInput;