import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');

    const onSubmit = async (data) => {
        setLoading(true);
        setLoginError('');
        try {
            const identifier = data.identifier.trim();
            
            // Remove any non-digit characters for phone validation
            const phoneOnly = identifier.replace(/\D/g, '');
            
            // Check if it's a phone number (10-15 digits)
            const isPhone = /^[0-9]{10,15}$/.test(phoneOnly);

            // SIMPLIFIED: Send only one identifier field
            const loginData = {
                password: data.password,
                [isPhone ? 'phone' : 'email']: isPhone ? phoneOnly : identifier.toLowerCase()
            };

            console.log('Sending login data:', loginData);
            await login(loginData);
        } catch (err) {
            console.error('Login error:', err);
            setLoginError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-indigo-600" />
                    <h2 className="mt-4 text-3xl font-bold text-gray-900">Security Patrol System</h2>
                    <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                            Email or Phone
                        </label>
                        <input
                            {...register('identifier', { 
                                required: 'Email or Phone is required'
                            })}
                            type="text"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter your email or phone number"
                        />
                        {errors.identifier && (
                            <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="mt-1 relative">
                            <input
                                {...register('password', { 
                                    required: 'Password is required'
                                })}
                                type={showPassword ? 'text' : 'password'}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <Eye className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                        )}
                    </div>

                    {loginError && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-800">{loginError}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </div>

                    <div className="text-center">
                        <div className="text-sm text-gray-600">
                            Demo Credentials:
                            <div className="mt-2 space-y-1 text-xs">
                                <div><strong>Admin:</strong> admin@test.com / admin123</div>
                                <div><strong>Employee:</strong> employee@test.com / emp123</div>
                                <div><strong>Guard:</strong> guard@test.com / guard123</div>
                                <div className="mt-2"><strong>Phone Login:</strong> 1234567890 / yourpassword</div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;