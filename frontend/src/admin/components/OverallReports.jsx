import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";

const G = {
  wrap:    { padding: '4px 0' },
  card:    { background: 'rgba(148,163,184,0.10)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, padding: '18px 20px', marginBottom: 16 },
  title:   { fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginBottom: 14, letterSpacing: '-0.01em' },
  label:   { fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:   { background: 'rgba(71,85,105,0.30)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '8px 12px', color: 'rgba(255,255,255,0.92)', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  th:      { background: 'rgba(71,85,105,0.22)', color: 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.10)', textAlign: 'left' },
  td:      { borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.90)', padding: '10px 14px', fontSize: 13, verticalAlign: 'top' },
  btnPrimary: { padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnSecondary: { padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.30)', background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btnNav:   { padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.70)', cursor: 'pointer', fontSize: 12.5 },
  btnOutline: { padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  select:   { background: 'rgba(71,85,105,0.35)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '8px 12px', color: 'rgba(255,255,255,0.92)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', colorScheme: 'dark' },
  pageInfo: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  subLabel: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  subItem:  { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginLeft: 10, lineHeight: 1.8 },
};

function OverallReports() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [registrationYear, setRegistrationYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [fetching, setFetching] = useState(false);

  const fetchRecords = () => {
    setFetching(true);
    let url = `/api/superadmin/reports?registrationYear=${encodeURIComponent(registrationYear)}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate)   url += `&endDate=${endDate}`;
    apiClient.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } })
      .then(res => { setStudents(res.data); setPage(0); })
      .catch(err => console.error(err))
      .finally(() => setFetching(false));
  };

  const paginatedStudents = students.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const exportCSV = () => {
    if (students.length === 0) return;
    const headers = ["Registration Number", "Email", "Semester", "Subject", "Mid1", "Mid2", "External"];
    const rows = [];
    students.forEach(s => {
      s.semesters.forEach(sem => {
        sem.subjects.forEach(sub => {
          rows.push([
            `"${(s.registrationNumber || "").replace(/"/g, '""')}"`,
            `"${(s.email || "").replace(/"/g, '""')}"`,
            sem.semester,
            `"${(sub.subject || "").replace(/"/g, '""')}"`,
            sub.mid1, sub.mid2,
            `"${sub.ext || ""}"`
          ]);
        });
      });
    });
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `marks_reports_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={G.wrap}>
      {/* Filters */}
      <div style={G.card}>
        <div style={G.title}>Overall Marks Reports</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div style={G.label}>Registration Year</div>
            <input placeholder="e.g. 2022" value={registrationYear} onChange={e => setRegistrationYear(e.target.value)} style={{ ...G.input, width: 180 }} />
          </div>
          <div>
            <div style={G.label}>Start Date</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...G.input, colorScheme: 'dark' }} />
          </div>
          <div>
            <div style={G.label}>End Date</div>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...G.input, colorScheme: 'dark' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={fetchRecords} disabled={fetching} style={{ ...G.btnPrimary, opacity: fetching ? 0.6 : 1 }}>
            {fetching ? 'Fetching…' : 'Fetch Records'}
          </button>
          <button onClick={exportCSV} disabled={students.length === 0} style={{ ...G.btnSecondary, opacity: students.length === 0 ? 0.4 : 1 }}>
            Export CSV
          </button>
          <button onClick={() => navigate('/attendance')} style={G.btnOutline}>
            Attendance Reports →
          </button>
        </div>
      </div>

      {/* Results */}
      {students.length > 0 && (
        <div style={G.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={G.th}>Registration Number</th>
                  <th style={G.th}>Email</th>
                  <th style={G.th}>Semesters</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map(s => (
                  <tr key={s._id}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(148,163,184,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={G.td}>{s.registrationNumber}</td>
                    <td style={{ ...G.td, color: 'rgba(255,255,255,0.60)' }}>{s.email}</td>
                    <td style={G.td}>
                      {s.semesters.map((sem, idx) => (
                        <div key={idx} style={{ marginBottom: 8 }}>
                          <div style={G.subLabel}>Semester {sem.semester}</div>
                          {sem.subjects.map((sub, subIdx) => (
                            <div key={subIdx} style={G.subItem}>
                              {sub.subject}: Mid1 — {sub.mid1}, Mid2 — {sub.mid2}, Ext — {sub.ext}
                            </div>
                          ))}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0} style={{ ...G.btnNav, opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
            <span style={G.pageInfo}>Page {students.length === 0 ? 0 : page + 1} of {Math.max(1, Math.ceil(students.length / rowsPerPage))}</span>
            <button onClick={() => setPage(p => Math.min(p + 1, Math.ceil(students.length / rowsPerPage) - 1))} disabled={page >= Math.ceil(students.length / rowsPerPage) - 1} style={{ ...G.btnNav, opacity: page >= Math.ceil(students.length / rowsPerPage) - 1 ? 0.4 : 1 }}>Next →</button>
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} style={G.select}>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      )}

      {students.length === 0 && !fetching && (
        <div style={{ ...G.card, textAlign: 'center', color: 'rgba(255,255,255,0.30)', padding: '32px 20px' }}>
          Enter filters above and click Fetch Records to load report data
        </div>
      )}
    </div>
  );
}

export default OverallReports;
