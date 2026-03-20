import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, FormControlLabel, Switch, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

const AdminAccessControl = () => {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isOpen, setIsOpen] = useState(false);
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
      const res = await apiClient.get('/api/admin/student-profile-window', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnabled(Boolean(res.data.enabled));
      setIsOpen(Boolean(res.data.isOpen));
      setStartAt(toLocalDatetimeInput(res.data.startAt));
      setEndAt(toLocalDatetimeInput(res.data.endAt));
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

      if (enabled && (!startAt || !endAt)) {
        setError('Start and end date/time are required when window is enabled.');
        setSaving(false);
        return;
      }

      const token = localStorage.getItem('authToken');
      await apiClient.put('/api/admin/student-profile-window', {
        enabled,
        startAt: enabled ? new Date(startAt).toISOString() : null,
        endAt: enabled ? new Date(endAt).toISOString() : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Student profile access window saved successfully.');
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
        Student Access Window Control
      </Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Control when students can create or update their profiles. Outside this window, student profile editing will be blocked.
        </Typography>

        {loading ? (
          <Typography>Loading current settings...</Typography>
        ) : (
          <>
            <FormControlLabel
              control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
              label="Enable student profile access window"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
              <TextField
                label="Start date/time"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!enabled}
              />
              <TextField
                label="End date/time"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!enabled}
              />
            </Box>

            <Alert severity={isOpen ? 'success' : 'warning'} sx={{ mt: 2 }}>
              Current window status: {isOpen ? 'OPEN' : 'CLOSED'}
            </Alert>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}

            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outlined" onClick={() => navigate('/admin')}>
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
