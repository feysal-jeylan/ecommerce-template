const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    sku: {
        type: String,
        unique: true,
        required: true
    },
    price: { 
        type: Number, 
        required: true,
        min: 0 
    },
    salePrice: {
        type: Number,
        min: 0
    },
    category: { 
        type: String, 
        required: true 
    },
    brand: {
        type: String,
        trim: true
    },
    description: { 
        type: String,
        trim: true 
    },
    image: { 
        type: String 
    },
    images: [{
        type: String
    }],
    inventory: {
        stock: { 
            type: Number, 
            default: 0,
            min: 0 
        },
        lowStockThreshold: { 
            type: Number, 
            default: 5,
            min: 0 
        },
        reserved: {
            type: Number,
            default: 0
        }
    },
    rating: {
        average: { 
            type: Number, 
            default: 0,
            min: 0,
            max: 5 
        },
        count: { 
            type: Number, 
            default: 0,
            min: 0 
        }
    },
    featured: { 
        type: Boolean, 
        default: false 
    },
    onSale: { 
        type: Boolean, 
        default: false 
    },
    visible: { 
        type: Boolean, 
        default: true 
    },
    tags: [{
        type: String,
        trim: true
    }],
    seo: {
        title: String,
        description: String,
        slug: {
            type: String,
            unique: true,
            sparse: true
        }
    },
    shipping: {
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        }
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

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Product', productSchema);