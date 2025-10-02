import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Users, UserPlus, Edit, Trash2, LogOut, QrCode, FileText, Clock,
    Shield, MapPin, Calendar, BarChart3, AlertTriangle, Target,
    Play, Pause, CheckCircle, XCircle,Plus, Map, Minus, UserMinus,
    Download, Upload, Filter, Search, Eye, Settings, Bell, MessageSquare  ,  ChevronLeft, 
    ChevronRight,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';

const SupervisorDashboard = () => {

        const [incidentStats, setIncidentStats] = useState(null);
    const [statsPeriod, setStatsPeriod] = useState("month"); // week, month, year
    const [mediaModal, setMediaModal] = useState({ type: null, src: null });
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboardData, setDashboardData] = useState(null);
    const [guards, setGuards] = useState([]);
    const [patrolPlans, setPatrolPlans] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [qrCodes, setQrCodes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showGuardModal, setShowGuardModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [essentialDataLoaded, setEssentialDataLoaded] = useState(false);
    const [guardsLoading, setGuardsLoading] = useState(false);
    const [qrCodesLoading, setQrCodesLoading] = useState(false);

    const [reports, setReports] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [settings, setSettings] = useState({});

    const [filters, setFilters] = useState({
        status: '',
        dateRange: '',
        type: ''
    });
const [guardReports, setGuardReports] = useState([]);
    const [selectedGuard, setSelectedGuard] = useState('');
    const [reportFilters, setReportFilters] = useState({
        startDate: '',
        endDate: '',
        shiftId: ''
    });
    const [generatingReport, setGeneratingReport] = useState(false);
    const { register, handleSubmit, reset, formState: { errors }, watch, control } = useForm();
    const { fields: checkpointFields, append: addCheckpoint, remove: removeCheckpoint } = useFieldArray({
        control,
        name: 'checkpoints'
    });
  // New state for patrol logs
    const [patrolLogs, setPatrolLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsFilters, setLogsFilters] = useState({
        guardId: '',
        startDate: '',
        endDate: '',
        patrolPlanId: '',
        shiftId: '',
        page: 1,
        limit: 20,
        sort: 'desc'
    });
    const [logsPagination, setLogsPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        pages: 0
    });


    const { fields: guardFields, append: addGuardAssignment, remove: removeGuardAssignment } = useFieldArray({
        control,
        name: 'assignedGuards'
    });


       const downloadQRCode = (qrCode) => {
        try {
            if (qrCode.qrImageBase64) {
                // Create a temporary anchor element
                const link = document.createElement('a');
                link.href = qrCode.qrImageBase64;
                link.download = `qr-code-${qrCode.siteId || qrCode._id}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('QR code downloaded successfully');
            } else {
                toast.error('QR code image not available');
            }
        } catch (error) {
            console.error('Error downloading QR code:', error);
            toast.error('Failed to download QR code');
        }
    };

    // Add this function to download all QR codes as ZIP - FRONTEND ONLY
    const downloadAllQRCodes = async () => {
        try {
            if (qrCodes.length === 0) {
                toast.error('No QR codes available to download');
                return;
            }

            // For multiple downloads, we'll create a ZIP file using JSZip
            const JSZip = await import('jszip');
            const zip = new JSZip.default();
            
            // Add each QR code to the ZIP
            qrCodes.forEach((qr, index) => {
                if (qr.qrImageBase64) {
                    // Convert base64 to blob
                    const base64Data = qr.qrImageBase64.split(',')[1];
                    const blob = base64ToBlob(base64Data, 'image/png');
                    zip.file(`qr-code-${qr.siteId || qr._id}.png`, blob);
                }
            });

            // Generate and download the ZIP file
            const zipContent = await zip.generateAsync({ type: 'blob' });
            const url = window.URL.createObjectURL(zipContent);
            const link = document.createElement('a');
            link.href = url;
            link.download = `all-qr-codes-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            toast.success(`Downloaded ${qrCodes.length} QR codes`);
        } catch (error) {
            console.error('Error downloading all QR codes:', error);
            toast.error('Failed to download QR codes');
        }
    };

    // Helper function to convert base64 to blob
    const base64ToBlob = (base64, contentType = '', sliceSize = 512) => {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        
        return new Blob(byteArrays, { type: contentType });
    };

    // Alternative simpler approach for downloading all QR codes (one by one)
    const downloadAllQRCodesSimple = () => {
        if (qrCodes.length === 0) {
            toast.error('No QR codes available to download');
            return;
        }

        if (qrCodes.length > 10) {
            toast.loading(`Downloading ${qrCodes.length} QR codes... This may take a moment.`);
        }

        // Download each QR code one by one
        qrCodes.forEach((qr, index) => {
            setTimeout(() => {
                if (qr.qrImageBase64) {
                    const link = document.createElement('a');
                    link.href = qr.qrImageBase64;
                    link.download = `qr-code-${qr.siteId || qr._id}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }, index * 100); // Stagger downloads to avoid browser issues
        });

        if (qrCodes.length <= 10) {
            toast.success(`Downloaded ${qrCodes.length} QR codes`);
        }
    };



    // Watch for form changes
    const watchFrequency = watch('frequency');

    useEffect(() => {
        fetchDashboardData();
    }, []);
   useEffect(() => {
        if (activeTab === 'dashboard' && dashboardData) {
            fetchIncidentStats(statsPeriod);
        }
    }, [statsPeriod]);
    const handleStatsPeriodChange = (period) => {
        setStatsPeriod(period);
    };

        const fetchIncidentStats = async (period = "month") => {
        try {
            const response = await axios.get(`/api/incidents/stats?period=${period}`);
            if (response.data.success) {
                setIncidentStats(response.data.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch incident statistics:', error);
            toast.error('Failed to load incident statistics');
        }
    };

    useEffect(() => {
        if (activeTab !== 'dashboard') {
            fetchTabData();
        }
    }, [activeTab]);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('/api/supervisors/dashboard');
            setDashboardData(response.data.data);
              await fetchIncidentStats(statsPeriod);
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
                case 'plans':
                    await fetchPatrolPlans();
                    break;
                case 'incidents':
                    await fetchIncidents();
                    break;
                case 'shifts':
                    await fetchShifts();
                    break;
                case 'qr-codes':
                    await fetchQRCodes();
                    break;

                case 'reports':
                    await fetchReports();
                    break;
                case 'notifications':
                    await fetchNotifications();
                    break;
                case 'audit-logs':
                    await fetchAuditLogs();
                    break;
                case 'settings':
                    await fetchSettings();
                    break;
         case 'guard-reports':
                    await fetchGuards(); // Need guards for the dropdown
                    break; 
     case 'patrol-logs':
                    await fetchPatrolLogs(); // Fetch logs when tab is active
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


        // Fetch guard performance report
    const fetchGuardReport = async (filters = {}) => {
        if (!selectedGuard) {
            toast.error('Please select a guard');
            return;
        }

        setGeneratingReport(true);
        try {
            const response = await axios.post('/api/patrol/performance-report', {
                guardId: selectedGuard,
                startDate: filters.startDate || reportFilters.startDate,
                endDate: filters.endDate || reportFilters.endDate,
                shiftId: filters.shiftId || reportFilters.shiftId
            });

            if (response.data.success) {
                setGuardReports(prev => [response.data.data, ...prev]);
                toast.success('Performance report generated');
            } else {
                toast.error(response.data.msg || 'Failed to generate report');
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to fetch performance report');
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleGenerateReport = () => {
        fetchGuardReport();
    };

    const handleFilterReport = (data) => {
        fetchGuardReport(data);
    };

    const downloadReport = (report) => {
        const reportData = {
            guard: report.guard.name,
            period: `${new Date(report.reportPeriod.startDate).toLocaleDateString()} - ${new Date(report.reportPeriod.endDate).toLocaleDateString()}`,
            overallScore: report.overallScore,
            attendance: report.attendance,
            patrol: report.patrol
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guard-report-${report.guard.name}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };



    const fetchPatrolPlans = async () => {
        try {
            const response = await axios.get('/api/plans');
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
    // Preload essential data on component mount
    useEffect(() => {
        const loadEssentialData = async () => {
            try {
                setLoading(true);
                await Promise.all([
                    fetchGuards(),
                    fetchQRCodes(),
                    fetchShifts(),
                    fetchDashboardData()
                ]);
                setEssentialDataLoaded(true);
            } catch (error) {
                console.error('Failed to load essential data:', error);
                toast.error('Failed to load essential data');
            } finally {
                setLoading(false);
            }
        };

        loadEssentialData();
    }, []);
    const fetchShifts = async () => {
        try {
            const response = await axios.get('/api/shift');
            setShifts(response.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch shifts');
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

    // Shift Management - Updated for new model
    const createShift = async (data) => {
        try {
            const shiftData = {
                shiftName: data.shiftName,
                shiftType: data.shiftType,
                startTime: data.startTime,
                endTime: data.endTime,
                assignedGuards: data.assignedGuards || []
            };
            await axios.post('/api/shift', shiftData);
            toast.success('Shift created successfully');
            fetchShifts();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to create shift');
        }
    };

    const updateShift = async (shiftId, data) => {
        try {
            await axios.put(`/api/shift/${shiftId}`, data);
            toast.success('Shift updated successfully');
            fetchShifts();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to update shift');
        }
    };

    // Patrol Plan Management - Updated for new structure
    const createPatrolPlan = async (data) => {
        try {
            const planData = {
                planName: data.planName,
                description: data.description,
                checkpoints: data.checkpoints?.map((cp, index) => ({
                    qrId: cp.qrId,
                    siteId: cp.siteId,
                    expectedTime: parseInt(cp.expectedTime) || 5,
                    sequence: index + 1
                })) || [],
                assignedGuards: data.assignedGuards?.map(ag => ({
                    guardId: ag.guardId,
                    assignedShifts: ag.assignedShifts || []
                })) || [],
                frequency: data.frequency,
                customFrequency: data.customFrequency,
                startDate: data.startDate,
                endDate: data.endDate || null,

                 rounds: parseInt(data.rounds) || 1
            };

            await axios.post('/api/plans', planData);
            toast.success('Patrol plan created successfully');
            fetchPatrolPlans();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to create patrol plan');
        }
    };

    const updatePatrolPlan = async (planId, data) => {
        try {
            const planData = {
                ...data,
                checkpoints: data.checkpoints?.map((cp, index) => ({
                    qrId: cp.qrId,
                    siteId: cp.siteId,
                    expectedTime: parseInt(cp.expectedTime) || 5,
                    sequence: index + 1
                })),
                assignedGuards: data.assignedGuards?.map(ag => ({
                    guardId: ag.guardId,
                    assignedShifts: ag.assignedShifts || []
                })),
                      rounds: parseInt(data.rounds) || 1 
            };

            await axios.put(`/api/plans/${planId}`, planData);
            toast.success('Patrol plan updated successfully');
            fetchPatrolPlans();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to update patrol plan');
        }
    };

    // New guard management functions
    const addGuardToPlan = async (planId, guardData) => {
        try {
            await axios.post(`/api/plans/${planId}/guards`, guardData);
            toast.success('Guard added to plan');
            fetchPatrolPlans();
            setShowGuardModal(false);
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to add guard to plan');
        }
    };

    const removeGuardFromPlan = async (planId, guardId) => {
        if (!window.confirm('Are you sure you want to remove this guard from the plan?')) return;

        try {
            await axios.delete(`/api/plans/${planId}/guards/${guardId}`);
            toast.success('Guard removed from plan');
            fetchPatrolPlans();
        } catch (error) {
            toast.error('Failed to remove guard from plan');
        }
    };

    // Other existing functions (QR, Guard, Incident management)
    const createQRCode = async (data) => {
        try {
            await axios.post('/api/qr', data);
            toast.success('QR code created successfully');
            fetchQRCodes();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to create QR code');
        }
    };

    const deleteQRCode = async (qrId) => {
        if (!window.confirm('Are you sure you want to delete this QR code?')) return;
        try {
            await axios.delete(`/api/qr/${qrId}`);
            toast.success('QR code deleted successfully');
            fetchQRCodes();
        } catch (error) {
            toast.error('Failed to delete QR code');
        }
    };

    const deleteShift = async (shiftId) => {
        if (!window.confirm('Are you sure you want to delete this shift?')) return;
        try {
            await axios.delete(`/api/shift/${shiftId}`);
            toast.success('Shift deleted successfully');
            fetchShifts();
        } catch (error) {
            toast.error('Failed to delete shift');
        }
    };

    const togglePlanStatus = async (planId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await axios.put(`/api/plans/${planId}`, { isActive: newStatus });
            toast.success(`Plan ${newStatus ? 'activated' : 'deactivated'}`);
            fetchPatrolPlans();
        } catch (error) {
            toast.error('Failed to update plan status');
        }
    };

    const deletePatrolPlan = async (planId) => {
        if (!window.confirm('Are you sure you want to delete this patrol plan?')) return;
        try {
            await axios.delete(`/api/plans/${planId}`);
            toast.success('Patrol plan deleted successfully');
            fetchPatrolPlans();
        } catch (error) {
            toast.error('Failed to delete patrol plan');
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

    const updateGuard = async (guardId, data) => {
        try {
            await axios.put(`/api/guards/${guardId}`, data);
            toast.success('Guard updated successfully');
            fetchGuards();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to update guard');
        }
    };

    const deleteGuard = async (guardId) => {
        if (!window.confirm('Are you sure you want to delete this guard?')) return;
        try {
            await axios.delete(`/api/guards/${guardId}`);
            toast.success('Guard deleted successfully');
            fetchGuards();
        } catch (error) {
            toast.error('Failed to delete guard');
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
            // Transform data for form based on new structure
            const formData = { ...item };

            if (type === 'plan') {
                // Transform patrol plan data
                if (item.checkpoints) {
                    formData.checkpoints = item.checkpoints.map(cp => ({
                        qrId: cp.qrId?._id || cp.qrId,
                        siteId: cp.siteId,
                        expectedTime: cp.expectedTime
                    }));
                }

                if (item.assignedGuards) {
                    formData.assignedGuards = item.assignedGuards.map(ag => ({
                        guardId: ag.guardId?._id || ag.guardId,
                        assignedShifts: ag.assignedShifts?.map(s => s._id || s) || []
                    }));
                }

                // Format dates for datetime-local inputs
                if (item.startDate) {
                    formData.startDate = new Date(item.startDate).toISOString().slice(0, 16);
                }
                if (item.endDate) {
                    formData.endDate = new Date(item.endDate).toISOString().slice(0, 16);
                }
            }

            if (type === 'shift') {
                // Transform shift data for new model
                if (item.assignedGuards) {
                    formData.assignedGuards = item.assignedGuards.map(g => g._id || g);
                }
                if (item.startTime) {
                    formData.startTime = new Date(item.startTime).toISOString().slice(0, 16);
                }
                if (item.endTime) {
                    formData.endTime = new Date(item.endTime).toISOString().slice(0, 16);
                }
            }

            reset(formData);
        } else {
            reset({
                checkpoints: [],
                assignedGuards: [],
                startDate: new Date().toISOString().slice(0, 16)
            });
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setEditingItem(null);
        setShowGuardModal(false);
        setSelectedPlan(null);
        reset();
    };

    const handleFormSubmit = (data) => {
        switch (modalType) {
            case 'guard':
                if (editingItem) {
                    updateGuard(editingItem._id, data);
                } else {
                    createGuard(data);
                }
                break;
            case 'plan':
                if (editingItem) {
                    updatePatrolPlan(editingItem._id, data);
                } else {
                    createPatrolPlan(data);
                }
                break;
            case 'shift':
                if (editingItem) {
                    updateShift(editingItem._id, data);
                } else {
                    createShift(data);
                }
                break;
            case 'qr':
                createQRCode(data);
                break;
        }
    };

    const handleAddGuardToPlan = (data) => {
        if (selectedPlan) {
            addGuardToPlan(selectedPlan._id, {
                guardId: data.guardId,
                assignedShifts: data.assignedShifts || []
            });
        }
    };
    // Fetch patrol logs
    const fetchPatrolLogs = async (filters = logsFilters) => {
        setLogsLoading(true);
        try {
            const response = await axios.post('/api/patrol/logs', filters);
            
            if (response.data.success) {    
                setPatrolLogs(response.data.data.logs || []);
                setLogsPagination(response.data.data.pagination || {
                    total: 0,
                    page: 1,
                    limit: 20,
                    pages: 0
                });
            } else {
                toast.error(response.data.msg || 'Failed to fetch patrol logs');
            }
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to fetch patrol logs');
        } finally {
            setLogsLoading(false);
        }
    };

    const handleLogsFilterChange = (key, value) => {
        const newFilters = { ...logsFilters, [key]: value, page: 1 }; // Reset to page 1 when filters change
        setLogsFilters(newFilters);
        fetchPatrolLogs(newFilters);
    };

    const handlePageChange = (newPage) => {
        const newFilters = { ...logsFilters, page: newPage };
        setLogsFilters(newFilters);
        fetchPatrolLogs(newFilters);
    };

    const clearLogsFilters = () => {
        const clearedFilters = {
            guardId: '',
            startDate: '',
            endDate: '',
            patrolPlanId: '',
            shiftId: '',
            page: 1,
            limit: 20,
            sort: 'desc'
        };
        setLogsFilters(clearedFilters);
        fetchPatrolLogs(clearedFilters);
    };

    const openAddGuardModal = (plan) => {
        setSelectedPlan(plan);
        setShowGuardModal(true);
        reset({ assignedShifts: [] });
    };

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'guards', label: 'Guards', icon: Shield },
        { id: 'shifts', label: 'Shifts', icon: Clock },
        { id: 'qr-codes', label: 'QR Codes', icon: QrCode },
        { id: 'plans', label: 'Patrol Plans', icon: Target },
        { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
         { id: 'guard-reports', label: 'Guard Reports', icon: FileText },
           { id: 'patrol-logs', label: 'Patrol Logs', icon: MapPin } // New tab
    ];

    if (loading && !dashboardData) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
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
                 {/* Dashboard Tab */}
{activeTab === 'dashboard' && dashboardData && (
    <div className="space-y-6">
        {/* Period Selector */}
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
            <div className="flex space-x-2">
                <button
                    onClick={() => handleStatsPeriodChange('week')}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                        statsPeriod === 'week'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Week
                </button>
                <button
                    onClick={() => handleStatsPeriodChange('month')}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                        statsPeriod === 'month'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Month
                </button>
                <button
                    onClick={() => handleStatsPeriodChange('year')}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                        statsPeriod === 'year'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Year
                </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Guards</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.teamStats?.totalGuards || 0}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                    <Users className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Plans</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.teamStats?.activePlans || 0}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                    <Target className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">QR Codes</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.teamStats?.totalQRCodes || 0}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending Incidents</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.incidentReports?.pending || 0}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Incident Statistics Section */}
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                Incident Statistics ({statsPeriod})
            </h3>
            
            {incidentStats ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{incidentStats.total || 0}</p>
                            <p className="text-sm text-blue-600">Total Incidents</p>
                        </div>
                        
                        {incidentStats.statusBreakdown && Object.entries(incidentStats.statusBreakdown).map(([status, count]) => (
                            <div 
                                key={status} 
                                className={`text-center p-4 rounded-lg ${
                                    status === 'resolved' ? 'bg-green-50' :
                                    status === 'in-progress' ? 'bg-yellow-50' :
                                    status === 'investigating' ? 'bg-blue-50' :
                                    'bg-red-50'
                                }`}
                            >
                                <p className="text-2xl font-bold text-gray-900">{count}</p>
                                <p className="text-sm text-gray-600 capitalize">{status.replace('-', ' ')}</p>
                            </div>
                        ))}
                    </div>

                    {/* Status Breakdown Chart (Simple bar visualization) */}
                    {incidentStats.statusBreakdown && (
                        <div className="mt-6">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Status Distribution</h4>
                            <div className="space-y-2">
                                {Object.entries(incidentStats.statusBreakdown).map(([status, count]) => {
                                    const total = incidentStats.total || 1;
                                    const percentage = (count / total) * 100;
                                    return (
                                        <div key={status} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 capitalize w-32">
                                                {status.replace('-', ' ')}
                                            </span>
                                            <div className="flex-1 mx-4">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${
                                                            status === 'resolved' ? 'bg-green-500' :
                                                            status === 'in-progress' ? 'bg-yellow-500' :
                                                            status === 'investigating' ? 'bg-blue-500' :
                                                            'bg-red-500'
                                                        }`}
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-600 w-16 text-right">
                                                {count} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
                onClick={() => setActiveTab('incidents')}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
            >
                <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
                <h4 className="font-medium text-gray-900">Manage Incidents</h4>
                <p className="text-sm text-gray-500 mt-1">View and handle all reported incidents</p>
            </button>
            
            <button
                onClick={() => setActiveTab('plans')}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
            >
                <Target className="w-8 h-8 text-green-600 mb-2" />
                <h4 className="font-medium text-gray-900">Patrol Plans</h4>
                <p className="text-sm text-gray-500 mt-1">Manage and monitor patrol activities</p>
            </button>
            
            <button
                onClick={() => setActiveTab('reports')}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
            >
                <FileText className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-medium text-gray-900">Generate Reports</h4>
                <p className="text-sm text-gray-500 mt-1">Create performance and activity reports</p>
            </button>
        </div>
    </div>
)}
                    {/* Shifts Tab - Updated for new model */}
                    {activeTab === 'shifts' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
                                <button
                                    onClick={() => openModal('shift')}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Create Shift
                                </button>
                            </div>

                            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                {loading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : shifts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Clock className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No shifts</h3>
                                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new shift.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {shifts.map((shift) => (
                                            <li key={shift._id}>
                                                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <Clock className="h-8 w-8 text-green-600" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {shift.shiftName || 'Unnamed Shift'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {new Date(shift.startTime).toLocaleString()} - {new Date(shift.endTime).toLocaleString()}
                                                            </div>
                                                            <div className="text-xs text-gray-400 capitalize">
                                                                Type: {shift.shiftType} • Guards: {shift.assignedGuards?.length || 0}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => openModal('shift', shift)}
                                                            className="inline-flex items-center p-1.5 border border-transparent rounded-full text-indigo-600 hover:bg-indigo-100"
                                                            title="Edit Shift"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteShift(shift._id)}
                                                            className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-100"
                                                            title="Delete Shift"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Patrol Plans Tab - Updated with new guard management */}
                    {activeTab === 'plans' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Patrol Plans</h2>
                                <button
                                    onClick={() => openModal('plan')}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    <Target className="w-4 h-4 mr-2" />
                                    Create Plan
                                </button>
                            </div>

                            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                {loading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : patrolPlans.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Target className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No patrol plans</h3>
                                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new patrol plan.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {patrolPlans.map((plan) => (
                                            <li key={plan._id}>
                                                <div className="px-4 py-4 hover:bg-gray-50">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center">
                                                            <Target className={`h-8 w-8 ${plan.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {plan.planName}
                                                                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                        {plan.isActive ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    Frequency: {plan.frequency} • Checkpoints: {plan.checkpoints?.length || 0}

                                                                      Rounds: {plan.rounds || 1}/day
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    Start: {new Date(plan.startDate).toLocaleDateString()}
                                                                    {plan.endDate && ` • End: ${new Date(plan.endDate).toLocaleDateString()}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => openAddGuardModal(plan)}
                                                                className="inline-flex items-center p-1.5 border border-transparent rounded-full text-blue-600 hover:bg-blue-100"
                                                                title="Add Guard"
                                                            >
                                                                <UserPlus className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => togglePlanStatus(plan._id, plan.isActive)}
                                                                className={`inline-flex items-center p-1.5 border border-transparent rounded-full ${plan.isActive
                                                                    ? 'text-yellow-600 hover:bg-yellow-100'
                                                                    : 'text-green-600 hover:bg-green-100'
                                                                    }`}
                                                                title={plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                                                            >
                                                                {plan.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => openModal('plan', plan)}
                                                                className="inline-flex items-center p-1.5 border border-transparent rounded-full text-indigo-600 hover:bg-indigo-100"
                                                                title="Edit Plan"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deletePatrolPlan(plan._id)}
                                                                className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-100"
                                                                title="Delete Plan"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Assigned Guards Section */}
                                                    {plan.assignedGuards && plan.assignedGuards.length > 0 && (
                                                        <div className="mt-4 ml-12">
                                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Guards:</h4>
                                                            <div className="space-y-2">
                                                                {plan.assignedGuards.map((assignment, index) => (
                                                                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                                                                        <div className="flex items-center">
                                                                            <Shield className="h-4 w-4 text-gray-400 mr-2" />
                                                                            <div>
                                                                                <span className="text-sm font-medium text-gray-900">
                                                                                    {assignment.guardId?.name || 'Unknown Guard'}
                                                                                </span>
                                                                                {assignment.assignedShifts && assignment.assignedShifts.length > 0 && (
                                                                                    <div className="text-xs text-gray-500">
                                                                                        Shifts: {assignment.assignedShifts.map(shift =>
                                                                                            shift.shiftName || shift.shiftType || 'Unnamed'
                                                                                        ).join(', ')}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => removeGuardFromPlan(plan._id, assignment.guardId?._id || assignment.guardId)}
                                                                            className="text-red-600 hover:text-red-800"
                                                                            title="Remove Guard"
                                                                        >
                                                                            <UserMinus className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

       {/* Patrol Logs Tab */}
    {activeTab === 'patrol-logs' && (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Patrol Logs</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={clearLogsFilters}
                        className="flex items-center px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <Filter className="w-4 h-4 mr-1" />
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guard</label>
                        <select
                            value={logsFilters.guardId}
                            onChange={(e) => handleLogsFilterChange('guardId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Guards</option>
                            {guards.filter(guard => guard.isActive).map(guard => (
                                <option key={guard._id} value={guard._id}>
                                    {guard.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Patrol Plan</label>
                        <select
                            value={logsFilters.patrolPlanId}
                            onChange={(e) => handleLogsFilterChange('patrolPlanId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Plans</option>
                            {patrolPlans.map(plan => (
                                <option key={plan._id} value={plan._id}>
                                    {plan.planName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                        <select
                            value={logsFilters.shiftId}
                            onChange={(e) => handleLogsFilterChange('shiftId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Shifts</option>
                            {shifts.map(shift => (
                                <option key={shift._id} value={shift._id}>
                                    {shift.shiftName || shift.shiftType}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={logsFilters.startDate}
                            onChange={(e) => handleLogsFilterChange('startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={logsFilters.endDate}
                            onChange={(e) => handleLogsFilterChange('endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort</label>
                        <select
                            value={logsFilters.sort}
                            onChange={(e) => handleLogsFilterChange('sort', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {logsLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : patrolLogs.length === 0 ? (
                    <div className="text-center py-12">
                        <MapPin className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No patrol logs found</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {Object.values(logsFilters).some(val => val && val !== '' && val !== 1 && val !== 20 && val !== 'desc') 
                                ? 'Try adjusting your filters' 
                                : 'No patrol scans recorded yet'
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        <ul className="divide-y divide-gray-200">
                            {patrolLogs.map((log) => (
                                <li key={log._id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            {/* QR Code/Location Info */}
                                            <div className="flex-shrink-0">
                                                <MapPin className="h-8 w-8 text-green-600" />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {log.qrCode?.siteId || 'Unknown Location'}
                                                    </p>
                                                    {log.isVerified && (
                                                        <CheckCircle className="h-4 w-4 text-green-500" title="Verified Scan" />
                                                    )}
                                                </div>
                                                
                                                <div className="text-sm text-gray-500 space-y-1">
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                        <span>
                                                            <strong>Guard:</strong> {log.guard?.name || 'Unknown'}
                                                        </span>
                                                        <span>
                                                            <strong>Plan:</strong> {log.patrolPlan?.planName || 'N/A'}
                                                        </span>
                                                        <span>
                                                            <strong>Shift:</strong> {log.shift?.shiftName || log.shift?.shiftType || 'N/A'}
                                                        </span>
                                                    </div>
                                                    
                                                    {log.qrCode?.description && (
                                                        <p className="text-xs">{log.qrCode.description}</p>
                                                    )}
                                                    
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                                        {log.location && (
                                                            <span>
                                                                <strong>Location:</strong> {log.location.lat?.toFixed(6)}, {log.location.lng?.toFixed(6)}
                                                            </span>
                                                        )}
                                                        {log.distanceMeters !== undefined && (
                                                            <span>
                                                                <strong>Distance:</strong> {log.distanceMeters.toFixed(2)}m
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end space-y-2">
                                            <div className="text-sm text-gray-500 text-right">
                                                {new Date(log.scanTime).toLocaleDateString()}
                                                <br />
                                                {new Date(log.scanTime).toLocaleTimeString()}
                                            </div>
                                            
                                            {log.photo && (
                                                <button
                                                    onClick={() => setMediaModal({ type: 'image', src: log.photo })}
                                                    className="flex items-center text-xs text-indigo-600 hover:text-indigo-800"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View Photo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Pagination */}
                        {logsPagination.pages > 1 && (
                            <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
                                <div className="flex justify-between items-center w-full">
                                    <div className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{(logsPagination.page - 1) * logsPagination.limit + 1}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(logsPagination.page * logsPagination.limit, logsPagination.total)}
                                        </span> of{' '}
                                        <span className="font-medium">{logsPagination.total}</span> results
                                    </div>
                                    
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handlePageChange(logsPagination.page - 1)}
                                            disabled={logsPagination.page === 1}
                                            className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </button>
                                        
                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: Math.min(5, logsPagination.pages) }, (_, i) => {
                                                let pageNum;
                                                if (logsPagination.pages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (logsPagination.page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (logsPagination.page >= logsPagination.pages - 2) {
                                                    pageNum = logsPagination.pages - 4 + i;
                                                } else {
                                                    pageNum = logsPagination.page - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                                                            logsPagination.page === pageNum
                                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                                                                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        <button
                                            onClick={() => handlePageChange(logsPagination.page + 1)}
                                            disabled={logsPagination.page >= logsPagination.pages}
                                            className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )}

    {/* Media Modal */}
    {mediaModal.src && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-medium">Scan Evidence</h3>
                    <button
                        onClick={() => setMediaModal({ type: null, src: null })}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XCircle className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-4">
                    {mediaModal.type === 'image' ? (
                        <img src={mediaModal.src} alt="Scan evidence" className="max-w-full h-auto rounded" />
                    ) : (
                        <video src={mediaModal.src} controls className="max-w-full rounded">
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>
            </div>
        </div>
    )}


                    {/* Guards Tab */}
                    {/* Guards Tab */}
                    {activeTab === 'guards' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center space-x-4">
                                    <h2 className="text-2xl font-bold text-gray-900">Guards Management</h2>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        {guards.length} {guards.length === 1 ? 'Guard' : 'Guards'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => openModal('guard')}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Guard
                                </button>
                            </div>

                            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                {loading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : guards.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Shield className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No guards</h3>
                                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new guard.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {guards.map((guard, index) => (
                                            <li key={guard._id}>
                                                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <Shield className={`h-8 w-8 ${guard.isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {guard.name}
                                                                </div>
                                                                {!guard.isActive && (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                        
                                                            </div>
                                                            <div className="text-sm text-gray-500">{guard.email}</div>
                                                            <div className="text-xs text-gray-400">
                                                                {guard.phone && `Phone: ${guard.phone} • `}
                                                                Created: {new Date(guard.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => openModal('guard', guard)}
                                                            className="inline-flex items-center p-1.5 border border-transparent rounded-full text-indigo-600 hover:bg-indigo-100"
                                                            title="Edit Guard"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteGuard(guard._id)}
                                                            className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-100"
                                                            title="Delete Guard"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
    {/* Guard Reports Tab */}
{/* Guard Reports Tab */}
{activeTab === 'guard-reports' && (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Guard Performance Reports</h2>
        </div>

        {/* Report Generator */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Performance Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Guard</label>
                    <select
                        value={selectedGuard}
                        onChange={(e) => setSelectedGuard(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Choose a guard</option>
                        {guards.filter(guard => guard.isActive).map(guard => (
                            <option key={guard._id} value={guard._id}>
                                {guard.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        value={reportFilters.startDate}
                        onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                        type="date"
                        value={reportFilters.endDate}
                        onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift (Optional)</label>
                    <select
                        value={reportFilters.shiftId}
                        onChange={(e) => setReportFilters(prev => ({ ...prev, shiftId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Shifts</option>
                        {shifts.map(shift => (
                            <option key={shift._id} value={shift._id}>
                                {shift.shiftName || shift.shiftType}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <button
                onClick={handleGenerateReport}
                disabled={!selectedGuard || generatingReport}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {generatingReport ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                    </>
                ) : (
                    <>
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                    </>
                )}
            </button>
        </div>

        {/* Reports List */}
        <div className="space-y-6">
            {guardReports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <FileText className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No reports generated</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Generate a performance report to see guard analytics and metrics.
                    </p>
                </div>
            ) : (
                guardReports.map((report, index) => (
                    <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Report Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {report.guard.name} - Performance Report
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Period: {new Date(report.reportPeriod.startDate).toLocaleDateString()} - {new Date(report.reportPeriod.endDate).toLocaleDateString()}
                                        {report.reportPeriod.daysInPeriod && (
                                            <span className="ml-2">({report.reportPeriod.daysInPeriod} days)</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Current Status: <span className="font-medium capitalize">{report.guard.currentStatus || 'Unknown'}</span>
                                        {report.guard.currentShift && (
                                            <span className="ml-2">
                                                • Current Shift: {report.guard.currentShift.shiftName}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold ${
                                            parseFloat(report.performanceScore?.overall || report.overallScore) >= 80 ? 'text-green-600' :
                                            parseFloat(report.performanceScore?.overall || report.overallScore) >= 60 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>
                                            {report.performanceScore?.overall || report.overallScore}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {report.performanceScore?.rating || 'Overall Score'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => downloadReport(report)}
                                        className="flex items-center px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Performance Score Breakdown */}
                        {report.performanceScore && (
                            <div className="px-6 py-4 border-b bg-indigo-50">
                                <h4 className="text-md font-medium text-gray-900 mb-3">Performance Breakdown</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(report.performanceScore.breakdown || {}).map(([category, score]) => (
                                        <div key={category} className="text-center">
                                            <div className={`text-lg font-bold ${
                                                parseFloat(score) >= 80 ? 'text-green-600' :
                                                parseFloat(score) >= 60 ? 'text-yellow-600' :
                                                'text-red-600'
                                            }`}>
                                                {score}%
                                            </div>
                                            <div className="text-sm text-gray-600 capitalize">
                                                {category.replace(/([A-Z])/g, ' $1').trim()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Report Content */}
                        <div className="p-6 space-y-6">
                            {/* Attendance Section */}
                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-4">Attendance Summary</h4>
                                
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {report.attendance?.summary?.daysPresent || report.attendance?.daysPresent || 0}
                                        </div>
                                        <div className="text-sm text-blue-600">Days Present</div>
                                        <div className="text-xs text-gray-500">
                                            of {report.attendance?.summary?.totalDays || report.attendance?.totalDays || 0} total
                                        </div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {report.attendance?.summary?.attendanceRate || report.attendance?.attendanceRate || '0%'}
                                        </div>
                                        <div className="text-sm text-green-600">Attendance Rate</div>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-yellow-600">
                                            {report.attendance?.summary?.punctualityRate || report.attendance?.punctualityRate || '0%'}
                                        </div>
                                        <div className="text-sm text-yellow-600">Punctuality Rate</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {report.attendance?.summary?.hoursComplianceRate || report.attendance?.hoursComplianceRate || '0%'}
                                        </div>
                                        <div className="text-sm text-purple-600">Hours Compliance</div>
                                    </div>
                                </div>

                                {/* Detailed Attendance Table */}
                                {report.attendance?.detailedRecords && report.attendance.detailedRecords.length > 0 && (
                                    <div className="mt-6">
                                        <h5 className="text-sm font-medium text-gray-700 mb-3">Detailed Attendance Records</h5>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Shift
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Login Time
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Hours Worked
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Late/Early
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {report.attendance.detailedRecords.map((record, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {new Date(record.date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {record.shift?.shiftName || 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                {record.loginTime ? new Date(record.loginTime).toLocaleTimeString() : 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {record.hoursWorked?.toFixed(2) || '0'}h
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                {record.lateByMinutes > 0 && (
                                                                    <span className="text-red-600">
                                                                        Late: {record.lateByMinutes}m
                                                                    </span>
                                                                )}
                                                                {record.earlyLeaveMinutes > 0 && (
                                                                    <span className="text-orange-600">
                                                                        {record.lateByMinutes > 0 ? ', ' : ''}
                                                                        Early: {record.earlyLeaveMinutes}m
                                                                    </span>
                                                                )}
                                                                {!record.lateByMinutes && !record.earlyLeaveMinutes && (
                                                                    <span className="text-green-600">On Time</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                                                    record.status === 'on-duty' ? 'bg-green-100 text-green-800' :
                                                                    record.status === 'off-duty' ? 'bg-gray-100 text-gray-800' :
                                                                    record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {record.status || 'Unknown'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Patrol Performance Section */}
                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-4">Patrol Performance</h4>
                                
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-indigo-50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-indigo-600">
                                            {report.patrol?.summary?.totalCompletedCheckpoints || report.patrol?.totalCompletedCheckpoints || 0}
                                        </div>
                                        <div className="text-sm text-indigo-600">Completed</div>
                                        <div className="text-xs text-gray-500">
                                            of {report.patrol?.summary?.totalExpectedCheckpoints || report.patrol?.totalExpectedCheckpoints || 0} expected
                                        </div>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">
                                            {report.patrol?.summary?.checkpointsMissed || report.patrol?.checkpointsMissed || 0}
                                        </div>
                                        <div className="text-sm text-red-600">Missed</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {report.patrol?.summary?.uniqueCheckpointsCovered || report.patrol?.uniqueCheckpointsCovered || 0}
                                        </div>
                                        <div className="text-sm text-green-600">Unique Locations</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {report.patrol?.summary?.completionRate || report.patrol?.completionRate || '0%'}
                                        </div>
                                        <div className="text-sm text-purple-600">Completion Rate</div>
                                    </div>
                                </div>

                                {/* Checkpoint Details Table */}
                                {report.patrol?.checkpointDetails && report.patrol.checkpointDetails.length > 0 && (
                                    <div className="mt-6">
                                        <h5 className="text-sm font-medium text-gray-700 mb-3">Checkpoint Performance Details</h5>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Plan
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Checkpoint
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Location
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Scans
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Completion
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {report.patrol.checkpointDetails.map((detail, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {detail.planName}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {detail.checkpointName || 'Unnamed'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                {detail.location ? 
                                                                    `${detail.location.lat?.toFixed(4)}, ${detail.location.lng?.toFixed(4)}` : 
                                                                    'N/A'
                                                                }
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {detail.actualScans}/{detail.expectedScans}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                    parseFloat(detail.completionRate) >= 80 ? 'bg-green-100 text-green-800' :
                                                                    parseFloat(detail.completionRate) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {detail.completionRate}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Scan Details Table */}
                                {report.patrol?.checkpointDetails?.some(detail => detail.scanDetails) && (
                                    <div className="mt-6">
                                        <h5 className="text-sm font-medium text-gray-700 mb-3">Scan Details</h5>
                                        <div className="space-y-4">
                                            {report.patrol.checkpointDetails.map((detail, idx) => (
                                                detail.scanDetails && detail.scanDetails.length > 0 && (
                                                    <div key={idx} className="border rounded-lg">
                                                        <div className="bg-gray-50 px-4 py-2 border-b">
                                                            <h6 className="text-sm font-medium text-gray-900">
                                                                {detail.checkpointName || 'Unnamed Checkpoint'} - {detail.planName}
                                                            </h6>
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-white">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Timestamp
                                                                        </th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Round
                                                                        </th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Distance
                                                                        </th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                            Status
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {detail.scanDetails.map((scan, scanIdx) => (
                                                                        <tr key={scanIdx} className="hover:bg-gray-50">
                                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                                                {new Date(scan.timestamp).toLocaleString()}
                                                                            </td>
                                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                                                Round {scan.roundNumber || 1}
                                                                            </td>
                                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                                                {scan.distanceFromCheckpoint?.toFixed(2) || '0'}m
                                                                            </td>
                                                                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                                                {scan.verified ? (
                                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                                                        Verified
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                                        Unverified
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Incidents Section */}
                            {report.incidents && (
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 mb-4">Incident Reports</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-red-50 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-red-600">
                                                {report.incidents.totalReported || 0}
                                            </div>
                                            <div className="text-sm text-red-600">Total Incidents</div>
                                        </div>
                                        {report.incidents.bySeverity && Object.entries(report.incidents.bySeverity).map(([severity, count]) => (
                                            <div key={severity} className={`p-4 rounded-lg ${
                                                severity === 'critical' ? 'bg-red-100' :
                                                severity === 'high' ? 'bg-orange-100' :
                                                severity === 'medium' ? 'bg-yellow-100' :
                                                'bg-green-100'
                                            }`}>
                                                <div className="text-2xl font-bold text-gray-900">{count}</div>
                                                <div className="text-sm text-gray-600 capitalize">{severity}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Incident Details Table */}
                                    {report.incidents.details && report.incidents.details.length > 0 && (
                                        <div className="mt-6">
                                            <h5 className="text-sm font-medium text-gray-700 mb-3">Incident Details</h5>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Title
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Type
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Severity
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Status
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Date
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {report.incidents.details.map((incident, idx) => (
                                                            <tr key={idx} className="hover:bg-gray-50">
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    {incident.title}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                                    {incident.type}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                                                        incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                                        incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-green-100 text-green-800'
                                                                    }`}>
                                                                        {incident.severity}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        incident.status === 'closed' ? 'bg-green-100 text-green-800' :
                                                                        incident.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                                                                        incident.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                        {incident.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                    {new Date(incident.createdAt).toLocaleDateString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
)}
                    {/* QR Codes Tab */}
                    {/* {activeTab === 'qr-codes' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">QR Code Management</h2>
                                <button
                                    onClick={() => openModal('qr')}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    <QrCode className="w-4 h-4 mr-2" />
                                    Create QR Code
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loading ? (
                                    <div className="col-span-3 flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : qrCodes.length === 0 ? (
                                    <div className="col-span-3 text-center py-8">
                                        <QrCode className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No QR codes</h3>
                                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new QR code.</p>
                                    </div>
                                ) : (
                                    qrCodes.map((qr) => (
                                        <div key={qr._id} className="bg-white p-6 rounded-lg shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">{qr.siteId || 'No Site ID'}</h3>
                                                    <p className="text-sm text-gray-500">{qr.description}</p>
                                                </div>
                                                <button
                                                    onClick={() => deleteQRCode(qr._id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete QR Code"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Latitude:</span>
                                                    <span>{qr.lat}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Longitude:</span>
                                                    <span>{qr.lng}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Radius:</span>
                                                    <span>{qr.radius}m</span>
                                                </div>
                                            </div>
                                            {qr.qrImageBase64 && (
                                                <div className="mt-4 flex justify-center">
                                                    <img
                                                        src={qr.qrImageBase64}
                                                        alt="QR Code"
                                                        className="h-32 w-32 object-contain"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )} */}

      {activeTab === 'qr-codes' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">QR Code Management</h2>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={downloadAllQRCodesSimple}
                                        disabled={loading || qrCodes.length === 0}
                                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download All ({qrCodes.length})
                                    </button>
                                    <button
                                        onClick={() => openModal('qr')}
                                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                    >
                                        <QrCode className="w-4 h-4 mr-2" />
                                        Create QR Code
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loading ? (
                                    <div className="col-span-3 flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : qrCodes.length === 0 ? (
                                    <div className="col-span-3 text-center py-8">
                                        <QrCode className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No QR codes</h3>
                                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new QR code.</p>
                                    </div>
                                ) : (
                                    qrCodes.map((qr) => (
                                        <div key={qr._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">{qr.siteId || 'No Site ID'}</h3>
                                                    <p className="text-sm text-gray-500">{qr.description}</p>
                                                </div>
                                                <div className="flex space-x-1">
                                                    <button
                                                        onClick={() => downloadQRCode(qr)}
                                                        className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors"
                                                        title="Download QR Code"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteQRCode(qr._id)}
                                                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                        title="Delete QR Code"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm mb-4">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Latitude:</span>
                                                    <span className="font-mono text-xs">{qr.lat}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Longitude:</span>
                                                    <span className="font-mono text-xs">{qr.lng}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Radius:</span>
                                                    <span>{qr.radius}m</span>
                                                </div>
                                                {qr.createdAt && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Created:</span>
                                                        <span className="text-xs">{new Date(qr.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {qr.qrImageBase64 && (
                                                <div className="mt-4 flex flex-col items-center">
                                                    <img
                                                        src={qr.qrImageBase64}
                                                        alt={`QR Code for ${qr.siteId}`}
                                                        className="h-32 w-32 object-contain border rounded-lg p-2 bg-white"
                                                    />
                                                    <div className="mt-2 flex space-x-2">
                                                      
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}


                    {activeTab === 'incidents' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Incidents</h2>
                            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                {loading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : !incidents?.length ? (
                                    <div className="text-center py-8">
                                        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents</h3>
                                        <p className="mt-1 text-sm text-gray-500">No incidents reported yet.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {incidents.map((incident) => (
                                            <li key={incident._id} className="px-4 py-4 hover:bg-gray-50">
                                                <div className="flex justify-between">
                                                    {/* LEFT: Incident Info */}
                                                    <div className="flex items-start">
                                                        <AlertTriangle
                                                            className={`h-8 w-8 mt-1 ${incident.severity === "critical"
                                                                    ? "text-red-800"
                                                                    : incident.severity === "high"
                                                                        ? "text-red-600"
                                                                        : incident.severity === "medium"
                                                                            ? "text-yellow-600"
                                                                            : "text-green-600"
                                                                }`}
                                                        />
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {incident.type} • {incident.severity} • {new Date(incident.createdAt).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                Reported by: {incident.reportedBy?.name || "Unknown"}
                                                            </div>
                                                            {incident.assignedTo?.length > 0 && (
                                                                <div className="text-xs text-gray-500">
                                                                    Assigned to: {incident.assignedTo.map((u) => u.name).join(", ")}
                                                                </div>
                                                            )}
                                                            {incident.description && (
                                                                <div className="mt-1 text-sm text-gray-700">{incident.description}</div>
                                                            )}
                                                            {incident.location?.lat && incident.location?.lng && (
                                                                <div className="mt-1 text-xs text-blue-600">
                                                                    <a
                                                                        href={`https://www.google.com/maps?q=${incident.location.lat},${incident.location.lng}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        View Location on Map
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* RIGHT: Status Dropdown */}
                                                    <div className="flex items-center space-x-2">
                                                        <select
                                                            value={incident.status}
                                                            onChange={(e) => updateIncidentStatus(incident._id, e.target.value)}
                                                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        >
                                                            <option value="reported">Reported</option>
                                                            <option value="investigating">Investigating</option>
                                                            <option value="in-progress">In-Progress</option>
                                                            <option value="resolved">Resolved</option>
                                                            <option value="closed">Closed</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* MEDIA SECTION */}
                                                <div className="mt-3 ml-12 space-y-2">
                                                    {/* Photos */}
                                                    {incident.photos?.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {incident.photos.map((photo, i) => (
                                                                <a key={i} href={photo} target="_blank" rel="noopener noreferrer">
                                                                    <img
                                                                        src={photo}
                                                                        alt={`incident-photo-${i}`}
                                                                        className="h-32 w-32 object-cover rounded-md border cursor-pointer hover:scale-105 transition-transform"
                                                                    />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Video */}
                                                    {incident.video && (
                                                        <div className="mt-2">
                                                            <video
                                                                controls
                                                                className="w-full max-w-lg rounded-md border"
                                                                src={incident.video}
                                                            >
                                                                Your browser does not support the video tag.
                                                            </video>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}


                </div>
            </main>

            {/* Main Modal for creating/editing items */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingItem ? 'Edit' : 'Create'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                            {modalType === 'guard' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name</label>
                                        <input
                                            {...register('name', { required: 'Name is required' })}
                                            type="text"
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                    </div>
                                 
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                                        <input
                                            {...register('phone')}
                                            type="text"
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    {/* Password Field - Always Available for Both Create and Edit */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            {editingItem ? 'Update Password (Leave blank to keep current)' : 'Password'}
                                        </label>
                                        <input
                                            {...register('password', {
                                                // Only validate for new guards, not required for editing
                                                required: !editingItem ? 'Password is required' : false,
                                                minLength: {
                                                    value: 6,
                                                    message: 'Password must be at least 6 characters'
                                                },
                                                // For editing, only validate if password field is not empty
                                                validate: editingItem ? (value) =>
                                                    !value || value.length >= 6 || 'Password must be at least 6 characters'
                                                    : undefined
                                            })}
                                            type="password"
                                            placeholder={editingItem ? "Enter new password or leave blank" : ""}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                                        {editingItem && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Leave password field empty to keep the current password
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="flex items-center">
                                            <input
                                                {...register('isActive')}
                                                type="checkbox"
                                                defaultChecked={true}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Active</span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {modalType === 'shift' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Shift Name</label>
                                        <input
                                            {...register('shiftName', { required: 'Shift name is required' })}
                                            type="text"
                                            placeholder="e.g., Morning Shift A"
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {errors.shiftName && <p className="text-red-500 text-xs mt-1">{errors.shiftName.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Shift Type</label>
                                        <select
                                            {...register('shiftType', { required: 'Shift type is required' })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="">Select Type</option>
                                            <option value="day">Day</option>
                                            <option value="night">Night</option>
                                            <option value="both">Both</option>
                                        </select>
                                        {errors.shiftType && <p className="text-red-500 text-xs mt-1">{errors.shiftType.message}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                            <input
                                                {...register('startTime', { required: 'Start time is required' })}
                                                type="datetime-local"
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">End Time</label>
                                            <input
                                                {...register('endTime', { required: 'End time is required' })}
                                                type="datetime-local"
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Assign Guards</label>
                                        <select
                                            {...register('assignedGuards')}
                                            multiple
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-32"
                                        >
                                            {guards.filter(guard => guard.isActive).map(guard => (
                                                <option key={guard._id} value={guard._id}>
                                                    {guard.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple guards</p>
                                    </div>
                                </>
                            )}

{modalType === 'plan' && (
  <>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Plan Name</label>
        <input
          {...register('planName', { required: 'Plan name is required' })}
          type="text"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {errors.planName && <p className="text-red-500 text-xs mt-1">{errors.planName.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Frequency</label>
        <select
          {...register('frequency', { required: 'Frequency is required' })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select Frequency</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </select>
        {errors.frequency && <p className="text-red-500 text-xs mt-1">{errors.frequency.message}</p>}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Rounds per Day</label>
        <input
          {...register('rounds', { 
            required: 'Rounds are required',
            min: { value: 1, message: 'Minimum 1 round' },
            max: { value: 10, message: 'Maximum 10 rounds' }
          })}
          type="number"
          min="1"
          max="10"
          defaultValue="1"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {errors.rounds && <p className="text-red-500 text-xs mt-1">{errors.rounds.message}</p>}
        <p className="text-xs text-gray-500 mt-1">Number of times this patrol should be completed daily</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          {...register('description')}
          type="text"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Start Date</label>
        <input
          {...register('startDate', { required: 'Start date is required' })}
          type="datetime-local"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
        <input
          {...register('endDate')}
          type="datetime-local"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>

    {watchFrequency === 'custom' && (
      <div>
        <label className="block text-sm font-medium text-gray-700">Custom Frequency (Days)</label>
        <input
          {...register('customFrequency', {
            required: watchFrequency === 'custom' ? 'Custom frequency is required' : false,
            min: { value: 1, message: 'Minimum 1 day' }
          })}
          type="number"
          min="1"
          placeholder="e.g., 7 for weekly"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {errors.customFrequency && <p className="text-red-500 text-xs mt-1">{errors.customFrequency.message}</p>}
      </div>
    )}

    {/* Checkpoints Section */}
    <div className="border-t pt-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-medium text-gray-900">Checkpoints</h4>
        <button
          type="button"
          onClick={() => addCheckpoint({ qrId: '', siteId: '', expectedTime: 5 })}
          className="flex items-center px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Checkpoint
        </button>
      </div>

      {checkpointFields.length === 0 ? (
        <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
          <MapPin className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No checkpoints added</p>
          <p className="text-xs text-gray-400">Add at least one checkpoint to create the plan</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-60 overflow-y-auto p-2">
          {checkpointFields.map((field, index) => (
            <div key={field.id} className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h5 className="text-sm font-medium text-gray-700">Checkpoint {index + 1}</h5>
                <button
                  type="button"
                  onClick={() => removeCheckpoint(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">QR Code Location</label>
                  <select
                    {...register(`checkpoints.${index}.qrId`, { required: 'QR code is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select QR Code</option>
                    {qrCodes.map(qr => (
                      <option key={qr._id} value={qr._id}>
                        {qr.siteId} - {qr.description}
                      </option>
                    ))}
                  </select>
                  {errors.checkpoints?.[index]?.qrId && (
                    <p className="text-red-500 text-xs mt-1">{errors.checkpoints[index].qrId.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site ID</label>
                  <input
                    {...register(`checkpoints.${index}.siteId`)}
                    type="text"
                    placeholder="Optional site identifier"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">Expected Time (minutes)</label>
                <input
                  {...register(`checkpoints.${index}.expectedTime`, {
                    required: 'Expected time is required',
                    min: { value: 1, message: 'Minimum 1 minute' },
                    max: { value: 60, message: 'Maximum 60 minutes' }
                  })}
                  type="number"
                  min="1"
                  max="60"
                  defaultValue="5"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.checkpoints?.[index]?.expectedTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.checkpoints[index].expectedTime.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Assigned Guards Section */}
    <div className="border-t pt-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-medium text-gray-900">Assigned Guards</h4>
        <button
          type="button"
          onClick={() => addGuardAssignment({ guardId: '', assignedShifts: [] })}
          className="flex items-center px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          <UserPlus className="w-4 h-4 mr-1" />
          Add Guard
        </button>
      </div>

      {guardFields.length === 0 ? (
        <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
          <Shield className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No guards assigned</p>
          <p className="text-xs text-gray-400">Add at least one guard to create the plan</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-60 overflow-y-auto p-2">
          {guardFields.map((field, index) => (
            <div key={field.id} className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h5 className="text-sm font-medium text-gray-700">Guard Assignment {index + 1}</h5>
                <button
                  type="button"
                  onClick={() => removeGuardAssignment(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Guard</label>
                  <select
                    {...register(`assignedGuards.${index}.guardId`, { required: 'Guard is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Guard</option>
                    {guards.filter(guard => guard.isActive).map(guard => (
                      <option key={guard._id} value={guard._id}>
                        {guard.name} - {guard.email}
                      </option>
                    ))}
                  </select>
                  {errors.assignedGuards?.[index]?.guardId && (
                    <p className="text-red-500 text-xs mt-1">{errors.assignedGuards[index].guardId.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assign to Shifts (Optional)</label>
                  <select
                    {...register(`assignedGuards.${index}.assignedShifts`)}
                    multiple
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-24"
                  >
                    {shifts.map(shift => (
                      <option key={shift._id} value={shift._id}>
                        {shift.shiftName || shift.shiftType} - {new Date(shift.startTime).toLocaleTimeString()}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple shifts</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
)}

                            {modalType === 'qr' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Site ID/Name</label>
                                        <input
                                            {...register('siteId', { required: 'Site ID is required' })}
                                            type="text"
                                            placeholder="e.g., Building A Entrance"
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {errors.siteId && <p className="text-red-500 text-xs mt-1">{errors.siteId.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            {...register('description')}
                                            rows={2}
                                            placeholder="Optional description of the location"
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Latitude</label>
                                            <input
                                                {...register('lat', {
                                                    required: 'Latitude is required',
                                                    pattern: {
                                                        value: /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}$/,
                                                        message: 'Invalid latitude format'
                                                    }
                                                })}
                                                type="text"
                                                placeholder="e.g., 40.7128"
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            {errors.lat && <p className="text-red-500 text-xs mt-1">{errors.lat.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Longitude</label>
                                            <input
                                                {...register('lng', {
                                                    required: 'Longitude is required',
                                                    pattern: {
                                                        value: /^-?([1]?[1-7][1-9]|[1]?[1-8][0]|[1-9]?[0-9])\.{1}\d{1,6}$/,
                                                        message: 'Invalid longitude format'
                                                    }
                                                })}
                                                type="text"
                                                placeholder="e.g., -74.0060"
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            {errors.lng && <p className="text-red-500 text-xs mt-1">{errors.lng.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Radius (meters)</label>
                                            <input
                                                {...register('radius', {
                                                    required: 'Radius is required',
                                                    min: { value: 1, message: 'Minimum 1 meter' },
                                                    max: { value: 1000, message: 'Maximum 1000 meters' }
                                                })}
                                                type="number"
                                                min="1"
                                                max="1000"
                                                defaultValue="50"
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            {errors.radius && <p className="text-red-500 text-xs mt-1">{errors.radius.message}</p>}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {editingItem ? 'Update' : 'Create'} {modalType}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Guard to Plan Modal */}
            {showGuardModal && selectedPlan && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Add Guard to Plan</h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(handleAddGuardToPlan)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Select Guard</label>
                                <select
                                    {...register('guardId', { required: 'Guard is required' })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Select a guard</option>
                                    {guards
                                        .filter(guard => guard.isActive)
                                        .filter(guard => !selectedPlan.assignedGuards?.some(ag =>
                                            ag.guardId?._id === guard._id || ag.guardId === guard._id
                                        ))
                                        .map(guard => (
                                            <option key={guard._id} value={guard._id}>
                                                {guard.name}
                                            </option>
                                        ))
                                    }
                                </select>
                                {errors.guardId && <p className="text-red-500 text-xs mt-1">{errors.guardId.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assign to Shifts (Optional)</label>
                                <select
                                    {...register('assignedShifts')}
                                    multiple
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-32"
                                >
                                    {shifts.map(shift => (
                                        <option key={shift._id} value={shift._id}>
                                            {shift.shiftName || shift.shiftType}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple shifts</p>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                                >
                                    Add Guard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorDashboard;