import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';

const Login = ({ onLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('Sending OTP to phone:', phoneNumber);
    console.log('Phone number type:', typeof phoneNumber);
    console.log('Phone number length:', phoneNumber?.length);

    try {
      await authService.sendOTP(phoneNumber);
      toast.success('OTP sent successfully!');
      
      const navigationState = { 
        phone: phoneNumber,
        isNewPartner: true,
        isApproved: false 
      };
      
      console.log('Navigation state to be passed:', navigationState);
      console.log('Navigating to: /otp-verification');
      
      // Navigate to OTP verification screen with phone number
      navigate('/otp-verification', { 
        state: navigationState
      });
      
      console.log('Navigation completed');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Partner Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Urban Services Partner Portal
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
          <div>
            <label htmlFor="phoneNumber" className="sr-only">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Phone Number (e.g., +919876543210)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;