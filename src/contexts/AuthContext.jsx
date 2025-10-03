// import React, { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';
// import toast from 'react-hot-toast';

// const AuthContext = createContext();

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);

//     // Set up axios defaults
//     useEffect(() => {
//         const token = localStorage.getItem('token');
//         if (token) {
//             axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//             // Decode token to get user info
//             try {
//                 const payload = JSON.parse(atob(token.split('.')[1]));
//                 const userData = JSON.parse(localStorage.getItem('user'));
//                 if (userData && payload.exp > Date.now() / 1000) {
//                     setUser(userData);
//                 } else {
//                     logout();
//                 }
//             } catch (error) {
//                 logout();
//             }
//         }
//         setLoading(false);
//     }, []);

//     const login = async (email, password) => {
//         try {
//             const response = await axios.post('/api/auth/login', { email, password });
//             const { user: userData, token } = response.data.data;

//             localStorage.setItem('token', token);
//             localStorage.setItem('user', JSON.stringify(userData));
//             axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

//             setUser(userData);
//             toast.success('Login successful');
//             return true;
//         } catch (error) {
//             toast.error(error.response?.data?.msg || 'Login failed');
//             return false;
//         }
//     };

//     const logout = () => {
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         delete axios.defaults.headers.common['Authorization'];
//         setUser(null);
//         toast.success('Logged out successfully');
//     };

//     const register = async (userData) => {
//         try {
//             const response = await axios.post('/api/auth/register', userData);
//             toast.success('Registration successful');
//             return response.data;
//         } catch (error) {
//             toast.error(error.response?.data?.msg || 'Registration failed');
//             throw error;
//         }
//     };

//     const value = {
//         user,
//         login,
//         logout,
//         register,
//         loading
//     };

//     return (
//         <AuthContext.Provider value={value}>
//             {!loading && children}
//         </AuthContext.Provider>
//     );
// };

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../../src/services/axiosConfig';
import toast from 'react-hot-toast';

const AuthContext = createContext();




export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Set up axios defaults
    useEffect(() => {
        axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Decode token to get user info
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData && payload.exp > Date.now() / 1000) {
                    setUser(userData);
                } else {
                    logout();
                }
            } catch (error) {
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (loginData) => { // Changed to accept an object
        try {
            const response = await axios.post('/api/auth/login', loginData); // Send the object directly
            const { user: userData, token } = response.data.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(userData);
            toast.success('Login successful');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Login failed');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        toast.success('Logged out successfully');
    };

    const register = async (userData) => {
        try {
            const response = await axios.post('/api/auth/register', userData);
            toast.success('Registration successful');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Registration failed');
            throw error;
        }
    };

    const value = {
        user,
        login,
        logout,
        register,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};