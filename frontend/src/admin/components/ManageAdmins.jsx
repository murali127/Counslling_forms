import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import { Checkbox } from '@mui/material';

const G = {
  wrap:    { padding: '4px 0' },
  card:    { background: 'rgba(148,163,184,0.10)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, padding: '18px 20px', marginBottom: 16 },
  title:   { fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginBottom: 14, letterSpacing: '-0.01em' },
  error:   { background: 'rgba(185,28,28,0.15)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.20)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 },
  th:      { background: 'rgba(71,85,105,0.22)', color: 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.10)', textAlign: 'left' },
  td:      { borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.90)', padding: '10px 14px', fontSize: 13, verticalAlign: 'middle' },
  btnBack: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.80)', marginBottom: 4, marginRight: 8 },
  btnPrimary: { padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnDanger:  { padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(248,113,113,0.30)', background: 'rgba(185,28,28,0.20)', color: '#fca5a5', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 },
  btnNotify:  { padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(129,140,248,0.30)', background: 'rgba(129,140,248,0.20)', color: '#a5b4fc', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, marginRight: 6 },
  btnSend:    { padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.30)', background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, marginRight: 6 },
  btnNav:     { padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.70)', cursor: 'pointer', fontSize: 12.5 },
  select:  { background: 'rgba(71,85,105,0.35)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, padding: '6px 10px', color: 'rgba(255,255,255,0.90)', fontSize: 13, cursor: 'pointer', outline: 'none' },
  pageInfo:{ color: 'rgba(255,255,255,0.55)', fontSize: 13 },
};

function ManageAdmins() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadManagementUsers = useCallback(async () => {
    const res = await apiClient.get('/api/superadmin/management-users', {
      params: { t: Date.now() },
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
    const nextAdmins = Array.isArray(res.data) ? res.data : [];
    setAdmins(nextAdmins);
    setSelectedUserIds((prev) => prev.filter((id) => nextAdmins.some((a) => a._id === id)));
    setPage((prev) => {
      const maxPage = Math.max(0, Math.ceil(nextAdmins.length / rowsPerPage) - 1);
      return Math.min(prev, maxPage);
    });
  }, [rowsPerPage]);

  useEffect(() => {
    loadManagementUsers().catch(() => setError('Failed to load management users'));
    const onFocus = () => {
      loadManagementUsers().catch(() => setError('Failed to refresh management users'));
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadManagementUsers]);

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
      await loadManagementUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) { setError('Select at least one account to delete'); return; }
    if (!window.confirm(`Delete ${selectedUserIds.length} selected account(s)?`)) return;
    try {
      await apiClient.post('/api/superadmin/management-users/bulk-delete',
        { userIds: selectedUserIds },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      await loadManagementUsers();
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
    <div style={G.wrap}>
      {/* Header actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button style={G.btnPrimary} onClick={() => navigate("/superadmin/admins/create")}>
          + Create Admin
        </button>
        <button
          onClick={handleBulkDelete}
          disabled={selectedUserIds.length === 0}
          style={{ ...G.btnDanger, opacity: selectedUserIds.length === 0 ? 0.4 : 1, cursor: selectedUserIds.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          Delete Selected ({selectedUserIds.length})
        </button>
      </div>

      {error && <div style={G.error}>{error}</div>}

      <div style={G.card}>
        <div style={G.title}>Faculty & Management Accounts</div>
        {selectedCount > 0 && (
          <div style={{ marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>
            {selectedCount} account(s) selected
          </div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={G.th}>Select</th>
                <th style={G.th}>Name</th>
                <th style={G.th}>ID</th>
                <th style={G.th}>Dept</th>
                <th style={G.th}>Role</th>
                <th style={G.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAdmins.length > 0 && (
                <tr style={{ background: 'rgba(71,85,105,0.12)' }}>
                  <td style={G.td}>
                    <Checkbox
                      checked={allFilteredSelected}
                      indeterminate={someFilteredSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedUserIds((prev) => [...new Set([...prev, ...admins.map(a => a._id)])]);
                        else { const rm = new Set(admins.map(a => a._id)); setSelectedUserIds((prev) => prev.filter(id => !rm.has(id))); }
                      }}
                      sx={{ color: 'rgba(255,255,255,0.45)', '&.Mui-checked': { color: '#818cf8' }, padding: '4px' }}
                    />
                  </td>
                  <td colSpan={5} style={{ ...G.td, color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>Select all results</td>
                </tr>
              )}
              {paginatedAdmins.map(a => (
                <tr key={a._id} style={{ transition: 'background 120ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(148,163,184,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={G.td}>
                    <Checkbox
                      checked={selectedUserIds.includes(a._id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedUserIds((prev) => [...new Set([...prev, a._id])]);
                        else setSelectedUserIds((prev) => prev.filter(id => id !== a._id));
                      }}
                      sx={{ color: 'rgba(255,255,255,0.45)', '&.Mui-checked': { color: '#818cf8' }, padding: '4px' }}
                    />
                  </td>
                  <td style={G.td}>{a.username || a.employee_name || a.email}</td>
                  <td style={{ ...G.td, color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{a.employee_id || '-'}</td>
                  <td style={{ ...G.td, color: 'rgba(255,255,255,0.55)' }}>{a.department || '-'}</td>
                  <td style={G.td}>
                    <span style={{ background: 'rgba(129,140,248,0.15)', color: '#a5b4fc', borderRadius: 99, padding: '2px 10px', fontSize: 11.5, fontWeight: 600, textTransform: 'capitalize' }}>
                      {a.role}
                    </span>
                  </td>
                  <td style={G.td}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {a.role === 'admin' && !a.hasLoggedIn && (
                        <button onClick={() => handleSendAdminDetails(a._id, a.email)} style={G.btnSend}>Send Details</button>
                      )}
                      <button onClick={() => handleNotifyAdmin(a._id, a.email)} style={G.btnNotify}>Notify</button>
                      <button onClick={() => handleDeleteAdmin(a._id)} style={G.btnDanger}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedAdmins.length === 0 && (
                <tr><td colSpan={6} style={{ ...G.td, textAlign: 'center', color: 'rgba(255,255,255,0.30)', padding: '28px 0' }}>No accounts found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setPage(prev => Math.max(prev - 1, 0))} disabled={page === 0} style={{ ...G.btnNav, opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
          <span style={G.pageInfo}>Page {admins.length === 0 ? 0 : page + 1} of {Math.max(1, Math.ceil(admins.length / rowsPerPage))}</span>
          <button onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(admins.length / rowsPerPage) - 1))} disabled={page >= Math.ceil(admins.length / rowsPerPage) - 1} style={{ ...G.btnNav, opacity: page >= Math.ceil(admins.length / rowsPerPage) - 1 ? 0.4 : 1 }}>Next →</button>
          <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} style={G.select}>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default ManageAdmins;
