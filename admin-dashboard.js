// ===== ENTERPRISE ADMIN DASHBOARD SYSTEM =====


class AdminDashboard {

    // Test modal functionality
testModalFunctionality() {
    console.log('🧪 Testing modal functionality...');
    
    // Test customer profile modal
    if (this.customers.length > 0) {
        const testCustomer = this.customers[0];
        this.viewCustomerProfile(testCustomer.email);
        console.log('✅ Customer profile modal opened');
        
        // Test close functionality after 2 seconds
        setTimeout(() => {
            document.getElementById('customer-profile-modal').classList.remove('active');
            console.log('✅ Customer profile modal closed');
        }, 2000);
    }
}

    // ===== DEBUG HELPER METHODS =====

debugBulkActions() {
    console.group('🔧 BULK ACTIONS DEBUG INFO');
    console.log('📋 Available products:', this.products.length);
    console.log('🎯 Selected checkboxes:', document.querySelectorAll('.product-checkbox:checked').length);
    console.log('⚡ Bulk action dropdown value:', document.getElementById('bulk-action')?.value);
    console.log('📦 Inventory data:', JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}'));
    console.groupEnd();
}

// Call this in your applyBulkAction method for debugging
// this.debugBulkActions();
    
safeDuplicateProduct(productId) {
    // SAFETY LOCK - prevent multiple duplicates
    if (this.duplicating) {
        console.log('🚨 Duplicate blocked - already in progress');
        return;
    }
    
    this.duplicating = true;
    
    const originalProduct = this.products.find(p => p.id === productId);
    if (!originalProduct) {
        this.showToast('Product not found!', 'error');
        this.duplicating = false;
        return;
    }

    // CREATE ONLY ONE DUPLICATE
    const duplicate = JSON.parse(JSON.stringify(originalProduct));
    duplicate.id = `COPY-${Date.now()}`;
    duplicate.name = `${originalProduct.name} (Copy)`;
    duplicate.createdAt = new Date().toISOString();
    
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
    
    this.showToast(`Created 1 copy of "${originalProduct.name}"`);
    
    // RELEASE LOCK after delay
    setTimeout(() => {
        this.duplicating = false;
    }, 1000);
}
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

// ===== CHART RESPONSIVENESS HANDLERS =====
setupChartResponsiveness() {
    // Handle window resize for charts with proper debouncing
    let resizeTimeout;
    this.isResizing = false;
    
    window.addEventListener('resize', () => {
        if (this.isResizing) return;
        this.isResizing = true;
        
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (this.currentSection === 'analytics') {
                console.log('🔄 Responsive chart refresh triggered');
                this.refreshChartsOnResize();
            }
            this.isResizing = false;
        }, 500); // Increased delay to prevent rapid refreshes
    });
    
    // Initialize chart responsiveness
    this.initializeResponsiveCharts();
}

// ===== ENHANCED LOADING STATES =====
showResponsiveLayoutHint() {
    const viewport = window.innerWidth;
    let hint = '';
    
    if (viewport < 768) {
        hint = '📱 Mobile-optimized view';
    } else if (viewport < 1024) {
        hint = '📟 Tablet-optimized view';
    } else {
        hint = '🖥️  Desktop-optimized view';
    }
    
    // Show subtle hint about current layout
    this.showToast(hint, 'info', 2000);
}

// Enhanced toast with types
showToast(message, type = 'success', duration = 3000) {
    // Remove existing toasts
    document.querySelectorAll('.admin-toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-triangle',
        warning: 'exclamation-circle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas fa-${icons[type] || 'check'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Add responsive styling
    if (window.innerWidth < 768) {
        toast.style.maxWidth = '90%';
        toast.style.left = '5%';
        toast.style.right = '5%';
    }
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, duration);
}

initializeResponsiveCharts() {
    // Set initial chart sizes based on viewport
    this.updateChartSizes();
}

refreshChartsOnResize() {
    const viewport = window.innerWidth;
    console.log('📱 Chart optimization for:', viewport + 'px viewport');
    
    // Only refresh if we're actually in analytics section
    if (this.currentSection !== 'analytics') {
        console.log('⏸️  Skipping chart refresh - not in analytics section');
        return;
    }
    
    // Check if we actually need to refresh (significant size change)
    if (this.lastViewport && Math.abs(viewport - this.lastViewport) < 50) {
        console.log('📏 Minor resize, skipping chart refresh');
        return;
    }
    
    this.lastViewport = viewport;
    
    console.log('🔄 Optimized chart refresh initiated');
    
    // Use requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
        this.safeChartRefresh();
    });
}

safeChartRefresh() {
    try {
        // Safe chart destruction with existence checks
        const charts = [
            { instance: this.revenueAnalyticsChart, name: 'Revenue Chart', render: () => this.renderRevenueAnalyticsChart() },
            { instance: this.categoryChart, name: 'Category Chart', render: () => this.renderCategoryChart() },
            { instance: this.trafficChart, name: 'Traffic Chart', render: () => this.renderTrafficChart() }
        ];
        
        charts.forEach((chart, index) => {
            if (chart.instance && typeof chart.instance.destroy === 'function') {
                setTimeout(() => {
                    console.log(`📊 Refreshing ${chart.name}`);
                    chart.instance.destroy();
                    chart.render();
                }, index * 200); // Stagger refreshes for performance
            }
        });
        
    } catch (error) {
        console.error('❌ Chart refresh error:', error);
    }
}



initializeResponsiveCharts() {
    // Set initial chart sizes based on viewport
    this.updateChartSizes();
}

updateChartSizes() {
    const isMobile = window.innerWidth <= 768;
    const chartHeight = isMobile ? 200 : 300;
    
    // Update chart container heights
    document.querySelectorAll('.chart-card canvas').forEach(canvas => {
        canvas.style.height = `${chartHeight}px`;
    });
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
    this.duplicating = false;
    this.productActionHandler = null;
    this.productSearchHandler = null;
    this.loadingAnalytics = false;
    this.isResizing = false;
    this.lastViewport = window.innerWidth; // ← ADD THIS LINE
    this.init();
}

// ===== SALES BY CATEGORY DEBUG =====
debugCategoryChart() {
    console.group('🔍 Sales by Category Debug');
    
    // Check if chart element exists
    const chartElement = document.getElementById('category-chart');
    console.log('📊 Chart Element:', chartElement);
    
    if (chartElement) {
        console.log('✅ Chart element found');
        console.log('📏 Dimensions:', chartElement.offsetWidth + 'x' + chartElement.offsetHeight);
        console.log('🎨 Computed Style:', window.getComputedStyle(chartElement).display);
    } else {
        console.error('❌ Chart element not found!');
    }
    
    // Check if chart instance exists
    console.log('🔄 Chart Instance:', this.categoryChart);
    
    // Check category data
    const categoryData = this.generateCategoryData();
    console.log('📈 Category Data:', categoryData);
    
    console.groupEnd();
}


// Place this AFTER the constructor but BEFORE the init() method

// ===== ANALYTICS RESPONSIVENESS TESTING =====
testAnalyticsResponsiveness() {
    // Wait for DOM to be ready
    setTimeout(() => {
        console.group('📱 ANALYTICS RESPONSIVENESS TEST');
        console.log('🖥️  Current viewport:', window.innerWidth + 'px');
        
        const breakpoints = [
            { name: 'Mobile Small', width: 375 },
            { name: 'Mobile Large', width: 768 },
            { name: 'Tablet', width: 1024 },
            { name: 'Desktop', width: 1200 }
        ];
        
        // Test current layout
        const currentLayout = this.getCurrentLayoutAnalysis();
        console.log('📊 Current Layout Analysis:', currentLayout);
        
        // Test element responsiveness
        this.testElementResponsiveness();
        
        console.groupEnd();
    }, 500);
}

getCurrentLayoutAnalysis() {
    const analysis = {
        viewport: window.innerWidth,
        breakpoint: this.getCurrentBreakpoint(),
        kpiGrid: this.testKpiGrid(),
        chartLayout: this.testChartLayout(),
        datePicker: this.testDatePicker()
    };
    
    return analysis;
}

getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width < 576) return 'xs';
    if (width < 768) return 'sm';
    if (width < 992) return 'md';
    if (width < 1200) return 'lg';
    return 'xl';
}

testKpiGrid() {
    const kpiGrid = document.querySelector('.kpi-grid');
    if (!kpiGrid) return 'KPI grid not found';
    
    const style = window.getComputedStyle(kpiGrid);
    return {
        gridTemplate: style.gridTemplateColumns,
        gap: style.gap,
        itemCount: kpiGrid.children.length
    };
}

testChartLayout() {
    const chartsRow = document.querySelector('.charts-row-2');
    if (!chartsRow) return 'Charts row not found';
    
    const style = window.getComputedStyle(chartsRow);
    return {
        gridTemplate: style.gridTemplateColumns,
        charts: chartsRow.querySelectorAll('.chart-card').length
    };
}

testDatePicker() {
    const datePicker = document.querySelector('.date-range-picker');
    if (!datePicker) return 'Date picker not found';
    
    return {
        buttons: datePicker.querySelectorAll('.date-range-btn').length,
        visible: datePicker.offsetParent !== null
    };
}

testElementResponsiveness() {
    const elements = [
        { selector: '.kpi-grid', name: 'KPI Grid' },
        { selector: '.charts-row-2', name: 'Charts Row' },
        { selector: '.date-range-picker', name: 'Date Picker' },
        { selector: '.advanced-metrics', name: 'Advanced Metrics' }
    ];
    
    elements.forEach(element => {
        const el = document.querySelector(element.selector);
        if (el) {
            const rect = el.getBoundingClientRect();
            console.log(`✅ ${element.name}:`, {
                visible: rect.width > 0 && rect.height > 0,
                dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
                inViewport: rect.top >= 0 && rect.left >= 0 && 
                           rect.bottom <= window.innerHeight && 
                           rect.right <= window.innerWidth
            });
        } else {
            console.warn(`❌ ${element.name}: Element not found`);
        }
    });
}

testChartResponsiveness() {
    const charts = [
        { name: 'Revenue Chart', element: document.getElementById('revenue-analytics-chart') },
        { name: 'Category Chart', element: document.getElementById('category-chart') },
        { name: 'Traffic Chart', element: document.getElementById('traffic-chart') }
    ];
    
    charts.forEach(chart => {
        if (chart.element) {
            const canvas = chart.element;
            const computedStyle = window.getComputedStyle(canvas);
            console.log(`📊 ${chart.name}:`, {
                width: computedStyle.width,
                height: computedStyle.height,
                aspectRatio: (canvas.width / canvas.height).toFixed(2)
            });
        } else {
            console.warn(`❌ ${chart.name} not found`);
        }
    });
}

init() {
    console.log('🚀 Initializing Admin Dashboard...');
    
    this.loadAllData();
    this.setupEventListeners();
    this.setupRealTimeUpdates();
    this.setupChartResponsiveness(); // ← ADD THIS LINE
    this.setupTouchGestures(); // ← ADD THIS EXACT LINE
    this.setupAdvancedSettingsResponsiveness(); // ← ADD THIS LINE
    this.updateDashboard();
    this.setupAddProductModal();
    this.setupQuickEditModal();
    // Enhanced settings observer initialization
console.log('🔧 Initializing settings observers...');
this.initSettingsObservers();
console.log('✅ Settings observers initialization completed');
    
    // Setup enhanced action buttons with error handling
    if (typeof this.setupEnhancedActionButtons === 'function') {
        this.setupEnhancedActionButtons();
    } else {
        console.warn('⚠️ setupEnhancedActionButtons method not found, using fallback');
        this.setupCustomerActionModals(); // Fallback to just customer actions
    }
    
    // Setup customer action modals
    if (typeof this.setupCustomerActionModals === 'function') {
        this.setupCustomerActionModals();
    } else {
        console.error('❌ setupCustomerActionModals method not found');
    }
    
    console.log('✅ Enterprise Admin Dashboard Ready');
}

// Place this AFTER the init() method but BEFORE loadAllData()

// ===== TOUCH GESTURE SUPPORT FOR MOBILE =====
setupTouchGestures() {
    // Swipe support for date range navigation
    let touchStartX = 0;
    let touchEndX = 0;
    
    const analyticsSection = document.getElementById('analytics');
    if (!analyticsSection) return;
    
    analyticsSection.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    analyticsSection.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        this.handleSwipeGesture(touchStartX, touchEndX);
    });
}

handleSwipeGesture(startX, endX) {
    const swipeThreshold = 50;
    const swipeDistance = endX - startX;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
            // Swipe right - previous period
            this.navigateDateRange('previous');
        } else {
            // Swipe left - next period
            this.navigateDateRange('next');
        }
    }
}

navigateDateRange(direction) {
    const ranges = ['7d', '30d', '90d', '1y'];
    const currentIndex = ranges.indexOf(this.currentDateRange);
    
    let newIndex;
    if (direction === 'next') {
        newIndex = currentIndex < ranges.length - 1 ? currentIndex + 1 : 0;
    } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : ranges.length - 1;
    }
    
    this.changeDateRange(ranges[newIndex]);
    this.showToast(`Switched to ${ranges[newIndex]} view`);
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
        console.log('💾 Attempting to save', this.products.length, 'products...');
        
        const productsJSON = JSON.stringify(this.products);
        console.log('📦 Products JSON size:', productsJSON.length, 'characters');
        
        localStorage.setItem('swiftbuy_products', productsJSON);
        
        // Verify the save worked
        const savedProducts = JSON.parse(localStorage.getItem('swiftbuy_products') || '[]');
        console.log('✅ Save verification:', savedProducts.length, 'products saved');
        
        if (savedProducts.length === this.products.length) {
            console.log('✅ Products saved successfully to localStorage');
            return true;
        } else {
            console.error('❌ Save verification failed: count mismatch');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Failed to save products:', error);
        this.showToast('Error saving products: ' + error.message, 'error');
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

    // Create grid header with select all
    const selectedCount = document.querySelectorAll('.product-checkbox:checked').length;
    const totalCount = productsToShow.length;
    
    const gridHeader = `
        <div class="products-grid-header">
            <div class="grid-select-all">
                <input type="checkbox" id="select-all-grid" ${selectedCount === totalCount && totalCount > 0 ? 'checked' : ''}>
                <label for="select-all-grid">
                    ${selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
                </label>
            </div>
            <div class="grid-controls">
                <span class="grid-count">${totalCount} products</span>
                <div class="view-toggle">
                    <button class="view-btn active" data-view="grid">
                        <i class="fas fa-th"></i>
                    </button>
                    <button class="view-btn" data-view="table">
                        <i class="fas fa-list"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    const productsGrid = productsToShow.map(product => {
        const productInventory = inventory[product.id];
        const realTimeStock = productInventory ? productInventory.stock : product.inventory.stock;
        const lowStockThreshold = productInventory ? productInventory.lowStockThreshold : product.inventory.lowStockThreshold;
        
        const status = realTimeStock === 0 ? 'out-of-stock' : 
                      realTimeStock <= lowStockThreshold ? 'low-stock' : 'in-stock';
        const statusText = realTimeStock === 0 ? 'Out of Stock' : 
                          realTimeStock <= lowStockThreshold ? 'Low Stock' : 'In Stock';

        const stockPercentage = Math.min((realTimeStock / 20) * 100, 100);
        const salesCount = this.getProductSalesCount(product.id);
        const revenue = this.getProductRevenue(product.id);

        const isChecked = document.querySelector(`.product-checkbox[data-id="${product.id}"]`)?.checked || false;

        return `
        <div class="product-card ${isChecked ? 'selected' : ''}" data-id="${product.id}">
            <input type="checkbox" class="product-checkbox" data-id="${product.id}" ${isChecked ? 'checked' : ''}>
            <div class="product-checkbox-indicator"></div>
            
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

    container.innerHTML = gridHeader + `<div class="products-grid">${productsGrid}</div>`;
    
    // Setup grid select all functionality
    this.setupGridSelectAll();
}

setupGridSelectAll() {
    const selectAllGrid = document.getElementById('select-all-grid');
    if (!selectAllGrid) return;

    selectAllGrid.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('#products-grid .product-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
            const productCard = checkbox.closest('.product-card');
            if (productCard) {
                productCard.classList.toggle('selected', e.target.checked);
            }
        });
        this.toggleBulkActionsBar();
        this.updateGridSelectAllText();
    });

    // Update individual checkbox changes
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('product-checkbox') && e.target.closest('#products-grid')) {
            const productCard = e.target.closest('.product-card');
            if (productCard) {
                productCard.classList.toggle('selected', e.target.checked);
            }
            this.updateGridSelectAllText();
            this.toggleBulkActionsBar();
        }
    });
}

updateGridSelectAllText() {
    const selectAllGrid = document.getElementById('select-all-grid');
    const selectAllLabel = document.querySelector('.grid-select-all label');
    if (!selectAllGrid || !selectAllLabel) return;

    const selectedCount = document.querySelectorAll('#products-grid .product-checkbox:checked').length;
    const totalCount = document.querySelectorAll('#products-grid .product-checkbox').length;

    // Update select all checkbox state
    selectAllGrid.checked = selectedCount === totalCount && totalCount > 0;
    selectAllGrid.indeterminate = selectedCount > 0 && selectedCount < totalCount;

    // Update label text
    if (selectedCount > 0) {
        selectAllLabel.textContent = `${selectedCount} selected`;
    } else {
        selectAllLabel.textContent = 'Select all';
    }
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

        // Check if this product is currently selected
        const isChecked = document.querySelector(`.product-checkbox[data-id="${product.id}"]`)?.checked || false;

        return `
        <tr class="${isChecked ? 'selected' : ''}">
            <td>
                <input type="checkbox" class="product-checkbox" data-id="${product.id}" ${isChecked ? 'checked' : ''}>
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

    // Update table select all state
    this.updateTableSelectAllState();
}

updateTableSelectAllState() {
    const selectAllTable = document.getElementById('select-all-products');
    if (!selectAllTable) return;

    const tableCheckboxes = document.querySelectorAll('#products-table .product-checkbox');
    const selectedCount = Array.from(tableCheckboxes).filter(cb => cb.checked).length;
    const totalCount = tableCheckboxes.length;

    selectAllTable.checked = selectedCount === totalCount && totalCount > 0;
    selectAllTable.indeterminate = selectedCount > 0 && selectedCount < totalCount;
}

setupProductEventListeners() {
    // REMOVE OLD EVENT LISTENERS FIRST
    if (this.productSearchHandler) {
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.removeEventListener('input', this.productSearchHandler);
        }
    }

    // Search functionality
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        this.productSearchHandler = (e) => {
            this.filterProducts();
        };
        searchInput.addEventListener('input', this.productSearchHandler);
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
    
    // Product action buttons - CALL ONLY ONCE
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
    
    // Always update both views to keep them in sync
    this.renderProductsGridView(filteredProducts);
    this.renderProductsTableView(filteredProducts);
    
    // Ensure the correct view is visible
    document.getElementById('products-grid-view').style.display = currentView === 'grid' ? 'block' : 'none';
    document.getElementById('products-table-view').style.display = currentView === 'table' ? 'block' : 'none';
    
    console.log('🔍 Filtered products:', filteredProducts.length);
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

    // Use refresh system to ensure both views are updated
    this.refreshProductViews();
}

setupBulkActions() {
    // Table select all
    const selectAllTable = document.getElementById('select-all-products');
    if (selectAllTable) {
        selectAllTable.addEventListener('change', (e) => {
            const tableCheckboxes = document.querySelectorAll('#products-table .product-checkbox');
            tableCheckboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
                const tableRow = checkbox.closest('tr');
                if (tableRow) {
                    tableRow.classList.toggle('selected', e.target.checked);
                }
            });
            this.toggleBulkActionsBar();
        });
    }

    // Individual checkbox changes for both views
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('product-checkbox')) {
            // Handle table row selection
            if (e.target.closest('#products-table')) {
                const tableRow = e.target.closest('tr');
                if (tableRow) {
                    tableRow.classList.toggle('selected', e.target.checked);
                }
                this.updateTableSelectAllState();
            }
            
            // Handle grid card selection (already handled in setupGridSelectAll)
            this.toggleBulkActionsBar();
        }
    });

    // Bulk action apply
    const applyBulk = document.getElementById('apply-bulk-action');
    if (applyBulk) {
        applyBulk.addEventListener('click', this.applyBulkAction.bind(this));
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

applyBulkAction(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('🔄 applyBulkAction called');
    
    const action = document.getElementById('bulk-action').value;
    console.log('📋 Selected action:', action);
    
    // FIX: Include both grid AND table checkboxes
    const selectedProducts = Array.from(document.querySelectorAll('.product-checkbox:checked'))
        .filter(checkbox => {
            // Include checkboxes from BOTH grid and table views
            return checkbox.closest('tr') !== null || checkbox.closest('.product-card') !== null;
        })
        .map(checkbox => checkbox.dataset.id)
        .filter(id => id !== undefined && id !== ''); // Remove empty IDs

    console.log('🎯 Selected product IDs:', selectedProducts);

    if (!action) {
        this.showToast('Please select a bulk action from the dropdown', 'error');
        console.error('❌ No action selected');
        return;
    }

    if (selectedProducts.length === 0) {
        this.showToast('Please select at least one product', 'error');
        console.error('❌ No products selected');
        return;
    }

    console.log('🚀 Executing bulk action:', action, 'on products:', selectedProducts);

    try {
        const boundMethods = {
            'update-stock': this.bulkUpdateStock.bind(this),
            'update-price': this.bulkUpdatePrice.bind(this),
            'update-category': this.bulkUpdateCategory.bind(this),
            'archive': this.bulkArchiveProducts.bind(this),
            'delete': this.bulkDeleteProducts.bind(this),
            'bulk-edit': this.showBulkEditModal.bind(this)
        };

        const method = boundMethods[action];
        if (method) {
            console.log('✅ Calling method:', method.name);
            method(selectedProducts);
        } else {
            this.showToast('Unknown bulk action: ' + action, 'error');
            console.error('❌ Unknown action:', action);
        }
        
    } catch (error) {
        console.error('💥 Bulk action error:', error);
        this.showToast('Error executing bulk action: ' + error.message, 'error');
    }
    
    // Close bulk actions after completion
    this.cancelBulkSelection();
}

// ADD THESE MISSING METHODS:
// ===== ADVANCED BULK OPERATIONS SYSTEM =====

bulkUpdateStock(productIds) {
    console.log('🔄 bulkUpdateStock called with:', productIds);
    
    // Create beautiful modal instead of ugly prompt
    const modalHTML = `
        <div class="modal active" id="bulk-stock-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Update Stock Quantity</h3>
                    <button class="modal-close" id="close-bulk-stock">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="bulk-stock-input">
                            <i class="fas fa-boxes"></i>
                            New stock quantity for ${productIds.length} products
                        </label>
                        <input type="number" 
                               id="bulk-stock-input" 
                               class="form-input" 
                               min="0" 
                               step="1"
                               placeholder="Enter stock quantity..."
                               autofocus>
                        <div class="form-hint">
                            <i class="fas fa-info-circle"></i>
                            This will update all selected products to this stock level
                        </div>
                    </div>
                    
                    <div class="selected-products-preview">
                        <h4>Selected Products (${productIds.length}):</h4>
                        <div class="preview-list">
                            ${productIds.slice(0, 5).map(id => {
                                const product = this.products.find(p => p.id === id);
                                return `<div class="preview-item">${product?.name || id}</div>`;
                            }).join('')}
                            ${productIds.length > 5 ? `<div class="preview-more">+${productIds.length - 5} more</div>` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancel-bulk-stock">
                        Cancel
                    </button>
                    <button class="btn-primary" id="apply-bulk-stock">
                        <i class="fas fa-check"></i>
                        Update Stock
                    </button>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('bulk-stock-modal');
    if (existingModal) existingModal.remove();

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup event listeners
    this.setupBulkStockModal(productIds);
}

setupBulkStockModal(productIds) {
    const modal = document.getElementById('bulk-stock-modal');
    const stockInput = document.getElementById('bulk-stock-input');
    const applyBtn = document.getElementById('apply-bulk-stock');
    const cancelBtn = document.getElementById('cancel-bulk-stock');
    const closeBtn = document.getElementById('close-bulk-stock');

    // Focus on input
    setTimeout(() => {
        stockInput?.focus();
    }, 100);

    // Apply stock update
    applyBtn?.addEventListener('click', () => {
        const stockValue = stockInput.value.trim();
        
        if (!stockValue) {
            this.showToast('Please enter a stock quantity', 'error');
            stockInput.focus();
            return;
        }

        if (isNaN(stockValue) || stockValue < 0) {
            this.showToast('Please enter a valid stock quantity (number ≥ 0)', 'error');
            stockInput.focus();
            return;
        }

        this.executeBulkStockUpdate(productIds, parseInt(stockValue));
        modal.remove();
    });

    // Enter key support
    stockInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyBtn.click();
        }
    });

    // Close modal events
    const closeModal = () => modal.remove();
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

executeBulkStockUpdate(productIds, stockValue) {
    console.log('🔢 Updating stock to:', stockValue, 'for products:', productIds);
    
    // Update in memory
    productIds.forEach(id => {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.inventory.stock = stockValue;
        }
        
        // Update inventory system
        const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
        if (inventory[id]) {
            inventory[id].stock = stockValue;
        } else {
            inventory[id] = {
                stock: stockValue,
                lowStockThreshold: 5,
                reserved: 0
            };
        }
        localStorage.setItem('swiftbuy_inventory_v1', JSON.stringify(inventory));
    });
    
    // Persist changes to products
    this.saveProducts();
    
    // Update UI - REFRESH BOTH VIEWS
    this.refreshProductViews();
    
    this.showToast(`✅ Stock updated to ${stockValue} for ${productIds.length} products`, 'success');
    console.log('✅ Bulk stock update completed');
}

executeBulkPriceUpdate(productIds, priceValue) {
    console.log('💰 Updating price to:', priceValue, 'for products:', productIds);
    
    productIds.forEach(id => {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.price = priceValue;
        }
    });
    
    this.saveProducts();
    
    // Update UI - REFRESH BOTH VIEWS
    this.refreshProductViews();
    
    this.showToast(`✅ Prices updated to $${priceValue.toFixed(2)} for ${productIds.length} products`, 'success');
}

executeBulkCategoryUpdate(productIds, categoryValue) {
    console.log('📂 Updating category to:', categoryValue, 'for products:', productIds);
    
    productIds.forEach(id => {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.category = categoryValue;
        }
    });
    
    this.saveProducts();
    
    // Update UI - REFRESH BOTH VIEWS
    this.refreshProductViews();
    
    this.showToast(`✅ Categories updated to "${this.formatCategoryName(categoryValue)}" for ${productIds.length} products`, 'success');
}

executeBulkArchiveUpdate(productIds) {
    console.log('📦 Archiving products:', productIds);
    
    productIds.forEach(id => {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.archived = true;
            product.visible = false;
        }
    });
    
    this.saveProducts();
    
    // Update UI - REFRESH BOTH VIEWS
    this.refreshProductViews();
    
    this.showToast(`✅ ${productIds.length} products archived successfully`, 'success');
}

executeBulkDeleteUpdate(productIds) {
    console.log('🗑️ Deleting products:', productIds);
    
    try {
        // Remove from products array
        this.products = this.products.filter(product => !productIds.includes(product.id));
        
        // Remove from inventory
        const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
        productIds.forEach(id => {
            delete inventory[id];
        });
        localStorage.setItem('swiftbuy_inventory_v1', JSON.stringify(inventory));
        
        // Persist changes
        this.saveProducts();
        
        // Update UI - REFRESH BOTH VIEWS
        this.refreshProductViews();
        
        this.showToast(`✅ ${productIds.length} products permanently deleted`, 'success');
        
    } catch (error) {
        console.error('Bulk delete error:', error);
        this.showToast('Error deleting products', 'error');
    }
}

refreshProductViews() {
    // Update product stats
    this.updateProductStats();
    
    // Get current view state
    const currentView = document.querySelector('.view-btn.active')?.dataset.view || 'grid';
    const currentSearch = document.getElementById('product-search')?.value || '';
    const currentCategory = document.getElementById('category-filter')?.value || '';
    const currentStatus = document.getElementById('status-filter')?.value || '';
    
    // Re-apply current filters to maintain UI state
    if (currentSearch || currentCategory || currentStatus) {
        this.filterProducts();
    } else {
        // Refresh both views based on current active view
        if (currentView === 'grid') {
            this.renderProductsGridView();
            // Also update table view in background to keep it in sync
            this.renderProductsTableView();
        } else {
            this.renderProductsTableView();
            // Also update grid view in background to keep it in sync
            this.renderProductsGridView();
        }
    }
    
    // Update bulk actions bar state
    this.toggleBulkActionsBar();
    
    console.log('🔄 Product views refreshed');
}

bulkUpdatePrice(productIds) {
    console.log('💰 bulkUpdatePrice called with:', productIds);
    
    const modalHTML = `
        <div class="modal active" id="bulk-price-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Update Product Prices</h3>
                    <button class="modal-close" id="close-bulk-price">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="bulk-price-input">
                            <i class="fas fa-tag"></i>
                            New price for ${productIds.length} products
                        </label>
                        <div class="input-with-symbol">
                            <span class="input-symbol">$</span>
                            <input type="number" 
                                   id="bulk-price-input" 
                                   class="form-input" 
                                   min="0" 
                                   step="0.01"
                                   placeholder="0.00"
                                   autofocus>
                        </div>
                        <div class="form-hint">
                            <i class="fas fa-info-circle"></i>
                            Enter the new price for all selected products
                        </div>
                    </div>
                    
                    <div class="selected-products-preview">
                        <h4>Selected Products (${productIds.length}):</h4>
                        <div class="preview-list">
                            ${productIds.slice(0, 5).map(id => {
                                const product = this.products.find(p => p.id === id);
                                const currentPrice = product ? `$${product.price}` : 'N/A';
                                return `<div class="preview-item">
                                    <span>${product?.name || id}</span>
                                    <small class="text-muted">${currentPrice}</small>
                                </div>`;
                            }).join('')}
                            ${productIds.length > 5 ? `<div class="preview-more">+${productIds.length - 5} more</div>` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancel-bulk-price">
                        Cancel
                    </button>
                    <button class="btn-primary" id="apply-bulk-price">
                        <i class="fas fa-dollar-sign"></i>
                        Update Prices
                    </button>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('bulk-price-modal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.setupBulkPriceModal(productIds);
}

setupBulkPriceModal(productIds) {
    const modal = document.getElementById('bulk-price-modal');
    const priceInput = document.getElementById('bulk-price-input');
    const applyBtn = document.getElementById('apply-bulk-price');
    const cancelBtn = document.getElementById('cancel-bulk-price');
    const closeBtn = document.getElementById('close-bulk-price');

    setTimeout(() => priceInput?.focus(), 100);

    applyBtn?.addEventListener('click', () => {
        const priceValue = priceInput.value.trim();
        
        if (!priceValue) {
            this.showToast('Please enter a price', 'error');
            priceInput.focus();
            return;
        }

        if (isNaN(priceValue) || priceValue < 0) {
            this.showToast('Please enter a valid price (number ≥ 0)', 'error');
            priceInput.focus();
            return;
        }

        this.executeBulkPriceUpdate(productIds, parseFloat(priceValue));
        modal.remove();
    });

    priceInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyBtn.click();
    });

    const closeModal = () => modal.remove();
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

executeBulkPriceUpdate(productIds, priceValue) {
    console.log('💰 Updating price to:', priceValue, 'for products:', productIds);
    
    productIds.forEach(id => {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.price = priceValue;
        }
    });
    
    this.saveProducts();
    this.updateProductsSection();
    this.showToast(`✅ Prices updated to $${priceValue.toFixed(2)} for ${productIds.length} products`, 'success');
}

bulkUpdateCategory(productIds) {
    console.log('📂 bulkUpdateCategory called with:', productIds);
    
    const categories = ['electronics', 'shoe', 'sunglasses', 'backpacks', 'clothing', 'accessories'];
    
    const modalHTML = `
        <div class="modal active" id="bulk-category-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Update Product Categories</h3>
                    <button class="modal-close" id="close-bulk-category">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="bulk-category-select">
                            <i class="fas fa-folder"></i>
                            New category for ${productIds.length} products
                        </label>
                        <select id="bulk-category-select" class="form-input" autofocus>
                            <option value="">Select a category...</option>
                            ${categories.map(category => `
                                <option value="${category}">${this.formatCategoryName(category)}</option>
                            `).join('')}
                        </select>
                        <div class="form-hint">
                            <i class="fas fa-info-circle"></i>
                            Choose the new category for all selected products
                        </div>
                    </div>
                    
                    <div class="selected-products-preview">
                        <h4>Selected Products (${productIds.length}):</h4>
                        <div class="preview-list">
                            ${productIds.slice(0, 5).map(id => {
                                const product = this.products.find(p => p.id === id);
                                const currentCategory = product?.category || 'No category';
                                return `<div class="preview-item">
                                    <span>${product?.name || id}</span>
                                    <small class="text-muted">${this.formatCategoryName(currentCategory)}</small>
                                </div>`;
                            }).join('')}
                            ${productIds.length > 5 ? `<div class="preview-more">+${productIds.length - 5} more</div>` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancel-bulk-category">
                        Cancel
                    </button>
                    <button class="btn-primary" id="apply-bulk-category">
                        <i class="fas fa-sync"></i>
                        Update Categories
                    </button>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('bulk-category-modal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.setupBulkCategoryModal(productIds, categories);
}

setupBulkCategoryModal(productIds, categories) {
    const modal = document.getElementById('bulk-category-modal');
    const categorySelect = document.getElementById('bulk-category-select');
    const applyBtn = document.getElementById('apply-bulk-category');
    const cancelBtn = document.getElementById('cancel-bulk-category');
    const closeBtn = document.getElementById('close-bulk-category');

    setTimeout(() => categorySelect?.focus(), 100);

    applyBtn?.addEventListener('click', () => {
        const categoryValue = categorySelect.value;
        
        if (!categoryValue) {
            this.showToast('Please select a category', 'error');
            categorySelect.focus();
            return;
        }

        if (!categories.includes(categoryValue)) {
            this.showToast(`Invalid category. Available: ${categories.join(', ')}`, 'error');
            return;
        }

        this.executeBulkCategoryUpdate(productIds, categoryValue);
        modal.remove();
    });

    categorySelect?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyBtn.click();
    });

    const closeModal = () => modal.remove();
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

executeBulkCategoryUpdate(productIds, categoryValue) {
    console.log('📂 Updating category to:', categoryValue, 'for products:', productIds);
    
    productIds.forEach(id => {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.category = categoryValue;
        }
    });
    
    this.saveProducts();
    this.updateProductsSection();
    this.showToast(`✅ Categories updated to "${this.formatCategoryName(categoryValue)}" for ${productIds.length} products`, 'success');
}

formatCategoryName(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
}

bulkArchiveProducts(productIds) {
    console.log('📦 bulkArchiveProducts called with:', productIds);
    
    const modalHTML = `
        <div class="modal active" id="bulk-archive-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Archive Products</h3>
                    <button class="modal-close" id="close-bulk-archive">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="warning-message">
                        <div class="warning-icon">
                            <i class="fas fa-archive"></i>
                        </div>
                        <div class="warning-content">
                            <h4>Archive ${productIds.length} Products?</h4>
                            <p>Archived products will be hidden from the store but not deleted. You can restore them later.</p>
                        </div>
                    </div>
                    
                    <div class="selected-products-preview">
                        <h4>Products to Archive:</h4>
                        <div class="preview-list">
                            ${productIds.slice(0, 8).map(id => {
                                const product = this.products.find(p => p.id === id);
                                return `<div class="preview-item archive-item">
                                    <span>${product?.name || id}</span>
                                    <small class="text-muted">${product?.category || 'No category'}</small>
                                </div>`;
                            }).join('')}
                            ${productIds.length > 8 ? `<div class="preview-more">+${productIds.length - 8} more</div>` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancel-bulk-archive">
                        Keep Products
                    </button>
                    <button class="btn-warning" id="apply-bulk-archive">
                        <i class="fas fa-archive"></i>
                        Archive Products
                    </button>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('bulk-archive-modal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.setupBulkArchiveModal(productIds);
}

setupBulkArchiveModal(productIds) {
    const modal = document.getElementById('bulk-archive-modal');
    const applyBtn = document.getElementById('apply-bulk-archive');
    const cancelBtn = document.getElementById('cancel-bulk-archive');
    const closeBtn = document.getElementById('close-bulk-archive');

    applyBtn?.addEventListener('click', () => {
        this.executeBulkArchiveUpdate(productIds);
        modal.remove();
    });

    const closeModal = () => modal.remove();
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

executeBulkArchiveUpdate(productIds) {
    console.log('📦 Archiving products:', productIds);
    
    productIds.forEach(id => {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.archived = true;
            product.visible = false;
        }
    });
    
    this.saveProducts();
    this.updateProductsSection();
    this.showToast(`✅ ${productIds.length} products archived successfully`, 'success');
}

bulkDeleteProducts(productIds) {
    console.log('🗑️ bulkDeleteProducts called with:', productIds);
    
    const modalHTML = `
        <div class="modal active" id="bulk-delete-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Delete Products</h3>
                    <button class="modal-close" id="close-bulk-delete">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="danger-message">
                        <div class="danger-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="danger-content">
                            <h4>Permanently Delete ${productIds.length} Products?</h4>
                            <p>This action <strong>cannot be undone</strong>. All product data, inventory, and sales history will be lost permanently.</p>
                        </div>
                    </div>
                    
                    <div class="selected-products-preview">
                        <h4>Products to Delete:</h4>
                        <div class="preview-list">
                            ${productIds.slice(0, 6).map(id => {
                                const product = this.products.find(p => p.id === id);
                                return `<div class="preview-item delete-item">
                                    <span>${product?.name || id}</span>
                                    <small class="text-muted">${product?.category || 'No category'}</small>
                                </div>`;
                            }).join('')}
                            ${productIds.length > 6 ? `<div class="preview-more">+${productIds.length - 6} more</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="confirmation-checkbox">
                        <label class="checkbox-label">
                            <input type="checkbox" id="confirm-delete">
                            <span class="checkmark"></span>
                            I understand this action is permanent and cannot be undone
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancel-bulk-delete">
                        Cancel
                    </button>
                    <button class="btn-danger" id="apply-bulk-delete" disabled>
                        <i class="fas fa-trash"></i>
                        Delete Permanently
                    </button>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('bulk-delete-modal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.setupBulkDeleteModal(productIds);
}

setupBulkDeleteModal(productIds) {
    const modal = document.getElementById('bulk-delete-modal');
    const applyBtn = document.getElementById('apply-bulk-delete');
    const cancelBtn = document.getElementById('cancel-bulk-delete');
    const closeBtn = document.getElementById('close-bulk-delete');
    const confirmCheckbox = document.getElementById('confirm-delete');

    confirmCheckbox?.addEventListener('change', (e) => {
        applyBtn.disabled = !e.target.checked;
    });

    applyBtn?.addEventListener('click', () => {
        this.executeBulkDeleteUpdate(productIds);
        modal.remove();
    });

    const closeModal = () => modal.remove();
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// ===== ADVANCED BULK SELECTION FEATURES =====

getSelectedProducts() {
    return Array.from(document.querySelectorAll('.product-checkbox:checked'))
        .filter(checkbox => checkbox.closest('tr') !== null) // Only table checkboxes
        .map(checkbox => {
            const productId = checkbox.dataset.id;
            return this.products.find(p => p.id === productId);
        })
        .filter(product => product !== undefined); // Remove undefined
}

showBulkEditModal(productIds) {
    const selectedProducts = this.getSelectedProducts();
    if (selectedProducts.length === 0) return;

    const modalHTML = `
        <div class="modal active" id="bulk-edit-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Bulk Edit ${selectedProducts.length} Products</h3>
                    <button class="modal-close" id="close-bulk-edit">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Update Field</label>
                        <select id="bulk-edit-field" class="form-input">
                            <option value="">Select field to update</option>
                            <option value="price">Price</option>
                            <option value="stock">Stock Quantity</option>
                            <option value="category">Category</option>
                            <option value="featured">Featured Status</option>
                            <option value="visible">Visibility</option>
                        </select>
                    </div>
                    
                    <div id="bulk-edit-value-container" style="display: none;">
                        <div class="form-group">
                            <label id="bulk-edit-value-label">New Value</label>
                            <input type="text" id="bulk-edit-value" class="form-input">
                        </div>
                    </div>
                    
                    <div class="selected-products-preview">
                        <h4>Selected Products (${selectedProducts.length}):</h4>
                        <div class="preview-list">
                            ${selectedProducts.slice(0, 5).map(product => `
                                <div class="preview-item">${product.name}</div>
                            `).join('')}
                            ${selectedProducts.length > 5 ? `<div class="preview-more">+${selectedProducts.length - 5} more</div>` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" id="cancel-bulk-edit">Cancel</button>
                    <button class="btn-primary" id="apply-bulk-edit">Apply Changes</button>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('bulk-edit-modal');
    if (existingModal) existingModal.remove();

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.setupBulkEditModalEvents(productIds);
}

setupBulkEditModalEvents(productIds) {
    const modal = document.getElementById('bulk-edit-modal');
    const fieldSelect = document.getElementById('bulk-edit-field');
    const valueContainer = document.getElementById('bulk-edit-value-container');
    const valueInput = document.getElementById('bulk-edit-value');
    const applyBtn = document.getElementById('apply-bulk-edit');

    // Show/hide value input based on field selection
    fieldSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            valueContainer.style.display = 'block';
            // Set appropriate label and input type
            switch(e.target.value) {
                case 'price':
                    document.getElementById('bulk-edit-value-label').textContent = 'New Price ($)';
                    valueInput.type = 'number';
                    valueInput.step = '0.01';
                    valueInput.min = '0';
                    break;
                case 'stock':
                    document.getElementById('bulk-edit-value-label').textContent = 'New Stock Quantity';
                    valueInput.type = 'number';
                    valueInput.step = '1';
                    valueInput.min = '0';
                    break;
                case 'category':
                    document.getElementById('bulk-edit-value-label').textContent = 'New Category';
                    valueInput.type = 'text';
                    break;
                default:
                    valueContainer.style.display = 'none';
            }
        } else {
            valueContainer.style.display = 'none';
        }
    });

    // Apply bulk changes
    applyBtn.addEventListener('click', () => {
        const field = fieldSelect.value;
        const value = valueInput.value;

        if (!field) {
            this.showToast('Please select a field to update', 'error');
            return;
        }

        this.applyBulkFieldUpdate(productIds, field, value);
        modal.remove();
    });

    // Close modal events
    document.getElementById('close-bulk-edit').addEventListener('click', () => modal.remove());
    document.getElementById('cancel-bulk-edit').addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

applyBulkFieldUpdate(productIds, field, value) {
    const selectedProducts = this.getSelectedProducts();
    
    selectedProducts.forEach(product => {
        switch(field) {
            case 'price':
                product.price = parseFloat(value);
                break;
            case 'stock':
                product.inventory.stock = parseInt(value);
                // Update inventory system
                const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
                if (inventory[product.id]) {
                    inventory[product.id].stock = parseInt(value);
                }
                break;
            case 'category':
                product.category = value;
                break;
            case 'featured':
                product.featured = value === 'true';
                break;
            case 'visible':
                product.visible = value === 'true';
                break;
        }
    });

    // Persist changes
    this.saveProducts();
    if (field === 'stock') {
        localStorage.setItem('swiftbuy_inventory_v1', JSON.stringify(
            JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}')
        ));
    }

    // Update UI - USE NEW REFRESH SYSTEM
    this.refreshProductViews();
    
    this.showToast(`Updated ${field} for ${selectedProducts.length} products`, 'success');
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
    // REMOVE EXISTING EVENT LISTENER IF ANY
    if (this.productActionHandler) {
        document.removeEventListener('click', this.productActionHandler);
    }

    // CREATE SINGLE EVENT HANDLER
    this.productActionHandler = (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const productId = target.dataset.id;
        if (!productId) return;

        // STOP EVENT PROPAGATION TO PREVENT MULTIPLE CALLS
        e.stopPropagation();

        if (target.classList.contains('btn-quick-edit')) {
            this.openQuickEditModal(productId);
        } else if (target.classList.contains('btn-view')) {
            this.viewProductDetails(productId);
        } else if (target.classList.contains('btn-duplicate')) {
            this.safeDuplicateProduct(productId);
        } else if (target.classList.contains('btn-delete')) {
            this.deleteProduct(productId);
        }
    };

    // ADD SINGLE EVENT LISTENER
    document.addEventListener('click', this.productActionHandler);
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
    
    console.log('✅ Quick edit modal setup completed');
}

openQuickEditModal(productId) {
    console.log('🎯 openQuickEditModal called with:', productId);
    
    const product = this.products.find(p => p.id === productId);
    if (!product) {
        console.error('❌ Product not found in openQuickEditModal:', productId);
        this.showToast('Product not found', 'error');
        return;
    }

    console.log('✅ Product found for editing:', product.name);

    // Get real-time inventory data
    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
    const productInventory = inventory[productId];

    console.log('📊 Inventory data:', productInventory);

    // Populate the form fields
    const nameField = document.getElementById('edit-product-name');
    const priceField = document.getElementById('edit-product-price');
    const stockField = document.getElementById('edit-product-stock');
    const categoryField = document.getElementById('edit-product-category');
    const thresholdField = document.getElementById('edit-product-threshold');

    console.log('📝 Form fields:', {
        nameField: !!nameField,
        priceField: !!priceField,
        stockField: !!stockField,
        categoryField: !!categoryField,
        thresholdField: !!thresholdField
    });

    if (nameField) {
        nameField.value = product.name || '';
        console.log('✅ Name field set to:', product.name);
    }
    if (priceField) {
        priceField.value = product.price || '';
        console.log('✅ Price field set to:', product.price);
    }
    if (stockField) {
        const stockValue = productInventory ? productInventory.stock : product.inventory.stock;
        stockField.value = stockValue;
        console.log('✅ Stock field set to:', stockValue);
    }
    if (categoryField) {
        categoryField.value = product.category || '';
        console.log('✅ Category field set to:', product.category);
    }
    if (thresholdField) {
        const thresholdValue = productInventory ? productInventory.lowStockThreshold : product.inventory.lowStockThreshold;
        thresholdField.value = thresholdValue;
        console.log('✅ Threshold field set to:', thresholdValue);
    }

    // Set the product ID on the form
    const form = document.getElementById('quick-edit-form');
    if (form) {
        form.dataset.productId = productId;
        console.log('✅ Form product ID set to:', productId);
    } else {
        console.error('❌ Quick edit form not found!');
    }

    // Show the modal - THIS IS THE CRITICAL PART
    const modal = document.getElementById('quick-edit-modal');
    if (modal) {
        console.log('✅ Quick edit modal found, activating...');
        
        // Force the modal to be visible
        modal.classList.add('active');
        modal.style.display = 'flex'; // Force display
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        
        console.log('✅ Modal classes:', modal.className);
        console.log('✅ Modal display style:', modal.style.display);
        
        // Focus on the first field
        setTimeout(() => {
            if (nameField) {
                nameField.focus();
                nameField.select();
                console.log('✅ Name field focused');
            }
        }, 100);
    } else {
        console.error('❌ Quick edit modal element not found!');
        this.showToast('Edit modal not available', 'error');
    }
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

    console.log('🔄 QUICK EDIT SAVE:', { productId, updates });

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

    // SAVE PRODUCTS TO LOCALSTORAGE
    this.saveProducts();
    
    console.log('💾 Products saved to localStorage');

    // CLOSE MODAL
    document.getElementById('quick-edit-modal').classList.remove('active');
    
    // REFRESH INVENTORY SECTION - THIS IS THE KEY FIX!
    this.updateInventorySection();
    
    // ALSO REFRESH PRODUCTS SECTION IF WE'RE ON THAT TAB
    if (this.currentSection === 'products') {
        this.updateProductsSection();
    }
    
    this.showToast('Product updated successfully!');
    
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


viewProductDetails(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
        this.showToast('Product not found!', 'error');
        return;
    }

    // Create and show product details modal
    this.showProductDetailsModal(product);
}

showProductDetailsModal(product) {
    const modalHTML = `
        <div class="modal active" id="product-details-modal">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>Product Details - ${product.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="product-details-grid">
                        <div class="detail-section">
                            <h4>Product Information</h4>
                            <div class="detail-row">
                                <label>Name:</label>
                                <span>${product.name}</span>
                            </div>
                            <div class="detail-row">
                                <label>SKU/ID:</label>
                                <span>${product.id}</span>
                            </div>
                            <div class="detail-row">
                                <label>Category:</label>
                                <span>${product.category}</span>
                            </div>
                            <div class="detail-row">
                                <label>Price:</label>
                                <span>$${product.price}</span>
                            </div>
                            ${product.description ? `
                            <div class="detail-row">
                                <label>Description:</label>
                                <span>${product.description}</span>
                            </div>
                            ` : ''}
                        </div>

                        <div class="detail-section">
                            <h4>Inventory</h4>
                            <div class="detail-row">
                                <label>Current Stock:</label>
                                <span>${product.inventory.stock}</span>
                            </div>
                            <div class="detail-row">
                                <label>Low Stock Threshold:</label>
                                <span>${product.inventory.lowStockThreshold}</span>
                            </div>
                            <div class="detail-row">
                                <label>Status:</label>
                                <span class="status-badge ${product.inventory.stock === 0 ? 'out-of-stock' : product.inventory.stock <= product.inventory.lowStockThreshold ? 'low-stock' : 'in-stock'}">
                                    ${product.inventory.stock === 0 ? 'Out of Stock' : product.inventory.stock <= product.inventory.lowStockThreshold ? 'Low Stock' : 'In Stock'}
                                </span>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4>Performance</h4>
                            <div class="detail-row">
                                <label>Rating:</label>
                                <span>${product.rating?.average || 0}/5 (${product.rating?.count || 0} reviews)</span>
                            </div>
                            <div class="detail-row">
                                <label>Sales Count:</label>
                                <span>${this.getProductSalesCount(product.id)}</span>
                            </div>
                            <div class="detail-row">
                                <label>Total Revenue:</label>
                                <span>$${this.getProductRevenue(product.id)}</span>
                            </div>
                        </div>

                        <div class="detail-section full-width">
                            <h4>Product Image</h4>
                            <div class="product-image-large">
                                <img src="${product.image}" alt="${product.name}" 
                                     onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">
                        Close
                    </button>
                    <button class="btn-primary" onclick="adminDashboard.openQuickEditModal('${product.id}'); this.closest('.modal').remove()">
                        <i class="fas fa-edit"></i>
                        Edit Product
                    </button>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('product-details-modal');
    if (existingModal) existingModal.remove();

    // Add new modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

duplicateProduct(productId) {
    // SAFETY CHECK: Prevent multiple rapid clicks
    if (this.duplicating) {
        this.showToast('Please wait, duplication in progress...', 'info');
        return;
    }
    
    this.duplicating = true;
    
    const originalProduct = this.products.find(p => p.id === productId);
    if (!originalProduct) {
        this.showToast('Product not found!', 'error');
        this.duplicating = false;
        return;
    }

    console.log('🔄 Starting duplication of:', originalProduct.name);
    
    try {
        // Create ONLY ONE duplicate
        const duplicate = JSON.parse(JSON.stringify(originalProduct));
        duplicate.id = `COPY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        duplicate.name = `${originalProduct.name} (Copy)`;
        duplicate.createdAt = new Date().toISOString();
        duplicate.rating = { average: 0, count: 0 };
        
        console.log('📦 Created duplicate:', duplicate.id);
        
        // Add ONLY ONE product to array
        this.products.push(duplicate);
        console.log('📊 Products count after duplication:', this.products.length);
        
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
        console.log('✅ SINGLE product duplicated successfully');
        
    } catch (error) {
        console.error('❌ Duplication error:', error);
        this.showToast('Error duplicating product', 'error');
    } finally {
        this.duplicating = false;
    }
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
    
    // Count sales by category from orders
    this.orders.forEach(order => {
        order.order.items.forEach(item => {
            // Find product category
            const product = this.products.find(p => p.id === item.id);
            const category = product?.category || 'Unknown';
            
            if (!categorySales[category]) {
                categorySales[category] = 0;
            }
            categorySales[category] += (item.price_cents * item.quantity) / 100;
        });
    });

    // If no data, return empty but valid structure
    if (Object.keys(categorySales).length === 0) {
        return {
            labels: ['No Data'],
            values: [1] // Single value for placeholder
        };
    }

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
    this.renderInventoryTableView();
    this.renderInventoryMobileCards();
    this.setupInventoryEventListeners(); // This now includes the enhanced actions
    
    // Hide loading and empty states if we have products
    if (this.products.length > 0) {
        const emptyState = document.getElementById('inventory-empty');
        const loadingState = document.getElementById('inventory-loading');
        if (emptyState) emptyState.style.display = 'none';
        if (loadingState) loadingState.style.display = 'none';
    }
}

renderInventoryTableView() {
    const container = document.getElementById('inventory-table');
    if (!container) return;

    const tbody = container.querySelector('tbody');
    
    // Get real-time inventory data
    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
    
    if (this.products.length === 0) {
        this.showInventoryEmptyState();
        return;
    }

    tbody.innerHTML = this.products.map(product => {
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
                <div class="product-info-cell">
                    <img src="${product.image}" alt="${product.name}" class="table-product-image" 
                         onerror="this.src='https://via.placeholder.com/40x40?text=P'">
                    <div class="table-product-details">
                        <span class="table-product-name">${product.name}</span>
                        <span class="table-product-sku">${product.id}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="text-muted">${product.id}</span>
            </td>
            <td>
                <span class="text-capitalize">${product.category}</span>
            </td>
            <td>
                <span class="${realTimeStock <= lowStockThreshold ? 'text-warning' : 'text-success'}">
                    <strong>${realTimeStock}</strong>
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
                    <button class="btn-action restock-item" data-id="${product.id}" title="Restock">
                        <i class="fas fa-boxes"></i>
                    </button>
                    <button class="btn-action edit-item" data-id="${product.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

renderInventoryMobileCards() {
    const container = document.getElementById('inventory-mobile-cards');
    if (!container) return;

    // Get real-time inventory data
    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
    
    if (this.products.length === 0) {
        return;
    }

    container.innerHTML = this.products.map(product => {
        const productInventory = inventory[product.id];
        const realTimeStock = productInventory ? productInventory.stock : product.inventory.stock;
        const lowStockThreshold = productInventory ? productInventory.lowStockThreshold : product.inventory.lowStockThreshold;
        
        const status = realTimeStock === 0 ? 'out-of-stock' : 
                      realTimeStock <= lowStockThreshold ? 'low-stock' : 'in-stock';
        const statusText = realTimeStock === 0 ? 'Out of Stock' : 
                          realTimeStock <= lowStockThreshold ? 'Low Stock' : 'In Stock';

        return `
        <div class="inventory-card" data-id="${product.id}">
            <div class="inventory-card-header">
                <div class="inventory-card-product">
                    <strong>${product.name}</strong>
                    <span class="sku">SKU: ${product.id}</span>
                    <span class="text-capitalize text-muted">${product.category}</span>
                </div>
                <div class="inventory-card-status">
                    <span class="status-badge ${status}">${statusText}</span>
                </div>
            </div>
            
            <div class="inventory-card-details">
                <div class="inventory-card-detail">
                    <span class="inventory-card-label">Current Stock</span>
                    <span class="inventory-card-value ${realTimeStock <= lowStockThreshold ? 'text-warning' : 'text-success'}">
                        ${realTimeStock}
                    </span>
                </div>
                <div class="inventory-card-detail">
                    <span class="inventory-card-label">Threshold</span>
                    <span class="inventory-card-value">${lowStockThreshold}</span>
                </div>
            </div>
            
            <div class="inventory-card-actions">
                <button class="btn-action restock-item" data-id="${product.id}" title="Restock">
                    <i class="fas fa-boxes"></i>
                </button>
                <button class="btn-action edit-item" data-id="${product.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

setupInventoryEventListeners() {
    // Refresh inventory button
    const refreshBtn = document.getElementById('refresh-inventory');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            this.updateInventorySection();
            this.showToast('Inventory refreshed');
        });
    }

    // Restock and edit buttons (works for both table and cards)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.restock-item')) {
            const productId = e.target.closest('.restock-item').dataset.id;
            this.showRestockModal(productId);
        } else if (e.target.closest('.edit-item')) {
            const productId = e.target.closest('.edit-item').dataset.id;
            this.editInventoryItem(productId);
        }
    });
}

// Add these new methods for inventory actions:

showRestockModal(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
        this.showToast('Product not found', 'error');
        return;
    }

    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
    const currentStock = inventory[product.id] ? inventory[product.id].stock : product.inventory.stock;

    const modalHTML = `
        <div class="modal active" id="restock-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Restock ${product.name}</h3>
                    <button class="modal-close" id="close-restock-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="restock-quantity">
                            <i class="fas fa-boxes"></i>
                            Quantity to Add
                        </label>
                        <input type="number" 
                               id="restock-quantity" 
                               class="form-input" 
                               min="1" 
                               max="1000"
                               value="10"
                               placeholder="Enter quantity..."
                               autofocus>
                        <div class="form-hint">
                            <i class="fas fa-info-circle"></i>
                            Current stock: <strong>${currentStock}</strong> units
                        </div>
                    </div>
                    
                    <div class="inventory-preview">
                        <div class="preview-item">
                            <img src="${product.image}" alt="${product.name}" 
                                 onerror="this.src='https://via.placeholder.com/50x50?text=P'">
                            <div class="preview-details">
                                <strong>${product.name}</strong>
                                <span>SKU: ${product.id}</span>
                                <span>Category: ${product.category}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancel-restock">
                        Cancel
                    </button>
                    <button class="btn-primary" id="confirm-restock">
                        <i class="fas fa-boxes"></i>
                        Restock Product
                    </button>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('restock-modal');
    if (existingModal) existingModal.remove();

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup event listeners for the modal
    this.setupRestockModalEvents(productId, currentStock);
}

setupRestockModalEvents(productId, currentStock) {
    const modal = document.getElementById('restock-modal');
    const quantityInput = document.getElementById('restock-quantity');
    const confirmBtn = document.getElementById('confirm-restock');
    const cancelBtn = document.getElementById('cancel-restock');
    const closeBtn = document.getElementById('close-restock-modal');

    // Focus on quantity input
    setTimeout(() => {
        quantityInput?.focus();
        quantityInput?.select();
    }, 100);

    // Confirm restock
    confirmBtn?.addEventListener('click', () => {
        const quantity = parseInt(quantityInput.value);
        
        if (!quantity || quantity < 1) {
            this.showToast('Please enter a valid quantity', 'error');
            quantityInput.focus();
            return;
        }

        if (quantity > 1000) {
            this.showToast('Maximum restock quantity is 1000 units', 'error');
            quantityInput.focus();
            return;
        }

        this.executeRestock(productId, quantity);
        modal.remove();
    });

    // Enter key support
    quantityInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });

    // Close modal
    const closeModal = () => modal.remove();
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

executeRestock(productId, quantity) {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
        this.showToast('Product not found', 'error');
        return;
    }

    // Update inventory in memory
    const inventory = JSON.parse(localStorage.getItem('swiftbuy_inventory_v1') || '{}');
    
    if (inventory[productId]) {
        inventory[productId].stock += quantity;
    } else {
        inventory[productId] = {
            stock: quantity,
            lowStockThreshold: product.inventory.lowStockThreshold,
            reserved: 0
        };
    }

    // Update product data
    product.inventory.stock = inventory[productId].stock;

    // Save to localStorage
    localStorage.setItem('swiftbuy_inventory_v1', JSON.stringify(inventory));
    this.saveProducts();

    // Update UI
    this.updateInventorySection();
    
    this.showToast(`✅ Restocked ${quantity} units of "${product.name}"`, 'success');
    console.log(`🔄 Restocked ${product.name}: +${quantity} units`);
}

editInventoryItem(productId) {
    console.log('🔄 EDIT BUTTON CLICKED - Product ID:', productId);
    
    const product = this.products.find(p => p.id === productId);
    if (!product) {
        console.error('❌ Product not found:', productId);
        this.showToast('Product not found', 'error');
        return;
    }

    console.log('✅ Product found:', product.name);
    
    // Close any open modals first
    const existingModal = document.getElementById('restock-modal');
    if (existingModal) {
        console.log('🗑️ Closing restock modal');
        existingModal.remove();
    }

    // Check if quick edit modal element exists
    const quickEditModal = document.getElementById('quick-edit-modal');
    if (!quickEditModal) {
        console.error('❌ Quick edit modal element not found in DOM!');
        this.showToast('Edit feature not available', 'error');
        return;
    }

    console.log('✅ Quick edit modal element found');
    
    // Check if openQuickEditModal method exists
    if (typeof this.openQuickEditModal !== 'function') {
        console.error('❌ openQuickEditModal method not found!');
        this.showToast('Edit method not available', 'error');
        return;
    }

    console.log('✅ openQuickEditModal method exists, calling it...');
    
    // Open the quick edit modal
    this.openQuickEditModal(productId);
    this.showToast(`Editing ${product.name}`);
    
    console.log('✅ Edit process completed');
}

showInventoryEmptyState() {
    const tableBody = document.getElementById('inventory-table')?.querySelector('tbody');
    const mobileCards = document.getElementById('inventory-mobile-cards');
    const emptyState = document.getElementById('inventory-empty');
    
    if (tableBody) tableBody.innerHTML = '';
    if (mobileCards) mobileCards.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
}

restockInventoryItem(productId) {
    const product = this.products.find(p => p.id === productId);
    if (product) {
        this.showToast(`Restocking ${product.name}...`);
        // Implement restock logic here
        console.log('Restocking product:', productId);
    }
}


updateCustomersSection() {
    this.updateCustomerStats();
    this.renderCustomersTableView();
    this.renderCustomersMobileCards();
    this.setupCustomerEventListeners();
}

renderCustomersTableView(customersToShow = this.customers) {
    const container = document.getElementById('customers-table');
    if (!container) return;

    const tbody = container.querySelector('tbody');
    
    if (customersToShow.length === 0) {
        this.showCustomersEmptyState();
        return;
    }

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

renderCustomersMobileCards(customersToShow = this.customers) {
    const container = document.getElementById('customers-mobile-cards');
    if (!container) return;

    if (customersToShow.length === 0) {
        return;
    }

    container.innerHTML = customersToShow.map(customer => {
        const tier = customer.totalSpent > 500 ? 'vip' : customer.totalSpent > 200 ? 'premium' : 'standard';
        const tierText = customer.totalSpent > 500 ? 'VIP' : customer.totalSpent > 200 ? 'Premium' : 'Standard';
        const initials = customer.name.split(' ').map(n => n[0]).join('').toUpperCase();
        const lastActive = new Date(customer.lastOrder) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'active' : 'inactive';
        const statusIcon = lastActive === 'active' ? 'fa-circle text-success' : 'fa-circle text-muted';

        return `
        <div class="customer-card" data-email="${customer.email}">
            <div class="customer-card-header">
                <div class="customer-card-info">
                    <div class="customer-card-name">
                        ${customer.name}
                        <span class="customer-tier tier-${tier}">${tierText}</span>
                    </div>
                    <div class="customer-card-email">${customer.email}</div>
                    <div class="customer-card-contact">
                        <span><i class="fas fa-phone"></i> ${customer.phone || 'No phone'}</span>
                        <span><i class="fas ${statusIcon}"></i> ${lastActive === 'active' ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
                <div class="customer-avatar">${initials}</div>
            </div>
            
            <div class="customer-card-stats">
                <div class="customer-card-stat">
                    <span class="customer-card-stat-label">Total Orders</span>
                    <span class="customer-card-stat-value">${customer.orders}</span>
                </div>
                <div class="customer-card-stat">
                    <span class="customer-card-stat-label">Total Spent</span>
                    <span class="customer-card-stat-value">$${customer.totalSpent.toFixed(2)}</span>
                </div>
                <div class="customer-card-stat">
                    <span class="customer-card-stat-label">Avg Order</span>
                    <span class="customer-card-stat-value">$${customer.averageOrderValue.toFixed(2)}</span>
                </div>
                <div class="customer-card-stat">
                    <span class="customer-card-stat-label">Last Active</span>
                    <span class="customer-card-stat-value">${this.formatTimeAgo(customer.lastOrder)}</span>
                </div>
            </div>
            
            <div class="customer-card-actions">
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
        </div>
        `;
    }).join('');
}

showCustomersEmptyState() {
    const tableBody = document.getElementById('customers-table')?.querySelector('tbody');
    const mobileCards = document.getElementById('customers-mobile-cards');
    const emptyState = document.getElementById('customers-empty');
    
    if (tableBody) tableBody.innerHTML = '';
    if (mobileCards) mobileCards.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
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

// Enhanced customer action handlers
viewCustomerProfile(email) {
    console.log('👤 View customer profile:', email);
    
    const customer = this.customers.find(c => c.email === email);
    if (!customer) {
        this.showToast('Customer not found', 'error');
        return;
    }

    // Get customer's orders
    const customerOrders = this.orders.filter(order => order.shipping.email === email);
    const totalRevenue = customerOrders.reduce((sum, order) => sum + order.order.total, 0);
    const initials = customer.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const tier = customer.totalSpent > 500 ? 'vip' : customer.totalSpent > 200 ? 'premium' : 'standard';
    const tierText = customer.totalSpent > 500 ? 'VIP' : customer.totalSpent > 200 ? 'Premium' : 'Standard';

    const profileHTML = `
        <div class="customer-profile-header">
            <div class="customer-profile-avatar">${initials}</div>
            <div class="customer-profile-info">
                <h2 class="customer-profile-name">${customer.name}</h2>
                <div class="customer-profile-email">${customer.email}</div>
                <div class="customer-profile-tier tier-${tier}">${tierText} Customer</div>
            </div>
        </div>

        <div class="customer-profile-stats">
            <div class="customer-profile-stat">
                <span class="customer-profile-stat-value">${customer.orders}</span>
                <span class="customer-profile-stat-label">Total Orders</span>
            </div>
            <div class="customer-profile-stat">
                <span class="customer-profile-stat-value">$${customer.totalSpent.toFixed(2)}</span>
                <span class="customer-profile-stat-label">Total Spent</span>
            </div>
            <div class="customer-profile-stat">
                <span class="customer-profile-stat-value">$${customer.averageOrderValue.toFixed(2)}</span>
                <span class="customer-profile-stat-label">Avg Order Value</span>
            </div>
            <div class="customer-profile-stat">
                <span class="customer-profile-stat-value">${this.formatTimeAgo(customer.lastOrder)}</span>
                <span class="customer-profile-stat-label">Last Active</span>
            </div>
        </div>

        <div class="customer-contact-info">
            <h4>Contact Information</h4>
            <div class="form-row">
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" class="form-input" value="${customer.phone || 'Not provided'}" readonly>
                </div>
                <div class="form-group">
                    <label>First Order</label>
                    <input type="text" class="form-input" value="${this.formatDate(customer.firstOrder)}" readonly>
                </div>
            </div>
        </div>

        ${customerOrders.length > 0 ? `
        <div class="customer-orders-section">
            <h4>Recent Orders (${customerOrders.length})</h4>
            <div class="customer-orders-list">
                ${customerOrders.slice(0, 5).map(order => `
                    <div class="customer-order-item">
                        <div class="customer-order-info">
                            <div class="customer-order-id">Order #${order.order.orderId}</div>
                            <div class="customer-order-date">${this.formatDate(order.order.timestamp)} • ${order.order.items.length} items</div>
                        </div>
                        <div class="customer-order-amount">$${order.order.total.toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : '<p class="text-muted">No orders found for this customer.</p>'}
    `;

    // Populate and show modal
    document.getElementById('customer-profile-content').innerHTML = profileHTML;
    document.getElementById('customer-profile-modal').classList.add('active');
    document.getElementById('customer-profile-modal').dataset.customerEmail = email;

    this.showToast(`Viewing ${customer.name}'s profile`);
}

sendCustomerEmail(email) {
    console.log('📧 Send email to:', email);
    
    const customer = this.customers.find(c => c.email === email);
    if (!customer) {
        this.showToast('Customer not found', 'error');
        return;
    }

    // Populate email form
    document.getElementById('email-to').value = email;
    document.getElementById('email-subject').value = '';
    document.getElementById('email-message').value = '';
    document.getElementById('email-template').value = '';

    // Show email modal
    document.getElementById('email-customer-modal').classList.add('active');
    document.getElementById('email-customer-modal').dataset.customerEmail = email;

    // Focus on subject field
    setTimeout(() => {
        document.getElementById('email-subject').focus();
    }, 100);

    this.showToast(`Preparing email to ${customer.name}`);
}

editCustomer(email) {
    console.log('✏️ Edit customer:', email);
    
    const customer = this.customers.find(c => c.email === email);
    if (!customer) {
        this.showToast('Customer not found', 'error');
        return;
    }

    // Populate edit form
    document.getElementById('edit-customer-name').value = customer.name;
    document.getElementById('edit-customer-email').value = customer.email;
    document.getElementById('edit-customer-phone').value = customer.phone || '';
    
    const tier = customer.totalSpent > 500 ? 'vip' : customer.totalSpent > 200 ? 'premium' : 'standard';
    document.getElementById('edit-customer-tier').value = tier;
    document.getElementById('edit-customer-notes').value = customer.notes || '';

    // Show edit modal
    document.getElementById('edit-customer-modal').classList.add('active');
    document.getElementById('edit-customer-modal').dataset.customerEmail = email;

    this.showToast(`Editing ${customer.name}'s details`);
}

// ===== ENHANCED ACTION BUTTONS SYSTEM =====
setupEnhancedActionButtons() {
    console.log('🔧 Setting up enhanced action buttons...');
    
    // Enhanced product action buttons with loading states
    this.setupEnhancedProductActions();
    
    // Enhanced order action buttons
    this.setupEnhancedOrderActions();
    
    // Enhanced customer action buttons  
    this.setupEnhancedCustomerActions();
    
    // Enhanced inventory action buttons
    this.setupEnhancedInventoryActions();
    
    console.log('✅ Enhanced action buttons setup completed');
}

// Enhanced product actions with loading states
setupEnhancedProductActions() {
    console.log('📦 Setting up enhanced product actions...');
    
    // Add loading states to product action buttons
    document.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        // Product quick edit with loading state
        if (target.classList.contains('btn-quick-edit')) {
            const productId = target.dataset.id;
            if (productId && !target.classList.contains('loading')) {
                target.classList.add('loading');
                target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                try {
                    await this.openQuickEditModal(productId);
                } finally {
                    target.classList.remove('loading');
                    target.innerHTML = '<i class="fas fa-edit"></i>';
                }
            }
        }
        
        // Product duplicate with loading state
        if (target.classList.contains('btn-duplicate')) {
            const productId = target.dataset.id;
            if (productId && !target.classList.contains('loading')) {
                target.classList.add('loading');
                target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                try {
                    await this.safeDuplicateProduct(productId);
                } finally {
                    target.classList.remove('loading');
                    target.innerHTML = '<i class="fas fa-copy"></i>';
                }
            }
        }
    });
    
    console.log('✅ Enhanced product actions ready');
}

// Enhanced order actions
setupEnhancedOrderActions() {
    console.log('📋 Setting up enhanced order actions...');
    
    // Order status updates with confirmation
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        if (target.classList.contains('update-status')) {
            const orderId = target.dataset.id;
            if (orderId) {
                // Add visual feedback
                target.classList.add('processing');
                target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                setTimeout(() => {
                    target.classList.remove('processing');
                    target.innerHTML = '<i class="fas fa-edit"></i>';
                }, 1000);
            }
        }
    });
    
    console.log('✅ Enhanced order actions ready');
}

// Enhanced customer actions
setupEnhancedCustomerActions() {
    console.log('👥 Setting up enhanced customer actions...');
    
    // Customer actions with tooltips and confirmation
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        // Email customer with loading state
        if (target.classList.contains('btn-email')) {
            const email = target.dataset.email;
            if (email && !target.classList.contains('loading')) {
                target.classList.add('loading');
                target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                setTimeout(() => {
                    this.sendCustomerEmail(email);
                    target.classList.remove('loading');
                    target.innerHTML = '<i class="fas fa-envelope"></i>';
                }, 500);
            }
        }
    });
    
    console.log('✅ Enhanced customer actions ready');
}

// Enhanced inventory actions
setupEnhancedInventoryActions() {
    console.log('📊 Setting up enhanced inventory actions...');
    
    // Inventory actions with real-time feedback
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        // Restock action with loading state
        if (target.classList.contains('restock-item')) {
            const productId = target.dataset.id;
            if (productId && !target.classList.contains('loading')) {
                target.classList.add('loading');
                target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                setTimeout(() => {
                    this.showRestockModal(productId);
                    target.classList.remove('loading');
                    target.innerHTML = '<i class="fas fa-boxes"></i>';
                }, 300);
            }
        }
    });
    
    console.log('✅ Enhanced inventory actions ready');
}

// Fixed customer action modals setup
setupCustomerActionModals() {
    console.log('🔧 Setting up customer action modals...');
    
    // Customer Profile Modal
    this.setupModalEventListeners('customer-profile-modal', [
        'close-customer-profile',
        'close-customer-profile-btn'
    ]);
    
    // Email Modal
    this.setupModalEventListeners('email-customer-modal', [
        'close-email-modal',
        'cancel-email'
    ]);
    
    // Edit Customer Modal
    this.setupModalEventListeners('edit-customer-modal', [
        'close-edit-customer',
        'cancel-edit-customer'
    ]);

    // Email from profile button
    const emailFromProfileBtn = document.getElementById('email-customer-from-profile');
    if (emailFromProfileBtn) {
        emailFromProfileBtn.addEventListener('click', () => {
            const email = document.getElementById('customer-profile-modal').dataset.customerEmail;
            document.getElementById('customer-profile-modal').classList.remove('active');
            setTimeout(() => this.sendCustomerEmail(email), 300);
        });
    }

    // Send email button
    const sendEmailBtn = document.getElementById('send-email');
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', () => {
            this.sendEmailToCustomer();
        });
    }

    // Save customer changes button
    const saveEditBtn = document.getElementById('save-customer-changes');
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', () => {
            this.saveCustomerChanges();
        });
    }

    // Email template selector
    const emailTemplateSelect = document.getElementById('email-template');
    if (emailTemplateSelect) {
        emailTemplateSelect.addEventListener('change', (e) => {
            this.applyEmailTemplate(e.target.value);
        });
    }

    console.log('✅ Customer action modals setup completed');
}

// ===== ENHANCED SETTINGS MANAGEMENT SYSTEM =====

// Add this method - it doesn't exist yet
saveAllSettings() {
    console.log('💾 Starting advanced settings save...');
    
    try {
        const settings = this.collectAllSettings();
        
        // Validate critical settings
        if (!this.validateSettings(settings)) {
            throw new Error('Settings validation failed');
        }
        
        // Save to localStorage with versioning
        const settingsPackage = {
            data: settings,
            version: '1.0.0',
            lastSaved: new Date().toISOString(),
            checksum: this.generateSettingsChecksum(settings)
        };
        
        localStorage.setItem('swiftbuy_admin_settings', JSON.stringify(settingsPackage));
        
        // Verify save worked
        const saved = this.verifySettingsSave();
        if (!saved) {
            throw new Error('Settings save verification failed');
        }
        
        // Apply settings to dashboard in real-time
        this.applySettingsToDashboard(settings);
        
        this.showToast('✅ All settings saved and applied successfully!', 'success');
        console.log('💾 Settings saved successfully:', settings);
        
        return true;
        
    } catch (error) {
        console.error('❌ Settings save error:', error);
        this.showToast(`❌ Failed to save settings: ${error.message}`, 'error');
        return false;
    }
}
// ===== REAL-TIME SETTINGS OBSERVERS =====

// Watch for system theme changes (for auto theme mode)
setupThemeObserver() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
        // Only react if theme is set to 'auto'
        const currentSettings = this.getCurrentSettings();
        if (currentSettings?.general?.theme === 'auto') {
            this.applyThemeSettings(currentSettings.general);
            this.showToast('System theme change detected', 'info', 2000);
        }
    });
}

// Get current settings from form (for real-time updates)
getCurrentSettings() {
    try {
        const saved = localStorage.getItem('swiftbuy_admin_settings');
        if (saved) {
            const settingsPackage = JSON.parse(saved);
            return settingsPackage.data;
        }
    } catch (error) {
        console.error('Error getting current settings:', error);
    }
    return null;
}

// Initialize settings observers
initSettingsObservers() {
    this.setupThemeObserver();
    console.log('👀 Settings observers initialized');
}

// Collect all settings from form fields
collectAllSettings() {
    const settings = {
        // General Settings
        general: {
            defaultDashboardView: this.getValue('default-dashboard-view'),
            dateFormat: this.getValue('date-format'),
            timezone: this.getValue('timezone'),
            theme: this.getValue('theme'),
            itemsPerPage: parseInt(this.getValue('items-per-page')) || 25,
            autoRefresh: parseInt(this.getValue('auto-refresh')) || 60,
            sessionTimeout: parseInt(this.getValue('session-timeout')) || 60,
            twoFactorAuth: this.getChecked('two-factor-auth'),
            loginNotifications: this.getChecked('login-notifications')
        },
        
        // Store Settings
        store: {
            name: this.getValue('store-name'),
            email: this.getValue('store-email'),
            phone: this.getValue('store-phone'),
            address: this.getValue('store-address'),
            currency: this.getValue('store-currency'),
            country: this.getValue('store-country'),
            language: this.getValue('store-language'),
            timeFormat: this.getValue('time-format'),
            maintenanceMode: this.getChecked('maintenance-mode'),
            guestCheckout: this.getChecked('guest-checkout'),
            customerReviews: this.getChecked('customer-reviews'),
            showInventory: this.getChecked('show-inventory')
        },
        
        // Inventory Settings
        inventory: {
            enableStockManagement: this.getChecked('enable-stock-management'),
            lowStockThreshold: parseInt(this.getValue('low-stock-threshold')) || 5,
            outOfStockThreshold: parseInt(this.getValue('out-of-stock-threshold')) || 0,
            holdStock: parseInt(this.getValue('hold-stock')) || 60,
            lowStockAlerts: this.getChecked('low-stock-alerts'),
            outOfStockAlerts: this.getChecked('out-of-stock-alerts'),
            backInStockAlerts: this.getChecked('back-in-stock-alerts'),
            alertFrequency: this.getValue('alert-frequency'),
            enableBackorders: this.getChecked('enable-backorders'),
            manageStockPerProduct: this.getChecked('manage-stock-per-product'),
            autoUpdateInventory: this.getChecked('auto-update-inventory')
        }
    };
    
    return settings;
}

// Enhanced settings loading with migration support
loadSettings() {
    console.log('📥 Loading settings...');
    
    try {
        const settingsSection = document.getElementById('settings');
        if (!settingsSection) {
            console.warn('⚠️ Settings section not found');
            return;
        }
        
        const saved = localStorage.getItem('swiftbuy_admin_settings');
        if (!saved) {
            console.log('📥 No saved settings found, using defaults');
            this.applyDefaultSettings();
            return;
        }
        
        const settingsPackage = JSON.parse(saved);
        
        // Verify settings integrity
        if (!this.verifySettingsIntegrity(settingsPackage)) {
            console.warn('⚠️ Settings integrity check failed, using defaults');
            this.applyDefaultSettings();
            return;
        }
        
        const settings = settingsPackage.data;
        this.populateSettingsForm(settings);
        
        console.log('✅ Settings loaded successfully');
        
    } catch (error) {
        console.error('❌ Settings load error:', error);
        this.showToast('Error loading settings, using defaults', 'error');
        this.applyDefaultSettings();
    }
}

// Utility methods for form handling
getValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value : '';
}

getChecked(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.checked : false;
}

setValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value;
    }
}

setChecked(elementId, checked) {
    const element = document.getElementById(elementId);
    if (element) {
        element.checked = !!checked;
    }
}

// Validate critical settings
validateSettings(settings) {
    // Store name validation
    if (!settings.store.name || settings.store.name.trim().length === 0) {
        this.showToast('Store name is required', 'error');
        return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (settings.store.email && !emailRegex.test(settings.store.email)) {
        this.showToast('Please enter a valid store email', 'error');
        return false;
    }
    
    // Positive number validations
    if (settings.inventory.lowStockThreshold < 1) {
        this.showToast('Low stock threshold must be at least 1', 'error');
        return false;
    }
    
    return true;
}

// Generate checksum for settings integrity
generateSettingsChecksum(settings) {
    const str = JSON.stringify(settings);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

// Verify settings were saved correctly
verifySettingsSave() {
    try {
        const saved = localStorage.getItem('swiftbuy_admin_settings');
        return saved !== null;
    } catch (error) {
        console.error('Settings verification error:', error);
        return false;
    }
}

// Verify settings package integrity
verifySettingsIntegrity(settingsPackage) {
    if (!settingsPackage || !settingsPackage.data) {
        return false;
    }
    
    // Verify checksum if available
    if (settingsPackage.checksum) {
        const currentChecksum = this.generateSettingsChecksum(settingsPackage.data);
        if (currentChecksum !== settingsPackage.checksum) {
            console.warn('Settings checksum mismatch');
            return false;
        }
    }
    
    return true;
}

// Populate form with settings
populateSettingsForm(settings) {
    // General Settings
    this.setValue('default-dashboard-view', settings.general?.defaultDashboardView || 'overview');
    this.setValue('date-format', settings.general?.dateFormat || 'MM/DD/YYYY');
    this.setValue('timezone', settings.general?.timezone || 'UTC-5');
    this.setValue('theme', settings.general?.theme || 'light');
    this.setValue('items-per-page', settings.general?.itemsPerPage || 25);
    this.setValue('auto-refresh', settings.general?.autoRefresh || 60);
    this.setValue('session-timeout', settings.general?.sessionTimeout || 60);
    this.setChecked('two-factor-auth', settings.general?.twoFactorAuth || false);
    this.setChecked('login-notifications', settings.general?.loginNotifications !== false);
    
    // Store Settings
    this.setValue('store-name', settings.store?.name || 'SwiftBuy');
    this.setValue('store-email', settings.store?.email || 'admin@swiftbuy.com');
    this.setValue('store-phone', settings.store?.phone || '');
    this.setValue('store-address', settings.store?.address || '');
    this.setValue('store-currency', settings.store?.currency || 'USD');
    this.setValue('store-country', settings.store?.country || 'US');
    this.setValue('store-language', settings.store?.language || 'en');
    this.setValue('time-format', settings.store?.timeFormat || '12');
    this.setChecked('maintenance-mode', settings.store?.maintenanceMode || false);
    this.setChecked('guest-checkout', settings.store?.guestCheckout !== false);
    this.setChecked('customer-reviews', settings.store?.customerReviews !== false);
    this.setChecked('show-inventory', settings.store?.showInventory !== false);
    
    // Inventory Settings
    this.setChecked('enable-stock-management', settings.inventory?.enableStockManagement !== false);
    this.setValue('low-stock-threshold', settings.inventory?.lowStockThreshold || 5);
    this.setValue('out-of-stock-threshold', settings.inventory?.outOfStockThreshold || 0);
    this.setValue('hold-stock', settings.inventory?.holdStock || 60);
    this.setChecked('low-stock-alerts', settings.inventory?.lowStockAlerts !== false);
    this.setChecked('out-of-stock-alerts', settings.inventory?.outOfStockAlerts !== false);
    this.setChecked('back-in-stock-alerts', settings.inventory?.backInStockAlerts || false);
    this.setValue('alert-frequency', settings.inventory?.alertFrequency || 'immediate');
    this.setChecked('enable-backorders', settings.inventory?.enableBackorders || false);
    this.setChecked('manage-stock-per-product', settings.inventory?.manageStockPerProduct !== false);
    this.setChecked('auto-update-inventory', settings.inventory?.autoUpdateInventory !== false);
}

// Apply default settings
applyDefaultSettings() {
    const defaultSettings = {
        general: {
            defaultDashboardView: 'overview',
            dateFormat: 'MM/DD/YYYY',
            timezone: 'UTC-5',
            theme: 'light',
            itemsPerPage: 25,
            autoRefresh: 60,
            sessionTimeout: 60,
            twoFactorAuth: false,
            loginNotifications: true
        },
        store: {
            name: 'SwiftBuy',
            email: 'admin@swiftbuy.com',
            phone: '',
            address: '',
            currency: 'USD',
            country: 'US',
            language: 'en',
            timeFormat: '12',
            maintenanceMode: false,
            guestCheckout: true,
            customerReviews: true,
            showInventory: true
        },
        inventory: {
            enableStockManagement: true,
            lowStockThreshold: 5,
            outOfStockThreshold: 0,
            holdStock: 60,
            lowStockAlerts: true,
            outOfStockAlerts: true,
            backInStockAlerts: false,
            alertFrequency: 'immediate',
            enableBackorders: false,
            manageStockPerProduct: true,
            autoUpdateInventory: true
        }
    };
    
    this.populateSettingsForm(defaultSettings);
}

// ===== ADVANCED SETTINGS APPLICATION SYSTEM =====
applySettingsToDashboard(settings) {
    console.log('🎛️ Applying advanced settings to dashboard...');
    
    try {
        // 1. THEME SYSTEM - Apply immediately
        this.applyThemeSettings(settings.general);
        
        // 2. PAGINATION - Update display limits
        this.applyPaginationSettings(settings.general);
        
        // 3. AUTO-REFRESH - Setup smart intervals
        this.applyAutoRefreshSettings(settings.general);
        
        // 4. MAINTENANCE MODE - Control store state
        this.applyMaintenanceMode(settings.store);
        
        // 5. INVENTORY ALERTS - Setup monitoring
        this.applyInventoryAlertSettings(settings.inventory);
        
        // 6. SHIPPING LOGIC - Update calculations
        this.applyShippingSettings(settings.shipping);
        
        console.log('✅ All settings applied successfully');
        
    } catch (error) {
        console.error('❌ Settings application error:', error);
        this.showToast('Error applying some settings', 'error');
    }
}

// ===== ENHANCED PAGINATION SYSTEM =====

// Update products display with pagination
updateProductsSection() {
    this.updateProductStats();
    
    // Apply pagination if setting exists
    const productsToShow = this.applyPaginationToProducts(this.products);
    this.renderProductsGridView(productsToShow);
    this.renderProductsTableView(productsToShow);
    this.setupProductEventListeners();
    this.loadProductSalesData();
}

// Apply pagination to products array
applyPaginationToProducts(products) {
    if (!this.itemsPerPage || this.itemsPerPage >= products.length) {
        return products;
    }
    
    // For now, show limited products (in real app, would have proper pagination UI)
    return products.slice(0, this.itemsPerPage);
}

// Enhanced orders table with pagination
updateOrdersTable() {
    const container = document.getElementById('orders-table');
    if (!container) return;

    const ordersToShow = this.applyPaginationToOrders(this.orders);
    const tbody = container.querySelector('tbody');
    
    tbody.innerHTML = ordersToShow.map(order => `
        <tr>
            <td><strong>${order.order.orderId}</strong></td>
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
    
    // Show pagination info
    this.showPaginationInfo('orders', this.orders.length, ordersToShow.length);
}

applyPaginationToOrders(orders) {
    if (!this.itemsPerPage || this.itemsPerPage >= orders.length) {
        return orders;
    }
    return orders.slice(0, this.itemsPerPage);
}

// Show pagination information
showPaginationInfo(section, totalItems, showingItems) {
    if (totalItems === showingItems) return;
    
    console.log(`📊 ${section}: Showing ${showingItems} of ${totalItems} items`);
    
    // In a real implementation, you'd update a pagination UI element
    const infoElement = document.getElementById(`${section}-pagination-info`);
    if (infoElement) {
        infoElement.textContent = `Showing ${showingItems} of ${totalItems}`;
    }
}
// 1. THEME SYSTEM - Real-time theme switching
applyThemeSettings(generalSettings) {
    if (!generalSettings?.theme) return;
    
    const theme = generalSettings.theme;
    const html = document.documentElement;
    
    // Remove existing theme classes
    html.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    
    // Apply new theme
    if (theme === 'auto') {
        // System preference detection
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.classList.add(isDark ? 'theme-dark' : 'theme-light');
        html.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
        html.classList.add(`theme-${theme}`);
        html.setAttribute('data-theme', theme);
    }
    
    // Update CSS variables for smooth transitions
    this.updateThemeCSSVariables(theme);
    console.log('🎨 Theme applied:', theme);
}

updateThemeCSSVariables(theme) {
    const root = document.documentElement;
    
    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.style.setProperty('--admin-bg', '#0f172a');
        root.style.setProperty('--admin-surface', '#1e293b');
        root.style.setProperty('--admin-text', '#f1f5f9');
        root.style.setProperty('--admin-text-muted', '#94a3b8');
        root.style.setProperty('--admin-border', '#334155');
    } else {
        // Light theme (default)
        root.style.setProperty('--admin-bg', '#f8fafc');
        root.style.setProperty('--admin-surface', '#ffffff');
        root.style.setProperty('--admin-text', '#1e293b');
        root.style.setProperty('--admin-text-muted', '#64748b');
        root.style.setProperty('--admin-border', '#e2e8f0');
    }
}

// 2. PAGINATION CONTROL - Dynamic items per page
applyPaginationSettings(generalSettings) {
    if (!generalSettings?.itemsPerPage) return;
    
    const itemsPerPage = generalSettings.itemsPerPage;
    
    // Store for use in data displays
    this.itemsPerPage = itemsPerPage;
    
    // Update any currently visible tables
    this.refreshCurrentDataDisplays();
    
    console.log('📊 Pagination set to:', itemsPerPage, 'items per page');
}

refreshCurrentDataDisplays() {
    // Refresh currently active section
    switch(this.currentSection) {
        case 'products':
            this.updateProductsSection();
            break;
        case 'orders':
            this.updateOrdersTable();
            break;
        case 'customers':
            this.updateCustomersSection();
            break;
        case 'inventory':
            this.updateInventorySection();
            break;
    }
}

// 3. AUTO-REFRESH - Smart dashboard updates
applyAutoRefreshSettings(generalSettings) {
    if (!generalSettings?.autoRefresh) return;
    
    const refreshInterval = generalSettings.autoRefresh * 1000; // Convert to milliseconds
    
    // Clear existing interval
    if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
    }
    
    // Only setup if interval is > 0
    if (refreshInterval > 0) {
        this.autoRefreshInterval = setInterval(() => {
            this.autoRefreshDashboard();
        }, refreshInterval);
        
        console.log('🔄 Auto-refresh enabled:', refreshInterval / 1000, 'seconds');
    } else {
        console.log('⏸️ Auto-refresh disabled');
    }
}

autoRefreshDashboard() {
    if (this.currentSection === 'dashboard') {
        this.loadAllData();
        this.showToast('Dashboard auto-refreshed', 'info', 2000);
    }
}

// 4. MAINTENANCE MODE - Store state management
applyMaintenanceMode(storeSettings) {
    if (!storeSettings) return;
    
    const maintenanceMode = storeSettings.maintenanceMode || false;
    
    // Store maintenance state for frontend integration
    localStorage.setItem('swiftbuy_maintenance_mode', maintenanceMode.toString());
    
    if (maintenanceMode) {
        console.log('🚧 Maintenance mode: ON - Store frontend would be disabled');
        // In a real system, this would communicate with the store frontend
    } else {
        console.log('🏪 Maintenance mode: OFF - Store is operational');
    }
}

// 5. INVENTORY ALERTS - Proactive monitoring
applyInventoryAlertSettings(inventorySettings) {
    if (!inventorySettings) return;
    
    // Setup low stock monitoring
    if (inventorySettings.lowStockAlerts) {
        this.setupInventoryAlerts(inventorySettings);
    } else {
        this.disableInventoryAlerts();
    }
    
    console.log('📦 Inventory alerts:', inventorySettings.lowStockAlerts ? 'ENABLED' : 'DISABLED');
}

setupInventoryAlerts(inventorySettings) {
    const threshold = inventorySettings.lowStockThreshold || 5;
    
    // Check inventory on settings change
    const lowStockItems = this.getLowStockItems();
    
    if (lowStockItems.length > 0 && inventorySettings.lowStockAlerts) {
        this.showToast(`⚠️ ${lowStockItems.length} products are low in stock!`, 'warning');
    }
}

disableInventoryAlerts() {
    // Clear any existing alert intervals
    if (this.inventoryAlertInterval) {
        clearInterval(this.inventoryAlertInterval);
    }
}

// 6. SHIPPING LOGIC - Dynamic calculations
applyShippingSettings(shippingSettings) {
    if (!shippingSettings) return;
    
    // Store shipping configuration
    this.shippingConfig = {
        standard: {
            enabled: shippingSettings.standardShipping !== false,
            cost: shippingSettings.standardShippingCost || 4.99,
            freeThreshold: shippingSettings.freeShippingThreshold || 50.00
        },
        express: {
            enabled: shippingSettings.expressShipping !== false,
            cost: shippingSettings.expressShippingCost || 9.99
        },
        international: {
            enabled: shippingSettings.internationalShipping || false,
            cost: shippingSettings.internationalShippingCost || 19.99
        }
    };
    
    console.log('🚚 Shipping settings applied:', this.shippingConfig);
}

// Utility to get calculated shipping cost
calculateShipping(total, country = 'US') {
    const config = this.shippingConfig;
    
    if (!config) {
        return 4.99; // Default fallback
    }
    
    // Free shipping threshold check
    if (config.standard.enabled && total >= config.standard.freeThreshold) {
        return 0;
    }
    
    // International shipping
    if (country !== 'US' && config.international.enabled) {
        return config.international.cost;
    }
    
    // Express shipping (customer choice in real scenario)
    if (config.express.enabled) {
        return config.express.cost;
    }
    
    // Standard shipping
    return config.standard.enabled ? config.standard.cost : 0;
}
// Helper method to setup modal event listeners
setupModalEventListeners(modalId, closeButtonIds) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`❌ Modal not found: ${modalId}`);
        return;
    }

    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Close buttons
    closeButtonIds.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        } else {
            console.warn(`⚠️ Close button not found: ${buttonId}`);
        }
    });
}

// Email functionality
sendEmailToCustomer() {
    const email = document.getElementById('email-customer-modal').dataset.customerEmail;
    const subject = document.getElementById('email-subject').value;
    const message = document.getElementById('email-message').value;

    if (!subject.trim()) {
        this.showToast('Please enter an email subject', 'error');
        document.getElementById('email-subject').focus();
        return;
    }

    if (!message.trim()) {
        this.showToast('Please enter an email message', 'error');
        document.getElementById('email-message').focus();
        return;
    }

    // Simulate sending email
    const sendBtn = document.getElementById('send-email');
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<div class="btn-loading"></div>';
    sendBtn.disabled = true;

    setTimeout(() => {
        document.getElementById('email-customer-modal').classList.remove('active');
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
        
        this.showToast(`Email sent to ${email} successfully!`);
        console.log('📧 Email sent:', { to: email, subject, message });
    }, 2000);
}

applyEmailTemplate(template) {
    const subjectField = document.getElementById('email-subject');
    const messageField = document.getElementById('email-message');

    const templates = {
        welcome: {
            subject: 'Welcome to Our Store!',
            message: 'Dear Customer,\n\nThank you for joining our store! We\'re excited to have you as part of our community.\n\nAs a welcome gift, here\'s a special discount code: WELCOME10 for 10% off your first order.\n\nHappy shopping!\n\nThe Store Team'
        },
        order_update: {
            subject: 'Your Order Update',
            message: 'Dear Customer,\n\nWe wanted to provide you with an update on your recent order.\n\nYour order is currently being processed and we\'ll notify you once it ships.\n\nThank you for your patience!\n\nThe Store Team'
        },
        shipping: {
            subject: 'Your Order Has Shipped!',
            message: 'Great news! Your order has been shipped.\n\nTracking number: [Tracking#]\nCarrier: [Carrier]\nEstimated delivery: [Date]\n\nYou can track your package using the link below:\n[Tracking Link]\n\nThank you for your order!\n\nThe Store Team'
        },
        promotion: {
            subject: 'Special Promotion Just For You!',
            message: 'Dear Valued Customer,\n\nWe\'re excited to offer you an exclusive promotion as thanks for your loyalty!\n\nUse code SPECIAL25 for 25% off your next order. This offer is valid for the next 7 days.\n\nDon\'t miss out on this special opportunity!\n\nThe Store Team'
        }
    };

    if (template && templates[template]) {
        subjectField.value = templates[template].subject;
        messageField.value = templates[template].message;
    }
}

saveCustomerChanges() {
    const originalEmail = document.getElementById('edit-customer-modal').dataset.customerEmail;
    const name = document.getElementById('edit-customer-name').value;
    const email = document.getElementById('edit-customer-email').value;
    const phone = document.getElementById('edit-customer-phone').value;
    const tier = document.getElementById('edit-customer-tier').value;
    const notes = document.getElementById('edit-customer-notes').value;

    // Find and update customer
    const customerIndex = this.customers.findIndex(c => c.email === originalEmail);
    if (customerIndex !== -1) {
        this.customers[customerIndex].name = name;
        this.customers[customerIndex].email = email;
        this.customers[customerIndex].phone = phone;
        this.customers[customerIndex].notes = notes;
        
        // Update orders with new email if changed
        if (originalEmail !== email) {
            this.orders.forEach(order => {
                if (order.shipping.email === originalEmail) {
                    order.shipping.email = email;
                }
            });
            localStorage.setItem('swiftbuy_orders', JSON.stringify(this.orders));
        }

        this.showToast('Customer updated successfully!');
        document.getElementById('edit-customer-modal').classList.remove('active');
        
        // Refresh customer section
        this.updateCustomersSection();
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
    // Prevent multiple simultaneous analytics loads
    if (this.loadingAnalytics) return;
    this.loadingAnalytics = true;
    
    this.currentDateRange = '30d';
    
    console.log('📈 Loading analytics section...');
    
    // Show responsive layout hint
    this.showResponsiveLayoutHint();
    
    // Show loading state
    this.showAnalyticsLoadingState();
    
    // Progressive loading for better performance
    setTimeout(() => {
        this.initializeAnalyticsDashboard();
        this.setupAnalyticsEventListeners();
        
        // Test responsiveness after a short delay
        setTimeout(() => {
            this.testAnalyticsResponsiveness();
            this.loadingAnalytics = false;
        }, 1000);
    }, 100);
}

showAnalyticsLoadingState() {
    const analyticsSection = document.getElementById('analytics');
    if (!analyticsSection) return;
    
    // Add loading indicator for heavy components
    const loadingHTML = `
        <div class="analytics-loading" style="
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 200px; 
            color: var(--admin-text-muted);
        ">
            <div style="text-align: center;">
                <i class="fas fa-chart-line fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Loading advanced analytics...</p>
            </div>
        </div>
    `;
    
    // Only show if charts aren't already loaded
    if (!document.getElementById('revenue-analytics-chart')) {
        const chartContainers = analyticsSection.querySelectorAll('.chart-card');
        chartContainers.forEach(container => {
            const existingCanvas = container.querySelector('canvas');
            if (!existingCanvas) {
                container.insertAdjacentHTML('beforeend', loadingHTML);
            }
        });
    }
}
initializeAnalyticsDashboard() {
    this.updateKPIMetrics();
    this.renderRevenueAnalyticsChart();
    this.renderCategoryChart(); // This should create the category chart
    this.renderTrafficChart();
    this.updateFunnelData();
    this.updateTopProducts();
    this.updateAdvancedMetrics();
    this.startRealTimeActivity();
    this.updateRealTimeActivities();
    
    // Add debug call
    setTimeout(() => {
        this.debugCategoryChart();
    }, 1000);
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

// Update revenue chart with mobile optimization
renderRevenueAnalyticsChart() {
    const ctx = document.getElementById('revenue-analytics-chart');
    if (!ctx) return;

    if (this.revenueAnalyticsChart) {
        this.revenueAnalyticsChart.destroy();
    }

    const data = this.generateRevenueAnalyticsData();
    const options = this.getChartOptions();

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
                    borderWidth: window.innerWidth <= 768 ? 2 : 3,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Orders',
                    data: data.orders,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    borderWidth: window.innerWidth <= 768 ? 1 : 2,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...options,
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
                        display: window.innerWidth > 480,
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
                        display: window.innerWidth > 480,
                        text: 'Orders'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
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
    if (!ctx) {
        console.error('❌ Category chart canvas not found!');
        return;
    }

    // Destroy existing chart
    if (this.categoryChart) {
        this.categoryChart.destroy();
    }

    const categoryData = this.generateCategoryData();
    const options = this.getChartOptions();

    console.log('🎨 Rendering Category Chart with data:', categoryData);

    // Ensure we have data to display
    if (categoryData.labels.length === 0 || categoryData.values.length === 0) {
        console.warn('⚠️ No category data available, showing placeholder');
        this.showCategoryChartPlaceholder();
        return;
    }

    try {
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
                ...options,
                plugins: {
                    ...options.plugins,
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
        
        console.log('✅ Category chart rendered successfully');
    } catch (error) {
        console.error('❌ Category chart rendering error:', error);
        this.showCategoryChartPlaceholder();
    }
}


showCategoryChartPlaceholder() {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;
    
    const placeholderHTML = `
        <div style="
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            height: 200px; 
            color: var(--admin-text-muted);
            text-align: center;
            padding: 2rem;
        ">
            <i class="fas fa-chart-pie" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <h4>No Sales Data Yet</h4>
            <p>Sales by category will appear here once you have orders.</p>
            <small>Make some sales to see category distribution</small>
        </div>
    `;
    
    // Replace canvas with placeholder
    ctx.style.display = 'none';
    ctx.insertAdjacentHTML('afterend', placeholderHTML);
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
    console.log('⚙️ Updating settings section...');
    
    // Check if settings section exists
    const settingsSection = document.getElementById('settings');
    if (!settingsSection) {
        console.error('❌ Settings section not found in DOM');
        return;
    }
    
    // Load settings only if section is visible
    this.loadSettings();
    this.setupSettingsEventListeners();
    this.initializeSettingsTabs();
    
    console.log('✅ Settings section updated');
}



setupSettingsEventListeners() {
    // Settings navigation
    document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
        item.addEventListener('click', (e) => {
            this.switchSettingsTab(e.target.closest('.nav-item').dataset.tab);
        });
    });

   // Save settings button
document.getElementById('save-settings')?.addEventListener('click', () => {
    this.saveAllSettings();
});

// Reset settings button
document.getElementById('reset-settings')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
        localStorage.removeItem('swiftbuy_admin_settings');
        this.applyDefaultSettings();
        this.showToast('Settings reset to defaults', 'success');
    }
});
    // ADD THIS INSTEAD:
    this.setupSmartSettingsSaving(); // ← USE THE CORRECT METHOD NAME
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


    // ===== ADVANCED SETTINGS RESPONSIVENESS =====
setupAdvancedSettingsResponsiveness() {
    console.log('🎛️ Initializing advanced settings responsiveness...');
    
    // Track active tab for mobile navigation
    this.setupMobileSettingsNavigation();
    
    // Enhanced form validation for mobile
    this.setupMobileFormValidation();
    
    // Settings save optimization
    this.setupSmartSettingsSaving();
    
    console.log('✅ Advanced settings responsiveness ready');
}

setupMobileSettingsNavigation() {
    const settingsNav = document.querySelector('.settings-nav');
    if (!settingsNav) return;
    
    // Add scroll indicators for mobile
    this.setupScrollIndicators(settingsNav);
    
    // Enhanced tab switching for mobile
    document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
        item.addEventListener('click', (e) => {
            const tabId = e.currentTarget.dataset.tab;
            this.switchSettingsTab(tabId);
            
            // Scroll to top on mobile when switching tabs
            if (window.innerWidth < 1024) {
                document.querySelector('.settings-content').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

setupScrollIndicators(container) {
    const updateIndicators = () => {
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        // Show/hide scroll indicators based on position
        container.style.setProperty('--scroll-position', scrollLeft / (scrollWidth - clientWidth));
    };
    
    container.addEventListener('scroll', updateIndicators);
    window.addEventListener('resize', updateIndicators);
    updateIndicators();
}

setupMobileFormValidation() {
    // Enhanced validation for mobile forms
    document.querySelectorAll('.setting-input').forEach(input => {
        input.addEventListener('invalid', (e) => {
            e.preventDefault();
            this.showMobileValidationError(input);
        });
        
        input.addEventListener('blur', (e) => {
            this.validateSettingInput(e.target);
        });
    });
}

showMobileValidationError(input) {
    const errorMessage = input.validationMessage;
    if (errorMessage && window.innerWidth < 768) {
        this.showToast(`⚠️ ${errorMessage}`, 'error', 4000);
        
        // Scroll to error field on mobile
        input.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
        input.focus();
    }
}

validateSettingInput(input) {
    if (!input.checkValidity()) {
        input.classList.add('error');
    } else {
        input.classList.remove('error');
    }
}

// ===== SMART SETTINGS SAVING =====
setupSmartSettingsSaving() {
    let saveTimeout;
    
    console.log('💾 Initializing smart settings saving...');
    
    // Auto-save on input change with debouncing
    document.querySelectorAll('.setting-input, .toggle-input').forEach(input => {
        input.addEventListener('change', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                this.autoSaveSetting(input);
            }, 1500);
        });
    });
}

autoSaveSetting(input) {
    console.log('💾 Auto-saving setting change...', input.name || input.id);
    // This would typically save to backend
    this.showToast('Setting saved automatically', 'success', 2000);
}

autoSaveSetting(input) {
    console.log('💾 Auto-saving setting change...');
    // This would typically save to backend
    this.showToast('Setting saved automatically', 'success', 2000);
}
    // Place this AFTER other utility methods but BEFORE chart rendering methods

// Enhanced mobile-optimized chart configuration
getChartOptions() {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024;
    
    return {
        responsive: true,
        maintainAspectRatio: true, // ← CHANGED from false to true
        aspectRatio: isMobile ? 1.5 : isTablet ? 2 : 2.5, // ← ADDED aspect ratio control
        plugins: {
            legend: {
                position: isMobile ? 'bottom' : 'top',
                labels: {
                    boxWidth: isMobile ? 12 : 16,
                    font: {
                        size: isMobile ? 10 : 12
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    font: {
                        size: isMobile ? 10 : 12
                    },
                    maxRotation: isMobile ? 45 : 0
                }
            },
            y: {
                ticks: {
                    font: {
                        size: isMobile ? 10 : 12
                    }
                }
            }
        }
    };
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
