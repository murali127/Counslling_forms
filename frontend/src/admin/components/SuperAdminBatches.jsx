import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

function SuperAdminBatches() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBatchYear, setSelectedBatchYear] = useState('');

  const role = localStorage.getItem('userRole') || localStorage.getItem('role') || '';
  const roleHomePath = {
    admin: '/admin-panel',
    superadmin: '/superadmin-panel',
    principal: '/principal-panel',
    master: '/master-panel'
  }[role] || '/dashboard';

  const roleTitle = {
    admin: 'Admin',
    superadmin: 'Super Admin',
    principal: 'Principal',
    master: 'Master'
  }[role] || 'User';

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get('/api/admin/all-batches-students', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        setStudents(response.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load student batches');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const batches = useMemo(() => {
    const grouped = {};

    students.forEach((student) => {
      const rollNumber = String(student.username || student.email?.split('@')[0] || '').trim();
      const yearDigits = rollNumber.length >= 3 ? rollNumber.slice(1, 3) : null;
      const registrationYear = /^\d{2}$/.test(yearDigits || '') ? `20${yearDigits}` : 'Unknown';

      if (!grouped[registrationYear]) grouped[registrationYear] = [];
      grouped[registrationYear].push(student);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .map(([year, list]) => ({ year, list }));
  }, [students]);

  useEffect(() => {
    if (!selectedBatchYear && batches.length > 0) {
      setSelectedBatchYear(batches[0].year);
    }
  }, [batches, selectedBatchYear]);

  const selectedBatch = useMemo(() => {
    return batches.find((batch) => batch.year === selectedBatchYear) || null;
  }, [batches, selectedBatchYear]);

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => navigate(roleHomePath)} style={{ marginBottom: '10px' }}>
        Back to {roleTitle} Dashboard
      </button>
      <h2>All Batches ({roleTitle} View)</h2>
      <p style={{ marginTop: '-6px', color: '#555' }}>
        {role === 'admin'
          ? 'Showing only students assigned to you.'
          : 'Showing students visible for your role permissions.'}
      </p>

      {loading && <p>Loading batches...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && batches.length === 0 && <p>No batch data found.</p>}

      {!loading && !error && batches.length > 0 && (
        <>
          <h3 style={{ marginTop: '20px' }}>Previous Batches</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {batches.map((batch) => {
              const isActive = batch.year === selectedBatchYear;
              return (
                <button
                  key={batch.year}
                  onClick={() => setSelectedBatchYear(batch.year)}
                  style={{
                    textAlign: 'left',
                    padding: '14px',
                    borderRadius: '8px',
                    border: isActive ? '2px solid #1976d2' : '1px solid #ccc',
                    background: isActive ? '#e3f2fd' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Batch {batch.year}</div>
                  <div style={{ marginTop: '4px', color: '#444' }}>{batch.list.length} students</div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>Click to open</div>
                </button>
              );
            })}
          </div>

          {selectedBatch && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Batch {selectedBatch.year} ({selectedBatch.list.length} students)</h3>
              <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Year Of Study</th>
                    <th>Counseling Form</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBatch.list.map((student) => {
                    const regdNo = student.profile?.regdNo || student.username;
                    return (
                      <tr key={student._id}>
                        <td>{student.username}</td>
                        <td>{student.profile?.name || '-'}</td>
                        <td>{student.email}</td>
                        <td>{student.profile?.department || '-'}</td>
                        <td>{student.yearOfStudy || '-'}</td>
                        <td>
                          <button onClick={() => navigate(`/counseling-form-download/${regdNo}`)}>
                            Open Form
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SuperAdminBatches;
