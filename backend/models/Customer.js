const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
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
    phone: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'United States'
        }
    },
    stats: {
        ordersCount: {
            type: Number,
            default: 0
        },
        totalSpent: {
            type: Number,
            default: 0
        },
        averageOrderValue: {
            type: Number,
            default: 0
        },
        lastOrderDate: Date,
        firstOrderDate: Date
    },
    preferences: {
        newsletter: {
            type: Boolean,
            default: true
        },
        emailNotifications: {
            type: Boolean,
            default: true
        }
    },
    notes: String,
    tags: [String],
    lifetimeValue: {
        type: Number,
        default: 0
    },
    customerTier: {
        type: String,
        enum: ['standard', 'premium', 'vip'],
        default: 'standard'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update stats before saving
customerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Calculate customer tier based on lifetime value
    if (this.lifetimeValue >= 500) {
        this.customerTier = 'vip';
    } else if (this.lifetimeValue >= 200) {
        this.customerTier = 'premium';
    } else {
        this.customerTier = 'standard';
    }
    
    next();
});

module.exports = mongoose.model('Customer', customerSchema);