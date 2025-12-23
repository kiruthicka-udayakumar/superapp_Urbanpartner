import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const ApprovalPending = () => {
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const navigate = useNavigate();

  // Auto-check approval status every 30 seconds
  useEffect(() => {
    const checkApprovalStatus = async () => {
      try {
        setCheckingStatus(true);
        const token = localStorage.getItem('partnerToken');

        // Priority 1: Check status via Token (Profile) - Source of Truth for App.js
        if (token) {
          try {
            const profile = await authService.getPartnerProfile();
            const status = profile.partner.status;

            if (status === 'active' || status === 'approved') {
              window.location.href = '/dashboard';
            } else {
              // IMPORTANT: If we successfully got the profile and status is NOT active,
              // we MUST stop here. Falling back to phone check can cause a loop if data is inconsistent.
              console.log('User status is', status, '- staying on pending page');
            }
            // Always return if token check succeeded, regardless of status
            setLastChecked(new Date());
            setCheckingStatus(false);
            return;

          } catch (profileError) {
            console.warn('Profile check failed, falling back to phone check', profileError);
          }
        }

        // Priority 2: Check status via Phone (Fallback only if token fails)
        const phoneNumber = localStorage.getItem('phoneNumber');
        if (!phoneNumber) {
          navigate('/');
          return;
        }

        const statusCheck = await authService.checkPartnerStatus(phoneNumber);

        // Only redirect if we ALSO have a token
        if ((statusCheck.isApproved || statusCheck.status === 'active') && token) {
          window.location.href = '/dashboard';
        }

        setLastChecked(new Date());
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    // Check immediately on mount
    checkApprovalStatus();

    // Set up interval for periodic checks
    const interval = setInterval(checkApprovalStatus, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleManualCheck = async () => {
    const phoneNumber = localStorage.getItem('phoneNumber');
    if (!phoneNumber) {
      navigate('/');
      return;
    }

    try {
      setCheckingStatus(true);
      const token = localStorage.getItem('partnerToken');

      // Priority 1: Check status via Token
      if (token) {
        try {
          const profile = await authService.getPartnerProfile();
          const status = profile.partner.status;

          if (status === 'active' || status === 'approved') {
            window.location.href = '/dashboard';
            return;
          } else {
            // Stop if token check succeeded but not approved
            alert('Your application is still under review. We will notify you once approved.');
            setLastChecked(new Date());
            return;
          }
        } catch (e) {
          // Fallback
        }
      }

      // Priority 2: Check status via Phone
      const statusCheck = await authService.checkPartnerStatus(phoneNumber);

      if ((statusCheck.isApproved || statusCheck.status === 'active') && token) {
        window.location.href = '/dashboard';
      } else {
        setLastChecked(new Date());
        alert('Your application is still under review. We will notify you once approved.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to check status. Please try again.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Under Review</h1>

        <p className="text-gray-600 mb-6">
          Thank you for submitting your documents! Your application is currently being reviewed by our team.
          This usually takes 1-2 business days.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 text-left space-y-1">
            <li>• Our team will verify your documents</li>
            <li>• You'll receive an SMS/email once approved</li>
            <li>• You can start accepting bookings immediately after approval</li>
          </ul>
        </div>

        {lastChecked && (
          <p className="text-sm text-gray-500 mb-4">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={handleManualCheck}
            disabled={checkingStatus}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingStatus ? 'Checking Status...' : 'Check Approval Status'}
          </button>

          <button
            onClick={handleLogout}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition duration-200"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Need help? Contact us at{' '}
            <a href="mailto:support@urbanapp.com" className="text-blue-600 hover:text-blue-700">
              support@urbanapp.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApprovalPending;
