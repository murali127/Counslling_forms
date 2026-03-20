import React, { useState, useEffect } from "react";
import apiClient from "../apiClient";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button,
  CircularProgress, Typography, Alert, Box, MenuItem, Select, Chip, Card, IconButton
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

// Replace these with actual imports if you have the MUI icons package
const ArrowBackIcon = () => <span>←</span>;
const ArrowForwardIcon = () => <span>→</span>;
const EditIcon = () => <span>✏️</span>;
const SaveIcon = () => <span>💾</span>;
const CancelIcon = () => <span>✖️</span>;
const HomeIcon = () => <span>🏠</span>;

const subjectList = {
  1: ["Mathematics-I", "Physics", "Chemistry", "C Programming", "Engineering Drawing", "English", "Environmental Science", "Workshop", "IT Essentials", "Basic Electrical"],
  2: ["Mathematics-II", "Data Structures", "Digital Logic", "Object-Oriented Programming", "Discrete Mathematics", "Economics", "Electronic Circuits", "Microprocessors", "Signals & Systems", "Statistics"],
  3: ["Mathematics-III", "Operating Systems", "Database Management Systems", "Computer Networks", "Theory of Computation", "Software Engineering", "Machine Learning Basics", "Artificial Intelligence", "Web Technologies", "Cloud Computing"],
  4: ["Mathematics-IV", "Advanced DBMS", "Computer Architecture", "Design & Analysis of Algorithms", "Data Science", "Cybersecurity", "Blockchain Basics", "Internet of Things", "Mobile App Development", "Compiler Design"],
  5: ["Software Project Management", "Deep Learning", "Big Data Analytics", "DevOps", "Cloud Security", "Full Stack Development", "Quantum Computing", "AR/VR Technologies", "Embedded Systems", "Digital Marketing"],
  6: ["Natural Language Processing", "Robotics", "Game Development", "Human-Computer Interaction", "Ethical Hacking", "Data Visualization", "Computer Vision", "Neural Networks", "Distributed Systems", "Parallel Computing"],
  7: ["Research Methodologies", "Digital Signal Processing", "Bioinformatics", "3D Modeling", "Metaverse Technologies", "Edge Computing", "Autonomous Vehicles", "Social Network Analysis", "Cyber-Physical Systems", "Smart Grids"],
  8: ["Final Year Project", "Entrepreneurship", "Patent Laws", "Advanced AI", "Quantum Machine Learning", "Space Technologies", "Blockchain Advanced", "AI Ethics", "Cognitive Computing", "Innovation Management"]
};

// Grade colors for visual indicators
const gradeColors = {
  "A+": "#4caf50", // Green
  "A": "#8bc34a",  // Light Green
  "B": "#03a9f4",  // Light Blue
  "C": "#ff9800",  // Orange
  "D": "#ff5722",  // Deep Orange
  "E": "#f44336",  // Red
  "F": "#d32f2f"   // Dark Red
};

const MarksTable = () => {
  const { email: emailParam } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [updatedMarks, setUpdatedMarks] = useState([]);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [role, setRole] = useState('user');
  const [students, setStudents] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [contextReady, setContextReady] = useState(false);
  const navigate = useNavigate();

  const isManager = ['admin', 'superadmin', 'principal', 'master'].includes(role);

  useEffect(() => {
    const loadContext = async () => {
      try {
        setLoading(true);
        setError('');
        setContextReady(false);
        const token = localStorage.getItem('authToken');

        if (!token) {
          navigate('/signup');
          return;
        }

        const userRes = await apiClient.get('/api/auth/user', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const currentRole = userRes.data?.role || 'user';
        setRole(currentRole);

        if (['admin', 'superadmin', 'principal', 'master'].includes(currentRole)) {
          const studentsRes = await apiClient.get('/api/admin/users?role=user', {
            headers: { Authorization: `Bearer ${token}` }
          });

          const list = studentsRes.data || [];
          setStudents(list);

          let targetEmail = '';
          if (emailParam) {
            const target = list.find((student) => String(student.email).toLowerCase() === String(emailParam).toLowerCase());
            targetEmail = target?.email || '';
          }

          if (!targetEmail && list.length > 0) {
            targetEmail = list[0].email;
          }

          setSelectedEmail(targetEmail);
        } else {
          const selfEmail = localStorage.getItem('userEmail') || userRes.data?.email || '';
          setSelectedEmail(selfEmail);
        }

        setContextReady(true);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load student context.');
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [emailParam, navigate]);

  useEffect(() => {
    if (!contextReady) return;
    if (!selectedEmail) {
      setError('No student selected.');
      return;
    }

    const fetchSemesterDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await apiClient.get(
          `/api/semester/${encodeURIComponent(selectedEmail)}/${selectedSemester}`
        );

        if (response.status === 200) {
          setUpdatedMarks(response.data.subjects);
          setIsNewEntry(false);
          setIsSaved(true);
        } else {
          throw new Error("Unexpected error occurred.");
        }
      } catch (err) {
        console.error("Error fetching semester details:", err);

        if (err.response?.status === 404) {
          setUpdatedMarks(subjectList[selectedSemester].map(subject => ({
            subject,
            mid1: '',
            mid2: '',
            ext: "A+"
          })));
          setIsNewEntry(true);
          setIsSaved(false);
        } else {
          setError("Error retrieving marks. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSemesterDetails();
  }, [contextReady, selectedEmail, selectedSemester]);

  const handleMarksChange = (index, field, value) => {
    const updated = [...updatedMarks];
    if (field === "ext") {
      updated[index] = { ...updated[index], [field]: value };
    } else {
      const numValue = value === '' ? '' : Math.min(30, Math.max(0, Number(value)));
      updated[index] = { ...updated[index], [field]: numValue };
    }
    setUpdatedMarks(updated);
  };

  const handleSave = async () => {
    if (!selectedEmail) {
      setError('No student selected.');
      return;
    }

    try {
      setLoading(true);
      const normalizedSubjects = (subjectList[selectedSemester] || []).map((subjectName) => {
        const current = updatedMarks.find((item) => item.subject === subjectName) || {};
        const safeMid1 = current.mid1 === '' || current.mid1 === undefined || current.mid1 === null
          ? 0
          : Number(current.mid1);
        const safeMid2 = current.mid2 === '' || current.mid2 === undefined || current.mid2 === null
          ? 0
          : Number(current.mid2);

        return {
          subject: subjectName,
          mid1: Number.isFinite(safeMid1) ? Math.min(30, Math.max(0, safeMid1)) : 0,
          mid2: Number.isFinite(safeMid2) ? Math.min(30, Math.max(0, safeMid2)) : 0,
          ext: current.ext || 'A+'
        };
      });

      let response;
      if (isNewEntry) {
        response = await apiClient.post(
          `/api/semester`,
          { email: selectedEmail, semester: selectedSemester, subjects: normalizedSubjects }
        );
      } else {
        response = await apiClient.put(
          `/api/semester/${encodeURIComponent(selectedEmail)}/${selectedSemester}`,
          { subjects: normalizedSubjects }
        );
      }

      if (response.status >= 200 && response.status < 300) {
        setUpdatedMarks(normalizedSubjects);
        setEditMode(false);
        setIsNewEntry(false);
        setIsSaved(true);
        setError('');
      }
    } catch (err) {
      console.error("Error updating subject marks:", err.response?.data || err);
      setError("Failed to update subject marks.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextSemester = () => {
    if (selectedSemester < 8) {
      setSelectedSemester(selectedSemester + 1);
      setIsSaved(false);
      setEditMode(false);
    }
  };

  const handlePreviousSemester = () => {
    if (selectedSemester > 1) {
      setSelectedSemester(selectedSemester - 1);
      setIsSaved(false);
      setEditMode(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Calculate average marks
  const calculateAverage = () => {
    if (!updatedMarks.length) return { mid1: 0, mid2: 0 };
    
    const totals = updatedMarks.reduce((acc, subject) => {
      return {
        mid1: acc.mid1 + Number(subject.mid1),
        mid2: acc.mid2 + Number(subject.mid2)
      };
    }, { mid1: 0, mid2: 0 });
    
    return {
      mid1: (totals.mid1 / updatedMarks.length).toFixed(1),
      mid2: (totals.mid2 / updatedMarks.length).toFixed(1)
    };
  };

  const averages = calculateAverage();

  // Grade distribution
  const gradeDistribution = () => {
    const distribution = {};
    ["A+", "A", "B", "C", "D", "E", "F"].forEach(grade => {
      distribution[grade] = 0;
    });

    updatedMarks.forEach(subject => {
      distribution[subject.ext]++;
    });

    return distribution;
  };

  const grades = gradeDistribution();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Card sx={{ p: 4, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          <CircularProgress color="primary" />
          <Typography variant="h6" mt={2}>Loading marks...</Typography>
        </Card>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ padding: "20px", maxWidth: "1000px", margin: "auto" }}
    >
      {/* Header with navigation */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        mb: 3,
        position: "sticky",
        top: 0,
        zIndex: 10,
        backgroundColor: "#fff",
        p: 2,
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleBackToDashboard}
          startIcon={<HomeIcon />}
          sx={{ borderRadius: 2 }}
        >
          Dashboard
        </Button>
        
        <Box display="flex" alignItems="center">
          <IconButton 
            onClick={handlePreviousSemester} 
            disabled={selectedSemester === 1}
            sx={{ mx: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Chip 
            label={`Semester ${selectedSemester}`} 
            color="primary" 
            sx={{ 
              borderRadius: 2, 
              px: 2,
              py: 2.5,
              fontSize: '1rem',
              fontWeight: 'bold'
            }} 
          />
          
          <IconButton 
            onClick={handleNextSemester} 
            disabled={!isSaved || selectedSemester === 8}
            sx={{ mx: 1 }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </Box>
        
        <Button
          variant={editMode ? "outlined" : "contained"}
          color={editMode ? "error" : "primary"}
          onClick={toggleEditMode}
          startIcon={editMode ? <CancelIcon /> : <EditIcon />}
          sx={{ borderRadius: 2 }}
        >
          {editMode ? "Cancel" : "Edit"}
        </Button>
      </Box>

      {isManager && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
            Select Student
          </Typography>
          <Select
            fullWidth
            size="small"
            value={selectedEmail}
            onChange={(e) => {
              setSelectedEmail(e.target.value);
              setEditMode(false);
              setIsSaved(false);
            }}
          >
            {students.map((student) => (
              <MenuItem key={student._id} value={student.email}>
                {student.username} ({student.email})
              </MenuItem>
            ))}
          </Select>
        </Paper>
      )}

      <Card sx={{ mb: 4, borderRadius: 3, overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.1)' }}>
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(120deg, #2196f3, #3f51b5)',
          color: 'white'
        }}>
          <Typography variant="h5" fontWeight="bold">
            Academic Record
          </Typography>
          <Typography variant="subtitle1">
            {selectedEmail}
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          p: 2,
          flexWrap: 'wrap',
          backgroundColor: '#f5f9ff'
        }}>
          <Card sx={{ minWidth: 160, m: 1, p: 2, textAlign: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <Typography variant="overline" color="textSecondary">Mid 1 Average</Typography>
            <Typography variant="h5" fontWeight="bold">{averages.mid1}/30</Typography>
          </Card>
          
          <Card sx={{ minWidth: 160, m: 1, p: 2, textAlign: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <Typography variant="overline" color="textSecondary">Mid 2 Average</Typography>
            <Typography variant="h5" fontWeight="bold">{averages.mid2}/30</Typography>
          </Card>
          
          <Card sx={{ minWidth: 160, m: 1, p: 2, textAlign: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <Typography variant="overline" color="textSecondary">Subjects</Typography>
            <Typography variant="h5" fontWeight="bold">{updatedMarks.length}</Typography>
          </Card>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Grade Distribution */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
        {Object.entries(grades).map(([grade, count]) => (
          count > 0 && (
            <Chip 
              key={grade}
              label={`${grade}: ${count}`}
              sx={{ 
                backgroundColor: gradeColors[grade],
                color: 'white',
                fontWeight: 'bold',
                px: 1
              }}
            />
          )
        ))}
      </Box>

      {!isSaved && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          {isNewEntry ? "New semester data ready to be saved." : "Changes need to be saved before proceeding."}
        </Alert>
      )}

      {/* Marks Table */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedSemester}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <TableContainer 
            component={Paper} 
            elevation={3} 
            sx={{ 
              mb: 4, 
              borderRadius: 3, 
              overflow: 'hidden',
              boxShadow: '0 6px 18px rgba(0,0,0,0.1)'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f3f6ff' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Mid 1</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Mid 2</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>External Grade</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {updatedMarks.map((subject, index) => (
                  <TableRow 
                    key={index} 
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: '#fafcff' },
                      '&:hover': { backgroundColor: '#f0f7ff' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{subject.subject}</TableCell>
                    <TableCell>
                      <TextField 
                        type="number" 
                        value={subject.mid1} 
                        onChange={(e) => handleMarksChange(index, "mid1", e.target.value)} 
                        variant="outlined" 
                        size="small" 
                        disabled={!editMode}
                        InputProps={{ 
                          inputProps: { min: 0, max: 30 },
                          sx: { borderRadius: 2 }
                        }}
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField 
                        type="number" 
                        value={subject.mid2} 
                        onChange={(e) => handleMarksChange(index, "mid2", e.target.value)} 
                        variant="outlined" 
                        size="small" 
                        disabled={!editMode}
                        InputProps={{ 
                          inputProps: { min: 0, max: 30 },
                          sx: { borderRadius: 2 }
                        }}
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={subject.ext} 
                        onChange={(e) => handleMarksChange(index, "ext", e.target.value)} 
                        variant="outlined" 
                        size="small" 
                        disabled={!editMode}
                        sx={{ 
                          minWidth: '90px', 
                          borderRadius: 2,
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: gradeColors[subject.ext],
                            borderWidth: 2
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: gradeColors[subject.ext],
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: { borderRadius: 2 }
                          }
                        }}
                      >
                        {["A+", "A", "B", "C", "D", "E", "F"].map((grade) => (
                          <MenuItem key={grade} value={grade}>
                            <Box 
                              component="span" 
                              sx={{ 
                                width: 16, 
                                height: 16, 
                                borderRadius: '50%', 
                                backgroundColor: gradeColors[grade], 
                                display: 'inline-block',
                                mr: 1
                              }}
                            />
                            {grade}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="center" mt={3} gap={2}>
        {editMode ? (
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleSave}
            startIcon={<SaveIcon />}
            sx={{ px: 4, py: 1.5, borderRadius: 2, boxShadow: '0 4px 12px rgba(76,175,80,0.3)' }}
          >
            Save Changes
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handlePreviousSemester} 
              disabled={selectedSemester === 1}
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 2 }}
            >
              Previous Semester
            </Button>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleNextSemester} 
              disabled={!isSaved || selectedSemester === 8}
              endIcon={<ArrowForwardIcon />}
              sx={{ borderRadius: 2 }}
            >
              Next Semester
            </Button>
          </Box>
        )}
      </Box>
      
      {/* Semester Progress */}
      <Box sx={{ mt: 5, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="textSecondary">Semester 1</Typography>
          <Typography variant="body2" color="textSecondary">Semester 8</Typography>
        </Box>
        <Box sx={{ 
          width: '100%', 
          height: 8, 
          backgroundColor: '#e0e0e0', 
          borderRadius: 4,
          position: 'relative'
        }}>
          <Box sx={{ 
            position: 'absolute',
            width: `${(selectedSemester / 8) * 100}%`,
            height: '100%',
            backgroundColor: 'primary.main',
            borderRadius: 4,
            transition: 'width 0.3s ease'
          }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {selectedSemester} of 8 semesters completed
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
};

export default MarksTable;