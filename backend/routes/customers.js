const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            search, 
            tier,
            sort = 'stats.totalSpent',
            order = 'desc' 
        } = req.query;

        let query = {};
        
        // Search filter
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }

        // Tier filter
        if (tier && tier !== 'all') {
            query.customerTier = tier;
        }

        const sortOrder = order === 'desc' ? -1 : 1;
        const sortOptions = { [sort]: sortOrder };

        const customers = await Customer.find(query)
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Customer.countDocuments(query);

        res.json({
            customers,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get customer by email
router.get('/:email', async (req, res) => {
    try {
        const customer = await Customer.findOne({ 
            email: req.params.email.toLowerCase() 
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get customer orders
        const orders = await Order.find({ 
            'customer.email': req.params.email.toLowerCase() 
        }).sort({ createdAt: -1 });

        res.json({
            ...customer.toObject(),
            orders
        });
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update customer
router.put('/:email', async (req, res) => {
    try {
        const customer = await Customer.findOneAndUpdate(
            { email: req.params.email.toLowerCase() },
            req.body,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sync customers from orders (for initial setup)
router.post('/sync-from-orders', async (req, res) => {
    try {
        const orders = await Order.find();
        const customerMap = new Map();

        // Process orders to extract customer data
        orders.forEach(order => {
            const email = order.customer.email.toLowerCase();
            
            if (!customerMap.has(email)) {
                customerMap.set(email, {
                    email: email,
                    firstName: order.customer.firstName,
                    lastName: order.customer.lastName,
                    phone: order.customer.phone,
                    address: {
                        street: order.shipping.address,
                        city: order.shipping.city,
                        state: order.shipping.state,
                        zipCode: order.shipping.zipCode,
                        country: order.shipping.country
                    },
                    stats: {
                        ordersCount: 1,
                        totalSpent: order.total,
                        averageOrderValue: order.total,
                        firstOrderDate: order.createdAt,
                        lastOrderDate: order.createdAt
                    },
                    lifetimeValue: order.total
                });
            } else {
                const customer = customerMap.get(email);
                customer.stats.ordersCount += 1;
                customer.stats.totalSpent += order.total;
                customer.stats.averageOrderValue = customer.stats.totalSpent / customer.stats.ordersCount;
                customer.stats.lastOrderDate = order.createdAt;
                customer.lifetimeValue = customer.stats.totalSpent;
            }
        });

        // Save/update customers in database
        for (const [email, customerData] of customerMap) {
            await Customer.findOneAndUpdate(
                { email: email },
                customerData,
                { upsert: true, new: true }
            );
        }

        res.json({ 
            message: `Synced ${customerMap.size} customers from orders` 
        });

    } catch (error) {
        console.error('Sync customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;