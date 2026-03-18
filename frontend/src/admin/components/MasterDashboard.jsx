import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';
import './MasterDashboard.css';

const MasterDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreatePrincipal, setShowCreatePrincipal] = useState(false);
  const [principal, setPrincipal] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/api/master/dashboard');
      setDashboardData(response.data);
      if (response.data.principal && response.data.principal.length > 0) {
        setPrincipal(response.data.principal[0]);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrincipal = async (formData) => {
    try {
      await apiClient.post('/api/master/create-principal', formData);
      setShowCreatePrincipal(false);
      fetchDashboardData();
      alert('Principal assigned successfully!');
    } catch (err) {
      alert('Failed to assign principal: ' + err.response?.data?.error);
    }
  };

  const handleReplacePrincipal = async () => {
    if (!window.confirm('Are you sure you want to replace the current principal? This will remove the current principal and allow you to assign a new one.')) return;

    try {
      await apiClient.delete(`/api/master/principals/${principal._id}`);
      setPrincipal(null);
      fetchDashboardData();
      setShowCreatePrincipal(true);
      alert('Current principal removed. Please assign a new principal.');
    } catch (err) {
      alert('Failed to remove principal: ' + err.response?.data?.error);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="master-dashboard">
      <div className="dashboard-header">
        <h1>Master Dashboard</h1>
        <p>Manage principals and oversee all departments</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Departments</h3>
          <p className="stat-number">{dashboardData?.stats?.totalDepartments || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Super Admins</h3>
          <p className="stat-number">{dashboardData?.stats?.totalSuperAdmins || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Current Principal</h3>
          <p className="stat-number">{dashboardData?.stats?.totalPrincipals || 0}</p>
        </div>
      </div>

      {/* Departments Overview */}
      <div className="section">
        <h2>Departments Overview</h2>
        <div className="departments-grid">
          {dashboardData?.departments?.map(dept => (
            <div key={dept._id} className="department-card">
              <h3>{dept.name}</h3>
              <p>Code: {dept.code}</p>
              <div className="superadmins-list">
                <h4>Super Admins ({dept.assignedSuperadmins?.length || 0})</h4>
                {dept.assignedSuperadmins?.length > 0 ? (
                  <ul>
                    {dept.assignedSuperadmins.map(sa => (
                      <li key={sa._id}>{sa.username} ({sa.email})</li>
                    ))}
                  </ul>
                ) : (
                  <p>No super admins assigned</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Principal Management */}
      <div className="section">
        <div className="section-header">
          <h2>Principal Management</h2>
          {!principal && (
            <button
              className="btn-primary"
              onClick={() => setShowCreatePrincipal(true)}
            >
              Assign Principal
            </button>
          )}
        </div>

        {principal ? (
          <div className="principal-card">
            <div className="principal-info">
              <h3>{principal.username}</h3>
              <p>Email: {principal.email}</p>
              <p>Role: Principal (Assigned to all departments)</p>
            </div>
            <div className="principal-actions">
              <button
                className="btn-danger"
                onClick={() => handleReplacePrincipal()}
              >
                Replace Principal
              </button>
            </div>
          </div>
        ) : (
          <p>No principal assigned yet.</p>
        )}
      </div>

      {/* Create Principal Modal */}
      {showCreatePrincipal && (
        <CreatePrincipalModal
          principal={principal}
          onSubmit={handleCreatePrincipal}
          onClose={() => setShowCreatePrincipal(false)}
        />
      )}
    </div>
  );
};

// Create Principal Modal Component
const CreatePrincipalModal = ({ principal, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{principal ? 'Replace Principal' : 'Assign Principal'}</h2>
        <p>The principal will be assigned to oversee all departments.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {principal ? 'Replace Principal' : 'Assign Principal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterDashboard;