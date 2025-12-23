import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import authService from './services/authService';
import PhoneNumberScreen from './screens/auth/PhoneNumberScreen';
import OTPVerification from './screens/auth/OTPVerification';
import DocumentUpload from './screens/auth/DocumentUpload';
import ApprovalPending from './screens/auth/ApprovalPending';
import Dashboard from './components/Partner/Dashboard';
import ServiceInProgress from './components/Partner/ServiceInProgress';
import LoadingScreen from './components/common/LoadingScreen';
import Settings from './screens/Partner/Settings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState(null);

  useEffect(() => {
    // Check authentication and partner status on app load
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          try {
            const profile = await authService.getPartnerProfile();
            setIsAuthenticated(true);
            setPartnerStatus(profile.partner.status);
          } catch (profileError) {
            console.error('Profile fetch failed:', profileError);
            // If profile fetch fails, still set authenticated but with default status
            setIsAuthenticated(true);
            setPartnerStatus('active'); // Default to active
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <PhoneNumberScreen />
            }
          />

          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/document-upload" element={<DocumentUpload />} />
          <Route path="/approval-pending" element={<ApprovalPending />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              (isAuthenticated || localStorage.getItem('partnerToken')) && (partnerStatus === 'approved' || partnerStatus === 'active' || !partnerStatus) ?
                <Dashboard /> :
                <Navigate to="/approval-pending" />
            }
          />

          <Route
            path="/settings"
            element={
              isAuthenticated ? <Settings /> : <Navigate to="/" />
            }
          />

          <Route
            path="/service-in-progress/:bookingId"
            element={
              isAuthenticated ? <ServiceInProgress /> : <Navigate to="/" />
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
