import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import authService from '../../services/authService';
import { CameraIcon } from '@heroicons/react/24/outline';

const Settings = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
    });
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await authService.getPartnerProfile();
            if (response.success && response.partner) {
                const { fullName, email, phoneNumber, address, city, state, pincode, profilePicture } = response.partner;
                setFormData({
                    fullName: fullName || '',
                    email: email || '',
                    phoneNumber: phoneNumber || '',
                    address: address || '',
                    city: city || '',
                    state: state || '',
                    pincode: pincode || '',
                    serviceCategories: response.partner.serviceCategories || []
                });
                if (profilePicture) setPreviewUrl(profilePicture);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== 'email' && key !== 'phoneNumber') {
                    if (key === 'serviceCategories' && Array.isArray(formData[key])) {
                        formData[key].forEach(cat => data.append('serviceCategories[]', cat));
                    } else {
                        data.append(key, formData[key]);
                    }
                }
            });
            if (profilePicture) {
                data.append('profilePicture', profilePicture);
            }

            await authService.updateProfile(data);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-4 mb-4">
                            Profile Settings
                        </h3>

                        {message.text && (
                            <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Profile Picture */}
                            <div className="flex items-center space-x-6">
                                <div className="shrink-0 relative">
                                    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-3xl font-bold text-gray-500">{formData.fullName.charAt(0)}</span>
                                        )}
                                    </div>
                                    <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 cursor-pointer shadow-sm">
                                        <CameraIcon className="h-4 w-4" />
                                        <input
                                            id="profile-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Profile Picture</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        JPG, GIF or PNG. Max size of 800K
                                    </p>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="fullName"
                                            id="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                                        Phone Number (Read-only)
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            id="phoneNumber"
                                            value={formData.phoneNumber}
                                            readOnly
                                            className="bg-gray-50 text-gray-500 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md p-2 border cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-4">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                        Street Address
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="address"
                                            id="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                        City
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="city"
                                            id="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                                        State
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="state"
                                            id="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                                        ZIP / Postal Code
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="pincode"
                                            id="pincode"
                                            value={formData.pincode}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Service Categories
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {[
                                            'Cleaning', 'Plumbing', 'Electrical', 'Carpentry', 'Painting',
                                            'Pest Control', 'Appliance Repair', 'AC Service', 'Water Tank Cleaning',
                                            'Home Deep Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning'
                                        ].map((category) => (
                                            <div key={category} className="flex items-start">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id={`category-${category}`}
                                                        name="serviceCategories"
                                                        type="checkbox"
                                                        value={category}
                                                        checked={formData.serviceCategories && formData.serviceCategories.includes(category)}
                                                        onChange={(e) => {
                                                            const { checked, value } = e.target;
                                                            setFormData(prev => {
                                                                const currentCategories = prev.serviceCategories || [];
                                                                if (checked) {
                                                                    return { ...prev, serviceCategories: [...currentCategories, value] };
                                                                } else {
                                                                    return { ...prev, serviceCategories: currentCategories.filter(c => c !== value) };
                                                                }
                                                            });
                                                        }}
                                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm">
                                                    <label htmlFor={`category-${category}`} className="font-medium text-gray-700">
                                                        {category}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5 border-t border-gray-200">
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => window.history.back()}
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Apply Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default Settings;
