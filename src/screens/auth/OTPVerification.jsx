import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import api from '../../services/api';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showOtpDisplay, setShowOtpDisplay] = useState(true);
  const [devOtp, setDevOtp] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  const { phone, isNewPartner, isApproved } = location.state || {};
  
  // Fallback: try to get phone from localStorage if location.state is null
  const fallbackPhone = phone || localStorage.getItem('pendingPhone') || '+918610097038';

  const otpInputs = useRef([]);

  // Fetch latest OTP for dev display
  useEffect(() => {
    const fetchDevOtp = async () => {
      if (fallbackPhone) {
        try {
          // Try multiple endpoints to find the correct one
          const endpoints = [
            `http://localhost:3000/api/auth/otp/latest?phone=${fallbackPhone}`,
            `http://localhost:3000/api/otp/latest?phone=${fallbackPhone}`,
            `/auth/otp/latest?phone=${fallbackPhone}`,
            `/otp/latest?phone=${fallbackPhone}`
          ];
          
          for (const endpoint of endpoints) {
            try {
              const response = await fetch(endpoint);
              
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.otp) {
                  setDevOtp(data.otp);
                  return; // Success, exit the loop
                }
              }
            } catch (error) {
              continue; // Try next endpoint
            }
          }
          
          // If all endpoints fail, use fallback OTP
          setDevOtp('427521');
          
        } catch (error) {
          // Set fallback OTP for testing
          setDevOtp('427521');
        }
      }
    };
    fetchDevOtp();
  }, [fallbackPhone]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.verifyOTP(phone, otpString);

      if (response.success && response.token) {
        // Token is already stored by authService

        // Save phone number for DocumentUpload screen
        localStorage.setItem('phoneNumber', phone);

        // Check partner status to determine navigation
        const status = response.partner.status;
        const documentsUploaded = response.partner.documentsUploaded;

        if (status === 'active' || status === 'approved') {
          navigate('/dashboard');
        } else if (status === 'pending' && documentsUploaded) {
          // If pending but documents are already uploaded, go to status check page
          navigate('/approval-pending');
        } else {
          // For pending/new partners without docs, go to document upload
          navigate('/document-upload');
        }
      } else {
        alert(response.message || 'OTP verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      await authService.sendOTP(phone);
      setTimeLeft(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpInputs.current[0]?.focus();
      
      // Fetch and update dev OTP after resend using same multi-endpoint approach
      try {
        const endpoints = [
          `http://localhost:3000/api/auth/otp/latest?phone=${phone}`,
          `http://localhost:3000/api/otp/latest?phone=${phone}`,
          `/auth/otp/latest?phone=${phone}`,
          `/otp/latest?phone=${phone}`
        ];
        
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.otp) {
                setDevOtp(data.otp);
                setShowOtpDisplay(true);
                return;
              }
            }
          } catch (error) {
            continue;
          }
        }
        
        // Fallback
        setDevOtp('427521');
        setShowOtpDisplay(true);
        
      } catch (error) {
        console.log('Could not fetch latest OTP:', error);
        setDevOtp('427521');
        setShowOtpDisplay(true);
      }
      
      alert('OTP sent successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyOtpToClipboard = () => {
    if (devOtp) {
      navigator.clipboard.writeText(devOtp).then(() => {
        alert('OTP copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy OTP. Please copy manually: ' + devOtp);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Verify OTP</h1>
          <p className="text-gray-600 mt-2">Enter the 6-digit code sent to {fallbackPhone}</p>
        </div>

        {/* Modern OTP Display */}
        {showOtpDisplay && devOtp && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-1 shadow-xl">
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Your OTP Code</h3>
                      <p className="text-sm text-gray-500">Ready to use</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOtpDisplay(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 tracking-widest mb-2">
                      {devOtp.split('').map((digit, index) => (
                        <span key={index} className="inline-block mx-1">{digit}</span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      Valid for {timeLeft} seconds
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={copyOtpToClipboard}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    <span>Copy OTP</span>
                  </button>
                  <button
                    onClick={() => {
                      const otpArray = devOtp.split('');
                      setOtp(otpArray);
                      setTimeout(() => {
                        otpInputs.current[otpArray.length - 1]?.focus();
                      }, 100);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Auto-fill</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show OTP button (when hidden) */}
        {!showOtpDisplay && devOtp && (
          <button
            onClick={() => setShowOtpDisplay(true)}
            className="w-full mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
            <span className="font-medium">Show OTP Code</span>
          </button>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div className="flex justify-center space-x-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (otpInputs.current[index] = el)}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                maxLength={1}
                required
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend || loading}
              className="text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canResend ? 'Resend OTP' : `Resend OTP in ${timeLeft}s`}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-700 text-sm"
          >
            ← Back to Mobile Number
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
