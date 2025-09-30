// ===== ENTERPRISE ADMIN DASHBOARD SYSTEM =====
class AdminDashboard {

    getRealTimeStockQuantities() {
    try {
        const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
        const stockMap = {};
        
        // Create a map of productId -> real-time stock
        Object.values(inventory).forEach(item => {
            const productId = item.id || item.productId;
            if (productId && item.stock !== undefined) {
                stockMap[productId] = item.stock;
            }
        });
        
        return stockMap;
    } catch (error) {
        console.error('Error getting real-time stock:', error);
        return {};
    }
}
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
        
        return this.products.filter(product => {
            const productInventory = inventory[product.id];
            const stock = productInventory ? productInventory.stock : product.inventory.stock;
            const threshold = productInventory ? productInventory.lowStockThreshold : product.inventory.lowStockThreshold;
            
            return stock > 0 && stock <= threshold;
        });
    } catch (error) {
        console.error('Error in getLowStockItems:', error);
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

    const lowStockItems = this.getLowStockItems().slice(0, 5);

    if (lowStockItems.length === 0) {
        container.innerHTML = `
            <div class="alert-item positive">
                <i class="fas fa-check-circle"></i>
                <div class="alert-details">
                    <strong>All products are well stocked</strong>
                    <span>No low stock alerts</span>
                </div>
            </div>
        `;
        return;
    }

    // Get real-time inventory data
    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');

    container.innerHTML = lowStockItems.map(product => {
        // Get real-time stock for this product
        const productInventory = inventory[product.id];
        const realTimeStock = productInventory ? productInventory.stock : product.inventory.stock;
        
        return `
        <div class="alert-item warning">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="alert-details">
                <strong>${product.name}</strong>
                <span>Only ${realTimeStock} left in stock</span>
            </div>
            <button class="alert-action" data-product="${product.id}">
                Restock
            </button>
        </div>
        `;
    }).join('');

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

        // Enhanced sidebar toggle
document.querySelector('.sidebar-toggle').addEventListener('click', () => {
    const sidebar = document.querySelector('.admin-sidebar');
    const isMobile = window.innerWidth <= 1200;
    
    if (isMobile) {
        sidebar.classList.toggle('active');
        // Create overlay if it doesn't exist
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
        overlay.classList.toggle('active');
    } else {
        // Desktop behavior
        sidebar.classList.toggle('collapsed');
    }
});
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(link.getAttribute('href').substring(1));
            });
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
        this.setupStatsCardInteractions()
    }

    // From here

    setupStatsCardInteractions() {
    // Add click handlers to stats cards
    document.addEventListener('click', (e) => {
        const statCard = e.target.closest('.stat-card');
        if (!statCard) return;
        
        if (statCard.classList.contains('revenue')) {
            this.switchSection('analytics');
            this.showToast('Opening revenue analytics...');
        } else if (statCard.classList.contains('orders')) {
            this.switchSection('orders');
            this.showToast('Navigating to orders...');
        } else if (statCard.classList.contains('customers')) {
            this.switchSection('customers');
            this.showToast('Opening customer management...');
        } else if (statCard.classList.contains('inventory')) {
            this.switchSection('inventory');
            this.showToast('Checking inventory alerts...');
        }
    });
    
    // Add hover effects
    document.querySelectorAll('.stat-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}
//To here

// ===== ENHANCED SECTION MANAGEMENT =====
switchSection(sectionId) {
    console.log('Switching to section:', sectionId);
    
    // Validate section exists
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) {
        console.warn(`Section '${sectionId}' not found in DOM`);
        this.showToast(`Section '${sectionId}' is not available yet`, 'error');
        
        // Fallback to dashboard if section doesn't exist
        if (sectionId !== 'dashboard') {
            this.switchSection('dashboard');
        }
        return;
    }

    // Update navigation with safe selection
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navLink = document.querySelector(`[href="#${sectionId}"]`);
    if (navLink && navLink.parentElement) {
        navLink.parentElement.classList.add('active');
    }

    // Update content sections safely
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    targetSection.classList.add('active');

    // Update page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = this.formatSectionTitle(sectionId);
    }

    // Close sidebar on mobile after navigation
    this.closeSidebarOnMobile();

    // Load section-specific data
    this.currentSection = sectionId;
    
    switch(sectionId) {
        case 'dashboard':
            this.updateDashboard();
            break;
        case 'orders':
            this.updateOrdersTable();
            break;
        case 'products':
            this.updateProductsSection();
            break;
        case 'inventory':
            this.updateInventorySection();
            break;
        case 'customers':
            this.updateCustomersSection();
            break;
        case 'analytics':
            this.updateAnalyticsSection();
            break;
        case 'settings':
            this.updateSettingsSection();
            break;
    }
}

// ===== SECTION-SPECIFIC METHODS =====
updateInventorySection() {
    const container = document.getElementById('inventory-table');
    if (!container) return;

    const tbody = container.querySelector('tbody');
    
    // Get real-time inventory data
    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
    
    tbody.innerHTML = this.products.map(product => {
        // Get real-time stock for this product
        const productInventory = inventory[product.id];
        const realTimeStock = productInventory ? productInventory.stock : product.inventory.stock;
        const lowStockThreshold = productInventory ? productInventory.lowStockThreshold : product.inventory.lowStockThreshold;
        
        const status = realTimeStock === 0 ? 'out-of-stock' : 
                      realTimeStock <= lowStockThreshold ? 'low-stock' : 'in-stock';
        const statusText = realTimeStock === 0 ? 'Out of Stock' : 
                          realTimeStock <= lowStockThreshold ? 'Low Stock' : 'In Stock';
        
        return `
        <tr>
            <td>
                <strong>${product.name}</strong>
            </td>
            <td>${product.id}</td>
            <td>${product.category}</td>
            <td>
                <span class="${realTimeStock <= lowStockThreshold ? 'text-warning' : 'text-success'}">
                    ${realTimeStock}
                </span>
            </td>
            <td>${lowStockThreshold}</td>
            <td>
                <span class="status-badge ${status}">
                    ${statusText}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action restock-item" data-id="${product.id}">
                        <i class="fas fa-boxes"></i>
                    </button>
                    <button class="btn-action edit-item" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

updateCustomersSection() {
    const container = document.getElementById('customers-table');
    if (!container) return;

    const tbody = container.querySelector('tbody');
    
    tbody.innerHTML = this.customers.map(customer => `
        <tr>
            <td>
                <strong>${customer.name}</strong>
            </td>
            <td>${customer.email}</td>
            <td>${customer.orders}</td>
            <td>$${customer.totalSpent.toFixed(2)}</td>
            <td>${this.formatDate(customer.firstOrder)}</td>
            <td>${this.formatDate(customer.lastOrder)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view-customer" data-email="${customer.email}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action contact-customer" data-email="${customer.email}">
                        <i class="fas fa-envelope"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

updateAnalyticsSection() {
    // Update metrics
    this.updateElement('conversion-rate', `${this.analytics.conversionRate.toFixed(1)}%`);
    this.updateElement('avg-order-value', `$${this.analytics.averageOrderValue.toFixed(2)}`);
    this.updateElement('customer-lifetime', `$${(this.analytics.averageOrderValue * 2.5).toFixed(2)}`);
    
    // Update analytics chart
    this.updateFunnelChart();
}

updateSettingsSection() {
    // Load current settings
    const settings = JSON.parse(localStorage.getItem('swiftbuy_admin_settings') || '{}');
    
    if (settings.storeName) {
        document.getElementById('store-name').value = settings.storeName;
    }
    if (settings.currency) {
        document.getElementById('store-currency').value = settings.currency;
    }
    if (settings.lowStockThreshold) {
        document.getElementById('low-stock-threshold').value = settings.lowStockThreshold;
    }
}

updateFunnelChart() {
    const ctx = document.getElementById('funnel-chart');
    if (!ctx) return;

    // Simple funnel chart implementation
    if (this.funnelChart) {
        this.funnelChart.destroy();
    }

    this.funnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Visitors', 'Add to Cart', 'Checkout', 'Purchases'],
            datasets: [{
                label: 'Conversion Funnel',
                data: [100, 30, 15, this.orders.length],
                backgroundColor: [
                    '#2563eb',
                    '#7c3aed',
                    '#10b981',
                    '#f59e0b'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// ===== ENHANCED SIDEBAR MANAGEMENT =====
closeSidebarOnMobile() {
    if (window.innerWidth <= 1200) {
        document.querySelector('.admin-sidebar').classList.remove('active');
        document.querySelector('.sidebar-overlay')?.classList.remove('active');
    }
}

formatSectionTitle(sectionId) {
    const titleMap = {
        'dashboard': 'Dashboard',
        'orders': 'Order Management',
        'products': 'Product Management',
        'inventory': 'Inventory Management',
        'customers': 'Customer Management',
        'analytics': 'Analytics & Reports',
        'settings': 'System Settings'
    };
    return titleMap[sectionId] || sectionId;
}
// Add missing section handlers
loadInventoryData() {
    // Initialize inventory manager if available
    if (window.inventoryManager) {
        window.inventoryManager.init();
    } else {
        this.showToast('Inventory manager loading...', 'info');
        // Fallback to basic inventory display
        this.updateStockAlerts();
    }
}

updateCustomersSection() {
    const container = document.getElementById('customers-section');
    if (!container) {
        console.warn('Customers section not found in DOM');
        return;
    }
    
    // Basic customers display fallback
    container.innerHTML = `
        <div class="section-header">
            <h2>Customer Management</h2>
            <div class="section-actions">
                <button class="btn-primary" id="export-customers">
                    <i class="fas fa-download"></i>
                    Export Customers
                </button>
            </div>
        </div>
        <div class="customers-container">
            <p>Customer management interface will be implemented here.</p>
            <p>Total Customers: <strong>${this.customers.length}</strong></p>
        </div>
    `;
}

updateAdvancedAnalytics() {
    const container = document.getElementById('analytics-section');
    if (!container) {
        console.warn('Analytics section not found in DOM');
        return;
    }
    
    container.innerHTML = `
        <div class="section-header">
            <h2>Advanced Analytics</h2>
        </div>
        <div class="analytics-container">
            <p>Advanced analytics dashboard will be implemented here.</p>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${this.analytics.totalRevenue.toFixed(2)}</h3>
                    <span>Total Revenue</span>
                </div>
                <div class="stat-card">
                    <h3>${this.analytics.averageOrderValue.toFixed(2)}</h3>
                    <span>Average Order Value</span>
                </div>
            </div>
        </div>
    `;
}

loadSettings() {
    const container = document.getElementById('settings-section');
    if (!container) {
        console.warn('Settings section not found in DOM');
        return;
    }
    
    container.innerHTML = `
        <div class="section-header">
            <h2>System Settings</h2>
        </div>
        <div class="settings-container">
            <p>System configuration interface will be implemented here.</p>
        </div>
    `;
}

formatSectionTitle(sectionId) {
    const titleMap = {
        'dashboard': 'Dashboard',
        'orders': 'Order Management',
        'products': 'Product Management',
        'inventory': 'Inventory Management',
        'customers': 'Customer Management',
        'analytics': 'Analytics & Reports',
        'settings': 'System Settings'
    };
    return titleMap[sectionId] || sectionId;
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