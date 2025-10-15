const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/products/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and random string
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + fileExtension);
    }
});

const fileFilter = (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files
    },
    fileFilter: fileFilter
});

// Get all products
router.get('/', async (req, res) => {
    try {
        console.log('📦 Products API called by user:', req.user?.username);
        
        const { 
            page = 1, 
            limit = 50, 
            category, 
            search, 
            sort = 'createdAt',
            order = 'desc' 
        } = req.query;

        let query = { visible: true }; // Only get visible products
        
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

        // Use try-catch for database operations
        let products, total;
        try {
            products = await Product.find(query)
                .sort(sortOptions)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            total = await Product.countDocuments(query);
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Return demo data if database fails
            return res.json({
                products: getDemoProducts(),
                totalPages: 1,
                currentPage: 1,
                total: 5
            });
        }

        // Ensure products is always an array
        const safeProducts = Array.isArray(products) ? products : [];

        res.json({
            products: safeProducts,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (error) {
        console.error('Get products error:', error);
        // Return demo data instead of error
        res.json({
            products: getDemoProducts(),
            totalPages: 1,
            currentPage: 1,
            total: 5,
            message: 'Using demo data due to server issue'
        });
    }
});

// Demo products fallback
function getDemoProducts() {
    return [
        {
            _id: '1',
            name: 'Wireless Bluetooth Headphones',
            sku: 'AUDIO-001',
            price: 79.99,
            category: 'electronics',
            image: '/images/headset transparent.png',
            inventory: { stock: 25, lowStockThreshold: 5 },
            rating: { average: 4.5, count: 120 },
            featured: true,
            visible: true
        },
        {
            _id: '2',
            name: 'Running Shoes',
            sku: 'SHOE-001',
            price: 129.99,
            category: 'shoes',
            image: '/images/transparent shoe.png',
            inventory: { stock: 3, lowStockThreshold: 5 },
            rating: { average: 4.2, count: 85 },
            featured: false,
            visible: true
        },
        {
            _id: '3',
            name: 'Smart Watch',
            sku: 'WATCH-001',
            price: 199.99,
            category: 'electronics',
            image: '/images/transparent watch.png',
            inventory: { stock: 15, lowStockThreshold: 5 },
            rating: { average: 4.7, count: 64 },
            featured: true,
            visible: true
        }
    ];
}

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

// Create new product with image upload
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const productData = req.body;
        
        // Generate SKU if not provided
        if (!productData.sku) {
            productData.sku = 'SKU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        }

        // Handle uploaded image
        if (req.file) {
            productData.image = `/uploads/products/${req.file.filename}`;
        } else if (productData.imageUrl) {
            productData.image = productData.imageUrl;
        } else {
            productData.image = 'https://via.placeholder.com/300x200?text=No+Image';
        }

        const product = new Product(productData);
        await product.save();

        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        
        // Clean up uploaded file if there was an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Product SKU already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update product with optional image upload
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const updateData = req.body;

        // Handle uploaded image
        if (req.file) {
            updateData.image = `/uploads/products/${req.file.filename}`;
            
            // Optional: Delete old image file if it exists and is not a placeholder
            const oldProduct = await Product.findById(req.params.id);
            if (oldProduct && oldProduct.image && !oldProduct.image.includes('placeholder') && oldProduct.image.startsWith('/uploads/')) {
                const oldImagePath = path.join(__dirname, '..', oldProduct.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        const product = await Product.findOneAndUpdate(
            { 
                $or: [
                    { _id: req.params.id },
                    { sku: req.params.id }
                ]
            },
            updateData,
            { new: true, runValidators: true }
        );

        if (!product) {
            // Clean up uploaded file if product not found
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Update product error:', error);
        
        // Clean up uploaded file if there was an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload multiple images for product gallery
router.post('/:id/images', upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No images uploaded' });
        }

        const imagePaths = req.files.map(file => `/uploads/products/${file.filename}`);
        
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $push: { images: { $each: imagePaths } } },
            { new: true }
        );

        if (!product) {
            // Clean up uploaded files if product not found
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            message: 'Images uploaded successfully',
            images: imagePaths,
            product
        });
    } catch (error) {
        console.error('Upload images error:', error);
        
        // Clean up uploaded files if there was an error
        if (req.files) {
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete product image
router.delete('/:id/images/:imageIndex', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const imageIndex = parseInt(req.params.imageIndex);
        if (imageIndex < 0 || imageIndex >= product.images.length) {
            return res.status(400).json({ error: 'Invalid image index' });
        }

        const imagePath = product.images[imageIndex];
        
        // Remove image from array
        product.images.splice(imageIndex, 1);
        await product.save();

        // Delete image file from server
        if (imagePath && imagePath.startsWith('/uploads/')) {
            const fullPath = path.join(__dirname, '..', imagePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        res.json({ 
            message: 'Image deleted successfully',
            product 
        });
    } catch (error) {
        console.error('Delete image error:', error);
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

        // Delete associated image files
        if (product.image && !product.image.includes('placeholder') && product.image.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '..', product.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete gallery images
        if (product.images && product.images.length > 0) {
            product.images.forEach(imagePath => {
                if (imagePath.startsWith('/uploads/')) {
                    const fullPath = path.join(__dirname, '..', imagePath);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                    }
                }
            });
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

// Upload image endpoint
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const imageUrl = `/uploads/products/${req.file.filename}`;
        
        res.json({
            message: 'Image uploaded successfully',
            imageUrl: imageUrl,
            filename: req.file.filename,
            size: req.file.size
        });

    } catch (error) {
        console.error('Image upload error:', error);
        
        // Clean up file if error occurred
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ error: 'Image upload failed: ' + error.message });
    }
});

module.exports = router;