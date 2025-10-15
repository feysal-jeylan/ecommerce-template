const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swiftbuy_admin';

const connectWithRetry = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.log('❌ MongoDB Connection Failed:', error.message);
        console.log('📝 Using in-memory data storage for demo purposes...');
        console.log('💡 To use MongoDB:');
        console.log('   1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
        console.log('   2. OR Use MongoDB Atlas: https://www.mongodb.com/cloud/atlas');
        console.log('   3. Update MONGODB_URI in .env file');
        
        // Create mock data for demo
        createMockData();
    }
};

connectWithRetry();

// Mock data storage (fallback when MongoDB is not available)
let mockData = {
    products: [],
    orders: [],
    customers: []
};

// Create initial mock data
// Create initial mock data
function createMockData() {
    console.log('🔄 Creating demo data...');
    
    // Sample products - FIXED structure
    mockData.products = [
        {
            _id: '1',
            name: 'Wireless Bluetooth Headphones',
            sku: 'AUDIO-001',
            price: 79.99,
            category: 'electronics',
            image: '/images/headset transparent.png',
            images: ['/images/headset transparent.png'],
            inventory: { 
                stock: 25, 
                lowStockThreshold: 5,
                reserved: 0
            },
            rating: { 
                average: 4.5, 
                count: 120 
            },
            featured: true,
            visible: true,
            description: 'Premium wireless headphones with active noise cancellation',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            _id: '2',
            name: 'Running Shoes',
            sku: 'SHOE-001',
            price: 129.99,
            category: 'shoes',
            image: '/images/transparent shoe.png',
            images: ['/images/transparent shoe.png'],
            inventory: { 
                stock: 3, 
                lowStockThreshold: 5,
                reserved: 0
            },
            rating: { 
                average: 4.2, 
                count: 85 
            },
            featured: false,
            visible: true,
            description: 'High-performance running shoes with breathable mesh',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            _id: '3',
            name: 'Smart Watch',
            sku: 'WATCH-001', 
            price: 199.99,
            category: 'electronics',
            image: '/images/transparent watch.png',
            images: ['/images/transparent watch.png'],
            inventory: { 
                stock: 15, 
                lowStockThreshold: 5,
                reserved: 0
            },
            rating: { 
                average: 4.7, 
                count: 64 
            },
            featured: true,
            visible: true,
            description: 'Advanced smartwatch with health monitoring',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            _id: '4',
            name: 'Designer Sunglasses',
            sku: 'EYE-001',
            price: 149.99,
            category: 'accessories',
            image: '/images/sunglasses.png',
            images: ['/images/sunglasses.png'],
            inventory: { 
                stock: 12, 
                lowStockThreshold: 5,
                reserved: 0
            },
            rating: { 
                average: 4.3, 
                count: 67 
            },
            featured: false,
            visible: true,
            description: 'Stylish polarized sunglasses with UV protection',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            _id: '5',
            name: 'Travel Backpack',
            sku: 'BAG-001',
            price: 79.99,
            category: 'backpacks',
            image: '/images/backpack.png',
            images: ['/images/backpack.png'],
            inventory: { 
                stock: 8, 
                lowStockThreshold: 5,
                reserved: 0
            },
            rating: { 
                average: 4.6, 
                count: 156 
            },
            featured: true,
            visible: true,
            description: 'Durable smart backpack with USB charging port',
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    // Sample orders
    mockData.orders = [
        {
            _id: '1',
            orderId: 'ORD-001',
            customer: {
                email: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                phone: '+1234567890'
            },
            shipping: {
                address: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'United States'
            },
            items: [
                {
                    productId: '1',
                    name: 'Wireless Bluetooth Headphones',
                    price_cents: 7999,
                    quantity: 1,
                    image: '/images/headset transparent.png'
                }
            ],
            total: 79.99,
            subtotal: 79.99,
            shippingCost: 0,
            tax: 0,
            status: 'delivered',
            paymentStatus: 'paid',
            tracking: {
                status: 'delivered',
                lastUpdated: new Date(),
                history: [
                    {
                        status: 'ordered',
                        timestamp: new Date(Date.now() - 86400000 * 3),
                        note: 'Order placed',
                        updatedBy: 'system'
                    },
                    {
                        status: 'delivered',
                        timestamp: new Date(Date.now() - 86400000 * 1),
                        note: 'Package delivered',
                        updatedBy: 'system'
                    }
                ]
            },
            createdAt: new Date(Date.now() - 86400000 * 3),
            updatedAt: new Date()
        }
    ];

    console.log('✅ Demo data created successfully');
    console.log(`📦 Products: ${mockData.products.length}`);
    console.log(`📦 Orders: ${mockData.orders.length}`);
}

// Database Models (with fallback to mock data)
const createModelsWithFallback = () => {
    if (mongoose.connection.readyState === 1) {
        // MongoDB is connected - use real models
        console.log('🔄 Using MongoDB models');
        return {
            Product: require('./models/Product'),
            Order: require('./models/Order'),
            Customer: require('./models/Customer')
        };
    } else {
        // MongoDB not connected - use mock models
        console.log('🔄 Using in-memory data storage');
        return createMockModels();
    }
};

// Create mock models for demo
function createMockModels() {
    const mockModel = (collectionName) => {
        return {
            find: (query = {}) => {
                console.log(`🔍 Mock ${collectionName}.find:`, query);
                const items = mockData[collectionName] || [];
                const filtered = items.filter(item => {
                    for (let key in query) {
                        if (key === 'visible' && item[key] !== query[key]) return false;
                        if (key === 'category' && query[key] !== 'all' && item[key] !== query[key]) return false;
                        if (key === '$or') {
                            // Handle search queries
                            const searchTerm = query[key][0].name?.$regex;
                            if (searchTerm) {
                                const regex = new RegExp(searchTerm, 'i');
                                if (!regex.test(item.name) && 
                                    !regex.test(item.description) && 
                                    !regex.test(item.sku)) {
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                });
                return Promise.resolve(filtered);
            },
            findOne: (query) => Promise.resolve(mockData[collectionName].find(item => {
                for (let key in query) {
                    if (item[key] !== query[key]) return false;
                }
                return true;
            })),
            findById: (id) => Promise.resolve(mockData[collectionName].find(item => item._id === id)),
            create: (data) => {
                const newItem = { ...data, _id: Date.now().toString(), createdAt: new Date(), updatedAt: new Date() };
                mockData[collectionName].push(newItem);
                return Promise.resolve(newItem);
            },
            findOneAndUpdate: (query, update, options = {}) => {
                const index = mockData[collectionName].findIndex(item => {
                    for (let key in query) {
                        if (item[key] !== query[key]) return false;
                    }
                    return true;
                });
                if (index !== -1) {
                    mockData[collectionName][index] = { ...mockData[collectionName][index], ...update.$set, updatedAt: new Date() };
                    return Promise.resolve(mockData[collectionName][index]);
                }
                return Promise.resolve(null);
            },
            countDocuments: (query = {}) => {
                const items = mockData[collectionName] || [];
                const filtered = items.filter(item => {
                    for (let key in query) {
                        if (item[key] !== query[key]) return false;
                    }
                    return true;
                });
                return Promise.resolve(filtered.length);
            },
            deleteOne: (query) => {
                const index = mockData[collectionName].findIndex(item => {
                    for (let key in query) {
                        if (item[key] !== query[key]) return false;
                    }
                    return true;
                });
                if (index !== -1) {
                    mockData[collectionName].splice(index, 1);
                    return Promise.resolve({ deletedCount: 1 });
                }
                return Promise.resolve({ deletedCount: 0 });
            }
        };
    };

    return {
        Product: mockModel('products'),
        Order: mockModel('orders'),
        Customer: mockModel('customers')
    };
}

const { Product, Order, Customer } = createModelsWithFallback();

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            console.log('❌ Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', authenticateToken, require('./routes/products'));
app.use('/api/orders', authenticateToken, require('./routes/orders'));
app.use('/api/customers', authenticateToken, require('./routes/customers'));
app.use('/api/analytics', authenticateToken, require('./routes/analytics'));

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Using Demo Data';
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: dbStatus,
        message: dbStatus === 'Using Demo Data' ? 'MongoDB not connected - using in-memory demo data' : 'MongoDB connected successfully'
    });
});

// Demo data endpoint
app.post('/api/setup-demo', async (req, res) => {
    try {
        createMockData();
        res.json({ 
            message: 'Demo setup completed successfully',
            data: {
                products: mockData.products.length,
                orders: mockData.orders.length,
                customers: mockData.customers.length
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Setup failed: ' + error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Admin Dashboard API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Database: ${mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'Using Demo Data'}`);
    console.log(`👤 Demo credentials: admin@swiftbuy.com / admin123`);
});