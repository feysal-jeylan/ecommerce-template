const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        required: true
    },
    customer: {
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        phone: String
    },
    shipping: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            default: 'United States'
        }
    },
    items: [{
        productId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price_cents: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        image: String
    }],
    total: {
        type: Number,
        required: true,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    tracking: {
        status: {
            type: String,
            default: 'ordered'
        },
        note: String,
        lastUpdated: {
            type: Date,
            default: Date.now
        },
        history: [{
            status: String,
            timestamp: {
                type: Date,
                default: Date.now
            },
            note: String,
            updatedBy: String
        }]
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate order ID before saving
orderSchema.pre('save', function(next) {
    if (!this.orderId) {
        this.orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Order', orderSchema);