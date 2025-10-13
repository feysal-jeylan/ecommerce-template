// Advanced Admin Dashboard Backend Service
class AdminApiService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
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

            if (options.body) {
                config.body = JSON.stringify(options.body);
            }

            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Admin API request failed:', error);
            throw error;
        }
    }

    // ===== DASHBOARD ANALYTICS =====
    async getDashboardStats() {
        return this.request('/admin/stats');
    }

    async getAnalytics() {
        return this.request('/analytics');
    }

    // ===== PRODUCT MANAGEMENT =====
    async getAllProducts() {
        return this.request('/products');
    }

    async updateProduct(productId, updates) {
        return this.request(`/admin/products/${productId}`, {
            method: 'PUT',
            body: updates
        });
    }

    async updateInventory(productId, stockData) {
        return this.request(`/admin/products/${productId}`, {
            method: 'PUT',
            body: { inventory: stockData }
        });
    }

    // ===== ORDER MANAGEMENT =====
    async getAllOrders() {
        return this.request('/admin/orders');
    }

    async updateOrderStatus(orderId, status) {
        return this.request(`/admin/orders/${orderId}`, {
            method: 'PUT',
            body: { status }
        });
    }

    // ===== REAL-TIME DATA =====
    async getRealTimeStats() {
        const [stats, analytics, orders] = await Promise.all([
            this.getDashboardStats(),
            this.getAnalytics(),
            this.getAllOrders()
        ]);

        return {
            overview: stats.stats.overview,
            analytics: analytics.analytics,
            recentOrders: stats.stats.recentOrders,
            lowStock: stats.stats.lowStock,
            topProducts: stats.stats.topProducts,
            allOrders: orders.orders
        };
    }
}

// Create global instance
window.adminApi = new AdminApiService();

// Admin dashboard initialization
window.initializeAdminDashboard = async function() {
    try {
        console.log('🔄 Initializing Admin Dashboard with backend data...');
        
        const dashboardData = await window.adminApi.getRealTimeStats();
        
        // Update dashboard with real data
        updateDashboardUI(dashboardData);
        
        console.log('✅ Admin Dashboard connected to backend!');
        
    } catch (error) {
        console.error('❌ Admin backend connection failed:', error);
        // Fallback to localStorage data
        initializeAdminFallback();
    }
};

// Update UI with real data
function updateDashboardUI(data) {
    // Update overview cards
    updateOverviewCards(data.overview);
    
    // Update recent orders table
    updateOrdersTable(data.recentOrders);
    
    // Update low stock alerts
    updateLowStockAlerts(data.lowStock);
    
    // Update product management
    updateProductManagement(data.analytics.products);
    
    // Update charts and analytics
    updateAnalyticsCharts(data.analytics);
}

function updateOverviewCards(overview) {
    const cards = {
        'total-products': overview.totalProducts,
        'total-orders': overview.totalOrders,
        'total-revenue': `$${overview.totalRevenue.toFixed(2)}`,
        'total-customers': overview.totalCustomers
    };

    Object.keys(cards).forEach(cardId => {
        const element = document.getElementById(cardId);
        if (element) {
            element.textContent = cards[cardId];
        }
    });
}

function updateOrdersTable(orders) {
    const tbody = document.querySelector('#recent-orders tbody');
    if (!tbody) return;

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.orderId}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>$${order.totals.total.toFixed(2)}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>
                <button class="btn-action" onclick="viewOrder('${order.orderId}')">View</button>
            </td>
        </tr>
    `).join('');
}

function updateLowStockAlerts(lowStockItems) {
    const container = document.getElementById('low-stock-alerts');
    if (!container) return;

    container.innerHTML = lowStockItems.map(product => `
        <div class="alert-item">
            <div class="alert-product">${product.name}</div>
            <div class="alert-stock">Stock: ${product.inventory.stock}</div>
            <button class="btn-restock" onclick="restockProduct('${product.productId}')">Restock</button>
        </div>
    `).join('');
}

// Fallback initialization
function initializeAdminFallback() {
    console.log('📋 Using fallback data for admin dashboard');
    // Your existing admin dashboard logic here
}

console.log('🚀 Admin API Service Loaded - Dashboard Backend Ready!');