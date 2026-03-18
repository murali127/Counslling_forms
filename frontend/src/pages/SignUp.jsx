import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserGraduate } from 'react-icons/fa'; // Import an icon from react-icons
import apiClient from '../apiClient';
import './css/SignUp.css'; // Import CSS file

const Auth = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const images = [
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/18.jpg",
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/19.jpg",
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/20.jpg",
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/21.jpg",
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/22.jpg",
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/23.jpg",
  ];

  // Automatically cycle through images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  // Focus the first input when the form toggles
  useEffect(() => {
    if (formRef.current) {
      const inputs = formRef.current.querySelectorAll('input');
      inputs[0]?.focus(); // Focus the first input
    }
  }, [isSignUp]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError(''); // Clear error on input change
  };

  // Handle keyboard navigation (ArrowUp and ArrowDown)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const inputs = formRef.current.querySelectorAll('input');
      const currentIndex = Array.from(inputs).indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        const nextIndex = (currentIndex + 1) % inputs.length;
        inputs[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        const prevIndex = (currentIndex - 1 + inputs.length) % inputs.length;
        inputs[prevIndex]?.focus();
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    // If signing up, ensure students use college domain email (e.g., 322103311030@gvpce.ac.in)
    if (isSignUp) {
      const studentEmailRegex = /^\d+@gvpce\.ac\.in$/i;
      if (!studentEmailRegex.test(formData.email)) {
        setError('Please use your college email (e.g. 322103311030@gvpce.ac.in)');
        return;
      }
    }

    try {
      const body = isSignUp
        ? {
            username: formData.fullName,
            email: formData.email,
            password: formData.password,
          }
        : {
            email: formData.email,
            password: formData.password,
          };

      const endpoint = `/api/auth/${isSignUp ? 'signup' : 'signin'}`;
      const { data } = await apiClient.post(endpoint, body);

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', data.role);   // role stored here
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userName', data.username);

      if (data.role === 'superadmin') {
        navigate('/superadmin/dashboard');
      } else if (data.role === 'admin') {
          navigate('/admin');
        } else if (data.role === 'master') {
        navigate('/master/dashboard');
      } else {
        navigate('/dashboard'); 
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Server error, please try again later';
      setError(message);
    }
  };

  return (
    <div className="auth-container">
      {/* Background Image Slideshow */}
      <div className="auth-background">
        <img src={images[currentImage]} alt="Slideshow" className="auth-image" />
      </div>

      {/* Form Container */}
      <div className={`auth-form-container ${isSignUp ? 'signup' : 'signin'}`}>
        <div className="auth-form-wrapper">
          {/* Left Side (70% - Form) */}
          <div className="auth-form-main">
            <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleSubmit} className="auth-form" ref={formRef} onKeyDown={handleKeyDown}>
              {isSignUp && (
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="auth-input"
                  required
                />
              )}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="auth-input"
                required
              />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="auth-input"
                required
              />
              {isSignUp && (
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="auth-input"
                  required
                />
              )}
              <button type="submit" className="auth-button">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
              {!isSignUp && (
                <div style={{ textAlign: 'right', marginTop: '8px', marginBottom: '16px' }}>
                  <Link to="/forgot-password" style={{ textDecoration: 'none', color: '#e50914' }}>
                    Forgot password?
                  </Link>
                </div>
              )}
            </form>
          </div>

          {/* Right Side (30% - Redirection Div) */}
          <div className="auth-form-side">
            <div className="auth-form-icon">
              <FaUserGraduate size={50} color="#e50914" />
            </div>
            <h2>{isSignUp ? 'Already have an account?' : 'Don’t have an account?'}</h2>
            <div
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                padding: '1cm',
                cursor: 'pointer',
                display: 'inline-block',
                textAlign: 'center'
              }}
            >
              <p style={{ margin: 0 }}>{isSignUp ? 'Sign In' : 'Create One'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
