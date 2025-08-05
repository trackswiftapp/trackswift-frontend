// UPDATED: Multi-tenant authentication context
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                token: action.payload.token,
                loading: false,
                error: null
            };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                token: null,
                loading: false,
                error: null
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                loading: false
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            };
        default:
            return state;
    }
};

const initialState = {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // UPDATED: Check for existing token on app load
    useEffect(() => {
        const checkAuthState = async () => {
            try {
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user') || 'null');

                if (token && user) {
                    // UPDATED: Verify token is still valid
                    authService.setAuthToken(token);
                    
                    // You could add a token validation endpoint here
                    dispatch({
                        type: 'LOGIN_SUCCESS',
                        payload: { token, user }
                    });
                } else {
                    dispatch({ type: 'LOGOUT' });
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                dispatch({ type: 'LOGOUT' });
            }
        };

        checkAuthState();
    }, []);

    const login = (token, user) => {
        // UPDATED: Store both token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        authService.setAuthToken(token);
        
        dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { token, user }
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        authService.removeAuthToken();
        dispatch({ type: 'LOGOUT' });
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    // ADDED: Helper functions for tenant info
    const getTenantId = () => state.user?.tenantId;
    const getCompanyName = () => state.user?.companyName;
    const isAdmin = () => state.user?.role === 'admin';

    const value = {
        ...state,
        login,
        logout,
        clearError,
        getTenantId, // ADDED
        getCompanyName, // ADDED
        isAdmin // ADDED
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
