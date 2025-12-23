import api from './api';
import { webSocketService } from './websocket';

const partnerService = {
  // Get available bookings for partners to accept
  async getAvailableBookings() {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.get('/urban-services/bookings/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available bookings:', error);
      throw error;
    }
  },

  // Get partner's own bookings
  async getBookings(status = null, page = 1, limit = 10) {
    try {
      const token = localStorage.getItem('partnerToken');
      const params = { page, limit };
      if (status) params.status = status;

      const response = await api.get('/urban-services/partner/bookings', {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching partner bookings:', error);
      throw error;
    }
  },

  // Get single booking by ID
  async getBookingById(bookingId) {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.get(`/urban-services/bookings/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      throw error;
    }
  },

  // Accept a booking
  async acceptBooking(bookingId) {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.put(`/urban-services/bookings/${bookingId}/accept`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error accepting booking:', error);
      throw error;
    }
  },

  // Reject a booking
  async rejectBooking(bookingId, reason) {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.put(`/urban-services/bookings/${bookingId}/reject`, { reason }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting booking:', error);
      throw error;
    }
  },

  // Update booking status
  async updateBookingStatus(bookingId, status, additionalData = {}) {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.put(`/urban-services/bookings/${bookingId}/status`, {
        status,
        ...additionalData
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  // Update booking destination
  async updateBookingDestination(bookingId, destinationData) {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.put(`/urban-services/bookings/${bookingId}/destination`, destinationData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating booking destination:', error);
      throw error;
    }
  },

  // Get partner profile
  async getProfile() {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.get('/urban-services/partner/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching partner profile:', error);
      throw error;
    }
  },

  // Update partner profile
  async updateProfile(profileData) {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.put('/urban-services/partner/profile', profileData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating partner profile:', error);
      throw error;
    }
  },

  // Get partner statistics
  async getStats() {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.get('/urban-services/partner/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching partner stats:', error);
      throw error;
    }
  },

  // Get earnings
  async getEarnings(period = 'month') {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.get(`/urban-services/partner/earnings?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching earnings:', error);
      throw error;
    }
  },

  // Update availability status
  async updateAvailability(isAvailable) {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.put('/urban-services/partner/availability', {
        isAvailable
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  },

  // Get reviews
  async getReviews(page = 1, limit = 10) {
    try {
      const token = localStorage.getItem('partnerToken');
      const response = await api.get(`/urban-services/partner/reviews?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  // WebSocket subscription for real-time updates
  subscribeToBookings(callback) {
    const token = localStorage.getItem('partnerToken');

    // Connect with token if not already connected
    webSocketService.connect('/partner', token);

    // Subscribe to messages
    const unsubscribe = webSocketService.subscribe((data) => {
      if (data.type === 'NEW_BOOKING' ||
        data.type === 'BOOKING_UPDATED' ||
        data.type === 'BOOKING_CANCELLED') {
        callback(data);
      }
    });

    return unsubscribe;
  }
};

export default partnerService;