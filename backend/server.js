import express from 'express';

const app = express();
const PORT = 5000;

// ===== ADVANCED MIDDLEWARE =====
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});
app.use(express.json({ limit: '10mb' }));

// ===== ADVANCED LOGGING =====
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🌐 [${timestamp}] ${req.method} ${req.url}`, req.body || '');
  next();
});

// ===== IN-MEMORY DATABASE WITH ADVANCED FEATURES =====
let products = [
  {
    productId: "101",
    name: "Wireless Bluetooth Headphones",
    price: 129.99,
    originalPrice: 159.99,
    category: "electronics",
    inventory: { stock: 15, lowStockThreshold: 3, reserved: 0 },
    images: ["images/headset transparent.png"],
    rating: { average: 4.5, count: 128, reviews: [] },
    metadata: { 
      isNew: true, 
      isFeatured: true, 
      isTrending: false,
      freeShipping: true,
      tags: ["wireless", "noise-cancelling", "bluetooth"]
    },
    description: "Premium wireless headphones with active noise cancellation and 30-hour battery life.",
    specifications: {
      connectivity: "Bluetooth 5.0",
      batteryLife: "30 hours",
      weight: "250g",
      color: "Black"
    },
    aiData: {
      viewCount: 0,
      demandFactor: 0.7,
      personalizationScore: 0,
      conversionRate: 0.12
    }
  },
  {
    productId: "102", 
    name: "Running Shoes",
    price: 89.99,
    category: "shoes",
    inventory: { stock: 8, lowStockThreshold: 3, reserved: 0 },
    images: ["images/transparent shoe.png"], 
    rating: { average: 4.2, count: 89, reviews: [] },
    metadata: { 
      isNew: false, 
      isFeatured: false, 
      isTrending: true,
      freeShipping: true,
      tags: ["running", "sports", "comfort"]
    },
    description: "High-performance running shoes with breathable mesh and cushioned sole.",
    specifications: {
      material: "Mesh & Synthetic",
      sole: "Rubber",
      weight: "280g",
      color: "Black/Red"
    },
    aiData: {
      viewCount: 0,
      demandFactor: 0.8,
      personalizationScore: 0,
      conversionRate: 0.15
    }
  },
  {
    productId: "103",
    name: "Smart Watch",
    price: 199.99,
    originalPrice: 249.99,
    category: "electronics", 
    inventory: { stock: 25, lowStockThreshold: 5, reserved: 0 },
    images: ["images/transparent watch.png"],
    rating: { average: 4.7, count: 204, reviews: [] },
    metadata: { 
      isNew: false, 
      isFeatured: true, 
      isTrending: false,
      freeShipping: true,
      tags: ["smartwatch", "fitness", "health"]
    },
    description: "Advanced smartwatch with health monitoring and smartphone connectivity.",
    specifications: {
      display: "1.5\" AMOLED",
      battery: "7 days",
      waterproof: "50m",
      connectivity: "Bluetooth, WiFi"
    },
    aiData: {
      viewCount: 0,
      demandFactor: 0.9,
      personalizationScore: 0,
      conversionRate: 0.18
    }
  },
  {
    productId: "104",
    name: "Designer Sunglasses", 
    price: 149.99,
    category: "accessories",
    inventory: { stock: 12, lowStockThreshold: 3, reserved: 0 },
    images: ["images/sunglasses.png"],
    rating: { average: 4.3, count: 67, reviews: [] },
    metadata: { 
      isNew: true, 
      isFeatured: false, 
      isTrending: false,
      freeShipping: true,
      tags: ["designer", "polarized", "uv-protection"]
    },
    description: "Stylish polarized sunglasses with 100% UV protection.",
    specifications: {
      lens: "Polarized",
      frame: "Acetate",
      uvProtection: "100%",
      color: "Black"
    },
    aiData: {
      viewCount: 0,
      demandFactor: 0.6,
      personalizationScore: 0,
      conversionRate: 0.08
    }
  },
  {
    productId: "105",
    name: "Travel Backpack",
    price: 79.99, 
    category: "backpacks",
    inventory: { stock: 6, lowStockThreshold: 2, reserved: 0 },
    images: ["images/backpack.png"],
    rating: { average: 4.6, count: 156, reviews: [] },
    metadata: { 
      isNew: true, 
      isFeatured: false, 
      isTrending: true,
      freeShipping: true,
      tags: ["travel", "smart", "usb-charging"]
    },
    description: "Durable smart backpack with built-in USB charging port.",
    specifications: {
      capacity: "25L",
      material: "Nylon",
      weight: "0.8kg",
      features: "USB charging port"
    },
    aiData: {
      viewCount: 0,
      demandFactor: 0.85,
      personalizationScore: 0,
      conversionRate: 0.14
    }
  }
];

let users = [];
let carts = [];
let orders = [];
let inventoryHistory = [];

// ===== AI-POWERED RECOMMENDATION ENGINE =====
function generateRecommendations(productId, limit = 4) {
  const baseProduct = products.find(p => p.productId === productId);
  if (!baseProduct) return [];

  return products
    .filter(p => 
      p.productId !== productId && 
      p.inventory.stock > 0 &&
      (p.category === baseProduct.category || 
       Math.abs(p.price - baseProduct.price) < baseProduct.price * 0.5)
    )
    .map(product => ({
      ...product,
      relevanceScore: calculateRelevanceScore(baseProduct, product)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
    .map(({ relevanceScore, ...product }) => product);
}

function calculateRelevanceScore(baseProduct, targetProduct) {
  let score = 0;
  
  // Category match (40%)
  if (baseProduct.category === targetProduct.category) score += 40;
  
  // Price similarity (30%)
  const priceDiff = Math.abs(baseProduct.price - targetProduct.price);
  const priceSimilarity = 1 - (priceDiff / Math.max(baseProduct.price, targetProduct.price));
  score += priceSimilarity * 30;
  
  // Popularity (20%)
  score += (targetProduct.rating.average / 5) * 20;
  
  // Demand factor (10%)
  score += targetProduct.aiData.demandFactor * 10;
  
  return score;
}

// ===== REAL-TIME INVENTORY MANAGEMENT =====
function updateInventory(productId, quantity, action) {
  const product = products.find(p => p.productId === productId);
  if (!product) return false;

  const oldStock = product.inventory.stock;
  const oldReserved = product.inventory.reserved;

  switch (action) {
    case 'reserve':
      if (product.inventory.stock - product.inventory.reserved >= quantity) {
        product.inventory.reserved += quantity;
      } else {
        return false;
      }
      break;
    case 'release':
      product.inventory.reserved = Math.max(0, product.inventory.reserved - quantity);
      break;
    case 'sell':
      product.inventory.stock -= quantity;
      product.inventory.reserved = Math.max(0, product.inventory.reserved - quantity);
      break;
    case 'restock':
      product.inventory.stock += quantity;
      break;
  }

  // Log inventory change
  inventoryHistory.push({
    productId,
    action,
    quantity,
    oldStock,
    newStock: product.inventory.stock,
    oldReserved,
    newReserved: product.inventory.reserved,
    timestamp: new Date().toISOString()
  });

  return true;
}

// ===== ADVANCED ROUTES =====

// Health check with system stats
app.get('/api/health', (req, res) => {
  const systemStats = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    products: products.length,
    users: users.length,
    orders: orders.length,
    memory: process.memoryUsage(),
    inventory: {
      totalStock: products.reduce((sum, p) => sum + p.inventory.stock, 0),
      lowStockItems: products.filter(p => p.inventory.stock <= p.inventory.lowStockThreshold).length,
      outOfStockItems: products.filter(p => p.inventory.stock === 0).length
    }
  };
  res.json(systemStats);
});

// Get products with advanced filtering
app.get('/api/products', (req, res) => {
  const { 
    category, 
    minPrice, 
    maxPrice, 
    minRating, 
    inStock, 
    featured,
    trending,
    search,
    sortBy = 'popular'
  } = req.query;

  let filteredProducts = [...products];

  // Advanced filtering
  if (category && category !== 'all') {
    filteredProducts = filteredProducts.filter(p => 
      p.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
  }

  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
  }

  if (minRating) {
    filteredProducts = filteredProducts.filter(p => p.rating.average >= parseFloat(minRating));
  }

  if (inStock === 'true') {
    filteredProducts = filteredProducts.filter(p => p.inventory.stock > 0);
  }

  if (featured === 'true') {
    filteredProducts = filteredProducts.filter(p => p.metadata.isFeatured);
  }

  if (trending === 'true') {
    filteredProducts = filteredProducts.filter(p => p.metadata.isTrending);
  }

  if (search) {
    const searchTerm = search.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Advanced sorting
  switch (sortBy) {
    case 'price-low':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      filteredProducts.sort((a, b) => b.rating.average - a.rating.average);
      break;
    case 'newest':
      filteredProducts.sort((a, b) => (b.metadata.isNew ? 1 : 0) - (a.metadata.isNew ? 1 : 0));
      break;
    case 'trending':
      filteredProducts.sort((a, b) => (b.metadata.isTrending ? 1 : 0) - (a.metadata.isTrending ? 1 : 0));
      break;
    default: // popular
      filteredProducts.sort((a, b) => b.aiData.demandFactor - a.aiData.demandFactor);
  }

  // Track view counts for AI
  filteredProducts.forEach(product => {
    product.aiData.viewCount++;
  });

  res.json({
    success: true,
    products: filteredProducts,
    count: filteredProducts.length,
    filters: {
      category, minPrice, maxPrice, minRating, inStock, search, sortBy
    }
  });
});

// Get single product with AI recommendations
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.productId === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Track view for AI
  product.aiData.viewCount++;

  // Generate AI recommendations
  const recommendations = generateRecommendations(req.params.id, 4);

  res.json({
    success: true,
    product,
    recommendations,
    inventory: {
      stock: product.inventory.stock,
      reserved: product.inventory.reserved,
      available: product.inventory.stock - product.inventory.reserved,
      lowStock: product.inventory.stock <= product.inventory.lowStockThreshold
    }
  });
});

// AI-Powered product recommendations
app.get('/api/products/:id/recommendations', (req, res) => {
  const recommendations = generateRecommendations(req.params.id, 6);
  res.json({ success: true, recommendations });
});

// Advanced cart system with inventory locking
app.post('/api/cart/add', (req, res) => {
  const { productId, quantity = 1, userId = 'guest' } = req.body;
  
  const product = products.find(p => p.productId === productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Advanced inventory validation
  const availableStock = product.inventory.stock - product.inventory.reserved;
  if (availableStock < quantity) {
    return res.status(400).json({ 
      success: false, 
      message: `Only ${availableStock} items available in stock`,
      availableStock,
      lowStock: availableStock <= product.inventory.lowStockThreshold
    });
  }

  // Reserve inventory
  if (!updateInventory(productId, quantity, 'reserve')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Inventory reservation failed' 
    });
  }

  // Advanced cart management
  let userCart = carts.find(c => c.userId === userId);
  if (!userCart) {
    userCart = { 
      userId, 
      items: [], 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    carts.push(userCart);
  }

  const existingItem = userCart.items.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.updatedAt = new Date().toISOString();
  } else {
    userCart.items.push({
      productId,
      quantity,
      name: product.name,
      price: product.price,
      image: product.images[0],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  userCart.updatedAt = new Date().toISOString();

  // AI data tracking
  product.aiData.conversionRate = (product.aiData.viewCount > 0) 
    ? (product.aiData.conversionRate * 0.9 + 0.1) 
    : 0.1;

  res.json({
    success: true,
    message: 'Added to cart',
    cart: userCart,
    inventory: {
      stock: product.inventory.stock,
      reserved: product.inventory.reserved,
      available: availableStock - quantity
    }
  });
});

// Advanced checkout system
app.post('/api/orders', (req, res) => {
  const { items, shipping, payment, totals, userId = 'guest' } = req.body;
  
  // Validate inventory and process order atomically
  for (const item of items) {
    const product = products.find(p => p.productId === item.productId);
    if (!product || product.inventory.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${item.name}`,
        productId: item.productId,
        available: product ? product.inventory.stock : 0
      });
    }
  }

  // Process order
  const order = {
    orderId: 'SWIFT' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase(),
    userId,
    items: items.map(item => ({
      ...item,
      subtotal: item.price * item.quantity
    })),
    shipping,
    payment: {
      ...payment,
      status: 'completed',
      processedAt: new Date().toISOString()
    },
    totals,
    status: 'confirmed',
    timeline: [
      {
        status: 'confirmed',
        timestamp: new Date().toISOString(),
        note: 'Order confirmed and payment processed'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.push(order);

  // Update inventory and sales data
  items.forEach(item => {
    const product = products.find(p => p.productId === item.productId);
    if (product) {
      updateInventory(item.productId, item.quantity, 'sell');
      product.aiData.demandFactor = Math.min(1, product.aiData.demandFactor + 0.1);
    }
  });

  // Clear user's cart
  const userCartIndex = carts.findIndex(c => c.userId === userId);
  if (userCartIndex !== -1) {
    carts[userCartIndex].items = [];
  }

  res.json({
    success: true,
    message: 'Order created successfully',
    order,
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
  });
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
  const analytics = {
    products: {
      total: products.length,
      inStock: products.filter(p => p.inventory.stock > 0).length,
      lowStock: products.filter(p => p.inventory.stock <= p.inventory.lowStockThreshold && p.inventory.stock > 0).length,
      outOfStock: products.filter(p => p.inventory.stock === 0).length
    },
    sales: {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totals.total, 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totals.total, 0) / orders.length : 0
    },
    inventory: {
      totalStockValue: products.reduce((sum, p) => sum + (p.price * p.inventory.stock), 0),
      reservedItems: products.reduce((sum, p) => sum + p.inventory.reserved, 0)
    },
    ai: {
      mostViewed: products.sort((a, b) => b.aiData.viewCount - a.aiData.viewCount).slice(0, 3),
      highestConversion: products.sort((a, b) => b.aiData.conversionRate - a.aiData.conversionRate).slice(0, 3),
      highestDemand: products.sort((a, b) => b.aiData.demandFactor - a.aiData.demandFactor).slice(0, 3)
    }
  };

  res.json({ success: true, analytics });
});

// ===== ENHANCED ADMIN ROUTES =====

// Admin dashboard stats
app.get('/api/admin/stats', (req, res) => {
    const stats = {
        overview: {
            totalProducts: products.length,
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + order.totals.total, 0),
            totalCustomers: [...new Set(orders.map(order => order.userId))].length,
            monthlyRevenue: calculateMonthlyRevenue(),
            conversionRate: calculateConversionRate()
        },
        recentOrders: orders.slice(-10).reverse().map(order => ({
            orderId: order.orderId,
            createdAt: order.createdAt,
            status: order.status,
            totals: order.totals,
            items: order.items.length
        })),
        lowStock: products.filter(p => 
            p.inventory.stock <= p.inventory.lowStockThreshold
        ).map(p => ({
            productId: p.productId,
            name: p.name,
            inventory: p.inventory,
            category: p.category
        })),
        topProducts: products
            .sort((a, b) => b.aiData.demandFactor - a.aiData.demandFactor)
            .slice(0, 5)
            .map(p => ({
                productId: p.productId,
                name: p.name,
                demand: p.aiData.demandFactor,
                revenue: p.price * (p.aiData.conversionRate * p.aiData.viewCount)
            }))
    };

    res.json({ success: true, stats });
});

// Get all orders for admin
app.get('/api/admin/orders', (req, res) => {
    const adminOrders = orders.map(order => ({
        ...order,
        customer: order.userId,
        itemCount: order.items.length
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, orders: adminOrders });
});

// Update order status
app.put('/api/admin/orders/:orderId', (req, res) => {
    const order = orders.find(o => o.orderId === req.params.orderId);
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const { status } = req.body;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    
    // Add to timeline
    order.timeline.push({
        status: status,
        timestamp: new Date().toISOString(),
        note: `Status updated to ${status}`
    });

    res.json({ success: true, order });
});

// Helper functions
function calculateMonthlyRevenue() {
    const currentMonth = new Date().getMonth();
    return orders
        .filter(order => new Date(order.createdAt).getMonth() === currentMonth)
        .reduce((sum, order) => sum + order.totals.total, 0);
}

function calculateConversionRate() {
    const totalViews = products.reduce((sum, p) => sum + p.aiData.viewCount, 0);
    const totalSales = orders.reduce((sum, order) => sum + order.items.length, 0);
    return totalViews > 0 ? (totalSales / totalViews) * 100 : 0;
}

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 SWIFTBUY ADVANCED BACKEND - PRO MODE ACTIVATED');
  console.log('='.repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/api/health`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`📊 Analytics: http://localhost:${PORT}/api/analytics`);
  console.log('='.repeat(60));
  console.log('⚡ Features: AI Recommendations • Real-time Inventory • Analytics');
  console.log('📈 Advanced Filtering • Smart Cart System • Order Management');
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down advanced backend gracefully...');
  console.log('💾 Saving analytics data...');
  process.exit(0);
});