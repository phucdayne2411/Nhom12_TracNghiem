import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/login-page';
import { ForgotPasswordPage } from './pages/forgot-password-page';
import { StudentDashboard } from './pages/student-dashboard';
import { WaitingRoomPage } from './pages/waiting-room-page';
import { ExamPage } from './pages/exam-page';
import { ResultPage } from './pages/result-page';
import { AdminLayout } from './components/admin-layout';
import { AdminDashboard } from './pages/admin-dashboard';
import { UsersManagement } from './pages/users-management'; // Đã đổi tên
import { QuestionsManagement } from './pages/questions-management';
import { ExamsManagement } from './pages/exams-management';
import { ResultsManagement } from './pages/results-management';
import { SubjectsManagement } from './pages/subjects-management';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/student',
    children: [
      { path: 'dashboard', element: <StudentDashboard /> },
      { path: 'waiting-room/:examId', element: <WaitingRoomPage /> },
      { path: 'exam/:examId', element: <ExamPage /> },
      { path: 'result/:examId', element: <ResultPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'users', element: <UsersManagement /> }, // Cập nhật đường dẫn
      { path: 'questions', element: <QuestionsManagement /> },
      { path: 'subjects', element: <SubjectsManagement /> },
      { path: 'exams', element: <ExamsManagement /> },
      { path: 'results', element: <ResultsManagement /> },
    ],
  },
]);