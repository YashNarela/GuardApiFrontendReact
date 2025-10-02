import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Users, UserPlus, Edit, Trash2, LogOut, QrCode, FileText, Clock,
    Shield, BarChart3, Target, AlertTriangle, Download,
    Eye, EyeOff, Search
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const EmployeeDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboardData, setDashboardData] = useState(null);
    const [guards, setGuards] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [qrCodes, setQrCodes] = useState([]);
    const [patrolLogs, setPatrolLogs] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [patrolPlans, setPatrolPlans] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [reportsData, setReportsData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchGuard, setSearchGuard] = useState('');
    const [reportType, setReportType] = useState('patrol');
    const [reportPeriod, setReportPeriod] = useState('month');
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (activeTab !== 'dashboard' && activeTab !== 'reports') {
            fetchTabData();
        } else if (activeTab === 'reports') {
            fetchReports();
        }
    }, [activeTab, searchGuard, reportType, reportPeriod]);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('/api/employees/dashboard');
            setDashboardData(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTabData = async () => {
        try {
            setLoading(true);
            switch (activeTab) {
                case 'guards':
                    await fetchGuards();
                    break;
                case 'supervisors':
                    await fetchSupervisors();
                    break;
                case 'qr':
                    await fetchQRCodes();
                    break;
                case 'logs':
                    await fetchPatrolLogs();
                    break;
                case 'shifts':
                    await fetchShifts();
                    break;
                case 'plans':
                    await fetchPatrolPlans();
                    break;
                case 'incidents':
                    await fetchIncidents();
                    break;
                default:
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchGuards = async () => {
        try {
            const response = await axios.get('/api/guards');
            setGuards(response.data.data.guards || []);
        } catch (error) {
            toast.error('Failed to fetch guards');
        }
    };

    const fetchSupervisors = async () => {
        try {
            const response = await axios.get('/api/supervisors/getlist');
            setSupervisors(response.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch supervisors');
        }
    };

    const fetchQRCodes = async () => {
        try {
            const response = await axios.get('/api/qr');
            setQrCodes(response.data.data.qrs || []);
        } catch (error) {
            toast.error('Failed to fetch QR codes');
        }
    };

    const fetchPatrolLogs = async () => {
        try {
            const response = await axios.post(`/api/patrol/logs`);
            setPatrolLogs(response.data.data.logs || []);
        } catch (error) {
            toast.error('Failed to fetch patrol logs');
        }
    };

    const fetchShifts = async () => {
        try {
            const response = await axios.get('/api/shift');
            setShifts(response.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch shifts');
        }
    };

    const fetchPatrolPlans = async () => {
        try {
            const response = await axios.get('/api/employees/');
            setPatrolPlans(response.data.data.patrolPlans || []);
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

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/employees/reports?reportType=${reportType}&period=${reportPeriod}`);
            setReportsData(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const createGuard = async (data) => {
        try {
            await axios.post('/api/auth/register', {
                ...data,
                role: 'guard'
            });
            toast.success('Guard created successfully');
            fetchGuards();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to create guard');
        }
    };

    const createSupervisor = async (data) => {
        try {
            await axios.post('/api/auth/register', {
                ...data,
                role: 'supervisor'
            });
            toast.success('Supervisor created successfully');
            fetchSupervisors();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to create supervisor');
        }
    };

    const updateGuard = async (data) => {
        try {
            const payload = {
                name: data.name,
                email: data.email,
            };
            if (data.password && data.password.trim() !== "") {
                payload.password = data.password;
            }
            await axios.put(`/api/guards/${editingItem._id}`, payload);
            toast.success('Guard updated successfully');
            fetchGuards();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to update guard');
        }
    };

    const updateSupervisor = async (data) => {
        try {
            const payload = {
                name: data.name,
                email: data.email,
                phone: data.phone,
            };
            if (data.password && data.password.trim() !== "") {
                payload.password = data.password;
            }
            await axios.put(`/api/supervisors/${editingItem._id}`, payload);
            toast.success('Supervisor updated successfully');
            fetchSupervisors();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to update supervisor');
        }
    };

    const deleteGuard = async (id) => {
        if (window.confirm('Are you sure you want to delete this guard?')) {
            try {
                await axios.delete(`/api/guards/${id}`);
                toast.success('Guard deleted successfully');
                fetchGuards();
            } catch (error) {
                toast.error('Failed to delete guard');
            }
        }
    };

    const deleteSupervisor = async (id) => {
        if (window.confirm('Are you sure you want to delete this supervisor?')) {
            try {
                await axios.delete(`/api/supervisors/${id}`);
                toast.success('Supervisor deleted successfully');
                fetchSupervisors();
            } catch (error) {
                toast.error('Failed to delete supervisor');
            }
        }
    };

    const createQR = async (data) => {
        try {
            const qrData = {
                lat: parseFloat(data.lat),
                lng: parseFloat(data.lng),
                radius: parseInt(data.radius),
                siteId: data.siteId,
                description: data.description
            };
            await axios.post('/api/qr', qrData);
            toast.success('QR code created successfully');
            fetchQRCodes();
            closeModal();
        } catch (error) {
            toast.error('Failed to create QR code');
        }
    };

    const deleteQR = async (id) => {
        if (window.confirm('Are you sure you want to delete this QR code?')) {
            try {
                await axios.delete(`/api/qr/${id}`);
                toast.success('QR code deleted successfully');
                fetchQRCodes();
            } catch (error) {
                toast.error('Failed to delete QR code');
            }
        }
    };

    const createShift = async (data) => {
        try {
            await axios.post('/api/shift', {
                guardId: data.guardId,
                startTime: data.startTime,
                endTime: data.endTime,
                shiftType: data.shiftType
            });
            toast.success('Shift created successfully');
            fetchShifts();
            closeModal();
        } catch (error) {
            toast.error('Failed to create shift');
        }
    };

    const updateShift = async (data) => {
        try {
            await axios.put(`/api/shift/${editingItem._id}`, {
                startTime: data.startTime,
                endTime: data.endTime,
                shiftType: data.shiftType
            });
            toast.success('Shift updated successfully');
            fetchShifts();
            closeModal();
        } catch (error) {
            toast.error('Failed to update shift');
        }
    };

    const deleteShift = async (id) => {
        if (window.confirm('Are you sure you want to delete this shift?')) {
            try {
                await axios.delete(`/api/shift/${id}`);
                toast.success('Shift deleted successfully');
                fetchShifts();
            } catch (error) {
                toast.error('Failed to delete shift');
            }
        }
    };

    const updateIncidentStatus = async (incidentId, status) => {
        try {
            await axios.put(`/api/incidents/${incidentId}/status`, { status });
            toast.success('Incident status updated');
            fetchIncidents();
        } catch (error) {
            toast.error('Failed to update incident status');
        }
    };

    const openModal = (type, item = null) => {
        setModalType(type);
        setEditingItem(item);
        setShowModal(true);
        if (item) {
            // Format datetime values for form inputs
            if (item.startTime) {
                item.startTime = new Date(item.startTime).toISOString().slice(0, 16);
            }
            if (item.endTime) {
                item.endTime = new Date(item.endTime).toISOString().slice(0, 16);
            }
            reset(item);
        } else {
            reset();
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setEditingItem(null);
        reset();
        setShowPassword(false);
    };

    const handleFormSubmit = (data) => {
        switch (modalType) {
            case 'guard':
                if (editingItem) updateGuard(data);
                else createGuard(data);
                break;
            case 'supervisor':
                if (editingItem) updateSupervisor(data);
                else createSupervisor(data);
                break;
            case 'qr':
                createQR(data);
                break;
            case 'shift':
                if (editingItem) updateShift(data);
                else createShift(data);
                break;
            default:
                break;
        }
    };

    const exportReport = () => {
        if (!reportsData) return;
        const dataStr = JSON.stringify(reportsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${reportType}-${reportPeriod}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getIncidentStatusColor = (status) => {
        switch (status) {
            case 'reported': return 'bg-yellow-100 text-yellow-800';
            case 'investigating': return 'bg-blue-100 text-blue-800';
            case 'in-progress': return 'bg-purple-100 text-purple-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getIncidentSeverityColor = (severity) => {
        switch (severity) {
            case 'low': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'critical': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'supervisors', label: 'Supervisors', icon: Users },
        { id: 'guards', label: 'Guards', icon: Shield },
        { id: 'qr', label: 'QR Codes', icon: QrCode },
        { id: 'plans', label: 'Patrol Plans', icon: Target },
        { id: 'shifts', label: 'Shifts', icon: Clock },
        { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
        { id: 'logs', label: 'Patrol Logs', icon: FileText },
        { id: 'reports', label: 'Reports', icon: Download }
    ];

    if (loading && !dashboardData) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-600">Welcome, {user?.name}</p>
                        </div>
                        <button
                            onClick={logout}
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
                    {/* Tabs Navigation */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
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

                    {/* DASHBOARD */}
                    {activeTab === 'dashboard' && dashboardData && (
                        <div className="space-y-6">
                            {/* Primary Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow flex items-center">
                                    <Users className="w-8 h-8 text-blue-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Supervisors</p>
                                        <p className="text-2xl font-bold text-gray-900">{dashboardData.stats?.totalSupervisors || 0}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow flex items-center">
                                    <Shield className="w-8 h-8 text-green-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Guards</p>
                                        <p className="text-2xl font-bold text-gray-900">{dashboardData.stats?.totalGuards || 0}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow flex items-center">
                                    <Target className="w-8 h-8 text-purple-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Patrol Plans</p>
                                        <p className="text-2xl font-bold text-gray-900">{dashboardData.stats?.totalPatrolPlans || 0}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow flex items-center">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Pending Incidents</p>
                                        <p className="text-2xl font-bold text-gray-900">{dashboardData.stats?.pendingIncidents || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUPERVISORS */}
                    {/* {activeTab === 'supervisors' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Supervisors Management</h2>
                                <button
                                    onClick={() => openModal('supervisor')}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Supervisor
                                </button>
                            </div>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                        {supervisors.map((supervisor) => (
                                            <li key={supervisor._id} className="px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">{supervisor.name}</h3>
                                                        <p className="text-sm text-gray-600">{supervisor.email}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Guards: {supervisor.guards?.length || 0}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Created: {new Date(supervisor.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => openModal('supervisor', supervisor)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteSupervisor(supervisor._id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                        {supervisors.length === 0 && (
                                            <li className="px-6 py-8 text-center text-gray-500">
                                                No supervisors found
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )} */}

                      {activeTab === 'supervisors' && (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Supervisors Management</h2>
            <button

                onClick={() => openModal('supervisor')}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Supervisor
            </button>
        </div>
        {loading ? (
            <div className="text-center py-8">Loading...</div>
        ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {supervisors.map((supervisor) => (
                        <li key={supervisor._id} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{supervisor.name}</h3>
                                    <p className="text-sm text-gray-600">{supervisor.email}</p>
                                    <p className="text-sm text-gray-600">Phone: {supervisor.phone || 'Not provided'}</p> {/* Add phone display */}
                                    <p className="text-xs text-gray-500">
                                        Guards: {supervisor.guards?.length || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Created: {new Date(supervisor.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => openModal('supervisor', supervisor)}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteSupervisor(supervisor._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {supervisors.length === 0 && (
                        <li className="px-6 py-8 text-center text-gray-500">
                            No supervisors found
                        </li>
                    )}
                </ul>
            </div>
        )}
    </div>
)}


{(modalType === 'guard' || modalType === 'supervisor') && (
    <>
        <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
                type="email"
                {...register('email', {
                    required: 'Email is required',
                    pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address'
                    }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        {/* Add Phone Field */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
                type="tel"
                {...register('phone', {
                    pattern: {
                        value: /^[+]?[\d\s\-()]+$/,
                        message: 'Please enter a valid phone number'
                    }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="+1 (555) 123-4567"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">
                Password {editingItem && '(leave blank to keep current)'}
            </label>
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    {...register('password', {
                        required: !editingItem ? 'Password is required' : false,
                        minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                        }
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
    </>
)}



                    {/* GUARDS */}
                    {activeTab === 'guards' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Guards Management</h2>
                                <button
                                    onClick={() => openModal('guard')}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Guard
                                </button>
                            </div>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                        {guards.map((guard) => (
                                            <li key={guard._id} className="px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">{guard.name}</h3>
                                                        <p className="text-sm text-gray-600">{guard.email}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Supervisor: {guard.supervisor?.name || 'Not assigned'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Created: {new Date(guard.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => openModal('guard', guard)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteGuard(guard._id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                        {guards.length === 0 && (
                                            <li className="px-6 py-8 text-center text-gray-500">
                                                No guards found
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* QR CODES */}
                    {activeTab === 'qr' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">QR Codes Management</h2>
                                <button
                                    onClick={() => openModal('qr')}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    <QrCode className="w-4 h-4 mr-2" />
                                    Add QR Code
                                </button>
                            </div>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {qrCodes.map((qr) => (
                                        <div key={qr._id} className="bg-white rounded-lg shadow p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-bold text-lg">{qr.siteId}</h3>
                                                <button
                                                    onClick={() => deleteQR(qr._id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{qr.description}</p>
                                            <div className="space-y-1 text-xs text-gray-500">
                                                <p>Lat: {qr.lat}</p>
                                                <p>Lng: {qr.lng}</p>
                                                <p>Radius: {qr.radius}m</p>
                                                <p>Created: {new Date(qr.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {qrCodes.length === 0 && (
                                        <div className="col-span-full text-center py-8 text-gray-500">
                                            No QR codes found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PATROL PLANS */}
                    {activeTab === 'plans' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Patrol Plans</h2>
                            </div>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                        {patrolPlans.map((plan) => (
                                            <li key={plan._id} className="px-6 py-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                                                        <p className="text-sm text-gray-600">{plan.description}</p>
                                                        <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                                                            <span>Checkpoints: {plan.checkpoints?.length || 0}</span>
                                                            <span>Frequency: {plan.frequency}</span>
                                                            <span>Duration: {plan.duration} mins</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${plan.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {plan.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                        {patrolPlans.length === 0 && (
                                            <li className="px-6 py-8 text-center text-gray-500">
                                                No patrol plans found
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SHIFTS */}
                    {activeTab === 'shifts' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
                                <button
                                    onClick={() => openModal('shift')}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Add Shift
                                </button>
                            </div>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                        {shifts.map((shift) => (
                                            <li key={shift._id} className="px-6 py-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">
                                                            {shift.guard?.name || 'Unassigned Guard'}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(shift.startTime).toLocaleString()} - {' '}
                                                            {new Date(shift.endTime).toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-gray-500 capitalize">
                                                            Type: {shift.shiftType}
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => openModal('shift', shift)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteShift(shift._id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                        {shifts.length === 0 && (
                                            <li className="px-6 py-8 text-center text-gray-500">
                                                No shifts found
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* INCIDENTS */}
                    {activeTab === 'incidents' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Incident Management</h2>
                            </div>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                        {incidents.map((incident) => (
                                            <li key={incident._id} className="px-6 py-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="text-lg font-medium text-gray-900">
                                                                {incident.title}
                                                            </h3>
                                                            <div className="flex space-x-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${getIncidentSeverityColor(incident.severity)}`}>
                                                                    {incident.severity}
                                                                </span>
                                                                <span className={`px-2 py-1 rounded-full text-xs ${getIncidentStatusColor(incident.status)}`}>
                                                                    {incident.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-4">
                                                            <div>
                                                                <strong>Location:</strong><br />
                                                                {incident.location?.address || `Lat: ${incident.location?.lat}, Lng: ${incident.location?.lng}` || 'N/A'}
                                                            </div>
                                                            <div>
                                                                <strong>Reported By:</strong><br />
                                                                {incident.reportedBy?.name || 'Unknown'}
                                                            </div>
                                                            <div>
                                                                <strong>Reported At:</strong><br />
                                                                {new Date(incident.createdAt).toLocaleString()}
                                                            </div>
                                                            <div>
                                                                <strong>Last Updated:</strong><br />
                                                                {new Date(incident.updatedAt).toLocaleString()}
                                                            </div>
                                                        </div>

                                                        {/* PHOTOS */}
                                                        {incident.photos && incident.photos.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mb-4">
                                                                {incident.photos.map((photo, idx) => (
                                                                    <img
                                                                        key={idx}
                                                                        src={photo}
                                                                        alt={`Incident ${incident.title} photo ${idx + 1}`}
                                                                        className="w-32 h-32 object-cover rounded-md border"
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* VIDEO */}
                                                        {incident.video && (
                                                            <div className="mb-4">
                                                                <video controls className="w-full max-w-md rounded-md border">
                                                                    <source src={incident.video} type="video/mp4" />
                                                                    Your browser does not support the video tag.
                                                                </video>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status Update Buttons */}
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {['reported', 'investigating', 'in-progress', 'resolved', 'closed'].map((status) => (
                                                        <button
                                                            key={status}
                                                            onClick={() => updateIncidentStatus(incident._id, status)}
                                                            className={`px-3 py-1 text-xs rounded-full capitalize ${incident.status === status
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                        >
                                                            {status.replace('-', ' ')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </li>
                                        ))}
                                        {incidents.length === 0 && (
                                            <li className="px-6 py-8 text-center text-gray-500">
                                                No incidents found
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}


                    {/* PATROL LOGS */}

                    {/* PATROL LOGS - Based on actual API response structure */}
                    {activeTab === 'logs' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Patrol Logs</h2>
                                <div className="flex space-x-4">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by guard name..."
                                            value={searchGuard}
                                            onChange={(e) => setSearchGuard(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        S.No.
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Guard Name
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Shift
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        QR Code Site
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Scan Time
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Location
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Distance (m)
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Verified
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {patrolLogs.map((log, index) => {
                                                    const scanTime = new Date(log.scanTime);
                                                    const formattedDateTime = scanTime.toLocaleString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: false
                                                    }).replace(', ', ' ');

                                                    return (
                                                        <tr key={log._id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {index + 1}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {log.guard?.name || 'Unknown Guard'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {log.shift?.shiftName || 'Not Assigned'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {log.qrCode?.siteId || 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formattedDateTime}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {log.location?.lat}, {log.location?.lng}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {log.distanceMeters || 0}m
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.isVerified
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {log.isVerified ? 'Yes' : 'No'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    {patrolLogs.length === 0 && (
                                        <div className="px-6 py-8 text-center text-gray-500">
                                            No patrol logs found
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Summary Section */}
                            {patrolLogs.length > 0 && (
                                <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">Patrol Summary</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Guard Name
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Total Scans
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Verified Scans
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Success Rate
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {Array.from(new Set(patrolLogs.map(log => log.guard?.name))).map(guardName => {
                                                    const guardLogs = patrolLogs.filter(log => log.guard?.name === guardName);
                                                    const verifiedLogs = guardLogs.filter(log => log.isVerified);
                                                    const successRate = guardLogs.length > 0
                                                        ? Math.round((verifiedLogs.length / guardLogs.length) * 100)
                                                        : 0;

                                                    return (
                                                        <tr key={guardName}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {guardName}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {guardLogs.length}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {verifiedLogs.length}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {successRate}%
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
               

                    {/* REPORTS */}
                    {activeTab === 'reports' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                                <div className="flex space-x-4">
                                    <select
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="patrol">Patrol Reports</option>
                                        <option value="incident">Incident Reports</option>
                                        <option value="guard">Guard Performance</option>
                                        <option value="shift">Shift Reports</option>
                                    </select>
                                    <select
                                        value={reportPeriod}
                                        onChange={(e) => setReportPeriod(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="day">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                        <option value="quarter">This Quarter</option>
                                        <option value="year">This Year</option>
                                    </select>
                                    <button
                                        onClick={exportReport}
                                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export
                                    </button>
                                </div>
                            </div>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="space-y-6">
                                    {reportsData ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="bg-white p-6 rounded-lg shadow">
                                                    <h3 className="font-bold text-lg mb-2">Total Activities</h3>
                                                    <p className="text-3xl font-bold text-indigo-600">
                                                        {reportsData.summary?.totalActivities || 0}
                                                    </p>
                                                </div>
                                                <div className="bg-white p-6 rounded-lg shadow">
                                                    <h3 className="font-bold text-lg mb-2">Completed</h3>
                                                    <p className="text-3xl font-bold text-green-600">
                                                        {reportsData.summary?.completed || 0}
                                                    </p>
                                                </div>
                                                <div className="bg-white p-6 rounded-lg shadow">
                                                    <h3 className="font-bold text-lg mb-2">Success Rate</h3>
                                                    <p className="text-3xl font-bold text-blue-600">
                                                        {reportsData.summary?.successRate || 0}%
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-lg shadow">
                                                <h3 className="font-bold text-lg mb-4">Detailed Report</h3>
                                                <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                                                    {JSON.stringify(reportsData.details, null, 2)}
                                                </pre>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No report data available
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MODAL FORM */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6">
                                    <h2 className="text-xl font-bold mb-4">
                                        {editingItem ? `Edit ${modalType}` : `Add New ${modalType}`}
                                    </h2>
                                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                                        {(modalType === 'guard' || modalType === 'supervisor') && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                                    <input
                                                        type="text"
                                                        {...register('name', { required: 'Name is required' })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                    />
                                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                                    <input
                                                        type="email"
                                                        {...register('email', {
                                                            required: 'Email is required',
                                                            pattern: {
                                                                value: /^\S+@\S+$/i,
                                                                message: 'Invalid email address'
                                                            }
                                                        })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                    />
                                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                                </div>
                                                  <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input
                                    type="tel"
                                    {...register('phone', {
                                        pattern: {
                                            value: /^[+]?[\d\s\-()]+$/,
                                            message: 'Please enter a valid phone number'
                                        }
                                    })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                    placeholder="+1 (555) 123-4567"
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                            </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Password {editingItem && '(leave blank to keep current)'}
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            {...register('password', {
                                                                required: !editingItem ? 'Password is required' : false,
                                                                minLength: {
                                                                    value: 6,
                                                                    message: 'Password must be at least 6 characters'
                                                                }
                                                            })}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                        />


                                                        
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                                        >
                                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                                                </div>
                                            </>
                                        )}

                                        {modalType === 'qr' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Site ID</label>
                                                    <input
                                                        type="text"
                                                        {...register('siteId', { required: 'Site ID is required' })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                    />
                                                    {errors.siteId && <p className="text-red-500 text-xs mt-1">{errors.siteId.message}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                                    <textarea
                                                        {...register('description', { required: 'Description is required' })}
                                                        rows={3}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                    />
                                                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Latitude</label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            {...register('lat', {
                                                                required: 'Latitude is required',
                                                                valueAsNumber: true
                                                            })}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                        />
                                                        {errors.lat && <p className="text-red-500 text-xs mt-1">{errors.lat.message}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Longitude</label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            {...register('lng', {
                                                                required: 'Longitude is required',
                                                                valueAsNumber: true
                                                            })}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                        />
                                                        {errors.lng && <p className="text-red-500 text-xs mt-1">{errors.lng.message}</p>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Radius (meters)</label>
                                                    <input
                                                        type="number"
                                                        {...register('radius', {
                                                            required: 'Radius is required',
                                                            valueAsNumber: true,
                                                            min: { value: 1, message: 'Radius must be at least 1 meter' }
                                                        })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                    />
                                                    {errors.radius && <p className="text-red-500 text-xs mt-1">{errors.radius.message}</p>}
                                                </div>
                                            </> 
                                        )}

                                        {modalType === 'shift' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Guard</label>
                                                    <select
                                                        {...register('guardId', { required: 'Guard is required' })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                        disabled={!!editingItem}
                                                    >
                                                        <option value="">Select a guard</option>
                                                        {guards.map((guard) => (
                                                            <option key={guard._id} value={guard._id}>
                                                                {guard.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.guardId && <p className="text-red-500 text-xs mt-1">{errors.guardId.message}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Shift Type</label>
                                                    <select
                                                        {...register('shiftType', { required: 'Shift type is required' })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                    >
                                                        <option value="morning">Morning</option>
                                                        <option value="afternoon">Afternoon</option>
                                                        <option value="night">Night</option>
                                                        <option value="general">General</option>
                                                    </select>
                                                    {errors.shiftType && <p className="text-red-500 text-xs mt-1">{errors.shiftType.message}</p>}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                                        <input
                                                            type="datetime-local"
                                                            {...register('startTime', { required: 'Start time is required' })}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                        />
                                                        {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">End Time</label>
                                                        <input
                                                            type="datetime-local"
                                                            {...register('endTime', { required: 'End time is required' })}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                        />
                                                        {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                            >
                                                {editingItem ? 'Update' : 'Create'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default EmployeeDashboard;