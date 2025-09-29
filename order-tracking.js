// ===== ENTERPRISE ORDER TRACKING SYSTEM =====
class OrderTrackingSystem {
    constructor() {
        this.currentOrder = null;
        this.realTimeInterval = null;
        this.simulationSpeed = 1; // 1x real-time
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRealTimeUpdates();
        this.checkURLParams();
        console.log('🚀 Enterprise Order Tracking System Ready');
    }

    // ===== ORDER LOOKUP & VALIDATION =====
   async lookupOrder(orderId, email) {
    try {
        this.showLoading(true);
        
        console.log('🔍 Debug Order Lookup:', { orderId, email });
        
        // Validate input
        if (!this.validateLookupInput(orderId, email)) {
            console.log('❌ Validation failed:', {
                orderIdValid: this.validateLookupInput(orderId, email),
                orderId: orderId,
                email: email
            });
            throw new Error('Please check your order ID and email');
        }

        // ... rest of the code

            // Find order in storage
            const order = await this.findOrder(orderId, email);
            if (!order) {
                throw new Error('Order not found. Please check your details.');
            }

            // Load order data
            this.currentOrder = order;
            await this.displayOrderDetails();
            this.startRealTimeTracking();
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    validateLookupInput(orderId, email) {
        const orderIdRegex = /^SWIFT[A-Z0-9]{9,12}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        return orderIdRegex.test(orderId) && emailRegex.test(email);
    }

    async findOrder(orderId, email) {
        // Search in localStorage orders
        const orders = JSON.parse(localStorage.getItem('swiftbuy_orders') || '[]');
        const order = orders.find(o => 
            o.order.orderId === orderId && 
            o.shipping.email.toLowerCase() === email.toLowerCase()
        );

        if (order) {
            // Enhance order with tracking data
            return await this.enhanceOrderWithTracking(order);
        }
        
        return null;
    }

    async enhanceOrderWithTracking(order) {
        // Add tracking-specific data
        const trackingData = await this.generateTrackingData(order);
        return {
            ...order,
            tracking: trackingData,
            updates: this.generateOrderUpdates(order, trackingData)
        };
    }

    // ===== REAL-TIME TRACKING SIMULATION =====
    async generateTrackingData(order) {
        const orderTime = new Date(order.order.timestamp);
        const now = new Date();
        const hoursSinceOrder = (now - orderTime) / (1000 * 60 * 60);
        
        // Simulate realistic tracking progression based on order age
        return {
            carrier: 'SwiftShip Express',
            trackingNumber: 'SS' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
            status: this.calculateCurrentStatus(hoursSinceOrder),
            currentLocation: this.generateCurrentLocation(hoursSinceOrder),
            estimatedDelivery: this.calculateDeliveryEstimate(orderTime),
            lastScan: new Date().toISOString(),
            transitHistory: this.generateTransitHistory(orderTime)
        };
    }

    calculateCurrentStatus(hoursSinceOrder) {
        const statusFlow = [
            { threshold: 0, status: 'ordered' },
            { threshold: 1, status: 'confirmed' },
            { threshold: 2, status: 'processing' },
            { threshold: 6, status: 'shipped' },
            { threshold: 24, status: 'out-for-delivery' },
            { threshold: 28, status: 'delivered' }
        ];

        for (const stage of statusFlow) {
            if (hoursSinceOrder < stage.threshold) {
                return stage.status;
            }
        }
        return 'delivered';
    }

    generateCurrentLocation(hoursSinceOrder) {
        const locations = [
            { hours: 0, location: 'Order received at our facility', city: 'New York, NY' },
            { hours: 2, location: 'Processing center', city: 'Jersey City, NJ' },
            { hours: 6, location: 'Distribution hub', city: 'Philadelphia, PA' },
            { hours: 18, location: 'Local facility', city: 'Your City' },
            { hours: 24, location: 'Out for delivery', city: 'Your Neighborhood' }
        ];

        return locations.find(loc => hoursSinceOrder >= loc.hours) || locations[locations.length - 1];
    }

    calculateDeliveryEstimate(orderTime) {
        const deliveryDate = new Date(orderTime);
        deliveryDate.setDate(deliveryDate.getDate() + 2); // 2-day delivery
        
        return {
            date: deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
            timeWindow: '9:00 AM - 1:00 PM',
            confidence: 'high'
        };
    }

    // ===== REAL-TIME UPDATES SYSTEM =====
    startRealTimeTracking() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
        }

        // Simulate real-time updates
        this.realTimeInterval = setInterval(() => {
            this.simulateTrackingUpdate();
        }, 30000 / this.simulationSpeed); // Update every 30 seconds (simulated)
    }

    simulateTrackingUpdate() {
        if (!this.currentOrder) return;

        // Simulate occasional tracking updates
        if (Math.random() < 0.3) { // 30% chance of update
            this.generateNewTrackingEvent();
            this.updateDisplay();
        }

        // Update progress based on time
        this.updateProgressTimeline();
    }

    generateNewTrackingEvent() {
        const events = [
            {
                type: 'location_update',
                message: 'Package scanned at facility',
                location: 'Regional Distribution Center',
                timestamp: new Date().toISOString()
            },
            {
                type: 'status_update', 
                message: 'Package in transit to next facility',
                timestamp: new Date().toISOString()
            },
            {
                type: 'eta_update',
                message: 'Estimated delivery time updated',
                timestamp: new Date().toISOString()
            }
        ];

        const randomEvent = events[Math.floor(Math.random() * events.length)];
        this.currentOrder.updates.unshift(randomEvent);
        
        // Keep only recent updates
        if (this.currentOrder.updates.length > 10) {
            this.currentOrder.updates = this.currentOrder.updates.slice(0, 10);
        }
    }

    // ===== UI UPDATES & DISPLAY =====
    async displayOrderDetails() {
        this.showSection('order-details');
        this.hideSection('order-lookup');
        this.hideSection('order-not-found');

        // Update order header
        this.updateElement('order-number', `Order #${this.currentOrder.order.orderId}`);
        this.updateOrderStatus();

        // Update timeline
        this.updateProgressTimeline();

        // Update order items
        this.updateOrderItems();

        // Update shipping info
        this.updateShippingInfo();

        // Update real-time feed
        this.updateRealTimeFeed();

        // Start map simulation
        this.simulatePackageMovement();
    }

    updateOrderStatus() {
        const status = this.currentOrder.tracking.status;
        const statusBadge = document.getElementById('order-status-badge');
        const statusText = statusBadge.querySelector('.status-text');
        const statusIndicator = statusBadge.querySelector('.status-indicator');

        // Update text
        statusText.textContent = this.formatStatusText(status);

        // Update indicator color
        const statusColors = {
            'ordered': '#6b7280',
            'confirmed': '#3b82f6', 
            'processing': '#8b5cf6',
            'shipped': '#f59e0b',
            'out-for-delivery': '#ef4444',
            'delivered': '#10b981'
        };

        statusIndicator.style.background = statusColors[status] || '#6b7280';
    }

    formatStatusText(status) {
        const statusMap = {
            'ordered': 'Order Placed',
            'confirmed': 'Order Confirmed',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'out-for-delivery': 'Out for Delivery',
            'delivered': 'Delivered'
        };
        return statusMap[status] || status;
    }

    updateProgressTimeline() {
        const status = this.currentOrder.tracking.status;
        const steps = ['ordered', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered'];
        
        steps.forEach((step, index) => {
            const stepElement = document.querySelector(`[data-step="${step}"]`);
            if (!stepElement) return;

            const stepIndex = steps.indexOf(step);
            const currentIndex = steps.indexOf(status);

            if (stepIndex <= currentIndex) {
                stepElement.classList.add('active');
                stepElement.classList.add('completed');
            } else if (stepIndex === currentIndex + 1) {
                stepElement.classList.add('active');
                stepElement.classList.remove('completed');
            } else {
                stepElement.classList.remove('active', 'completed');
            }

            // Update timestamps
            this.updateStepTimestamp(step);
        });
    }

    updateStepTimestamp(step) {
        const orderTime = new Date(this.currentOrder.order.timestamp);
        const timestamps = {
            'ordered': orderTime,
            'confirmed': new Date(orderTime.getTime() + 60 * 60 * 1000), // +1 hour
            'processing': new Date(orderTime.getTime() + 2 * 60 * 60 * 1000), // +2 hours
            'shipped': new Date(orderTime.getTime() + 6 * 60 * 60 * 1000), // +6 hours
            'out-for-delivery': new Date(orderTime.getTime() + 24 * 60 * 60 * 1000), // +24 hours
            'delivered': new Date(orderTime.getTime() + 28 * 60 * 60 * 1000) // +28 hours
        };

        const timeElement = document.getElementById(`step-${step}-time`);
        if (timeElement && timestamps[step]) {
            timeElement.textContent = this.formatTimestamp(timestamps[step]);
        }
    }

    updateOrderItems() {
        const container = document.getElementById('order-items-list');
        container.innerHTML = this.currentOrder.order.items.map(item => `
            <div class="order-item">
                <div class="item-image">
                    <img src="../${item.image}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h4 class="item-name">${item.name}</h4>
                    <div class="item-meta">
                        <span class="item-price">$${(item.price_cents / 100).toFixed(2)}</span>
                        <span class="item-quantity">Qty: ${item.quantity}</span>
                    </div>
                    <div class="item-status">
                        <i class="fas fa-check-circle"></i>
                        <span>Ready for shipment</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateShippingInfo() {
        const shipping = this.currentOrder.shipping;
        const container = document.getElementById('shipping-details');
        
        container.innerHTML = `
            <div class="shipping-address">
                <strong>Shipping Address</strong>
                <p>${shipping.firstName} ${shipping.lastName}</p>
                <p>${shipping.address}</p>
                <p>${shipping.city}, ${shipping.state} ${shipping.zipCode}</p>
                <p>${shipping.country}</p>
            </div>
            <div class="contact-info">
                <strong>Contact Information</strong>
                <p>📧 ${shipping.email}</p>
                <p>📞 ${shipping.phone}</p>
            </div>
        `;

        // Update delivery estimate
        this.updateElement('estimate-date', this.currentOrder.tracking.estimatedDelivery.date);
        this.updateElement('estimate-range', this.currentOrder.tracking.estimatedDelivery.timeWindow);
    }

    updateRealTimeFeed() {
        const container = document.getElementById('updates-feed');
        container.innerHTML = this.currentOrder.updates.map(update => `
            <div class="update-item">
                <div class="update-icon">
                    <i class="fas fa-${this.getUpdateIcon(update.type)}"></i>
                </div>
                <div class="update-content">
                    <p class="update-message">${update.message}</p>
                    <span class="update-time">${this.formatTimestamp(new Date(update.timestamp))}</span>
                    ${update.location ? `<span class="update-location">📍 ${update.location}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    // ===== ADVANCED FEATURES =====
    simulatePackageMovement() {
        const mapElement = document.getElementById('tracking-map');
        if (!mapElement) return;

        // Simulate package movement on map
        const simulation = setInterval(() => {
            if (!this.currentOrder) {
                clearInterval(simulation);
                return;
            }

            const progress = this.calculateDeliveryProgress();
            this.animatePackageOnMap(progress);
        }, 5000);
    }

    calculateDeliveryProgress() {
        const orderTime = new Date(this.currentOrder.order.timestamp);
        const now = new Date();
        const totalTime = 28 * 60 * 60 * 1000; // 28 hours total
        const elapsed = now - orderTime;
        
        return Math.min(Math.max(elapsed / totalTime, 0), 1);
    }

    animatePackageOnMap(progress) {
        // This would integrate with a real map API
        console.log('Package progress:', Math.round(progress * 100) + '%');
    }

    // ===== UTILITIES =====
    setupEventListeners() {
        // Order lookup form
        document.getElementById('lookup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const orderId = document.getElementById('orderId').value;
            const email = document.getElementById('trackingEmail').value;
            this.lookupOrder(orderId, email);
        });

        // Try again button
        document.getElementById('btn-try-again').addEventListener('click', () => {
            this.showSection('order-lookup');
            this.hideSection('order-not-found');
        });

        // Print receipt
        document.getElementById('btn-print').addEventListener('click', () => {
            this.printOrderReceipt();
        });

        // Support modal
        document.getElementById('btn-support').addEventListener('click', () => {
            this.showSupportModal();
        });
    }

    setupRealTimeUpdates() {
        // Setup WebSocket connection simulation
        this.simulateWebSocketConnection();
    }

    simulateWebSocketConnection() {
        // In a real implementation, this would connect to a WebSocket server
        console.log('🔌 Real-time tracking connection established');
    }

    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        const email = urlParams.get('email');

        if (orderId && email) {
            document.getElementById('orderId').value = orderId;
            document.getElementById('trackingEmail').value = email;
            this.lookupOrder(orderId, email);
        }
    }

    // ===== UI HELPERS =====
    showSection(sectionId) {
        document.getElementById(sectionId).style.display = 'block';
    }

    hideSection(sectionId) {
        document.getElementById(sectionId).style.display = 'none';
    }

    showLoading(show) {
        // Implement loading indicator
        console.log(show ? '🔄 Loading...' : '✅ Loaded');
    }

    showError(message) {
        this.hideSection('order-details');
        this.showSection('order-not-found');
        console.error('❌', message);
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) element.textContent = content;
    }

    formatTimestamp(date) {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    getUpdateIcon(updateType) {
        const icons = {
            'location_update': 'map-marker-alt',
            'status_update': 'sync',
            'eta_update': 'clock'
        };
        return icons[updateType] || 'info-circle';
    }

    printOrderReceipt() {
        window.print();
    }

    showSupportModal() {
        // Implement support modal
        console.log('🛟 Opening support modal');
    }

    generateTransitHistory(orderTime) {
        // Generate realistic transit history
        return [
            { location: 'Order received', timestamp: new Date(orderTime).toISOString() },
            { location: 'Processing facility', timestamp: new Date(orderTime.getTime() + 2 * 60 * 60 * 1000).toISOString() },
            { location: 'Distribution center', timestamp: new Date(orderTime.getTime() + 6 * 60 * 60 * 1000).toISOString() }
        ];
    }

    generateOrderUpdates(order, tracking) {
        // Generate initial order updates
        return [
            {
                type: 'status_update',
                message: 'Order confirmed and being processed',
                timestamp: new Date(order.order.timestamp).toISOString()
            }
        ];
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    window.orderTracker = new OrderTrackingSystem();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OrderTrackingSystem };
}