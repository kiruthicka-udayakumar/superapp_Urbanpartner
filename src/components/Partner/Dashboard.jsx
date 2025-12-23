import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { GoogleMap, useJsApiLoader, Marker, Polyline, Autocomplete } from '@react-google-maps/api';

import { toast } from 'react-toastify';
import partnerService from '../../services/partnerService';
import BookingList from './BookingList';
// BookingCard import removed as it is used inside BookingList
import webSocketService from '../../services/websocket';
import Navbar from '../common/Navbar';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Map Container Style
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (Chennai)
const defaultCenter = {
  lat: 13.0827,
  lng: 80.2707
};

const libraries = ['places'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [availableBookings, setAvailableBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]); // New State
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    todayEarnings: 0,
    totalEarnings: 0,
    averageRating: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const [displayAddress, setDisplayAddress] = useState('');

  // Manual Location Fix State
  const [showLocationFixModal, setShowLocationFixModal] = useState(false);
  const [fixCoords, setFixCoords] = useState(null); // { lat, lng }
  const [fixAddress, setFixAddress] = useState('');
  const searchBoxRef = useRef(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [statsData, availableData, myBookingsData] = await Promise.all([
          partnerService.getStats().catch(() => ({})),
          partnerService.getAvailableBookings().catch(() => ({ data: [] })),
          partnerService.getBookings().catch(() => ({ bookings: [] }))
        ]);

        setStats(prev => ({ ...prev, ...statsData }));
        setAvailableBookings(availableData.data || []);

        // Categorize bookings
        const allMyBookings = myBookingsData.bookings || [];

        const active = allMyBookings.filter(b =>
          b && ['accepted', 'on_the_way', 'in_progress'].includes(b.status)
        );

        const completed = allMyBookings.filter(b =>
          b && b.status === 'completed'
        );

        // Update counts based on loaded lists
        const availableCount = (availableData.data || []).length;
        const activeCount = active.length;
        const completedCount = completed.length;
        const totalCount = availableCount + activeCount + completedCount;

        setStats(prev => ({
          ...prev,
          ...statsData,
          totalBookings: totalCount // Override backend total with client-side live count of all lists
        }));
        setAvailableBookings(availableData.data || []);
        setMyBookings(active);
        setCompletedBookings(completed);

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Update Total Bookings count whenever any list changes
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      totalBookings: availableBookings.length + myBookings.length + completedBookings.length
    }));
  }, [availableBookings.length, myBookings.length, completedBookings.length]);

  // Setup WebSocket subscription
  useEffect(() => {
    const unsubscribe = partnerService.subscribeToBookings((event) => {
      console.log('WebSocket event received:', event);

      switch (event.type) {
        case 'INITIAL_DATA':
          // ... (simplified handler or keep existing logic if complex, but here we just follow categorization)
          // For initial data from socket, we might need similar filtering
          const available = event.available || [];
          const accepted = event.accepted || []; // Socket usually sends active ones here?

          setAvailableBookings(available);
          // Assuming 'accepted' in event means active assigned bookings
          setMyBookings(accepted.filter(b => ['accepted', 'on_the_way', 'in_progress'].includes(b.status)));
          setCompletedBookings(accepted.filter(b => b.status === 'completed'));
          break;

        case 'NEW_BOOKING':
          console.log('NEW_BOOKING received:', event.booking);
          if (event.booking) {
            setAvailableBookings(prev => [event.booking, ...prev]);
          }
          break;

        case 'BOOKING_UPDATED':
          console.log('BOOKING_UPDATED received:', event.booking);
          if (!event.booking || !event.booking._id) break;
          const updatedBooking = event.booking;

          // Remove from Available (always)
          setAvailableBookings(prev => (prev || []).filter(b => b && b._id !== updatedBooking._id));

          // Handle Categories
          if (updatedBooking.status === 'completed') {
            // Remove from Active
            setMyBookings(prev => (prev || []).filter(b => b && b._id !== updatedBooking._id));
            // Add/Update in Completed
            setCompletedBookings(prev => {
              const current = prev || [];
              const exists = current.some(b => b && b._id === updatedBooking._id);
              if (exists) return current.map(b => b._id === updatedBooking._id ? updatedBooking : b);
              return [updatedBooking, ...current];
            });
          } else if (['accepted', 'on_the_way', 'in_progress'].includes(updatedBooking.status)) {
            // Remove from Completed (if somehow it went back?)
            setCompletedBookings(prev => (prev || []).filter(b => b && b._id !== updatedBooking._id));
            // Add/Update in Active
            setMyBookings(prev => {
              const current = prev || [];
              const exists = current.some(b => b && b._id === updatedBooking._id);
              if (exists) return current.map(b => b._id === updatedBooking._id ? updatedBooking : b);
              return [updatedBooking, ...current];
            });
          } else if (updatedBooking.status === 'cancelled' || updatedBooking.status === 'rejected') {
            // Remove from all personal lists
            setMyBookings(prev => (prev || []).filter(b => b && b._id !== updatedBooking._id));
            setCompletedBookings(prev => (prev || []).filter(b => b && b._id !== updatedBooking._id));
            // If rejected, it might go back to available, but usually NEW_BOOKING handles re-broadcast or backend logic
          }
          break;

        case 'BOOKING_CANCELLED':
          console.log('BOOKING_CANCELLED received:', event.bookingId);
          if (!event.bookingId) break;

          setAvailableBookings(prev =>
            (prev || []).filter(b => b && b._id !== event.bookingId)
          );
          setMyBookings(prev =>
            (prev || []).filter(b => b && b._id !== event.bookingId)
          );
          setCompletedBookings(prev => (prev || []).filter(b => b && b._id !== event.bookingId));
          break;

        default:
          console.log('Unknown event type:', event.type);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // --- Map & Partner Location Logic ---
  const [partnerLocation, setPartnerLocation] = useState(null); // { lat, lng }
  const watchIdRef = useRef(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setPartnerLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => console.error('Error getting location:', err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleAcceptBooking = async (bookingId) => {
    try {
      await partnerService.updateBookingStatus(bookingId, 'accepted');
      toast.success('Booking accepted successfully!');

      // Give the backend/socket a tiny moment to process, then switch tab
      setActiveTabIndex(1); // Switch to "My Bookings" tab

      // Also refresh data locally to be sure
      const availableData = await partnerService.getAvailableBookings().catch(() => ({ data: [] }));
      const myBookingsData = await partnerService.getBookings().catch(() => ({ bookings: [] }));

      setAvailableBookings(availableData.data || []);
      setMyBookings((myBookingsData.bookings || []).filter(b =>
        ['accepted', 'on_the_way', 'in_progress'].includes(b.status)
      ));
    } catch (error) {
      console.error('Error accepting booking:', error);
      const message = error.response?.data?.message || 'Failed to accept booking. Please try again.';
      toast.error(message);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await partnerService.updateBookingStatus(bookingId, 'rejected', 'Partner rejected');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      setError('Failed to reject booking. Please try again.');
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await partnerService.updateBookingStatus(bookingId, status);
      // Update local state is handled by WebSocket usually, but successful api call allows local optimism if needed
    } catch (error) {
      console.error(`Error updating booking status to ${status}:`, error);
      setError(`Failed to update booking status. Please try again.`);
    }
  };

  // Start Service Modal Logic
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  // const [displayAddress, setDisplayAddress] = useState('Address not provided'); // Moved up

  // Reverse geocoding to ensure address is always shown if coordinates exist
  useEffect(() => {
    if (showStartModal && selectedBooking && isLoaded && window.google) {
      const loc = getCustomerLocation(selectedBooking);

      // Set initial value from booking data
      const initialAddr = selectedBooking.customAddress
        ? `${selectedBooking.customAddress.addressLine1}, ${selectedBooking.customAddress.city}`
        : selectedBooking.address || 'Address not provided';
      setDisplayAddress(initialAddr);

      // If we have coordinates but generic/missing address, fetch it
      if (loc && (initialAddr === 'Address not provided' || !initialAddr)) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: loc }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setDisplayAddress(results[0].formatted_address);
          }
        });
      }
    }
  }, [showStartModal, selectedBooking, isLoaded]);

  const handleStartServiceClick = async (booking) => {
    try {
      // Check if scheduled date matches today
      const today = new Date();
      // Reset time portion for accurate date comparison
      today.setHours(0, 0, 0, 0);

      const scheduledDate = new Date(booking.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);

      if (scheduledDate > today) {
        alert(`You can only start this service on the scheduled date: ${new Date(booking.scheduledDate).toLocaleDateString()}`);
        return;
      }

      // If booking is already in-progress, go to the service page directly
      if (booking.status === 'in_progress') {
        navigate(`/service-in-progress/${booking._id}`);
        return;
      }

      // Logic: Just open the modal. Status update to 'on_the_way' happens when "Navigate" is clicked.
      setSelectedBooking(booking);
      setShowStartModal(true);
    } catch (error) {
      console.error('Error starting service:', error);
    }
  };

  const handleMarkCompleted = (booking) => {
    if (booking || selectedBooking) {
      const b = booking || selectedBooking;
      navigate(`/service-in-progress/${b._id}`);
      setShowStartModal(false);
    }
  };

  const handleReachedLocation = async () => {
    if (selectedBooking) {
      try {
        await handleStatusUpdate(selectedBooking._id, 'in_progress');
        setShowStartModal(false);
        // Navigate to the dedicated service page which now handles the rest of the flow
        navigate(`/service-in-progress/${selectedBooking._id}`);
      } catch (err) {
        console.error("Failed to update status to in_progress:", err);
      }
    }
  };

  const openNavigation = async () => {
    if (!selectedBooking) return;

    const loc = getCustomerLocation(selectedBooking);

    if (loc) {
      // 1. Coordinates Exist - Update Status & Open Maps
      try {
        if (selectedBooking.status === 'accepted') {
          // Immediately update status to ON_THE_WAY in database
          await handleStatusUpdate(selectedBooking._id, 'on_the_way');
          setSelectedBooking(prev => ({ ...prev, status: 'on_the_way' }));
        }

        // Open Google Maps Directions
        const query = `${loc.lat},${loc.lng}`;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');

      } catch (err) {
        console.error("Error starting navigation flow:", err);
        alert("Failed to update status. Navigation blocked.");
      }

    } else {
      // 2. Fallback - Coordinates DO NOT exist
      console.log("Location missing, opening fix modal");
      // Center map on partner or default
      setFixCoords(partnerLocation || { lat: 13.0827, lng: 80.2707 });
      setFixAddress(''); // user will search
      setShowLocationFixModal(true);
    }
  };

  const onSearchLoad = (ref) => {
    searchBoxRef.current = ref;
  };

  const onPlaceChanged = () => {
    if (searchBoxRef.current) {
      const place = searchBoxRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setFixCoords({ lat, lng });
        setFixAddress(place.formatted_address || place.name);
      }
    }
  };

  const handleMapClick = (e) => {
    if (e.latLng) {
      setFixCoords({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  };

  const handleConfirmLocation = async () => {
    if (!fixCoords || !selectedBooking) {
      alert('Customer location is required to start navigation.');
      return;
    }

    try {
      // 1. Save Location to Backend
      await partnerService.updateBookingDestination(selectedBooking._id, {
        address: fixAddress || "Pinned Location",
        coordinates: fixCoords,
        city: "Unknown", // Simplified
        pinCode: ""
      });

      // 2. Update Status to ON_THE_WAY
      if (selectedBooking.status === 'accepted') {
        await handleStatusUpdate(selectedBooking._id, 'on_the_way');
        setSelectedBooking(prev => ({ ...prev, status: 'on_the_way' }));
      }

      // 3. Update Local Booking Data (Optimistic)
      if (selectedBooking.customAddress) {
        selectedBooking.customAddress.coordinates = fixCoords;
        selectedBooking.customAddress.addressLine1 = fixAddress || "Pinned Location";
      } else {
        selectedBooking.customAddress = {
          coordinates: fixCoords,
          addressLine1: fixAddress || "Pinned Location"
        };
      }

      // 4. Close Modal & Open Navigation
      setShowLocationFixModal(false);

      const query = `${fixCoords.lat},${fixCoords.lng}`;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');

    } catch (err) {
      console.error("Failed to update location/status", err);
      // alert("Failed to save location. Please try again.");
    }
  };

  const statsCards = [
    {
      name: 'Total Bookings',
      value: stats.totalBookings,
      icon: UserGroupIcon,
      change: '+2.5%',
      changeType: 'positive',
    },
    {
      name: 'Pending',
      value: stats.pendingBookings,
      icon: ClockIcon,
      change: '+3.2%',
      changeType: 'positive',
    },
    {
      name: 'Completed',
      value: stats.completedBookings,
      icon: CheckCircleIcon,
      change: '+1.1%',
      changeType: 'positive',
    },
    {
      name: 'Today\'s Earnings',
      value: `₹${stats.todayEarnings.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      change: '+4.6%',
      changeType: 'positive',
    },
  ];

  // Helper to safely get customer coordinates or default
  const getCustomerLocation = (booking) => {
    // 1. Check Custom Address Coordinates (Live Location)
    if (booking?.customAddress?.coordinates?.lat !== undefined && booking?.customAddress?.coordinates?.lng !== undefined) {
      return {
        lat: Number(booking.customAddress.coordinates.lat),
        lng: Number(booking.customAddress.coordinates.lng)
      };
    }
    // 2. Check Saved Address Coordinates
    if (booking?.address?.coordinates?.lat !== undefined && booking?.address?.coordinates?.lng !== undefined) {
      return {
        lat: Number(booking.address.coordinates.lat),
        lng: Number(booking.address.coordinates.lng)
      };
    }
    // 3. Fallback to Customer Profile Coordinates (if any)
    if (booking?.customer?.coordinates?.lat !== undefined && booking?.customer?.coordinates?.lng !== undefined) {
      return {
        lat: Number(booking.customer.coordinates.lat),
        lng: Number(booking.customer.coordinates.lng)
      };
    }
    return null;
  };

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (partnerLocation) return partnerLocation;
    if (selectedBooking) {
      const loc = getCustomerLocation(selectedBooking);
      if (loc) return loc;
    }
    return defaultCenter;
  }, [partnerLocation, selectedBooking]);

  // Route path
  const routePath = useMemo(() => {
    const custLoc = selectedBooking ? getCustomerLocation(selectedBooking) : null;
    if (partnerLocation && custLoc) {
      return [partnerLocation, custLoc];
    }
    return [];
  }, [partnerLocation, selectedBooking]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Please refresh the page or try again later.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-md bg-red-50 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        {stat.change && (
                          <div
                            className={classNames(
                              stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600',
                              'ml-2 flex items-baseline text-sm font-semibold'
                            )}
                          >
                            {stat.change}
                          </div>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bookings */}
        <div className="bg-white shadow rounded-lg">
          <Tab.Group selectedIndex={activeTabIndex} onChange={setActiveTabIndex}>
            <div className="border-b border-gray-200">
              <Tab.List as="nav" className="-mb-px flex space-x-8 px-6 overflow-x-auto">
                <Tab
                  className={({ selected }) =>
                    classNames(
                      selected
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                      'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm outline-none'
                    )
                  }
                >
                  Available Bookings
                  {availableBookings.length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {availableBookings.length}
                    </span>
                  )}
                </Tab>
                <Tab
                  className={({ selected }) =>
                    classNames(
                      selected
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                      'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm outline-none'
                    )
                  }
                >
                  My Bookings
                  {myBookings.length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {myBookings.length}
                    </span>
                  )}
                </Tab>
                <Tab
                  className={({ selected }) =>
                    classNames(
                      selected
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                      'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm outline-none'
                    )
                  }
                >
                  Completed Bookings
                  {completedBookings.length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {completedBookings.length}
                    </span>
                  )}
                </Tab>
              </Tab.List>
            </div>
            <Tab.Panels className="p-6">
              <Tab.Panel>
                <BookingList
                  bookings={availableBookings}
                  emptyMessage="No available bookings at the moment"
                  onAccept={handleAcceptBooking}
                  onReject={handleRejectBooking}
                  onStatusUpdate={handleStatusUpdate}
                  onStartServiceClick={handleStartServiceClick}
                />
              </Tab.Panel>
              <Tab.Panel>
                <BookingList
                  bookings={myBookings}
                  emptyMessage="You don't have any active bookings"
                  onStatusUpdate={handleStatusUpdate}
                  onStartServiceClick={handleStartServiceClick}
                />
              </Tab.Panel>
              <Tab.Panel>
                <BookingList
                  bookings={completedBookings}
                  emptyMessage="No completed bookings yet"
                  onStatusUpdate={handleStatusUpdate}
                  // No Start Service action for completed bookings usually, but passing handler just in case or null
                  onStartServiceClick={null}
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Start Service Modal (Bottom Sheet) */}
      {showStartModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 transition-opacity">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl shadow-xl transform transition-transform duration-300 ease-in-out h-[85vh] flex flex-col overflow-hidden relative">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50 z-10">
              <h3 className="text-lg font-semibold text-gray-900">Live Tracking</h3>
              <button
                onClick={() => setShowStartModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Map Area */}
            <div className="flex-grow relative bg-gray-100 z-0">
              {!isLoaded ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Loading Google Maps...
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={13}
                >
                  {/* Partner Location (Use different icon if desired) */}
                  {partnerLocation && (
                    <Marker
                      position={partnerLocation}
                      label="You"
                    />
                  )}

                  {/* Customer Location */}
                  {getCustomerLocation(selectedBooking) && (
                    <Marker
                      position={getCustomerLocation(selectedBooking)}
                      label="Cust"
                    />
                  )}

                  {/* Route Line */}
                  {routePath.length > 0 && (
                    <Polyline
                      path={routePath}
                      options={{
                        strokeColor: "#2563EB",
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                      }}
                    />
                  )}
                </GoogleMap>
              )}
            </div>

            {/* Customer Details & Actions */}
            <div className="p-5 bg-white border-t space-y-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-semibold text-gray-900 line-clamp-2">
                    {displayAddress !== 'Address not provided' ? displayAddress : (
                      (() => {
                        const loc = getCustomerLocation(selectedBooking);
                        return loc ? `${loc.lat}, ${loc.lng}` : (selectedBooking.address || 'Address not provided');
                      })()
                    )}
                  </p>
                </div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  {selectedBooking.status === 'on_the_way' ? 'ON THE WAY' : selectedBooking.status === 'in_progress' ? 'IN PROGRESS' : selectedBooking.status}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {/* 1. Navigate Button */}
                <button
                  onClick={openNavigation}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="mr-2 h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Navigate
                </button>

                {/* 2. Reached Location Button - Shown when status is 'on_the_way' */}
                {selectedBooking.status === 'on_the_way' && (
                  <button
                    onClick={handleReachedLocation}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-lg"
                  >
                    Reached Location
                  </button>
                )}

                {/* 3. Mark Service As Completed Button - Shown when status is 'in-progress' (or after being reached) */}
                {selectedBooking.status === 'in_progress' && (
                  <button
                    onClick={() => handleMarkCompleted()}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-lg"
                  >
                    Mark Service As Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Manual Location Fix Modal */}
      {showLocationFixModal && isLoaded && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 overflow-hidden shadow-xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-800">Set Destination Location</h3>
              <button
                onClick={() => setShowLocationFixModal(false)}
                className="text-gray-500 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">
                Location coordinates are missing. Please search or pin the correct location on the map to start navigation.
              </p>

              <div className="mb-4 relative">
                <Autocomplete
                  onLoad={onSearchLoad}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    type="text"
                    placeholder="Search Customer Address..."
                    className="w-full border border-gray-300 rounded-md px-4 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </Autocomplete>
              </div>

              <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200 relative">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={fixCoords || { lat: 13.0827, lng: 80.2707 }}
                  zoom={15}
                  onClick={handleMapClick}
                  options={{
                    disableDefaultUI: false,
                    streetViewControl: false,
                    mapTypeControl: false
                  }}
                >
                  {fixCoords && (
                    <Marker
                      position={fixCoords}
                      draggable={true}
                      onDragEnd={(e) => setFixCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
                      animation={window.google.maps.Animation.DROP}
                    />
                  )}
                </GoogleMap>
                <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                  <span className="bg-white px-2 py-1 rounded shadow text-xs font-semibold text-gray-700">Tap map to place pin</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowLocationFixModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLocation}
                disabled={!fixCoords}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm ${fixCoords ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                Confirm & Navigate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;