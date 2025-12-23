import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import Layout from './components/Layout/Layout';
import Dashboard from './components/Partner/Dashboard';
import Login from './components/Auth/Login';
import OTPVerification from './screens/auth/OTPVerification';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing token on initial load
  useEffect(() => {
    const token = localStorage.getItem('partnerToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <ToastContainer />
        <Routes>
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? 
                <Login onLogin={() => setIsAuthenticated(true)} /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/otp-verification" 
            element={
              !isAuthenticated ? 
                <OTPVerification /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/*" 
            element={
              isAuthenticated ? (
                <div className="flex h-screen bg-gray-50">
                  {/* Sidebar */}
                  <div className="w-64 bg-white shadow-lg">
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">P</span>
                        </div>
                        <div>
                          <h1 className="text-lg font-bold text-gray-900">Urban Partner</h1>
                          <p className="text-xs text-gray-500">Service Provider</p>
                        </div>
                      </div>
                    </div>
                    <nav className="mt-6">
                      <a href="/" className="flex items-center px-4 py-3 text-gray-700 bg-blue-50 border-r-2 border-blue-600">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </a>
                      <a href="/bookings" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Bookings
                      </a>
                      <a href="/services" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Services
                      </a>
                      <a href="/earnings" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Earnings
                      </a>
                      <a href="/profile" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </a>
                    </nav>
                    <div className="absolute bottom-0 w-64 p-4 border-t">
                      <button 
                        onClick={() => {
                          localStorage.removeItem('partnerToken');
                          setIsAuthenticated(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                  {/* Main content */}
                  <div className="flex-1 overflow-auto">
                    <Dashboard />
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;