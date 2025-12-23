import React from 'react';
import BookingCard from './BookingCard';

const BookingList = ({
  bookings,
  emptyMessage = "No bookings available",
  onAccept,
  onReject,
  onStatusUpdate,
  onStartServiceClick
}) => {
  // ... (lines 11-39 remain same conceptually, we only target the props region or the map)

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bookings.map((booking) => (
        <BookingCard
          key={booking._id}
          booking={booking}
          onAccept={onAccept}
          onReject={onReject}
          onStatusUpdate={onStatusUpdate}
          onStartServiceClick={onStartServiceClick}
        />
      ))}
    </div>
  );
};

export default BookingList;