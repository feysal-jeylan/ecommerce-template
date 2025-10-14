const express = require('express');
const Order = require('../models/Order');
const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            status, 
            search,
            sort = 'createdAt',
            order = 'desc' 
        } = req.query;

        let query = {};
        
        // Status filter
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Search filter
        if (search) {
            query.$or = [
                { 'customer.email': { $regex: search, $options: 'i' } },
                { 'customer.firstName': { $regex: search, $options: 'i' } },
                { 'customer.lastName': { $regex: search, $options: 'i' } },
                { orderId: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOrder = order === 'desc' ? -1 : 1;
        const sortOptions = { [sort]: sortOrder };

        const orders = await Order.find(query)
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(query);

        res.json({
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single order
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findOne({ 
            $or: [
                { _id: req.params.id },
                { orderId: req.params.id }
            ]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, note } = req.body;
        
        const order = await Order.findOne({ 
            $or: [
                { _id: req.params.id },
                { orderId: req.params.id }
            ]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Add to tracking history
        if (!order.tracking.history) {
            order.tracking.history = [];
        }

        order.tracking.history.push({
            status: status,
            timestamp: new Date(),
            note: note || '',
            updatedBy: 'admin'
        });

        // Update current status
        order.status = status;
        order.tracking.status = status;
        order.tracking.lastUpdated = new Date();
        order.tracking.note = note || order.tracking.note;

        await order.save();

        res.json(order);
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get orders by customer email
router.get('/customer/:email', async (req, res) => {
    try {
        const orders = await Order.find({ 
            'customer.email': req.params.email 
        }).sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error('Get customer orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;