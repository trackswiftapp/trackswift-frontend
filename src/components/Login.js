// UPDATED: Multi-tenant login form
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        companyName: '', // ADDED: Company name field for tenant identification
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // UPDATED: Include company name in login request
            const response = await authService.login({
                email: formData.email,
                password: formData.password,
                companyName: formData.companyName.trim()
            });

            // UPDATED: Login with token and user data
            login(response.token, response.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>Welcome Back</h2>
                <p className="subtitle">Sign in to your TrackSwift account</p>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    {/* ADDED: Company name field */}
                    <div className="form-group">
                        <label htmlFor="companyName">Company Name *</label>
                        <input
                            type="text"
                            id="companyName"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            required
                            placeholder="Enter your company name"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="your@company.com"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password"
                            className="form-input"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="submit-button"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className="register-link">
                    Don't have an account? 
                    <a href="/register" onClick={(e) => {
                        e.preventDefault();
                        navigate('/register');
                    }}> Create one here</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
