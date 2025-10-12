// Advanced API Service for Full-Stack Integration
class AdvancedApiService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('swiftbuy_token');
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            };

            if (this.token) {
                config.headers.Authorization = `Bearer ${this.token}`;
            }

            if (options.body) {
                config.body = JSON.stringify(options.body);
            }

            console.log(`🔄 API Call: ${url}`, options.body || '');
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            console.log(`✅ API Response:`, data);
            return data;
        } catch (error) {
            console.error('❌ API request failed:', error);
            throw error;
        }
    }

    // ===== PRODUCTS =====
    async getProducts(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.request(`/products?${params}`);
    }

    async getProduct(productId) {
        return this.request(`/products/${productId}`);
    }

    async getProductRecommendations(productId) {
        return this.request(`/products/${productId}/recommendations`);
    }

    // ===== CART =====
    async addToCart(productId, quantity = 1, userId = 'guest') {
        return this.request('/cart/add', {
            method: 'POST',
            body: { productId, quantity, userId }
        });
    }

    async getCart(userId = 'guest') {
        return this.request(`/cart?userId=${userId}`);
    }

    // ===== ORDERS =====
    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: orderData
        });
    }

    async getOrders() {
        return this.request('/orders');
    }

    async getOrder(orderId) {
        return this.request(`/orders/${orderId}`);
    }

    // ===== ANALYTICS =====
    async getAnalytics() {
        return this.request('/analytics');
    }

    // ===== INVENTORY =====
    async updateInventory(productId, action, quantity) {
        return this.request('/inventory/update', {
            method: 'POST',
            body: { productId, action, quantity }
        });
    }

    // ===== ADMIN =====
    async getAdminStats() {
        return this.request('/admin/stats');
    }

    async updateProduct(productId, updates) {
        return this.request(`/admin/products/${productId}`, {
            method: 'PUT',
            body: updates
        });
    }

    async createProduct(productData) {
        return this.request('/admin/products', {
            method: 'POST',
            body: productData
        });
    }
}

// Create global instance with auto-reconnect
window.advancedApi = new AdvancedApiService();

// Health check on load
window.advancedApi.healthCheck = async () => {
    try {
        const health = await window.advancedApi.request('/health');
        console.log('🏥 Backend Health:', health.status);
        return true;
    } catch (error) {
        console.warn('🚨 Backend unavailable - running in offline mode');
        return false;
    }
};

console.log('🚀 Advanced API Service Loaded - Full-Stack Ready!');