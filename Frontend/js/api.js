const BACKEND_BASE_URL = 'http://localhost:3000/api';

const api = {
    async request(endpoint, options = {}) {
        const url = `${BACKEND_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const config = {
            ...options,
            headers,
            // Include credentials to send/receive cookies
            credentials: 'include'
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            // Suppress the console error specifically for the initial session check
            if (endpoint !== '/auth/me' || error.message !== 'Unauthorized') {
                console.error('API Error:', error);
            }
            throw error;
        }
    },

    auth: {
        sendOtp: (name, email) => api.request('/auth/send-otp', {
            method: 'POST',
            body: { name, email }
        }),
        register: (email, otp, password) => api.request('/auth/register', {
            method: 'POST',
            body: { email, otp, password }
        }),
        login: (email, password) => api.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        }),
        logout: () => api.request('/auth/logout', {
            method: 'POST'
        }),
        me: () => api.request('/auth/me', {
            method: 'GET'
        })
    },

    complaints: {
        my: () => api.request('/complaints/my', {
            method: 'GET'
        }),
        all: () => api.request('/admin/complaints', {
            method: 'GET'
        }),
        submit: (complaintText, aiQuestion, userAnswer) => api.request('/complaints', {
            method: 'POST',
            body: { complaintText, aiQuestion, userAnswer }
        })
    },

    ai: {
        getQuestion: (complaintText) => api.request('/ai/question', {
            method: 'POST',
            body: { complaintText }
        })
    }
};

window.api = api;
