import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './services/authContext'
import { ThemeProvider } from './components/shared/ThemeProvider'
import ProtectedRoute from './components/shared/ProtectedRoute'
import AdminLayout from './components/shared/AdminLayout'
import RecruiterLayout from './components/shared/RecruiterLayout'
import Experts from './pages/admin/Experts'
import AdminAssignments from './pages/admin/Assignments'
import SignIn from './pages/SignIn'
import AcceptInvitation from './pages/AcceptInvitation'
import AdminDashboard from './pages/admin/Dashboard'
import QuestionList from './pages/admin/QuestionList'
import QuestionForm from './pages/admin/QuestionForm'
import QuestionPreview from './pages/admin/QuestionPreview'
import TestSandbox from './pages/admin/TestSandbox'
import Jobs from './pages/admin/Jobs'
import DomainManager from './pages/admin/DomainManager'
import Recruiters from './pages/admin/Recruiters'
import AdminProfile from './pages/admin/Profile'
import CompanyUsers from './pages/admin/CompanyUsers'
import CompanyUserEdit from './pages/admin/CompanyUserEdit'
import CompanyUserProjects from './pages/admin/CompanyUserProjects'
import CompletedTasks from './pages/admin/CompletedTasks'
import RecruiterDashboard from './pages/recruiter/Dashboard'
import AssessmentDetail from './pages/recruiter/AssessmentDetail'
import RecruiterProfile from './pages/recruiter/Profile'
import Expert from './pages/recruiter/Expert'
import Assignments from './pages/recruiter/Assignments'
import AssignAssessment from './pages/recruiter/AssignAssessment'
import TestPortal from './pages/TestPortal'

function DefaultRedirect() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated || !user) return <Navigate to="/signin" replace />
  if (user.role === 'expert') {
    const assessmentReturnUrl = sessionStorage.getItem('rubricate_return_url')
    return <Navigate to={assessmentReturnUrl || '/signin?role=expert'} replace />
  }
  return <Navigate to={user.role === 'admin' ? '/admin' : '/recruiter'} replace />
}

function AppRoutes() {
  return (
    <>
      <Routes>
      {/* Public routes */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />

      {/* Candidate test-taking — fully public, no auth required */}
      <Route path="/test/:assessmentId" element={<TestPortal />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="assignments" element={<AdminAssignments />} />
        <Route path="assessments/:id" element={<AssessmentDetail />} />
        <Route path="questions" element={<QuestionList />} />
        <Route path="questions/new" element={<QuestionForm />} />
        <Route path="questions/:id/edit" element={<QuestionForm />} />
        <Route path="questions/:id/preview" element={<QuestionPreview />} />
        <Route path="questions/:id/test" element={<TestSandbox />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="domains" element={<DomainManager />} />
        <Route path="recruiters" element={<Recruiters />} />
        <Route path="company-users" element={<CompanyUsers />} />
        <Route path="company-users/:id/edit" element={<CompanyUserEdit />} />
        <Route path="company-users-projects/:userEmail" element={<CompanyUserProjects />} />
        <Route path="completed-tasks" element={<CompletedTasks />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="experts" element={<Experts />} />
        <Route path="assign/:expertId" element={<AssignAssessment />} />
      </Route>

      {/* Recruiter routes */}
      <Route
        path="/recruiter"
        element={
          <ProtectedRoute requiredRole="recruiter">
            <RecruiterLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RecruiterDashboard />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="assessments/:id" element={<AssessmentDetail />} />
        <Route path="profile" element={<RecruiterProfile />} />
        <Route path="expert" element={<Expert />} />
        <Route path="assign/:expertId" element={<AssignAssessment />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}