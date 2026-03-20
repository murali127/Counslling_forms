import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

function StudentsList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [rollSearch, setRollSearch] = useState('');
  const [regYearFilter, setRegYearFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [singleForm, setSingleForm] = useState({
    username: '',
    email: '',
    yearOfStudy: '1'
  });
  const [bulkForm, setBulkForm] = useState({
    startRollNumber: '',
    endRollNumber: '',
    emailDomain: 'gvpce.ac.in',
    yearOfStudy: '1'
  });
  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadStudents = async () => {
    const response = await apiClient.get('/api/superadmin/students', {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
    setStudents(response.data || []);
  };

  useEffect(() => {
    loadStudents().catch((err) => {
      console.error(err);
      setError('Failed to load students');
    });
  }, []);

  const getRegistrationYear = (email) => {
    if (!email) return null;
    const prefix = email.split('@')[0] || '';
    if (/^\d{3,}/.test(prefix)) {
      const yearDigits = prefix.slice(1, 3);
      return `20${yearDigits}`;
    }
    return null;
  };

  const availableYears = Array.from(
    new Set(students.map((s) => getRegistrationYear(s.email)).filter(Boolean))
  ).sort();

  const filteredStudents = students.filter((s) => {
    const q = rollSearch.trim().toLowerCase();
    const matchesSearch = !q || s.username?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (!regYearFilter) return true;
    const studentYear = getRegistrationYear(s.email);
    return studentYear === regYearFilter;
  });

  const paginatedStudents = filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  useEffect(() => {
    setPage(0);
  }, [rollSearch, regYearFilter]);

  const handleCreateSingle = async () => {
    setSubmittingSingle(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        username: String(singleForm.username || '').trim(),
        email: String(singleForm.email || '').trim() || undefined,
        yearOfStudy: Number(singleForm.yearOfStudy || 1)
      };

      await apiClient.post('/api/admin/users', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      setMessage('Student created successfully.');
      setSingleForm({ username: '', email: '', yearOfStudy: '1' });
      await loadStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create student');
    } finally {
      setSubmittingSingle(false);
    }
  };

  const handleCreateBulk = async () => {
    setSubmittingBulk(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        startRollNumber: String(bulkForm.startRollNumber || '').trim(),
        endRollNumber: String(bulkForm.endRollNumber || '').trim(),
        emailDomain: String(bulkForm.emailDomain || '').trim() || 'gvpce.ac.in',
        yearOfStudy: Number(bulkForm.yearOfStudy || 1)
      };

      const response = await apiClient.post('/api/admin/users/smart-create', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      setMessage(response.data?.message || 'Bulk student creation completed.');
      setBulkForm({ startRollNumber: '', endRollNumber: '', emailDomain: 'gvpce.ac.in', yearOfStudy: '1' });
      await loadStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create student batch');
    } finally {
      setSubmittingBulk(false);
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      <button onClick={() => navigate('/superadmin-panel')} style={{ marginBottom: '10px' }}>Back to Super Admin Panel</button>
      <h2>Manage Students</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
        <h3 style={{ marginTop: 0 }}>Create Single Student</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Roll Number (12 digits)"
            value={singleForm.username}
            onChange={(e) => setSingleForm((prev) => ({ ...prev, username: e.target.value }))}
            style={{ padding: '6px', width: '220px' }}
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={singleForm.email}
            onChange={(e) => setSingleForm((prev) => ({ ...prev, email: e.target.value }))}
            style={{ padding: '6px', width: '260px' }}
          />
          <select
            value={singleForm.yearOfStudy}
            onChange={(e) => setSingleForm((prev) => ({ ...prev, yearOfStudy: e.target.value }))}
            style={{ padding: '6px', width: '140px' }}
          >
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
          <button onClick={handleCreateSingle} disabled={submittingSingle}>
            {submittingSingle ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
        <h3 style={{ marginTop: 0 }}>Create Student Batch (Bulk)</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Start Roll (e.g. 322103311001)"
            value={bulkForm.startRollNumber}
            onChange={(e) => setBulkForm((prev) => ({ ...prev, startRollNumber: e.target.value }))}
            style={{ padding: '6px', width: '220px' }}
          />
          <input
            type="text"
            placeholder="End Roll (e.g. 322103311060)"
            value={bulkForm.endRollNumber}
            onChange={(e) => setBulkForm((prev) => ({ ...prev, endRollNumber: e.target.value }))}
            style={{ padding: '6px', width: '220px' }}
          />
          <input
            type="text"
            placeholder="Email Domain"
            value={bulkForm.emailDomain}
            onChange={(e) => setBulkForm((prev) => ({ ...prev, emailDomain: e.target.value }))}
            style={{ padding: '6px', width: '180px' }}
          />
          <select
            value={bulkForm.yearOfStudy}
            onChange={(e) => setBulkForm((prev) => ({ ...prev, yearOfStudy: e.target.value }))}
            style={{ padding: '6px', width: '140px' }}
          >
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
          <button onClick={handleCreateBulk} disabled={submittingBulk}>
            {submittingBulk ? 'Creating...' : 'Create Batch'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Search by roll number/email"
          value={rollSearch}
          onChange={(e) => setRollSearch(e.target.value)}
          style={{ padding: '6px', width: '260px' }}
        />
        <select
          value={regYearFilter}
          onChange={(e) => setRegYearFilter(e.target.value)}
          style={{ padding: '6px', width: '200px' }}
        >
          <option value="">All registration years</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Email</th>
            <th>Year</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedStudents.map((student) => (
            <tr key={student._id}>
              <td>{student.username || 'N/A'}</td>
              <td>{student.email || 'N/A'}</td>
              <td>{student.yearOfStudy || '-'}</td>
              <td>
                <Link to={`/superadmin/students/${student._id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => setPage((prev) => Math.max(prev - 1, 0))} disabled={page === 0}>Prev</button>
        <span>Page {filteredStudents.length === 0 ? 0 : page + 1} of {Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage))}</span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(filteredStudents.length / rowsPerPage) - 1))}
          disabled={page >= Math.ceil(filteredStudents.length / rowsPerPage) - 1}
        >
          Next
        </button>
        <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}>
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>
    </div>
  );
}

export default StudentsList;
