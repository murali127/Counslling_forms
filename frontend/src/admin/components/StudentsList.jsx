import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

const G = {
  wrap:    { padding: '4px 0' },
  card:    { background: 'rgba(148,163,184,0.10)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, padding: '18px 20px', marginBottom: 16 },
  title:   { fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginBottom: 14, letterSpacing: '-0.01em' },
  label:   { fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:   { background: 'rgba(71,85,105,0.30)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '8px 12px', color: 'rgba(255,255,255,0.92)', fontSize: 13, outline: 'none', width: '100%', fontFamily: 'inherit' },
  select:  { background: 'rgba(71,85,105,0.35)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '8px 12px', color: 'rgba(255,255,255,0.92)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', colorScheme: 'dark' },
  error:   { background: 'rgba(185,28,28,0.15)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.20)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 },
  success: { background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.20)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 },
  th:      { background: 'rgba(71,85,105,0.22)', color: 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.10)', textAlign: 'left' },
  td:      { borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.90)', padding: '10px 14px', fontSize: 13, verticalAlign: 'middle' },
  btnPrimary: { padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnNav:     { padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.70)', cursor: 'pointer', fontSize: 12.5 },
  pageInfo:   { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  link:       { color: '#818cf8', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
};

function StudentsList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [rollSearch, setRollSearch] = useState('');
  const [regYearFilter, setRegYearFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [singleForm, setSingleForm] = useState({ username: '', email: '', yearOfStudy: '1' });
  const [bulkForm, setBulkForm] = useState({ startRollNumber: '', endRollNumber: '', emailDomain: 'gvpce.ac.in', yearOfStudy: '1' });
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
    loadStudents().catch(() => setError('Failed to load students'));
  }, []);

  const getRegistrationYear = (email) => {
    if (!email) return null;
    const prefix = email.split('@')[0] || '';
    if (/^\d{3,}/.test(prefix)) { const yearDigits = prefix.slice(1, 3); return `20${yearDigits}`; }
    return null;
  };

  const availableYears = Array.from(new Set(students.map((s) => getRegistrationYear(s.email)).filter(Boolean))).sort();

  const filteredStudents = students.filter((s) => {
    const q = rollSearch.trim().toLowerCase();
    const matchesSearch = !q || s.username?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (!regYearFilter) return true;
    return getRegistrationYear(s.email) === regYearFilter;
  });

  const paginatedStudents = filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  useEffect(() => { setPage(0); }, [rollSearch, regYearFilter]);

  const handleCreateSingle = async () => {
    setSubmittingSingle(true); setMessage(''); setError('');
    try {
      await apiClient.post('/api/admin/users', {
        username: String(singleForm.username || '').trim(),
        email: String(singleForm.email || '').trim() || undefined,
        yearOfStudy: Number(singleForm.yearOfStudy || 1)
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
      setMessage('Student created successfully.');
      setSingleForm({ username: '', email: '', yearOfStudy: '1' });
      await loadStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create student');
    } finally { setSubmittingSingle(false); }
  };

  const handleCreateBulk = async () => {
    setSubmittingBulk(true); setMessage(''); setError('');
    try {
      const response = await apiClient.post('/api/admin/users/smart-create', {
        startRollNumber: String(bulkForm.startRollNumber || '').trim(),
        endRollNumber: String(bulkForm.endRollNumber || '').trim(),
        emailDomain: String(bulkForm.emailDomain || '').trim() || 'gvpce.ac.in',
        yearOfStudy: Number(bulkForm.yearOfStudy || 1)
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
      setMessage(response.data?.message || 'Bulk student creation completed.');
      setBulkForm({ startRollNumber: '', endRollNumber: '', emailDomain: 'gvpce.ac.in', yearOfStudy: '1' });
      await loadStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create student batch');
    } finally { setSubmittingBulk(false); }
  };

  const yearOptions = [
    <option key="1" value="1">Year 1</option>,
    <option key="2" value="2">Year 2</option>,
    <option key="3" value="3">Year 3</option>,
    <option key="4" value="4">Year 4</option>,
  ];

  return (
    <div style={G.wrap}>
      {error   && <div style={G.error}>{error}</div>}
      {message && <div style={G.success}>{message}</div>}

      {/* Create Single Student */}
      <div style={G.card}>
        <div style={G.title}>Create Single Student</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <div>
            <div style={G.label}>Roll Number</div>
            <input type="text" placeholder="12-digit roll" value={singleForm.username} onChange={(e) => setSingleForm(p => ({ ...p, username: e.target.value }))} style={G.input} />
          </div>
          <div>
            <div style={G.label}>Email (optional)</div>
            <input type="email" placeholder="student@gvpce.ac.in" value={singleForm.email} onChange={(e) => setSingleForm(p => ({ ...p, email: e.target.value }))} style={G.input} />
          </div>
          <div>
            <div style={G.label}>Year of Study</div>
            <select value={singleForm.yearOfStudy} onChange={(e) => setSingleForm(p => ({ ...p, yearOfStudy: e.target.value }))} style={{ ...G.select, width: '100%' }}>
              {yearOptions}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={handleCreateSingle} disabled={submittingSingle} style={{ ...G.btnPrimary, width: '100%', opacity: submittingSingle ? 0.6 : 1 }}>
              {submittingSingle ? 'Creating…' : 'Create Student'}
            </button>
          </div>
        </div>
      </div>

      {/* Create Bulk */}
      <div style={G.card}>
        <div style={G.title}>Create Student Batch (Bulk)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <div>
            <div style={G.label}>Start Roll</div>
            <input type="text" placeholder="e.g. 322103311001" value={bulkForm.startRollNumber} onChange={(e) => setBulkForm(p => ({ ...p, startRollNumber: e.target.value }))} style={G.input} />
          </div>
          <div>
            <div style={G.label}>End Roll</div>
            <input type="text" placeholder="e.g. 322103311060" value={bulkForm.endRollNumber} onChange={(e) => setBulkForm(p => ({ ...p, endRollNumber: e.target.value }))} style={G.input} />
          </div>
          <div>
            <div style={G.label}>Email Domain</div>
            <input type="text" placeholder="gvpce.ac.in" value={bulkForm.emailDomain} onChange={(e) => setBulkForm(p => ({ ...p, emailDomain: e.target.value }))} style={G.input} />
          </div>
          <div>
            <div style={G.label}>Year of Study</div>
            <select value={bulkForm.yearOfStudy} onChange={(e) => setBulkForm(p => ({ ...p, yearOfStudy: e.target.value }))} style={{ ...G.select, width: '100%' }}>
              {yearOptions}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={handleCreateBulk} disabled={submittingBulk} style={{ ...G.btnPrimary, width: '100%', opacity: submittingBulk ? 0.6 : 1 }}>
              {submittingBulk ? 'Creating…' : 'Create Batch'}
            </button>
          </div>
        </div>
      </div>

      {/* Search & Table */}
      <div style={G.card}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search by roll number or email…"
            value={rollSearch}
            onChange={(e) => setRollSearch(e.target.value)}
            style={{ ...G.input, maxWidth: 280 }}
          />
          <select value={regYearFilter} onChange={(e) => setRegYearFilter(e.target.value)} style={G.select}>
            <option value="">All registration years</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={G.th}>Roll Number</th>
                <th style={G.th}>Email</th>
                <th style={G.th}>Year</th>
                <th style={G.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => (
                <tr key={student._id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(148,163,184,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={G.td}>{student.username || 'N/A'}</td>
                  <td style={{ ...G.td, color: 'rgba(255,255,255,0.60)' }}>{student.email || 'N/A'}</td>
                  <td style={G.td}>
                    <span style={{ background: 'rgba(96,165,250,0.15)', color: '#93c5fd', borderRadius: 99, padding: '2px 10px', fontSize: 11.5, fontWeight: 600 }}>
                      Year {student.yearOfStudy || '-'}
                    </span>
                  </td>
                  <td style={G.td}>
                    <Link to={`/superadmin/students/${student._id}`} style={G.link}>View →</Link>
                  </td>
                </tr>
              ))}
              {paginatedStudents.length === 0 && (
                <tr><td colSpan={4} style={{ ...G.td, textAlign: 'center', color: 'rgba(255,255,255,0.30)', padding: '28px 0' }}>No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0} style={{ ...G.btnNav, opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
          <span style={G.pageInfo}>Page {filteredStudents.length === 0 ? 0 : page + 1} of {Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage))}</span>
          <button onClick={() => setPage(p => Math.min(p + 1, Math.ceil(filteredStudents.length / rowsPerPage) - 1))} disabled={page >= Math.ceil(filteredStudents.length / rowsPerPage) - 1} style={{ ...G.btnNav, opacity: page >= Math.ceil(filteredStudents.length / rowsPerPage) - 1 ? 0.4 : 1 }}>Next →</button>
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

export default StudentsList;
