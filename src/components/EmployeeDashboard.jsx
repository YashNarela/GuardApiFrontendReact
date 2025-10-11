


import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Users, UserPlus, Edit, Trash2, LogOut, QrCode, FileText, Clock,
    Shield, BarChart3, Target, AlertTriangle, Download,
    Eye, EyeOff, Search
} from 'lucide-react';
import moment from 'moment-timezone';
import axios from '../services/axiosConfig';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';
const APP_TIMEZONE = 'Asia/Kolkata'; // Change to your preferred timezone
const EmployeeDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [deleteSupervisorId, setDeleteSupervisorId] = useState(null);
    const [reassignSupervisorId, setReassignSupervisorId] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [guards, setGuards] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [qrCodes, setQrCodes] = useState([]);
    const [patrolLogs, setPatrolLogs] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [patrolPlans, setPatrolPlans] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchGuard, setSearchGuard] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [guardReports, setGuardReports] = useState([]);
    const [selectedGuard, setSelectedGuard] = useState('');
    const [reportFilters, setReportFilters] = useState({
        startDate: '',
        endDate: '',
        shiftId: ''
    });
    const [generatingReport, setGeneratingReport] = useState(false);






    const [expandedSupervisors, setExpandedSupervisors] = useState(new Set());
    const [expandedPlanGuards, setExpandedPlanGuards] = useState(new Set());
    const [expandedPlanCheckpoints, setExpandedPlanCheckpoints] = useState(new Set());

    const togglePlanGuardsExpansion = (planId) => {
        const newExpanded = new Set(expandedPlanGuards);
        if (newExpanded.has(planId)) {
            newExpanded.delete(planId);
        } else {
            newExpanded.add(planId);
        }
        setExpandedPlanGuards(newExpanded);
    };

    const togglePlanCheckpointsExpansion = (planId) => {
        const newExpanded = new Set(expandedPlanCheckpoints);
        if (newExpanded.has(planId)) {
            newExpanded.delete(planId);
        } else {
            newExpanded.add(planId);
        }
        setExpandedPlanCheckpoints(newExpanded);
    };

    const toggleSupervisorExpansion = (supervisorId) => {
        const newExpanded = new Set(expandedSupervisors);
        if (newExpanded.has(supervisorId)) {
            newExpanded.delete(supervisorId);
        } else {
            newExpanded.add(supervisorId);
        }
        setExpandedSupervisors(newExpanded);
    };

    // Get performance rating
    const getPerformanceRating = (score) => {
        const numericScore = parseFloat(score) || 0;
        if (numericScore >= 90) return 'Excellent';
        if (numericScore >= 80) return 'Good';
        if (numericScore >= 70) return 'Satisfactory';
        if (numericScore >= 60) return 'Needs Improvement';
        return 'Poor';
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    };


    const downloadExcelReport = (report) => {
        try {
            // Validate report data
            if (!report) {
                toast.error('No report data available to download');
                return;
            }

            // Extract data with proper fallbacks
            const roundsPerformance = report.roundsPerformance || {};
            const summary = roundsPerformance.summary || {};
            const performance = report.performance || {};
            const performanceBreakdown = performance.breakdown || {};
            const reportPeriod = report.reportPeriod || {};

            // Calculate actual values
            const totalRounds = summary.totalExpectedRounds || 0;
            const completedRounds = summary.totalCompletedRounds || 0;
            const totalScans = summary.totalExpectedScans || 0;
            const completedScans = summary.totalCompletedScans || 0;

            const roundsCompletionRate = summary.roundsCompletionRate ||
                (totalRounds > 0 ? ((completedRounds / totalRounds) * 100).toFixed(1) + '%' : '0%');

            const scanCompletionRate = summary.scanCompletionRate ||
                (totalScans > 0 ? ((completedScans / totalScans) * 100).toFixed(1) + '%' : '0%');

            // Format dates for display
            const formatDateForExcel = (dateString) => {
                if (!dateString) return 'N/A';
                return moment.utc(dateString).format('MMM DD, YYYY');
            };

            const reportPeriodDisplay = reportPeriod.startDate && reportPeriod.endDate ?
                `${formatDateForExcel(reportPeriod.startDate)} - ${formatDateForExcel(reportPeriod.endDate)}` : 'N/A';

            // Create workbook
            const workbook = XLSX.utils.book_new();

            // 1. Summary Sheet - FIXED
            const summaryData = [
                ['GUARD PERFORMANCE REPORT'],
                [],
                ['Basic Information'],
                ['Guard Name', report.guard?.name || 'N/A'],
                ['Phone Number', report.guard?.phone || 'N/A'],
                ['Report Period', reportPeriodDisplay],
                ['Total Days', reportPeriod.totalDays || 0],
                [],
                ['Performance Overview'],
                ['Overall Score', `${performance.overallScore || '0'}%`],
                ['Performance Rating', performance.rating || 'N/A'],
                ['Efficiency', report.summary?.efficiency || '0%'],
                [],
                ['Rounds Performance'],
                ['Total Rounds', totalRounds],
                ['Completed Rounds', completedRounds],
                ['Rounds Completion Rate', roundsCompletionRate],
                ['Total Expected Scans', totalScans],
                ['Completed Scans', completedScans],
                ['Scan Completion Rate', scanCompletionRate],
            ];

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

            // Style summary sheet
            if (!summarySheet['!merges']) summarySheet['!merges'] = [];
            summarySheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });

            // Set column widths for summary sheet
            summarySheet['!cols'] = [
                { wch: 25 },
                { wch: 20 }
            ];

            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

            // 2. Patrol Logs Sheet
            const detailedRounds = report.detailedRounds || [];
            if (detailedRounds.length > 0) {
                const patrolLogsHeader = [
                    'Date',
                    'Round',
                    'Plan Name',
                    'Checkpoint',
                    'Checkpoint Description',
                    'Actual Time',
                    'Status',
                    'Distance (m)',
                    'Verified'
                ];

                const patrolLogsData = detailedRounds.map(round => {
                    // Format date consistently
                    const formattedDate = round.date ?
                        moment.utc(round.date).format('MMM DD, YYYY') : 'N/A';

                    // Format round number
                    const formattedRound = `Round ${round.roundNumber || 1}`;

                    // Format time
                    const formattedTime = round.actualTime ?
                        moment.utc(round.actualTime).format('hh:mm A') : 'Not Scanned';

                    // Format status
                    const formattedStatus = round.status ?
                        round.status.charAt(0).toUpperCase() + round.status.slice(1) : 'Pending';

                    // Format distance
                    const formattedDistance = round.distanceMeters ?
                        Math.round(round.distanceMeters) : 'N/A';

                    // Format verification status
                    const verifiedStatus = round.isVerified !== undefined ?
                        (round.isVerified ? 'Yes' : 'No') : 'N/A';

                    return [
                        formattedDate,
                        formattedRound,
                        round.planName || 'N/A',
                        round.checkpointName || 'N/A',
                        round.checkpointDescription || 'N/A',
                        formattedTime,
                        formattedStatus,
                        formattedDistance,
                        verifiedStatus
                    ];
                });

                const patrolLogsSheet = XLSX.utils.aoa_to_sheet([patrolLogsHeader, ...patrolLogsData]);

                patrolLogsSheet['!cols'] = [
                    { wch: 12 }, // Date
                    { wch: 10 }, // Round
                    { wch: 20 }, // Plan Name
                    { wch: 20 }, // Checkpoint
                    { wch: 25 }, // Checkpoint Description
                    { wch: 12 }, // Actual Time
                    { wch: 10 }, // Status
                    { wch: 10 }, // Distance
                    { wch: 8 }   // Verified
                ];

                XLSX.utils.book_append_sheet(workbook, patrolLogsSheet, 'Patrol Logs');
            } else {
                const emptyHeader = [
                    ['Date', 'Round', 'Plan Name', 'Checkpoint', 'Checkpoint Description', 'Actual Time', 'Status', 'Distance', 'Verified'],
                    ['No patrol logs available for this period', '', '', '', '', '', '', '', '']
                ];
                const emptySheet = XLSX.utils.aoa_to_sheet(emptyHeader);
                emptySheet['!cols'] = [
                    { wch: 12 }, { wch: 10 }, { wch: 20 },
                    { wch: 20 }, { wch: 25 }, { wch: 12 },
                    { wch: 10 }, { wch: 10 }, { wch: 8 }
                ];
                XLSX.utils.book_append_sheet(workbook, emptySheet, 'Patrol Logs');
            }

            // 3. Performance Metrics Sheet - FIXED
            const getPerformanceRatingForExcel = (score) => {
                const numericScore = typeof score === 'string' ?
                    parseFloat(score.replace('%', '')) : parseFloat(score) || 0;
                if (numericScore >= 90) return 'Excellent';
                if (numericScore >= 80) return 'Good';
                if (numericScore >= 70) return 'Satisfactory';
                if (numericScore >= 60) return 'Needs Improvement';
                return 'Poor';
            };

            const overallScore = parseFloat(performance.overallScore) || 0;
            const roundsScore = parseFloat(performanceBreakdown.roundsCompletionRate) ||
                parseFloat(roundsCompletionRate.replace('%', '')) || 0;
            const scanScore = parseFloat(scanCompletionRate.replace('%', '')) || 0;
            const efficiencyScore = parseFloat(report.summary?.efficiency?.replace('%', '')) ||
                parseFloat(roundsCompletionRate.replace('%', '')) || 0;

            const metricsData = [
                ['PERFORMANCE METRICS'],
                [],
                ['Category', 'Score', 'Rating'],
                ['Overall Performance', `${overallScore}%`, getPerformanceRatingForExcel(overallScore)],
                ['Rounds Completion', `${roundsScore}%`, getPerformanceRatingForExcel(roundsScore)],
                ['Scan Completion', `${scanScore}%`, getPerformanceRatingForExcel(scanScore)],
                ['Efficiency', `${efficiencyScore}%`, getPerformanceRatingForExcel(efficiencyScore)],
            ];

            const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
            metricsSheet['!cols'] = [
                { wch: 25 },
                { wch: 15 },
                { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics');

            // 4. Plan Breakdown Sheet (if available)
            if (roundsPerformance.planBreakdown && roundsPerformance.planBreakdown.length > 0) {
                const planBreakdownHeader = [
                    'Plan Name',
                    'Total Rounds',
                    'Completed Rounds',
                    'Total Checkpoints',
                    'Completed Scans',
                    'Completion Rate'
                ];

                const planBreakdownData = roundsPerformance.planBreakdown.map(plan => [
                    plan.planName || 'N/A',
                    plan.totalRounds || 0,
                    plan.completedRounds || 0,
                    plan.totalCheckpoints || 0,
                    plan.completedScans || 0,
                    plan.completionRate || '0%'
                ]);

                const planBreakdownSheet = XLSX.utils.aoa_to_sheet([planBreakdownHeader, ...planBreakdownData]);
                planBreakdownSheet['!cols'] = [
                    { wch: 25 }, // Plan Name
                    { wch: 12 }, // Total Rounds
                    { wch: 12 }, // Completed Rounds
                    { wch: 15 }, // Total Checkpoints
                    { wch: 15 }, // Completed Scans
                    { wch: 15 }  // Completion Rate
                ];
                XLSX.utils.book_append_sheet(workbook, planBreakdownSheet, 'Plan Breakdown');
            }

            // Generate filename and download
            const guardName = report.guard?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Guard';
            const timestamp = moment().format('YYYY-MM-DD_HH-mm');
            const fileName = `Guard_Performance_Report_${guardName}_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, fileName);
            toast.success('Report downloaded successfully!');

        } catch (error) {
            console.error('Error downloading report:', error);
            toast.error('Failed to download report');
        }
    };

    const formatReportPeriod = (startDate, endDate, totalDays) => {
        if (!startDate || !endDate) return 'N/A';

        const start = moment.utc(startDate).format('MMM DD');
        const end = moment.utc(endDate).format('MMM DD');

        return `Period: ${start} - ${end}${totalDays ? ` (${totalDays} days)` : ''}`;
    };


   // Convert local datetime to UTC for backend
    const localToUTCDateTime = (localTimeString) => {
        if (!localTimeString) return '';

        return moment(localTimeString).utc().format();
    };


    // Format for display with timezone
    const formatDateTimeForDisplay = (utcTimeString, timezone = APP_TIMEZONE) => {
        if (!utcTimeString) return 'N/A';

        return moment.utc(utcTimeString).tz(timezone).format('MMM DD, YYYY hh:mm A z');
    };

    // Format time only for display
    const formatTimeForDisplay = (utcTimeString, timezone = APP_TIMEZONE) => {
        if (!utcTimeString) return 'N/A';

        return moment.utc(utcTimeString).tz(timezone).format('hh:mm A z');
    };

    // Add this date-only formatting function
    const formatDateOnlyForDisplay = (utcTimeString) => {
        if (!utcTimeString) return 'N/A';
        return moment.utc(utcTimeString).format('MM/DD/YYYY');
    };

      const calculateShiftDuration = (startTime, endTime) => {
            if (!startTime || !endTime) return 'N/A';
    
            const start = moment.utc(startTime);
            const end = moment.utc(endTime);
            const duration = moment.duration(end.diff(start));
    
            const hours = Math.floor(duration.asHours());
            const minutes = duration.minutes();
    
            return `${hours}h ${minutes}m`;
        };
    // Generate guard performance report
    const handleGenerateReport = async () => {
        if (!selectedGuard) {
            toast.error('Please select a guard');
            return;
        }

        setGeneratingReport(true);
        try {
            const response = await axios.post('/api/patrol/performance-report', {
                guardId: selectedGuard,
                startDate: reportFilters.startDate,
                endDate: reportFilters.endDate,
                shiftId: reportFilters.shiftId || undefined
            });

            const newReport = {
                ...response.data.data,
                id: Date.now(), // Add unique ID for local state management
                generatedAt: new Date().toISOString()
            };

            setGuardReports(prev => [newReport, ...prev]);
            toast.success('Report generated successfully');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        } finally {
            setGeneratingReport(false);
        }
    };


    // Mock data generator for demonstration (remove this in production)
    const generateMockReport = () => {
        const mockReport = {
            id: Date.now(),
            guard: {
                name: guards.find(g => g._id === selectedGuard)?.name || 'Test Guard',
                phone: guards.find(g => g._id === selectedGuard)?.phone || '1234567890'
            },
            reportPeriod: {
                startDate: reportFilters.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: reportFilters.endDate || new Date().toISOString(),
                totalDays: 7
            },
            performance: {
                overallScore: '85',
                rating: 'Good',
                breakdown: {
                    attendanceScore: '90',
                    roundsScore: '80'
                }
            },
            attendance: {
                presentDays: 6,
                totalDays: 7,
                attendanceRate: '85.7%'
            },
            roundsPerformance: {
                summary: {
                    totalScans: 42,
                    completedScans: 38,
                    missedScans: 4
                }
            },
            summary: {
                efficiency: '90.5%'
            },
            detailedRounds: Array.from({ length: 10 }, (_, i) => ({
                date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
                roundNumber: i + 1,
                planName: `Patrol Plan ${(i % 3) + 1}`,
                checkpointName: `Checkpoint ${i + 1}`,
                checkpointDescription: `Security checkpoint at location ${i + 1}`,
                actualTime: i % 8 !== 0 ? new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString() : null,
                status: i % 8 === 0 ? 'missed' : i % 5 === 0 ? 'delayed' : 'completed'
            }))
        };

        setGuardReports(prev => [mockReport, ...prev]);
        toast.success('Mock report generated successfully');
    };

    useEffect(() => {
        fetchDashboardData();
        fetchShifts(); // Add this line
    }, []);

    useEffect(() => {
        if (activeTab !== 'dashboard' && activeTab !== 'guard-reports') {
            fetchTabData();
        }
    }, [activeTab, searchGuard]);

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

    const deleteSupervisorWithReassignment = async (supervisorId, reassignToId) => {
        try {
            const response = await axios.delete(`/api/supervisors/${supervisorId}`, {
                data: { reassignToSupervisorId: reassignToId }
            });

            toast.success(response.data.msg || 'Supervisor deleted successfully');
            fetchSupervisors();
            setShowDeleteModal(false);
            setDeleteSupervisorId(null);
            setReassignSupervisorId('');
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to delete supervisor');
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

    const deleteQRCode = async (id) => {
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
            setLoading(true);
            const response = await axios.get('/api/plans');
            const plans = response.data.data?.plans || [];
            setPatrolPlans(plans);
        } catch (error) {
            console.error('Error fetching patrol plans:', error);
            toast.error('Failed to fetch patrol plans');
        } finally {
            setLoading(false);
        }
    };

    const downloadQRCode = (qrCode) => {
        try {
            if (qrCode.qrImageBase64) {
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

    const downloadAllQRCodesSimple = () => {
        if (qrCodes.length === 0) {
            toast.error('No QR codes available to download');
            return;
        }

        if (qrCodes.length > 10) {
            toast.loading(`Downloading ${qrCodes.length} QR codes... This may take a moment.`);
        }

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
            }, index * 100);
        });

        if (qrCodes.length <= 10) {
            toast.success(`Downloaded ${qrCodes.length} QR codes`);
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
                phone: data.phone,
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
            // Create a copy of the item without the password field
            const itemWithoutPassword = { ...item };
            delete itemWithoutPassword.password; // Remove password field

            if (item.startTime) {
                itemWithoutPassword.startTime = new Date(item.startTime).toISOString().slice(0, 16);
            }
            if (item.endTime) {
                itemWithoutPassword.endTime = new Date(item.endTime).toISOString().slice(0, 16);
            }
            reset(itemWithoutPassword); // Reset with data that excludes password
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
                // else createGuard(data);
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
        { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
        { id: 'guard-reports', label: 'Guard Reports', icon: FileText }
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
                            <h1 className="text-3xl font-bold text-gray-900">Company Dashboard</h1>
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
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                                                    {supervisor.name}
                                                                    {supervisor.isActive === false && (
                                                                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                                                            Inactive
                                                                        </span>
                                                                    )}
                                                                </h3>
                                                                <p className="text-sm text-gray-600">{supervisor.email}</p>
                                                                <p className="text-sm text-gray-600">Phone: {supervisor.phone || 'Not provided'}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {supervisor.guards?.length || 0} Guard(s)
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Created: {new Date(supervisor.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Guards Preview */}
                                                        {supervisor.guards && supervisor.guards.length > 0 && (
                                                            <div className="mt-3">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <p className="text-xs text-gray-500">Assigned Guards:</p>
                                                                    <button
                                                                        onClick={() => toggleSupervisorExpansion(supervisor._id)}
                                                                        className="text-xs text-indigo-600 hover:text-indigo-800"
                                                                    >
                                                                        {expandedSupervisors.has(supervisor._id) ? 'Show Less' : `Show All (${supervisor.guards.length})`}
                                                                    </button>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {supervisor.guards
                                                                        .slice(0, expandedSupervisors.has(supervisor._id) ? supervisor.guards.length : 3)
                                                                        .map((guard) => (
                                                                            <span
                                                                                key={guard._id}
                                                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                                                                            >
                                                                                <Shield className="w-3 h-3 mr-2" />
                                                                                {guard.name}
                                                                            </span>
                                                                        ))}
                                                                    {!expandedSupervisors.has(supervisor._id) && supervisor.guards.length > 3 && (
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
                                                                            +{supervisor.guards.length - 3} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex space-x-2 ml-4">
                                                        <button
                                                            onClick={() => openModal('supervisor', supervisor)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                            title="Edit Supervisor"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (supervisor.guards && supervisor.guards.length > 0) {
                                                                    setDeleteSupervisorId(supervisor._id);
                                                                    setShowDeleteModal(true);
                                                                } else {
                                                                    if (window.confirm(`Are you sure you want to delete supervisor ${supervisor.name}?`)) {
                                                                        deleteSupervisor(supervisor._id);
                                                                    }
                                                                }
                                                            }}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                            title="Delete Supervisor"
                                                            disabled={supervisor.isActive === false}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                        {supervisors.length === 0 && (
                                            <li className="px-6 py-8 text-center text-gray-500">
                                                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No supervisors</h3>
                                                <p className="text-gray-600">Get started by creating your first supervisor.</p>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* GUARDS */}
                    {activeTab === 'guards' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Guards Management</h2>
                                {/* <button
                                    onClick={() => openModal('guard')}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Guard
                                </button> */}
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
                                                        <p className="text-sm text-gray-600">{guard?.phone}</p>
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
                                <h2 className="text-2xl font-bold text-gray-900">QR Code Management</h2>
                                <div className="flex space-x-3">
                                    {/* <button
                                        onClick={() => openModal('qr')}
                                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                    >
                                        <QrCode className="w-4 h-4 mr-2" />
                                        Add QR Code
                                    </button> */}
                                    <button
                                        onClick={downloadAllQRCodesSimple}
                                        disabled={loading || qrCodes.length === 0}
                                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download All ({qrCodes.length})
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
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* PATROL PLANS */}
                    {/* PATROL PLANS */}
                    {/* PATROL PLANS */}
                    {activeTab === 'plans' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Patrol Plans</h2>
                                <div className="text-sm text-gray-600">
                                    Total: {patrolPlans.length} plan{patrolPlans.length !== 1 ? 's' : ''}
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-8">Loading patrol plans...</div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                    {patrolPlans.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Plan Details
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Schedule
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Assigned Guards
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Checkpoints
                                                        </th>
                                                    </tr>
                                                </thead>
                                                {/* <tbody className="bg-white divide-y divide-gray-200">
                                                    {patrolPlans.map((plan) => (
                                                        <tr key={plan._id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-start space-x-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center space-x-2">
                                                                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                                                {plan.planName}
                                                                            </h3>
                                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                                {plan.rounds} round{plan.rounds !== 1 ? 's' : ''}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                                            {plan.description || 'No description available'}
                                                                        </p>
                                                                        <div className="mt-2 text-xs text-gray-400">
                                                                            Updated: {moment(plan.updatedAt).format('MMM DD, YYYY h:mm A')}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${plan.isActive
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {plan.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-900 space-y-1">
                                                                    <div className="capitalize">
                                                                        <span className="font-medium">Frequency:</span> {plan.frequency}
                                                                    </div>
                                                                    {plan.frequency === 'custom' && plan.customFrequency?.days && (
                                                                        <div className="text-xs text-gray-600">
                                                                            Days: {plan.customFrequency.days.join(', ')}
                                                                        </div>
                                                                    )}
                                                                    <div className="text-xs text-gray-500">
                                                                        {moment(plan.startDate).format('MMM DD, YYYY')}
                                                                        {plan.endDate ? ` - ${moment(plan.endDate).format('MMM DD, YYYY')}` : ' - No end date'}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                <div className="space-y-2">
                                                                    {plan.assignedGuards && plan.assignedGuards.length > 0 ? (
                                                                        plan.assignedGuards.map((assignment, index) => (
                                                                            <div key={index} className="flex items-center space-x-2 text-sm">
                                                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                                <span className="font-medium text-gray-900">
                                                                                    {assignment.guardId?.name || 'Unknown Guard'}
                                                                                </span>
                                                                                {assignment.guardId?.phone && (
                                                                                    <span className="text-gray-500 text-xs">
                                                                                        ({assignment.guardId.phone})
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-sm text-gray-400 italic">No guards assigned</span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-900">
                                                                    <div className="font-medium mb-2">
                                                                        {plan.checkpoints?.length || 0} checkpoint{(plan.checkpoints?.length || 0) !== 1 ? 's' : ''}
                                                                    </div>
                                                                    {plan.checkpoints && plan.checkpoints.slice(0, 3).map((checkpoint, index) => (
                                                                        <div key={index} className="text-xs text-gray-600 flex items-center space-x-1 mb-1">
                                                                            <div className={`w-2 h-2 rounded-full ${checkpoint.isActive ? 'bg-green-500' : 'bg-gray-300'
                                                                                }`}></div>
                                                                            <span className="truncate">
                                                                                {checkpoint.qrId?.siteId || 'Unknown Site'}
                                                                                {checkpoint.order !== undefined && ` (#${checkpoint.order + 1})`}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {plan.checkpoints && plan.checkpoints.length > 3 && (
                                                                        <div className="text-xs text-blue-600 font-medium">
                                                                            +{plan.checkpoints.length - 3} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody> */}

                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {patrolPlans.map((plan) => {
                                                            const showAllGuards = plan.assignedGuards?.length > 3;
                                                            const showAllCheckpoints = plan.checkpoints?.length > 3;

                                                            const displayedGuards = expandedPlanGuards.has(plan._id)
                                                                ? plan.assignedGuards
                                                                : plan.assignedGuards?.slice(0, 3);

                                                            const displayedCheckpoints = expandedPlanCheckpoints.has(plan._id)
                                                                ? plan.checkpoints
                                                                : plan.checkpoints?.slice(0, 3);

                                                            return (
                                                                <tr key={plan._id} className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-start space-x-3">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center space-x-2">
                                                                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                                                        {plan.planName}
                                                                                    </h3>
                                                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                                        {plan.rounds} round{plan.rounds !== 1 ? 's' : ''}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                                                    {plan.description || 'No description available'}
                                                                                </p>
                                                                                <div className="mt-2 text-xs text-gray-400">
                                                                                    Updated: {moment(plan.updatedAt).format('MMM DD, YYYY h:mm A')}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>

                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${plan.isActive
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : 'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                            {plan.isActive ? 'Active' : 'Inactive'}
                                                                        </span>
                                                                    </td>

                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm text-gray-900 space-y-1">
                                                                            <div className="capitalize">
                                                                                <span className="font-medium">Frequency:</span> {plan.frequency}
                                                                            </div>
                                                                            {plan.frequency === 'custom' && plan.customFrequency?.days && (
                                                                                <div className="text-xs text-gray-600">
                                                                                    Days: {plan.customFrequency.days.join(', ')}
                                                                                </div>
                                                                            )}
                                                                            <div className="text-xs text-gray-500">
                                                                                {moment(plan.startDate).format('MMM DD, YYYY')}
                                                                                {plan.endDate ? ` - ${moment(plan.endDate).format('MMM DD, YYYY')}` : ' - No end date'}
                                                                            </div>
                                                                        </div>
                                                                    </td>

                                                                    {/* Guards Column with Expandable Feature */}
                                                                    <td className="px-6 py-4">
                                                                        <div className="space-y-2">
                                                                            {displayedGuards && displayedGuards.length > 0 ? (
                                                                                <>
                                                                                    {displayedGuards.map((assignment, index) => (
                                                                                        <div key={index} className="flex items-center space-x-2 text-sm">
                                                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                                            <span className="font-medium text-gray-900">
                                                                                                {assignment.guardId?.name || 'Unknown Guard'}
                                                                                            </span>
                                                                                            {assignment.guardId?.phone && (
                                                                                                <span className="text-gray-500 text-xs">
                                                                                                    ({assignment.guardId.phone})
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                    {showAllGuards && !expandedPlanGuards.has(plan._id) && (
                                                                                        <button
                                                                                            onClick={() => togglePlanGuardsExpansion(plan._id)}
                                                                                            className="text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors"
                                                                                        >
                                                                                            +{plan.assignedGuards.length - 3} more guards
                                                                                        </button>
                                                                                    )}
                                                                                    {expandedPlanGuards.has(plan._id) && (
                                                                                        <button
                                                                                            onClick={() => togglePlanGuardsExpansion(plan._id)}
                                                                                            className="text-xs text-gray-600 font-medium hover:text-gray-800 transition-colors"
                                                                                        >
                                                                                            Show less
                                                                                        </button>
                                                                                    )}
                                                                                </>
                                                                            ) : (
                                                                                <span className="text-sm text-gray-400 italic">No guards assigned</span>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    {/* Checkpoints Column with Expandable Feature */}
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm text-gray-900">
                                                                            <div className="font-medium mb-2">
                                                                                {plan.checkpoints?.length || 0} checkpoint{(plan.checkpoints?.length || 0) !== 1 ? 's' : ''}
                                                                            </div>
                                                                            {displayedCheckpoints && displayedCheckpoints.map((checkpoint, index) => (
                                                                                <div key={index} className="text-xs text-gray-600 flex items-center space-x-1 mb-1">
                                                                                    <div className={`w-2 h-2 rounded-full ${checkpoint.isActive ? 'bg-green-500' : 'bg-gray-300'
                                                                                        }`}></div>
                                                                                    <span className="truncate">
                                                                                        {checkpoint.qrId?.siteId || 'Unknown Site'}
                                                                                        {checkpoint.sequence && ` (#${checkpoint.sequence})`}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                            {showAllCheckpoints && !expandedPlanCheckpoints.has(plan._id) && (
                                                                                <button
                                                                                    onClick={() => togglePlanCheckpointsExpansion(plan._id)}
                                                                                    className="text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors"
                                                                                >
                                                                                    +{plan.checkpoints.length - 3} more checkpoints
                                                                                </button>
                                                                            )}
                                                                            {expandedPlanCheckpoints.has(plan._id) && (
                                                                                <button
                                                                                    onClick={() => togglePlanCheckpointsExpansion(plan._id)}
                                                                                    className="text-xs text-gray-600 font-medium hover:text-gray-800 transition-colors"
                                                                                >
                                                                                    Show less
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Target className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No patrol plans</h3>
                                            <p className="mt-1 text-sm text-gray-500">No patrol plans have been created yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* INCIDENTS */}
                    {activeTab === 'incidents' && (
                                         <div>
                                             <h2 className="text-2xl font-bold text-gray-900 mb-6">Incidents</h2>
                                             <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
                                                     <div className="overflow-x-auto">
                                                         <table className="min-w-full divide-y divide-gray-200">
                                                             <thead className="bg-gray-50">
                                                                 <tr>
                                                                     {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident Details</th> */}
                                                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guard Information</th>
                                                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media</th>
                                                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                                 </tr>
                                                             </thead>
                                                             <tbody className="bg-white divide-y divide-gray-200">
                                                                 {incidents.map((incident) => (
                                                                     <tr key={incident._id} className="hover:bg-gray-50">
                                                                         {/* Incident Details */}
                                                                         {/* <td className="px-6 py-4 whitespace-nowrap">
                                                                             <div className="flex items-start">
                                                                                 <AlertTriangle
                                                                                     className={`h-6 w-6 mt-1 mr-3 ${incident.severity === "critical"
                                                                                             ? "text-red-800"
                                                                                             : incident.severity === "high"
                                                                                                 ? "text-red-600"
                                                                                                 : incident.severity === "medium"
                                                                                                     ? "text-yellow-600"
                                                                                                     : "text-green-600"
                                                                                         }`}
                                                                                 />
                                                                                 <div>
                                                                                     <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                                                                                     <div className="text-sm text-gray-500">
                                                                                         <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                                                                                             {incident.type}
                                                                                         </span>
                                                                                         <span className={`inline-block text-xs px-2 py-1 rounded-full mr-2 ${incident.severity === "critical"
                                                                                                 ? "bg-red-100 text-red-800"
                                                                                                 : incident.severity === "high"
                                                                                                     ? "bg-orange-100 text-orange-800"
                                                                                                     : incident.severity === "medium"
                                                                                                         ? "bg-yellow-100 text-yellow-800"
                                                                                                         : "bg-green-100 text-green-800"
                                                                                             }`}>
                                                                                             {incident.severity}
                                                                                         </span>
                                                                                     </div>
                                                                                     <div className="text-xs text-gray-400 mt-1">
                                                                                         {new Date(incident.createdAt).toLocaleDateString()} • {new Date(incident.createdAt).toLocaleTimeString()}
                                                                                     </div>
                                                                                     {incident.description && (
                                                                                         <div className="mt-2 text-sm text-gray-700 max-w-xs">{incident.description}</div>
                                                                                     )}
                                                                                     {incident.location?.lat && incident.location?.lng && (
                                                                                         <div className="mt-2">
                                                                                             <a
                                                                                                 href={`https://www.google.com/maps?q=${incident.location.lat},${incident.location.lng}`}
                                                                                                 target="_blank"
                                                                                                 rel="noopener noreferrer"
                                                                                                 className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                                                                             >
                                                                                                 <MapPin className="h-3 w-3 mr-1" />
                                                                                                 View Location
                                                                                             </a>
                                                                                         </div>
                                                                                     )}
                                                                                 </div>
                                                                             </div>
                                                                         </td> */}
                 
                                                                         {/* Guard Information */}
                                                                         <td className="px-6 py-4 whitespace-nowrap">
                                                                             <div className="space-y-2">
                                                                                 <div>
                                                                                     <div className="text-xs font-medium text-gray-500">Reported By</div>
                                                                                     <div className="text-sm text-gray-900">
                                                                                         {incident.reportedBy?.name || "Unknown"}
                                                                                     </div>
                                                                                     <div className="text-xs text-gray-500">
                                                                                         {incident.reportedBy?.role || "Guard"}
                                                                                     </div>
                                                                                 </div>
                 
                                                                                 {incident.assignedTo?.length > 0 && (
                                                                                     <div>
                                                                                         <div className="text-xs font-medium text-gray-500">Assigned To</div>
                                                                                         {incident.assignedTo.map((user, index) => (
                                                                                             <div key={index} className="text-sm text-gray-900">
                                                                                                 {user.name}
                                                                                                 <div className="text-xs text-gray-500">{user.role}</div>
                                                                                             </div>
                                                                                         ))}
                                                                                     </div>
                                                                                 )}
                 
                                                                                 {incident.companyId && (
                                                                                     <div>
                                                                                         <div className="text-xs font-medium text-gray-500">Company</div>
                                                                                         <div className="text-sm text-gray-900">
                                                                                             {incident.companyId?.name || "N/A"}
                                                                                         </div>
                                                                                     </div>
                                                                                 )}
     <div>
                                                                     <div className="text-xs font-medium text-gray-500">Reported At</div>
                                                                     <div className="text-sm text-gray-900">
                                                                         {moment(incident.createdAt).format('MMM DD, YYYY')}
                                                                     </div>
                                                                     <div className="text-xs text-gray-500">
                                                                         {moment(incident.createdAt).format('h:mm A')}
                                                                     </div>

                                                                                     <div className="space-y-2">
                                                                                         <div>
                                                                                             <div className="text-xs font-medium text-gray-500">Location</div>
                                                                                             <div className="text-sm text-gray-900">
                                                                                                 {incident.siteInfo?.siteId || incident.qrId?.siteId || "N/A"}
                                                                                             </div>
                                                                                         </div>






                                                                                     </div>

 

                                                                 </div>


                                                                             </div>
                                                                         </td>
                 
                                                                         {/* Media Section */}
                                                                         <td className="px-6 py-4">
                                                                             <div className="space-y-3">
                                                                                 {/* Photos */}
                                                                                 {incident.photos?.length > 0 && (
                                                                                     <div>
                                                                                         <div className="text-xs font-medium text-gray-500 mb-1">Photos ({incident.photos.length})</div>
                                                                                         <div className="flex gap-2 flex-wrap">
                                                                                             {incident.photos.slice(0, 3).map((photo, index) => (
                                                                                                 <a
                                                                                                     key={index}
                                                                                                     href={photo}
                                                                                                     target="_blank"
                                                                                                     rel="noopener noreferrer"
                                                                                                     className="block"
                                                                                                 >
                                                                                                     <img
                                                                                                         src={photo}
                                                                                                         alt={`Incident photo ${index + 1}`}
                                                                                                         className="h-16 w-16 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                                                                                     />
                                                                                                 </a>
                                                                                             ))}
                                                                                             {incident.photos.length > 3 && (
                                                                                                 <div className="h-16 w-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                                                                                     +{incident.photos.length - 3} more
                                                                                                 </div>
                                                                                             )}
                                                                                         </div>
                                                                                     </div>
                                                                                 )}
                 
                                                                                 {/* Video */}
                                                                                 {incident.video && (
                                                                                     <div>
                                                                                         <div className="text-xs font-medium text-gray-500 mb-1">Video</div>
                                                                                         <video
                                                                                             controls
                                                                                             className="h-16 w-16 object-cover rounded border cursor-pointer"
                                                                                             src={incident.video}
                                                                                             preload="metadata"
                                                                                         >
                                                                                             Your browser does not support the video tag.
                                                                                         </video>
                                                                                     </div>
                                                                                 )}
                 
                                                                                 {!incident.photos?.length && !incident.video && (
                                                                                     <div className="text-xs text-gray-400">No media</div>
                                                                                 )}
                                                                             </div>
                                                                         </td>
                 
                                                                         {/* Status */}
                                                                         <td className="px-6 py-4 whitespace-nowrap">
                                                                             <select
                                                                                 value={incident.status}
                                                                                 onChange={(e) => updateIncidentStatus(incident._id, e.target.value)}
                                                                                 className={`text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full max-w-32 ${incident.status === "reported"
                                                                                         ? "border-yellow-300 bg-yellow-50"
                                                                                         : incident.status === "investigating"
                                                                                             ? "border-blue-300 bg-blue-50"
                                                                                             : incident.status === "in-progress"
                                                                                                 ? "border-orange-300 bg-orange-50"
                                                                                                 : incident.status === "resolved"
                                                                                                     ? "border-green-300 bg-green-50"
                                                                                                     : "border-gray-300 bg-gray-50"
                                                                                     }`}
                                                                             >
                                                                                 <option value="reported">Reported</option>
                                                                                 <option value="investigating">Investigating</option>
                                                                                 <option value="in-progress">In Progress</option>
                                                                                 <option value="resolved">Resolved</option>
                                                                                 <option value="closed">Closed</option>
                                                                             </select>
                                                                             <div className="text-xs text-gray-500 mt-1">
                                                                                 Last updated: {moment(incident.updatedAt).format('MMM DD, YYYY h:mm A')}
                                                                             </div>
                                                                         </td>
                                                                     </tr>
                                                                 ))}
                                                             </tbody>
                                                         </table>
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     )}

                    {/* GUARD REPORTS SECTION */}
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
                                                                                         {report.guard?.name || 'Unknown Guard'} - Performance Report
                                                                                     </h3>
                                                                                     <p className="text-sm text-gray-500">
                                                                                         {formatReportPeriod(
                                                                                             report.reportPeriod?.startDate,
                                                                                             report.reportPeriod?.endDate,
                                                                                             report.reportPeriod?.totalDays
                                                                                         )}
                                                                                     </p>
                                                                                     <p className="text-sm text-gray-500">
                                                                                         Phone: {report.guard?.phone}
                                                                                     </p>
                                                                                 </div>
                                                                                 <div className="flex items-center space-x-3">
                                                                                     <div className="text-right">
                                                                                         <div className={`text-2xl font-bold ${parseFloat(report.performance?.overallScore || '0') >= 80 ? 'text-green-600' :
                                                                                             parseFloat(report.performance?.overallScore || '0') >= 60 ? 'text-yellow-600' :
                                                                                                 'text-red-600'
                                                                                             }`}>
                                                                                             {report.performance?.overallScore || '0'}%
                                                                                         </div>
                                                                                         <div className="text-xs text-gray-500">
                                                                                             {report.performance?.rating || 'Overall Score'}
                                                                                         </div>
                                                                                     </div>
                                                                                     <button
                                                                                         onClick={() => downloadExcelReport(report)}
                                                                                         className="flex items-center px-3 py-2 text-sm text-white bg-green-600 border border-green-700 rounded-md hover:bg-green-700"
                                                                                     >
                                                                                         <Download className="w-4 h-4 mr-1" />
                                                                                         Excel
                                                                                     </button>
                                                                                 </div>
                                                                             </div>
                                                                         </div>
                         
                                                                         {/* Performance Summary */}
                                                                         <div className="px-6 py-4 border-b bg-indigo-50">
                                                                             <h4 className="text-md font-medium text-gray-900 mb-3">Performance Summary</h4>
                                                                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                                 <div className="text-center">
                                                                                     <div className="text-lg font-bold text-blue-600">
                                                                                         {report.roundsPerformance?.summary?.totalCompletedRounds || 0}/{report.roundsPerformance?.summary?.totalExpectedRounds || 0}
                                                                                     </div>
                                                                                     <div className="text-sm text-gray-600">Rounds Completed</div>
                                                                                 </div>
                                                                                 <div className="text-center">
                                                                                     <div className="text-lg font-bold text-purple-600">
                                                                                         {report.roundsPerformance?.summary?.totalCompletedScans || 0}/{report.roundsPerformance?.summary?.totalExpectedScans || 0}
                                                                                     </div>
                                                                                     <div className="text-sm text-gray-600">Scans Completed</div>
                                                                                 </div>
                                                                                 <div className="text-center">
                                                                                     <div className={`text-lg font-bold ${parseFloat(report.roundsPerformance?.summary?.roundsCompletionRate) >= 80 ? 'text-green-600' :
                                                                                         parseFloat(report.roundsPerformance?.summary?.roundsCompletionRate) >= 60 ? 'text-yellow-600' :
                                                                                             'text-red-600'
                                                                                         }`}>
                                                                                         {report.roundsPerformance?.summary?.roundsCompletionRate || '0%'}
                                                                                     </div>
                                                                                     <div className="text-sm text-gray-600">Rounds Completion</div>
                                                                                 </div>
                                                                                 <div className="text-center">
                                                                                     <div className="text-lg font-bold text-indigo-600">
                                                                                         {report.summary?.efficiency || '0%'}
                                                                                     </div>
                                                                                     <div className="text-sm text-gray-600">Overall Efficiency</div>
                                                                                 </div>
                                                                             </div>
                                                                         </div>
                         
                                                                         {/* Plan Breakdown */}
                                                                         {/* {report.roundsPerformance?.planBreakdown && report.roundsPerformance.planBreakdown.length > 0 && (
                                                                             <div className="px-6 py-4 border-b bg-white">
                                                                                 <h4 className="text-md font-medium text-gray-900 mb-3">Plan Breakdown</h4>
                                                                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                                     {report.roundsPerformance.planBreakdown.map((plan, idx) => (
                                                                                         <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                                                                                             <h5 className="font-medium text-gray-900 mb-2">{plan.planName}</h5>
                                                                                             <div className="space-y-2 text-sm">
                                                                                                 <div className="flex justify-between">
                                                                                                     <span className="text-gray-600">Rounds:</span>
                                                                                                     <span className="font-medium">{plan.completedRounds}/{plan.totalRounds}</span>
                                                                                                 </div>
                                                                                                 <div className="flex justify-between">
                                                                                                     <span className="text-gray-600">Scans:</span>
                                                                                                     <span className="font-medium">{plan.completedScans}/{plan.totalRounds * plan.totalCheckpoints}</span>
                                                                                                 </div>
                                                                                                 <div className="flex justify-between">
                                                                                                     <span className="text-gray-600">Completion:</span>
                                                                                                     <span className={`font-medium ${parseFloat(plan.completionRate) >= 80 ? 'text-green-600' :
                                                                                                         parseFloat(plan.completionRate) >= 60 ? 'text-yellow-600' :
                                                                                                             'text-red-600'
                                                                                                         }`}>
                                                                                                         {plan.completionRate}
                                                                                                     </span>
                                                                                                 </div>
                                                                                             </div>
                                                                                         </div>
                                                                                     ))}
                                                                                 </div>
                                                                             </div>
                                                                         )} */}
                         
                                                                         {/* Progress Summary */}
                                                                         {/* <div className="px-6 py-4 border-b bg-green-50">
                                                                             <div className="flex items-center justify-between">
                                                                                 <div>
                                                                                     <h4 className="text-md font-medium text-gray-900">Progress Summary</h4>
                                                                                     <p className="text-sm text-gray-600 mt-1">{report.summary?.progress}</p>
                                                                                 </div>
                                                                                 <div className="text-right">
                                                                                     <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${report.summary?.status === 'Good' ? 'bg-green-100 text-green-800' :
                                                                                         report.summary?.status === 'Needs Improvement' ? 'bg-yellow-100 text-yellow-800' :
                                                                                             'bg-red-100 text-red-800'
                                                                                         }`}>
                                                                                         {report.summary?.status}
                                                                                     </span>
                                                                                 </div>
                                                                             </div>
                                                                         </div> */}
                         
                                                                         {/* Detailed Rounds Performance Table */}
                                                                         <div className="p-6">
                                                                             <div className="flex justify-between items-center mb-4">
                                                                                 <h4 className="text-md font-medium text-gray-900">Detailed Patrol Rounds</h4>
                                                                                 <div className="text-sm text-gray-500">
                                                                                     Total Records: {report.detailedRounds?.length || 0}
                                                                                 </div>
                                                                             </div>
                         
                                                                             {report.detailedRounds && report.detailedRounds.length > 0 ? (
                                                                                 <div className="overflow-x-auto">
                                                                                     <table className="min-w-full divide-y divide-gray-200">
                                                                                         <thead className="bg-gray-50">
                                                                                             <tr>
                                                                                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                                     Date
                                                                                                 </th>
                                                                                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                                     Round
                                                                                                 </th>
                                                                                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                                     Plan Name
                                                                                                 </th>
                                                                                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                                     Checkpoint
                                                                                                 </th>
                                                                                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                                     Actual Time
                                                                                                 </th>
                                                                                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                                     Status
                                                                                                 </th>
                                                                                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                                     Distance
                                                                                                 </th>
                                                                                             </tr>
                                                                                         </thead>
                                                                                         <tbody className="bg-white divide-y divide-gray-200">
                                                                                             {report.detailedRounds.map((round, idx) => (
                                                                                                 <tr key={idx} className="hover:bg-gray-50">
                                                                                                     <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                                                         {formatDateTimeForDisplay(round.date).split(' ').slice(0, 3).join(' ')}
                                                                                                     </td>
                                                                                                     <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                                                         Round {round.roundNumber}
                                                                                                     </td>
                                                                                                     <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-medium">
                                                                                                         {round.planName || 'N/A'}
                                                                                                     </td>
                                                                                                     <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                                                         <div>
                                                                                                             <div className="font-medium">{round.checkpointName}</div>
                                                                                                             {round.checkpointDescription && (
                                                                                                                 <div className="text-xs text-gray-400">{round.checkpointDescription}</div>
                                                                                                             )}
                                                                                                         </div>
                                                                                                     </td>
                                                                                                     <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                                                         {round.actualTime ? formatTimeForDisplay(round.actualTime).split(' ').slice(0, 2).join(' ') : 'Not Scanned'}
                                                                                                     </td>
                                                                                                     <td className="px-4 py-3 whitespace-nowrap">
                                                                                                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${round.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                                                             round.status === 'missed' ? 'bg-red-100 text-red-800' :
                                                                                                                 'bg-gray-100 text-gray-800'
                                                                                                             }`}>
                                                                                                             {round.status ? round.status.charAt(0).toUpperCase() + round.status.slice(1) : 'Pending'}
                                                                                                         </span>
                                                                                                     </td>
                                                                                                     <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                                                         {round.distanceMeters ? `${round.distanceMeters}m` : 'N/A'}
                                                                                                     </td>
                                                                                                 </tr>
                                                                                             ))}
                                                                                         </tbody>
                                                                                     </table>
                                                                                 </div>
                                                                             ) : (
                                                                                 <div className="text-center py-8 bg-gray-50 rounded-lg">
                                                                                     <Target className="mx-auto h-8 w-8 text-gray-400" />
                                                                                     <p className="mt-2 text-sm text-gray-500">No patrol rounds data available for this period</p>
                                                                                     <p className="text-xs text-gray-400">The guard may not have any assigned patrol plans or scans</p>
                                                                                 </div>
                                                                             )}
                                                                         </div>
                                                                     </div>
                                                                 ))
                                                             )}
                                                         </div>
                                                     </div>
                                                 )}
                         
                  
                  
                  

                    {/* CREATE/EDIT MODAL */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6">
                                    <h2 className="text-xl font-bold mb-4">
                                        {editingItem ? `Edit ${modalType}` : `Add New ${modalType}`}
                                    </h2>
                                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                                        {modalType === 'guard' && (
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
                                                            // Don't pre-fill password for edits
                                                            defaultValue=""
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
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                                    <input
                                                        type="tel"
                                                        {...register('phone', {
                                                            required: 'Phone is required',
                                                            validate: {
                                                                validPhone: (value) => validatePhone(value) || 'Phone number must be exactly 10 digits'
                                                            }
                                                        })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                        placeholder="9909090909"
                                                        maxLength="10"
                                                        // pattern="[0-9]{10}"
                                                    />
                                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                                                </div>
                                            </>
                                        )}

                                        {modalType === 'supervisor' && (
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
                                                            required: 'Phone is required',
                                                            validate: {
                                                                validPhone: (value) => validatePhone(value) || 'Phone number must be exactly 10 digits'
                                                            }
                                                        })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                                        placeholder="9909090909"
                                                        maxLength="10"
                                                        // pattern="[0-9]{10}"
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

                    {/* DELETE SUPERVISOR WITH REASSIGNMENT MODAL */}
                    {showDeleteModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg max-w-md w-full">
                                <div className="p-6">
                                    <div className="flex items-center mb-4">
                                        <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                                        <h2 className="text-xl font-bold text-gray-900">Delete Supervisor</h2>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-gray-600 mb-3">
                                            You are about to delete supervisor <span className="font-semibold">
                                                {supervisors.find(s => s._id === deleteSupervisorId)?.name}
                                            </span>. Please select a replacement supervisor to reassign their guards.
                                        </p>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Note:</strong> All guards under this supervisor will be reassigned to the selected replacement supervisor.
                                            </p>
                                        </div>

                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Replacement Supervisor *
                                        </label>
                                        <select
                                            value={reassignSupervisorId}
                                            onChange={(e) => setReassignSupervisorId(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        >
                                            <option value="">Choose a supervisor...</option>
                                            {supervisors
                                                .filter(supervisor =>
                                                    supervisor._id !== deleteSupervisorId &&
                                                    supervisor.isActive !== false
                                                )
                                                .map((supervisor) => (
                                                    <option key={supervisor._id} value={supervisor._id}>
                                                        {supervisor.name} ({supervisor.guards?.length || 0} guards)
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        {reassignSupervisorId === '' && (
                                            <p className="text-red-500 text-xs mt-1">Please select a replacement supervisor</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowDeleteModal(false);
                                                setDeleteSupervisorId(null);
                                                setReassignSupervisorId('');
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!reassignSupervisorId) {
                                                    toast.error('Please select a replacement supervisor');
                                                    return;
                                                }
                                                deleteSupervisorWithReassignment(deleteSupervisorId, reassignSupervisorId);
                                            }}
                                            disabled={!reassignSupervisorId}
                                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete & Reassign
                                        </button>
                                    </div>
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