'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './TaskManager.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
console.log('API_URL:', API_URL);

export default function HomePage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // --- Fetch tasks ---
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);

      const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    if (!API_URL) {
      setError('API_URL is undefined! Check your .env.local file.');
      setIsLoading(false);
      return;
    }
    fetchTasks();
  }, [fetchTasks]);

  // --- Add task ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return alert('Please enter a title');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      setTitle('');
      setDescription('');
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Delete task ---
  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    const originalTasks = [...tasks];
    setTasks(tasks.filter(t => t._id !== taskId));
    try {
      const res = await fetch(`${API_URL}/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    } catch (err) {
      setError(err.message);
      setTasks(originalTasks);
    }
  };

  // --- Update task status ---
  const handleStatusChange = async (taskId, newStatus) => {
    const originalTasks = [...tasks];
    setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      const res = await fetch(`${API_URL}/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (err) {
      setError(err.message);
      setTasks(originalTasks);
    }
  };

  return (
    <>
<header className={styles.header}>Task Manager</header>

  <main className={styles.container}>
    <div className={styles.mainGrid}>

      <div className={styles.leftPane}>
        <form onSubmit={handleSubmit} className={styles.form}>

            <div className={styles.inputGroup}>
              <label htmlFor="title">Task Title</label>
                <input
                  id="title"
                  className={styles.input}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter task title"
                />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="description">Task Description</label>
                <textarea
                  id="description"
                  className={styles.textarea}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Enter task details"
                />
            </div>

    <button type="submit" className={styles.submitBtn}>+ Add Task</button>
  </form>
</div>
      <div className={styles.rightPane}>
        <div className={styles.controls}>
          <input
            className={styles.input}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search..."
          />
          <select
            className={styles.select}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In-Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {isLoading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className={styles.taskList}>
          {tasks.map(task => (
            <div key={task._id} className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <h3>{task.title}</h3>
                <span className={`${styles.status} ${styles[task.status]}`}>
                  {task.status}
                </span>
              </div>
              <p>{task.description}</p>
              <div className={styles.taskActions}>
                {task.status === "pending" && (
                  <button 
                    className={styles.startButton} 
                    onClick={() => handleStatusChange(task._id, "in-progress")}
                  >
                    Start Task
                  </button>
                )}
                {task.status === "in-progress" && (
                  <button 
                    className={styles.endButton} 
                    onClick={() => handleStatusChange(task._id, "completed")}
                  >
                    End Task
                  </button>
                )}
                <button 
                  className={styles.deleteButton} 
                  onClick={() => handleDelete(task._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </main>
    </>
  );
}