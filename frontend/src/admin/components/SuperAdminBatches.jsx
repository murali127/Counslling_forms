import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, GraduationCap, FileText } from 'lucide-react';
import apiClient from '../../apiClient';

function SuperAdminBatches() {
  const navigate = useNavigate();
  const [students, setStudents]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [selectedBatchYear, setSelectedBatchYear] = useState('');

  const role = localStorage.getItem('userRole') || localStorage.getItem('role') || '';
  const roleHomePath = { admin: '/admin-panel', superadmin: '/superadmin-panel', principal: '/principal-panel', master: '/master-panel' }[role] || '/dashboard';
  const roleLabel    = { admin: 'Faculty', superadmin: 'HOD', principal: 'Principal', master: 'Master' }[role] || 'Dashboard';

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/api/admin/all-batches-students', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        setStudents(res.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load student batches');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const batches = useMemo(() => {
    const grouped = {};
    students.forEach((s) => {
      const roll = String(s.username || s.email?.split('@')[0] || '').trim();
      const yy   = roll.length >= 3 ? roll.slice(1, 3) : null;
      const year = /^\d{2}$/.test(yy || '') ? `20${yy}` : 'Unknown';
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(s);
    });
    return Object.entries(grouped).sort(([a],[b]) => a > b ? -1 : 1).map(([year, list]) => ({ year, list }));
  }, [students]);

  useEffect(() => {
    if (!selectedBatchYear && batches.length > 0) setSelectedBatchYear(batches[0].year);
  }, [batches, selectedBatchYear]);

  const selectedBatch = useMemo(() => batches.find(b => b.year === selectedBatchYear) || null, [batches, selectedBatchYear]);

  return (
    <div style={pageStyle}>
      {/* Blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,26,1)' }} />
        <div style={{ position: 'absolute', top: '-20%', left: '-15%', width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(148,163,184,0.70) 0%, rgba(148,163,184,0.25) 45%, transparent 70%)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(71,85,105,0.70) 0%, rgba(71,85,105,0.22) 45%, transparent 70%)',   filter: 'blur(130px)' }} />
        <div style={{ position: 'absolute', top: '-5%', right: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(226,232,240,0.70) 0%, rgba(226,232,240,0.18) 45%, transparent 70%)',   filter: 'blur(110px)' }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px', position: 'relative', zIndex: 1 }}>

        {/* Back button + title */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate(roleHomePath)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 20, transition: 'all 150ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
          >
            <ArrowLeft size={14} /> Back to {roleLabel} Panel
          </button>

          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>All Batches</h1>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.38)' }}>
            {role === 'admin' ? 'Showing students assigned to you.' : 'Showing all students visible for your role.'}
          </p>
        </motion.div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Loading batches…</div>
        )}
        {error && (
          <div style={{ ...glassCard, padding: '14px 18px', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}

        {!loading && !error && batches.length === 0 && (
          <div style={{ ...glassCard, padding: '36px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>No batch data found.</div>
        )}

        {!loading && !error && batches.length > 0 && (
          <>
            {/* Batch selector cards */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}
            >
              {batches.map(({ year, list }) => {
                const active = year === selectedBatchYear;
                return (
                  <button
                    key={year}
                    onClick={() => setSelectedBatchYear(year)}
                    style={{
                      textAlign: 'left', padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
                      background: active ? 'rgba(55,48,163,0.28)' : 'rgba(255,255,255,0.06)',
                      backdropFilter: 'blur(20px)',
                      border: active ? '1px solid rgba(109,40,217,0.6)' : '1px solid rgba(255,255,255,0.09)',
                      boxShadow: active ? '0 0 28px rgba(55,48,163,0.35), 0 0 0 1px rgba(109,40,217,0.3)' : 'none',
                      transition: 'all 160ms ease',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <GraduationCap size={16} color={active ? '#a78bfa' : 'rgba(255,255,255,0.4)'} />
                      <span style={{ fontSize: 15, fontWeight: 800, color: active ? '#c4b5fd' : 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>Batch {year}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Users size={11} /> {list.length} students
                    </div>
                  </button>
                );
              })}
            </motion.div>

            {/* Selected batch table */}
            {selectedBatch && (
              <motion.div
                key={selectedBatch.year}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ ...glassCard }}
              >
                <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Batch {selectedBatch.year}</h2>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: '3px 0 0' }}>{selectedBatch.list.length} students</p>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                    <thead>
                      <tr>
                        {['Roll Number', 'Name', 'Email', 'Department', 'Year of Study', 'Form'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.07em', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBatch.list.map((student) => {
                        const regdNo = student.profile?.regdNo || student.username;
                        const yearLabel = student.relieved || Number(student.yearOfStudy) === 5 ? 'Relieved' : student.yearOfStudy ? `Year ${student.yearOfStudy}` : '—';
                        return (
                          <tr
                            key={student._id}
                            style={{ transition: 'background 120ms' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={td}>{student.username}</td>
                            <td style={td}>{student.profile?.name || '—'}</td>
                            <td style={{ ...td, color: 'rgba(255,255,255,0.45)' }}>{student.email}</td>
                            <td style={td}>{student.profile?.department || '—'}</td>
                            <td style={td}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: student.relieved ? 'rgba(248,113,113,0.15)' : 'rgba(99,102,241,0.15)', color: student.relieved ? '#fca5a5' : '#a5b4fc', border: `1px solid ${student.relieved ? 'rgba(248,113,113,0.25)' : 'rgba(99,102,241,0.25)'}` }}>
                                {yearLabel}
                              </span>
                            </td>
                            <td style={td}>
                              <button
                                onClick={() => navigate(`/counseling-form-download/${regdNo}`)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.07)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', transition: 'all 140ms ease' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#c7d2fe'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                              >
                                <FileText size={11} /> Open
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  background: 'rgba(10,15,26,1)',
  minHeight: 'calc(100vh - 64px)',
  position: 'relative',
  overflow: 'hidden',
};

const glassCard = {
  background:           'rgba(148,163,184,0.10)',
  backdropFilter:       'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border:               '1px solid rgba(255,255,255,0.18)',
  borderRadius:         18,
  overflow:             'hidden',
};

const td = {
  padding:    '11px 16px',
  fontSize:   13,
  color:      'rgba(255,255,255,0.72)',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

export default SuperAdminBatches;
