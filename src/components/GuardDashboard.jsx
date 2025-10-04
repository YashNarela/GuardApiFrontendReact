import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    LogOut, Shield, Target, AlertTriangle, BarChart3, Clock,
    Camera, MapPin, CheckCircle, XCircle, FileText, Plus
} from 'lucide-react';
import axios from '../services/axiosConfig';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const GuardDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboardData, setDashboardData] = useState(null);
    const [patrolPlans, setPatrolPlans] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [qrCodes, setQrCodes] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedQR, setSelectedQR] = useState(null);
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        getCurrentLocation();
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (activeTab !== 'dashboard') {
            fetchTabData();
        }
    }, [activeTab]);
const handleLogout = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // if (token) {
    //   try {
    //     await axios.post(
    //       'http://localhost:2042/api/auth/logout', 
    //       {}, 
    //       {
    //         headers: { 
    //           'Authorization': `Bearer ${token}`,
    //           'Content-Type': 'application/json'
    //         },
    //         timeout: 5000 // 5 second timeout
    //       }
    //     );
    //   } catch (apiError) {
    //     console.warn('Logout API call failed, but continuing with local logout:', apiError);
    //     // Continue with local logout even if API call fails
    //   }
    // }
    
    // Clear all local storage items related to auth
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    toast.success('Logged out successfully');
    
    // Use setTimeout to ensure toast is visible before redirect
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
    
  } catch (error) {
    console.error('Unexpected logout error:', error);
    toast.error('Error during logout');
    
    // Force redirect even on error
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  } finally {
    setLoading(false);
  }
};
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    toast.error('Unable to get location. Please enable location services.');
                }
            );
        }
    };

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('/api/patrol/dashboard');
            setDashboardData(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch dashboard data');
        }
    };

    const fetchTabData = async () => {
        try {
            setLoading(true);
            switch (activeTab) {
                case 'plans':
                    await fetchPatrolPlans();
                    break;
                case 'incidents':
                    await fetchIncidents();
                    break;
                case 'qr-codes':
                    await fetchQRCodes();
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPatrolPlans = async () => {
        try {
            const response = await axios.get('/api/plans/my-plans');
            setPatrolPlans(response.data.data.plans || []);
        } catch (error) {
            toast.error('Failed to fetch patrol plans');
        }
    };

    const fetchIncidents = async () => {
        try {
            const response = await axios.get('/api/incidents');
            setIncidents(response.data.data.incidents || []);
        } catch (error) {
            toast.error('Failed to fetch incidents');
        }
    };

    const fetchQRCodes = async () => {
        try {
            const response = await axios.get('/api/patrol/shift-qr');
            setQrCodes(response.data.data.qrCodes || []);
        } catch (error) {
            toast.error('Failed to fetch QR codes');
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    };

    const scanQR = async () => {
        if (!selectedQR) {
            toast.error('Please select a QR code first');
            return;
        }

        if (!currentLocation) {
            toast.error('Location not available');
            return;
        }

        if (!selectedFile) {
            toast.error('Please capture a photo first');
            return;
        }

        setScanLoading(true);
        try {
            // Calculate distance between guard location and QR code location
            const distanceMeters = calculateDistance(
                currentLocation.lat,
                currentLocation.lng,
                selectedQR.lat,
                selectedQR.lng
            );

            // Check if guard is within the QR code's radius
            const isVerified = distanceMeters <= selectedQR.radius;

            const formData = new FormData();
            formData.append('qrData', selectedQR._id);
            formData.append('guardLat', currentLocation.lat);
            formData.append('guardLng', currentLocation.lng);
            formData.append('distanceMeters', distanceMeters);
            formData.append('isVerified', isVerified);
            formData.append('photo', selectedFile);

            await axios.post('/api/patrol/scan', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Patrol submitted successfully!');
            setSelectedFile(null);
            setSelectedQR(null);
            fetchDashboardData();
            fetchQRCodes();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to submit patrol');
        } finally {
            setScanLoading(false);
        }
    };

    const completeCheckpoint = async (planId, qrId) => {
        try {
            await axios.post('/api/patrol/complete-checkpoint', {
                patrolPlanId: planId,
                qrId: qrId
            });
            toast.success('Checkpoint marked as complete');
            fetchPatrolPlans();
        } catch (error) {
            toast.error('Failed to complete checkpoint');
        }
    };

    const token = localStorage.getItem("token");
    const reportIncident = async (data) => {
        setLoading(true);
        try {
            const formData = new FormData();

            // Append text fields
            formData.append("title", data.title);
            formData.append("description", data.description);
            formData.append("type", data.type);
            formData.append("severity", data.severity || "medium");

            // Append current location if available
            if (currentLocation) {
                formData.append("location", JSON.stringify({
                    coordinates: [currentLocation.lng, currentLocation.lat],
                    type: "Point"
                }));
            }

            // Append photos
            if (data.photos && data.photos.length > 0) {
                Array.from(data.photos).forEach((file) => {
                    console.log('Adding photo:', file.name, file.type, file.size);
                    formData.append("files", file);
                });
            }

            // Append video
            if (data.video && data.video[0]) {
                const videoFile = data.video[0];
                console.log('Adding video:', videoFile.name, videoFile.type, videoFile.size);
                formData.append("files", videoFile);
            }

            console.log('Sending incident report...');
            console.log('Token:', token); // Debug log

            const response = await axios.post("/api/incidents", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Response:', response.data);

            if (response.data.success) {
                toast.success('Incident reported successfully!');
                setShowIncidentModal(false);
                reset();
                fetchIncidents();
            } else {
                toast.error(response.data.message || 'Failed to report incident');
            }
        } catch (error) {
            console.error('Error reporting incident:', error);
            console.error('Error response:', error.response);
            toast.error(error.response?.data?.message || error.response?.data?.msg || 'Failed to report incident');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            toast.success('Photo selected');
        }
    };

    const openCamera = () => {
        // Simple camera implementation - in real app, you'd use a proper camera library
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e) => handleFileSelect(e);
        input.click();
    };

    const handleQRSelect = (qr) => {
        setSelectedQR(qr);
        toast.success(`Selected QR: ${qr.siteId}`);
    };

    const clearSelection = () => {
        setSelectedQR(null);
        setSelectedFile(null);
    };

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'plans', label: 'Patrol Plans', icon: Target },
        { id: 'qr-codes', label: 'QR Scan', icon: Shield },
        { id: 'incidents', label: 'Incidents', icon: AlertTriangle }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Guard Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-600">Welcome, {user?.name}</p>
                            {currentLocation && (
                                <p className="text-xs text-gray-500 flex items-center mt-1">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                                </p>
                            )}
                            {dashboardData?.currentShift && (
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Shift: {new Date(dashboardData.currentShift.startTime).toLocaleTimeString()} - {' '}
                                    {new Date(dashboardData.currentShift.endTime).toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                 <button
  onClick={handleLogout}
  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
>
  <LogOut className="w-4 h-4 mr-2" />
  Logout
</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5 mr-2" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {dashboardData ? (
                                <>
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white p-6 rounded-lg shadow">
                                            <div className="flex items-center">
                                                <Target className="w-8 h-8 text-blue-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-gray-600">Today's Patrols</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {dashboardData.todayStats.patrols}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-lg shadow">
                                            <div className="flex items-center">
                                                <CheckCircle className="w-8 h-8 text-green-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {dashboardData.todayStats.completionRate}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-lg shadow">
                                            <div className="flex items-center">
                                                <AlertTriangle className="w-8 h-8 text-orange-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-gray-600">Recent Incidents</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {dashboardData.recentIncidents.length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assigned Plans */}
                                    <div className="bg-white p-6 rounded-lg shadow">
                                        <h3 className="text-lg font-bold mb-4">Assigned Patrol Plans</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {dashboardData.assignedPlans?.slice(0, 4).map((plan) => (
                                                <div key={plan._id} className="border rounded-lg p-4">
                                                    <h4 className="font-semibold">{plan.planName}</h4>
                                                    <p className="text-sm text-gray-600">{plan.description}</p>
                                                    <div className="mt-2">
                                                        <p className="text-xs text-gray-500">
                                                            Checkpoints: {plan.checkpoints.length}
                                                        </p>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                            <div
                                                                className="bg-green-600 h-2 rounded-full"
                                                                style={{
                                                                    width: `${(plan.checkpoints.filter(cp => cp.isCompleted).length / plan.checkpoints.length) * 100}%`
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Patrols */}
                                    <div className="bg-white p-6 rounded-lg shadow">
                                        <h3 className="text-lg font-bold mb-4">Recent Patrols</h3>
                                        <div className="space-y-3">
                                            {dashboardData.todayPatrols?.slice(0, 5).map((patrol) => (
                                                <div key={patrol._id} className="flex items-center justify-between p-3 border rounded">
                                                    <div>
                                                        <p className="font-medium">{patrol.qrCodeId?.siteId}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(patrol.createdAt).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${patrol.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {patrol.isVerified ? 'Verified' : 'Not Verified'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">Loading dashboard...</div>
                            )}
                        </div>
                    )}

                    {/* Patrol Plans Tab */}
                    {activeTab === 'plans' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Patrol Plans</h2>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="space-y-6">
                                    {patrolPlans.map((plan) => (
                                        <div key={plan._id} className="bg-white rounded-lg shadow p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold">{plan.planName}</h3>
                                                    <p className="text-gray-600">{plan.description}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Frequency: {plan.frequency} • Shift: {plan.shift?.shiftType}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {plan.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="font-medium">Checkpoints:</h4>
                                                {plan.checkpoints.map((checkpoint) => (
                                                    <div key={checkpoint._id} className="flex items-center justify-between p-3 border rounded">
                                                        <div>
                                                            <p className="font-medium">{checkpoint.qrId?.siteId}</p>
                                                            <p className="text-sm text-gray-600">{checkpoint.qrId?.description}</p>
                                                            <p className="text-xs text-gray-500">
                                                                Expected time: {checkpoint.expectedTime} mins
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => completeCheckpoint(plan._id, checkpoint.qrId._id)}
                                                            disabled={checkpoint.isCompleted}
                                                            className={`px-3 py-1 rounded text-sm ${checkpoint.isCompleted
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                                }`}
                                                        >
                                                            {checkpoint.isCompleted ? 'Completed' : 'Mark Complete'}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {patrolPlans.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            No patrol plans assigned to you.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* QR Scan Tab */}
                    {activeTab === 'qr-codes' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* QR Codes List */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Available QR Codes</h3>
                                    {selectedQR && (
                                        <button
                                            onClick={clearSelection}
                                            className="text-sm text-red-600 hover:text-red-800"
                                        >
                                            Clear Selection
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {qrCodes.map((qr) => (
                                        <button
                                            key={qr._id}
                                            onClick={() => handleQRSelect(qr)}
                                            className={`w-full text-left p-4 border rounded-lg transition-colors ${selectedQR?._id === qr._id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{qr.siteId}</p>
                                                    <p className="text-sm text-gray-600">{qr.description}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Location: {qr.lat}, {qr.lng} • Radius: {qr.radius}m
                                                    </p>
                                                    {currentLocation && (
                                                        <p className="text-xs text-gray-500">
                                                            Distance: {calculateDistance(currentLocation.lat, currentLocation.lng, qr.lat, qr.lng).toFixed(0)}m
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    {qr.isCompleted && (
                                                        <CheckCircle className="w-5 h-5 text-green-500 mb-1" />
                                                    )}
                                                    {currentLocation && (
                                                        <span className={`text-xs px-2 py-1 rounded ${calculateDistance(currentLocation.lat, currentLocation.lng, qr.lat, qr.lng) <= qr.radius
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {calculateDistance(currentLocation.lat, currentLocation.lng, qr.lat, qr.lng) <= qr.radius
                                                                ? 'In Range'
                                                                : 'Out of Range'
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Scan Interface */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-bold mb-4">Scan QR Code</h3>

                                {/* Selected QR Info */}
                                {selectedQR ? (
                                    <div className="mb-6 p-4 border border-green-200 rounded-lg bg-green-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-green-900">Selected QR Code</h4>
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                        <p className="text-sm text-green-700"><strong>Site:</strong> {selectedQR.siteId}</p>
                                        <p className="text-sm text-green-700"><strong>Description:</strong> {selectedQR.description}</p>
                                        <p className="text-sm text-green-700"><strong>Location:</strong> {selectedQR.lat}, {selectedQR.lng}</p>
                                        <p className="text-sm text-green-700"><strong>Radius:</strong> {selectedQR.radius}m</p>

                                        {/* Distance Calculation */}
                                        {currentLocation && (
                                            <div className="mt-3 p-2 bg-white rounded border">
                                                <p className="text-xs text-green-700">
                                                    <strong>Distance:</strong> {calculateDistance(
                                                        currentLocation.lat,
                                                        currentLocation.lng,
                                                        selectedQR.lat,
                                                        selectedQR.lng
                                                    ).toFixed(0)}m
                                                </p>
                                                <p className="text-xs text-green-700">
                                                    <strong>Verification:</strong> {calculateDistance(
                                                        currentLocation.lat,
                                                        currentLocation.lng,
                                                        selectedQR.lat,
                                                        selectedQR.lng
                                                    ) <= selectedQR.radius ? 'Within Range ✓' : 'Out of Range ✗'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                        <p className="text-sm text-gray-600 text-center">
                                            Please select a QR code from the list to begin scanning
                                        </p>
                                    </div>
                                )}

                                {/* Photo Capture */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Capture Photo
                                    </label>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={openCamera}
                                            disabled={!selectedQR}
                                            className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Camera className="w-5 h-5 mr-2" />
                                            Take Photo
                                        </button>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            disabled={!selectedQR}
                                            className="hidden"
                                            id="photo-upload"
                                        />
                                        <label
                                            htmlFor="photo-upload"
                                            className={`flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer ${!selectedQR ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <FileText className="w-5 h-5 mr-2" />
                                            Upload Photo
                                        </label>
                                    </div>
                                    {selectedFile && (
                                        <div className="mt-3 p-3 bg-green-50 rounded-md">
                                            <div className="flex items-center">
                                                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                                <span className="text-green-700">Photo ready for submission</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Current Location */}
                                {currentLocation && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                        <p className="text-sm text-gray-600">
                                            <strong>Your Location:</strong> {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                                        </p>
                                    </div>
                                )}

                                {/* Scan Button */}
                                <button
                                    onClick={scanQR}
                                    disabled={!selectedQR || !selectedFile || scanLoading}
                                    className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {scanLoading ? 'Scanning...' : (
                                        selectedQR && currentLocation
                                            ? calculateDistance(
                                                currentLocation.lat,
                                                currentLocation.lng,
                                                selectedQR.lat,
                                                selectedQR.lng
                                            ) <= selectedQR.radius
                                                ? 'Scan QR Code (Verified)'
                                                : 'Scan QR Code (Not Verified)'
                                            : 'Scan QR Code'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Incidents Tab */}
                    {activeTab === 'incidents' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Incident Reports</h2>
                                <button
                                    onClick={() => setShowIncidentModal(true)}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Report Incident
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="space-y-4">
                                    {incidents.map((incident) => (
                                        <div key={incident._id} className="bg-white rounded-lg shadow p-6">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="text-lg font-bold">{incident.title}</h3>
                                                    <p className="text-gray-600">{incident.description}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                    incident.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {incident.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span>Type: {incident.type}</span>
                                                <span>Severity: {incident.severity}</span>
                                                <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {incidents.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            No incidents reported yet.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Incident Report Modal */}
            {showIncidentModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Report Incident</h3>
                        <form onSubmit={handleSubmit(reportIncident)} className="space-y-4">

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    {...register('title', { required: 'Title is required' })}
                                    type="text"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                           focus:outline-none focus:ring-red-500 focus:border-red-500"
                                />
                                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    {...register('description', { required: 'Description is required' })}
                                    rows={3}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                           focus:outline-none focus:ring-red-500 focus:border-red-500"
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    {...register('type', { required: 'Type is required' })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                           focus:outline-none focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="">Select type</option>
                                    <option value="security">Security</option>
                                    <option value="safety">Safety</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="medical">Medical</option>
                                    <option value="fire">Fire</option>
                                    <option value="theft">Theft</option>
                                    <option value="vandalism">Vandalism</option>
                                    <option value="other">Other</option>
                                </select>
                                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
                            </div>

                            {/* Severity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Severity</label>
                                <select
                                    {...register('severity')}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                           focus:outline-none focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            {/* Photos */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Photo Evidence (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    {...register('photos')}
                                    multiple
                                    className="mt-1 block w-full text-sm text-gray-500 
                           file:mr-4 file:py-2 file:px-4 
                           file:rounded-md file:border-0 
                           file:text-sm file:font-semibold 
                           file:bg-blue-50 file:text-blue-700 
                           hover:file:bg-blue-100"
                                />
                            </div>

                            {/* Video */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Video Evidence (Optional)</label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    {...register('video')}
                                    className="mt-1 block w-full text-sm text-gray-500 
                           file:mr-4 file:py-2 file:px-4 
                           file:rounded-md file:border-0 
                           file:text-sm file:font-semibold 
                           file:bg-green-50 file:text-green-700 
                           hover:file:bg-green-100"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowIncidentModal(false);
                                        reset();
                                    }}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                    {loading ? 'Reporting...' : 'Report Incident'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default GuardDashboard;
