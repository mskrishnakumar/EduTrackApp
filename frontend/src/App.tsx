import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  StudentsPage,
  StudentDetailPage,
  ProgramsPage,
  CentersPage,
  MilestonesPage,
  AttendancePage,
  AnalyticsPage,
  ReportsPage,
  SettingsPage,
  StudentDashboardPage,
  StudentMilestonesPage,
  StudentAttendancePage,
  StudentProfilePage,
  StudentNotificationsPage,
} from './pages';
import { ROUTES } from './constants/routes';

function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === 'student') {
    return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />;
  }
  return <Navigate to={ROUTES.DASHBOARD} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
        <Routes>
          {/* Public routes */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

          {/* Admin/Coordinator routes */}
          <Route
            element={
              <ProtectedRoute requiredRole={['admin', 'coordinator']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.STUDENTS} element={<StudentsPage />} />
            <Route path={ROUTES.STUDENT_DETAIL} element={<StudentDetailPage />} />
            <Route path={ROUTES.PROGRAMS} element={<ProgramsPage />} />
            <Route path={ROUTES.CENTERS} element={<CentersPage />} />
            <Route path={ROUTES.MILESTONES} element={<MilestonesPage />} />
            <Route path={ROUTES.ATTENDANCE} element={<AttendancePage />} />
            <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          </Route>

          {/* Student routes */}
          <Route
            element={
              <ProtectedRoute requiredRole="student">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path={ROUTES.STUDENT_DASHBOARD} element={<StudentDashboardPage />} />
            <Route path={ROUTES.STUDENT_MILESTONES} element={<StudentMilestonesPage />} />
            <Route path={ROUTES.STUDENT_ATTENDANCE} element={<StudentAttendancePage />} />
            <Route path={ROUTES.STUDENT_PROFILE} element={<StudentProfilePage />} />
            <Route path={ROUTES.STUDENT_NOTIFICATIONS} element={<StudentNotificationsPage />} />
          </Route>

          {/* Catch-all: role-based redirect */}
          <Route path="*" element={
            <ProtectedRoute>
              <RoleRedirect />
            </ProtectedRoute>
          } />
        </Routes>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
