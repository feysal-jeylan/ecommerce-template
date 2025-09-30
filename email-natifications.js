// ===== ENTERPRISE EMAIL NOTIFICATION SYSTEM =====
class EmailNotificationSystem {
    constructor() {
        this.templates = {
            orderConfirmation: this.orderConfirmationTemplate,
            shippingUpdate: this.shippingUpdateTemplate,
            deliveryConfirmation: this.deliveryConfirmationTemplate,
            backInStock: this.backInStockTemplate
        };
        this.init();
    }

    init() {
        console.log('📧 Enterprise Email System Ready');
        this.setupRealTimeListeners();
    }

    // ===== REAL-TIME EVENT LISTENERS =====
    setupRealTimeListeners() {
        // Listen for order events
        window.addEventListener('orderPlaced', (e) => {
            this.sendOrderConfirmation(e.detail.order);
        });

        window.addEventListener('orderStatusUpdated', (e) => {
            this.sendShippingUpdate(e.detail.order, e.detail.update);
        });

        window.addEventListener('inventoryRestocked', (e) => {
            this.sendBackInStockNotifications(e.detail.productId);
        });

        // Monitor cart for abandoned cart emails
        this.setupAbandonedCartMonitoring();
    }

    // ===== ORDER CONFIRMATION =====
    async sendOrderConfirmation(order) {
        const template = this.templates.orderConfirmation(order);
        const subject = `Order Confirmed - ${order.orderId}`;
        
        try {
            await this.sendEmail({
                to: order.shipping.email,
                subject: subject,
                html: template,
                category: 'order_confirmation'
            });
            
            console.log('✅ Order confirmation sent:', order.orderId);
            this.logNotification('order_confirmation', order.orderId);
            
        } catch (error) {
            console.error('❌ Failed to send order confirmation:', error);
            this.retrySend(order, 'order_confirmation');
        }
    }

    // ===== SHIPPING UPDATES =====
    async sendShippingUpdate(order, update) {
        const template = this.templates.shippingUpdate(order, update);
        const subject = `Shipping Update - ${order.orderId}`;
        
        await this.sendEmail({
            to: order.shipping.email,
            subject: subject,
            html: template,
            category: 'shipping_update'
        });

        console.log('🚚 Shipping update sent:', order.orderId);
    }

    // ===== BACK IN STOCK NOTIFICATIONS =====
    async sendBackInStockNotifications(productId) {
        const subscribers = this.getBackInStockSubscribers(productId);
        const product = await this.getProductDetails(productId);
        
        for (const subscriber of subscribers) {
            const template = this.templates.backInStock(product, subscriber);
            
            await this.sendEmail({
                to: subscriber.email,
                subject: `Back in Stock - ${product.name}`,
                html: template,
                category: 'back_in_stock'
            });
        }

        console.log(`📦 Back in stock notifications sent to ${subscribers.length} subscribers`);
    }

    // ===== ABANDONED CART RECOVERY =====
    setupAbandonedCartMonitoring() {
        let cartTimer;
        
        window.addEventListener('cartUpdated', () => {
            clearTimeout(cartTimer);
            
            // Send abandoned cart email after 1 hour
            cartTimer = setTimeout(() => {
                this.checkAbandonedCart();
            }, 60 * 60 * 1000); // 1 hour
        });
    }

    async checkAbandonedCart() {
        const cart = JSON.parse(localStorage.getItem('swiftbuy_cart_v1') || '[]');
        if (cart.length === 0) return;

        // Get user email from recent orders or prompt
        const userEmail = await this.getUserEmail();
        if (!userEmail) return;

        await this.sendAbandonedCartEmail(userEmail, cart);
    }

    async sendAbandonedCartEmail(email, cart) {
        const template = this.createAbandonedCartTemplate(cart);
        
        await this.sendEmail({
            to: email,
            subject: 'Complete Your Purchase - Items Waiting!',
            html: template,
            category: 'abandoned_cart'
        });

        console.log('🛒 Abandoned cart email sent');
    }

    // ===== EMAIL TEMPLATES =====
    orderConfirmationTemplate(order) {
        const itemsHTML = order.items.map(item => `
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee;">
                    <img src="https://yourdomain.com/${item.image}" alt="${item.name}" width="60" style="border-radius: 8px;">
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #eee;">
                    <strong>${item.name}</strong><br>
                    <span style="color: #666;">Qty: ${item.quantity}</span>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
                    $${(item.price_cents / 100).toFixed(2)}
                </td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                    .order-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { background: #1e293b; color: white; padding: 20px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Confirmed! 🎉</h1>
                        <p>Thank you for your purchase</p>
                    </div>
                    
                    <div class="content">
                        <h2>Order #${order.orderId}</h2>
                        
                        <div class="order-info">
                            <p><strong>Estimated Delivery:</strong> ${order.tracking.estimatedDelivery.date}</p>
                            <p><strong>Shipping Address:</strong> ${order.shipping.address}, ${order.shipping.city}</p>
                        </div>

                        <h3>Order Summary</h3>
                        <table width="100%" style="border-collapse: collapse;">
                            ${itemsHTML}
                            <tr>
                                <td colspan="2" style="padding: 15px; text-align: right;"><strong>Total:</strong></td>
                                <td style="padding: 15px; text-align: right;"><strong>$${order.order.total.toFixed(2)}</strong></td>
                            </tr>
                        </table>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://yourdomain.com/order-tracking.html?orderId=${order.orderId}" 
                               style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                Track Your Order
                            </a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Need help? Contact our support team</p>
                        <p>© 2024 SwiftBuy. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    shippingUpdateTemplate(order, update) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: #f59e0b; color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Shipping Update 📦</h1>
                        <p>Your order is on the move!</p>
                    </div>
                    
                    <div class="content">
                        <h2>Order #${order.orderId}</h2>
                        <p><strong>Status:</strong> ${update.message}</p>
                        ${update.location ? `<p><strong>Location:</strong> ${update.location}</p>` : ''}
                        <p><strong>Time:</strong> ${new Date(update.timestamp).toLocaleString()}</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://yourdomain.com/order-tracking.html?orderId=${order.orderId}" 
                               style="background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                View Full Tracking
                            </a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    backInStockTemplate(product, subscriber) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: #10b981; color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Back in Stock! 🎉</h1>
                        <p>Your waited-for item is available</p>
                    </div>
                    
                    <div class="content">
                        <h2>${product.name}</h2>
                        <img src="https://yourdomain.com/${product.image}" alt="${product.name}" width="200" style="border-radius: 12px;">
                        <p><strong>Price:</strong> $${product.price}</p>
                        <p>We noticed you were interested in this item, and it's now back in stock!</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://yourdomain.com/e-commerce.html#product-${product.id}" 
                               style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                Shop Now
                            </a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // ===== EMAIL SENDING ENGINE =====
    async sendEmail(emailData) {
        // In production, integrate with:
        // - SendGrid, Mailgun, AWS SES, etc.
        
        console.log('📤 Sending email:', {
            to: emailData.to,
            subject: emailData.subject,
            category: emailData.category
        });

        // SIMULATION: Log email instead of actually sending
        this.simulateEmailSending(emailData);
        
        return { success: true, messageId: 'simulated_' + Date.now() };
    }

    simulateEmailSending(emailData) {
        // Simulate email sending delay
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('✅ Email sent (simulated):', emailData.subject);
                resolve(true);
            }, 1000);
        });
    }

    // ===== UTILITY METHODS =====
    getBackInStockSubscribers(productId) {
        const subscribers = JSON.parse(localStorage.getItem('swiftbuy_back_in_stock') || '[]');
        return subscribers.filter(sub => sub.productId === productId);
    }

    async getProductDetails(productId) {
        // Get product from your products data
        const products = JSON.parse(localStorage.getItem('swiftbuy_products') || '[]');
        return products.find(p => p.id === productId) || { name: 'Product', price: '0.00' };
    }

    async getUserEmail() {
        // Get email from recent orders or user profile
        const orders = JSON.parse(localStorage.getItem('swiftbuy_orders') || '[]');
        if (orders.length > 0) {
            return orders[orders.length - 1].shipping.email;
        }
        return null;
    }

    logNotification(type, orderId) {
        const logs = JSON.parse(localStorage.getItem('swiftbuy_email_logs') || '[]');
        logs.push({
            type: type,
            orderId: orderId,
            timestamp: new Date().toISOString(),
            status: 'sent'
        });
        localStorage.setItem('swiftbuy_email_logs', JSON.stringify(logs));
    }

    retrySend(order, type) {
        // Implement retry logic for failed emails
        console.log(`🔄 Retrying ${type} email for order ${order.orderId}`);
        setTimeout(() => {
            if (type === 'order_confirmation') {
                this.sendOrderConfirmation(order);
            }
        }, 5000);
    }

    createAbandonedCartTemplate(cart) {
        const itemsHTML = cart.map(item => `
            <tr>
                <td style="padding: 10px;">
                    <img src="https://yourdomain.com/${item.image}" alt="${item.name}" width="50">
                </td>
                <td style="padding: 10px;">${item.name}</td>
                <td style="padding: 10px;">$${(item.price_cents / 100).toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #ef4444; color: white; padding: 30px; text-align: center;">
                    <h1>Don't Forget Your Items! 🛒</h1>
                </div>
                <div style="padding: 30px;">
                    <p>We noticed you left some items in your cart. They're waiting for you!</p>
                    <table width="100%">${itemsHTML}</table>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://yourdomain.com/checkout/checkout.html" 
                           style="background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;">
                            Complete Your Purchase
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
}

// ===== INTEGRATION WITH EXISTING SYSTEMS =====

// Add to checkout.js to trigger order confirmation
function triggerOrderConfirmation(order) {
    window.dispatchEvent(new CustomEvent('orderPlaced', {
        detail: { order: order }
    }));
}

// Add to order-tracking.js to trigger shipping updates
function triggerShippingUpdate(order, update) {
    window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
        detail: { order: order, update: update }
    }));
}

// Add to inventory management for back in stock
function triggerInventoryRestock(productId) {
    window.dispatchEvent(new CustomEvent('inventoryRestocked', {
        detail: { productId: productId }
    }));
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    window.emailSystem = new EmailNotificationSystem();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EmailNotificationSystem };
}