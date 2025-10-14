const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30);
        }

        // Get data in parallel for performance
        const [
            totalRevenue,
            totalOrders,
            totalCustomers,
            recentOrders,
            lowStockProducts,
            revenueByPeriod,
            categorySales,
            topProducts
        ] = await Promise.all([
            // Total revenue
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$total' }
                    }
                }
            ]),
            
            // Total orders
            Order.countDocuments({
                createdAt: { $gte: startDate, $lte: endDate }
            }),
            
            // Total customers
            Customer.countDocuments({
                'stats.lastOrderDate': { $gte: startDate, $lte: endDate }
            }),
            
            // Recent orders
            Order.find({
                createdAt: { $gte: startDate, $lte: endDate }
            })
            .sort({ createdAt: -1 })
            .limit(10),
            
            // Low stock products
            Product.find({
                'inventory.stock': { $lte: '$inventory.lowStockThreshold' },
                'inventory.stock': { $gt: 0 }
            }),
            
            // Revenue by period (daily for chart)
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        revenue: { $sum: '$total' },
                        orders: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]),
            
            // Category sales
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $unwind: '$items'
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'items.productId',
                        foreignField: 'sku',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $group: {
                        _id: '$product.category',
                        revenue: { $sum: '$items.price_cents' },
                        quantity: { $sum: '$items.quantity' }
                    }
                }
            ]),
            
            // Top products
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $unwind: '$items'
                },
                {
                    $group: {
                        _id: '$items.productId',
                        name: { $first: '$items.name' },
                        quantity: { $sum: '$items.quantity' },
                        revenue: { $sum: '$items.price_cents' }
                    }
                },
                {
                    $sort: { revenue: -1 }
                },
                {
                    $limit: 10
                }
            ])
        ]);

        // Calculate AOV
        const aov = totalOrders > 0 ? 
            (totalRevenue[0]?.total || 0) / totalOrders : 0;

        // Format response
        const analytics = {
            overview: {
                totalRevenue: totalRevenue[0]?.total || 0,
                totalOrders: totalOrders,
                totalCustomers: totalCustomers,
                averageOrderValue: aov,
                conversionRate: 0 // You can calculate this based on your traffic data
            },
            charts: {
                revenueTrend: revenueByPeriod.map(day => ({
                    date: day._id,
                    revenue: day.revenue / 100, // Convert cents to dollars
                    orders: day.orders
                })),
                categoryDistribution: categorySales.map(cat => ({
                    category: cat._id,
                    revenue: cat.revenue / 100,
                    quantity: cat.quantity
                })),
                topProducts: topProducts.map(product => ({
                    id: product._id,
                    name: product.name,
                    quantity: product.quantity,
                    revenue: product.revenue / 100
                }))
            },
            alerts: {
                lowStockCount: lowStockProducts.length,
                lowStockProducts: lowStockProducts.map(p => ({
                    id: p._id,
                    name: p.name,
                    stock: p.inventory.stock,
                    threshold: p.inventory.lowStockThreshold
                }))
            },
            recentActivity: {
                orders: recentOrders
            }
        };

        res.json(analytics);

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sales report
router.get('/sales-report', async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        
        const matchStage = {};
        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        let groupStage = {};
        let dateFormat = '%Y-%m-%d';
        
        switch (groupBy) {
            case 'month':
                dateFormat = '%Y-%m';
                break;
            case 'year':
                dateFormat = '%Y';
                break;
            case 'day':
            default:
                dateFormat = '%Y-%m-%d';
        }

        const salesReport = await Order.aggregate([
            {
                $match: {
                    ...matchStage,
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: dateFormat,
                            date: '$createdAt'
                        }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 },
                    averageOrderValue: { $avg: '$total' },
                    customers: { $addToSet: '$customer.email' }
                }
            },
            {
                $project: {
                    period: '$_id',
                    revenue: 1,
                    orders: 1,
                    averageOrderValue: 1,
                    uniqueCustomers: { $size: '$customers' }
                }
            },
            {
                $sort: { period: 1 }
            }
        ]);

        res.json(salesReport);

    } catch (error) {
        console.error('Sales report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;