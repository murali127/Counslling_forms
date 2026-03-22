import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";

function CreateAdmin() {
  const navigate = useNavigate();
  const [superadminDept, setSuperadminDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ 
    employee_name: "", 
    employee_id: "", 
    department: "", 
    email: ""
  });

  // Fetch superadmin's department on mount
  useEffect(() => {
    const fetchSuperadminDept = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await apiClient.get("/api/auth/user", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('[CreateAdmin] Auth user response:', response.data);
        
        if (response.data.departmentId) {
          // Fetch department name
          const deptResponse = await apiClient.get(`/api/principal/departments/${response.data.departmentId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('[CreateAdmin] Department fetched:', deptResponse.data);
          setSuperadminDept(deptResponse.data.name);
          // Auto-fill department
          setFormData(prev => ({ ...prev, department: deptResponse.data.name }));
        } else {
          setError("Your user account doesn't have a department assigned");
        }
      } catch (err) {
        console.error("Error fetching department:", err);
        setError("Failed to load your department");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuperadminDept();
  }, []);

  const handleSubmit = e => {
    e.preventDefault();
    
    if (!formData.employee_name || !formData.employee_id || !formData.email) {
      setError('Please fill in all fields');
      return;
    }

    console.log(`[CreateAdmin] Form dept: "${formData.department}" | State dept: "${superadminDept}"`);

    if (formData.department !== superadminDept) {
      setError(`Department must be ${superadminDept}`);
      return;
    }

    setLoading(true);
    apiClient.post("/api/superadmin/admins", formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
    })
    .then((response) => {
      alert(`Admin created! ID: ${response.data.admin._id}`);
      navigate("/superadmin/admins");
    })
    .catch(err => {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create admin');
    })
    .finally(() => setLoading(false));
  };

  if (loading) {
    return <div><button onClick={() => navigate("/superadmin/dashboard")}>Back to Dashboard</button><p>Loading...</p></div>;
  }

  return (
    <div>
      <button onClick={() => navigate("/superadmin/dashboard")} style={{ marginBottom: "10px" }}>Back to Dashboard</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>Create Admin for {superadminDept}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Employee Name:</label><br />
          <input 
            type="text"
            placeholder="Name" 
            value={formData.employee_name}
            onChange={e => setFormData({ ...formData, employee_name: e.target.value })}
            required
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Employee ID:</label><br />
          <input 
            type="text"
            placeholder="ID" 
            value={formData.employee_id}
            onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
            required
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Department (Auto-filled):</label><br />
          <input 
            type="text"
            value={formData.department}
            disabled
            style={{ backgroundColor: 'rgba(71,85,105,0.20)', color: 'rgba(255,255,255,0.40)', cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.12)' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label><br />
          <input 
            type="email"
            placeholder="Email" 
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Admin'}
        </button>
      </form>
    </div>
  );
}

export default CreateAdmin;
