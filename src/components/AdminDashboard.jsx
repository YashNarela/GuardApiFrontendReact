import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserPlus, Edit, Trash2, LogOut } from 'lucide-react';
import axios from '../services/axiosConfig';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        fetchEmployees();
    }, []);



    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/employees');
            setEmployees(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    };

    const createEmployee = async (data) => {
        try {

            const employeData={
                ...data, role: 'employee' 
            }

            await axios.post('/api/auth/register', employeData);


            toast.success('Employee created successfully');
            fetchEmployees();
            setShowCreateModal(false);
            reset();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to create employee');
        }
    };

    const updateEmployee = async (data) => {
        try 
        {

            const filterData={
                ...data,

            }


            await axios.put(`/api/employees/${editingEmployee._id}`, filterData);
            toast.success('Employee updated successfully');
            fetchEmployees();
            setEditingEmployee(null);
            reset();
        } catch (error) {
            toast.error('Failed to update employee');
        }
    };

    const deleteEmployee = async (id) => {
        if (window.confirm('Are you sure you want to delete this Campany?')) {
            try {
                await axios.delete(`/api/employees/${id}`);
                toast.success('Employee deleted successfully');
                fetchEmployees();
            } catch (error) {
                toast.error('Failed to delete employee');
            }
        }
    };

    const handleFormSubmit = (data) => {
        if (editingEmployee) {
            updateEmployee(data);
        } else {
            createEmployee(data);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-600">Welcome, {user.name}</p>
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
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Users className="w-8 h-8 mr-3 text-indigo-600" />
                            Campany
                        </h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Campany
                        </button>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {employees.map((employee) => (
                                <li key={employee._id} className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {employee.name}
                                            </h3>
                                            <p className="text-sm text-gray-600">{employee.email}</p>

                                            {/* ✅ Show phone only if it exists */}
                                            {employee.phone && (
                                                <p className="text-sm text-gray-600">📞 {employee.phone}</p>
                                            )}

                                            <p className="text-xs text-gray-500">
                                                Created: {new Date(employee.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setEditingEmployee(employee);
                                                    reset({
                                                        name: employee.name,
                                                        email: employee.email,
                                                        phone: employee.phone || "", // ✅ preload phone in form too
                                                    });
                                                }}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteEmployee(employee._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </main>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingEmployee) && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            {editingEmployee ? 'Edit Campany' : 'Create Campany'}
                        </h3>
                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    {...register('name', { required: 'Name is required' })}
                                    type="text"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^\S+@\S+$/i,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                    type="email"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {editingEmployee ? "Password (leave blank to keep existing)" : "Password"}
                                </label>
                                <input
                                    {...register("password", {
                                        required: !editingEmployee ? "Password is required" : false, // required only on create
                                    })}
                                    type="password"
                                    placeholder={editingEmployee ? "Leave blank to keep current password" : "Enter password"}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
               focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                )}
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
                                    placeholder="9909090909"
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                            </div>


                            

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setEditingEmployee(null);
                                        reset();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                    {editingEmployee ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;