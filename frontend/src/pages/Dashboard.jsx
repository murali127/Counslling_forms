import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({  
    name: '', 
    email: '', 
    profilePicture: '',
    role: '', profileCompletion: 0, assignedMentor: null });

  useEffect(() => {
    const fetchUserDetails = async () => {
      const authToken = localStorage.getItem('authToken');
    
      if (!authToken) {
        navigate('/signup');
        
        return;
      }
    
      try {
        // Fetch user details from the backend
        const response = await apiClient.get('/api/auth/user', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
    
        let displayName = response.data.username || 'User';
        let profilePicture = '';
        
        // Try to fetch profile to get the name and picture from there
        try {
          const profileResponse = await apiClient.get('/api/profile', {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          
          if (profileResponse.data.success && profileResponse.data.profile) {
            // Use profile name if it exists
            if (profileResponse.data.profile.name) {
              displayName = profileResponse.data.profile.name;
            }
            // Use profile picture if it exists
            if (profileResponse.data.profile.profilePicture) {
              profilePicture = profileResponse.data.profile.profilePicture;
            }
          }
        } catch (profileError) {
          // Profile doesn't exist yet, that's OK - use username
          console.log("No profile found, using username");
        }
        
        // Update the user state with backend data
        setUser({
          name: displayName,
          email: response.data.email || 'Not Available',
          profilePicture: profilePicture || response.data.profilePicture || '',
          role: response.data.role || 'user', 
          profileCompletion: response.data.profileCompletion || 0, 
          assignedMentor: response.data.assignedMentor 
        });

        // Update localStorage with the latest role
        localStorage.setItem('userRole', response.data.role || 'user');
      } catch (error) {
        console.error('Error fetching user details:', error);
        if (error.response?.status === 401) {
          navigate('/signup');
        }
      }
    };
    
    fetchUserDetails();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.clear();
    // Also clear any sessionStorage if used
    sessionStorage.clear();
    navigate('/signup');
  };

  return (
    <div style={styles.container}>
      {/* Left Profile Card */}
      <div style={styles.profileCard}>
        <div
          style={{
            ...styles.profileImage,
            backgroundImage: user.profilePicture ? `url(${user.profilePicture})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        <h2 style={styles.bigText}>Hello, {user.name}!</h2>
        <p style={styles.smallText}>{user.email}</p>
        <div style={styles.stats}>
          <p><strong>🎓 Role:</strong> {user.role === 'user' ? 'Student' : user.role === 'admin' ? 'Admin' : user.role === 'superadmin' ? 'Super Admin' : user.role === 'principal' ? 'Principal' : user.role === 'master' ? 'Master' : user.role}</p>
          <p><strong>📊 Profile Score:</strong> {user.profileCompletion}% Complete</p>
          <p><strong>🛡️ Account:</strong> Active</p>
          {user.assignedMentor && (
            <p><strong>👨‍🏫 Assigned Mentor:</strong> {user.assignedMentor.username} ({user.assignedMentor.email})</p>
          )}
        </div>
      </div>

      {/* Right Content Section */}
      <div style={styles.content}>
        <h1 style={styles.heading}>Welcome to your Dashboard</h1>
        <p style={styles.subHeading}>One place to manage your profile, track progress, and explore more.</p>
        <p style={styles.description}>
          Customize your experience, stay updated, and unlock exclusive features tailored for you.
        </p>
        <div style={styles.buttonGroup}>
          <button onClick={handleLogout} style={styles.button}>Log Out</button>
          <button onClick={() => navigate('/profile')} style={styles.buttonSecondary}>My Profile</button>
          <button onClick={() => navigate('/attendance')} style={styles.buttonTertiary}>Attendance</button>
          <button onClick={() => navigate('/semester')} style={styles.buttonTertiary}>Semester Marks</button>
          <button onClick={() => navigate('/mentorgrade')} style={styles.buttonTertiary}>Mentor Grading</button>
          
          {user.role === 'admin' && (
            <button onClick={() => navigate('/admin-panel')} style={{
              ...styles.button,
              backgroundColor: '#9c27b0',
              boxShadow: '0 4px 10px rgba(156, 39, 176, 0.3)',
            }}>
              Admin Panel
            </button>
          )}

          {user.role === 'superadmin' && (
            <button onClick={() => navigate('/superadmin-panel')} style={{
              ...styles.button,
              backgroundColor: '#f44336',
              boxShadow: '0 4px 10px rgba(244, 67, 54, 0.3)',
            }}>
              Super Admin Panel
            </button>
          )}

          {user.role === 'principal' && (
            <button onClick={() => navigate('/principal/dashboard')} style={{
              ...styles.button,
              backgroundColor: '#4caf50',
              boxShadow: '0 4px 10px rgba(76, 175, 80, 0.3)',
            }}>
              Principal Panel
            </button>
          )}

          {user.role === 'master' && (
            <button onClick={() => navigate('/master/dashboard')} style={{
              ...styles.button,
              backgroundColor: '#ff9800',
              boxShadow: '0 4px 10px rgba(255, 152, 0, 0.3)',
            }}>
              Master Panel
            </button>
          )}
        </div>
      </div>

      {/* Background Decorations */}
      <div style={styles.circleOne}></div>
      <div style={styles.circleTwo}></div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    width: '100%',
    height: '80vh',
    backgroundColor: 'rgba(10,15,26,1)',
    fontFamily: "'Poppins', sans-serif",
    position: 'relative',
    padding: '20px',
  },
  profileCard: {
    width: '320px',
    background: 'linear-gradient(135deg, #007bff, #ff007f, #ff8c00)',
    borderRadius: '20px',
    padding: '35px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    color: '#fff',
    textAlign: 'center',
  },
  profileImage: {
    width: '110px',
    height: '110px',
    borderRadius: '50%',
    backgroundColor: '#d3d3d3',
    marginBottom: '15px',
  },
  bigText: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  smallText: {
    fontSize: '14px',
    opacity: '0.9',
    marginBottom: '15px',
  },
  stats: {
    fontSize: '16px',
    lineHeight: '1.6',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingLeft: '60px',
  },
  heading: {
    fontSize: '55px',
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: '10px',
  },
  subHeading: {
    fontSize: '22px',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.70)',
    marginBottom: '15px',
  },
  description: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.55)',
    maxWidth: '550px',
    marginBottom: '30px',
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
  },
  button: {
    padding: '14px 28px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    cursor: 'pointer',
    transition: '0.3s ease-in-out',
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(0, 123, 255, 0.3)',
  },
  buttonSecondary: {
    padding: '14px 28px',
    backgroundColor: '#ff007f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    cursor: 'pointer',
    transition: '0.3s ease-in-out',
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(255, 0, 127, 0.3)',
  },
  buttonTertiary: {
    padding: '14px 28px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    cursor: 'pointer',
    transition: '0.3s ease-in-out',
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(40, 167, 69, 0.3)',
  },
  circleOne: {
    position: 'absolute',
    top: '8%',
    right: '12%',
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00d4ff, #008cff)',
    opacity: '0.3',
    animation: 'float 4s infinite alternate',
  },
  circleTwo: {
    position: 'absolute',
    bottom: '8%',
    left: '5%',
    width: '110px',
    height: '110px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff8c00, #ff007f)',
    opacity: '0.4',
    animation: 'float 5s infinite alternate',
  },
};

export default Dashboard;