import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../apiClient';

const ODD_MONTHS  = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const EVEN_MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
const SEMESTERS   = [1, 2, 3, 4, 5, 6, 7, 8];

const monthsForSemester = (sem) => (Number(sem) % 2 === 1 ? ODD_MONTHS : EVEN_MONTHS);

const getSemEntry = (attendance, semNumber) =>
  (attendance || []).find((e) => String(e.semester) === String(semNumber));

const getMonthPct = (semEntry, month) => {
  if (!semEntry?.months) return '';
  const v = semEntry.months[month];
  return (v?.percentage === undefined || v?.percentage === null) ? '' : v.percentage;
};

const semAverage = (semEntry) => {
  if (!semEntry?.months) return '';
  const vals = Object.values(semEntry.months)
    .map((v) => Number(v?.percentage))
    .filter((v) => !Number.isNaN(v));
  if (!vals.length) return '';
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
};

const buildDraft = (attendance = []) => {
  const d = {};
  for (const sem of SEMESTERS) {
    d[String(sem)] = {};
    for (const m of monthsForSemester(sem))
      d[String(sem)][m] = getMonthPct(getSemEntry(attendance, sem), m);
  }
  return d;
};

/* ─── Styles ─────────────────────────────────── */
const G = {
  wrap:   { padding: '32px 28px', maxWidth: 1100, margin: '0 auto' },
  card:   { background: 'rgba(148,163,184,0.10)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '20px 22px', marginBottom: 18 },
  h1:     { fontSize: 26, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 6, letterSpacing: '-0.02em' },
  h2:     { fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 14, letterSpacing: '-0.01em' },
  sub:    { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },
  th:     { background: 'rgba(71,85,105,0.30)', color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' },
  td:     { borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)', padding: '10px 14px', fontSize: 13 },
  tdSem:  { borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.92)', padding: '10px 14px', fontSize: 13, fontWeight: 700, minWidth: 110 },
  tdAvg:  { borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', fontSize: 13, fontWeight: 700 },
  input:  { width: 72, background: 'rgba(71,85,105,0.30)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '6px 8px', color: 'rgba(255,255,255,0.92)', fontSize: 13, outline: 'none', textAlign: 'center', fontFamily: 'inherit' },
  btnPrimary: { padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'opacity 0.15s' },
  btnOutline: { padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnSave:    { padding: '5px 12px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  btnEdit:    { padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.40)', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  select: { background: 'rgba(71,85,105,0.30)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px', color: 'rgba(255,255,255,0.92)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', maxWidth: 420 },
  alert:  (type) => ({ padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, background: type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.30)' : 'rgba(16,185,129,0.30)'}`, color: type === 'error' ? '#fca5a5' : '#6ee7b7' }),
};

const avgColor = (avg) => {
  if (avg === '') return 'rgba(255,255,255,0.40)';
  const n = Number(avg);
  if (n >= 75) return '#4ade80';
  if (n >= 60) return '#facc15';
  return '#f87171';
};

/* ─── Component ──────────────────────────────── */
const Attendance = () => {
  const navigate = useNavigate();
  const { email: emailParam } = useParams();

  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const [role,           setRole]           = useState('user');
  const [selfId,         setSelfId]         = useState(''); // kept for potential future use
  const [students,       setStudents]       = useState([]);
  const [selectedEmail,  setSelectedEmail]  = useState(emailParam || '');
  const [selectedStudent,setSelectedStudent]= useState(null);
  const [profile,        setProfile]        = useState(null);
  const [attendanceDraft,setAttendanceDraft]= useState({});
  const [editMode,       setEditMode]       = useState(false);

  const isManager = ['admin', 'superadmin', 'principal', 'master'].includes(role);
  const canEdit   = isManager || role === 'user';

  const fetchProfileForStudent = async (student) => {
    const token = localStorage.getItem('authToken');
    const res = await apiClient.get(`/api/profile/${student.username}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const p = res.data?.profile || null;
    setProfile(p);
    setAttendanceDraft(buildDraft(p?.attendance || []));
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) { navigate('/signup'); return; }

        const userRes = await apiClient.get('/api/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currentRole = userRes.data?.role || 'user';
        setRole(currentRole);
        setSelfId(userRes.data?._id || '');

        if (['admin', 'superadmin', 'principal', 'master'].includes(currentRole)) {
          const studentsRes = await apiClient.get('/api/admin/users?role=user', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const list = studentsRes.data || [];
          setStudents(list);
          let target = emailParam
            ? list.find((s) => s.email.toLowerCase() === emailParam.toLowerCase())
            : list[0] || null;
          if (!target && list.length) target = list[0];
          setSelectedEmail(target?.email || '');
          setSelectedStudent(target);
          if (target) await fetchProfileForStudent(target);
        } else {
          const selfProfile = await apiClient.get('/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const p = selfProfile.data?.profile || null;
          setProfile(p);
          setAttendanceDraft(buildDraft(p?.attendance || []));
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailParam]);

  const handleStudentChange = async (email) => {
    setSelectedEmail(email);
    setError(''); setSuccess('');
    const next = students.find((s) => s.email === email) || null;
    setSelectedStudent(next);
    if (next) {
      try { await fetchProfileForStudent(next); }
      catch (err) { setProfile(null); setError('Failed to load student profile'); }
    } else setProfile(null);
  };

  const handleDraftChange = (sem, month, value) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [String(sem)]: { ...(prev[String(sem)] || {}), [month]: value },
    }));
  };

  const handleSaveSemester = async (sem) => {
    try {
      setSaving(true); setError(''); setSuccess('');
      const token   = localStorage.getItem('authToken');
      const semKey  = String(sem);
      const updates = monthsForSemester(sem)
        .map((m) => ({ month: m, raw: attendanceDraft?.[semKey]?.[m] }))
        .filter((x) => x.raw !== '' && x.raw !== null && x.raw !== undefined);

      if (!updates.length) { setError('Enter at least one value before saving.'); return; }

      for (const item of updates) {
        const value = Number(item.raw);
        if (Number.isNaN(value) || value < 0 || value > 100) {
          setError(`${item.month}: value must be 0–100`); return;
        }
        if (isManager) {
          await apiClient.patch('/api/profile/attendance', {
            userId: selectedStudent._id, semester: semKey, month: item.month, percentage: value,
          }, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          await apiClient.patch('/api/profile/attendance/self', {
            semester: semKey, month: item.month, percentage: value,
          }, { headers: { Authorization: `Bearer ${token}` } });
        }
      }

      if (isManager) await fetchProfileForStudent(selectedStudent);
      else {
        const refreshed = await apiClient.get('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
        const p = refreshed.data?.profile || null;
        setProfile(p);
        setAttendanceDraft(buildDraft(p?.attendance || []));
      }
      setSuccess(`Semester ${sem} saved successfully`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const semesterRows = useMemo(() => {
    const att = profile?.attendance || [];
    return SEMESTERS.map((sem) => {
      const entry  = getSemEntry(att, sem);
      const months = monthsForSemester(sem);
      return { sem, months, values: months.map((m) => getMonthPct(entry, m)), avg: semAverage(entry) };
    });
  }, [profile]);

  const oddRows  = semesterRows.filter((r) => r.sem % 2 === 1);
  const evenRows = semesterRows.filter((r) => r.sem % 2 === 0);

  /* ── Render ── */
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#818cf8', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const renderTable = (rows, months, groupLabel) => (
    <div style={{ marginBottom: 28 }}>
      <div style={G.sub}>{groupLabel}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={G.th}>Semester</th>
              {months.map((m) => <th key={m} style={G.th}>{m}</th>)}
              {editMode && canEdit && <th style={G.th}>Save</th>}
              <th style={G.th}>Average</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sem}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(148,163,184,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={G.tdSem}>Semester {row.sem}</td>
                {row.months.map((m, idx) => (
                  <td key={m} style={G.td}>
                    {editMode && canEdit ? (
                      <input
                        type="number"
                        min={0} max={100}
                        value={attendanceDraft?.[String(row.sem)]?.[m] ?? ''}
                        onChange={(e) => handleDraftChange(row.sem, m, e.target.value)}
                        placeholder="—"
                        style={G.input}
                      />
                    ) : (
                      row.values[idx] === '' ? (
                        <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                      ) : (
                        <span style={{ color: avgColor(row.values[idx]) }}>{row.values[idx]}%</span>
                      )
                    )}
                  </td>
                ))}
                {editMode && canEdit && (
                  <td style={G.td}>
                    <button
                      onClick={() => handleSaveSemester(row.sem)}
                      disabled={saving}
                      style={{ ...G.btnSave, opacity: saving ? 0.6 : 1 }}
                    >
                      Save
                    </button>
                  </td>
                )}
                <td style={{ ...G.tdAvg, color: avgColor(row.avg) }}>
                  {row.avg === '' ? <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span> : `${row.avg}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={G.wrap}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={G.h1}>Attendance Record</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <button onClick={() => navigate(isManager ? '/admin/data' : '/dashboard')} style={G.btnOutline}>
            ← Back to Dashboard
          </button>
          {canEdit && (
            <button
              onClick={() => { setEditMode((p) => !p); setError(''); setSuccess(''); }}
              style={editMode
                ? { ...G.btnPrimary }
                : { ...G.btnEdit }
              }
            >
              {editMode ? '✓ Done Editing' : '✎ Edit Attendance'}
            </button>
          )}
        </div>
      </div>

      {error   && <div style={G.alert('error')}>{error}</div>}
      {success && <div style={G.alert('success')}>{success}</div>}

      {/* Manager student selector */}
      {isManager && (
        <div style={{ ...G.card, marginBottom: 18 }}>
          <div style={G.h2}>Select Student</div>
          <select value={selectedEmail} onChange={(e) => handleStudentChange(e.target.value)} style={G.select}>
            {students.map((s) => (
              <option key={s._id} value={s.email}>{s.username} — {s.email}</option>
            ))}
          </select>
        </div>
      )}

      {/* Attendance table */}
      {!profile ? (
        <div style={{ ...G.card, textAlign: 'center', color: 'rgba(255,255,255,0.30)', padding: '36px 20px' }}>
          No attendance data found yet.{canEdit && !editMode && ' Click "Edit Attendance" to add your records.'}
        </div>
      ) : (
        <div style={G.card}>
          <div style={G.h2}>Semester-wise Attendance View</div>
          {renderTable(oddRows,  ODD_MONTHS,  'Odd Semesters (Jun to Nov)')}
          {renderTable(evenRows, EVEN_MONTHS, 'Even Semesters (Dec to May)')}
        </div>
      )}

      {/* If no profile yet but in edit mode, still show the edit table */}
      {!profile && editMode && canEdit && (
        <div style={G.card}>
          <div style={G.h2}>Add Attendance</div>
          {renderTable(
            SEMESTERS.filter(s => s % 2 === 1).map(sem => ({ sem, months: ODD_MONTHS, values: ODD_MONTHS.map(() => ''), avg: '' })),
            ODD_MONTHS, 'Odd Semesters (Jun to Nov)'
          )}
          {renderTable(
            SEMESTERS.filter(s => s % 2 === 0).map(sem => ({ sem, months: EVEN_MONTHS, values: EVEN_MONTHS.map(() => ''), avg: '' })),
            EVEN_MONTHS, 'Even Semesters (Dec to May)'
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Attendance;
