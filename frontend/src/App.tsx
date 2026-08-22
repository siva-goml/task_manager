import { useState, useEffect } from "react";
import { 
  auth, 
  tasks, 
} from "./api";
import type { Task } from "./api";
import {
  Sun,
  Moon,
  Plus,
  Trash2,
  Edit2,
  Check,
  LogOut,
  User as UserIcon,
  ListTodo,
  AlertCircle,
  X
} from "lucide-react";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light";
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);

  // Task list states
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  // Sync theme to root element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Attempt silent refresh on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await auth.refresh();
        if (data.accessToken) {
          setIsLoggedIn(true);
          // Extract username from decoded token if possible, or set general user.
          // Since our endpoint returns { accessToken }, let's try getting tasks to verify it works.
          const fetchedTasks = await tasks.getAll();
          setTaskList(fetchedTasks);
        }
      } catch (err) {
        // Silently fail if not logged in
      } finally {
        setInitialChecking(false);
      }
    };
    checkAuth();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!authUsername || !authPassword) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      if (authTab === "login") {
        await auth.login(authUsername, authPassword);
        setIsLoggedIn(true);
        setUsername(authUsername);
        setAuthUsername("");
        setAuthPassword("");
        // Load tasks
        const fetchedTasks = await tasks.getAll();
        setTaskList(fetchedTasks);
      } else {
        await auth.register(authUsername, authPassword);
        setSuccess("Registration successful! You can now log in.");
        setAuthTab("login");
        setAuthPassword("");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (err) {
      // Ignore logout errors and reset state anyway
    } finally {
      setIsLoggedIn(false);
      setUsername("");
      setTaskList([]);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const created = await tasks.create(newTaskTitle.trim());
      setTaskList(prev => [created, ...prev]);
      setNewTaskTitle("");
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    }
  };

  const handleToggleTask = async (id: string, currentDone: boolean) => {
    try {
      const updated = await tasks.update(id, { done: !currentDone });
      setTaskList(prev => prev.map(t => t._id === id ? updated : t));
    } catch (err: any) {
      setError(err.message || "Failed to update task");
    }
  };

  const handleStartEdit = (id: string, currentTitle: string) => {
    setEditingTaskId(id);
    setEditingTaskTitle(currentTitle);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingTaskTitle.trim()) return;
    try {
      const updated = await tasks.update(id, { title: editingTaskTitle.trim() });
      setTaskList(prev => prev.map(t => t._id === id ? updated : t));
      setEditingTaskId(null);
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await tasks.delete(id);
      setTaskList(prev => prev.filter(t => t._id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete task");
    }
  };

  const filteredTasks = taskList.filter(task => {
    if (filter === "active") return !task.done;
    if (filter === "completed") return task.done;
    return true;
  });

  if (initialChecking) {
    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
        <svg className="spinner" viewBox="0 0 50 50" style={{ color: 'var(--primary)', width: '40px', height: '40px' }}>
          <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
        </svg>
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Loading task manager...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      {/* Floating Theme Controller */}
      {!isLoggedIn && (
        <div className="header-actions">
          <button onClick={toggleTheme} className="btn btn-icon-only" aria-label="Toggle theme">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      )}

      {isLoggedIn ? (
        // Task List Dashboard View
        <div>
          <div className="dashboard-header">
            <div>
              <h1>Task Flow</h1>
              <div className="user-badge">
                <UserIcon size={14} />
                <span>{username || "User"}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={toggleTheme} className="btn btn-icon-only" aria-label="Toggle theme">
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button onClick={handleLogout} className="btn btn-danger" style={{ width: 'auto', padding: '8px 16px' }} title="Log out">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span style={{ flex: 1 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Task Create Input */}
          <form onSubmit={handleAddTask} className="task-form">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              className="input-field"
              required
            />
            <button type="submit" className="btn btn-primary">
              <Plus size={20} />
              <span>Add</span>
            </button>
          </form>

          {/* Filtering tabs */}
          <div className="task-filters">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({taskList.length})
            </button>
            <button
              className={`filter-btn ${filter === "active" ? "active" : ""}`}
              onClick={() => setFilter("active")}
            >
              Active ({taskList.filter(t => !t.done).length})
            </button>
            <button
              className={`filter-btn ${filter === "completed" ? "active" : ""}`}
              onClick={() => setFilter("completed")}
            >
              Completed ({taskList.filter(t => t.done).length})
            </button>
          </div>

          {/* Task rows */}
          <div className="task-list">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <ListTodo size={48} />
                <p>No tasks found. Get started by adding a task!</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task._id} className={`task-item ${task.done ? "done" : ""}`}>
                  <div className="task-item-content">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => handleToggleTask(task._id, task.done)}
                      />
                      <span className="custom-checkbox">
                        {task.done && <Check size={14} strokeWidth={3} />}
                      </span>
                    </label>

                    {editingTaskId === task._id ? (
                      <input
                        type="text"
                        value={editingTaskTitle}
                        onChange={e => setEditingTaskTitle(e.target.value)}
                        onBlur={() => handleSaveEdit(task._id)}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleSaveEdit(task._id);
                          if (e.key === "Escape") setEditingTaskId(null);
                        }}
                        className="edit-input"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="task-title"
                        onDoubleClick={() => handleStartEdit(task._id, task.title)}
                      >
                        {task.title}
                      </span>
                    )}
                  </div>

                  <div className="task-actions">
                    {editingTaskId !== task._id && (
                      <button
                        onClick={() => handleStartEdit(task._id, task.title)}
                        className="btn btn-icon-only"
                        style={{ width: '32px', height: '32px' }}
                        title="Edit task"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="btn btn-icon-only"
                      style={{ width: '32px', height: '32px', color: 'var(--danger)' }}
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        // Authentication Login / Registration view
        <div>
          <h1 style={{ textAlign: "center", marginBottom: '6px' }}>Task Flow</h1>
          <p className="subtitle" style={{ textAlign: "center" }}>Keep your workflow smooth and organized</p>

          <div className="auth-tabs">
            <div
              className={`auth-tab ${authTab === "login" ? "active" : ""}`}
              onClick={() => { setAuthTab("login"); setError(null); }}
            >
              Log In
            </div>
            <div
              className={`auth-tab ${authTab === "register" ? "active" : ""}`}
              onClick={() => { setAuthTab("register"); setError(null); }}
            >
              Register
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <Check size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="input-field"
                value={authUsername}
                onChange={e => setAuthUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input-field"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }} disabled={loading}>
              {loading ? (
                <svg className="spinner" viewBox="0 0 50 50" style={{ width: '18px', height: '18px' }}>
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
              ) : authTab === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
