import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import NotificationContainer from './components/ui/NotificationContainer';
import LoginPage from './pages/auth/LoginPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DeleteAccountPage from './pages/public/DeleteAccountPage';
import PrivacyPolicyPage from './pages/public/PrivacyPolicyPage';
import TermsAndConditionsPage from './pages/public/TermsAndConditionsPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import TriviasPage from './pages/trivias/TriviasPage';
import RewardsPage from './pages/rewards/RewardsPage';
import RafflesPage from './pages/raffles/RafflesPage';
import SurveysPage from './pages/surveys/SurveysPage';
import SurveyManagePage from './pages/surveys/SurveyManagePage';
import TestimonialsPage from './pages/testimonials/TestimonialsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SettingsPage from './pages/settings/SettingsPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen bg-gray-50 transition-colors">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/delete-account" element={<DeleteAccountPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
              
              <Route path="/" element={<ProtectedRoute />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="trivias" element={<TriviasPage />} />
                <Route path="rewards" element={<RewardsPage />} />
                <Route path="raffles" element={<RafflesPage />} />
                <Route path="surveys" element={<SurveysPage />} />
                <Route path="surveys/:surveyId" element={<SurveyManagePage />} />
                <Route path="testimonials" element={<TestimonialsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <NotificationContainer />
            </div>
          </SocketProvider>
        </AuthProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
