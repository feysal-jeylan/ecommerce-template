// ===== ADVANCED PAYMENT PROCESSOR =====
export async function processPayment(paymentData, amount) {
    console.log('🔄 Processing payment:', { paymentData, amount });
    
    // Simulate payment processing
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate successful payment (90% success rate)
            const success = Math.random() > 0.1;
            
            resolve({
                success: success,
                transactionId: success ? 'TXN_' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase() : null,
                error: success ? null : 'Payment declined by bank',
                timestamp: new Date().toISOString()
            });
        }, 2000);
    });
}

// Validate card details
export function validateCard(cardData) {
    const errors = [];
    
    if (!cardData.number || cardData.number.replace(/\s/g, '').length < 13) {
        errors.push('Invalid card number');
    }
    
    if (!cardData.expiry || !isValidExpiry(cardData.expiry)) {
        errors.push('Invalid expiry date');
    }
    
    if (!cardData.cvv || cardData.cvv.length < 3) {
        errors.push('Invalid CVV');
    }
    
    if (!cardData.name || cardData.name.trim().length < 2) {
        errors.push('Invalid cardholder name');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function isValidExpiry(expiry) {
    const [month, year] = expiry.split('/').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    
    return month >= 1 && month <= 12 && 
           (year > currentYear || (year === currentYear && month >= currentMonth));
}