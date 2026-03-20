import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../apiClient';
import gvplog from '../images/gvplogo.jpg';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const issignupPage = location.pathname === '/signup';
  const isAuthenticated = localStorage.getItem('authToken');
  const [user, setUser] = useState({ name: '', email: '', profilePicture: '', profileCompletion: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const hideTranslationBar = () => {
    setTimeout(() => {
      // Add all the requested styles dynamically
      const style = document.createElement('style');
      style.innerHTML = `
      iframe.goog-te-banner-frame {
        display: none !important;
      }
      .skiptranslate {
        font-size: 0rem !important;
      }
      .skiptranslate > span {
        display: none !important;
      }
      #google_translate_element {
        margin-right: 10px;
        display: flex !important;
        align-items: center !important;
      }
      #goog-gt-tt {
        display: none !important;
      }
      .goog-te-banner-frame {
        display: none !important;
      }
      body {
        top: 0 !important;
      }
      .goog-te-gadget {
        color: transparent !important;
      }
      .goog-te-combo {
        padding: 4px;
        border-radius: 4px;
        border: 1px solid #ccc;
      }
      /* New styles for pill shape and custom icon */
      .goog-te-gadget-simple {
        border-radius: 50px !important; /* Pill shape */
        padding: 4px 8px !important;
        background-color: #f8f8f8 !important;
        border: 1px solid #ddd !important;
      }
      .goog-te-gadget-icon {
        background-image: url(${gvplog}) !important;
        background-size: contain !important;
        background-repeat: no-repeat !important;
        background-position: center !important;
        width: 24px !important;
        height: 24px !important;
        margin-right: 8px !important;
      }
      .goog-te-gadget-icon img {
        display: none !important; /* Hide default Google icon */
      }
    `;
    document.head.appendChild(style);

      // Additional hiding logic for iframes
      const elements = document.getElementsByClassName("skiptranslate");
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element.tagName === "IFRAME") {
          element.style.display = "none";
        }
      }
    }, 1000);
  };

  // Load user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return;
      }

      try {
        const response = await apiClient.get('/api/auth/user', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        setUser({
          name: response.data.username || 'User',
          email: response.data.email || 'Not Available',
          profilePicture: response.data.profilePicture || '',
          profileCompletion: response.data.role === 'master' ? 100 : (response.data.profileCompletion || 0),
        });
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    if (isAuthenticated) {
      fetchUserDetails();
    }
  }, [isAuthenticated]);

  // Load Google Translate widget
  useEffect(() => {
    if (window.google && window.google.translate) {
      initializeTranslate();
      return;
    }

    const scriptId = 'google-translate-script';
    const existingScript = document.getElementById(scriptId);
    
    if (existingScript) {
      if (window.googleTranslateElementInit) return;
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onerror = () => console.error('Failed to load Google Translate script');
      document.body.appendChild(script);
    }

    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        initializeTranslate();
        hideTranslationBar();
      }
    };

    return () => {
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

  const initializeTranslate = () => {
    try {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,hi,mr,gu,te,kn,ta,pa,ml',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    } catch (error) {
      console.error('Error initializing Google Translate:', error);
    }
  };

  const handleRegisterLogin = () => navigate('/signup');
  const handleProfileClick = () => { setIsDropdownOpen(!isDropdownOpen); };
  
  const handleDropdownProfile = () => {
    navigate('/profile');
    setIsDropdownOpen(false);
  };

  const handleDropdownDashboard = () => {
    handleLogoClick(); 
    setIsDropdownOpen(false);
  };

  const handleDropdownLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('role');
    setIsDropdownOpen(false);
    navigate('/landingpage');
    window.location.reload();
  };
  const handleLogoClick = () => {
    if (isAuthenticated) {
      const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
      if (userRole === 'superadmin') navigate('/superadmin-panel');
      else if (userRole === 'principal') navigate('/principal/dashboard');
      else if (userRole === 'master') navigate('/master/dashboard');
      else if (userRole === 'admin') navigate('/admin-panel');
      else navigate('/dashboard');
    } else {
      navigate('/landingpage');
    }
  };

  const styles = {
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 20px',
      backgroundColor: '#f4f4f4',
      borderBottom: '2px solid #ccc',
      position: 'relative',
      zIndex: 1000,
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
    },
    logoImage: {
      width: '50px',
      height: '50px',
      objectFit: 'cover',
      borderRadius: '50%',
      marginRight: '10px',
    },
    heading: {
      fontWeight: 'bold',
      fontSize: '30px',
      margin: 0,
      flex: 1,
      textAlign: 'center',
    },
    translator: {
      display: 'flex',
      alignItems: 'center',
      minWidth: '120px',
      height: '40px',
    },
    profileContainer: { position: 'relative',
      cursor: 'pointer',
    },
    profileImage: {
      width: '40px',
      height: '40px',
      objectFit: 'cover',
      borderRadius: '50%',
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '1rem',
    },
  };

  return (
    <header style={styles.header}>
      {/* Logo */}
      <div style={styles.logoContainer} onClick={handleLogoClick}>
        <img src={gvplog} alt="GVP Logo" style={styles.logoImage} />
      </div>

      {/* Heading */}
      <h1 style={styles.heading}>
        GAYATRI VIDYAPARISHAD COLLEGE OF ENGINEERING (AUTONOMOUS)
      </h1>

      {/* Google Translate Widget */}
      <div id="google_translate_element" style={styles.translator}></div>

      {/* Register/Login or Profile */}
      {issignupPage ? (
        <img src={gvplog} alt="GVP Logo" style={styles.logoImage} />
      ) : !isAuthenticated ? (
        <button onClick={handleRegisterLogin} style={styles.button}>
          Register / Login
        </button>
      ) : (
        <div style={styles.profileContainer}>      
          
          <div style={{ position: 'relative', display: 'inline-block', width: '40px', height: '40px', cursor: 'pointer' }} onClick={handleProfileClick}>
            <div style={{
              position: 'absolute', top: '-4px', left: '-4px', right: '-4px', bottom: '-4px', borderRadius: '50%',
              background: `conic-gradient(#4caf50 ${Math.min(user.profileCompletion || 0, 100)}%, transparent 0)`, zIndex: 0
            }}></div>
            <div style={{ position: 'relative', zIndex: 1, backgroundColor: 'white', width: '100%', height: '100%', borderRadius: '50%', padding: '2px' }}>
              <img
                src={user.profilePicture || 'default-profile.png'}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            </div>
          </div>

          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '50px',
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '5px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              minWidth: '150px',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <button 
                onClick={handleDropdownProfile}
                style={{ padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #eee', width: '100%' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f4f4f4'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                My Profile
              </button>
              <div style={{ padding: '10px 15px', color: '#666', fontSize: '0.85rem', borderBottom: '1px solid #eee' }}>
                Profile Completion: {user.profileCompletion}%
                <div style={{ height: '5px', background: '#e0e0e0', borderRadius: '5px', marginTop: '5px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#4caf50', width: `${user.profileCompletion}%` }}></div>
                </div>
              </div>
              <button 
                onClick={handleDropdownDashboard}
                style={{ padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #eee', width: '100%' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f4f4f4'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Dashboard
              </button>
              <button 
                onClick={handleDropdownLogout}
                style={{ padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: '#dc3545', width: '100%' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f4f4f4'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;