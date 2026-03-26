// ===== ENHANCED ORDER CONFIRMATION FUNCTIONALITY =====

class OrderConfirmation {
    constructor() {
        this.orderId = this.getOrderIdFromURL();
        this.orderData = null;
        this.init();
    }

    init() {
        this.loadOrderDetails();
        this.setupEventListeners();
        this.startConfettiEffect();
        this.updateOrderTimeline();
    }

    getOrderIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('orderId');
    }

    loadOrderDetails() {
        if (!this.orderId) {
            this.showEmptyState();
            return;
        }

        try {
            const orders = JSON.parse(localStorage.getItem('swiftbuy_orders') || '[]');
            this.orderData = orders.find(order => order.order.orderId === this.orderId);
            
            if (this.orderData) {
                this.updateConfirmationDetails();
                this.updateTrackingLink();
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading order details:', error);
            this.showEmptyState();
        }
    }

    showEmptyState() {
        // Hide the default "Loading..." content
        const orderSummary = document.querySelector('.order-summary');
        const timeline = document.querySelector('.order-timeline');
        const confirmationIcon = document.querySelector('.confirmation-icon');
        const confirmationMessage = document.querySelector('.confirmation-message');
        const confirmationActions = document.querySelector('.confirmation-actions');
        const confirmationNote = document.querySelector('.confirmation-note');
        const h1 = document.querySelector('.confirmation-card h1');

        // Update heading and message
        if (h1) h1.textContent = 'No Recent Order Found';
        if (confirmationIcon) {
            confirmationIcon.innerHTML = '<i class="fas fa-shopping-bag" style="color: #6b7280;"></i>';
        }
        if (confirmationMessage) {
            confirmationMessage.textContent = 'It looks like you haven\'t placed an order yet, or the order details are no longer available.';
        }

        // Hide order-specific sections
        if (orderSummary) orderSummary.style.display = 'none';
        if (timeline) timeline.style.display = 'none';
        if (confirmationNote) confirmationNote.style.display = 'none';

        // Replace actions with "Return to Store" button
        if (confirmationActions) {
            confirmationActions.innerHTML = `
                <a href="../index.html" class="btn-primary">
                    <i class="fas fa-shopping-bag"></i>
                    Return to Store
                </a>
                <a href="../order-tracking.html" class="btn-secondary">
                    <i class="fas fa-search"></i>
                    Track an Existing Order
                </a>
            `;
        }
    }


    updateConfirmationDetails() {
        // Update order ID
        document.getElementById('confirmation-order-id').textContent = this.orderId;
        
        // Update order total
        const totalElement = document.getElementById('confirmation-total');
        if (totalElement && this.orderData.order) {
            totalElement.textContent = `$${this.orderData.order.total.toFixed(2)}`;
        }
        
        // Update shipping address
        const addressElement = document.getElementById('confirmation-address');
        if (addressElement && this.orderData.shipping) {
            const { address, city, state, zipCode } = this.orderData.shipping;
            addressElement.textContent = `${address}, ${city}, ${state} ${zipCode}`;
        }
        
        // Update delivery estimate based on shipping method
        this.updateDeliveryEstimate();
    }

    updateDeliveryEstimate() {
        const deliveryElement = document.getElementById('confirmation-delivery');
        if (deliveryElement && this.orderData.shipping) {
            const method = this.orderData.shipping.shippingMethod || 'standard';
            const estimates = {
                'standard': '2-3 business days',
                'express': '1-2 business days',
                'overnight': 'Next business day'
            };
            deliveryElement.textContent = estimates[method] || '2-3 business days';
        }
    }

    updateTrackingLink() {
        const trackButton = document.getElementById('track-order-btn');
        if (trackButton) {
            trackButton.href = `../order-tracking.html?orderId=${this.orderId}`;
        }
    }

    updateOrderTimeline() {
        // Simulate real-time updates
        setTimeout(() => {
            this.activateTimelineStep(1); // Order confirmed
        }, 2000);

        setTimeout(() => {
            this.activateTimelineStep(2); // Processing
        }, 5000);
    }

    activateTimelineStep(stepIndex) {
        const timelineItems = document.querySelectorAll('.timeline-item');
        if (timelineItems[stepIndex]) {
            timelineItems[stepIndex].classList.add('active');
        }
    }

    setupEventListeners() {
        // Print receipt functionality
        const printButton = document.getElementById('print-receipt');
        if (printButton) {
            printButton.addEventListener('click', () => {
                this.printReceipt();
            });
        }

        // Share order functionality
        const shareButton = document.getElementById('share-order');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                this.shareOrder();
            });
        }

        // Continue shopping animation
        const continueButton = document.querySelector('.btn-secondary');
        if (continueButton) {
            continueButton.addEventListener('mouseenter', () => {
                continueButton.style.transform = 'translateY(-2px)';
            });
            continueButton.addEventListener('mouseleave', () => {
                continueButton.style.transform = 'translateY(0)';
            });
        }
    }

    printReceipt() {
        const printContent = this.generateReceiptContent();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - Order ${this.orderId}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    .receipt-details { margin-bottom: 20px; }
                    .receipt-items { width: 100%; border-collapse: collapse; }
                    .receipt-items th, .receipt-items td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                    .receipt-total { text-align: right; font-weight: bold; margin-top: 20px; }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    generateReceiptContent() {
        if (!this.orderData) return '<p>No order data available</p>';

        const items = this.orderData.order.items || [];
        const itemsHTML = items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${(item.price_cents / 100).toFixed(2)}</td>
                <td>$${((item.price_cents * item.quantity) / 100).toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <div class="receipt-header">
                <h1>SwiftBuy Receipt</h1>
                <p>Order ID: ${this.orderId}</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="receipt-details">
                <h3>Items:</h3>
                <table class="receipt-items">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                <div class="receipt-total">
                    <p>Total: $${this.orderData.order.total.toFixed(2)}</p>
                </div>
            </div>
        `;
    }

    shareOrder() {
        if (navigator.share) {
            navigator.share({
                title: 'My SwiftBuy Order',
                text: `I just placed an order on SwiftBuy! Order ID: ${this.orderId}`,
                url: window.location.href,
            })
            .catch(error => console.log('Error sharing:', error));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`My SwiftBuy Order: ${this.orderId}`)
                .then(() => this.showToast('Order details copied to clipboard!'))
                .catch(err => console.log('Error copying to clipboard:', err));
        }
    }

    startConfettiEffect() {
        // Simple confetti effect using emojis
        setTimeout(() => {
            this.createConfetti();
        }, 500);
    }

    createConfetti() {
        const confettiEmojis = ['🎉', '🎊', '✨', '🌟', '💫', '🥳'];
        const container = document.querySelector('.confirmation-card');
        
        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.textContent = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
            confetti.style.position = 'absolute';
            confetti.style.fontSize = '20px';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-30px';
            confetti.style.animation = `confettiFall ${Math.random() * 3 + 2}s linear forwards`;
            confetti.style.zIndex = '1';
            
            container.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }

        // Add CSS for confetti animation
        if (!document.querySelector('#confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(400px) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            background: #fee2e2;
            color: #dc2626;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: center;
            border: 1px solid #fecaca;
        `;
        errorDiv.textContent = message;
        
        const card = document.querySelector('.confirmation-card');
        if (card) {
            card.insertBefore(errorDiv, card.firstChild);
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OrderConfirmation();
});

// Add confetti animation style
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(confettiStyle);