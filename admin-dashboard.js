// ===== ENTERPRISE ADMIN DASHBOARD SYSTEM =====
class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.orders = [];
        this.products = [];
        this.customers = [];
        this.analytics = {};
        this.init();
    }

    init() {
        this.loadAllData();
        this.setupEventListeners();
        this.setupRealTimeUpdates();
        this.updateDashboard();
        console.log('🚀 Enterprise Admin Dashboard Ready');
    }

    // ===== DATA MANAGEMENT =====
    loadAllData() {
        this.loadOrders();
        this.loadProducts();
        this.loadCustomers();
        this.calculateAnalytics();
        this.generateNotifications();
    }

    loadOrders() {
        this.orders = JSON.parse(localStorage.getItem('swiftbuy_orders') || '[]');
        console.log('📦 Loaded orders:', this.orders.length);
    }

    loadProducts() {
        // Load from products.js data
        try {
            import('./products.js').then(module => {
                this.products = module.products;
                this.updateProductsSection();
            });
        } catch (error) {
            console.warn('Products module not available, using localStorage');
            this.products = JSON.parse(localStorage.getItem('swiftbuy_products') || '[]');
        }
    }

    loadCustomers() {
        // Extract customers from orders
        const customerMap = new Map();
        
        this.orders.forEach(order => {
            const email = order.shipping.email;
            if (!customerMap.has(email)) {
                customerMap.set(email, {
                    email: email,
                    name: `${order.shipping.firstName} ${order.shipping.lastName}`,
                    orders: 1,
                    totalSpent: order.order.total,
                    firstOrder: order.order.timestamp,
                    lastOrder: order.order.timestamp
                });
            } else {
                const customer = customerMap.get(email);
                customer.orders++;
                customer.totalSpent += order.order.total;
                customer.lastOrder = order.order.timestamp;
            }
        });

        this.customers = Array.from(customerMap.values());
    }

    // ===== ANALYTICS & REPORTING =====
    calculateAnalytics() {
        this.analytics = {
            totalRevenue: this.calculateTotalRevenue(),
            totalOrders: this.orders.length,
            totalCustomers: this.customers.length,
            averageOrderValue: this.calculateAOV(),
            conversionRate: this.calculateConversionRate(),
            revenueByPeriod: this.calculateRevenueByPeriod(),
            topProducts: this.getTopProducts(),
            lowStockItems: this.getLowStockItems()
        };

        this.updateStatsCards();
        this.updateCharts();
    }

    calculateTotalRevenue() {
        return this.orders.reduce((total, order) => total + order.order.total, 0);
    }

    calculateAOV() {
        return this.orders.length > 0 ? this.analytics.totalRevenue / this.orders.length : 0;
    }

    calculateConversionRate() {
        // Simplified conversion rate calculation
        const cartSessions = JSON.parse(localStorage.getItem('swiftbuy_cart_sessions') || '0');
        return this.orders.length > 0 ? (this.orders.length / Math.max(cartSessions, 1)) * 100 : 0;
    }

    calculateRevenueByPeriod() {
        const periods = {
            '7d': this.getRevenueForPeriod(7),
            '30d': this.getRevenueForPeriod(30),
            '90d': this.getRevenueForPeriod(90)
        };
        return periods;
    }

    getRevenueForPeriod(days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return this.orders
            .filter(order => new Date(order.order.timestamp) > cutoffDate)
            .reduce((total, order) => total + order.order.total, 0);
    }

    getTopProducts() {
        const productSales = {};
        
        this.orders.forEach(order => {
            order.order.items.forEach(item => {
                if (!productSales[item.id]) {
                    productSales[item.id] = {
                        product: item,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.id].quantity += item.quantity;
                productSales[item.id].revenue += (item.price_cents * item.quantity) / 100;
            });
        });

        return Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }

    getLowStockItems() {
        try {
            const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
            return Object.values(inventory).filter(item => 
                item.stock > 0 && item.stock <= item.lowStockThreshold
            );
        } catch (error) {
            return this.products.filter(product => 
                product.inventory.stock > 0 && product.inventory.stock <= product.inventory.lowStockThreshold
            );
        }
    }

    // ===== DASHBOARD UI UPDATES =====
    updateDashboard() {
        this.updateStatsCards();
        this.updateRecentOrders();
        this.updateStockAlerts();
        this.updateDateDisplay();
    }

    updateStatsCards() {
        this.updateElement('total-revenue', `$${this.analytics.totalRevenue.toFixed(2)}`);
        this.updateElement('total-orders', this.analytics.totalOrders.toString());
        this.updateElement('total-customers', this.analytics.totalCustomers.toString());
        this.updateElement('low-stock-items', this.analytics.lowStockItems.length.toString());
        this.updateElement('orders-count', this.analytics.totalOrders.toString());
    }

    updateRecentOrders() {
        const container = document.getElementById('recent-orders');
        if (!container) return;

        const recentOrders = this.orders
            .sort((a, b) => new Date(b.order.timestamp) - new Date(a.order.timestamp))
            .slice(0, 5);

        container.innerHTML = recentOrders.map(order => `
            <div class="activity-item">
                <div class="activity-info">
                    <strong>${order.shipping.firstName} ${order.shipping.lastName}</strong>
                    <span>Order #${order.order.orderId}</span>
                </div>
                <div class="activity-meta">
                    <span class="amount">$${order.order.total.toFixed(2)}</span>
                    <span class="time">${this.formatTimeAgo(order.order.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    updateStockAlerts() {
        const container = document.getElementById('stock-alerts');
        if (!container) return;

        const lowStockItems = this.analytics.lowStockItems.slice(0, 5);

        if (lowStockItems.length === 0) {
            container.innerHTML = `
                <div class="alert-item positive">
                    <i class="fas fa-check-circle"></i>
                    <span>All products are well stocked</span>
                </div>
            `;
            return;
        }

        container.innerHTML = lowStockItems.map(item => `
            <div class="alert-item warning">
                <i class="fas fa-exclamation-triangle"></i>
                <div class="alert-details">
                    <strong>${item.name || item.product?.name}</strong>
                    <span>Only ${item.stock} left in stock</span>
                </div>
                <button class="alert-action" data-product="${item.id || item.product?.id}">
                    Restock
                </button>
            </div>
        `).join('');

        // Add restock event listeners
        container.querySelectorAll('.alert-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.restockProduct(e.target.dataset.product);
            });
        });
    }

    updateProductsSection() {
        const container = document.getElementById('products-grid');
        if (!container) return;

        container.innerHTML = this.products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-status ${product.inventory.stock === 0 ? 'out-of-stock' : product.inventory.stock <= product.inventory.lowStockThreshold ? 'low-stock' : 'in-stock'}">
                        ${product.inventory.stock === 0 ? 'Out of Stock' : 
                          product.inventory.stock <= product.inventory.lowStockThreshold ? 'Low Stock' : 'In Stock'}
                    </div>
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-category">${product.category}</p>
                    <div class="product-meta">
                        <span class="product-price">$${product.price}</span>
                        <span class="product-stock">Stock: ${product.inventory.stock}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-sm btn-edit" data-id="${product.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-sm btn-delete" data-id="${product.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateOrdersTable() {
        const container = document.getElementById('orders-table');
        if (!container) return;

        const tbody = container.querySelector('tbody');
        tbody.innerHTML = this.orders.map(order => `
            <tr>
                <td>
                    <strong>${order.order.orderId}</strong>
                </td>
                <td>
                    <div class="customer-info">
                        <strong>${order.shipping.firstName} ${order.shipping.lastName}</strong>
                        <span>${order.shipping.email}</span>
                    </div>
                </td>
                <td>${this.formatDate(order.order.timestamp)}</td>
                <td>$${order.order.total.toFixed(2)}</td>
                <td>
                    <span class="status-badge ${order.tracking?.status || 'processing'}">
                        ${this.formatStatus(order.tracking?.status || 'processing')}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action view-order" data-id="${order.order.orderId}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action update-status" data-id="${order.order.orderId}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ===== CHARTS & VISUALIZATIONS =====
    updateCharts() {
        this.updateRevenueChart();
        this.updateCategoryChart();
    }

    updateRevenueChart() {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.revenueChart) {
            this.revenueChart.destroy();
        }

        const period = document.getElementById('revenue-period')?.value || '7d';
        const revenueData = this.generateRevenueData(period);

        this.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: revenueData.labels,
                datasets: [{
                    label: 'Revenue',
                    data: revenueData.values,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    updateCategoryChart() {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        const categoryData = this.generateCategoryData();

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.values,
                    backgroundColor: [
                        '#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    generateRevenueData(period) {
        // Simplified revenue data generation
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const labels = [];
        const values = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Simulate revenue data based on actual orders
            const dayRevenue = this.orders
                .filter(order => {
                    const orderDate = new Date(order.order.timestamp);
                    return orderDate.toDateString() === date.toDateString();
                })
                .reduce((total, order) => total + order.order.total, 0);

            values.push(dayRevenue);
        }

        return { labels, values };
    }

    generateCategoryData() {
        const categorySales = {};
        
        this.orders.forEach(order => {
            order.order.items.forEach(item => {
                // Extract category from product data
                const product = this.products.find(p => p.id === item.id);
                const category = product?.category || 'Unknown';
                
                if (!categorySales[category]) {
                    categorySales[category] = 0;
                }
                categorySales[category] += (item.price_cents * item.quantity) / 100;
            });
        });

        return {
            labels: Object.keys(categorySales),
            values: Object.values(categorySales)
        };
    }

    // ===== REAL-TIME UPDATES =====
    setupRealTimeUpdates() {
        // Listen for new orders
        window.addEventListener('cartUpdated', () => {
            setTimeout(() => {
                this.loadAllData();
                this.generateNotifications();
            }, 1000);
        });

        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.loadAllData();
        }, 30000);
    }

    generateNotifications() {
        const notifications = [];
        
        // Low stock notifications
        if (this.analytics.lowStockItems.length > 0) {
            notifications.push({
                type: 'warning',
                message: `${this.analytics.lowStockItems.length} products are low in stock`,
                time: new Date().toISOString(),
                action: 'inventory'
            });
        }

        // New orders notification
        if (this.orders.length > 0) {
            const recentOrders = this.orders.filter(order => 
                new Date(order.order.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            );
            
            if (recentOrders.length > 0) {
                notifications.push({
                    type: 'info',
                    message: `${recentOrders.length} new orders in last 24 hours`,
                    time: new Date().toISOString(),
                    action: 'orders'
                });
            }
        }

        this.updateNotificationsPanel(notifications);
    }

    updateNotificationsPanel(notifications) {
        const container = document.getElementById('notifications-list');
        const countElement = document.querySelector('.notification-count');
        
        if (countElement) {
            countElement.textContent = notifications.length.toString();
        }

        if (container) {
            container.innerHTML = notifications.map(notif => `
                <div class="notification-item ${notif.type}">
                    <div class="notification-icon">
                        <i class="fas fa-${notif.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                    </div>
                    <div class="notification-content">
                        <p>${notif.message}</p>
                        <span>${this.formatTimeAgo(notif.time)}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    // ===== EVENT HANDLERS =====
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(link.getAttribute('href').substring(1));
            });
        });

        // Sidebar toggle
        document.querySelector('.sidebar-toggle').addEventListener('click', () => {
            document.querySelector('.admin-sidebar').classList.toggle('collapsed');
        });

        // Notifications panel
        document.getElementById('notifications-btn').addEventListener('click', () => {
            document.getElementById('notifications-panel').classList.toggle('active');
        });

        document.getElementById('close-notifications').addEventListener('click', () => {
            document.getElementById('notifications-panel').classList.remove('active');
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadAllData();
            this.showToast('Data refreshed successfully');
        });

        // Revenue period selector
        document.getElementById('revenue-period')?.addEventListener('change', () => {
            this.updateRevenueChart();
        });

        // Export orders
        document.getElementById('export-orders')?.addEventListener('click', () => {
            this.exportOrdersToCSV();
        });
    }

    switchSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`).parentElement.classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        // Update page title
        document.getElementById('page-title').textContent = 
            sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

        // Load section-specific data
        this.currentSection = sectionId;
        
        switch(sectionId) {
            case 'orders':
                this.updateOrdersTable();
                break;
            case 'products':
                this.updateProductsSection();
                break;
            case 'inventory':
                // Will be handled by inventory-manager.js
                break;
        }
    }

    // ===== UTILITY METHODS =====
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) element.textContent = content;
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatStatus(status) {
        const statusMap = {
            'ordered': 'Order Placed',
            'confirmed': 'Confirmed',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'out-for-delivery': 'Out for Delivery',
            'delivered': 'Delivered'
        };
        return statusMap[status] || status;
    }

    updateDateDisplay() {
        const now = new Date();
        document.getElementById('current-date').textContent = 
            now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
    }

    showToast(message, type = 'success') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `admin-toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    restockProduct(productId) {
        // Implement restock logic
        this.showToast(`Restocking product ${productId}...`);
        console.log('Restocking product:', productId);
    }

    exportOrdersToCSV() {
        const headers = ['Order ID', 'Customer', 'Email', 'Date', 'Amount', 'Status'];
        const csvData = this.orders.map(order => [
            order.order.orderId,
            `${order.shipping.firstName} ${order.shipping.lastName}`,
            order.shipping.email,
            this.formatDate(order.order.timestamp),
            `$${order.order.total.toFixed(2)}`,
            this.formatStatus(order.tracking?.status || 'processing')
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        this.showToast('Orders exported successfully');
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminDashboard };
}