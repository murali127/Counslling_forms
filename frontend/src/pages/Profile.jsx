import React, { useState, useEffect } from "react";
import apiClient from "../apiClient";
import { useNavigate } from "react-router-dom";
import "./css/Profile.css"; // We'll create this CSS file separately

const Profile = () => {
  const [profile, setProfile] = useState(null);
  
  const initialProfileState = {
    name: "",
    regdNo: "",
    department: "",
    mobileNumber: "",
    email: "",
    admissionType: "Convener",
    caste: "",
    rank: "",
    dob: "",
    bloodGroup: "",
    tenthMarks: { obtained: "", max: "", percentage: "" },
    interDiplomaMarks: { obtained: "", max: "", percentage: "" },
    parentDetails: { name: "", address: "", occupation: "", contactNumber: "", email: "" },
    localGuardian: { name: "", address: "", contactNumber: "" },
    hobbies: [],
    participation: { gamesAndActivities: [], literary: [], technical: [] },
    profilePicture: "",
  };

  const [formData, setFormData] = useState(() => {
    const savedDraft = sessionStorage.getItem('profileFormDraft');
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    return initialProfileState;
  });

const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing || isNewUser) {
      sessionStorage.setItem("profileFormDraft", JSON.stringify(formData));
    }
  }, [formData, isEditing, isNewUser]);


  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("authToken");
      let accountSeed = null;
      if (!token) {
        navigate("/signup");
        return;
      }

      try {
        const userResponse = await apiClient.get("/api/auth/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("User role:", userResponse.data.role);
        setUserRole(userResponse.data.role || "");

        accountSeed = {
          name: userResponse.data.username || '',
          email: userResponse.data.email || ''
        };

        if (userResponse.data.role === 'master') {
          setProfile(accountSeed);
          setFormData((prev) => ({
            ...prev,
            ...accountSeed
          }));
          setIsNewUser(false);
          setIsLoading(false);
          return;
        }

        const response = await apiClient.get("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.profile) {
          console.log("Profile loaded:", response.data.profile);
          setProfile(response.data.profile);
          // Merge profile data with initial state to ensure all fields exist
          setFormData(prev => ({
            ...prev,
            ...response.data.profile
          }));
          setIsNewUser(false);
        } else {
          console.log("No profile found, new user");
          setIsNewUser(true);
        }
        
        // If new user, also set email
        if (!response.data.success || !response.data.profile) {
          const derivedRegdNo = String(userResponse.data.email || '').split('@')[0] || '';
          setFormData(prev => ({
            ...prev,
            name: prev.name || accountSeed.name,
            email: userResponse.data.email || "",
            regdNo: prev.regdNo || derivedRegdNo
          }));
          if (userResponse.data.role === 'principal') {
            setProfile((prev) => ({
              ...(prev || {}),
              ...accountSeed
            }));
          }
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log("Profile not found (404)");
          setIsNewUser(true);
          if (accountSeed) {
            setProfile((prev) => ({
              ...(prev || {}),
              ...accountSeed
            }));
            setFormData((prev) => ({
              ...prev,
              ...accountSeed,
              regdNo: prev.regdNo || String(accountSeed.email || '').split('@')[0]
            }));
          }
        } else {
          setError("Error fetching profile. Please try again.");
          console.error("Profile fetch error:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleArrayChange = (parent, field, value) => {
    const arrayValue = value.split(",").map(item => item.trim());
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: arrayValue }
    }));
  };

  // Function to determine if a field should be disabled
  const isFieldDisabled = (fieldName) => {
    // If not in editing mode, freeze all fields
    if (!isEditing && !isNewUser) {
      return true;
    }
    
    // Fields that are always editable when in edit/new mode
    const alwaysEditableFields = ['name', 'mobileNumber', 'bloodGroup', 'profilePicture', 'dob'];
    
    // Check if field is in allowed list
    if (alwaysEditableFields.includes(fieldName)) {
      return false;
    }

    // New students must be able to set/adjust regdNo on first profile creation
    if (fieldName === 'regdNo') {
      return !(isNewUser && userRole === 'user');
    }
    
    // Department is editable for superadmin only
    if (fieldName === 'department') {
      return userRole !== 'superadmin';
    }
    
    // All other fields should be disabled
    return true;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double click
    
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/signup");
      return;
    }
  
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      // Validate required fields
      const requiredFields = ['name', 'email'];
      if (userRole === 'user') {
        requiredFields.push('regdNo');
      }
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        const fieldNames = missingFields.map(field => 
          field === 'regdNo' ? 'Registration Number' : field.charAt(0).toUpperCase() + field.slice(1)
        ).join(', ');
        throw new Error(`${fieldNames} ${missingFields.length === 1 ? 'is' : 'are'} required`);
      }
  
      // Clean up form data before sending
      const dataToSend = {
        ...formData,
        // Remove any fields that shouldn't be updated
        userId: undefined,
        regdNo: isNewUser ? formData.regdNo : undefined,
        email: isNewUser ? formData.email : undefined
      };
      
      // Fix Date/time parsing mismatch (DD/MM vs MM/DD) 
      if (dataToSend.dob) {
        const dObj = new Date(dataToSend.dob);
        if (!isNaN(dObj.getTime())) {
          dataToSend.dob = dObj.toISOString().split('T')[0];
        }
      }
  
      let response;
      if (isNewUser) {
        response = await apiClient.post(
          "/api/profile",
          dataToSend,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await apiClient.patch(
          "/api/profile",
          dataToSend,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
  
      // Handle both response formats (POST returns 'profile', PATCH returns 'profile' in data)
      const updatedProfile = response.data.profile || response.data;
      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setIsNewUser(false);
      setIsEditing(false);
      setError("");
      sessionStorage.removeItem('profileFormDraft');
      setSuccessMessage("Profile saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      // Better error message handling
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.message || 
                          "Failed to save profile. Please check your data.";
      setError(errorMessage);
      
      // If it's a validation error, show more details
      if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors)
          .map(err => err.message)
          .join(", ");
        setError(`Validation errors: ${validationErrors}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="loading-spinner"></div>;
  }

  if (userRole === 'master') {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <h1>Master Profile</h1>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="profile-content">
          <div className="card" style={{ width: '100%' }}>
            <h3>Basic Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input value={formData.name || ''} disabled className="disabled-input" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input value={formData.email || ''} disabled className="disabled-input" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === 'principal') {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <h1>Principal Profile</h1>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/principal-panel')}
          >
            Back to Principal Panel
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message" style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '5px', marginBottom: '15px' }}>{successMessage}</div>}

        <div className="profile-content">
          <div className="card" style={{ width: '100%' }}>
            <h3>Basic Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing && !isNewUser}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  disabled
                  className="disabled-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  name="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing && !isNewUser}
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  name="dob"
                  type="date"
                  value={formData.dob || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing && !isNewUser}
                />
              </div>
            </div>

            <div className="profile-actions" style={{ marginTop: '20px' }}>
              {!isEditing && !isNewUser ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              ) : (
                <div className="action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      if (isNewUser) {
                        setFormData((prev) => ({
                          ...prev,
                          name: profile?.name || prev.name || '',
                          email: profile?.email || prev.email || '',
                          mobileNumber: '',
                          dob: ''
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          name: profile?.name || '',
                          email: profile?.email || '',
                          mobileNumber: profile?.mobileNumber || '',
                          dob: profile?.dob || ''
                        }));
                        setIsEditing(false);
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch(activeTab) {
      case 'basic':
        return (
          <div className="tab-content">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name-input">Name: <span style={{color: 'red'}}>*</span></label>
                <input
                  id="name-input"
                  name="name"
                  type="text"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  disabled={isFieldDisabled('name')}
                  placeholder="Enter your name"
                  style={{ display: 'block' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="regdno-input">Registration Number:</label>
                <input
                  id="regdno-input"
                  name="regdNo"
                  type="text"
                  value={formData.regdNo || ''}
                  onChange={handleInputChange}
                  disabled={isFieldDisabled('regdNo')}
                  placeholder="Enter registration number"
                  style={{ display: 'block' }}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department-input">Department:</label>
                <input
                  id="department-input"
                  name="department"
                  type="text"
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  disabled={isFieldDisabled('department')}
                  placeholder="Enter department name"
                  style={{ display: 'block' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="mobile-input">Mobile Number:</label>
                <input
                  id="mobile-input"
                  name="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber || ''}
                  onChange={handleInputChange}
                  disabled={isFieldDisabled('mobileNumber')}
                  placeholder="Enter mobile number"
                  style={{ display: 'block' }}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Email:</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled // Email comes from user account
                  className="disabled-input"
                />
              </div>
              <div className="form-group">
                <label>Admission Type:</label>
                <select
                  name="admissionType"
                  value={formData.admissionType}
                  onChange={handleInputChange}
                  disabled={isFieldDisabled('admissionType')}
                >
                  <option value="Convener">Convener</option>
                  <option value="Management">Management</option>
                  <option value="Category-B">Category-B</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Caste:</label>
                <input
                  name="caste"
                  value={formData.caste}
                  onChange={handleInputChange}
                  disabled={isFieldDisabled('caste')}
                />
              </div>
              <div className="form-group">
                <label>Rank:</label>
                <input
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  disabled={isFieldDisabled('rank')}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dob-input">Date of Birth:</label>
                <input
                  id="dob-input"
                  name="dob"
                  type="date"
                  value={formData.dob || ''}
                  onChange={handleInputChange}
                  disabled={isFieldDisabled('dob')}
                  style={{ display: 'block' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="bloodgroup-input">Blood Group:</label>
                <input
                  id="bloodgroup-input"
                  name="bloodGroup"
                  type="text"
                  value={formData.bloodGroup || ''}
                  onChange={handleInputChange}
                  disabled={isFieldDisabled('bloodGroup')}
                  placeholder="e.g., O+, A-, B+"
                  style={{ display: 'block' }}
                />
              </div>
            </div>
          </div>
        );
      
      case 'academic':
        return (
          <div className="tab-content">
            <div className="card">
              <h3>10th Marks</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Obtained:</label>
                  <input
                    type="number"
                    value={formData.tenthMarks.obtained}
                    onChange={(e) => handleNestedChange("tenthMarks", "obtained", e.target.value)}
                    disabled={isFieldDisabled('tenthMarks')}
                  />
                </div>
                <div className="form-group">
                  <label>Max:</label>
                  <input
                    type="number"
                    value={formData.tenthMarks.max}
                    onChange={(e) => handleNestedChange("tenthMarks", "max", e.target.value)}
                    disabled={isFieldDisabled('tenthMarks')}
                  />
                </div>
                <div className="form-group">
                  <label>Percentage:</label>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      value={formData.tenthMarks.percentage}
                      onChange={(e) => handleNestedChange("tenthMarks", "percentage", e.target.value)}
                      disabled={isFieldDisabled('tenthMarks')}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <h3>Inter/Diploma Marks</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Obtained:</label>
                  <input
                    type="number"
                    value={formData.interDiplomaMarks.obtained}
                    onChange={(e) => handleNestedChange("interDiplomaMarks", "obtained", e.target.value)}
                    disabled={isFieldDisabled('interDiplomaMarks')}
                  />
                </div>
                <div className="form-group">
                  <label>Max:</label>
                  <input
                    type="number"
                    value={formData.interDiplomaMarks.max}
                    onChange={(e) => handleNestedChange("interDiplomaMarks", "max", e.target.value)}
                    disabled={isFieldDisabled('interDiplomaMarks')}
                  />
                </div>
                <div className="form-group">
                  <label>Percentage:</label>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      value={formData.interDiplomaMarks.percentage}
                      onChange={(e) => handleNestedChange("interDiplomaMarks", "percentage", e.target.value)}
                      disabled={isFieldDisabled('interDiplomaMarks')}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'family':
        return (
          <div className="tab-content">
            <div className="card">
              <h3>Parent Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    value={formData.parentDetails.name}
                    onChange={(e) => handleNestedChange("parentDetails", "name", e.target.value)}
                    disabled={isFieldDisabled('parentDetails')}
                  />
                </div>
                <div className="form-group">
                  <label>Occupation:</label>
                  <input
                    value={formData.parentDetails.occupation}
                    onChange={(e) => handleNestedChange("parentDetails", "occupation", e.target.value)}
                    disabled={isFieldDisabled('parentDetails')}
                  />
                </div>
              </div>
              
              <div className="form-group full-width">
                <label>Address:</label>
                <input
                  value={formData.parentDetails.address}
                  onChange={(e) => handleNestedChange("parentDetails", "address", e.target.value)}
                  disabled={isFieldDisabled('parentDetails')}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number:</label>
                  <input
                    value={formData.parentDetails.contactNumber}
                    onChange={(e) => handleNestedChange("parentDetails", "contactNumber", e.target.value)}
                    disabled={isFieldDisabled('parentDetails')}
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    value={formData.parentDetails.email}
                    onChange={(e) => handleNestedChange("parentDetails", "email", e.target.value)}
                    disabled={isFieldDisabled('parentDetails')}
                  />
                </div>
              </div>
            </div>
            
            <div className="card">
              <h3>Local Guardian</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    value={formData.localGuardian.name}
                    onChange={(e) => handleNestedChange("localGuardian", "name", e.target.value)}
                    disabled={isFieldDisabled('localGuardian')}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number:</label>
                  <input
                    value={formData.localGuardian.contactNumber}
                    onChange={(e) => handleNestedChange("localGuardian", "contactNumber", e.target.value)}
                    disabled={isFieldDisabled('localGuardian')}
                  />
                </div>
              </div>
              
              <div className="form-group full-width">
                <label>Address:</label>
                <input
                  value={formData.localGuardian.address}
                  onChange={(e) => handleNestedChange("localGuardian", "address", e.target.value)}
                  disabled={isFieldDisabled('localGuardian')}
                />
              </div>
            </div>
          </div>
        );
        
      case 'extra':
        return (
          <div className="tab-content">
            <div className="card">
              <h3>Hobbies</h3>
              <div className="form-group full-width">
                <label>Hobbies (comma separated):</label>
                <input
                  value={formData.hobbies.join(", ")}
                  onChange={(e) => setFormData({...formData, hobbies: e.target.value.split(",").map(item => item.trim())})}
                  disabled={isFieldDisabled('hobbies')}
                  placeholder="e.g. Reading, Swimming, Chess"
                />
              </div>
            </div>
            
            <div className="card">
              <h3>Extra-Curricular Activities</h3>
              <div className="form-group full-width">
                <label>Games & Activities (comma separated):</label>
                <input
                  value={formData.participation.gamesAndActivities.join(", ")}
                  onChange={(e) => handleArrayChange("participation", "gamesAndActivities", e.target.value)}
                  disabled={isFieldDisabled('participation')}
                  placeholder="e.g. Basketball, Swimming, Drama Club"
                />
              </div>
              <div className="form-group full-width">
                <label>Literary Activities (comma separated):</label>
                <input
                  value={formData.participation.literary.join(", ")}
                  onChange={(e) => handleArrayChange("participation", "literary", e.target.value)}
                  disabled={isFieldDisabled('participation')}
                  placeholder="e.g. Debate, Poetry, Creative Writing"
                />
              </div>
              <div className="form-group full-width">
                <label>Technical Activities (comma separated):</label>
                <input
                  value={formData.participation.technical.join(", ")}
                  onChange={(e) => handleArrayChange("participation", "technical", e.target.value)}
                  disabled={isFieldDisabled('participation')}
                  placeholder="e.g. Robotics, Coding, Electronics"
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{isNewUser ? "Create Profile" : "Student Profile"}</h1>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message" style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '5px', marginBottom: '15px' }}>{successMessage}</div>}
      
      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-picture-container">
            {formData.profilePicture ? (
              <img 
                src={formData.profilePicture} 
                alt="Profile" 
                className="profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">
                {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            
            {(isEditing || isNewUser) && (
              <div className="profile-picture-upload">
                <label className="upload-btn">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({...formData, profilePicture: reader.result});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            )}
          </div>
          
          <div className="profile-actions">
            {!isEditing && !isNewUser ? (
              <button 
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            ) : (
              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Profile"}
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    if (isNewUser) {
                      setFormData({
                        ...formData,
                        email: profile?.email || ""
                      });
                    } else {
                      setFormData(profile);
                      setIsEditing(false);
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          
          <div className="profile-nav">
            <button 
              className={`nav-item ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Details
            </button>
            <button 
              className={`nav-item ${activeTab === 'academic' ? 'active' : ''}`}
              onClick={() => setActiveTab('academic')}
            >
              Academic Details
            </button>
            <button 
              className={`nav-item ${activeTab === 'family' ? 'active' : ''}`}
              onClick={() => setActiveTab('family')}
            >
              Family Information
            </button>
            <button 
              className={`nav-item ${activeTab === 'extra' ? 'active' : ''}`}
              onClick={() => setActiveTab('extra')}
            >
              Extra-Curricular
            </button>
          </div>
        </div>
        
        <div className="profile-details">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;