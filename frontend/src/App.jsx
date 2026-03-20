import React from 'react';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import Header from './components/Header';
import SupportChatWidget from './components/SupportChatWidget';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignUp from './pages/SignUp';
import UserPanel from './pages/UserPanel';
import Profile from './pages/Profile';
import MarksTable from './pages/MarksTable';
import Attendance from './pages/Attendance';
import CounselingForm from './pages/CounselingForm';
import CounselingFormsHub from './pages/CounselingFormsHub';
import MentorGrading from './pages/MentorGrading';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminPanel from './admin/pages/AdminPanel';
import AdminUserManagement from './admin/pages/AdminUserManagement';
import AdminDataOverview from './admin/pages/AdminDataOverview';
import ConsolidatedCounselingForm from './admin/pages/ConsolidatedCounselingForm';
import AdminAccessControl from './admin/pages/AdminAccessControl';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ActivateAccount from './pages/ActivateAccount';
import SuperAdminDashboard from './admin/components/SuperAdminDashboard';
import SuperAdminPanel from './admin/pages/SuperAdminPanel';
import ManageAdmins from './admin/components/ManageAdmins';
import CreateAdmin from './admin/components/CreateAdmin';
import StudentsList from './admin/components/StudentsList';
import StudentProfile from './admin/components/StudentProfile';
import OverallReports from './admin/components/OverallReports';
import MentorAllocation from './admin/components/MentorAllocation';
import PeopleOverview from './admin/components/PeopleOverview';
import PrincipalDashboard from './admin/components/PrincipalDashboard';
import PrincipalPanel from './admin/pages/PrincipalPanel';
import MasterDashboard from './admin/components/MasterDashboard';
import MasterPanel from './admin/pages/MasterPanel';


// Protected Route Component with Role-Based Redirect
const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');

  if (!isAuthenticated) {
    return <Navigate to="/signup" />;
  }

  // Redirect to role-specific panel
  if (!userRole) {
    return <Navigate to="/signup" />;
  }

  return element;
};

// Role-specific dashboard redirect
const RoleDashboardRoute = () => {
  const isAuthenticated = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');

  if (!isAuthenticated) {
    return <Navigate to="/signup" />;
  }

  const rolePanelMap = {
    user: <UserPanel />,
    mentor: <UserPanel />,
    admin: <AdminPanel />,
    superadmin: <SuperAdminPanel />,
    principal: <PrincipalPanel />,
    master: <MasterPanel />
  };

  return rolePanelMap[userRole] || <UserPanel />;
};

const canAccess = (userRole, minimumRole) => {
  const hierarchy = {
    user: 1,
    mentor: 2,
    admin: 3,
    superadmin: 4,
    principal: 5,
    master: 6
  };

  return (hierarchy[userRole] || 0) >= (hierarchy[minimumRole] || 0);
};

// Admin Protected Route Component
const AdminRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
  return isAuthenticated && canAccess(userRole, 'admin') ? element : <Navigate to="/admin-panel" />;
};

// SuperAdmin Protected Route Component
const SuperAdminRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
  return isAuthenticated && canAccess(userRole, 'superadmin') ? element : <Navigate to="/superadmin-panel" />;
};

// Principal Protected Route Component
const PrincipalRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
  return isAuthenticated && canAccess(userRole, 'principal') ? element : <Navigate to="/principal-panel" />;
};

// Master Protected Route Component
const MasterRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
  return isAuthenticated && userRole === 'master' ? element : <Navigate to="/master-panel" />;
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

          {/* Role-Specific Dashboard Routes (Landing Pages) */}
          <Route path="/dashboard" element={<RoleDashboardRoute />} />
          <Route path="/user-panel" element={<ProtectedRoute element={<UserPanel />} />} />
          <Route path="/admin-panel" element={<AdminRoute element={<AdminPanel />} />} />
          <Route path="/superadmin-panel" element={<SuperAdminRoute element={<SuperAdminPanel />} />} />
          <Route path="/principal-panel" element={<PrincipalRoute element={<PrincipalPanel />} />} />
          <Route path="/master-panel" element={<MasterRoute element={<MasterPanel />} />} />

          {/* User Protected Routes */}
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/profile/:regdNo" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/counseling-form" element={<ProtectedRoute element={<CounselingForm />} />} />
          <Route path="/counseling-forms" element={<ProtectedRoute element={<CounselingFormsHub />} />} />
          <Route path="/counseling-form-download/:regdNo" element={<ProtectedRoute element={<ConsolidatedCounselingForm />} />} />
          <Route path="/semester" element={<ProtectedRoute element={<MarksTable />} />} />
          <Route path="/semester/:email" element={<ProtectedRoute element={<MarksTable />} />} />
          <Route path="/attendance" element={<ProtectedRoute element={<Attendance />} />} />
          <Route path="/attendance/:email" element={<ProtectedRoute element={<Attendance />} />} />
          <Route path="/mentorgrade" element={<ProtectedRoute element={<MentorGrading />} />} />
          <Route path="/mentorgrade/:email" element={<ProtectedRoute element={<MentorGrading />} />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />
          <Route path="/admin/users" element={<AdminRoute element={<AdminUserManagement />} />} />
          <Route path="/admin/data-overview" element={<AdminRoute element={<AdminDataOverview />} />} />
          <Route path="/admin/data" element={<AdminRoute element={<AdminDataOverview />} />} />
          <Route path="/admin/access-window" element={<AdminRoute element={<AdminAccessControl />} />} />
          <Route path="/admin/consolidated-form" element={<AdminRoute element={<Navigate to="/counseling-forms" replace />} />} />
          <Route path="/admin/consolidated-form/:regdNo" element={<AdminRoute element={<ConsolidatedCounselingForm />} />} />
          <Route path="/consolidatedform" element={<AdminRoute element={<ConsolidatedCounselingForm />} />} />

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
          <Route path="/principal/overview" element={<PrincipalRoute element={<PrincipalDashboard />} />} />

          {/* Master Routes */}
          <Route path="/master/dashboard" element={<MasterRoute element={<MasterPanel />} />} />
          <Route path="/master/manage" element={<MasterRoute element={<MasterDashboard />} />} />

          
        </Routes>
        <Footer />
        <SupportChatWidget />
      </Router>
    </>
  );
};

export default App;