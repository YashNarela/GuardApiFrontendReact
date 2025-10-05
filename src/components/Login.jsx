// import React, { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { useAuth } from '../contexts/AuthContext';
// import { Shield, Eye, EyeOff } from 'lucide-react';
// import axios from "../services/axiosConfig"
// const Login = () => {
//     const { register, handleSubmit, formState: { errors } } = useForm();
//     const { login } = useAuth();
//     const [loading, setLoading] = useState(false);
//     const [showPassword, setShowPassword] = useState(false);
//     const [loginError, setLoginError] = useState('');

//     const onSubmit = async (data) => {
//         setLoading(true);
//         setLoginError('');
//         try {
//             const identifier = data.identifier.trim();
            
//             // Remove any non-digit characters for phone validation
//             const phoneOnly = identifier.replace(/\D/g, '');
            
//             // Check if it's a phone number (10-15 digits)
//             const isPhone = /^[0-9]{10,15}$/.test(phoneOnly);

//             // SIMPLIFIED: Send only one identifier field
//             const loginData = {
//                 password: data.password,
//                 [isPhone ? 'phone' : 'email']: isPhone ? phoneOnly : identifier.toLowerCase()
//             };

//             console.log('Sending login data:', loginData);
//             await login(loginData);
//         } catch (err) {
//             console.error('Login error:', err);
//             setLoginError(err.response?.data?.message || 'Login failed. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
//             <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
//                 <div className="text-center">
//                     <Shield className="mx-auto h-12 w-12 text-indigo-600" />
//                     <h2 className="mt-4 text-3xl font-bold text-gray-900">Security Patrol System</h2>
//                     <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
//                 </div>

//                 <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
//                     <div>
//                         <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
//                             Email or Phone
//                         </label>
//                         <input
//                             {...register('identifier', { 
//                                 required: 'Email or Phone is required'
//                             })}
//                             type="text"
//                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//                             placeholder="Enter your email or phone number"
//                         />
//                         {errors.identifier && (
//                             <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
//                         )}
//                     </div>

//                     <div>
//                         <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//                             Password
//                         </label>
//                         <div className="mt-1 relative">
//                             <input
//                                 {...register('password', { 
//                                     required: 'Password is required'
//                                 })}
//                                 type={showPassword ? 'text' : 'password'}
//                                 className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10"
//                                 placeholder="Enter your password"
//                             />
//                             <button
//                                 type="button"
//                                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                                 onClick={() => setShowPassword(!showPassword)}
//                             >
//                                 {showPassword ? (
//                                     <EyeOff className="h-5 w-5 text-gray-400" />
//                                 ) : (
//                                     <Eye className="h-5 w-5 text-gray-400" />
//                                 )}
//                             </button>
//                         </div>
//                         {errors.password && (
//                             <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
//                         )}
//                     </div>

//                     {loginError && (
//                         <div className="rounded-md bg-red-50 p-4">
//                             <p className="text-sm text-red-800">{loginError}</p>
//                         </div>
//                     )}

//                     <div>
//                         <button
//                             type="submit"
//                             disabled={loading}
//                             className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             {loading ? 'Signing in...' : 'Sign In'}
//                         </button>
//                     </div>

               
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default Login;


import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';
import axios from "../services/axiosConfig"

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Premium animated background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

            <div className="max-w-md w-full relative z-10">
                {/* Glowing card effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-40 transition-opacity"></div>

                <div className="relative bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
                    {/* Premium header with shield icon */}
                    <div className="relative p-8 sm:p-10 text-center">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600"></div>

                        <div className="relative inline-flex mb-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg">
                                <Shield className="w-10 h-10 text-white" strokeWidth={2.5} />
                            </div>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-semibold mb-2 bg-gradient-to-r from-gray-100 via-white to-gray-100 bg-clip-text text-transparent">
                            Security Patrol
                        </h1>
                        {/* <p className="text-gray-400 text-xs sm:text-sm font-light tracking-wide">
                            Enterprise-grade security platform
                        </p> */}
                    </div>

                    {/* Premium form section */}
                    <div className="px-8 pb-10 sm:px-10 sm:pb-12">
                        <div className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            {/* Email/Phone input */}
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-gray-300 tracking-wide uppercase">
                                    Email or Phone
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
                                    <div className="relative flex items-center">
                                        <div className="absolute left-4 text-gray-500">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            {...register('identifier', {
                                                required: 'Email or Phone is required'
                                            })}
                                            type="text"
                                            className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>
                                {errors.identifier && (
                                    <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                                        {errors.identifier.message}
                                    </div>
                                )}
                            </div>

                            {/* Password input */}
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-gray-300 tracking-wide uppercase">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
                                    <div className="relative flex items-center">
                                        <div className="absolute left-4 text-gray-500">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            {...register('password', {
                                                required: 'Password is required'
                                            })}
                                            type={showPassword ? 'text' : 'password'}
                                            className="w-full pl-12 pr-12 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-4 text-gray-500 hover:text-gray-300 transition-colors p-1"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {errors.password && (
                                    <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                                        {errors.password.message}
                                    </div>
                                )}
                            </div>

                            {/* Error message */}
                            {loginError && (
                                <div className="relative overflow-hidden rounded-xl bg-red-500/10 border border-red-500/30 p-4 backdrop-blur-sm">
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-transparent"></div>
                                    <p className="relative text-sm text-red-300 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                        {loginError}
                                    </p>
                                </div>
                            )}

                            {/* Premium submit button */}
                            <button
                                type="submit"
                                disabled={loading}
                                onClick={handleSubmit(onSubmit)}
                                className="group relative w-full mt-8 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-100 group-hover:opacity-90 transition-opacity"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 opacity-0 group-hover:opacity-100 blur transition-opacity"></div>
                                <div className="relative flex items-center justify-center py-4 px-6 rounded-xl font-semibold text-white text-base tracking-wide shadow-xl group-hover:shadow-2xl transition-all duration-300">
                                    {loading ? (
                                        <div className="flex items-center gap-3">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Authenticating...</span>
                                        </div>
                                    ) : (
                                        <span>Sign In Securely</span>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Premium footer */}
                <div className="mt-8 text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                        <div className="w-8 h-px bg-gradient-to-r from-transparent to-gray-700"></div>
                        <Shield className="w-3 h-3" />
                    
                        <Shield className="w-3 h-3" />
                        <div className="w-8 h-px bg-gradient-to-l from-transparent to-gray-700"></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                    background-size: 50px 50px;
                }
            `}</style>
        </div>
    );
};

export default Login;