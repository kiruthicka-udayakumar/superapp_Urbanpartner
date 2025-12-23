import React from 'react';

const BookingCard = ({ booking, onAccept, onReject, onStatusUpdate, onStartServiceClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'on_the_way':
        return 'bg-indigo-100 text-indigo-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(booking._id, newStatus);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {booking.service?.name || booking.title || booking.category?.name || 'Service'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Customer: {booking.customer?.name || booking.customerName || 'N/A'}
          </p>
          {booking.customerPhone && (
            <p className="text-sm text-gray-500">
              Phone: {booking.customerPhone}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
          {booking.status?.replace(/_/g, ' ').replace('-', ' ') || 'Unknown'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'Date not set'}
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-2">
            {booking.customAddress ?
              `${booking.customAddress.addressLine1}${booking.customAddress.addressLine2 ? ', ' + booking.customAddress.addressLine2 : ''}, ${booking.customAddress.city}, ${booking.customAddress.pinCode}`
              : booking.address?.addressLine1 ?
                `${booking.address.addressLine1}, ${booking.address.city}` // If populated saved address object
                : booking.address || 'Address not provided'}
          </span>
        </div>

        {booking.pricing && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Price: ₹{booking.pricing.totalAmount || booking.pricing.amount || 'N/A'}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {booking.status === 'pending' && (
          <>
            <button
              onClick={() => onAccept && onAccept(booking._id)}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => onReject && onReject(booking._id)}
              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </>
        )}

        {(booking.status === 'accepted' || booking.status === 'on_the_way' || booking.status === 'in_progress') && (
          <button
            onClick={() => onStartServiceClick ? onStartServiceClick(booking) : handleStatusChange('in_progress')}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {booking.status === 'accepted' ? 'Start Service' : 'Track / Continue'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
