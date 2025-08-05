// UPDATED: Multi-tenant authentication service
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// UPDATED: Request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// UPDATED: Response interceptor for better error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const authService = {
    // UPDATED: Multi-tenant registration
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response;
    },

    // UPDATED: Multi-tenant login
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response;
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
    },

    // ADDED: Set auth token for requests
    setAuthToken: (token) => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
    },

    // ADDED: Remove auth token
    removeAuthToken: () => {
        delete api.defaults.headers.common['Authorization'];
    },

    // ADDED: Get current user info
    getCurrentUser: () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    },

    // ADDED: Invite user (admin only)
    inviteUser: async (userData) => {
        const response = await api.post('/auth/invite', userData);
        return response;
    },

    // ADDED: Verify token validity
    verifyToken: async () => {
        const response = await api.get('/auth/verify');
        return response;
    }
};

export default authService;
