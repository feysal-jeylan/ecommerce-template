// advanced-api.js - NEW FILE - Place in e-commerce/ directory
class AdvancedAPI {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('swiftbuy_token');
    }

    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async getProducts() {
    try {
        const response = await fetch(`${this.baseURL}/products`, {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        });
        
        if (response.status === 401) {
            throw new Error('Authentication required. Please login.');
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.warn('Using fallback products data:', error.message);
        throw error;
    }
}

    async createOrder(orderData) {
        try {
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.token && { 'Authorization': `Bearer ${this.token}` })
                },
                body: JSON.stringify(orderData)
            });
            if (!response.ok) throw new Error('Failed to create order');
            return await response.json();
        } catch (error) {
            console.warn('Saving order to localStorage fallback');
            throw error;
        }
    }

    async login(email, password) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error('Login failed');
        const data = await response.json();
        this.token = data.token;
        localStorage.setItem('swiftbuy_token', data.token);
        return data;
    }

    async healthCheckWithAuth() {
    try {
        const response = await fetch(`${this.baseURL}/health`, {
            headers: {
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

}

window.advancedApi = new AdvancedAPI();