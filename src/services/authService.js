import api from './api';

const authService = {
  // Send OTP to mobile number
  async sendOTP(phoneNumber) {
    try {
      const response = await api.post('/auth/partner/send-otp', { phoneNumber });
      return response.data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  },

  // Verify OTP and check partner status
  async verifyOTP(phoneNumber, otp) {
    try {
      console.log('🔍 Verifying OTP for:', phoneNumber);
      const response = await api.post('/auth/partner/verify-otp', { phoneNumber, otp });

      console.log('✅ OTP Verification Response:', response.data);
      console.log('📋 Token in response:', response.data.token ? 'Present' : 'Missing');

      // Store token if received
      if (response.data.token) {
        console.log('💾 Storing token in localStorage...');
        localStorage.setItem('partnerToken', response.data.token);
        console.log('✅ Token stored successfully');

        // Verify token was stored
        const storedToken = localStorage.getItem('partnerToken');
        console.log('🔍 Verification - Token in localStorage:', storedToken ? 'Present' : 'Missing');
      } else {
        console.warn('⚠️ No token in response!');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },

  // Check partner status
  async checkPartnerStatus(phoneNumber) {
    try {
      const response = await api.get(`/auth/partner/status/${phoneNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error checking partner status:', error);
      throw error;
    }
  },

  // Update partner profile
  async updateProfile(formData) {
    try {
      const response = await api.put('/auth/partner/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('partnerToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async uploadDocuments(formData) {
    try {
      const response = await api.post('/auth/partner/upload-documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  },

  // Get current partner profile
  async getPartnerProfile() {
    try {
      const response = await api.get('/auth/partner/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('partnerToken')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('partnerToken');
    window.location.href = '/';
  },

  // Check if authenticated
  isAuthenticated() {
    return !!localStorage.getItem('partnerToken');
  }
};

export default authService;
