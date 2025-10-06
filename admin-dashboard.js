// ===== ENTERPRISE ADMIN DASHBOARD SYSTEM =====


class AdminDashboard {
    

    // Add these image optimization methods to your AdminDashboard class

optimizeBase64Image(base64String, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to optimized base64
            const optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(optimizedBase64);
        };
        img.src = base64String;
    });
}

compressImage(file, maxSizeKB = 500) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            let base64 = e.target.result;
            
            // If image is already small, use as-is
            const sizeKB = (base64.length * 0.75) / 1024; // Approximate base64 size
            if (sizeKB <= maxSizeKB) {
                resolve(base64);
                return;
            }

            // Calculate target quality based on current size
            let quality = Math.max(0.1, maxSizeKB / sizeKB * 0.8);
            quality = Math.min(quality, 0.9); // Cap at 90% quality

            try {
                const optimized = await this.optimizeBase64Image(base64, 800, quality);
                resolve(optimized);
            } catch (error) {
                console.warn('Image optimization failed, using original:', error);
                resolve(base64);
            }
        };
        reader.readAsDataURL(file);
    });
}

    // Add this method to clear storage
clearAllData() {
    if (confirm('⚠️ WARNING: This will delete ALL store data including orders, products, and customers. This cannot be undone! Proceed?')) {
        try {
            const keysToRemove = [
                'swiftbuy_products',
                'swiftbuy_orders', 
                'swiftbuy_inventory_v1',
                'swiftbuy_cart_sessions',
                'swiftbuy_admin_settings'
            ];
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log('🗑️ Removed:', key);
            });
            
            this.showToast('All data cleared successfully! Refreshing page...');
            
            // Reload to reset everything
            setTimeout(() => {
                location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showToast('Error clearing data', 'error');
        }
    }
}


// Add this method to analyze storage usage
analyzeStorage() {
    console.log('🔍 STORAGE ANALYSIS:');
    let totalSize = 0;
    
    const keys = [
        'swiftbuy_products',
        'swiftbuy_orders', 
        'swiftbuy_inventory_v1',
        'swiftbuy_cart_sessions',
        'swiftbuy_admin_settings'
    ];
    
    keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            const size = (data.length * 2) / 1024 / 1024; // Size in MB
            totalSize += size;
            console.log(`📦 ${key}: ${size.toFixed(2)} MB`);
            
            // Show item count for products and orders
            if (key === 'swiftbuy_products') {
                const products = JSON.parse(data);
                console.log(`   Items: ${products.length} products`);
            }
            if (key === 'swiftbuy_orders') {
                const orders = JSON.parse(data);
                console.log(`   Items: ${orders.length} orders`);
            }
        }
    });
    
    console.log(`💾 TOTAL USAGE: ${totalSize.toFixed(2)} MB`);
    return totalSize;
}
// Add these methods to your AdminDashboard class

checkStorageAvailable() {
    try {
        const testKey = 'storage_test';
        const testData = 'test';
        localStorage.setItem(testKey, testData);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        console.error('Storage not available:', e);
        return false;
    }
}

clearOldData() {
    try {
        // Keep only recent orders (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        this.orders = this.orders.filter(order => 
            new Date(order.order.timestamp) > thirtyDaysAgo
        );
        localStorage.setItem('swiftbuy_orders', JSON.stringify(this.orders));
        
        // Clear cart sessions
        localStorage.removeItem('swiftbuy_cart_sessions');
        
        this.showToast('Old data cleared successfully!');
        return true;
    } catch (error) {
        console.error('Error clearing old data:', error);
        this.showToast('Error clearing data', 'error');
        return false;
    }
}

getStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length;
        }
    }
    return (total / 1024 / 1024).toFixed(2); // Return in MB
}
    
// to here

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
    this.setupAddProductModal(); // ADD THIS LINE
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
    
    // Initialize tracking for orders that don't have it
    this.orders.forEach(order => {
        if (!order.tracking) {
            order.tracking = {
                status: 'ordered',
                lastUpdated: new Date().toISOString(),
                history: [
                    {
                        status: 'ordered',
                        timestamp: order.order.timestamp || new Date().toISOString(),
                        note: 'Order placed',
                        updatedBy: 'System'
                    }
                ]
            };
        }
    });
    
    console.log('📦 Loaded orders:', this.orders.length);
}

loadProducts() {
    // Load from products.js data
    try {
        // First try to load from localStorage (admin modifications)
        const savedProducts = JSON.parse(localStorage.getItem('swiftbuy_products'));
        
        if (savedProducts && savedProducts.length > 0) {
            this.products = savedProducts;
            this.updateProductsSection();
        } else {
            // Fallback to imported products
            import('./products.js').then(module => {
                this.products = module.products;
                this.updateProductsSection();
                // Save imported products to localStorage for future use
                localStorage.setItem('swiftbuy_products', JSON.stringify(module.products));
            }).catch(error => {
                console.warn('Failed to import products.js, using localStorage:', error);
                // Final fallback to localStorage if import fails
                const fallbackProducts = JSON.parse(localStorage.getItem('swiftbuy_products') || '[]');
                this.products = fallbackProducts;
                this.updateProductsSection();
            });
        }
    } catch (error) {
        console.warn('Error loading products, using empty array:', error);
        this.products = [];
        this.updateProductsSection();
    }
}


addProduct(productData) {
    try {
        // Generate a unique ID if not provided
        if (!productData.id) {
            const maxId = this.products.reduce((max, product) => {
                const idNum = parseInt(product.id) || 0;
                return idNum > max ? idNum : max;
            }, 0);
            productData.id = (maxId + 1).toString();
        }

        // Add default properties if missing
        const newProduct = {
            id: productData.id,
            name: productData.name || 'New Product',
            price: parseFloat(productData.price) || 0,
            category: productData.category || 'Uncategorized',
            image: productData.image || 'https://via.placeholder.com/300x200?text=No+Image',
            description: productData.description || '',
            inventory: {
                stock: parseInt(productData.inventory?.stock) || 0,
                lowStockThreshold: parseInt(productData.inventory?.lowStockThreshold) || 5
            },
            rating: {
                average: 0,
                count: 0
            },
            featured: productData.featured || false,
            onSale: productData.onSale || false,
            createdAt: new Date().toISOString(),
            ...productData // Spread any additional properties
        };

        // Add to products array
        this.products.push(newProduct);
        
        // Update inventory in localStorage
        const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
        inventory[newProduct.id] = {
            stock: newProduct.inventory.stock,
            lowStockThreshold: newProduct.inventory.lowStockThreshold,
            reserved: 0
        };
        localStorage.setItem('swiftbuy_inventory_v1', JSON.stringify(inventory));
        
        // Save products to localStorage
        this.saveProducts();
        
        // Update UI
        this.updateProductsSection();
        
        this.showToast(`Product "${newProduct.name}" added successfully!`);
        console.log('✅ New product added:', newProduct);
        
        return newProduct;
    } catch (error) {
        console.error('❌ Error adding product:', error);
        this.showToast('Error adding product', 'error');
        return null;
    }
}

// Add this function to save products when they are modified
saveProducts() {
    try {
        localStorage.setItem('swiftbuy_products', JSON.stringify(this.products));
        console.log('✅ Products saved to localStorage:', this.products.length);
        return true;
    } catch (error) {
        console.error('❌ Failed to save products:', error);
        this.showToast('Error saving products', 'error');
        return false;
    }
}

loadCustomers() {
    // Extract customers from orders with enhanced data
    const customerMap = new Map();
    
    this.orders.forEach(order => {
        const email = order.shipping.email;
        if (!customerMap.has(email)) {
            customerMap.set(email, {
                email: email,
                name: `${order.shipping.firstName} ${order.shipping.lastName}`,
                phone: order.shipping.phone,
                address: `${order.shipping.address}, ${order.shipping.city}`,
                orders: 1,
                totalSpent: order.order.total,
                firstOrder: order.order.timestamp,
                lastOrder: order.order.timestamp,
                // Additional pro fields
                lifetimeValue: order.order.total,
                averageOrderValue: order.order.total,
                lastActive: order.order.timestamp
            });
        } else {
            const customer = customerMap.get(email);
            customer.orders++;
            customer.totalSpent += order.order.total;
            customer.lifetimeValue = customer.totalSpent;
            customer.averageOrderValue = customer.totalSpent / customer.orders;
            customer.lastOrder = order.order.timestamp;
            customer.lastActive = order.order.timestamp;
        }
    });

    this.customers = Array.from(customerMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent); // Sort by highest spenders first
    
    console.log('👥 Loaded customers:', this.customers.length);
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
    this.updateProductStats();
    this.renderProductsGridView();
    this.setupProductEventListeners();
    this.loadProductSalesData();
}

updateProductStats() {
    const totalProducts = this.products.length;
    const lowStockProducts = this.getLowStockItems().length;
    const outOfStockProducts = this.products.filter(p => p.inventory.stock === 0).length;
    const topRatedProducts = this.products.filter(p => p.rating?.average >= 4.5).length;

    this.updateElement('total-products', totalProducts);
    this.updateElement('low-stock-products', lowStockProducts);
    this.updateElement('out-of-stock-products', outOfStockProducts);
    this.updateElement('top-rated-products', topRatedProducts);
}

renderProductsGridView(productsToShow = this.products) {
    const container = document.getElementById('products-grid');
    if (!container) return;

    // Get real-time inventory data
    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');

    container.innerHTML = productsToShow.map(product => {
        const productInventory = inventory[product.id];
        const realTimeStock = productInventory ? productInventory.stock : product.inventory.stock;
        const lowStockThreshold = productInventory ? productInventory.lowStockThreshold : product.inventory.lowStockThreshold;
        
        const status = realTimeStock === 0 ? 'out-of-stock' : 
                      realTimeStock <= lowStockThreshold ? 'low-stock' : 'in-stock';
        const statusText = realTimeStock === 0 ? 'Out of Stock' : 
                          realTimeStock <= lowStockThreshold ? 'Low Stock' : 'In Stock';

        const stockPercentage = Math.min((realTimeStock / 20) * 100, 100); // Assuming max stock of 20 for visual
        const salesCount = this.getProductSalesCount(product.id);
        const revenue = this.getProductRevenue(product.id);

        return `
        <div class="product-card" data-id="${product.id}">
            <input type="checkbox" class="product-checkbox" data-id="${product.id}">
            
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="product-badges">
                    ${product.featured ? '<span class="product-badge badge-featured">Featured</span>' : ''}
                    ${product.onSale ? '<span class="product-badge badge-sale">Sale</span>' : ''}
                    ${this.isNewProduct(product) ? '<span class="product-badge badge-new">New</span>' : ''}
                </div>
                <div class="product-status ${status}">${statusText}</div>
            </div>
            
            <div class="product-info">
                <div class="product-header">
                    <h4 class="product-name">${product.name}</h4>
                    <span class="product-price">$${product.price}</span>
                </div>
                
                <p class="product-category">${product.category}</p>
                
                <div class="product-meta">
                    <div class="meta-item">
                        <span class="meta-label">Stock</span>
                        <span class="meta-value ${realTimeStock <= lowStockThreshold ? 'text-warning' : 'text-success'}">
                            ${realTimeStock}
                        </span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Sales</span>
                        <span class="meta-value">${salesCount}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Revenue</span>
                        <span class="meta-value">$${revenue}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Threshold</span>
                        <span class="meta-value">${lowStockThreshold}</span>
                    </div>
                </div>
                
                <div class="product-rating">
                    <div class="rating-stars">
                        ${this.renderStarRating(product.rating?.average || 0)}
                    </div>
                    <span class="rating-value">${(product.rating?.average || 0).toFixed(1)}</span>
                    <span class="rating-count">(${product.rating?.count || 0})</span>
                </div>
                
                <div class="product-actions">
                    <button class="btn-sm btn-quick-edit" data-id="${product.id}" title="Quick Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-view" data-id="${product.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-sm btn-duplicate" data-id="${product.id}" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-sm btn-delete" data-id="${product.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

renderProductsTableView(productsToShow = this.products) {
    const container = document.getElementById('products-table');
    if (!container) return;

    const tbody = container.querySelector('tbody');
    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');

    tbody.innerHTML = productsToShow.map(product => {
        const productInventory = inventory[product.id];
        const realTimeStock = productInventory ? productInventory.stock : product.inventory.stock;
        const lowStockThreshold = productInventory ? productInventory.lowStockThreshold : product.inventory.lowStockThreshold;
        
        const status = realTimeStock === 0 ? 'out-of-stock' : 
                      realTimeStock <= lowStockThreshold ? 'low-stock' : 'in-stock';
        
        const stockPercentage = Math.min((realTimeStock / 20) * 100, 100);
        const stockBarClass = realTimeStock === 0 ? 'critical' : realTimeStock <= lowStockThreshold ? 'low' : '';
        const salesCount = this.getProductSalesCount(product.id);
        const salesTrend = this.getSalesTrend(product.id);

        return `
        <tr>
            <td>
                <input type="checkbox" class="product-checkbox" data-id="${product.id}">
            </td>
            <td>
                <div class="product-info-cell">
                    <img src="${product.image}" alt="${product.name}" class="table-product-image" 
                         onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
                    <div class="table-product-details">
                        <span class="table-product-name">${product.name}</span>
                        <span class="table-product-category">${product.category}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="text-capitalize">${product.category}</span>
            </td>
            <td>
                <strong>$${product.price}</strong>
            </td>
            <td>
                <div class="stock-indicator">
                    <span>${realTimeStock}</span>
                    <div class="stock-bar">
                        <div class="stock-fill ${stockBarClass}" style="width: ${stockPercentage}%"></div>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge ${status}">
                    ${status === 'out-of-stock' ? 'Out of Stock' : 
                      status === 'low-stock' ? 'Low Stock' : 'In Stock'}
                </span>
            </td>
            <td>
                <div class="rating-display">
                    <span class="rating-stars">
                        ${this.renderStarRating(product.rating?.average || 0)}
                    </span>
                    <span>${(product.rating?.average || 0).toFixed(1)}</span>
                </div>
            </td>
            <td>
                <div class="sales-trend ${salesTrend > 0 ? 'trend-up' : salesTrend < 0 ? 'trend-down' : ''}">
                    <i class="fas fa-${salesTrend > 0 ? 'arrow-up' : salesTrend < 0 ? 'arrow-down' : 'minus'}"></i>
                    <span>${salesCount} sales</span>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-quick-edit" data-id="${product.id}" title="Quick Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-view" data-id="${product.id}" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-delete" data-id="${product.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

setupProductEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            this.filterProducts();
        });
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            this.filterProducts();
        });
    }

    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            this.filterProducts();
        });
    }

    // Sort functionality
    const sortSelect = document.getElementById('product-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            this.sortProducts(e.target.value);
        });
    }

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.closest('.view-btn').dataset.view;
            this.switchProductView(view);
        });
    });

    // Bulk actions
    this.setupBulkActions();
    
    // Product action buttons
    this.setupProductActions();
    
 // Add product button
const addProductBtn = document.getElementById('add-product');
if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
        this.openAddProductModal();
    });
}

    // Quick edit modal
    this.setupQuickEditModal();
}

filterProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const statusFilter = document.getElementById('status-filter').value;

    const filteredProducts = this.products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.category.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        
        // Get real-time stock for status filtering
        const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
        const productInventory = inventory[product.id];
        const realTimeStock = productInventory ? productInventory.stock : product.inventory.stock;
        const lowStockThreshold = productInventory ? productInventory.lowStockThreshold : product.inventory.lowStockThreshold;
        
        let matchesStatus = true;
        if (statusFilter === 'in-stock') {
            matchesStatus = realTimeStock > lowStockThreshold;
        } else if (statusFilter === 'low-stock') {
            matchesStatus = realTimeStock > 0 && realTimeStock <= lowStockThreshold;
        } else if (statusFilter === 'out-of-stock') {
            matchesStatus = realTimeStock === 0;
        }

        return matchesSearch && matchesCategory && matchesStatus;
    });

    const currentView = document.querySelector('.view-btn.active').dataset.view;
    if (currentView === 'grid') {
        this.renderProductsGridView(filteredProducts);
    } else {
        this.renderProductsTableView(filteredProducts);
    }
}

sortProducts(sortBy) {
    const sortedProducts = [...this.products];

    switch(sortBy) {
        case 'name':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price':
            sortedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            break;
        case 'stock':
            sortedProducts.sort((a, b) => {
                const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
                const stockA = inventory[a.id] ? inventory[a.id].stock : a.inventory.stock;
                const stockB = inventory[b.id] ? inventory[b.id].stock : b.inventory.stock;
                return stockA - stockB;
            });
            break;
        case 'category':
            sortedProducts.sort((a, b) => a.category.localeCompare(b.category));
            break;
        case 'rating':
            sortedProducts.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
            break;
    }

    const currentView = document.querySelector('.view-btn.active').dataset.view;
    if (currentView === 'grid') {
        this.renderProductsGridView(sortedProducts);
    } else {
        this.renderProductsTableView(sortedProducts);
    }
}

switchProductView(view) {
    // Update active view button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // Show/hide views
    document.getElementById('products-grid-view').style.display = view === 'grid' ? 'block' : 'none';
    document.getElementById('products-table-view').style.display = view === 'table' ? 'block' : 'none';

    // Render appropriate view
    if (view === 'grid') {
        this.renderProductsGridView();
    } else {
        this.renderProductsTableView();
    }
}

setupBulkActions() {
    const selectAll = document.getElementById('select-all-products');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.product-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
            this.toggleBulkActionsBar();
        });
    }

    // Individual checkbox changes
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('product-checkbox')) {
            this.toggleBulkActionsBar();
        }
    });

    // Bulk action apply - FIX THIS PART
    const applyBulk = document.getElementById('apply-bulk-action');
    if (applyBulk) {
        applyBulk.addEventListener('click', () => {
            const action = document.getElementById('bulk-action').value;
            if (!action) {
                this.showToast('Please select a bulk action from the dropdown', 'error');
                return;
            }
            this.applyBulkAction();
        });
    }

    // Cancel bulk
    const cancelBulk = document.getElementById('cancel-bulk');
    if (cancelBulk) {
        cancelBulk.addEventListener('click', () => {
            this.cancelBulkSelection();
        });
    }
}

toggleBulkActionsBar() {
    const selectedCount = document.querySelectorAll('.product-checkbox:checked').length;
    const bulkActionsBar = document.getElementById('bulk-actions');
    
    if (selectedCount > 0) {
        bulkActionsBar.style.display = 'flex';
        document.getElementById('selected-count').textContent = selectedCount;
    } else {
        bulkActionsBar.style.display = 'none';
    }
}

applyBulkAction() {
    const action = document.getElementById('bulk-action').value;
    const selectedProducts = Array.from(document.querySelectorAll('.product-checkbox:checked'))
        .map(checkbox => checkbox.dataset.id);

    if (!action) {
        this.showToast('Please select a bulk action', 'error');
        return;
    }

    switch(action) {
        case 'update-stock':
            this.bulkUpdateStock(selectedProducts);
            break;
        case 'update-price':
            this.bulkUpdatePrice(selectedProducts);
            break;
        case 'update-category':
            this.bulkUpdateCategory(selectedProducts);
            break;
        case 'archive':
            this.bulkArchiveProducts(selectedProducts);
            break;
        case 'delete':
            this.bulkDeleteProducts(selectedProducts);
            break;
    }

    this.cancelBulkSelection();
}

cancelBulkSelection() {
    document.querySelectorAll('.product-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('select-all-products').checked = false;
    document.getElementById('bulk-actions').style.display = 'none';
    document.getElementById('bulk-action').value = '';
}

setupProductActions() {
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const productId = target.dataset.id;
        if (!productId) return;

        if (target.classList.contains('btn-quick-edit')) {
            this.openQuickEditModal(productId);
        } else if (target.classList.contains('btn-view')) {
            this.viewProductDetails(productId);
        } else if (target.classList.contains('btn-duplicate')) {
            this.duplicateProduct(productId);
        } else if (target.classList.contains('btn-delete')) {
            this.deleteProduct(productId);
        }
    });
}

setupQuickEditModal() {
    const modal = document.getElementById('quick-edit-modal');
    const closeBtn = document.getElementById('close-quick-edit');
    const cancelBtn = document.getElementById('cancel-quick-edit');
    const saveBtn = document.getElementById('save-quick-edit');

    const closeModal = () => {
        modal.classList.remove('active');
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    
    saveBtn?.addEventListener('click', () => {
        this.saveQuickEdit();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

openQuickEditModal(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
    const productInventory = inventory[productId];

    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-price').value = product.price;
    document.getElementById('edit-product-stock').value = productInventory ? productInventory.stock : product.inventory.stock;
    document.getElementById('edit-product-category').value = product.category;
    document.getElementById('edit-product-threshold').value = productInventory ? productInventory.lowStockThreshold : product.inventory.lowStockThreshold;

    document.getElementById('quick-edit-modal').classList.add('active');
    document.getElementById('quick-edit-form').dataset.productId = productId;
}

saveQuickEdit() {
    const form = document.getElementById('quick-edit-form');
    const productId = form.dataset.productId;
    
    const updates = {
        name: document.getElementById('edit-product-name').value,
        price: parseFloat(document.getElementById('edit-product-price').value),
        stock: parseInt(document.getElementById('edit-product-stock').value),
        category: document.getElementById('edit-product-category').value,
        lowStockThreshold: parseInt(document.getElementById('edit-product-threshold').value)
    };

    console.log('🔄 QUICK EDIT DEBUG:', { productId, updates });

    // Update product data
    const productIndex = this.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        console.log('📦 BEFORE UPDATE:', this.products[productIndex]);
        
        this.products[productIndex].name = updates.name;
        this.products[productIndex].price = updates.price;
        this.products[productIndex].category = updates.category;
        this.products[productIndex].inventory.stock = updates.stock;
        this.products[productIndex].inventory.lowStockThreshold = updates.lowStockThreshold;
        
        console.log('📦 AFTER UPDATE:', this.products[productIndex]);
    } else {
        console.error('❌ Product not found:', productId);
        this.showToast('Product not found!', 'error');
        return;
    }

    // Update inventory data
    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
    if (inventory[productId]) {
        inventory[productId].stock = updates.stock;
        inventory[productId].lowStockThreshold = updates.lowStockThreshold;
        localStorage.setItem('swiftbuy_inventory_v1', JSON.stringify(inventory));
        console.log('📊 Inventory updated:', inventory[productId]);
    }

    // SAVE PRODUCTS TO LOCALSTORAGE - THIS IS PROBABLY MISSING!
    this.saveProducts();
    
    console.log('💾 Products saved to localStorage');

    this.showToast('Product updated successfully!');
    document.getElementById('quick-edit-modal').classList.remove('active');
    
    // Refresh views
    this.updateProductsSection();
    
    // VERIFY THE SAVE WORKED
    setTimeout(() => {
        const savedProducts = JSON.parse(localStorage.getItem('swiftbuy_products') || '[]');
        const savedProduct = savedProducts.find(p => p.id === productId);
        console.log('✅ VERIFICATION - Saved product:', savedProduct);
    }, 500);
}

// Utility Methods
renderStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}

getProductSalesCount(productId) {
    let count = 0;
    this.orders.forEach(order => {
        order.order.items.forEach(item => {
            if (item.id === productId) {
                count += item.quantity;
            }
        });
    });
    return count;
}

getProductRevenue(productId) {
    let revenue = 0;
    this.orders.forEach(order => {
        order.order.items.forEach(item => {
            if (item.id === productId) {
                revenue += (item.price_cents * item.quantity) / 100;
            }
        });
    });
    return revenue.toFixed(2);
}

getSalesTrend(productId) {
    // Simplified sales trend calculation
    const salesCount = this.getProductSalesCount(productId);
    return salesCount > 10 ? 1 : salesCount > 5 ? 0 : -1;
}

isNewProduct(product) {
    // Consider products added in the last 7 days as new
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(product.createdAt || '2024-01-01') > oneWeekAgo;
}

loadProductSalesData() {
    // This would typically load additional sales analytics
    console.log('📊 Loading product sales data...');
}

// Bulk action implementations (simplified for now)
bulkUpdateStock(productIds) {
    this.showToast(`Updating stock for ${productIds.length} products...`);
    console.log('Bulk update stock:', productIds);
}

bulkUpdatePrice(productIds) {
    this.showToast(`Updating prices for ${productIds.length} products...`);
    console.log('Bulk update price:', productIds);
}

bulkUpdateCategory(productIds) {
    this.showToast(`Updating categories for ${productIds.length} products...`);
    console.log('Bulk update category:', productIds);
}

bulkArchiveProducts(productIds) {
    this.showToast(`Archiving ${productIds.length} products...`);
    console.log('Bulk archive:', productIds);
}

bulkDeleteProducts(productIds) {
    if (confirm(`Are you sure you want to delete ${productIds.length} products? This action cannot be undone.`)) {
        this.showToast(`Deleting ${productIds.length} products...`);
        console.log('Bulk delete:', productIds);
    }
}

viewProductDetails(productId) {
    const product = this.products.find(p => p.id === productId);
    this.showToast(`Viewing ${product.name} details...`);
    // Advanced: Open product detail modal
}

duplicateProduct(productId) {
    const originalProduct = this.products.find(p => p.id === productId);
    if (!originalProduct) {
        this.showToast('Product not found!', 'error');
        return;
    }

    // Create duplicate with new ID
    const duplicate = JSON.parse(JSON.stringify(originalProduct));
    duplicate.id = `COPY-${Date.now()}`;
    duplicate.name = `${originalProduct.name} (Copy)`;
    duplicate.createdAt = new Date().toISOString();
    duplicate.rating = { average: 0, count: 0 };
    
    // Add to products array
    this.products.push(duplicate);
    
    // Update inventory
    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
    inventory[duplicate.id] = {
        stock: duplicate.inventory.stock,
        lowStockThreshold: duplicate.inventory.lowStockThreshold,
        reserved: 0
    };
    localStorage.setItem('swiftbuy_inventory_v1', JSON.stringify(inventory));
    
    // Save products
    this.saveProducts();
    
    // Update UI
    this.updateProductsSection();
    
    this.showToast(`Product "${originalProduct.name}" duplicated successfully!`);
    console.log('✅ Product duplicated:', duplicate);
}

deleteProduct(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
        this.showToast('Product not found!', 'error');
        return false;
    }
    
    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
        try {
            // Remove from products array
            this.products = this.products.filter(p => p.id !== productId);
            
            // Remove from inventory
            const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
            delete inventory[productId];
            localStorage.setItem('swiftbuy_inventory_v1', JSON.stringify(inventory));
            
            // Save updated products
            this.saveProducts();
            
            // Update UI
            this.updateProductsSection();
            
            this.showToast(`Product "${product.name}" deleted successfully`);
            console.log('✅ Product deleted:', productId);
            return true;
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            this.showToast('Error deleting product', 'error');
            return false;
        }
    }
    return false;
}

openAddProductModal() {
    this.showToast('Opening product creation form...');
    // Advanced: Open add product modal
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

        // View All links in dashboard
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('view-all')) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        if (href) {
            const sectionId = href.substring(1); // Remove the #
            this.switchSection(sectionId);
        }
    }
});

        this.setupAddProductModal();



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

           // ORDER ACTION BUTTONS - Add this exact code
// ORDER ACTION BUTTONS - Updated version
document.addEventListener('click', (e) => {
    // Check if click is on view-order button or its child icon
    if (e.target.closest('.view-order')) {
        const button = e.target.closest('.view-order');
        const orderId = button.dataset.id;
        console.log('View order clicked:', orderId);
        this.viewOrderDetails(orderId);
    }
    
    // Check if click is on update-status button or its child icon
    if (e.target.closest('.update-status')) {
        const button = e.target.closest('.update-status');
        const orderId = button.dataset.id;
        console.log('Update status clicked:', orderId);
        
        // Find the order and show modal
        const order = this.orders.find(o => o.order.orderId === orderId);
        if (order) {
            this.showOrderStatusModal(order);
        } else {
            this.showToast('Order not found!', 'error');
        }
    }
});
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

    // Clean up previous section
    if (this.currentSection === 'analytics') {
        this.cleanupAnalytics();
    }
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
    this.updateCustomerStats();
    this.renderCustomersTable();
    this.setupCustomerEventListeners();
}

updateCustomerStats() {
    const totalCustomers = this.customers.length;
    const vipCustomers = this.customers.filter(c => c.totalSpent > 500).length;
    const avgOrders = totalCustomers > 0 ? 
        (this.customers.reduce((sum, c) => sum + c.orders, 0) / totalCustomers).toFixed(1) : 0;
    const avgSpent = totalCustomers > 0 ? 
        (this.customers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers).toFixed(2) : 0;

    this.updateElement('total-customers-count', totalCustomers);
    this.updateElement('vip-customers-count', vipCustomers);
    this.updateElement('avg-orders-count', avgOrders);
    this.updateElement('avg-spent', `$${avgSpent}`);
}

renderCustomersTable(customersToShow = this.customers) {
    const container = document.getElementById('customers-table');
    if (!container) return;

    const tbody = container.querySelector('tbody');
    
    tbody.innerHTML = customersToShow.map(customer => {
        const tier = customer.totalSpent > 500 ? 'vip' : customer.totalSpent > 200 ? 'premium' : 'standard';
        const tierText = customer.totalSpent > 500 ? 'VIP' : customer.totalSpent > 200 ? 'Premium' : 'Standard';
        const initials = customer.name.split(' ').map(n => n[0]).join('').toUpperCase();
        const lastActive = new Date(customer.lastOrder) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'active' : 'inactive';
        
        return `
        <tr>
            <td>
                <input type="checkbox" class="customer-checkbox" data-email="${customer.email}">
            </td>
            <td>
                <div class="customer-info">
                    <div class="customer-avatar">${initials}</div>
                    <div class="customer-details">
                        <span class="customer-name">${customer.name}</span>
                        <span class="customer-tier tier-${tier}">${tierText}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="customer-details">
                    <span class="customer-email">${customer.email}</span>
                    <span class="customer-phone">${customer.phone || 'No phone'}</span>
                </div>
            </td>
            <td>
                <strong>${customer.orders}</strong>
                <div class="text-muted">orders</div>
            </td>
            <td>
                <strong>$${customer.totalSpent.toFixed(2)}</strong>
                <div class="text-muted">total</div>
            </td>
            <td>
                <span class="status-${lastActive}">
                    <i class="fas fa-circle"></i>
                    ${lastActive === 'active' ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${this.formatTimeAgo(customer.lastOrder)}</td>
            <td>
                <div class="customer-actions">
                    <button class="btn-customer-action btn-view" data-email="${customer.email}" title="View Profile">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-customer-action btn-email" data-email="${customer.email}" title="Send Email">
                        <i class="fas fa-envelope"></i>
                    </button>
                    <button class="btn-customer-action btn-edit" data-email="${customer.email}" title="Edit Customer">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

setupCustomerEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('customer-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredCustomers = this.customers.filter(customer => 
                customer.name.toLowerCase().includes(searchTerm) ||
                customer.email.toLowerCase().includes(searchTerm)
            );
            this.renderCustomersTable(filteredCustomers);
        });
    }

    // Select all checkbox
    const selectAll = document.getElementById('select-all-customers');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.customer-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });
    }

    // Customer action buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-view')) {
            const email = e.target.closest('.btn-view').dataset.email;
            this.viewCustomerProfile(email);
        } else if (e.target.closest('.btn-email')) {
            const email = e.target.closest('.btn-email').dataset.email;
            this.sendCustomerEmail(email);
        } else if (e.target.closest('.btn-edit')) {
            const email = e.target.closest('.btn-edit').dataset.email;
            this.editCustomer(email);
        }
    });

    // Export functionality
    const exportBtn = document.getElementById('export-customers');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            this.exportCustomersToCSV();
        });
    }
}

viewCustomerProfile(email) {
    const customer = this.customers.find(c => c.email === email);
    if (customer) {
        this.showToast(`Opening ${customer.name}'s profile...`);
        // Advanced: Open customer detail modal
        console.log('View customer profile:', customer);
    }
}

sendCustomerEmail(email) {
    const customer = this.customers.find(c => c.email === email);
    if (customer) {
        this.showToast(`Preparing email to ${customer.name}...`);
        // Advanced: Open email composer
        console.log('Send email to:', customer);
    }
}

editCustomer(email) {
    const customer = this.customers.find(c => c.email === email);
    if (customer) {
        this.showToast(`Editing ${customer.name}...`);
        // Advanced: Open customer editor
        console.log('Edit customer:', customer);
    }
}

exportCustomersToCSV() {
    const headers = ['Name', 'Email', 'Orders', 'Total Spent', 'First Order', 'Last Order', 'Tier'];
    const csvData = this.customers.map(customer => [
        customer.name,
        customer.email,
        customer.orders,
        `$${customer.totalSpent.toFixed(2)}`,
        this.formatDate(customer.firstOrder),
        this.formatDate(customer.lastOrder),
        customer.totalSpent > 500 ? 'VIP' : customer.totalSpent > 200 ? 'Premium' : 'Standard'
    ]);

    const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    this.showToast('Customers exported successfully!');
}

updateAnalyticsSection() {
    this.currentDateRange = '30d'; // Default date range
    this.initializeAnalyticsDashboard();
    this.setupAnalyticsEventListeners();
}

initializeAnalyticsDashboard() {
    this.updateKPIMetrics();
    this.renderRevenueAnalyticsChart();
    this.renderCategoryChart();
    this.renderTrafficChart();
    this.updateFunnelData();
    this.updateTopProducts();
    this.updateAdvancedMetrics();
    this.startRealTimeActivity();
    this.updateRealTimeActivities();
}

setupAnalyticsEventListeners() {
    // Date range buttons
    document.querySelectorAll('.date-range-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const range = e.target.closest('.date-range-btn').dataset.range;
            if (range !== 'custom') {
                this.changeDateRange(range);
            }
        });
    });

    // Custom range button
    document.getElementById('custom-range-btn').addEventListener('click', () => {
        this.openCustomRangeModal();
    });

    // Export analytics
    document.getElementById('export-analytics').addEventListener('click', () => {
        this.exportAnalyticsReport();
    });

    // Custom range modal
    this.setupCustomRangeModal();
}


changeDateRange(range) {
    this.currentDateRange = range;
    
    // Update active button
    document.querySelectorAll('.date-range-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-range="${range}"]`).classList.add('active');
    
    // Refresh all analytics data
    this.refreshAnalyticsData();
}

refreshAnalyticsData() {
    this.updateKPIMetrics();
    this.renderRevenueAnalyticsChart();
    this.renderCategoryChart();
    this.renderTrafficChart();
    this.updateFunnelData();
    this.updateTopProducts();
    this.updateAdvancedMetrics();
}

updateKPIMetrics() {
    const data = this.getDateRangeData(this.currentDateRange);
    const previousData = this.getDateRangeData(this.getPreviousDateRange());
    
    // Calculate metrics
    const revenue = data.revenue;
    const orders = data.orders.length;
    const customers = new Set(data.orders.map(order => order.shipping.email)).size;
    const aov = orders > 0 ? revenue / orders : 0;
    
    // Previous period metrics
    const prevRevenue = previousData.revenue;
    const prevOrders = previousData.orders.length;
    const prevCustomers = new Set(previousData.orders.map(order => order.shipping.email)).size;
    const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0;
    
    // Calculate trends
    const revenueTrend = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersTrend = prevOrders > 0 ? ((orders - prevOrders) / prevOrders) * 100 : 0;
    const customersTrend = prevCustomers > 0 ? ((customers - prevCustomers) / prevCustomers) * 100 : 0;
    const aovTrend = prevAov > 0 ? ((aov - prevAov) / prevAov) * 100 : 0;
    
    // Update DOM
    this.updateElement('kpi-revenue', `$${revenue.toFixed(2)}`);
    this.updateElement('kpi-orders', orders.toString());
    this.updateElement('kpi-customers', customers.toString());
    this.updateElement('kpi-aov', `$${aov.toFixed(2)}`);
    
    // Update trends
    this.updateKPITrend('kpi-revenue', revenueTrend);
    this.updateKPITrend('kpi-orders', ordersTrend);
    this.updateKPITrend('kpi-customers', customersTrend);
    this.updateKPITrend('kpi-aov', aovTrend);
}

updateKPITrend(kpiId, trend) {
    const kpiCard = document.getElementById(kpiId).closest('.kpi-card');
    const trendElement = kpiCard.querySelector('.kpi-trend');
    
    if (trendElement) {
        const isPositive = trend >= 0;
        trendElement.className = `kpi-trend ${isPositive ? 'positive' : 'negative'}`;
        trendElement.innerHTML = `
            <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
            ${Math.abs(trend).toFixed(1)}%
        `;
    }
}

getDateRangeData(range) {
    const now = new Date();
    let startDate = new Date();
    
    switch(range) {
        case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
        case '1y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate.setDate(now.getDate() - 30);
    }
    
    const filteredOrders = this.orders.filter(order => 
        new Date(order.order.timestamp) >= startDate
    );
    
    const revenue = filteredOrders.reduce((total, order) => total + order.order.total, 0);
    
    return {
        orders: filteredOrders,
        revenue: revenue,
        startDate: startDate,
        endDate: now
    };
}

getPreviousDateRange() {
    const ranges = ['7d', '30d', '90d', '1y'];
    const currentIndex = ranges.indexOf(this.currentDateRange);
    return currentIndex > 0 ? ranges[currentIndex - 1] : ranges[0];
}

renderRevenueAnalyticsChart() {
    const ctx = document.getElementById('revenue-analytics-chart');
    if (!ctx) return;

    // Destroy existing chart
    if (this.revenueAnalyticsChart) {
        this.revenueAnalyticsChart.destroy();
    }

    const data = this.generateRevenueAnalyticsData();

    this.revenueAnalyticsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: data.revenue,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Orders',
                    data: data.orders,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Orders'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.label === 'Revenue') {
                                    label += new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD'
                                    }).format(context.parsed.y);
                                } else {
                                    label += context.parsed.y;
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

generateRevenueAnalyticsData() {
    const data = this.getDateRangeData(this.currentDateRange);
    const days = this.getDaysInRange(data.startDate, data.endDate);
    
    const labels = [];
    const revenue = [];
    const orders = [];
    
    for (let i = 0; i < days; i++) {
        const date = new Date(data.startDate);
        date.setDate(date.getDate() + i);
        
        labels.push(date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        }));
        
        const dayRevenue = data.orders
            .filter(order => {
                const orderDate = new Date(order.order.timestamp);
                return orderDate.toDateString() === date.toDateString();
            })
            .reduce((total, order) => total + order.order.total, 0);
        
        const dayOrders = data.orders.filter(order => {
            const orderDate = new Date(order.order.timestamp);
            return orderDate.toDateString() === date.toDateString();
        }).length;
        
        revenue.push(dayRevenue);
        orders.push(dayOrders);
    }
    
    return { labels, revenue, orders };
}

getDaysInRange(startDate, endDate) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((endDate - startDate) / oneDay)) + 1;
}

renderCategoryChart() {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;

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
                    '#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444',
                    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#64748b'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            cutout: '60%'
        }
    });
}

renderTrafficChart() {
    const ctx = document.getElementById('traffic-chart');
    if (!ctx) return;

    if (this.trafficChart) {
        this.trafficChart.destroy();
    }

    const trafficData = this.generateTrafficData();

    this.trafficChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: trafficData.labels,
            datasets: [{
                data: trafficData.values,
                backgroundColor: [
                    '#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                }
            }
        }
    });
}

generateTrafficData() {
    // Simulated traffic sources data
    return {
        labels: ['Direct', 'Organic Search', 'Social Media', 'Email', 'Referral'],
        values: [35, 25, 20, 15, 5]
    };
}

updateFunnelData() {
    const data = this.getDateRangeData(this.currentDateRange);
    
    // Simulate funnel data based on orders
    const visitors = data.orders.length * 12; // Estimate visitors
    const addToCart = Math.round(visitors * 0.25);
    const checkout = Math.round(addToCart * 0.48);
    const purchases = data.orders.length;
    
    // Update funnel bars
    const updateFunnelBar = (stage, value) => {
        const bar = document.querySelector(`.funnel-bar[data-value]`);
        if (bar) {
            bar.textContent = value.toLocaleString();
            bar.style.width = `${Math.min((value / visitors) * 100, 100)}%`;
        }
    };
    
    // Calculate metrics
    const overallConversion = ((purchases / visitors) * 100).toFixed(1);
    const cartAbandonment = ((1 - (purchases / addToCart)) * 100).toFixed(1);
    
    // Update stats
    this.updateElement('funnel-overall-conversion', `${overallConversion}%`);
    this.updateElement('funnel-cart-abandonment', `${cartAbandonment}%`);
}

updateTopProducts() {
    const container = document.getElementById('top-products-list');
    if (!container) return;

    const topProducts = this.getTopProducts().slice(0, 5);
    
    container.innerHTML = topProducts.map((item, index) => {
        const product = this.products.find(p => p.id === item.product.id) || item.product;
        return `
            <div class="top-product-item">
                <span class="top-product-rank">${index + 1}</span>
                <img src="${product.image}" alt="${product.name}" 
                     class="top-product-image"
                     onerror="this.src='https://via.placeholder.com/40x40?text=P'">
                <div class="top-product-info">
                    <div class="top-product-name">${product.name}</div>
                    <div class="top-product-meta">
                        <span class="top-product-sales">${item.quantity} sold</span>
                        <span>$${item.revenue.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

updateAdvancedMetrics() {
    const data = this.getDateRangeData(this.currentDateRange);
    
    // Calculate advanced metrics
    const uniqueCustomers = new Set(data.orders.map(order => order.shipping.email)).size;
    const returningCustomers = this.calculateReturningCustomers(data);
    const customerLTV = this.calculateCustomerLTV();
    const retentionRate = this.calculateRetentionRate();
    
    // Update customer metrics
    this.updateElement('new-customers', uniqueCustomers.toString());
    this.updateElement('returning-customers', returningCustomers.toString());
    this.updateElement('customer-ltv', `$${customerLTV.toFixed(2)}`);
    this.updateElement('retention-rate', `${retentionRate}%`);
    
    // Update performance metrics
    this.updateElement('conversion-rate', this.analytics.conversionRate.toFixed(1) + '%');
    this.updateElement('bounce-rate', '42.5%'); // Simulated
    this.updateElement('session-duration', '3m 24s'); // Simulated
    this.updateElement('pages-per-session', '4.2'); // Simulated
}

calculateReturningCustomers(data) {
    // Simple calculation - customers with more than 1 order in the period
    const customerOrders = {};
    data.orders.forEach(order => {
        const email = order.shipping.email;
        customerOrders[email] = (customerOrders[email] || 0) + 1;
    });
    
    return Object.values(customerOrders).filter(count => count > 1).length;
}

calculateCustomerLTV() {
    if (this.customers.length === 0) return 0;
    return this.customers.reduce((sum, customer) => sum + customer.totalSpent, 0) / this.customers.length;
}

calculateRetentionRate() {
    // Simplified retention rate calculation
    const totalCustomers = this.customers.length;
    const returningCustomers = this.customers.filter(c => c.orders > 1).length;
    return totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(1) : 0;
}

startRealTimeActivity() {
    // Simulate real-time activity updates
    this.activityInterval = setInterval(() => {
        this.updateRealTimeActivities();
    }, 5000); // Update every 5 seconds
}

updateRealTimeActivities() {
    const container = document.getElementById('activity-stream');
    if (!container) return;

    // Get recent orders for activities
    const recentOrders = this.orders
        .sort((a, b) => new Date(b.order.timestamp) - new Date(a.order.timestamp))
        .slice(0, 8);

    const activities = recentOrders.map(order => {
        const types = ['order', 'user', 'payment'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let text = '';
        switch(type) {
            case 'order':
                text = `New order #${order.order.orderId} from ${order.shipping.firstName}`;
                break;
            case 'user':
                text = `New customer registered: ${order.shipping.email}`;
                break;
            case 'payment':
                text = `Payment processed for order #${order.order.orderId}`;
                break;
        }
        
        return {
            type: type,
            text: text,
            time: this.formatTimeAgo(order.order.timestamp)
        };
    });

    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

getActivityIcon(type) {
    const icons = {
        'order': 'shopping-cart',
        'user': 'user-plus',
        'payment': 'credit-card'
    };
    return icons[type] || 'circle';
}

// Custom Range Modal
setupCustomRangeModal() {
    const modal = document.getElementById('custom-range-modal');
    const closeBtn = document.getElementById('close-custom-range');
    const cancelBtn = document.getElementById('cancel-custom-range');
    const applyBtn = document.getElementById('apply-custom-range');

    const closeModal = () => {
        modal.classList.remove('active');
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    
    applyBtn?.addEventListener('click', () => {
        this.applyCustomRange();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

openCustomRangeModal() {
    const modal = document.getElementById('custom-range-modal');
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const defaultStart = thirtyDaysAgo.toISOString().split('T')[0];
    
    document.getElementById('start-date').value = defaultStart;
    document.getElementById('end-date').value = today;
    
    modal.classList.add('active');
}

applyCustomRange() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        this.showToast('Please select both start and end dates', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        this.showToast('Start date cannot be after end date', 'error');
        return;
    }
    
    this.currentDateRange = 'custom';
    this.customStartDate = new Date(startDate);
    this.customEndDate = new Date(endDate);
    
    document.getElementById('custom-range-modal').classList.remove('active');
    this.refreshAnalyticsData();
    this.showToast('Custom date range applied');
}

exportAnalyticsReport() {
    const data = this.getDateRangeData(this.currentDateRange);
    const report = this.generateAnalyticsReport(data);
    
    const blob = new Blob([report], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    this.showToast('Analytics report exported successfully!');
}

generateAnalyticsReport(data) {
    const headers = [
        'Metric',
        'Value',
        'Previous Period',
        'Growth',
        'Date Range'
    ];
    
    const revenue = data.revenue;
    const orders = data.orders.length;
    const customers = new Set(data.orders.map(order => order.shipping.email)).size;
    const aov = orders > 0 ? revenue / orders : 0;
    
    const previousData = this.getDateRangeData(this.getPreviousDateRange());
    const prevRevenue = previousData.revenue;
    const prevOrders = previousData.orders.length;
    const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0;
    
    const rows = [
        ['Revenue', `$${revenue.toFixed(2)}`, `$${prevRevenue.toFixed(2)}`, `${(((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1)}%`, this.currentDateRange],
        ['Orders', orders, prevOrders, `${(((orders - prevOrders) / prevOrders) * 100).toFixed(1)}%`, this.currentDateRange],
        ['AOV', `$${aov.toFixed(2)}`, `$${prevAov.toFixed(2)}`, `${(((aov - prevAov) / prevAov) * 100).toFixed(1)}%`, this.currentDateRange],
        ['Customers', customers, 'N/A', 'N/A', this.currentDateRange]
    ];
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    
    return csvContent;
}

// Clean up when leaving analytics section
cleanupAnalytics() {
    if (this.activityInterval) {
        clearInterval(this.activityInterval);
        this.activityInterval = null;
    }
}
updateSettingsSection() {
    this.loadSettings();
    this.setupSettingsEventListeners();
    this.initializeSettingsTabs();
}

loadSettings() {
    const settings = JSON.parse(localStorage.getItem('swiftbuy_admin_settings') || '{}');
    
    // General Settings
    this.setValue('default-dashboard-view', settings.defaultDashboardView || 'overview');
    this.setValue('date-format', settings.dateFormat || 'MM/DD/YYYY');
    this.setValue('timezone', settings.timezone || 'UTC-5');
    this.setValue('theme', settings.theme || 'light');
    this.setValue('items-per-page', settings.itemsPerPage || 25);
    this.setValue('auto-refresh', settings.autoRefresh || 60);
    this.setValue('session-timeout', settings.sessionTimeout || 60);
    this.setChecked('two-factor-auth', settings.twoFactorAuth || false);
    this.setChecked('login-notifications', settings.loginNotifications !== false);

    // Store Settings
    this.setValue('store-name', settings.storeName || 'SwiftBuy');
    this.setValue('store-email', settings.storeEmail || 'admin@swiftbuy.com');
    this.setValue('store-phone', settings.storePhone || '');
    this.setValue('store-address', settings.storeAddress || '');
    this.setValue('store-currency', settings.storeCurrency || 'USD');
    this.setValue('store-country', settings.storeCountry || 'US');
    this.setValue('store-language', settings.storeLanguage || 'en');
    this.setValue('time-format', settings.timeFormat || '12');
    this.setChecked('maintenance-mode', settings.maintenanceMode || false);
    this.setChecked('guest-checkout', settings.guestCheckout !== false);
    this.setChecked('customer-reviews', settings.customerReviews !== false);
    this.setChecked('show-inventory', settings.showInventory !== false);

    // Inventory Settings
    this.setChecked('enable-stock-management', settings.enableStockManagement !== false);
    this.setValue('low-stock-threshold', settings.lowStockThreshold || 5);
    this.setValue('out-of-stock-threshold', settings.outOfStockThreshold || 0);
    this.setValue('hold-stock', settings.holdStock || 60);
    this.setChecked('low-stock-alerts', settings.lowStockAlerts !== false);
    this.setChecked('out-of-stock-alerts', settings.outOfStockAlerts !== false);
    this.setChecked('back-in-stock-alerts', settings.backInStockAlerts || false);
    this.setValue('alert-frequency', settings.alertFrequency || 'immediate');
    this.setChecked('enable-backorders', settings.enableBackorders || false);
    this.setChecked('manage-stock-per-product', settings.manageStockPerProduct !== false);
    this.setChecked('auto-update-inventory', settings.autoUpdateInventory !== false);

    // Shipping Settings
    this.setChecked('standard-shipping', settings.standardShipping !== false);
    this.setValue('standard-shipping-cost', settings.standardShippingCost || 4.99);
    this.setValue('free-shipping-threshold', settings.freeShippingThreshold || 50.00);
    this.setChecked('express-shipping', settings.expressShipping !== false);
    this.setValue('express-shipping-cost', settings.expressShippingCost || 9.99);
    this.setChecked('international-shipping', settings.internationalShipping || false);
    this.setValue('international-shipping-cost', settings.internationalShippingCost || 19.99);

    // Payment Settings
    this.setChecked('stripe-enabled', settings.stripeEnabled !== false);
    this.setValue('stripe-publishable-key', settings.stripePublishableKey || '');
    this.setValue('stripe-secret-key', settings.stripeSecretKey || '');
    this.setChecked('paypal-enabled', settings.paypalEnabled || false);
    this.setValue('paypal-client-id', settings.paypalClientId || '');
    this.setValue('paypal-client-secret', settings.paypalClientSecret || '');
    this.setChecked('bank-transfer-enabled', settings.bankTransferEnabled || false);
    this.setValue('bank-account-details', settings.bankAccountDetails || '');
    this.setValue('payment-currency', settings.paymentCurrency || 'USD');
    this.setChecked('payment-test-mode', settings.paymentTestMode !== false);
    this.setValue('payment-capture', settings.paymentCapture || 'auto');

    // Notification Settings
    this.setChecked('email-new-orders', settings.emailNewOrders !== false);
    this.setChecked('email-low-stock', settings.emailLowStock !== false);
    this.setChecked('email-new-customers', settings.emailNewCustomers || false);
    this.setChecked('show-badges', settings.showBadges !== false);
    this.setChecked('notification-sound', settings.notificationSound || false);
    this.setValue('notification-timeout', settings.notificationTimeout || 5000);
}

setupSettingsEventListeners() {
    // Settings navigation
    document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
        item.addEventListener('click', (e) => {
            this.switchSettingsTab(e.target.closest('.nav-item').dataset.tab);
        });
    });

    // Save settings button
    document.getElementById('save-settings').addEventListener('click', () => {
        this.saveAllSettings();
    });

    // Reset settings button
    document.getElementById('reset-settings').addEventListener('click', () => {
        this.resetSettingsToDefaults();
    });

    // Auto-save on some changes
    this.setupAutoSaveListeners();
}

initializeSettingsTabs() {
    // Activate first tab by default
    this.switchSettingsTab('general');
}

switchSettingsTab(tabId) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');
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

    // Add Product Methods
setupAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    const closeBtn = document.getElementById('close-add-product');
    const cancelBtn = document.getElementById('cancel-add-product');
    const saveDraftBtn = document.getElementById('save-draft-product');
    const publishBtn = document.getElementById('publish-product');
    const uploadArea = document.getElementById('image-upload-area');
    const imageUpload = document.getElementById('product-image-upload');

    const closeModal = () => {
        modal.classList.remove('active');
        this.resetAddProductForm();
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    
    saveDraftBtn?.addEventListener('click', () => {
        this.saveProductAsDraft();
    });
    
    publishBtn?.addEventListener('click', () => {
        this.publishNewProduct();
    });

    // Image upload handling
    uploadArea?.addEventListener('click', () => {
        imageUpload?.click();
    });

    imageUpload?.addEventListener('change', (e) => {
        this.handleImageUpload(e.target.files);
    });

    // Drag and drop for images
    uploadArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea?.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        this.handleImageUpload(e.dataTransfer.files);
    });

    // Auto-generate SKU
    document.getElementById('new-product-name')?.addEventListener('blur', (e) => {
        this.autoGenerateSKU(e.target.value);
    });

    // Auto-generate slug
    document.getElementById('new-product-name')?.addEventListener('input', (e) => {
        this.autoGenerateSlug(e.target.value);
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

openAddProductModal() {
    // Generate a new product ID
    const newProductId = this.generateProductId();
    document.getElementById('new-product-sku').value = `PROD-${newProductId}`;
    
    // Reset form and open modal
    this.resetAddProductForm();
    document.getElementById('add-product-modal').classList.add('active');
    
    // Focus on product name field
    setTimeout(() => {
        document.getElementById('new-product-name').focus();
    }, 100);
}

resetAddProductForm() {
    const form = document.getElementById('add-product-form');
    form.reset();
    
    // Clear image preview
    document.getElementById('image-preview').innerHTML = '';
    
    // Reset specific fields
    document.getElementById('new-product-stock').value = '10';
    document.getElementById('new-product-threshold').value = '5';
    document.getElementById('new-product-visible').checked = true;
    
    // Clear any validation errors
    this.clearFormValidation();
}

clearFormValidation() {
    const inputs = document.querySelectorAll('#add-product-form .form-input');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

generateProductId() {
    // Generate a unique product ID based on existing products
    const existingIds = this.products.map(p => parseInt(p.id)).filter(id => !isNaN(id));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 100;
    return (maxId + 1).toString();
}

autoGenerateSKU(productName) {
    const skuField = document.getElementById('new-product-sku');
    if (!skuField.value && productName) {
        const sku = productName
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        skuField.value = `${sku}-${random}`;
    }
}

autoGenerateSlug(productName) {
    const slugField = document.getElementById('new-product-slug');
    if (!slugField.value && productName) {
        const slug = productName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        slugField.value = slug;
    }
}

handleImageUpload(files) {
    const previewContainer = document.getElementById('image-preview');
    
    // Clear previous previews
    previewContainer.innerHTML = '';
    
    Array.from(files).forEach(async (file) => {
        if (!file.type.startsWith('image/')) {
            this.showToast('Please upload only image files', 'error');
            return;
        }
        
        // Show uploading state
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item loading';
        previewItem.innerHTML = `
            <div class="uploading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Optimizing image...</p>
            </div>
        `;
        previewContainer.appendChild(previewItem);
        
        try {
            // Compress and optimize the image
            const optimizedImage = await this.compressImage(file, 300); // Max 300KB
            
            // Update preview with optimized image
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${optimizedImage}" alt="Preview">
                <div class="preview-info">
                    <span class="file-size">${this.formatFileSize(optimizedImage)}</span>
                    <span class="optimized-badge">Optimized</span>
                </div>
                <button type="button" class="preview-remove" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            this.showToast('Image optimized and ready!', 'success');
            
        } catch (error) {
            console.error('Image processing error:', error);
            previewItem.remove();
            this.showToast('Error processing image', 'error');
        }
    });
}

formatFileSize(base64String) {
    const sizeKB = Math.round((base64String.length * 0.75) / 1024);
    return `${sizeKB} KB`;
}

validateProductForm() {
    const requiredFields = [
        'new-product-name',
        'new-product-sku',
        'new-product-category',
        'new-product-price',
        'new-product-stock'
    ];
    
    let isValid = true;
    let firstErrorField = null;
    
    // Clear previous errors
    this.clearFormValidation();
    
    // Validate required fields
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
            if (!firstErrorField) firstErrorField = field;
        }
    });
    
    // Validate price
    const priceField = document.getElementById('new-product-price');
    const price = parseFloat(priceField.value);
    if (isNaN(price) || price < 0) {
        priceField.classList.add('error');
        isValid = false;
        if (!firstErrorField) firstErrorField = priceField;
    }
    
    // Validate stock
    const stockField = document.getElementById('new-product-stock');
    const stock = parseInt(stockField.value);
    if (isNaN(stock) || stock < 0) {
        stockField.classList.add('error');
        isValid = false;
        if (!firstErrorField) firstErrorField = stockField;
    }
    
    // Scroll to first error field
    if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
    }
    
    return isValid;
}

publishNewProduct() {
    if (!this.validateProductForm()) {
        this.showToast('Please fill all required fields correctly', 'error');
        return;
    }
    
    const productData = this.getProductFormData();
    this.saveNewProduct(productData, 'published');
}

saveProductAsDraft() {
    if (!this.validateProductForm()) {
        this.showToast('Please fill all required fields correctly', 'error');
        return;
    }
    
    const productData = this.getProductFormData();
    productData.status = 'draft';
    this.saveNewProduct(productData, 'draft');
}

getProductFormData() {
    let imageUrl = document.getElementById('new-product-image-url').value;
    const previewImage = this.getFirstPreviewImage();
    
    // PRIORITY: Use preview image (uploaded) over URL input
    if (previewImage) {
        imageUrl = previewImage;
    }
    
    // Fallback to placeholder if no image
    if (!imageUrl) {
        imageUrl = 'https://via.placeholder.com/300x200?text=No+Image';
    }
    
    // OPTIMIZE base64 images if they're too large
    if (imageUrl.startsWith('data:image') && imageUrl.length > 50000) {
        this.showToast('Optimizing large image...', 'info');
        imageUrl = this.optimizeBase64Image(imageUrl);
    }
    
    return {
        id: document.getElementById('new-product-sku').value,
        name: document.getElementById('new-product-name').value.substring(0, 100),
        category: document.getElementById('new-product-category').value,
        brand: document.getElementById('new-product-brand').value?.substring(0, 50) || '',
        description: (document.getElementById('new-product-description').value || '').substring(0, 200),
        price: document.getElementById('new-product-price').value,
        salePrice: document.getElementById('new-product-sale-price').value || null,
        image: imageUrl, // Now supports both URLs and optimized base64
        inventory: {
            stock: parseInt(document.getElementById('new-product-stock').value),
            lowStockThreshold: parseInt(document.getElementById('new-product-threshold').value)
        },
        // ... rest of your properties (keep the same)
        shipping: {
            weight: document.getElementById('new-product-weight').value || 0,
            dimensions: {
                length: document.getElementById('new-product-length').value || 0,
                width: document.getElementById('new-product-width').value || 0,
                height: document.getElementById('new-product-height').value || 0
            },
            class: document.getElementById('new-product-shipping').value
        },
        seo: {
            title: document.getElementById('new-product-seo-title').value?.substring(0, 60) || '',
            description: document.getElementById('new-product-meta-description').value?.substring(0, 160) || '',
            slug: document.getElementById('new-product-slug').value?.substring(0, 50) || ''
        },
        tags: document.getElementById('new-product-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        featured: document.getElementById('new-product-featured').checked,
        visible: document.getElementById('new-product-visible').checked,
        rating: {
            average: 0,
            count: 0
        },
        createdAt: new Date().toISOString().split('T')[0]
    };
}

getFirstPreviewImage() {
    const previewItem = document.querySelector('.preview-item:not(.loading)');
    if (previewItem) {
        const img = previewItem.querySelector('img');
        return img ? img.src : null;
    }
    return null;
}

saveNewProduct(productData, status) {
    try {
        // Show loading state
        const publishBtn = document.getElementById('publish-product');
        const originalText = publishBtn.innerHTML;
        publishBtn.innerHTML = '<div class="btn-loading"></div>';
        publishBtn.disabled = true;

        // Check storage before proceeding
        if (!this.checkStorageAvailable()) {
            throw new Error('Storage is full. Please clear some data or use a different browser.');
        }

        // Optimize product data to save space
        const optimizedProductData = {
            id: productData.id,
            name: productData.name.substring(0, 100), // Limit name length
            category: productData.category,
            price: parseFloat(productData.price),
            image: productData.image || 'https://via.placeholder.com/300x200?text=No+Image',
            description: (productData.description || '').substring(0, 200), // Limit description
            inventory: {
                stock: parseInt(productData.inventory.stock) || 0,
                lowStockThreshold: parseInt(productData.inventory.lowStockThreshold) || 5
            },
            rating: {
                average: 0,
                count: 0
            },
            featured: !!productData.featured,
            onSale: !!productData.onSale,
            createdAt: new Date().toISOString().split('T')[0] // Store only date to save space
        };

        console.log('🔄 Saving optimized product:', optimizedProductData);

        // Add to products array
        this.products.push(optimizedProductData);
        
        // Update inventory
        const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
        inventory[optimizedProductData.id] = {
            stock: optimizedProductData.inventory.stock,
            lowStockThreshold: optimizedProductData.inventory.lowStockThreshold,
            reserved: 0
        };
        
        try {
            localStorage.setItem('swiftbuy_inventory_v1', JSON.stringify(inventory));
            console.log('✅ Inventory saved successfully');
        } catch (inventoryError) {
            console.error('❌ Inventory save failed:', inventoryError);
            // Remove from products array if inventory save fails
            this.products = this.products.filter(p => p.id !== optimizedProductData.id);
            throw new Error('Failed to save inventory data');
        }
        
        // Save products with error handling
        try {
            localStorage.setItem('swiftbuy_products', JSON.stringify(this.products));
            console.log('✅ Products saved successfully. Total:', this.products.length);
        } catch (productError) {
            console.error('❌ Products save failed:', productError);
            // Roll back inventory changes
            delete inventory[optimizedProductData.id];
            localStorage.setItem('swiftbuy_inventory_v1', JSON.stringify(inventory));
            // Remove from products array
            this.products = this.products.filter(p => p.id !== optimizedProductData.id);
            throw new Error('Storage full - cannot save product. Please clear some data.');
        }
        
        // Reset button state
        publishBtn.innerHTML = originalText;
        publishBtn.disabled = false;
        
        // Close modal and show success
        document.getElementById('add-product-modal').classList.remove('active');
        this.showToast(`Product "${optimizedProductData.name}" ${status === 'published' ? 'published' : 'saved as draft'} successfully!`);
        
        // Refresh the products view
        this.updateProductsSection();
        
        // Clear the form
        this.resetAddProductForm();
        
    } catch (error) {
        console.error('❌ Error saving product:', error);
        
        // Reset button state
        const publishBtn = document.getElementById('publish-product');
        if (publishBtn) {
            publishBtn.innerHTML = 'Publish Product';
            publishBtn.disabled = false;
        }
        
        this.showToast(error.message || 'Error saving product', 'error');
        
        // Offer storage management for quota errors
        if (error.message.includes('Storage') || error.message.includes('full')) {
            setTimeout(() => {
                if (confirm('Storage issue detected. Would you like to clear old data?')) {
                    this.clearOldData();
                }
            }, 1500);
        }
    }
}


showOrderDetailsModal(order) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal active" id="order-details-modal">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>Order Details - #${order.order.orderId}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="order-details-grid">
                        <div class="order-section">
                            <h4>Customer Information</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Name:</label>
                                    <span>${order.shipping.firstName} ${order.shipping.lastName}</span>
                                </div>
                                <div class="info-item">
                                    <label>Email:</label>
                                    <span>${order.shipping.email}</span>
                                </div>
                                <div class="info-item">
                                    <label>Phone:</label>
                                    <span>${order.shipping.phone || 'Not provided'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="order-section">
                            <h4>Shipping Address</h4>
                            <div class="address-box">
                                <p>${order.shipping.address}</p>
                                <p>${order.shipping.city}, ${order.shipping.state} ${order.shipping.zipCode}</p>
                                <p>${order.shipping.country || 'United States'}</p>
                            </div>
                        </div>

                        <div class="order-section">
                            <h4>Order Items</h4>
                            <div class="order-items">
                                ${order.order.items.map(item => `
                                    <div class="order-item">
                                        <img src="${item.image}" alt="${item.name}" 
                                             onerror="this.src='https://via.placeholder.com/60x60?text=Product'">
                                        <div class="item-details">
                                            <strong>${item.name}</strong>
                                            <span>Quantity: ${item.quantity}</span>
                                        </div>
                                        <div class="item-price">
                                            $${((item.price_cents * item.quantity) / 100).toFixed(2)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="order-section">
                            <h4>Order Summary</h4>
                            <div class="summary-grid">
                                <div class="summary-item">
                                    <span>Subtotal:</span>
                                    <span>$${order.order.total.toFixed(2)}</span>
                                </div>
                                <div class="summary-item">
                                    <span>Shipping:</span>
                                    <span>$0.00</span>
                                </div>
                                <div class="summary-item">
                                    <span>Tax:</span>
                                    <span>$0.00</span>
                                </div>
                                <div class="summary-item total">
                                    <strong>Total:</strong>
                                    <strong>$${order.order.total.toFixed(2)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">
                        Close
                    </button>
                    <button class="btn-primary" onclick="adminDashboard.printOrder('${order.order.orderId}')">
                        <i class="fas fa-print"></i>
                        Print Order
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

showOrderStatusModal(order) {
    const statusOptions = [
        { value: 'ordered', label: 'Order Placed', color: '#64748b' },
        { value: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
        { value: 'processing', label: 'Processing', color: '#8b5cf6' },
        { value: 'shipped', label: 'Shipped', color: '#f59e0b' },
        { value: 'out-for-delivery', label: 'Out for Delivery', color: '#ef4444' },
        { value: 'delivered', label: 'Delivered', color: '#10b981' }
    ];

    const currentStatus = order.tracking?.status || 'ordered';
    
    const modalHTML = `
        <div class="modal active" id="order-status-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Update Order Status - #${order.order.orderId}</h3>
                    <button class="modal-close" id="close-status-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="status-current">
                        <h4>Current Status</h4>
                        <div class="current-status-badge">
                            <span class="status-badge ${currentStatus}">
                                ${this.formatStatus(currentStatus)}
                            </span>
                        </div>
                    </div>

                    <div class="status-options">
                        <h4>Update Status</h4>
                        <div class="status-buttons" id="status-buttons">
                            ${statusOptions.map(status => `
                                <button type="button" class="status-option ${status.value === currentStatus ? 'active' : ''}" 
                                        data-status="${status.value}">
                                    <span class="status-dot" style="background: ${status.color}"></span>
                                    ${status.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="status-notes">
                        <label for="status-note-input">Add Note (Optional)</label>
                        <textarea id="status-note-input" class="status-note-input" 
                                  placeholder="Add a note about this status update..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" id="cancel-status-update">
                        Cancel
                    </button>
                    <button class="btn-primary" id="notify-customer-btn">
                        <i class="fas fa-bell"></i>
                        Notify Customer
                    </button>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('order-status-modal');
    if (existingModal) existingModal.remove();

    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup event listeners for the new modal
    this.setupOrderStatusModalEvents(order.order.orderId);
}

setupOrderStatusModalEvents(orderId) {
    const modal = document.getElementById('order-status-modal');
    if (!modal) {
        console.error('❌ Modal not found for event setup');
        return;
    }

    // Set initial selected status
    const activeBtn = modal.querySelector('.status-option.active');
    if (activeBtn) {
        modal.dataset.selectedStatus = activeBtn.dataset.status;
    }

    // Close modal events
    const closeBtn = document.getElementById('close-status-modal');
    const cancelBtn = document.getElementById('cancel-status-update');
    
    const closeModal = () => {
        modal.remove();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Status button events
    const statusButtons = document.getElementById('status-buttons');
    if (statusButtons) {
        statusButtons.addEventListener('click', (e) => {
            const statusBtn = e.target.closest('.status-option');
            if (statusBtn) {
                // Update active state
                document.querySelectorAll('.status-option').forEach(btn => {
                    btn.classList.remove('active');
                });
                statusBtn.classList.add('active');
                
                // Store selected status
                modal.dataset.selectedStatus = statusBtn.dataset.status;
                console.log('✅ Status selected:', statusBtn.dataset.status);
            }
        });
    }

    // Notify customer button
    const notifyBtn = document.getElementById('notify-customer-btn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', () => {
            const selectedStatus = modal.dataset.selectedStatus;
            const noteInput = document.getElementById('status-note-input');
            const note = noteInput ? noteInput.value.trim() : '';
            
            if (!selectedStatus) {
                this.showToast('Please select a status', 'error');
                return;
            }
            
            console.log('🔄 Updating order:', { orderId, selectedStatus, note });
            this.updateOrderStatusWithNote(orderId, selectedStatus, note);
            closeModal();
        });
    }

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}


updateOrderStatusWithNote(orderId, newStatus, note = '') {
    console.log('🔄 Updating order status with note:', { orderId, newStatus, note });
    
    const order = this.orders.find(o => o.order.orderId === orderId);
    if (!order) {
        console.error('❌ Order not found:', orderId);
        this.showToast('Order not found!', 'error');
        return false;
    }
    
    // Ensure tracking object exists
    if (!order.tracking) {
        order.tracking = {
            status: 'ordered',
            history: [],
            lastUpdated: new Date().toISOString()
        };
    }
    
    // Create status update record
    const statusUpdate = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        updatedBy: 'Admin'
    };
    
    // Add note to history if provided
    if (note && note.trim() !== '') {
        statusUpdate.note = note.trim();
        
        // ✅ CRITICAL: Save note to main tracking object
        order.tracking.note = note.trim();
        console.log('✅ Note saved to tracking object:', note.trim());
    } else {
        // Clear note if empty
        delete order.tracking.note;
    }
    
    // Update current status
    order.tracking.status = newStatus;
    order.tracking.lastUpdated = new Date().toISOString();
    
    // Initialize history array if it doesn't exist
    if (!Array.isArray(order.tracking.history)) {
        order.tracking.history = [];
    }
    
    // Add to history
    order.tracking.history.push(statusUpdate);
    
    // Save to localStorage
    try {
        localStorage.setItem('swiftbuy_orders', JSON.stringify(this.orders));
        console.log('✅ Order saved successfully:', { 
            orderId, 
            status: newStatus,
            note: order.tracking.note,
            hasNote: !!order.tracking.note
        });
        
        // Verify save worked
        const savedOrders = JSON.parse(localStorage.getItem('swiftbuy_orders') || '[]');
        const savedOrder = savedOrders.find(o => o.order.orderId === orderId);
        console.log('✅ Verified saved order note:', savedOrder?.tracking?.note);
        
    } catch (error) {
        console.error('❌ Error saving order:', error);
        this.showToast('Error saving order!', 'error');
        return false;
    }
    
    // Update the UI
    this.updateOrdersTable();
    
    this.showToast(`Order status updated to: ${this.formatStatus(newStatus)}`);
    return true;
}

sendStatusNotification(orderId) {
    const order = this.orders.find(o => o.order.orderId === orderId);
    if (!order) {
        this.showToast('Order not found!', 'error');
        return;
    }
    
    // Get note from modal
    let note = '';
    try {
        const noteInput = document.querySelector('.status-note-input');
        note = noteInput ? noteInput.value.trim() : '';
    } catch (error) {
        console.log('Note input not found');
    }
    
    // Update the note in tracking if provided
    if (note && note !== '') {
        if (!order.tracking) order.tracking = {};
        order.tracking.note = note;
        order.tracking.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        localStorage.setItem('swiftbuy_orders', JSON.stringify(this.orders));
        console.log('✅ Note saved via notification:', note);
    }
    
    this.showToast(`Status notification sent to customer for order #${orderId}`);
    
    // Close modal
    try {
        const modal = document.getElementById('order-status-modal');
        if (modal) modal.remove();
    } catch (error) {
        console.log('Modal already closed');
    }
}

printOrder(orderId) {
    this.showToast(`Printing order #${orderId}`);
    // In a real app, this would open print dialog with order details
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

viewOrderDetails(orderId) {
    const order = this.orders.find(o => o.order.orderId === orderId);
    if (order) {
        this.showOrderDetailsModal(order);
    }
}

updateOrderStatus(orderId) {
    const order = this.orders.find(o => o.order.orderId === orderId);
    if (order) {
        this.showOrderStatusModal(order);
    }
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