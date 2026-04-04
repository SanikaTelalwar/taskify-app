import React, { useState } from 'react';

function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.title);

  const handleEdit = () => {
    if (editText.trim() === '') return;
    onEdit(task._id, editText.trim());
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleEdit();
    if (e.key === 'Escape') {
      setEditText(task.title);
      setIsEditing(false);
    }
  };

  // Format date nicely
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <li className={`task-item ${task.completed ? 'completed' : ''}`}>

      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.completed}
        onChange={() => onToggle(task._id, task.completed)}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <input
            type="text"
            className="edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <>
            <div className="task-title">{task.title}</div>
            <div style={{
              fontSize: '0.72rem',
              color: '#4b5563',
              marginTop: '3px'
            }}>
              🕐 {formatDate(task.createdAt)}
            </div>
          </>
        )}
      </div>

      <div className="task-actions">
        {isEditing ? (
          <>
            <button className="save-btn" onClick={handleEdit}>✓ Save</button>
            <button className="cancel-btn" onClick={() => {
              setEditText(task.title);
              setIsEditing(false);
            }}>✕</button>
          </>
        ) : (
          <>
            <button
              className="edit-btn"
              onClick={() => setIsEditing(true)}
              disabled={task.completed}
              title="Edit task"
            >✏️ Edit</button>
            <button
              className="delete-btn"
              onClick={() => onDelete(task._id)}
              title="Delete task"
            >🗑️ Del</button>
          </>
        )}
      </div>

    </li>
  );
}

export default TaskItem;