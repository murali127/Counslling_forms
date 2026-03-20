import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, FormControlLabel, Switch, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

const AdminAccessControl = () => {
  const navigate = useNavigate();
  const [windows, setWindows] = useState([
    { year: 1, enabled: false, startAt: '', endAt: '', isOpen: false },
    { year: 2, enabled: false, startAt: '', endAt: '', isOpen: false },
    { year: 3, enabled: false, startAt: '', endAt: '', isOpen: false },
    { year: 4, enabled: false, startAt: '', endAt: '', isOpen: false }
  ]);
  const [assignedCountsByYear, setAssignedCountsByYear] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const toLocalDatetimeInput = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const fetchWindow = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await apiClient.get('/api/admin/student-login-windows', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const nextRows = (res.data.windows || []).map((row) => ({
        year: Number(row.year),
        enabled: Boolean(row.enabled),
        startAt: toLocalDatetimeInput(row.startAt),
        endAt: toLocalDatetimeInput(row.endAt),
        isOpen: Boolean(row.isOpen)
      }));

      if (nextRows.length === 4) {
        setWindows(nextRows);
      }
      setAssignedCountsByYear(res.data.assignedStudentCountsByYear || { 1: 0, 2: 0, 3: 0, 4: 0 });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load current access window settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWindow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setMessage('');

      for (const row of windows) {
        if (row.enabled && (!row.startAt || !row.endAt)) {
          setError(`Year ${row.year}: start and end date/time are required when enabled.`);
          setSaving(false);
          return;
        }
      }

      const token = localStorage.getItem('authToken');
      const payload = {
        windows: windows.map((row) => ({
          year: row.year,
          enabled: row.enabled,
          startAt: row.enabled && row.startAt ? new Date(row.startAt).toISOString() : null,
          endAt: row.enabled && row.endAt ? new Date(row.endAt).toISOString() : null
        })),
        notifyStudents
      };

      await apiClient.put('/api/admin/student-login-windows', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Year-wise student login windows saved successfully.');
      await fetchWindow();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Student Login Window Control (Year Wise)
      </Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Configure login windows separately for Year 1, Year 2, Year 3, and Year 4. Students can log in only during the enabled window for their own year.
        </Typography>

        {loading ? (
          <Typography>Loading current settings...</Typography>
        ) : (
          <>
            {windows.map((row, idx) => (
              <Paper key={row.year} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Year {row.year} ({assignedCountsByYear[row.year] || 0} assigned students)
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={row.enabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setWindows((prev) => prev.map((r, rIdx) => (
                          rIdx === idx ? { ...r, enabled: checked } : r
                        )));
                      }}
                    />
                  }
                  label={`Enable login window for Year ${row.year}`}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                  <TextField
                    label="Start date/time"
                    type="datetime-local"
                    value={row.startAt}
                    onChange={(e) => {
                      const value = e.target.value;
                      setWindows((prev) => prev.map((r, rIdx) => (
                        rIdx === idx ? { ...r, startAt: value } : r
                      )));
                    }}
                    InputLabelProps={{ shrink: true }}
                    disabled={!row.enabled}
                  />
                  <TextField
                    label="End date/time"
                    type="datetime-local"
                    value={row.endAt}
                    onChange={(e) => {
                      const value = e.target.value;
                      setWindows((prev) => prev.map((r, rIdx) => (
                        rIdx === idx ? { ...r, endAt: value } : r
                      )));
                    }}
                    InputLabelProps={{ shrink: true }}
                    disabled={!row.enabled}
                  />
                </Box>

                <Alert severity={row.isOpen ? 'success' : 'warning'} sx={{ mt: 2 }}>
                  Current status: {row.isOpen ? 'OPEN' : 'CLOSED'}
                </Alert>
              </Paper>
            ))}

            <FormControlLabel
              control={<Switch checked={notifyStudents} onChange={(e) => setNotifyStudents(e.target.checked)} />}
              label="Send email notification to all assigned students for enabled years"
            />

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}

            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outlined" onClick={() => navigate('/admin-panel')}>
                Back to Admin Dashboard
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AdminAccessControl;
