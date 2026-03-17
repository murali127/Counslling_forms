import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import apiClient from '../../apiClient';
import gvplogo from '../../images/gvplogo.jpg';

const ConsolidatedCounselingForm = () => {
  const { regdNo } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [marks, setMarks] = useState(null);
  const [mentorGrading, setMentorGrading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return navigate('/login');
        
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const profileRes = await apiClient.get(`/api/profile/${regdNo}`, config);
        const profileData = profileRes.data.profile;
        setProfile(profileData);
        
        const email = `${profileData.regdNo}@gvpce.ac.in`;
        if (email) {
          try {
            const [marksRes, gradingRes] = await Promise.all([
              apiClient.get(`/api/semester/all/${email}`, config).catch(() => ({ data: { semesters: [] } })),
              apiClient.get(`/api/mentorGrading/${email}`, config).catch(() => ({ data: null }))
            ]);
            setMarks(marksRes.data);
            setMentorGrading(gradingRes.data);
          } catch (err) {
            console.error("Error fetching academic/grading details:", err);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load student details. The profile may not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [regdNo, navigate]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  if (error || !profile) return <Box sx={{ p: 4 }}><Typography color="error">{error || 'Profile not found'}</Typography></Box>;

  const handlePrint = () => window.print();

  const renderSemesterRows = (startSem, endSem) => {
    if (!marks || !marks.semesters) return null;
    
    // get subjects for semesters
    const sems = [];
    let maxSubjects = 0;
    for (let i = startSem; i <= endSem; i++) {
        const sm = marks.semesters.find(s => s.semester === i);
        sems.push(sm ? sm.subjects : []);
        if (sm && sm.subjects.length > maxSubjects) maxSubjects = sm.subjects.length;
    }

    const rows = [];
    for (let r = 0; r < Math.max(maxSubjects, 10); r++) {
       const tds = [];
       for (let c = 0; c < 4; c++) { 
          const subj = sems[c]?.[r];
          if (subj) {
             tds.push(<td key={`${c}-subj`} style={{whiteSpace:'nowrap', overflow:'hidden', maxWidth:'80px', textOverflow:'ellipsis'}}>{subj.subject || '\u00A0'}</td>);
             tds.push(<td key={`${c}-m1`}>{subj.mid1 || '\u00A0'}</td>);
             tds.push(<td key={`${c}-m2`}>{subj.mid2 || '\u00A0'}</td>);
             tds.push(<td key={`${c}-ext`}>{subj.ext || '\u00A0'}</td>);
          } else {
             tds.push(<td key={`${c}-subj`}>{'\u00A0'}</td>, <td key={`${c}-m1`}>{'\u00A0'}</td>, <td key={`${c}-m2`}>{'\u00A0'}</td>, <td key={`${c}-ext`}>{'\u00A0'}</td>);
          }
       }
       rows.push(<tr key={r} style={{ height: '22px' }}>{tds}</tr>);
    }

    // Append standard footer rows for academic table
    const footerLabels = ['Month & Year of pass', 'SGPA', 'CGPA'];
    footerLabels.forEach((label, idx) => {
       const tds = [];
       for (let c = 0; c < 4; c++) {
          tds.push(<td key={`${c}-label`} style={{fontWeight: 'bold', fontSize: '9px', textAlign: 'left'}}>{label}</td>);
          tds.push(<td colSpan="3" key={`${c}-val`}>{'\u00A0'}</td>);
       }
       rows.push(<tr key={`footer-${idx}`} style={{ height: '22px', backgroundColor: '#f9f9f9' }}>{tds}</tr>);
    });

    return rows;
  };

  const renderGradingRow = (label, fieldKey) => {
     let vals = mentorGrading?.grading?.[fieldKey] || [];
     return (
       <tr key={fieldKey}>
         <td style={{textAlign: 'left', padding: '5px'}}>{label}</td>
         {[0,1,2,3,4,5,6,7].map(i => <td key={i}>{vals[i] || ''}</td>)}
       </tr>
     )
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1000px', margin: 'auto', bgcolor: '#fff' }}>
      <style>{`
        @media print {
          @page { margin: 15mm; }
          body * { visibility: hidden; }
          #printable-form, #printable-form * { visibility: visible; }
          #printable-form {
            position: absolute; left: 0; top: 0;
            width: 100%;
          }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; border:0; margin:0; padding:0; }
          table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          table, th, td { border: 1px solid black; }
          th, td { padding: 4px; }
        }
        .form-table td { border: 1px solid black; padding: 6px; word-wrap: break-word; overflow: hidden; }
        .form-table th { border: 1px solid black; padding: 6px; }
      `}</style>

      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
        <Button variant="contained" color="primary" onClick={handlePrint}>Print Form</Button>
      </Box>

      <div id="printable-form" style={{fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', padding: '10px'}}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', borderBottom: '2px solid black', paddingBottom: '10px' }}>
           <img src={gvplogo} alt="GVP Logo" style={{ width: '80px', height: '80px', marginRight: '20px' }} />
           <div style={{ textAlign: 'center' }}>
             <div style={{ fontWeight: 'bold', fontSize: '18px' }}>GAYATRI VIDYA PARISHAD COLLEGE OF ENGINEERING (AUTONOMOUS)</div>
             <div style={{ fontSize: '12px', marginBottom: '5px' }}>Madhurawada, Visakhapatnam - 530 048</div>
             <div style={{ fontWeight: 'bold', fontSize: '16px', textDecoration: 'underline' }}>Department of Information Technology</div>
             <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>Student Counseling & Mentoring</div>
           </div>
        </div>

        {/* Phase 1 Basic Details */}
        <table className="form-table" style={{borderCollapse: 'collapse', width: '100%', fontSize: '12px'}}>
          <tbody>
            <tr>
              <td colSpan="2"><strong>Regd.No</strong><br/>{profile.regdNo}</td>
              <td colSpan="2"><strong>Department</strong><br/>{profile.department}</td>
              <td colSpan="2"><strong>Mobile number</strong><br/>{profile.mobileNumber}</td>
              <td rowSpan="4" style={{width: '130px', height: '160px', textAlign: 'center', padding: '10px', verticalAlign: 'middle'}}>
                {profile.profilePicture ? 
                  <img src={profile.profilePicture} alt="Student" style={{maxWidth:'110px', maxHeight:'140px', objectFit:'cover'}} /> : 
                  <span style={{color:'#666'}}>Affix a recent passport size photo of student here</span>}
              </td>
            </tr>
            <tr>
              <td colSpan="3"><strong>Name of the Student</strong><br/>(as per SSC Marks Memo)<br/>{profile.name}</td>
              <td colSpan="3"><strong>Email</strong><br/>{profile.email}</td>
            </tr>
            <tr>
              <td colSpan="2"><strong>Admitted under convener/Mgt</strong><br/>{profile.admissionType}</td>
              <td colSpan="2"><strong>Cast</strong><br/>{profile.caste}</td>
              <td colSpan="2"><strong>EAMCET / ECET RANK</strong><br/>{profile.rank}</td>
            </tr>
            <tr>
              <td colSpan="3"><strong>DoB(dd/mmm/yyyy)</strong><br/>{profile.dob}</td>
              <td colSpan="3"><strong>Blood Group</strong><br/>{profile.bloodGroup}</td>
            </tr>
            <tr>
              <td colSpan="7"><strong>10 TH (marks/max marks) & percentage:</strong> {profile.tenthMarks?.obtained || '-'}/{profile.tenthMarks?.max || '-'} ({profile.tenthMarks?.percentage || '-'}%)</td>
            </tr>
            <tr>
              <td colSpan="7"><strong>Inter/ Diploma (marks/Max marks) & percentage:</strong> {profile.interDiplomaMarks?.obtained || '-'}/{profile.interDiplomaMarks?.max || '-'} ({profile.interDiplomaMarks?.percentage || '-'}%)</td>
            </tr>
            <tr>
              <td colSpan="3"><strong>Name of the parent</strong><br/>(As per SSC Marks Memo)<br/>{profile.parentDetails?.name}</td>
              <td colSpan="4"><strong>Home address & occupation</strong><br/>{profile.parentDetails?.address} | {profile.parentDetails?.occupation}</td>
            </tr>
            <tr>
              <td colSpan="7"><strong>Parent contact Number & Email Id if any:</strong> {profile.parentDetails?.contactNumber}, {profile.parentDetails?.email}</td>
            </tr>
            <tr>
              <td colSpan="3"><strong>Name of the local guardian(if any):</strong><br/>{profile.localGuardian?.name}</td>
              <td colSpan="4"><strong>address & contact number:</strong><br/>{profile.localGuardian?.address} | {profile.localGuardian?.contactNumber}</td>
            </tr>
            <tr>
              <td colSpan="7"><strong>Hobbies:</strong> {profile.hobbies?.join(', ')}</td>
            </tr>
            <tr>
              <td colSpan="7"><strong>Participation in Games and other activates (NCC /NSS):</strong> {profile.participation?.gamesAndActivities?.join(', ')}</td>
            </tr>
            <tr>
              <td colSpan="3"><strong>Literary activities:</strong><br/>{profile.participation?.literary?.join(', ')}</td>
              <td colSpan="4"><strong>Technical activities:</strong><br/>{profile.participation?.technical?.join(', ')}</td>
            </tr>
          </tbody>
        </table>

        {/* Phase 1 Attendance */}
        <div style={{marginTop: '20px', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px'}}>Attendance</div>
        <table className="form-table" style={{borderCollapse: 'collapse', width: '100%', fontSize: '11px', textAlign: 'center'}}>
          <thead>
            <tr>
              <th style={{textAlign: 'left'}}>Monthly</th>
              <th>Jun</th><th>Jul</th><th>Aug</th><th>Sep</th><th>Oct</th><th>Nov</th><th>Dec</th><th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>May</th>
              <th>Odd sem</th><th>Even sem</th>
            </tr>
          </thead>
          <tbody>
            {["I year", "II Year", "III Year", "IV Year"].map((yearLabel, idx) => {
              return (
                <tr key={idx} style={{height: '25px'}}>
                  <td style={{textAlign: 'left', fontWeight: 'bold'}}>{yearLabel}</td>
                  <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                  <td></td><td></td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Phase 2 Counseling Record */}
        <div className="page-break" style={{marginTop: '40px', paddingBottom: '20px'}} />
        <h3 style={{textAlign: 'center', fontWeight: 'bold', fontSize:'16px', margin:0, padding:0}}>COUNSELLING RECORD</h3>
        <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px', marginBottom:'10px', fontSize:'13px'}}>
           <div><strong>Redg. number:</strong> {profile.regdNo}</div>
           <div><strong>Student name:</strong> {profile.name}</div>
        </div>
<div style={{marginBottom:'15px', fontSize:'13px'}}><strong>Name of the Mentor:</strong> {profile.userId?.assignedMentor?.username || mentorGrading?.mentorName || "_______________________"}</div>
        
        <table className="form-table" style={{borderCollapse: 'collapse', width: '100%', fontSize: '13px', textAlign: 'center'}}>
          <thead>
            <tr>
                <th style={{padding: '8px', width: '60%'}}>Mentor must write his / her remarks at the end of each semester</th>
                <th style={{width: '20%'}}>Student Sign</th>
                <th style={{width: '20%'}}>Mentor sign</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5,6,7,8].map(sem => {
                const romanSem = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][sem - 1];
                return (
                  <tr key={sem}>
                    <td style={{padding: '8px', textAlign: 'left', height: '70px', verticalAlign: 'top', position: 'relative'}}>
                        <div style={{marginBottom: '20px'}}>
                          <span style={{fontWeight: 'bold', marginRight: '8px'}}>{romanSem} Sem</span>
                          <span>{mentorGrading?.remarks?.[sem-1] || ''}</span>
                        </div>
                        <div style={{position: 'absolute', bottom: '8px', left: '8px', fontSize: '12px'}}>Date: {mentorGrading?.dates?.[sem-1] || ''}</div>
                    </td>
                    <td style={{verticalAlign: 'bottom', paddingBottom: '10px'}}>{mentorGrading?.initials?.student?.[sem-1] || ''}</td>
                    <td style={{verticalAlign: 'bottom', paddingBottom: '10px'}}>{mentorGrading?.initials?.mentor?.[sem-1] || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{marginTop: '40px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', paddingRight: '20px'}}>
             Signature of the HOD
          </div>

        {/* Phase 3 Academic Record / Marks */}
        <div className="page-break" style={{marginTop: '40px', paddingBottom: '20px'}} />
        
        <table className="form-table" style={{borderCollapse: 'collapse', width: '100%', fontSize: '9px', textAlign: 'center', marginBottom:'20px'}}>
           <thead>
             <tr>
               { [1,2,3,4].map(sem => (
                  <th colSpan="4" key={sem} style={{backgroundColor: '#f9f9f9', padding: '4px'}}>Semester {sem}</th>
               ))}
             </tr>
             <tr>
               { [1,2,3,4].map(sem => (
                  <React.Fragment key={sem+'_headers'}>
                    <th style={{width: '13%'}}>Course</th><th>Mid 1</th><th>Mid 2</th><th>Ext</th>
                  </React.Fragment>
               ))}
             </tr>
           </thead>
           <tbody>
              {renderSemesterRows(1, 4)}
           </tbody>
        </table>

        <table className="form-table" style={{borderCollapse: 'collapse', width: '100%', fontSize: '9px', textAlign: 'center', marginBottom:'30px'}}>
           <thead>
             <tr>
               { [5,6,7,8].map(sem => (
                  <th colSpan="4" key={sem} style={{backgroundColor: '#f9f9f9', padding: '4px'}}>Semester {sem}</th>
               ))}
             </tr>
             <tr>
               { [5,6,7,8].map(sem => (
                  <React.Fragment key={sem+'_headers'}>
                    <th style={{width: '13%'}}>Course</th><th>Mid 1</th><th>Mid 2</th><th>Ext</th>
                  </React.Fragment>
               ))}
             </tr>
           </thead>
           <tbody>
              {renderSemesterRows(5, 8)}
           </tbody>
        </table>

        {/* Phase 4 Mentor Grading */}
        <div style={{fontWeight: 'bold', textAlign: 'center', marginBottom: '10px', fontSize: '12px'}}>Grading by the mentor at the end of every year /semester (on scale of 5 )</div>
        <table className="form-table" style={{borderCollapse: 'collapse', width: '100%', fontSize: '11px', textAlign: 'center'}}>
           <thead>
             <tr style={{backgroundColor: '#f9f9f9'}}>
               <th style={{textAlign: 'left', padding: '5px'}}>Aspect</th>
               <th>I</th><th>II</th><th>III</th><th>IV</th><th>V</th><th>VI</th><th>VII</th><th>VIII</th>
             </tr>
           </thead>
           <tbody>
              {renderGradingRow('General Discipline', 'generalDiscipline')}
              {renderGradingRow('Communication skills', 'communicationSkills')}
              {renderGradingRow('General grooming', 'generalGrooming')}
              {renderGradingRow('Behavior with peers', 'behaviorWithPeers')}
              {renderGradingRow('Behavior with faculty', 'behaviorWithFaculty')}
              {renderGradingRow('Co-Curricular activities', 'coCurricularActivities')}
              {renderGradingRow('Extracurricular activities', 'extracurricularActivities')}
              {renderGradingRow('Behavior in the hostel', 'behaviorInHostel')}
              {renderGradingRow('Over all Grading', 'overallGrading')}
              {renderGradingRow('Disciplinary actions', 'disciplinaryActions')}
              <tr>
                 <td style={{textAlign: 'left', padding: '5px', fontWeight:'bold'}}>Initial of Student</td>
                 {[0,1,2,3,4,5,6,7].map(i => <td key={i}>{mentorGrading?.initials?.student?.[i] || ''}</td>)}
              </tr>
              <tr>
                 <td style={{textAlign: 'left', padding: '5px', fontWeight:'bold'}}>Initial of Mentor</td>
                 {[0,1,2,3,4,5,6,7].map(i => <td key={i}>{mentorGrading?.initials?.mentor?.[i] || ''}</td>)}
              </tr>
              <tr>
                 <td style={{textAlign: 'left', padding: '5px', fontWeight:'bold'}}>Remarks</td>
                 {[0,1,2,3,4,5,6,7].map(i => <td key={`rem-${i}`}>{mentorGrading?.remarks?.[i] || ''}</td>)}
              </tr>
           </tbody>
        </table>

        {/* Phase 4 Higher Education / Placement */}
        <div style={{marginTop: '25px', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px'}}>Higher Education / Placement</div>
        <table className="form-table" style={{borderCollapse: 'collapse', width: '100%', fontSize: '12px', textAlign: 'left', minHeight: '50px'}}>
          <tbody>
            <tr>
              <td style={{width: '50%', padding: '10px', verticalAlign: 'top'}}>
                <strong>Placement Details:</strong> <br/><br/>
                {mentorGrading?.placement?.companyName ? `${mentorGrading.placement.companyName} (${mentorGrading.placement.jobRole}) - ${mentorGrading.placement.package} LPA` : ''}
              </td>
              <td style={{width: '50%', padding: '10px', verticalAlign: 'top'}}>
                <strong>Gate CAT/ MAT/ GMAT/ GRE/ TOEFEL/ IELTS/ IF ANY:</strong> <br/><br/>
                {(mentorGrading?.higherEducation?.universityName) ? `${mentorGrading.higherEducation.universityName} (${mentorGrading.higherEducation.courseName}, ${mentorGrading.higherEducation.country})` : ''}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{marginTop: '35px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', paddingRight: '10px'}}>
           Signature of the HOD
        </div>

      </div>
    </Box>
  );
};

export default ConsolidatedCounselingForm;
