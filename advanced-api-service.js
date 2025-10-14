// ===== ADVANCED PRODUCT API SERVICE =====
class ProductApiService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generic request handler with caching
  async request(endpoint, options = {}) {
    const cacheKey = endpoint + JSON.stringify(options.body || {});
    
    // Check cache first
    if (options.method === 'GET' && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📦 Using cached response for:', endpoint);
        return cached.data;
      }
    }

    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      if (options.body) {
        config.body = JSON.stringify(options.body);
      }

      console.log('🔄 API Request:', { endpoint, config });

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful GET requests
      if (options.method === 'GET' && data.success) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;

    } catch (error) {
      console.error('❌ API Request Failed:', error);
      
      // Return cached data as fallback if available
      if (options.method === 'GET' && this.cache.has(cacheKey)) {
        console.log('🔄 Using cached fallback due to network error');
        return this.cache.get(cacheKey).data;
      }
      
      throw error;
    }
  }

  // ===== PRODUCT OPERATIONS =====

  // Get all products with filtering and pagination
  async getProducts(filters = {}) {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const endpoint = `/products?${params.toString()}`;
    return this.request(endpoint);
  }

  // Get single product with enhanced data
  async getProduct(productId) {
    if (!productId) {
      throw new Error('Product ID is required');
    }
    return this.request(`/products/${productId}`);
  }

  // Search products with suggestions
  async searchProducts(query, limit = 10) {
    return this.request(`/products/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  // Update product inventory (real-time sync)
  async updateInventory(productId, action, quantity) {
    if (!['reserve', 'release', 'sell', 'restock'].includes(action)) {
      throw new Error('Invalid inventory action');
    }

    return this.request(`/products/${productId}/inventory`, {
      method: 'PUT',
      body: { action, quantity }
    });
  }

  // ===== ADMIN PRODUCT OPERATIONS =====

  // Create new product
  async createProduct(productData) {
    return this.request('/admin/products', {
      method: 'POST',
      body: productData
    });
  }

  // Update product
  async updateProduct(productId, updates) {
    return this.request(`/admin/products/${productId}`, {
      method: 'PUT',
      body: updates
    });
  }

  // Bulk product operations
  async bulkProductOperation(action, productIds, data) {
    return this.request('/admin/products/bulk', {
      method: 'POST',
      body: { action, productIds, data }
    });
  }

  // ===== INVENTORY MANAGEMENT =====

  // Get low stock alerts
  async getLowStockAlerts(threshold = 5) {
    const products = await this.getProducts({ inStock: true });
    
    if (!products.success) return { success: true, lowStockItems: [] };

    const lowStockItems = products.products.filter(product => {
      const availableStock = product.inventory.stock - product.inventory.reserved;
      return availableStock > 0 && availableStock <= threshold;
    });

    return {
      success: true,
      lowStockItems,
      threshold
    };
  }

  // Get inventory analytics
  async getInventoryAnalytics() {
    const products = await this.getProducts();
    
    if (!products.success) {
      return {
        success: true,
        analytics: {
          totalProducts: 0,
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
          totalStockValue: 0
        }
      };
    }

    const analytics = {
      totalProducts: products.products.length,
      inStock: products.products.filter(p => p.inventory.stock > 0).length,
      lowStock: products.products.filter(p => 
        p.inventory.stock > 0 && 
        p.inventory.stock <= p.inventory.lowStockThreshold
      ).length,
      outOfStock: products.products.filter(p => p.inventory.stock === 0).length,
      totalStockValue: products.products.reduce((sum, product) => 
        sum + (product.price * product.inventory.stock), 0
      )
    };

    return {
      success: true,
      analytics
    };
  }

  // ===== CACHE MANAGEMENT =====

  clearCache() {
    this.cache.clear();
    console.log('🗑️ Product cache cleared');
  }

  // Preload essential products
  async preloadEssentialProducts() {
    try {
      console.log('🔄 Preloading essential products...');
      
      const [featured, trending, newArrivals] = await Promise.all([
        this.getProducts({ featured: 'true', limit: 8 }),
        this.getProducts({ trending: 'true', limit: 6 }),
        this.getProducts({ sortBy: 'newest', limit: 4 })
      ]);

      console.log('✅ Essential products preloaded');
      
      return {
        featured: featured.success ? featured.products : [],
        trending: trending.success ? trending.products : [],
        newArrivals: newArrivals.success ? newArrivals.products : []
      };

    } catch (error) {
      console.warn('⚠️ Product preloading failed, using fallback');
      return {
        featured: [],
        trending: [],
        newArrivals: []
      };
    }
  }
}

// Create global instance
window.productApi = new ProductApiService();

// Initialize product API service
window.initializeProductAPI = async function() {
  try {
    console.log('🚀 Initializing Product API Service...');
    
    // Test backend connectivity
    const healthCheck = await window.productApi.request('/health');
    
    if (healthCheck.status === 'OK') {
      console.log('✅ Backend connected successfully');
      
      // Preload essential data
      await window.productApi.preloadEssentialProducts();
      
      // Initialize real-time inventory sync
      initializeInventorySync();
      
      return true;
    } else {
      throw new Error('Backend health check failed');
    }
    
  } catch (error) {
    console.warn('❌ Backend connection failed, using offline mode:', error);
    
    // Initialize offline fallbacks
    initializeOfflineProductSystem();
    
    return false;
  }
};

// Real-time inventory synchronization
function initializeInventorySync() {
  console.log('🔄 Initializing real-time inventory sync...');
  
  // Listen for cart updates and sync inventory
  window.addEventListener('cartUpdated', async () => {
    try {
      // Refresh product data to reflect inventory changes
      window.productApi.clearCache();
      
      // Update any active product displays
      if (window.inventorySync) {
        window.inventorySync.refreshAll();
      }
      
    } catch (error) {
      console.warn('⚠️ Inventory sync failed:', error);
    }
  });

  // Periodic inventory sync (every 2 minutes)
  setInterval(async () => {
    try {
      window.productApi.clearCache();
      console.log('🔄 Periodic inventory sync completed');
    } catch (error) {
      console.warn('⚠️ Periodic sync failed:', error);
    }
  }, 2 * 60 * 1000);
}

// Offline fallback system
function initializeOfflineProductSystem() {
  console.log('📴 Initializing offline product system...');
  
  // Use localStorage as fallback data source
  const savedProducts = localStorage.getItem('swiftbuy_products');
  
  if (!savedProducts) {
    console.warn('⚠️ No offline product data available');
    return;
  }
  
  // Mock API methods for offline use
  window.productApi.getProducts = async function(filters = {}) {
    let products = JSON.parse(savedProducts);
    
    // Apply basic filtering
    if (filters.category && filters.category !== 'all') {
      products = products.filter(p => 
        p.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm)
      );
    }
    
    return {
      success: true,
      products,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalProducts: products.length,
        hasNext: false,
        hasPrev: false
      },
      offline: true
    };
  };
  
  console.log('✅ Offline product system ready');
}

console.log('🎯 Product API Service Loaded - Backend Integration Ready!');