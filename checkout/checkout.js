// ===== CHECKOUT ADVANCED CORE =====
import { loadCart, saveCart, executeAtomicOperation } from '../cartModule.js';
import { validateAddress } from './address-validator.js';
import { processPayment } from './payment-processor.js';

class CheckoutManager {


        updateReviewTotals() {
        // This updates the review step totals (already calculated in calculateTotals)
        console.log('💰 Updating review totals...');
        // The totals are already displayed from calculateTotals()
    }
        async calculateShippingCosts() {
        // Simulate shipping calculation
        console.log('📦 Calculating shipping costs...');
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    calculateTotal(cart) {
        const subtotal = this.calculateSubtotal(cart);
        const shipping = this.calculateShipping(cart);
        const tax = this.calculateTax(cart);
        return subtotal + shipping + tax;
    }
        showFormErrors(form) {
        // Find first invalid field and focus it
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add visual error state
            firstInvalid.classList.add('error');
            setTimeout(() => firstInvalid.classList.remove('error'), 2000);
        }
    }

    showAddressSuggestions(suggestions) {
        console.log('Address suggestions:', suggestions);
        // In a real app, you'd show these in a dropdown
        // For now, just log them
    }

    showInventoryWarning(outOfStockItems) {
        console.warn('Out of stock items:', outOfStockItems);
        // In a real app, you'd show a modal or notification
    }

    // Add payment validation stubs
    async validatePayPalPayment() {
        // Simulate PayPal validation
        return new Promise(resolve => setTimeout(() => resolve(true), 500));
    }

    async validateApplePayPayment() {
        // Simulate Apple Pay validation  
        return new Promise(resolve => setTimeout(() => resolve(true), 500));
    }

    suggestStockAlternatives() {
        console.log('Suggesting stock alternatives');
    }

    suggestPaymentRetry() {
        console.log('Suggesting payment retry');
    }
    constructor() {
        this.currentStep = 1;
        this.orderData = {
            shipping: {},
            payment: {},
            order: {}
        };
        this.init();
    }

    init() {
        this.loadCartData();
        this.setupEventListeners();
        this.setupFormValidation();
        this.populateStates();
        console.log('🚀 Advanced Checkout System Ready');
    }

    // ===== CART & ORDER MANAGEMENT =====
    async loadCartData() {
        try {
            const cart = loadCart();
            this.updateOrderSummary(cart);
            this.calculateTotals(cart);
            
            // Validate inventory before checkout
            await this.validateInventory(cart);
        } catch (error) {
            this.showError('Failed to load cart data');
            console.error('Cart load error:', error);
        }
    }

    async validateInventory(cart) {
        try {
            // Import inventory manager if available
            const inventoryManager = await this.getInventoryManager();
            if (!inventoryManager) return;

            const outOfStockItems = cart.filter(item => {
                const stock = inventoryManager.getStockLevel(item.id);
                return stock < item.quantity;
            });

            if (outOfStockItems.length > 0) {
                this.showInventoryWarning(outOfStockItems);
            }
        } catch (error) {
            console.warn('Inventory validation skipped:', error);
        }
    }

    async getInventoryManager() {
        try {
            // Dynamic import to avoid circular dependencies
            const { inventoryManager } = await import('../e-commerce.js');
            return inventoryManager;
        } catch {
            return null;
        }
    }

    // ===== STEP NAVIGATION =====
    async navigateToStep(step) {
        // Validate current step before proceeding
        if (!await this.validateCurrentStep()) {
            return;
        }

        // Update UI
        this.updateProgressIndicator(step);
        this.showStep(step);
        this.currentStep = step;

        // Step-specific initialization
        switch(step) {
            case 2:
                await this.initializePaymentStep();
                break;
            case 3:
                await this.initializeReviewStep();
                break;
        }
    }

    async validateCurrentStep() {
        switch(this.currentStep) {
            case 1:
                return await this.validateShippingForm();
            case 2:
                return await this.validatePaymentForm();
            default:
                return true;
        }
    }

    updateProgressIndicator(step) {
        // Update progress steps
        document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
            const stepNumber = index + 1;
            stepEl.classList.toggle('active', stepNumber === step);
            stepEl.classList.toggle('completed', stepNumber < step);
        });
    }

    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.checkout-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });
        
        // Show target step
        const targetStep = document.getElementById(`step-${step}`);
        if (targetStep) {
            targetStep.classList.add('active');
        }
    }

    // ===== FORM VALIDATION =====
    setupFormValidation() {
        // Real-time shipping form validation
        this.setupShippingValidation();
        
        // Payment form validation
        this.setupPaymentValidation();
        
        // Auto-format inputs
        this.setupInputFormatting();
    }

    setupShippingValidation() {
        const form = document.getElementById('shipping-form');
        if (!form) return;

        // Real-time address validation
        const addressInput = document.getElementById('address');
        if (addressInput) {
            addressInput.addEventListener('blur', async () => {
                await this.validateAddressRealTime();
            });
        }

        // ZIP code validation
        const zipInput = document.getElementById('zipCode');
        if (zipInput) {
            zipInput.addEventListener('input', (e) => {
                this.formatZipCode(e.target);
            });
        }
    }

    setupPaymentValidation() {
        // Card number formatting and validation
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                this.formatCardNumber(e.target);
                this.validateCardNumber(e.target.value);
            });
        }

        // Expiry date formatting
        const expiryInput = document.getElementById('expiryDate');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                this.formatExpiryDate(e.target);
            });
        }

        // CVV validation
        const cvvInput = document.getElementById('cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                this.validateCVV(e.target.value);
            });
        }
    }

        setupInputFormatting() {
        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
        }

        // Card number formatting is already in setupPaymentValidation
    }

    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 0) {
            value = value.substring(0, 10);
            if (value.length > 6) {
                value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
            } else if (value.length > 3) {
                value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
            } else if (value.length > 0) {
                value = `(${value}`;
            }
        }
        input.value = value;
    }

    // ===== SHIPPING STEP =====
    async validateShippingForm() {
        const form = document.getElementById('shipping-form');
        if (!form.checkValidity()) {
            this.showFormErrors(form);
            return false;
        }

        // Collect shipping data
        this.orderData.shipping = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zipCode').value,
            country: document.getElementById('country').value
        };

        // Validate address with external service
        try {
            const isValid = await validateAddress(this.orderData.shipping);
            if (!isValid) {
                this.showError('Please check your shipping address');
                return false;
            }
        } catch (error) {
            console.warn('Address validation service unavailable');
            // Continue without validation if service is down
        }

        return true;
    }

    async validateAddressRealTime() {
        const address = document.getElementById('address').value;
        if (address.length > 5) {
            // Show loading state
            const addressField = document.getElementById('address');
            addressField.classList.add('validating');
            
            try {
                const suggestions = await validateAddress(address);
                if (suggestions.length > 0) {
                    this.showAddressSuggestions(suggestions);
                }
            } catch (error) {
                // Silent fail for real-time validation
            } finally {
                addressField.classList.remove('validating');
            }
        }
    }

    // ===== PAYMENT STEP =====
    async initializePaymentStep() {
        this.setupPaymentMethods();
        await this.calculateShippingCosts();
    }

    setupPaymentMethods() {
        const paymentMethods = document.querySelectorAll('.payment-method');
        paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                this.selectPaymentMethod(method.dataset.method);
            });
        });
    }

    selectPaymentMethod(method) {
        // Update UI
        document.querySelectorAll('.payment-method').forEach(m => {
            m.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');

        // Show/hide appropriate forms
        this.togglePaymentForms(method);
        
        this.orderData.payment.method = method;
    }

    togglePaymentForms(method) {
        const forms = {
            card: document.getElementById('payment-form'),
            paypal: document.getElementById('paypal-form'),
            applepay: document.getElementById('applepay-form')
        };

        // Hide all forms
        Object.values(forms).forEach(form => {
            if (form) form.style.display = 'none';
        });

        // Show selected form
        if (forms[method]) {
            forms[method].style.display = 'block';
        }
    }

    async validatePaymentForm() {
        const method = this.orderData.payment.method;
        
        switch(method) {
            case 'card':
                return this.validateCardPayment();
            case 'paypal':
                return await this.validatePayPalPayment();
            case 'applepay':
                return await this.validateApplePayPayment();
            default:
                this.showError('Please select a payment method');
                return false;
        }
    }

    validateCardPayment() {
        const cardNumber = document.getElementById('cardNumber').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        const cardName = document.getElementById('cardName').value;

        if (!this.validateCardNumber(cardNumber) || 
            !this.validateExpiryDate(expiryDate) || 
            !this.validateCVV(cvv) ||
            !cardName.trim()) {
            this.showError('Please check your card details');
            return false;
        }

        this.orderData.payment.card = {
            number: cardNumber.replace(/\s/g, ''),
            expiry: expiryDate,
            cvv: cvv,
            name: cardName
        };

        return true;
    }

    // ===== REVIEW STEP =====
    async initializeReviewStep() {
        await this.finalizeOrderData();
        this.updateReviewStep();
    }

    async finalizeOrderData() {
        const cart = loadCart();
        
        this.orderData.order = {
            items: cart,
            subtotal: this.calculateSubtotal(cart),
            shipping: this.calculateShipping(cart),
            tax: this.calculateTax(cart),
            total: this.calculateTotal(cart),
            orderId: this.generateOrderId(),
            timestamp: new Date().toISOString()
        };
    }

    updateReviewStep() {
        this.updateOrderReviewItems();
        this.updateReviewTotals();
    }

    updateOrderReviewItems() {
        const container = document.getElementById('order-summary');
        const cart = loadCart();

        container.innerHTML = cart.map(item => `
            <div class="order-item">
                <div class="order-item-image">
                    <img src="../${item.image}" alt="${item.name}">
                </div>
                <div class="order-item-details">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-price">$${(item.price_cents / 100).toFixed(2)}</div>
                    <div class="order-item-quantity">Quantity: ${item.quantity}</div>
                </div>
            </div>
        `).join('');
    }

    // ===== ORDER PLACEMENT =====
    async placeOrder() {
        this.showLoading(true);

        try {
            // Execute atomic checkout operation
            const success = await executeAtomicOperation(async () => {
                // 1. Validate final inventory
                await this.validateFinalInventory();
                
                // 2. Process payment
                const paymentResult = await processPayment(this.orderData.payment, this.orderData.order.total);
                if (!paymentResult.success) {
                    throw new Error(`Payment failed: ${paymentResult.error}`);
                }

                // 3. Update inventory
                await this.updateInventoryAfterOrder();

                // 4. Save order
                await this.saveOrderToStorage();

                // 5. Clear cart
                saveCart([]);

                return true;
            });

            if (success) {
                await this.handleOrderSuccess();
            }

        } catch (error) {
            this.handleOrderError(error);
        } finally {
            this.showLoading(false);
        }
    }

    async validateFinalInventory() {
        const cart = loadCart();
        const inventoryManager = await this.getInventoryManager();
        
        if (inventoryManager) {
            for (const item of cart) {
                const stock = inventoryManager.getStockLevel(item.id);
                if (stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${item.name}. Only ${stock} available.`);
                }
            }
        }
    }

    async updateInventoryAfterOrder() {
        const cart = loadCart();
        const inventoryManager = await this.getInventoryManager();
        
        if (inventoryManager) {
            for (const item of cart) {
                inventoryManager.updateStock(item.id, item.quantity);
            }
        }
    }

    async saveOrderToStorage() {
        const orders = JSON.parse(localStorage.getItem('swiftbuy_orders') || '[]');
        orders.push(this.orderData);
        localStorage.setItem('swiftbuy_orders', JSON.stringify(orders));
    }

    async handleOrderSuccess() {
        // Show success message
        this.showSuccess('Order placed successfully!');
        
        // Redirect to confirmation page
        setTimeout(() => {
            window.location.href = `order-confirmation.html?orderId=${this.orderData.order.orderId}`;
        }, 2000);
    }

    handleOrderError(error) {
        console.error('Order placement error:', error);
        this.showError(`Order failed: ${error.message}`);
        
        // Specific error handling
        if (error.message.includes('stock')) {
            this.suggestStockAlternatives();
        } else if (error.message.includes('payment')) {
            this.suggestPaymentRetry();
        }
    }

    // ===== UI UPDATES =====
    updateOrderSummary(cart) {
        const container = document.getElementById('sidebar-order-items');
        
        container.innerHTML = cart.map(item => `
            <div class="order-item">
                <div class="order-item-image">
                    <img src="../${item.image}" alt="${item.name}">
                </div>
                <div class="order-item-details">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-price">$${(item.price_cents / 100).toFixed(2)}</div>
                    <div class="order-item-quantity">Qty: ${item.quantity}</div>
                </div>
            </div>
        `).join('');
    }

    calculateTotals(cart) {
        const subtotal = this.calculateSubtotal(cart);
        const shipping = this.calculateShipping(cart);
        const tax = this.calculateTax(cart);
        const total = subtotal + shipping + tax;

        // Update sidebar
        this.updateElement('sidebar-subtotal', `$${subtotal.toFixed(2)}`);
        this.updateElement('sidebar-shipping', shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`);
        this.updateElement('sidebar-total', `$${total.toFixed(2)}`);

        // Update review step
        this.updateElement('review-subtotal', `$${subtotal.toFixed(2)}`);
        this.updateElement('review-shipping', shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`);
        this.updateElement('review-tax', `$${tax.toFixed(2)}`);
        this.updateElement('review-total', `$${total.toFixed(2)}`);
    }

    calculateSubtotal(cart) {
        return cart.reduce((total, item) => total + (item.price_cents * item.quantity / 100), 0);
    }

    calculateShipping(cart) {
        // Free shipping over $50
        const subtotal = this.calculateSubtotal(cart);
        return subtotal > 50 ? 0 : 5.99;
    }

    calculateTax(cart) {
        const subtotal = this.calculateSubtotal(cart);
        return subtotal * 0.08; // 8% tax
    }

    // ===== UTILITIES =====
    setupEventListeners() {
        // Step navigation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-next')) {
                const nextStep = parseInt(e.target.closest('.btn-next').dataset.next);
                this.navigateToStep(nextStep);
            } else if (e.target.closest('.btn-prev')) {
                const prevStep = parseInt(e.target.closest('.btn-prev').dataset.prev);
                this.navigateToStep(prevStep);
            } else if (e.target.closest('#place-order')) {
                this.placeOrder();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }

    populateStates() {
        const states = [
            'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
            'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
            'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
            'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
            'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
        ];

        const stateSelect = document.getElementById('state');
        if (stateSelect) {
            stateSelect.innerHTML = '<option value="">Select State</option>' +
                states.map(state => `<option value="${state}">${state}</option>`).join('');
        }
    }

    // ===== VALIDATION HELPERS =====
    validateCardNumber(number) {
        // Basic Luhn algorithm check
        const cleanNumber = number.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(cleanNumber)) return false;
        
        let sum = 0;
        for (let i = 0; i < cleanNumber.length; i++) {
            let digit = parseInt(cleanNumber[i]);
            if ((cleanNumber.length - i) % 2 === 0) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }
        return sum % 10 === 0;
    }

    validateExpiryDate(expiry) {
        if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
        
        const [month, year] = expiry.split('/').map(Number);
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;

        if (month < 1 || month > 12) return false;
        if (year < currentYear || (year === currentYear && month < currentMonth)) return false;
        
        return true;
    }

    validateCVV(cvv) {
        return /^\d{3,4}$/.test(cvv);
    }

    // ===== UI HELPERS =====
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.toggle('active', show);
    }

    showError(message) {
        // Create or update error toast
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type = 'info') {
        // Implementation for toast notifications
        console.log(`[${type.toUpperCase()}] ${message}`);
        // You can integrate with your existing toast system
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) element.textContent = content;
    }

    generateOrderId() {
        return 'SWIFT' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // ===== INPUT FORMATTING =====
    formatCardNumber(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        input.value = value.substring(0, 19);
    }

    formatExpiryDate(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        input.value = value.substring(0, 5);
    }

    formatZipCode(input) {
        input.value = input.value.replace(/\D/g, '').substring(0, 5);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Ensure cart has items
    const cart = loadCart();
    if (cart.length === 0) {
        window.location.href = '../e-commerce.html';
        return;
    }

    // Initialize checkout system
    window.checkoutManager = new CheckoutManager();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CheckoutManager };
}