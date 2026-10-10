import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [status, setStatus] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [depStatus, setDepStatus] = useState('pending');
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (!res.ok) throw new Error(`Status HTTP error: ${res.status}`);
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setStatus(null);
      setError('Cannot reach backend. Is the API service running on port 5000?');
    }
  };

  const fetchDeployments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/deployments`);
      if (!res.ok) throw new Error(`Deployments HTTP error: ${res.status}`);
      const data = await res.json();
      setDeployments(data);
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = () => {
    fetchStatus();
    fetchDeployments();
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/deployments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, environment, status: depStatus })
      });
      if (!res.ok) throw new Error('Failed to create deployment log');
      setTitle('');
      await fetchDeployments();
    } catch (err) {
      alert(`Error creating item: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const statusCycle = {
      pending: 'in_progress',
      in_progress: 'healthy',
      healthy: 'failed',
      failed: 'pending'
    };
    const nextStatus = statusCycle[item.status] || 'pending';

    try {
      const res = await fetch(`${API_BASE}/api/deployments/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchDeployments();
    } catch (err) {
      alert(`Error updating item: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/deployments/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete item');
      setDeployments(deployments.filter((d) => d.id !== id));
    } catch (err) {
      alert(`Error deleting item: ${err.message}`);
    }
  };

  const getStatusBadge = (statusName) => {
    switch (statusName) {
      case 'healthy':
        return <span className="pill-badge green"><span className="pulse-dot"></span> Healthy</span>;
      case 'in_progress':
        return <span className="pill-badge cyan"><span className="pulse-dot"></span> In Progress</span>;
      case 'pending':
        return <span className="pill-badge amber">⏳ Pending</span>;
      case 'failed':
        return <span className="pill-badge red">⚠️ Failed</span>;
      default:
        return <span className="pill-badge">{statusName}</span>;
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">🛡️</div>
          <div>
            <h1 className="brand-title">PulseOps DevSecOps Platform</h1>
            <p className="brand-subtitle">Frontend ⇄ Backend Microservice ⇄ PostgreSQL ⇄ Kubernetes</p>
          </div>
        </div>

        <div className="header-badges">
          <button className="action-btn" onClick={refreshAll} title="Refresh connection">
            🔄 Refresh
          </button>
          {status ? (
            <span className="pill-badge green">
              <span className="pulse-dot"></span> API Connected
            </span>
          ) : (
            <span className="pill-badge red">
              <span className="pulse-dot"></span> API Disconnected
            </span>
          )}
          {status?.database?.healthy ? (
            <span className="pill-badge cyan">
              🐘 PostgreSQL Live
            </span>
          ) : (
            <span className="pill-badge amber">
              🐘 PostgreSQL Offline
            </span>
          )}
        </div>
      </header>

      {/* Error alert banner if backend is unreachable */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          color: '#fb7185',
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Backend Connection Notice:</strong> {error}
            <div style={{ fontSize: '0.8rem', color: '#fda4af', marginTop: '4px' }}>
              Run with Docker Compose or start backend using <code>node src/index.js</code>.
            </div>
          </div>
          <button className="action-btn" onClick={fetchStatus}>Retry</button>
        </div>
      )}

      {/* System Metrics Grid */}
      <section className="system-grid">
        <div className="metric-card">
          <div className="metric-label">Backend Instance / Pod Host</div>
          <div className="metric-value">
            <span className="metric-mono">{status?.hostname || 'Unknown / Offline'}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Release Version</div>
          <div className="metric-value">
            <span className="metric-mono">v{status?.version || '1.0.0'}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Database Status</div>
          <div className="metric-value">
            {status?.database?.healthy ? (
              <span style={{ color: '#34d399', fontSize: '1rem' }}>✓ PostgreSQL Connected</span>
            ) : (
              <span style={{ color: '#fbbf24', fontSize: '1rem' }}>Waiting for DB...</span>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Runtime Uptime</div>
          <div className="metric-value">
            <span className="metric-mono">{status?.uptime || '0s'}</span>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="content-layout">
        {/* Left Column: Form */}
        <section className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title">🚀 Dispatch Workload</h2>
            <p className="panel-desc">Record a deployment task or CI pipeline run to PostgreSQL</p>
          </div>

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Deployment / Task Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Deploy v1.2 with Trivy scan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Environment</label>
              <select
                className="form-select"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              >
                <option value="development">development (local)</option>
                <option value="staging">staging (k3d / preview)</option>
                <option value="production">production (DOKS / ArgoCD)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select
                className="form-select"
                value={depStatus}
                onChange={(e) => setDepStatus(e.target.value)}
              >
                <option value="pending">⏳ pending</option>
                <option value="in_progress">⚡ in_progress</option>
                <option value="healthy">✓ healthy</option>
                <option value="failed">⚠️ failed</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Persisting to DB...' : '+ Register Deployment'}
            </button>
          </form>
        </section>

        {/* Right Column: Deployments list */}
        <section className="glass-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="panel-title">📋 Active Service Deployments</h2>
              <p className="panel-desc">Live state retrieved directly from PostgreSQL</p>
            </div>
            <span className="pill-badge">{deployments.length} Records</span>
          </div>

          {loading ? (
            <div className="empty-state">Loading deployment logs from PostgreSQL...</div>
          ) : deployments.length === 0 ? (
            <div className="empty-state">
              No deployment records found in database. Create one using the form on the left!
            </div>
          ) : (
            <div className="deployments-list">
              {deployments.map((item) => (
                <div key={item.id} className="deployment-item">
                  <div className="item-left">
                    <div className="item-title">{item.title}</div>
                    <div className="item-meta">
                      <span className="item-meta-mono">env: {item.environment}</span>
                      <span>•</span>
                      <span className="item-meta-mono">
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'now'}
                      </span>
                    </div>
                  </div>

                  <div className="item-actions">
                    <div
                      onClick={() => handleToggleStatus(item)}
                      style={{ cursor: 'pointer' }}
                      title="Click to toggle status"
                    >
                      {getStatusBadge(item.status)}
                    </div>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(item.id)}
                      title="Delete record"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* DevSecOps Learning Roadmap Banner */}
      <footer className="devops-guide-card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f3f4f6' }}>
          🛡️ DevSecOps Pipeline Architecture (Our Roadmap)
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
          Here is how this application maps to each step in your target CI/CD and Kubernetes setup:
        </p>
        <div className="guide-step-grid">
          <div className="guide-step">
            <div className="guide-step-num">STAGE 01</div>
            <div className="guide-step-title">SAST (SonarQube)</div>
            <div className="guide-step-desc">Static analysis of code quality, code smells, security hotspots.</div>
          </div>
          <div className="guide-step">
            <div className="guide-step-num">STAGE 02</div>
            <div className="guide-step-title">Container Scan (Trivy)</div>
            <div className="guide-step-desc">Vulnerability scanning for base OS packages & CVEs in Dockerfiles.</div>
          </div>
          <div className="guide-step">
            <div className="guide-step-num">STAGE 03</div>
            <div className="guide-step-title">CI & Registry (GHCR)</div>
            <div className="guide-step-desc">Automated build on git tag / commit SHA and push to ghcr.io.</div>
          </div>
          <div className="guide-step">
            <div className="guide-step-num">STAGE 04</div>
            <div className="guide-step-title">GitOps CD (K8s / ArgoCD)</div>
            <div className="guide-step-desc">Separate git repo with K8s manifests synced continuously by ArgoCD.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
