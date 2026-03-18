import React from 'react';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import Header from './components/Header';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MarksTable from './pages/MarksTable';
import CounselingForm from './pages/CounselingForm';
import MentorGrading from './pages/MentorGrading';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminUserManagement from './admin/pages/AdminUserManagement';
import AdminDataOverview from './admin/pages/AdminDataOverview';
import ConsolidatedCounselingForm from './admin/pages/ConsolidatedCounselingForm';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ActivateAccount from './pages/ActivateAccount';
import SuperAdminDashboard from './admin/components/SuperAdminDashboard';
import ManageAdmins from './admin/components/ManageAdmins';
import CreateAdmin from './admin/components/CreateAdmin';
import StudentsList from './admin/components/StudentsList';
import StudentProfile from './admin/components/StudentProfile';
import OverallReports from './admin/components/OverallReports';
import MentorAllocation from './admin/components/MentorAllocation';
import PeopleOverview from './admin/components/PeopleOverview';
import PrincipalDashboard from './admin/components/PrincipalDashboard';
import MasterDashboard from './admin/components/MasterDashboard';


// Protected Route Component
const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  return isAuthenticated ? element : <Navigate to="/signup" />;
};

// Admin Protected Route Component
const AdminRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
  return isAuthenticated && (userRole === 'admin' || userRole === 'superadmin') ? element : <Navigate to="/dashboard" />;
};

// SuperAdmin Protected Route Component
const SuperAdminRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
  return isAuthenticated && userRole === 'superadmin' ? element : <Navigate to="/dashboard" />;
};

// Principal Protected Route Component
const PrincipalRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
  return isAuthenticated && userRole === 'principal' ? element : <Navigate to="/dashboard" />;
};

// Master Protected Route Component
const MasterRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
  return isAuthenticated && userRole === 'master' ? element : <Navigate to="/dashboard" />;
};

const App = () => {
  return (
    <>
      <Router>
        <Header />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/landingpage" />} />
          <Route path="/landingpage" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/activate-account/:token" element={<ActivateAccount />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/profile/:regdNo" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/counseling-form" element={<ProtectedRoute element={<CounselingForm />} />} />
          <Route path="/semester" element={<ProtectedRoute element={<MarksTable />} />} />
          <Route path="/semester/:email" element={<ProtectedRoute element={<MarksTable />} />} />
          <Route path="/mentorgrade" element={<ProtectedRoute element={<MentorGrading />} />} />
          <Route path="/mentorgrade/:email" element={<ProtectedRoute element={<MentorGrading />} />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />
          <Route path="/admin/users" element={<AdminRoute element={<AdminUserManagement />} />} />
          <Route path="/admin/data" element={<AdminRoute element={<AdminDataOverview />} />} />
          <Route path="/admin/consolidated-form/:regdNo" element={<AdminRoute element={<ConsolidatedCounselingForm />} />} />

          {/* Superadmin Routes */}
          <Route path="/superadmin/dashboard" element={<SuperAdminRoute element={<SuperAdminDashboard />} />} />
          <Route path="/superadmin/admins" element={<SuperAdminRoute element={<ManageAdmins />} />} />
          <Route path="/superadmin/admins/create" element={<SuperAdminRoute element={<CreateAdmin />} />} />
          <Route path="/superadmin/students" element={<SuperAdminRoute element={<StudentsList />} />} />
          <Route path="/superadmin/students/:id" element={<SuperAdminRoute element={<StudentProfile />} />} />
          <Route path="/superadmin/reports" element={<SuperAdminRoute element={<OverallReports />} />} />
          <Route path="/superadmin/allocation" element={<SuperAdminRoute element={<MentorAllocation />} />} />
          <Route path="/superadmin/overview" element={<SuperAdminRoute element={<PeopleOverview />} />} />

          {/* Principal Routes */}
          <Route path="/principal/dashboard" element={<PrincipalRoute element={<PrincipalDashboard />} />} />

          {/* Master Routes */}
          <Route path="/master/dashboard" element={<MasterRoute element={<MasterDashboard />} />} />

          
        </Routes>
        <Footer />
      </Router>
    </>
  );
};

export default App;