import React, { useState, useEffect } from "react";
import apiClient from "../apiClient";
import {
  Box, Typography, TextField, Button, Alert, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Rating
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const MentorGrading = () => {
  const { email } = useParams(); // Get the student's email from the URL
  const navigate = useNavigate(); // For navigation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mentorGrading, setMentorGrading] = useState({
    email: email,
    grading: {
      generalDiscipline: [],
      communicationSkills: [],
      generalGrooming: [],
      behaviorWithPeers: [],
      behaviorWithFaculty: [],
      coCurricularActivities: [],
      extracurricularActivities: [],
      behaviorInHostel: [],
      overallGrading: [],
        disciplinaryActions: [],
    },
    remarks: [],
      dates: [],
    placement: {
      companyName: "",
      jobRole: "",
      package: null,
    },
    higherEducation: {
      universityName: "",
      courseName: "",
      country: "",
    },
    initials: {
      student: [],
      mentor: [],
    },
  });
  const [semester, setSemester] = useState(1); // Current semester (1-indexed)
  const [isMentor, setIsMentor] = useState(false); // Check if the user is a mentor
  const [isSaved, setIsSaved] = useState(false); // Track if the current semester is saved
  
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [activeYear, setActiveYear] = useState('all');

  const availablePrefixes = Array.from(
    new Set(
      assignedStudents
        .map((student) => String(student.username || '').slice(0, 3))
        .filter((prefix) => /^\d{3}$/.test(prefix))
    )
  ).sort((a, b) => Number(b) - Number(a));

  const getYearLabel = (prefix) => {
    const rank = availablePrefixes.indexOf(prefix) + 1;
    if (rank === 1) return '1st Year';
    if (rank === 2) return '2nd Year';
    if (rank === 3) return '3rd Year';
    if (rank === 4) return '4th Year';
    return `Previous Batch (${prefix})`;
  };
  // Fetch mentor grading data for the student
  useEffect(() => {
    const fetchMentorGrading = async () => {
      try {
        let targetEmail = email;
        const userRole = localStorage.getItem("userRole") || localStorage.getItem("role");
        const isAdmin = userRole === "mentor" || userRole === "admin" || userRole === "superadmin";

        if (!targetEmail) {
          if (isAdmin) {
             // Admin hasn't selected a student yet. Don't fetch grading.
             setLoading(false);
             return;
          }
          // fetch current user info to get email
          const token = localStorage.getItem('authToken');
          if(token) {
              const res = await apiClient.get('/api/auth/user', { headers: { Authorization: `Bearer ${token}` }});
              targetEmail = res.data.email;
              setMentorGrading(prev => ({...prev, email: targetEmail}));        
          }
        }
        if(!targetEmail) { throw new Error("No student email found"); }

        const response = await apiClient.get(`/api/mentorGrading/${targetEmail}`);
        if (response.status === 200 && response.data && response.data.grading) {
          setMentorGrading({
              ...response.data,
              email: targetEmail
          });
          setIsSaved(response.data.grading.generalDiscipline.length >= semester);
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
             // Not found means no grade yet, keep defaults instead of failing! 
             setIsSaved(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMentorGrading();
  }, [email, semester]);

  // Check if the user is a mentor (replace this with your actual mentor check logic)
  useEffect(() => {
    const checkMentor = async () => {
      const userRole = localStorage.getItem("userRole") || localStorage.getItem("role"); 
      const mentorStatus = (userRole === "mentor" || userRole === "admin" || userRole === "superadmin");
      setIsMentor(mentorStatus);
      
      if (mentorStatus && !email) {
          try {
              const token = localStorage.getItem('authToken');
              const res = await apiClient.get('/api/admin/users?role=user', {
                  headers: { Authorization: `Bearer ${token}` }
              });
              setAssignedStudents(res.data);
          } catch(err) {
              console.error("Could not fetch assigned students", err);
          }
      }
    };
    checkMentor();
  }, [email]);

  // Handle changes in grading (only for mentors)
  const handleGradingChange = (field, value) => {
    if (!isMentor) return; // Only mentors can edit
    setMentorGrading((prev) => ({
      ...prev,
      grading: {
        ...prev.grading,
        [field]: [
          ...prev.grading[field].slice(0, semester - 1), // Keep previous semesters' grades
          value, // Update the current semester's grade
          ...prev.grading[field].slice(semester), // Keep grades for subsequent semesters
        ],
      },
    }));
  };
    // Handle changes in dates (only for mentors)
    const handleDateChange = (value) => {
      if (!isMentor) return; // Only mentors can edit
      setMentorGrading((prev) => ({
        ...prev,
        dates: [
          ...(prev.dates || []).slice(0, semester - 1),
          value,
          ...(prev.dates || []).slice(semester),
        ],
      }));
    };
  // Handle changes in remarks (only for mentors)
  const handleRemarksChange = (value) => {
    if (!isMentor) return; // Only mentors can edit
    setMentorGrading((prev) => ({
      ...prev,
      remarks: [
        ...prev.remarks.slice(0, semester - 1), // Keep previous semesters' remarks
        value, // Update the current semester's remarks
        ...prev.remarks.slice(semester), // Keep remarks for subsequent semesters
      ],
    }));
  };

  // Handle changes in initials (only for mentors)
  const handleInitialsChange = (type, value) => {
    if (!isMentor) return; // Only mentors can edit
    setMentorGrading((prev) => ({
      ...prev,
      initials: {
        ...prev.initials,
        [type]: [
          ...prev.initials[type].slice(0, semester - 1), // Keep previous semesters' initials
          value, // Update the current semester's initials
          ...prev.initials[type].slice(semester), // Keep initials for subsequent semesters
        ],
      },
    }));
  };

  // Handle changes in placement details (only for users)
  const handlePlacementChange = (field, value) => {
    if (isMentor) return; // Only users can edit
    setMentorGrading((prev) => ({
      ...prev,
      placement: {
        ...prev.placement,
        [field]: value,
      },
    }));
  };

  // Handle changes in higher education details (only for users)
  const handleHigherEducationChange = (field, value) => {
    if (isMentor) return; // Only users can edit
    setMentorGrading((prev) => ({
      ...prev,
      higherEducation: {
        ...prev.higherEducation,
        [field]: value,
      },
    }));
  };

  // Save mentor grading data (only for mentors)
  const handleSave = async () => {
    try {
      const targetEmail = mentorGrading.email || email;
      if (!targetEmail) {
        throw new Error('Student email is required');
      }
      const response = await apiClient.post(`/api/mentorGrading/${targetEmail}`, {
        ...mentorGrading,
        email: targetEmail
      });
      if (response.status === 200 || response.status === 201) {
        setError("");
        setIsSaved(true); // Mark the current semester as saved
        // Update local __v version
        if (response.data.__v !== undefined) {
          setMentorGrading(prev => ({ ...prev, __v: response.data.__v }));
        }
        alert("Grading data saved successfully!");
      } else {
        throw new Error("Failed to save grading data");
      }
    } catch (err) {
      if (err.response && err.response.status === 409) {
        alert("Conflict detected: Another counselor modified this record. Please refresh the page.");
        setError("Conflict detected: Another user modified this data. Please refresh.");
      } else {
        console.error("Error saving mentor grading data:", err);
        setError("Failed to save grading data");
      }
    }
  };

  // Navigate to the next semester (only for mentors if all fields are filled)
  const handleNextSemester = async () => {
    if (semester < 8) {
      if (isMentor && !isSaved) {
        await handleSave(); // Save the current semester before proceeding
      }
      setSemester(semester + 1);
      setIsSaved(false); // Reset saved status for the new semester
    }
  };

  // Navigate to the previous semester
  const handlePreviousSemester = () => {
    if (semester > 1) {
      setSemester(semester - 1);
      setIsSaved(true); // Assume the previous semester is saved
    }
  };

  // Navigate back to the dashboard
  const handleBackToDashboard = () => {
    navigate("/dashboard"); // Replace with your dashboard route
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isMentor && !email) {
    const filteredStudents = assignedStudents.filter((s) => {
      if (!s.username) return false;
      if (activeYear === 'all') return true;
      return s.username.startsWith(activeYear);
    });
    return (
      <Box sx={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
        <Button variant="outlined" onClick={handleBackToDashboard} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Typography variant="h5" gutterBottom>Select Student to Grade</Typography>
        <Paper sx={{ p: 4, mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Button variant={activeYear === 'all' ? 'contained' : 'outlined'} onClick={() => setActiveYear('all')}>All Batches</Button>
            {availablePrefixes.map((prefix) => (
              <Button
                key={prefix}
                variant={activeYear === prefix ? 'contained' : 'outlined'}
                onClick={() => setActiveYear(prefix)}
              >
                {getYearLabel(prefix)}
              </Button>
            ))}
          </Box>
          <FormControl fullWidth>
            <InputLabel>Select Student</InputLabel>
            <Select
              value=""
              label="Select Student"
              onChange={(e) => navigate(`/mentorgrade/${e.target.value}`)}
            >
              <MenuItem value="" disabled>Select a student</MenuItem>
              {filteredStudents.map(student => (
                <MenuItem key={student._id || student.email} value={student.email}>
                  {student.username} - {student.email}
                </MenuItem>
              ))}
              {filteredStudents.length === 0 && (
                <MenuItem disabled>No students found for this year.</MenuItem>
              )}
            </Select>
          </FormControl>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
      <Typography variant="h4" align="center" gutterBottom>
        Mentor Grading for {email || mentorGrading.email}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ marginBottom: "20px" }}>
          {error}
        </Alert>
      )}

      <Box sx={{ marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
        <Button variant="contained" onClick={handleBackToDashboard}>
          Back to Dashboard
        </Button>
        <Box>
          <Button variant="contained" onClick={handlePreviousSemester} disabled={semester === 1}>
            Previous
          </Button>
          <Button
            variant="contained"
            onClick={handleNextSemester}
            disabled={semester === 8}
            sx={{ marginLeft: "10px" }}
          >
            Next
          </Button>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>
        Semester {semester}
      </Typography>

      <TableContainer component={Paper} elevation={3} sx={{ marginBottom: "20px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Category</b></TableCell>
              <TableCell><b>Grade</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(mentorGrading.grading).map((field) => (
              <TableRow key={field}>
                <TableCell>{field}</TableCell>
                <TableCell>
                  {isMentor ? (
                    <Rating
                      name={field}
                      value={mentorGrading.grading[field][semester - 1] || 0}
                      onChange={(e, newValue) => handleGradingChange(field, newValue)}
                      max={5}
                    />
                  ) : (
                    <Rating
                      name={field}
                      value={mentorGrading.grading[field][semester - 1] || 0}
                      readOnly
                      max={5}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ marginBottom: "20px" }}>
        <Typography variant="h6">Remarks</Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={mentorGrading.remarks[semester - 1] || ""}
          onChange={(e) => handleRemarksChange(e.target.value)}
          variant="outlined"
          disabled={!isMentor}
            sx={{ mb: 2 }}
          />

          <Typography variant="h6" sx={{ mt: 2 }}>Date of Remarks</Typography>
          <TextField
            fullWidth
            type="date"
            InputLabelProps={{ shrink: true }}
            value={mentorGrading.dates?.[semester - 1] || ""}
            onChange={(e) => handleDateChange(e.target.value)}
            variant="outlined"
            disabled={!isMentor}
          />
        </Box>

        <Box sx={{ marginBottom: "20px", display: "flex", gap: "20px" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Student Sign (Initials)</Typography>
            <TextField
              fullWidth
              size="small"
              value={mentorGrading.initials.student[semester - 1] || ""}
              onChange={(e) => handleInitialsChange("student", e.target.value)}
              placeholder="e.g. JB"
              disabled={!isMentor}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Mentor Sign (Initials)</Typography>
            <TextField
              fullWidth
              size="small"
              value={mentorGrading.initials.mentor[semester - 1] || ""}
              onChange={(e) => handleInitialsChange("mentor", e.target.value)}
              placeholder="e.g. Dr. S"
            disabled={!isMentor}
          />
        </Box>
      </Box>

      <Box sx={{ marginBottom: "20px" }}>
        <Typography variant="h6">Placement Details</Typography>
        <TextField
          label="Company Name"
          value={mentorGrading.placement.companyName}
          onChange={(e) => handlePlacementChange("companyName", e.target.value)}
          fullWidth
          sx={{ marginBottom: "10px" }}
          disabled={isMentor}
        />
        <TextField
          label="Job Role"
          value={mentorGrading.placement.jobRole}
          onChange={(e) => handlePlacementChange("jobRole", e.target.value)}
          fullWidth
          sx={{ marginBottom: "10px" }}
          disabled={isMentor}
        />
        <TextField
          label="Package (LPA)"
          type="number"
          value={mentorGrading.placement.package || ""}
          onChange={(e) => handlePlacementChange("package", e.target.value)}
          fullWidth
          disabled={isMentor}
        />
      </Box>

      <Box sx={{ marginBottom: "20px" }}>
        <Typography variant="h6">Higher Education Details</Typography>
        <TextField
          label="University Name"
          value={mentorGrading.higherEducation.universityName}
          onChange={(e) => handleHigherEducationChange("universityName", e.target.value)}
          fullWidth
          sx={{ marginBottom: "10px" }}
          disabled={isMentor}
        />
        <TextField
          label="Course Name"
          value={mentorGrading.higherEducation.courseName}
          onChange={(e) => handleHigherEducationChange("courseName", e.target.value)}
          fullWidth
          sx={{ marginBottom: "10px" }}
          disabled={isMentor}
        />
        <TextField
          label="Country"
          value={mentorGrading.higherEducation.country}
          onChange={(e) => handleHigherEducationChange("country", e.target.value)}
          fullWidth
          disabled={isMentor}
        />
      </Box>

      <Box display="flex" justifyContent="center">
        <Button variant="contained" color="primary" onClick={handleSave}>
          {isMentor ? 'Save Grading' : 'Save Details'}
        </Button>
      </Box>
    </Box>
  );
};

export default MentorGrading;