import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const PhoneNumberScreen = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!phone || phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
      alert('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      return;
    }

    try {
      setLoading(true);
      
      // Check if partner exists
      const statusCheck = await authService.checkPartnerStatus(`+91${phone}`);
      
      // Send OTP
      await authService.sendOTP(`+91${phone}`);
      
      // Navigate to OTP verification with partner status
      navigate('/otp-verification', { 
        state: { 
          phone: `+91${phone}`, 
          isNewPartner: statusCheck.isNewPartner,
          isApproved: statusCheck.status === 'approved'
        } 
      });
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Login</h1>
          <p className="text-gray-600 mt-2">Enter your mobile number to continue</p>
        </div>

        <form onSubmit={handleSendOTP} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <div className="flex items-center">
              <div className="flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-gray-900 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                +91
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit number"
                className="rounded-none rounded-r-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5"
                maxLength={10}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>By continuing, you agree to our Terms & Conditions</p>
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberScreen;
