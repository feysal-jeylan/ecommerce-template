const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            category, 
            search, 
            sort = 'createdAt',
            order = 'desc' 
        } = req.query;

        let query = {};
        
        // Category filter
        if (category && category !== 'all') {
            query.category = category;
        }
        
        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOrder = order === 'desc' ? -1 : 1;
        const sortOptions = { [sort]: sortOrder };

        const products = await Product.find(query)
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ 
            $or: [
                { _id: req.params.id },
                { sku: req.params.id }
            ]
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new product
router.post('/', async (req, res) => {
    try {
        const productData = req.body;
        
        // Generate SKU if not provided
        if (!productData.sku) {
            productData.sku = 'SKU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        }

        const product = new Product(productData);
        await product.save();

        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Product SKU already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { 
                $or: [
                    { _id: req.params.id },
                    { sku: req.params.id }
                ]
            },
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({
            $or: [
                { _id: req.params.id },
                { sku: req.params.id }
            ]
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bulk update products
router.patch('/bulk', async (req, res) => {
    try {
        const { productIds, updates } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'Product IDs are required' });
        }

        const result = await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: updates },
            { runValidators: true }
        );

        res.json({
            message: `Updated ${result.modifiedCount} products`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;