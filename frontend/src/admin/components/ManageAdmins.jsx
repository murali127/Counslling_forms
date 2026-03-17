import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import { Checkbox } from '@mui/material';

function ManageAdmins() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadManagementUsers = async () => {
    const res = await apiClient.get('/api/superadmin/management-users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
    setAdmins(res.data || []);
  };

  useEffect(() => {
    loadManagementUsers().catch((err) => {
      console.error(err);
      setError('Failed to load management users');
    });
  }, []);

  const paginatedAdmins = admins.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const selectedCount = admins.filter((a) => selectedUserIds.includes(a._id)).length;
  const allFilteredSelected = admins.length > 0 && selectedCount === admins.length;
  const someFilteredSelected = selectedCount > 0 && !allFilteredSelected;

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Delete this account? If admin, assigned students will become unassigned.')) return;
    try {
      await apiClient.delete(`/api/superadmin/management-users/${adminId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      setAdmins(prev => prev.filter(a => a._id !== adminId));
      setSelectedUserIds((prev) => prev.filter((id) => id !== adminId));
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) {
      setError('Select at least one account to delete');
      return;
    }

    if (!window.confirm(`Delete ${selectedUserIds.length} selected account(s)?`)) return;

    try {
      await apiClient.post('/api/superadmin/management-users/bulk-delete',
        { userIds: selectedUserIds },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );

      setAdmins((prev) => prev.filter((u) => !selectedUserIds.includes(u._id)));
      setSelectedUserIds([]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to bulk delete users');
    }
  };

  const handleSendAdminDetails = async (adminId, email) => {
    try {
      await apiClient.post(`/api/superadmin/management-users/${adminId}/send-details`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      alert(`Activation details sent to ${email}`);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send admin details');
    }
  };

  const handleNotifyAdmin = async (adminId, email) => {
    try {
      await apiClient.post(`/api/superadmin/admins/${adminId}/notify`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      alert(`Notification sent to admin at ${email}`);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send notification');
    }
  };

  return (
    <div>
      <button onClick={() => navigate("/superadmin/dashboard")} style={{ marginBottom: "10px" }}>Back to Dashboard</button>
      <button onClick={() => navigate("/superadmin/admins/create")} style={{ marginBottom: "10px", marginLeft: "10px" }}>Create Admin</button>
      <button
        onClick={handleBulkDelete}
        disabled={selectedUserIds.length === 0}
        style={{ marginBottom: '10px', marginLeft: '10px', color: '#fff', backgroundColor: '#b71c1c', border: '1px solid #b71c1c', padding: '6px 10px' }}
      >
        Delete Selected ({selectedUserIds.length})
      </button>
      <h2>Manage Admins</h2>
      <p style={{ color: '#b71c1c', marginTop: 0 }}>
        Multiple delete: tick checkboxes in the first column, then click Delete Selected. Selected: {selectedUserIds.length}
      </p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>Name</th>
            <th>ID</th>
            <th>Dept</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {paginatedAdmins.length > 0 && (
            <tr>
              <td>
                <Checkbox
                  checked={allFilteredSelected}
                  indeterminate={someFilteredSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const idsToAdd = admins.map((a) => a._id);
                      setSelectedUserIds((prev) => [...new Set([...prev, ...idsToAdd])]);
                    } else {
                      const idsToRemove = new Set(admins.map((a) => a._id));
                      setSelectedUserIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
                    }
                  }}
                />
              </td>
              <td colSpan={5}><b>Select all results</b></td>
            </tr>
          )}
          {paginatedAdmins.map(a => (
            <tr key={a._id}>
              <td>
                <Checkbox
                  checked={selectedUserIds.includes(a._id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedUserIds((prev) => [...new Set([...prev, a._id])]);
                    else setSelectedUserIds((prev) => prev.filter((id) => id !== a._id));
                  }}
                  sx={{ color: '#111', '&.Mui-checked': { color: '#d32f2f' } }}
                />
              </td>
              <td>{a.employee_name || a.username}</td>
              <td>{a.employee_id || '-'}</td>
              <td>{a.department || '-'}</td>
              <td style={{ textTransform: 'capitalize' }}>{a.role}</td>
              <td>
                {a.role === 'admin' && !a.hasLoggedIn && (
                  <button onClick={() => handleSendAdminDetails(a._id, a.email)} style={{ marginRight: '8px' }}>
                    Send Details
                  </button>
                )}
                <button onClick={() => handleNotifyAdmin(a._id, a.email)} style={{ marginRight: '8px', backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                  Notify
                </button>
                <button onClick={() => handleDeleteAdmin(a._id)} style={{ color: 'red' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => setPage(prev => Math.max(prev - 1, 0))} disabled={page === 0}>Prev</button>
        <span>Page {admins.length === 0 ? 0 : page + 1} of {Math.max(1, Math.ceil(admins.length / rowsPerPage))}</span>
        <button onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(admins.length / rowsPerPage) - 1))} disabled={page >= Math.ceil(admins.length / rowsPerPage) - 1}>Next</button>
        <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}>
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>
    </div>
  );
}

export default ManageAdmins;
