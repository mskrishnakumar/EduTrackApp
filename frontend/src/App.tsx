import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import {
  LoginPage,
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
} from './pages';
import { ROUTES } from './constants/routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
        <Routes>
          {/* Public routes */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute>
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

          {/* Redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
