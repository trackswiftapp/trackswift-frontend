// UPDATED: Generic API service with automatic tenant filtering
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // UPDATED: Automatic token attachment
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // UPDATED: Enhanced error handling
        this.api.interceptors.response.use(
            (response) => response.data,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // Generic CRUD operations (automatically tenant-scoped on backend)
    async getAll(endpoint) {
        return await this.api.get(`/${endpoint}`);
    }

    async getById(endpoint, id) {
        return await this.api.get(`/${endpoint}/${id}`);
    }

    async create(endpoint, data) {
        return await this.api.post(`/${endpoint}`, data);
    }

    async update(endpoint, id, data) {
        return await this.api.put(`/${endpoint}/${id}`, data);
    }

    async delete(endpoint, id) {
        return await this.api.delete(`/${endpoint}/${id}`);
    }

    // ADDED: File upload with tenant isolation
    async uploadFile(endpoint, formData) {
        return await this.api.post(`/${endpoint}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    // ADDED: Get tenant info
    async getTenantInfo() {
        return await this.api.get('/tenant/info');
    }
}

export default new ApiService();
