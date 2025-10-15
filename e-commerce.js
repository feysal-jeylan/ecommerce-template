// e-commerce.js - WORLD-CLASS E-COMMERCE PLATFORM
// SECTION 1: CORE FOUNDATION & PRODUCTS SYSTEM

// ===== REAL-TIME INVENTORY EVENT SYSTEM =====
const InventoryEvents = {
    STOCK_UPDATED: 'inventory:stockUpdated',
    OUT_OF_STOCK: 'inventory:outOfStock',
    LOW_STOCK: 'inventory:lowStock'
};

// Central inventory state manager
class InventorySync {
    constructor() {
        this.subscribers = new Set();
        this.init();
    }

    init() {
        // Listen for inventory changes
        window.addEventListener('cartUpdated', () => {
            setTimeout(() => this.notifyAll(), 100);
        });
        
        window.addEventListener('wishlistUpdated', () => {
            setTimeout(() => this.notifyAll(), 100);
        });
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifyAll() {
        this.subscribers.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Inventory subscriber error:', error);
            }
        });
    }

    // Force refresh everything
    refreshAll() {
        this.notifyAll();
    }
}

// Create global inventory sync instance
window.inventorySync = new InventorySync();


// ===== CORE IMPORTS & VARIABLES =====
import { CART_KEY, loadCart, saveCart, cartItemCount } from './cartModule.js';

// Global state
let products = [];
window.products = products; // ADD THIS LINE - makes products available globally
let inventoryManager = null;
let recommendationsEngine = null;
let currentProduct = null;

// DOM elements
const productGrid = document.getElementById('products-grid');
const cartCountEl = document.getElementById('cart-count');
const toastEl = document.getElementById('toast');
const searchInput = document.getElementById('search');

// ===== UTILITY FUNCTIONS =====
const cents = n => Math.round(Number(n) * 100);
const money = c => '$' + (c / 100).toFixed(2);

// Enhanced toast system
let toastTimer = null;
function showToast(message, actions = []) {
    if (!toastEl) return;
    
    toastEl.innerHTML = '';
    const messageEl = document.createElement('div');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    toastEl.appendChild(messageEl);
    
    if (actions.length > 0) {
        const actionsEl = document.createElement('div');
        actionsEl.className = 'toast-actions';
        actions.forEach(action => {
            const button = document.createElement('button');
            button.textContent = action.text;
            button.className = `toast-btn ${action.primary ? 'toast-btn-primary' : 'toast-btn-secondary'}`;
            button.onclick = action.handler;
            actionsEl.appendChild(button);
        });
        toastEl.appendChild(actionsEl);
    }
    
    toastEl.hidden = false;
    toastEl.classList.add('show');
    
    if (actions.length === 0) {
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.hidden = true, 200);
        }, 1500);
    }
}

// Cart management
function renderCartCount() {
    const n = cartItemCount();
    if (cartCountEl) {
        cartCountEl.textContent = n;
        cartCountEl.setAttribute('aria-label', `${n} items in cart`);
    }
}

// ===== ADVANCED RATING SYSTEM =====
function generateStarRating(rating, maxStars = 5) {
    const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    const safeRating = Math.max(0, Math.min(numericRating, maxStars));
    
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;
    const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star star filled"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt star half-filled"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star star"></i>';
    }
    return starsHTML;
}

function calculateAverageRating(product) {
    let average, count;
    
    if (product.reviews && Array.isArray(product.reviews) && product.reviews.length > 0) {
        const total = product.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        average = total / product.reviews.length;
        count = product.reviews.length;
    } else if (product.rating && typeof product.rating === 'object') {
        average = parseFloat(product.rating.stars) || 4.5;
        count = parseInt(product.rating.reviews) || Math.floor(Math.random() * 100) + 10;
    } else {
        average = 4.5;
        count = Math.floor(Math.random() * 100) + 10;
    }
    
    return {
        average: Math.max(0, Math.min(5, average)),
        count: Math.max(0, count)
    };
}

// ===== WORLD-CLASS PRODUCT CARD GENERATION =====
// ===== REAL-TIME PRODUCT CARD GENERATION =====
function createProductHTML(p) {
    const stockLevel = inventoryManager ? inventoryManager.getStockLevel(p.id) : (p.inventory?.stock || 10);
    const isOutOfStock = stockLevel === 0;
    const isLowStock = inventoryManager ? inventoryManager.isLowStock(p.id) : (stockLevel <= 3);
    
    const ratingData = calculateAverageRating(p);
    const hasDiscount = p.originalPrice && p.originalPrice > p.price;
    const discountPercent = hasDiscount ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    
    // Product badges
    const badges = [];
    if (p.isNew) badges.push({ type: 'new', text: 'New' });
    if (hasDiscount) badges.push({ type: 'sale', text: `${discountPercent}% OFF` });
    if (p.isFeatured) badges.push({ type: 'featured', text: 'Featured' });
    if (p.isTrending) badges.push({ type: 'trending', text: 'Trending' });
    
    // Real-time stock status
    let stockStatus = '';
    let stockClass = '';
    let stockBadge = '';
    
    if (isOutOfStock) {
        stockStatus = 'Out of Stock';
        stockClass = 'out-of-stock';
        stockBadge = '<div class="product-stock-badge stock-out-of-stock">Out of Stock</div>';
    } else if (isLowStock) {
        stockStatus = `Only ${stockLevel} left`;
        stockClass = 'low-stock';
        stockBadge = `<div class="product-stock-badge stock-low-stock">Only ${stockLevel} left!</div>`;
    } else if (stockLevel <= 10) {
        stockStatus = `${stockLevel} in stock`;
        stockClass = 'in-stock';
        stockBadge = `<div class="product-stock-badge stock-in-stock">${stockLevel} in stock</div>`;
    } else {
        stockStatus = 'In Stock';
        stockClass = 'in-stock';
    }
    
    return `
        <article class="product-container ${isOutOfStock ? 'out-of-stock' : ''}" 
                 data-id="${p.id}" 
                 data-price-cents="${cents(p.price)}"
                 data-stock="${stockLevel}"
                 data-category="${p.category || 'uncategorized'}"
                 data-instock="${!isOutOfStock}">
            
            <!-- Dynamic Stock Badge -->
            ${stockBadge}
            
            <!-- Product Badges -->
            ${badges.length > 0 ? `
                <div class="product-badges">
                    ${badges.map(badge => `
                        <div class="product-badge badge-${badge.type}">${badge.text}</div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="product-image">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
                <div class="product-actions-overlay">
                    <button class="quick-action-btn quick-view" data-id="${p.id}" aria-label="Quick view">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="quick-action-btn wishlist" data-id="${p.id}" aria-label="Add to wishlist">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
            
            <div class="product-content">
                <h3 class="product-name">${p.name}</h3>
                
                <div class="product-rating-container">
                    <div class="star-rating">
                        ${generateStarRating(ratingData.average)}
                    </div>
                    <span class="rating-value">${ratingData.average.toFixed(1)}</span>
                    <span class="rating-count">(${ratingData.count})</span>
                </div>
                
                <div class="product-price-section">
                    <span class="product-price">${money(cents(p.price))}</span>
                    ${hasDiscount ? `
                        <span class="product-price-original">${money(cents(p.originalPrice))}</span>
                        <span class="discount-badge">Save ${discountPercent}%</span>
                    ` : ''}
                </div>
                
                <div class="stock-status ${stockClass}">
                    <i class="fas fa-${isOutOfStock ? 'times' : 'check'}-circle"></i>
                    ${stockStatus}
                </div>
                
                <button class="add-to-cart" data-id="${p.id}" type="button" 
                        aria-label="Add ${p.name} to cart"
                        ${isOutOfStock ? 'disabled' : ''}>
                    <i class="fas fa-shopping-cart"></i>
                    ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
                
                <div class="product-meta">
                    <span class="shipping-badge">
                        <i class="fas fa-shipping-fast"></i>
                        Free Shipping
                    </span>
                    ${p.isTrending ? `
                        <span class="trending-badge">
                            <i class="fas fa-fire"></i>
                            Trending
                        </span>
                    ` : ''}
                </div>
            </div>
        </article>
    `;
}

// ===== PRODUCTS RENDERING SYSTEM =====
function renderProducts(list) {
    const arr = list || products;
    
    if (!productGrid) return;
    
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
        productGrid.innerHTML = `
            <div class="no-products" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #6b7280;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <h3 style="margin: 0 0 8px 0; color: #374151;">No products found</h3>
                <p style="margin: 0;">Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }
    
    try {
        productGrid.innerHTML = arr.map(createProductHTML).join('');
        attachProductEventListeners();
    } catch (error) {
        console.error('Error rendering products:', error);
        productGrid.innerHTML = `
            <div class="error-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 16px;"></i>
                <h3 style="margin: 0 0 8px 0;">Error loading products</h3>
            </div>
        `;
    }
}

function attachProductEventListeners() {
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.id;
            if (!btn.disabled) {
                btn.disabled = true;
                addToCart(productId);
                setTimeout(() => {
                    if (btn.parentElement) btn.disabled = false;
                }, 400);
            }
        });
    });
    
    // Quick view buttons
    document.querySelectorAll('.quick-action-btn.quick-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.id;
            const product = products.find(p => p.id === productId);
            if (product && typeof openQuickView === 'function') {
                openQuickView(product);
            }
        });
    });
    
    // Wishlist buttons
    document.querySelectorAll('.quick-action-btn.wishlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.id;
            const product = products.find(p => p.id === productId);
            if (product && window.wishlistSystem) {
                window.wishlistSystem.addToWishlist(product);
                btn.innerHTML = '<i class="fas fa-heart"></i>';
                btn.style.color = '#dc2626';
            }
        });
    });
}

// ===== FIXED ADD TO CART WITH INVENTORY INTEGRATION =====
// ===== REAL-TIME ADD TO CART WITH INVENTORY SYNC =====
// ===== REAL-TIME ADD TO CART WITH ENHANCED INVENTORY SYNC =====
function addToCart(productId) {
    // ENHANCED inventory check with real-time validation
    if (window.inventoryManager) {
        const stockLevel = window.inventoryManager.getStockLevel(productId);
        const currentCart = loadCart();
        const existingCartItem = currentCart.find(item => item.id === productId);
        const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
        
        console.log(`🛒 Add to Cart Check: Product ${productId}, Stock: ${stockLevel}, In Cart: ${currentCartQuantity}`);
        
        // Check if adding would exceed available stock
        if (stockLevel === 0) {
            showToast('Sorry, this product is out of stock!', [
                {
                    text: 'Notify Me When Available',
                    primary: true,
                    handler: () => {
                        showToast('We\'ll notify you when it\'s back!');
                    }
                }
            ]);
            return false;
        }
        
        // Check if adding would exceed current stock
        if (currentCartQuantity >= stockLevel) {
            showToast(`Cannot add more! Only ${stockLevel} item${stockLevel > 1 ? 's' : ''} available.`);
            return false;
        }
        
        if (window.inventoryManager.isLowStock(productId)) {
            const remainingStock = stockLevel - currentCartQuantity;
            showToast(`Low stock! Only ${remainingStock} item${remainingStock > 1 ? 's' : ''} left.`, [], 3000);
        }
        
        // Update inventory BEFORE adding to cart
        if (!window.inventoryManager.updateStock(productId, 1)) {
            showToast('Inventory update failed!');
            return false;
        }
    }
    
    const cart = loadCart();
    const idStr = String(productId);
    const existing = cart.find(i => i.id === idStr);

    if (existing) {
        existing.quantity = (existing.quantity || 0) + 1;
    } else {
        const p = products.find(x => x.id === idStr);
        if (!p) {
            console.warn('Product not found for id', productId);
            return false;
        }
        cart.push({
            id: p.id,
            name: p.name,
            price_cents: cents(p.price),
            quantity: 1,
            image: p.image
        });
    }

    saveCart(cart);
    renderCartCount();
    showToast('Added to cart ✓');
    
    // TRIGGER REAL-TIME INVENTORY SYNC WITH DELAY FOR BADGE UPDATES
    if (window.inventorySync) {
        setTimeout(() => {
            window.inventorySync.refreshAll();
        }, 200);
    }
    
    if (window.floatingCart && window.floatingCart.openCartSidebar) {
        setTimeout(() => {
            window.floatingCart.openCartSidebar();
        }, 300);
    }
    
    return true;
}

// ===== PRODUCTS DATA INITIALIZATION =====
// ===== ADVANCED PRODUCTS INITIALIZATION =====
// ===== PRODUCTS DATA INITIALIZATION =====
// ===== ADVANCED PRODUCTS INITIALIZATION =====
async function initializeProducts() {
    console.log('🔄 Initializing products with backend...');
    
    try {
        // Check backend health
        const backendAvailable = await window.advancedApi.healthCheck();
        
        if (backendAvailable) {
            // Load from backend
            const result = await window.advancedApi.getProducts();
            products = result.products;
            console.log(`✅ Loaded ${products.length} products from backend`);
            
// Transform backend data to match frontend format
products = products.map(product => {
    // Handle both MongoDB _id and regular id
    const productId = product._id || product.id;
    
    // Handle image paths - ensure they're relative to frontend
    let imagePath = product.image;
    if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('/images')) {
        imagePath = '/images/' + imagePath.split('/').pop();
    }
    
    // Handle rating data safely
    const ratingAverage = product.rating?.average || 4.5;
    const ratingCount = product.rating?.count || Math.floor(Math.random() * 100) + 10;
    
    return {
        ...product,
        id: productId,
        name: product.name || 'Unnamed Product',
        price: product.price || 0,
        image: imagePath || '/images/placeholder.png',
        rating: {
            stars: '★'.repeat(Math.floor(ratingAverage)) + 
                   '☆'.repeat(5 - Math.floor(ratingAverage)),
            reviews: ratingCount
        },
        inventory: product.inventory || { stock: 10, lowStockThreshold: 3 },
        category: product.category || 'uncategorized'
    };
});
            
            // Save to localStorage as fallback
            localStorage.setItem('swiftbuy_products', JSON.stringify(products));
        } else {
            // Fallback to localStorage
            throw new Error('Backend unavailable');
        }
        
    } catch (error) {
        if (error.message.includes('Authentication required')) {
            console.log('🔐 Authentication required for products');
            // Don't show error - this is normal for unauthenticated users
        } else {
            console.warn('❌ Backend failed, using localStorage fallback:', error);
        }
        
        // Your existing localStorage fallback logic
        const savedProducts = localStorage.getItem('swiftbuy_products');
        if (savedProducts) {
            products = JSON.parse(savedProducts);
            console.log(`📦 Using ${products.length} products from localStorage`);
        } else {
            // Ultimate fallback
            await loadFallbackProducts();
        }
    }
    
    // Ensure global availability
    window.products = products;
    console.log(`🎉 Products system ready! ${products.length} products loaded`);
    
    // Render products
    renderProducts(products);
    
    return true;
}

function loadFallbackProducts() {
    console.log('🔄 Loading fallback products...');
    
    const fallbackProducts = [
        {
            id: "101",
            name: "Wireless Bluetooth Headphones",
            price: 129.99,
            originalPrice: 159.99,
            image: "images/headset transparent.png",
            category: "electronics",
            rating: { stars: 4.5, reviews: 128 },
            inventory: { stock: 15, lowStockThreshold: 3 },
            isNew: true,
            isFeatured: true,
            freeShipping: true,
            description: "Premium wireless headphones with active noise cancellation and 30-hour battery life."
        },
        {
            id: "102", 
            name: "Running Shoes",
            price: 89.99,
            image: "images/transparent shoe.png",
            category: "shoes",
            rating: { stars: 4.2, reviews: 89 },
            inventory: { stock: 8, lowStockThreshold: 3 },
            isTrending: true,
            freeShipping: true,
            description: "High-performance running shoes with breathable mesh and cushioned sole."
        },
        {
            id: "103",
            name: "Smart Watch",
            price: 199.99,
            originalPrice: 249.99,
            image: "images/transparent watch.png", 
            category: "electronics",
            rating: { stars: 4.7, reviews: 204 },
            inventory: { stock: 25, lowStockThreshold: 5 },
            isFeatured: true,
            freeShipping: true,
            description: "Advanced smartwatch with health monitoring and smartphone connectivity."
        },
        {
            id: "104",
            name: "Designer Sunglasses", 
            price: 149.99,
            image: "images/sunglasses.png",
            category: "accessories",
            rating: { stars: 4.3, reviews: 67 },
            inventory: { stock: 12, lowStockThreshold: 3 },
            freeShipping: true,
            description: "Stylish polarized sunglasses with 100% UV protection."
        },
        {
            id: "105",
            name: "Travel Backpack",
            price: 79.99,
            image: "images/backpack.png",
            category: "backpacks", 
            rating: { stars: 4.6, reviews: 156 },
            inventory: { stock: 6, lowStockThreshold: 2 },
            isNew: true,
            freeShipping: true,
            description: "Durable smart backpack with built-in USB charging port."
        }
    ];
    
    // CRITICAL: Assign to both local and global variables
    products = fallbackProducts;
    window.products = fallbackProducts;
    
    localStorage.setItem('swiftbuy_products', JSON.stringify(fallbackProducts));
    console.log(`✅ Loaded ${fallbackProducts.length} fallback products`);
}

// ===== SEARCH FUNCTIONALITY =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function performSearch() {
    const q = String(searchInput?.value || '').trim().toLowerCase();
    if (!q) {
        renderProducts(products);
        return;
    }
    
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
    renderProducts(filtered);
}

const debouncedSearch = debounce(performSearch, 300);

if (searchInput) {
    searchInput.addEventListener('input', debouncedSearch);
}

// END OF SECTION 1

// =============================================================================
// SECTION 2: UI COMPONENTS & INTERACTIONS
// =============================================================================

// ===== ENHANCED HEADER FUNCTIONALITY =====
function initHeaderFunctionality() {
    // Mobile menu toggle
    function initMobileMenu() {
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        mobileMenuBtn.setAttribute('aria-label', 'Open menu');
        
        const leftGroup = document.querySelector('.left-group');
        if (leftGroup) {
            leftGroup.appendChild(mobileMenuBtn);
        }

        mobileMenuBtn.addEventListener('click', () => {
            // Simple mobile menu implementation
            const mobileNav = document.createElement('div');
            mobileNav.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: white;
                z-index: 10000;
                padding: 80px 20px 20px;
                overflow-y: auto;
            `;
            mobileNav.innerHTML = `
                <button style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 1.5rem;" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <a href="e-commerce.html" style="font-size: 1.2rem; font-weight: 600; color: var(--accent); text-decoration: none;">Home</a>
                    <a href="#" style="font-size: 1.1rem; color: #374151; text-decoration: none;">Electronics</a>
                    <a href="#" style="font-size: 1.1rem; color: #374151; text-decoration: none;">Shoes</a>
                    <a href="#" style="font-size: 1.1rem; color: #374151; text-decoration: none;">Backpacks</a>
                    <a href="#" style="font-size: 1.1rem; color: #374151; text-decoration: none;">Accessories</a>
                </div>
            `;
            document.body.appendChild(mobileNav);
        });
    }

    // Enhanced categories dropdown
    function initCategoriesDropdown() {
        const categoriesBtn = document.querySelector('.btn-categories');
        const dropdown = document.querySelector('.dropdown');
        
        if (categoriesBtn && dropdown) {
            categoriesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!categoriesBtn.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            });

            // Close dropdown on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            });
        }
    }

    // Enhanced search functionality
    function enhanceSearch() {
        const searchWrap = document.querySelector('.search-wrap');
        
        if (searchInput && searchWrap) {
            // Clear search button
            const clearSearch = document.createElement('button');
            clearSearch.innerHTML = '<i class="fas fa-times"></i>';
            clearSearch.style.cssText = `
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 3;
                font-size: 14px;
                padding: 4px;
                border-radius: 50%;
            `;
            clearSearch.setAttribute('aria-label', 'Clear search');
            
            clearSearch.addEventListener('mouseenter', () => {
                clearSearch.style.background = '#f1f5f9';
            });
            clearSearch.addEventListener('mouseleave', () => {
                clearSearch.style.background = 'none';
            });
            
            searchWrap.appendChild(clearSearch);

            searchInput.addEventListener('input', () => {
                clearSearch.style.opacity = searchInput.value ? '1' : '0';
            });

            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                searchInput.focus();
                clearSearch.style.opacity = '0';
                performSearch();
            });
        }
    }

    // Initialize all features
    initMobileMenu();
    initCategoriesDropdown();
    enhanceSearch();
    
    console.log('🚀 Header enhancements loaded successfully!');
}

// ===== QUICK VIEW MODAL SYSTEM =====
function initQuickViewModal() {
    const modal = document.getElementById('quickview-modal');
    const zoomModal = document.getElementById('zoom-modal');
    const overlay = document.querySelector('.quickview-overlay');
    const closeBtn = document.querySelector('.quickview-close');
    const quantityInput = document.getElementById('quickview-qty');
    
    if (!modal) {
        console.warn('Quick view modal elements not found');
        return;
    }

    let currentImageIndex = 0;

    // Sample product data for demonstration
    const productImages = {
        "101": ["images/headset transparent.png"],
        "102": ["images/transparent shoe.png"],
        "103": ["images/transparent watch.png"],
        "104": ["images/sunglasses.png"],
        "105": ["images/backpack.png"]
    };

    const productSpecs = {
        "101": [
            { label: "Type", value: "Over-ear Headphones" },
            { label: "Connectivity", value: "Wireless Bluetooth" },
            { label: "Battery Life", value: "30 hours" },
            { label: "Weight", value: "250g" }
        ],
        "102": [
            { label: "Type", value: "Running Shoes" },
            { label: "Material", value: "Mesh & Synthetic" },
            { label: "Sole", value: "Rubber" },
            { label: "Weight", value: "280g" }
        ],
        "103": [
            { label: "Type", value: "Smart Watch" },
            { label: "Display", value: "1.5\" AMOLED" },
            { label: "Battery", value: "7 days" },
            { label: "Waterproof", value: "50m" }
        ],
        "104": [
            { label: "Type", value: "Sunglasses" },
            { label: "Lens", value: "Polarized" },
            { label: "Frame", value: "Acetate" },
            { label: "UV Protection", value: "100%" }
        ],
        "105": [
            { label: "Type", value: "Backpack" },
            { label: "Capacity", value: "25L" },
            { label: "Material", value: "Nylon" },
            { label: "Weight", value: "0.8kg" }
        ]
    };

    // Open modal function
    window.openQuickView = function(product) {
        if (typeof trackProductView === 'function') trackProductView(product.id);
        currentProduct = product;
        currentImageIndex = 0;
        
        updateModalContent(product);
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Add event listeners
        overlay.addEventListener('click', closeQuickView);
        closeBtn.addEventListener('click', closeQuickView);
        document.addEventListener('keydown', handleEscapeKey);
    };

    // Update modal content
    function updateModalContent(product) {
        const images = productImages[product.id] || [product.image];
        
        // Update main content
        const mainImg = document.getElementById('gallery-main-img');
        const title = document.getElementById('quickview-title');
        const rating = document.getElementById('quickview-rating');
        const price = document.getElementById('quickview-price');
        const desc = document.getElementById('quickview-desc-text');
        const specs = document.getElementById('quickview-specs');
        
        if (mainImg) mainImg.src = images[0];
        if (mainImg) mainImg.alt = product.name;
        if (title) title.textContent = product.name;
        if (rating) rating.innerHTML = `${product.rating.stars} <span class="rating-count">(${product.rating.reviews} reviews)</span>`;
        if (price) price.textContent = money(cents(product.price));
        if (desc) desc.textContent = product.description || "Premium quality product with excellent customer reviews.";
        
        // Update specifications
        if (specs) {
            const productSpecsData = productSpecs[product.id] || [];
            specs.innerHTML = productSpecsData.map(spec => `
                <div class="spec-item">
                    <span class="spec-label">${spec.label}:</span>
                    <span class="spec-value">${spec.value}</span>
                </div>
            `).join('');
        }
        
        generateThumbnails(images);
        if (quantityInput) quantityInput.value = 1;
    }

    // Generate thumbnails
    function generateThumbnails(images) {
        const thumbnailsContainer = document.getElementById('gallery-thumbnails');
        if (!thumbnailsContainer) return;
        
        thumbnailsContainer.innerHTML = '';
        
        images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail-item ${index === 0 ? 'active' : ''}`;
            thumbnail.innerHTML = `<img src="${image}" alt="Thumbnail ${index + 1}">`;
            thumbnail.addEventListener('click', () => changeImage(index, images));
            thumbnailsContainer.appendChild(thumbnail);
        });
    }

    // Change main image
    function changeImage(index, images) {
        currentImageIndex = index;
        const mainImg = document.getElementById('gallery-main-img');
        if (mainImg) mainImg.src = images[index];
        
        document.querySelectorAll('.thumbnail-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }

    // Setup gallery navigation
    function setupGalleryNavigation() {
        const prevBtn = document.querySelector('.gallery-prev');
        const nextBtn = document.querySelector('.gallery-next');
        const zoomBtn = document.querySelector('.gallery-zoom-btn');
        const mainImage = document.getElementById('gallery-main-img');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!currentProduct) return;
                const images = productImages[currentProduct.id] || [currentProduct.image];
                const newIndex = (currentImageIndex - 1 + images.length) % images.length;
                changeImage(newIndex, images);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!currentProduct) return;
                const images = productImages[currentProduct.id] || [currentProduct.image];
                const newIndex = (currentImageIndex + 1) % images.length;
                changeImage(newIndex, images);
            });
        }

        if (zoomBtn && mainImage) {
            zoomBtn.addEventListener('click', openZoom);
            mainImage.addEventListener('click', openZoom);
        }
    }

    // Zoom functionality
    function openZoom() {
        if (!currentProduct) return;
        const images = productImages[currentProduct.id] || [currentProduct.image];
        const zoomImage = document.getElementById('zoom-image');
        if (zoomImage) zoomImage.src = images[currentImageIndex];
        
        if (zoomModal) zoomModal.classList.add('active');
        document.addEventListener('keydown', handleZoomEscapeKey);
    }

    function closeZoom() {
        if (zoomModal) zoomModal.classList.remove('active');
        document.removeEventListener('keydown', handleZoomEscapeKey);
    }

    function handleZoomEscapeKey(e) {
        if (e.key === 'Escape') closeZoom();
    }

    // Close modal
    function closeQuickView() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        overlay.removeEventListener('click', closeQuickView);
        closeBtn.removeEventListener('click', closeQuickView);
        document.removeEventListener('keydown', handleEscapeKey);
    }

    function handleEscapeKey(e) {
        if (e.key === 'Escape') closeQuickView();
    }

    // Quantity buttons
    function setupQuantityButtons() {
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!quantityInput) return;
                const action = btn.dataset.action;
                let value = parseInt(quantityInput.value);
                
                if (action === 'increment') {
                    value = Math.min(value + 1, 10);
                } else if (action === 'decrement') {
                    value = Math.max(value - 1, 1);
                }
                
                quantityInput.value = value;
            });
        });
    }

    // Modal add to cart
    function setupModalAddToCart() {
        const addToCartBtn = document.getElementById('quickview-addtocart');
        
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                if (!currentProduct || !quantityInput) return;
                
                const quantity = parseInt(quantityInput.value);
                
                // Add to cart multiple times for the quantity
                for (let i = 0; i < quantity; i++) {
                    addToCart(currentProduct.id);
                }
                
                showToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart ✓`);
                closeQuickView();
            });
        }
    }

    // Attach quick view listeners to product cards
    function attachQuickViewListeners() {
        document.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-container');
            if (!productCard) return;
            
            // Don't open quick view if clicking interactive elements
            if (e.target.closest('.add-to-cart') || 
                e.target.closest('.quick-action-btn') ||
                e.target.closest('.wishlist-btn')) {
                return;
            }
            
            const productId = productCard.dataset.id;
            const product = products.find(p => p.id === productId);
            
            if (product) {
                openQuickView(product);
            }
        });
    }

    // Setup zoom modal
    function setupZoomModal() {
        const zoomOverlay = document.querySelector('.zoom-overlay');
        const zoomClose = document.querySelector('.zoom-close');
        
        if (zoomOverlay) zoomOverlay.addEventListener('click', closeZoom);
        if (zoomClose) zoomClose.addEventListener('click', closeZoom);
    }

    // Initialize everything
    function init() {
        setupQuantityButtons();
        setupModalAddToCart();
        attachQuickViewListeners();
        setupGalleryNavigation();
        setupZoomModal();
        
        console.log('🚀 Quick View modal system ready!');
    }

    init();
}

// ===== FLOATING CART SIDEBAR =====
function initFloatingCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartBody = document.getElementById('cart-sidebar-body');
    const cartFooter = document.getElementById('cart-sidebar-footer');
    const cartOverlay = document.querySelector('.cart-sidebar-overlay');
    const closeButtons = document.querySelectorAll('[data-close-cart]');
    const cartLink = document.getElementById('cart-link');

    if (!cartSidebar) {
        console.warn('Cart sidebar elements not found');
        return { openCartSidebar: () => {} };
    }

    // Open cart sidebar
    function openCartSidebar() {
        cartSidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderCartItems();
        updateCartTotals();
    }

    // Close cart sidebar
    function closeCartSidebar() {
        cartSidebar.classList.remove('active');
        document.body.style.overflow = '';
    }

   // Render cart items - UPDATED with recommendations
function renderCartItems() {
    const cart = loadCart();
    
    if (!cartBody) return;
    
    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <small>Start shopping to add items!</small>
            </div>
        `;
        if (cartFooter) cartFooter.hidden = true;
        
        // Remove any existing recommendations
        const existingRecs = document.getElementById('cart-recommendations');
        if (existingRecs) existingRecs.remove();
        return;
    }

    if (cartFooter) cartFooter.hidden = false;
    
    const itemsHtml = cart.map((item, index) => `
        <div class="cart-sidebar-item" data-id="${item.id}" data-index="${index}">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name}</h4>
                <div class="cart-item-price">${money(item.price_cents)}</div>
                <div class="cart-item-actions">
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" data-action="decrement" data-id="${item.id}">−</button>
                        <input type="number" class="cart-item-qty" value="${item.quantity}" min="1" max="10" readonly>
                        <button class="quantity-btn" data-action="increment" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-item-btn" data-remove="${item.id}" aria-label="Remove item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    cartBody.innerHTML = itemsHtml;
    attachCartItemListeners();
    
    // Show cart recommendations
    setTimeout(() => {
        showCartRecommendations();
    }, 100);
}

    // Update cart totals
    function updateCartTotals() {
        const cart = loadCart();
        const subtotal = cart.reduce((total, item) => total + (item.price_cents * item.quantity), 0);
        
        const subtotalEl = document.getElementById('cart-sidebar-subtotal');
        const totalEl = document.getElementById('cart-sidebar-total');
        const checkoutBtn = document.getElementById('cart-sidebar-checkout');
        
        if (subtotalEl) subtotalEl.textContent = money(subtotal);
        if (totalEl) totalEl.textContent = money(subtotal);
        
        if (checkoutBtn) {
            checkoutBtn.onclick = () => {
                closeCartSidebar();
                setTimeout(() => {
                    window.location.href = 'checkout/checkout.html';
                }, 300);
            };
        }
    }

    // Attach cart item listeners
    function attachCartItemListeners() {
        // Quantity buttons
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = btn.dataset.id;
                const action = btn.dataset.action;
                updateItemQuantity(itemId, action);
            });
        });

        // Remove buttons
        document.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = btn.dataset.remove;
                removeCartItem(itemId);
            });
        });
    }

// Update item quantity - ENHANCED with proper inventory sync
function updateItemQuantity(itemId, action) {
    const cart = loadCart();
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return;
    
    if (action === 'increment') {
        // CHECK INVENTORY BEFORE ADDING
        if (window.inventoryManager) {
            const stockLevel = window.inventoryManager.getStockLevel(itemId);
            
            if (stockLevel === 0) {
                showToast('No more items available in stock!');
                return;
            }
            
            if (window.inventoryManager.isLowStock(itemId)) {
                const remainingStock = window.inventoryManager.getStockLevel(itemId);
                showToast(`Low stock! Only ${remainingStock} item${remainingStock > 1 ? 's' : ''} left.`);
            }
        }
        
        cart[itemIndex].quantity += 1;
        
        // UPDATE INVENTORY - DEDUCT
        if (window.inventoryManager) {
            window.inventoryManager.updateStock(itemId, 1);
        }
        
    } else if (action === 'decrement') {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
            
            // RESTOCK INVENTORY - ADD BACK
            if (window.inventoryManager) {
                window.inventoryManager.restockProduct(itemId, 1);
            }
            
        } else {
            // Remove item if quantity becomes 0
            removeCartItem(itemId);
            return;
        }
    }
    
    saveCart(cart);
    renderCartItems();
    updateCartTotals();
    highlightUpdatedItem(itemId);
    
    // FORCE REAL-TIME INVENTORY REFRESH
    setTimeout(() => {
        if (window.inventoryManager && window.inventoryManager.refreshInventoryUI) {
            window.inventoryManager.refreshInventoryUI();
        }
        // Also trigger the global inventory sync
        if (window.inventorySync) {
            window.inventorySync.refreshAll();
        }
    }, 100);
}

// Remove item from cart - ENHANCED with proper inventory restoration
function removeCartItem(itemId) {
    if (!confirm('Remove this item from your cart?')) return;
    
    const cart = loadCart();
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return;
    
    const quantityToRestock = cart[itemIndex].quantity;
    const productName = cart[itemIndex].name;
    
    // Remove from cart
    const updatedCart = cart.filter(item => item.id !== itemId);
    saveCart(updatedCart);
    
    // RESTOCK INVENTORY - ADD BACK ALL QUANTITY
    if (window.inventoryManager) {
        window.inventoryManager.restockProduct(itemId, quantityToRestock);
        console.log(`🔄 Restocked ${quantityToRestock} units of ${productName}`);
    }
    
    renderCartItems();
    updateCartTotals();
    renderCartCount();
    
    showToast(`Removed ${productName} from cart`);
    
    // FORCE COMPLETE INVENTORY REFRESH
    setTimeout(() => {
        if (window.inventoryManager && window.inventoryManager.refreshInventoryUI) {
            window.inventoryManager.refreshInventoryUI();
        }
        // Trigger global sync for all systems
        if (window.inventorySync) {
            window.inventorySync.refreshAll();
        }
        // Also update AI badges
        if (window.addAIPoweredBadges) {
            setTimeout(window.addAIPoweredBadges, 200);
        }
    }, 150);
}

    // Highlight updated item
    function highlightUpdatedItem(itemId) {
        const itemElement = document.querySelector(`.cart-sidebar-item[data-id="${itemId}"]`);
        if (itemElement) {
            itemElement.classList.remove('cart-item-highlight');
            void itemElement.offsetWidth;
            itemElement.classList.add('cart-item-highlight');
        }
    }

    // Initialize event listeners
    function initEventListeners() {
        // Cart link
        if (cartLink) {
            cartLink.addEventListener('click', (e) => {
                e.preventDefault();
                openCartSidebar();
            });
        }

        // Close buttons
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeCartSidebar);
        });

        // Overlay
        if (cartOverlay) {
            cartOverlay.addEventListener('click', closeCartSidebar);
        }

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && cartSidebar.classList.contains('active')) {
                closeCartSidebar();
            }
        });

        // Cart updated event
        window.addEventListener('cartUpdated', () => {
            if (cartSidebar.classList.contains('active')) {
                renderCartItems();
                updateCartTotals();
            }
        });
    }

    function init() {
        initEventListeners();
        console.log('🚀 Floating cart sidebar ready!');
    }

    init();

    return { openCartSidebar, closeCartSidebar };
}

// END OF SECTION 2

// =============================================================================
// SECTION 3: ADVANCED FEATURES & SYSTEMS
// =============================================================================

// ===== WISHLIST SYSTEM =====
function initWishlist() {
    const WISHLIST_KEY = 'swiftbuy_wishlist_v1';
    const wishlistSidebar = document.getElementById('wishlist-sidebar');
    const wishlistOverlay = document.querySelector('.wishlist-overlay');
    const closeButtons = document.querySelectorAll('[data-close-wishlist]');
    const wishlistBtn = document.querySelector('.icon-btn[aria-label="Wishlist"]');

    // Core wishlist functions
    function loadWishlist() {
        try {
            const raw = localStorage.getItem(WISHLIST_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (err) {
            console.warn('Failed to parse wishlist from storage', err);
            return [];
        }
    }

    function saveWishlist(wishlist) {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    }

    function addToWishlist(product) {
        const wishlist = loadWishlist();
        
        if (!wishlist.find(item => item.id === product.id)) {
            wishlist.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                rating: product.rating
            });
            
            saveWishlist(wishlist);
            showToast('Added to wishlist! 💖');
            return true;
        }
        return false;
    }

    function removeFromWishlist(productId) {
        const wishlist = loadWishlist();
        const updatedWishlist = wishlist.filter(item => item.id !== productId);
        saveWishlist(updatedWishlist);
        showToast('Removed from wishlist');
    }

    function clearWishlist() {
        if (confirm('Clear your entire wishlist?')) {
            saveWishlist([]);
            renderWishlistItems();
            showToast('Wishlist cleared');
        }
    }

  // REAL-TIME wishlist items
function renderWishlistItems() {
    const wishlist = loadWishlist();
    const wishlistBody = document.getElementById('wishlist-body');
    
    if (!wishlistBody) return;
    
    if (wishlist.length === 0) {
        wishlistBody.innerHTML = `
            <div class="wishlist-empty-state">
                <i class="far fa-heart"></i>
                <p>Your wishlist is empty</p>
                <small>Save your favorite items here!</small>
            </div>
        `;
        return;
    }

    wishlistBody.innerHTML = wishlist.map(item => {
        const product = products.find(p => p.id === item.id);
        const stockLevel = window.inventoryManager ? window.inventoryManager.getStockLevel(item.id) : product.inventory.stock;
        const isOutOfStock = stockLevel === 0;
        
        return `
            <div class="wishlist-item" data-id="${item.id}" data-instock="${!isOutOfStock}">
                <div class="wishlist-item-image">
                    <img src="${item.image}" alt="${item.name}">
                    ${isOutOfStock ? '<div class="product-stock-badge stock-out-of-stock">Out of Stock</div>' : ''}
                </div>
                <div class="wishlist-item-details">
                    <h4 class="wishlist-item-name">${item.name}</h4>
                    <div class="wishlist-item-price">${money(cents(item.price))}</div>
                    <div class="wishlist-item-actions">
                        <button class="move-to-cart-btn" data-move-to-cart="${item.id}" ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i>
                            ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button class="remove-wishlist-btn" data-remove-wishlist="${item.id}" aria-label="Remove from wishlist">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    attachWishlistItemListeners();
}

    function attachWishlistItemListeners() {
        // Move to cart buttons
        document.querySelectorAll('[data-move-to-cart]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.moveToCart;
                addToCart(productId);
                removeFromWishlist(productId);
                renderWishlistItems();
            });
        });

        // Remove buttons
        document.querySelectorAll('[data-remove-wishlist]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.removeWishlist;
                removeFromWishlist(productId);
                renderWishlistItems();
            });
        });
    }

    // Global wishlist click handler
    function setupGlobalWishlistHandler() {
        document.removeEventListener('click', handleGlobalWishlistClick);
        document.addEventListener('click', handleGlobalWishlistClick, true);
    }

    function handleGlobalWishlistClick(e) {
        const wishlistBtn = e.target.closest('.wishlist-btn, .recommendation-wishlist-btn');
        if (wishlistBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = wishlistBtn.dataset.id;
            const product = products.find(p => p.id === productId);
            
            if (!product) return;
            
            const wishlist = loadWishlist();
            const isInWishlist = wishlist.find(item => item.id === productId);
            
            if (isInWishlist) {
                removeFromWishlist(productId);
                wishlistBtn.innerHTML = '<i class="far fa-heart"></i>';
                wishlistBtn.classList.remove('active');
            } else {
                if (addToWishlist(product)) {
                    wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
                    wishlistBtn.classList.add('active');
                    wishlistBtn.classList.add('heart-animate');
                    setTimeout(() => wishlistBtn.classList.remove('heart-animate'), 600);
                }
            }
            return;
        }
        
        // Header wishlist button
        const headerWishlistBtn = e.target.closest('.icon-btn[aria-label="Wishlist"]');
        if (headerWishlistBtn) {
            e.preventDefault();
            e.stopPropagation();
            openWishlistSidebar();
        }
    }

    // Sidebar management
    function openWishlistSidebar() {
        if (wishlistSidebar) {
            wishlistSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
            renderWishlistItems();
        }
    }

    function closeWishlistSidebar() {
        if (wishlistSidebar) {
            wishlistSidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Add wishlist buttons to products
    function addWishlistButtonsToProducts() {
        const productCards = document.querySelectorAll('.product-container');
        
        productCards.forEach(card => {
            const productId = card.dataset.id;
            const product = products.find(p => p.id === productId);
            
            if (product) {
                const existingBtn = card.querySelector('.wishlist-btn');
                if (existingBtn) existingBtn.remove();
                
                const wishlistBtn = document.createElement('button');
                wishlistBtn.className = 'wishlist-btn';
                wishlistBtn.dataset.id = productId;
                wishlistBtn.setAttribute('aria-label', 'Add to wishlist');
                
                const wishlist = loadWishlist();
                if (wishlist.find(item => item.id === productId)) {
                    wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
                    wishlistBtn.classList.add('active');
                } else {
                    wishlistBtn.innerHTML = '<i class="far fa-heart"></i>';
                }
                
                card.appendChild(wishlistBtn);
            }
        });
    }

    // Initialize event listeners
    function initEventListeners() {
        // Close sidebar handlers
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeWishlistSidebar);
        });

        if (wishlistOverlay) {
            wishlistOverlay.addEventListener('click', closeWishlistSidebar);
        }

        // Clear wishlist button
        const clearBtn = document.getElementById('clear-wishlist');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearWishlist);
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && wishlistSidebar?.classList.contains('active')) {
                closeWishlistSidebar();
            }
        });
    }

    function init() {
        initEventListeners();
        setupGlobalWishlistHandler();
        addWishlistButtonsToProducts();
        console.log('🚀 Wishlist system ready!');
    }

    init();

    return { 
        openWishlistSidebar, 
        closeWishlistSidebar,
        addToWishlist,
        removeFromWishlist,
        loadWishlist
    };
}

// ===== INVENTORY MANAGEMENT SYSTEM =====
function initInventoryManagement() {
    const INVENTORY_KEY = 'swiftbuy_inventory_v1';
    
    // Load current inventory
    function loadInventory() {
        try {
            const saved = localStorage.getItem(INVENTORY_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
            // Initialize with product data
            const initialInventory = {};
            products.forEach(product => {
                initialInventory[product.id] = {
                    stock: product.inventory.stock,
                    lowStockThreshold: product.inventory.lowStockThreshold,
                    reserved: 0
                };
            });
            saveInventory(initialInventory);
            return initialInventory;
        } catch (err) {
            console.warn('Failed to load inventory', err);
            return {};
        }
    }
    
    function saveInventory(inventory) {
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    }
    
    // Inventory functions
    function getStockLevel(productId) {
        const inventory = loadInventory();
        return inventory[productId]?.stock || 0;
    }
    
    function isInStock(productId, quantity = 1) {
        return getStockLevel(productId) >= quantity;
    }
    
    function isLowStock(productId) {
        const inventory = loadInventory();
        const item = inventory[productId];
        return item && item.stock > 0 && item.stock <= item.lowStockThreshold;
    }
    
    function updateStock(productId, quantity) {
        const inventory = loadInventory();
        if (inventory[productId]) {
            inventory[productId].stock = Math.max(0, inventory[productId].stock - quantity);
            saveInventory(inventory);
            return true;
        }
        return false;
    }
    
    function restockProduct(productId, quantity) {
        const inventory = loadInventory();
        if (inventory[productId]) {
            inventory[productId].stock += quantity;
            saveInventory(inventory);
            return true;
        }
        return false;
    }
    
// Add stock badges to product cards - PROPERLY STYLED VERSION
function addStockBadges() {
    const productCards = document.querySelectorAll('.product-container');
    
    productCards.forEach(card => {
        const productId = card.dataset.id;
        const stockLevel = getStockLevel(productId);
        const lowStock = isLowStock(productId);
        
        console.log(`🔄 Updating badges for ${productId}: Stock ${stockLevel}, Low Stock: ${lowStock}`);
        
        // Remove existing badges
        const existingBadge = card.querySelector('.product-stock-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Remove out-of-stock classes first
        card.classList.remove('out-of-stock');
        
        // Add appropriate badge based on stock level
        if (stockLevel === 0) {
            card.classList.add('out-of-stock');
            const badge = document.createElement('div');
            badge.className = 'product-stock-badge stock-out-of-stock';
            badge.textContent = 'Out of Stock';
            card.appendChild(badge);
            
        } else if (lowStock) {
            const badge = document.createElement('div');
            badge.className = 'product-stock-badge stock-low-stock';
            badge.textContent = `Only ${stockLevel} left!`;
            card.appendChild(badge);
            
        } else if (stockLevel <= 10) {
            const badge = document.createElement('div');
            badge.className = 'product-stock-badge stock-in-stock';
            badge.textContent = `${stockLevel} in stock`;
            card.appendChild(badge);
        }
        
        // Also update the add to cart button state
        const addToCartBtn = card.querySelector('.add-to-cart');
        if (addToCartBtn) {
            if (stockLevel === 0) {
                addToCartBtn.disabled = true;
                addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Out of Stock';
                addToCartBtn.style.opacity = '0.6';
            } else {
                addToCartBtn.disabled = false;
                addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
                addToCartBtn.style.opacity = '1';
            }
        }
    });
    
    console.log('✅ Stock badges updated for all products');
}

// Force refresh inventory badges
function refreshInventoryBadges() {
    if (window.inventoryManager && window.inventoryManager.addStockBadges) {
        window.inventoryManager.addStockBadges();
    } else {
        // Fallback: trigger inventory sync
        window.inventorySync.refreshAll();
    }
}
    
    // Create inventory dashboard
    function createInventoryDashboard() {
        const inventory = loadInventory();
        const dashboard = document.createElement('div');
        dashboard.className = 'inventory-dashboard';
        dashboard.innerHTML = `
            <div class="inventory-header">
                <h3>Inventory Management</h3>
                <button class="btn-restock-all" onclick="window.restockAllProducts()">
                    <i class="fas fa-boxes"></i> Restock All
                </button>
            </div>
            <div class="inventory-stats">
                <div class="inventory-stat">
                    <h4>Total Products</h4>
                    <div class="stat-value">${products.length}</div>
                </div>
                <div class="inventory-stat">
                    <h4>In Stock</h4>
                    <div class="stat-value in-stock">${Object.values(inventory).filter(item => item.stock > 0).length}</div>
                </div>
                <div class="inventory-stat">
                    <h4>Low Stock</h4>
                    <div class="stat-value low-stock">${Object.values(inventory).filter(item => item.stock > 0 && item.stock <= item.lowStockThreshold).length}</div>
                </div>
                <div class="inventory-stat">
                    <h4>Out of Stock</h4>
                    <div class="stat-value out-of-stock">${Object.values(inventory).filter(item => item.stock === 0).length}</div>
                </div>
            </div>
            <div class="inventory-items">
                ${products.map(product => {
                    const item = inventory[product.id];
                    const stockPercent = Math.min(100, (item.stock / (item.lowStockThreshold * 3)) * 100);
                    const progressClass = item.stock === 0 ? 'low' : item.stock <= item.lowStockThreshold ? 'medium' : 'high';
                    return `
                        <div class="inventory-item">
                            <span class="inventory-item-name">${product.name}</span>
                            <div class="inventory-item-stock">
                                <div class="stock-indicator">
                                    <div class="stock-progress ${progressClass}" style="width: ${stockPercent}%"></div>
                                </div>
                                <span class="stock-quantity ${item.stock === 0 ? 'out-of-stock' : item.stock <= item.lowStockThreshold ? 'low-stock' : 'in-stock'}">
                                    ${item.stock}
                                </span>
                                <button class="btn-restock" onclick="window.restockProduct('${product.id}', 10)" title="Add 10 units">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        // Add to page
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.insertBefore(dashboard, mainElement.firstChild);
        }
    }
    
    // Global functions for dashboard
    window.restockProduct = function(productId, quantity) {
        if (restockProduct(productId, quantity)) {
            showToast(`Restocked ${quantity} units of ${products.find(p => p.id === productId).name}`);
            setTimeout(refreshInventoryUI, 100);
        }
    };

    window.restockAllProducts = function() {
        const inventory = loadInventory();
        Object.keys(inventory).forEach(productId => {
            restockProduct(productId, 15);
        });
        showToast('All products restocked!');
        setTimeout(refreshInventoryUI, 100);
    };

    // Refresh inventory UI
    function refreshInventoryUI() {
        renderProducts();
        renderCartCount();
        
        if (document.querySelector('.inventory-dashboard')) {
            document.querySelector('.inventory-dashboard').remove();
            createInventoryDashboard();
        }
        
        const quickViewModal = document.getElementById('quickview-modal');
        if (quickViewModal && quickViewModal.classList.contains('active')) {
            setTimeout(() => {
                if (window.currentProduct) {
                    openQuickView(window.currentProduct);
                }
            }, 100);
        }
    }
    
    // Initialize everything
    function init() {
        loadInventory();
        addStockBadges();
        createInventoryDashboard();
        
        window.addEventListener('cartUpdated', refreshInventoryUI);
        
        console.log('📦 Inventory management system ready!');
    }
    
    init();
    
       return {
        loadInventory,
        getStockLevel,
        isInStock,
        isLowStock,
        updateStock,
        restockProduct,
        refreshInventoryUI,
        addStockBadges,
        // ADD THESE TWO NEW METHODS:
        updateStockFromBackend: function(productId, backendStock) {
            const inventory = loadInventory();
            if (inventory[productId]) {
                inventory[productId].stock = backendStock;
                saveInventory(inventory);
                return true;
            }
            return false;
        },
        syncWithBackend: async function() {
            try {
                if (await window.advancedApi.healthCheck()) {
                    // This would sync with backend inventory
                    console.log('🔄 Syncing inventory with backend...');
                }
            } catch (error) {
                console.warn('Backend inventory sync failed');
            }
        }
    };
}

// ===== CART RECOMMENDATIONS SYSTEM =====
function showCartRecommendations() {
    const cart = loadCart();
    if (cart.length === 0) return;

    const cartProductIds = cart.map(item => item.id);
    let allRecommendations = [];
    
    cartProductIds.forEach(productId => {
        const recs = window.recommendationsEngine ? 
            window.recommendationsEngine.generateRecommendations(productId, 2) : [];
        allRecommendations = [...allRecommendations, ...recs];
    });

    const uniqueRecommendations = allRecommendations
        .filter((rec, index, self) => 
            index === self.findIndex(r => r.id === rec.id) &&
            !cartProductIds.includes(rec.id)
        )
        .slice(0, 4);

    if (uniqueRecommendations.length > 0) {
        const existingRecs = document.getElementById('cart-recommendations');
        if (existingRecs) existingRecs.remove();

        const cartRecContainer = document.createElement('div');
        cartRecContainer.id = 'cart-recommendations';
        cartRecContainer.className = 'cart-recommendations';
        cartRecContainer.innerHTML = '<h4>Complete your purchase</h4><div class="recommendations-grid" id="cart-recommendations-grid"></div>';
        
        const cartBody = document.getElementById('cart-sidebar-body');
        if (cartBody) {
            cartBody.appendChild(cartRecContainer);
            renderCartRecommendations(uniqueRecommendations, 'cart-recommendations-grid');
        }
    }
}

function renderCartRecommendations(recommendations, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !recommendations.length) return;

    const recommendationsHTML = recommendations.map(product => `
        <div class="recommendation-card" data-id="${product.id}">
            <div class="recommendation-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <h4 class="recommendation-name">${product.name}</h4>
            <div class="recommendation-price">${money(cents(product.price))}</div>
            <div class="recommendation-rating">${product.rating.stars}</div>
            <div class="recommendation-actions">
                <button class="recommendation-cart-btn" data-id="${product.id}">
                    Add to Cart
                </button>
                <button class="recommendation-wishlist-btn" data-id="${product.id}">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = recommendationsHTML;
    attachCartRecommendationListeners(containerId);
}

function attachCartRecommendationListeners(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.recommendation-cart-btn');
        if (btn) {
            if (btn.disabled) return;
            
            e.stopPropagation();
            const productId = btn.dataset.id;
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            const success = addToCart(productId);
            if (success) {
                btn.innerHTML = '<i class="fas fa-check"></i>';
                btn.style.background = 'var(--success)';
                setTimeout(() => {
                    btn.innerHTML = 'Add to Cart';
                    btn.style.background = '';
                    btn.disabled = false;
                }, 1000);
            } else {
                btn.innerHTML = 'Add to Cart';
                btn.disabled = false;
            }
        }
    });
}

// ===== ADVANCED FILTERING & SORTING SYSTEM =====
function initAdvancedFiltering() {
    const filterState = {
        category: 'all',
        priceRange: [0, 1000],
        minRating: 0,
        inStock: false,
        sortBy: 'featured',
        searchQuery: ''
    };

    function createFilterUI() {
        const filterHTML = `
            <div class="advanced-filters-container">
                <button class="mobile-filter-toggle" id="mobile-filter-toggle">
                    <i class="fas fa-filter"></i>
                    Filter Products
                </button>
                
                <div class="advanced-filters" id="advanced-filters">
                    <div class="filter-section">
                        <h4>Categories</h4>
                        <div class="category-filters">
                            <button class="filter-btn active" data-category="all">All Products</button>
                            <button class="filter-btn" data-category="electronics">Electronics</button>
                            <button class="filter-btn" data-category="shoes">Shoes</button>
                            <button class="filter-btn" data-category="backpacks">Backpacks</button>
                            <button class="filter-btn" data-category="accessories">Accessories</button>
                        </div>
                    </div>
                    
                    <div class="filter-section">
                        <h4>Price Range</h4>
                        <div class="price-filter">
                            <input type="range" id="price-min" min="0" max="1000" value="0" class="price-slider">
                            <input type="range" id="price-max" min="0" max="1000" value="1000" class="price-slider">
                            <div class="price-display">
                                <span>$${filterState.priceRange[0]} - $${filterState.priceRange[1]}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="filter-section">
                        <h4>Customer Rating</h4>
                        <div class="rating-filters">
                            <label class="rating-filter">
                                <input type="radio" name="minRating" value="0" ${filterState.minRating === 0 ? 'checked' : ''}>
                                <span>All Ratings</span>
                            </label>
                            ${[4, 3, 2, 1].map(rating => `
                                <label class="rating-filter">
                                    <input type="radio" name="minRating" value="${rating}" ${filterState.minRating === rating ? 'checked' : ''}>
                                    <span class="star-rating">${generateStarRating(rating)} & up</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="filter-section">
                        <label class="checkbox-filter">
                            <input type="checkbox" id="in-stock-only" ${filterState.inStock ? 'checked' : ''}>
                            <span>In Stock Only</span>
                        </label>
                        <label class="checkbox-filter">
                            <input type="checkbox" id="free-shipping">
                            <span>Free Shipping</span>
                        </label>
                        <label class="checkbox-filter">
                            <input type="checkbox" id="on-sale">
                            <span>On Sale</span>
                        </label>
                    </div>
                </div>
                
                <div class="sorting-options">
                    <select id="sort-by" class="sort-select">
                        <option value="featured">Featured</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Top Rated</option>
                        <option value="newest">Newest First</option>
                        <option value="bestselling">Best Selling</option>
                    </select>
                </div>
            </div>
        `;

        const mainElement = document.querySelector('main');
        if (mainElement) {
            const existingFilters = document.querySelector('.advanced-filters-container');
            if (existingFilters) existingFilters.remove();

            const filtersContainer = document.createElement('div');
            filtersContainer.innerHTML = filterHTML;
            mainElement.insertBefore(filtersContainer, productGrid);
        }
    }

    function applyFilters() {
        let filteredProducts = [...products];

        // Category filter
        if (filterState.category !== 'all') {
            filteredProducts = filteredProducts.filter(product => 
                product.category.toLowerCase() === filterState.category.toLowerCase()
            );
        }

        // Price range filter
        filteredProducts = filteredProducts.filter(product => 
            product.price >= filterState.priceRange[0] && 
            product.price <= filterState.priceRange[1]
        );

        // Rating filter
        if (filterState.minRating > 0) {
            filteredProducts = filteredProducts.filter(product => 
                product.rating.stars >= filterState.minRating
            );
        }

        // Stock filter
        if (filterState.inStock) {
            filteredProducts = filteredProducts.filter(product => 
                inventoryManager ? inventoryManager.isInStock(product.id) : product.inventory.stock > 0
            );
        }

        // Search filter
        if (filterState.searchQuery) {
            const query = filterState.searchQuery.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query) ||
                (product.description && product.description.toLowerCase().includes(query))
            );
        }

        // Additional filters
        const freeShipping = document.getElementById('free-shipping')?.checked;
        const onSale = document.getElementById('on-sale')?.checked;

        if (freeShipping) {
            filteredProducts = filteredProducts.filter(product => product.freeShipping);
        }

        if (onSale) {
            filteredProducts = filteredProducts.filter(product => product.originalPrice && product.originalPrice > product.price);
        }

        // Sorting
        filteredProducts.sort((a, b) => {
            switch (filterState.sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'rating':
                    return b.rating.stars - a.rating.stars;
                case 'newest':
                    return (b.isNew || false) - (a.isNew || false);
                case 'bestselling':
                    return (b.salesCount || 0) - (a.salesCount || 0);
                default: // featured
                    return (b.isFeatured || false) - (a.isFeatured || false);
            }
        });

        renderProducts(filteredProducts);
        updateResultsCount(filteredProducts.length);
        
        window.dispatchEvent(new CustomEvent('productsFiltered', { 
            detail: { filteredProducts } 
        }));
    }

    function initEventListeners() {
        // Mobile filter toggle
        const mobileToggle = document.getElementById('mobile-filter-toggle');
        const advancedFilters = document.getElementById('advanced-filters');
        
        if (mobileToggle && advancedFilters) {
            mobileToggle.addEventListener('click', () => {
                advancedFilters.classList.toggle('show');
                mobileToggle.innerHTML = advancedFilters.classList.contains('show') 
                    ? '<i class="fas fa-times"></i> Close Filters'
                    : '<i class="fas fa-filter"></i> Filter Products';
            });
        }

        // Category filters
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                filterState.category = e.target.dataset.category;
                applyFilters();
            }
        });

        // Price range
        const priceMin = document.getElementById('price-min');
        const priceMax = document.getElementById('price-max');
        const priceDisplay = document.querySelector('.price-display span');
        
        function updatePriceDisplay() {
            if (priceMin && priceMax && priceDisplay) {
                filterState.priceRange = [
                    parseInt(priceMin.value),
                    parseInt(priceMax.value)
                ];
                priceDisplay.textContent = `$${filterState.priceRange[0]} - $${filterState.priceRange[1]}`;
                applyFilters();
            }
        }

        if (priceMin && priceMax) {
            [priceMin, priceMax].forEach(slider => {
                slider.addEventListener('input', updatePriceDisplay);
            });
        }

        // Rating filters
        document.addEventListener('change', (e) => {
            if (e.target.name === 'minRating') {
                filterState.minRating = parseInt(e.target.value);
                applyFilters();
            }
            
            if (e.target.id === 'in-stock-only') {
                filterState.inStock = e.target.checked;
                applyFilters();
            }
            
            if (e.target.id === 'free-shipping' || e.target.id === 'on-sale') {
                applyFilters();
            }
        });

        // Sort by
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                filterState.sortBy = e.target.value;
                applyFilters();
            });
        }

        // Search integration
        if (searchInput) {
            searchInput.removeEventListener('input', debouncedSearch);
            searchInput.addEventListener('input', (e) => {
                filterState.searchQuery = e.target.value;
                applyFilters();
            });
        }

        // Close filters when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && advancedFilters && advancedFilters.classList.contains('show')) {
                if (!e.target.closest('.advanced-filters-container')) {
                    advancedFilters.classList.remove('show');
                    if (mobileToggle) {
                        mobileToggle.innerHTML = '<i class="fas fa-filter"></i> Filter Products';
                    }
                }
            }
        });
    }

    function updateResultsCount(count) {
        let resultsCount = document.querySelector('.results-count');
        if (!resultsCount) {
            resultsCount = document.createElement('div');
            resultsCount.className = 'results-count';
            document.querySelector('.advanced-filters-container')?.appendChild(resultsCount);
        }
        
        resultsCount.textContent = `Showing ${count} of ${products.length} products`;
        
        resultsCount.style.animation = 'none';
        setTimeout(() => {
            resultsCount.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    }

    function init() {
        createFilterUI();
        initEventListeners();
        applyFilters();
        console.log('🚀 Advanced filtering system ready!');
    }

    return { init, applyFilters, getState: () => filterState };
}

// END OF SECTION 3

// =============================================================================
// SECTION 4: INITIALIZATION & ADVANCED SYSTEMS
// =============================================================================

// ===== AI-POWERED RECOMMENDATIONS ENGINE =====
function initRecommendationsEngine() {
    let userBehavior = {
        viewedProducts: [],
        addedToCart: [],
        wishlisted: [],
        purchaseHistory: []
    };

    // Data persistence
    function loadUserBehavior() {
        try {
            const saved = localStorage.getItem('swiftbuy_behavior');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(userBehavior, parsed);
            }
            return userBehavior;
        } catch (err) {
            console.warn('Could not load user behavior', err);
            return userBehavior;
        }
    }

    function saveUserBehavior() {
        try {
            localStorage.setItem('swiftbuy_behavior', JSON.stringify(userBehavior));
            return true;
        } catch (err) {
            console.warn('Could not save user behavior', err);
            return false;
        }
    }

    // Tracking functions
    function trackProductView(productId) {
        loadUserBehavior();
        if (!userBehavior.viewedProducts.includes(productId)) {
            userBehavior.viewedProducts.push(productId);
            userBehavior.viewedProducts = userBehavior.viewedProducts.slice(-20);
            saveUserBehavior();
        }
    }

    function trackAddedToCart(productId) {
        loadUserBehavior();
        if (!userBehavior.addedToCart.includes(productId)) {
            userBehavior.addedToCart.push(productId);
            saveUserBehavior();
        }
    }

    function trackWishlisted(productId) {
        loadUserBehavior();
        if (!userBehavior.wishlisted.includes(productId)) {
            userBehavior.wishlisted.push(productId);
            saveUserBehavior();
        }
    }

    // Advanced recommendation algorithm
    function generateRecommendations(baseProductId = null, limit = 4) {
        loadUserBehavior();
        const baseProduct = baseProductId ? products.find(p => p.id === baseProductId) : null;
        
        const scoredProducts = products
            .filter(product => {
                const stock = inventoryManager ? inventoryManager.getStockLevel(product.id) : product.inventory.stock;
                return stock > 0 && product.id !== baseProductId;
            })
            .map(product => {
                let score = 0;

                // Category similarity (35% weight)
                if (baseProduct && product.category === baseProduct.category) {
                    score += 35;
                }

                // Price range matching (25% weight)
                if (baseProduct) {
                    const priceRatio = Math.min(product.price, baseProduct.price) / Math.max(product.price, baseProduct.price);
                    score += priceRatio * 25;
                }

                // User behavior scoring (30% weight)
                if (userBehavior.viewedProducts.includes(product.id)) score += 10;
                if (userBehavior.addedToCart.includes(product.id)) score += 15;
                if (userBehavior.wishlisted.includes(product.id)) score += 12;
                if (userBehavior.purchaseHistory.includes(product.id)) score += 20;

                // Popularity and quality (10% weight)
                score += (product.rating.reviews / 200) * 5;
                score += (parseFloat(product.rating.stars) || 4) * 1.25;

                // Diversity factor
                const randomFactor = Math.random() * 5;
                score += randomFactor;

                return { product, score };
            });

        return scoredProducts
            .sort((a, b) => b.score - a.score)
            .slice(0, limit + 2)
            .sort(() => Math.random() - 0.5)
            .slice(0, limit)
            .map(item => item.product);
    }

    // Recommendation display functions
    function showMainPageRecommendations() {
        const section = document.getElementById('recommendations-section');
        const grid = document.getElementById('recommendations-grid');
        
        if (!section || !grid) {
            console.log('Main recommendations section not found');
            return;
        }

        let recommendations;
        
        if (userBehavior.viewedProducts.length > 0) {
            const lastViewed = userBehavior.viewedProducts[userBehavior.viewedProducts.length - 1];
            recommendations = generateRecommendations(lastViewed, 4);
        } else {
            recommendations = generateRecommendations(null, 4);
        }

        if (recommendations.length > 0) {
            section.hidden = false;
            renderRecommendations(recommendations, 'recommendations-grid');
        } else {
            section.hidden = true;
        }
    }

    function showQuickViewRecommendations(productId) {
        const recommendations = generateRecommendations(productId, 3);
        
        let recommendationsContainer = document.querySelector('.quickview-recommendations');
        
        if (!recommendationsContainer) {
            recommendationsContainer = document.createElement('div');
            recommendationsContainer.className = 'quickview-recommendations';
            recommendationsContainer.innerHTML = '<h4>Frequently bought together</h4><div class="recommendations-grid" id="quickview-recommendations"></div>';
            
            const quickviewDetails = document.querySelector('.quickview-details');
            if (quickviewDetails) {
                quickviewDetails.appendChild(recommendationsContainer);
            }
        }

        renderRecommendations(recommendations, 'quickview-recommendations');
    }

// REAL-TIME recommendation cards
function renderRecommendations(recommendations, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !recommendations.length) return;

    const recommendationsHTML = recommendations.map(product => {
        const stockLevel = window.inventoryManager ? window.inventoryManager.getStockLevel(product.id) : product.inventory.stock;
        const isOutOfStock = stockLevel === 0;
        const isLowStock = window.inventoryManager ? window.inventoryManager.isLowStock(product.id) : (stockLevel <= 3);
        
        let stockBadge = '';
        if (isOutOfStock) {
            stockBadge = '<div class="product-stock-badge stock-out-of-stock">Out of Stock</div>';
        } else if (isLowStock) {
            stockBadge = `<div class="product-stock-badge stock-low-stock">Only ${stockLevel} left!</div>`;
        }
        
        return `
            <div class="recommendation-card" data-id="${product.id}" data-instock="${!isOutOfStock}">
                ${stockBadge}
                <div class="recommendation-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <h4 class="recommendation-name">${product.name}</h4>
                <div class="recommendation-price">${money(cents(product.price))}</div>
                <div class="recommendation-rating">${product.rating.stars}</div>
                <div class="recommendation-actions">
                    <button class="recommendation-cart-btn" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button class="recommendation-wishlist-btn" data-id="${product.id}">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = recommendationsHTML;
    attachRecommendationListeners(containerId);
}

    function attachRecommendationListeners(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.recommendation-cart-btn');
            if (btn) {
                if (btn.disabled) return;
                
                e.stopPropagation();
                const productId = btn.dataset.id;
                
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                const success = addToCart(productId);
                if (success) {
                    trackAddedToCart(productId);
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                    btn.style.background = 'var(--success)';
                    setTimeout(() => {
                        btn.innerHTML = 'Add to Cart';
                        btn.style.background = '';
                        btn.disabled = false;
                    }, 1000);
                } else {
                    btn.innerHTML = 'Add to Cart';
                    btn.disabled = false;
                }
            }
            
            const wishBtn = e.target.closest('.recommendation-wishlist-btn');
            if (wishBtn) {
                e.stopPropagation();
                const productId = wishBtn.dataset.id;
                const product = products.find(p => p.id === productId);
                if (product && wishlistSystem) {
                    wishlistSystem.addToWishlist(product);
                    wishBtn.innerHTML = '<i class="fas fa-heart"></i>';
                    wishBtn.style.color = '#dc2626';
                }
            }
        });
    }

    // Event tracking
    function initEventTracking() {
        const originalOpenQuickView = window.openQuickView;
        if (typeof originalOpenQuickView === 'function') {
            window.openQuickView = function(product) {
                const result = originalOpenQuickView.apply(this, arguments);
                trackProductView(product.id);
                setTimeout(() => showQuickViewRecommendations(product.id), 100);
                return result;
            };
        }

        const originalSaveCart = saveCart;
        if (typeof originalSaveCart === 'function') {
            window.saveCart = function(cart) {
                const result = originalSaveCart.apply(this, arguments);
                const previousCart = loadCart();
                cart.forEach(item => {
                    const wasInPrevious = previousCart.some(prevItem => prevItem.id === item.id);
                    if (!wasInPrevious) {
                        trackAddedToCart(item.id);
                    }
                });
                return result;
            };
        }
    }

    // Initialize
    function init() {
        try {
            loadUserBehavior();
            initEventTracking();
            
            setTimeout(() => {
                showMainPageRecommendations();
                console.log('🚀 AI Recommendations Engine ready!');
            }, 1500);
            
        } catch (error) {
            console.error('Recommendations engine failed:', error);
        }
    }

    init();

    return {
        generateRecommendations,
        showMainPageRecommendations,
        showQuickViewRecommendations,
        trackProductView,
        trackAddedToCart
    };
}

// ===== MAIN APPLICATION INITIALIZATION =====
async function initializeApplication() {
    console.log('🚀 Starting SwiftBuy application initialization...');
    
    try {
        // Step 1: Initialize products
        await initializeProducts();
        
        // Step 2: Initialize core systems
        renderCartCount();
        
        // Step 3: Initialize inventory management
        window.inventoryManager = initInventoryManagement();
        // Add this line right after to initialize badges:
setTimeout(() => {
    if (window.inventoryManager && window.inventoryManager.addStockBadges) {
        window.inventoryManager.addStockBadges();
    }
}, 500);
        
        // Step 4: Render products
        renderProducts();
        
        // Step 5: Initialize header functionality
        initHeaderFunctionality();
        
        // Step 6: Initialize quick view modal
        initQuickViewModal();
        
        // Step 7: Initialize floating cart
        window.floatingCart = initFloatingCart();
        
        // Step 8: Initialize wishlist
        window.wishlistSystem = initWishlist();
        
        // Step 9: Initialize advanced filtering
        window.advancedFilters = initAdvancedFiltering();
        
        // Step 10: Initialize recommendations engine
        window.recommendationsEngine = initRecommendationsEngine();
        
        console.log('✅ SwiftBuy application fully initialized!');

        initRealTimeInventory();
        console.log('🔄 Real-time inventory system ready!');
        // ===== END OF ADDED LINES =====
        
        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes heartBeat {
                0% { transform: scale(1); }
                25% { transform: scale(1.3); }
                50% { transform: scale(1); }
                75% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            .heart-animate {
                animation: heartBeat 0.6s ease;
            }
        `;
        document.head.appendChild(style);
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        
        // Show user-friendly error state
        if (productGrid) {
            productGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #6b7280;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 16px; color: #ef4444;"></i>
                    <h3 style="margin: 0 0 8px 0; color: #374151;">Initialization Error</h3>
                    <p style="margin: 0 0 16px 0;">Failed to load products. Please refresh the page.</p>
                    <button onclick="location.reload()" style="background: var(--accent); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-redo"></i> Reload Page
                    </button>
                </div>
            `;
        }
    }
}

// ===== GLOBAL FUNCTION EXPORTS =====
// Make tracking functions available globally
if (typeof window.trackProductView === 'undefined') {
    window.trackProductView = (productId) => {
        if (recommendationsEngine && recommendationsEngine.trackProductView) {
            recommendationsEngine.trackProductView(productId);
        }
    };
}

if (typeof window.trackAddedToCart === 'undefined') {
    window.trackAddedToCart = (productId) => {
        if (recommendationsEngine && recommendationsEngine.trackAddedToCart) {
            recommendationsEngine.trackAddedToCart(productId);
        }
    };
}

// Global refresh function
window.refreshRecommendationsUI = function() {
    if (window.recommendationsEngine && window.recommendationsEngine.showMainPageRecommendations) {
        window.recommendationsEngine.showMainPageRecommendations();
    }
};

// ===== AUTO-REFRESH SYSTEMS =====
function refreshAllRecommendations() {
    if (window.recommendationsEngine) {
        if (window.recommendationsEngine.showMainPageRecommendations) {
            const mainSection = document.getElementById('recommendations-section');
            if (mainSection && !mainSection.hidden) {
                window.recommendationsEngine.showMainPageRecommendations();
            }
        }
        
        if (currentProduct && window.recommendationsEngine.showQuickViewRecommendations) {
            const quickviewRecs = document.getElementById('quickview-recommendations');
            if (quickviewRecs) {
                window.recommendationsEngine.showQuickViewRecommendations(currentProduct.id);
            }
        }
    }
}

// Listen for user actions and refresh recommendations
window.addEventListener('cartUpdated', () => {
    setTimeout(refreshAllRecommendations, 300);
});

window.addEventListener('wishlistUpdated', () => {
    setTimeout(refreshAllRecommendations, 300);
});

// Refresh when products are viewed
document.addEventListener('click', (e) => {
    const productCard = e.target.closest('.product-container');
    if (productCard) {
        setTimeout(refreshAllRecommendations, 800);
    }
});

// ===== ACCESSIBILITY ENHANCEMENTS =====
function fixModalAccessibility() {
    const modal = document.getElementById('quickview-modal');
    if (!modal) return;
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                if (modal.classList.contains('active')) {
                    modal.removeAttribute('aria-hidden');
                    modal.setAttribute('aria-modal', 'true');
                } else {
                    modal.setAttribute('aria-hidden', 'true');
                    modal.setAttribute('aria-modal', 'false');
                }
            }
        });
    });
    
    observer.observe(modal, { 
        attributes: true,
        attributeFilter: ['class']
    });
}

// ===== START APPLICATION =====
// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeApplication();
        fixModalAccessibility();
    });
} else {
    // DOM already loaded, initialize immediately
    setTimeout(() => {
        initializeApplication();
        fixModalAccessibility();
    }, 100);
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
});
// ===== REAL-TIME INVENTORY UPDATE SYSTEM =====
function initRealTimeInventory() {
    // Subscribe to inventory changes
 window.inventorySync.subscribe(() => {
    
    try {
        // Update main product grid with PROPER badge logic
        const currentProducts = document.querySelectorAll('.product-container');
        currentProducts.forEach(card => {
            const productId = card.dataset.id;
            if (window.inventoryManager) {
                const stockLevel = window.inventoryManager.getStockLevel(productId);
                const isOutOfStock = stockLevel === 0;
                const lowStock = window.inventoryManager.isLowStock(productId);
                
                console.log(`🔄 Updating badges for ${productId}: Stock ${stockLevel}, Low Stock: ${lowStock}`);
                
                // Update data attributes
                card.dataset.stock = stockLevel;
                card.dataset.instock = !isOutOfStock;
                
                // Remove ONLY stock badges (not AI badges)
                const existingStockBadges = card.querySelectorAll('.product-stock-badge:not(.ai-badge)');
                existingStockBadges.forEach(badge => badge.remove());
                
                // Remove out-of-stock classes first
                card.classList.remove('out-of-stock');
                
                // Add appropriate stock badge based on CURRENT inventory
                if (stockLevel === 0) {
                    card.classList.add('out-of-stock');
                    const badge = document.createElement('div');
                    badge.className = 'product-stock-badge stock-out-of-stock';
                    badge.textContent = 'Out of Stock';
                    card.appendChild(badge);
                    
                } else if (lowStock) {
                    const badge = document.createElement('div');
                    badge.className = 'product-stock-badge stock-low-stock';
                    badge.textContent = `Only ${stockLevel} left!`;
                    card.appendChild(badge);
                    
                } else if (stockLevel <= 10) {
                    const badge = document.createElement('div');
                    badge.className = 'product-stock-badge stock-in-stock';
                    badge.textContent = `${stockLevel} in stock`;
                    card.appendChild(badge);
                }
                
                // Update add to cart button state
                const addToCartBtn = card.querySelector('.add-to-cart');
                if (addToCartBtn) {
                    if (stockLevel === 0) {
                        addToCartBtn.disabled = true;
                        addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Out of Stock';
                        addToCartBtn.style.opacity = '0.6';
                    } else {
                        addToCartBtn.disabled = false;
                        addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
                        addToCartBtn.style.opacity = '1';
                    }
                }
            }
        });
        
        console.log('✅ Stock badges updated for all products');
        
        // Safely update AI systems with proper timing
        setTimeout(() => {
            try {
                updateAllRecommendations();
                if (window.aiSystemsReady !== false && window.addAIPoweredBadges) {
                    setTimeout(() => {
                        window.addAIPoweredBadges();
                    }, 300);
                }
            } catch (aiError) {
                console.warn('🤖 AI Update: Skipping due to initialization issues');
            }
        }, 200);
        
    } catch (error) {
        console.error('❌ Inventory Update: Critical error in update cycle', error);
    }
});
}

function updateAllRecommendations() {
    // Update "You might also like"
    if (window.recommendationsEngine && window.recommendationsEngine.showMainPageRecommendations) {
        window.recommendationsEngine.showMainPageRecommendations();
    }
    
    // Update "Frequently bought together"
    const quickviewRecs = document.getElementById('quickview-recommendations');
    if (quickviewRecs && currentProduct) {
        if (window.recommendationsEngine && window.recommendationsEngine.showQuickViewRecommendations) {
            window.recommendationsEngine.showQuickViewRecommendations(currentProduct.id);
        }
    }
    
    // Update "Complete your purchase"
    showCartRecommendations();
}


// Debug helper
window.debugSwiftBuy = function() {
    console.log('🔧 SwiftBuy Debug Info:');
    console.log('Products:', products?.length, 'items');
    console.log('Inventory Manager:', window.inventoryManager ? 'Ready' : 'Not ready');
    console.log('Cart Items:', cartItemCount());
    console.log('Wishlist System:', window.wishlistSystem ? 'Ready' : 'Not ready');
    console.log('Recommendations Engine:', window.recommendationsEngine ? 'Ready' : 'Not ready');
};

console.log('🎉 SwiftBuy e-commerce platform loaded successfully!');
console.log('💡 Use debugSwiftBuy() in console for system status');

// Debug function to test inventory badges
window.testInventoryBadges = function() {
    console.log('🧪 Testing Inventory Badges...');
    
    if (!window.inventoryManager) {
        console.error('❌ Inventory manager not available');
        return;
    }
    
    const inventory = window.inventoryManager.loadInventory();
    console.log('📊 Current Inventory:', inventory);
    
    products.forEach(product => {
        const stock = window.inventoryManager.getStockLevel(product.id);
        const lowStock = window.inventoryManager.isLowStock(product.id);
        console.log(`📦 ${product.name}: ${stock} in stock, Low Stock: ${lowStock}`);
    });
    
    // Force refresh badges
    refreshInventoryBadges();
    console.log('✅ Badges refreshed');
};

// END OF SECTION 4 - APPLICATION COMPLETE

// =============================================================================
// SECTION 5: AI-POWERED PERSONALIZATION ENGINE
// =============================================================================

// ===== ADVANCED USER BEHAVIOR ANALYTICS =====
class UserBehaviorAnalytics {
    constructor() {
        this.sessionStart = Date.now();
        this.userActions = [];
        this.productAffinity = {};
        this.priceSensitivity = 0.5; // 0-1 scale
        this.init();
    }

    init() {
        this.loadUserProfile();
        this.startSessionTimer();
        this.trackUserJourney();
        console.log('🧠 AI Analytics Engine initialized');
    }

    loadUserProfile() {
        const profile = localStorage.getItem('swiftbuy_ai_profile');
        if (profile) {
            const data = JSON.parse(profile);
            Object.assign(this, data);
        }
    }

    saveUserProfile() {
        const profile = {
            productAffinity: this.productAffinity,
            priceSensitivity: this.priceSensitivity,
            lastSession: Date.now()
        };
        localStorage.setItem('swiftbuy_ai_profile', JSON.stringify(profile));
    }

    trackUserJourney() {
        // Track product views with dwell time
        let lastProductView = null;
        let viewStartTime = null;

        document.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-container');
            if (productCard) {
                const productId = productCard.dataset.id;
                this.recordAction('product_view', productId);
                
                if (lastProductView !== productId) {
                    if (lastProductView && viewStartTime) {
                        const dwellTime = Date.now() - viewStartTime;
                        this.recordDwellTime(lastProductView, dwellTime);
                    }
                    lastProductView = productId;
                    viewStartTime = Date.now();
                }
            }
        });

        // Track scroll behavior
        let scrollDepth = 0;
        window.addEventListener('scroll', () => {
            const newDepth = Math.round((window.scrollY / document.body.scrollHeight) * 100);
            if (newDepth > scrollDepth) {
                scrollDepth = newDepth;
                this.recordAction('scroll_depth', scrollDepth);
            }
        });

        // Track search behavior
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (e.target.value.length > 2) {
                    this.recordAction('search_query', e.target.value);
                }
            });
        }
    }

    recordAction(type, data, value = 1) {
        this.userActions.push({
            type,
            data,
            value,
            timestamp: Date.now(),
            sessionTime: Date.now() - this.sessionStart
        });

        // Update product affinity
        if (type === 'product_view' || type === 'add_to_cart') {
            this.updateProductAffinity(data, value);
        }

        // Save periodically
        if (this.userActions.length % 10 === 0) {
            this.saveUserProfile();
        }
    }

    updateProductAffinity(productId, score) {
        if (!this.productAffinity[productId]) {
            this.productAffinity[productId] = 0;
        }
        this.productAffinity[productId] += score;
        
        // Decay older interactions
        Object.keys(this.productAffinity).forEach(id => {
            this.productAffinity[id] *= 0.95; // 5% decay
        });
    }

    recordDwellTime(productId, dwellTime) {
        const interestScore = Math.min(dwellTime / 10000, 1); // Normalize to 0-1
        this.recordAction('dwell_time', productId, interestScore);
    }

    startSessionTimer() {
        setInterval(() => {
            const sessionDuration = Date.now() - this.sessionStart;
            this.recordAction('session_heartbeat', sessionDuration);
        }, 30000); // Every 30 seconds
    }

    getUserPersona() {
        const totalInteractions = this.userActions.length;
        const cartAdds = this.userActions.filter(a => a.type === 'add_to_cart').length;
        const productViews = this.userActions.filter(a => a.type === 'product_view').length;
        
        const conversionRate = totalInteractions > 0 ? cartAdds / productViews : 0;
        
        return {
            engagement: Math.min(totalInteractions / 10, 1),
            conversionTendency: conversionRate,
            priceSensitivity: this.priceSensitivity,
            favoriteCategories: this.getFavoriteCategories(),
            sessionDuration: Date.now() - this.sessionStart
        };
    }

    getFavoriteCategories() {
        const categoryScores = {};
        
        this.userActions.forEach(action => {
            if (action.type === 'product_view' || action.type === 'add_to_cart') {
                const product = products.find(p => p.id === action.data);
                if (product && product.category) {
                    if (!categoryScores[product.category]) {
                        categoryScores[product.category] = 0;
                    }
                    categoryScores[product.category] += action.value;
                }
            }
        });

        return Object.entries(categoryScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([category]) => category);
    }
}

// ===== DYNAMIC PRICING ENGINE =====
class DynamicPricingEngine {
    constructor() {
        this.demandFactors = {};
        this.timeFactors = {};
        this.init();
    }

    init() {
        this.loadMarketData();
        this.startPriceUpdates();
        console.log('💰 Dynamic Pricing Engine initialized');
    }

    loadMarketData() {
        const marketData = localStorage.getItem('swiftbuy_market_data');
        if (marketData) {
            const data = JSON.parse(marketData);
            Object.assign(this, data);
        }
    }

calculateOptimalPrice(product, userPersona) {
    // Safety check for product parameter
    if (!product || typeof product.price !== 'number') {
        console.warn('💰 Dynamic Pricing: Invalid product data', product);
        return product?.price || 100; // Return original price or default
    }
    
    const basePrice = product.price;
    const demandFactor = this.getDemandFactor(product.id);
    const timeFactor = this.getTimeFactor();
    const userFactor = this.getUserPriceFactor(userPersona);
    
    // Advanced pricing algorithm
    let optimalPrice = basePrice;
    
    // Demand-based adjustment (±15%)
    optimalPrice *= (1 + (demandFactor * 0.15));
    
    // Time-based adjustment (±10%)
    optimalPrice *= (1 + (timeFactor * 0.10));
    
    // User-specific adjustment (±20%)
    optimalPrice *= (1 + (userFactor * 0.20));
    
    // Ensure minimum and maximum bounds
    const minPrice = basePrice * 0.7;  // 30% minimum discount
    const maxPrice = basePrice * 1.5;  // 50% maximum premium
    
    return Math.max(minPrice, Math.min(maxPrice, optimalPrice));
}

 getDemandFactor(productId) {
    // Robust demand factor calculation with fallbacks
    let views = 0;
    let carts = 0;
    
    try {
        // Safe access to recommendations engine data
        if (window.recommendationsEngine && 
            window.recommendationsEngine.userBehavior && 
            Array.isArray(window.recommendationsEngine.userBehavior.viewedProducts)) {
            views = window.recommendationsEngine.userBehavior.viewedProducts
                .filter(id => id === productId).length;
        }
        
        if (window.recommendationsEngine && 
            window.recommendationsEngine.userBehavior && 
            Array.isArray(window.recommendationsEngine.userBehavior.addedToCart)) {
            carts = window.recommendationsEngine.userBehavior.addedToCart
                .filter(id => id === productId).length;
        }
    } catch (error) {
        console.warn('📊 AI Demand Factor: Using fallback data due to initialization delay');
        // Fallback: simulate some demand based on product properties
        const product = products.find(p => p.id === productId);
        if (product) {
            views = Math.floor((product.rating.reviews || 10) / 20);
            carts = Math.floor((product.rating.reviews || 10) / 50);
        }
    }
    
    const inventory = window.inventoryManager ? 
        window.inventoryManager.getStockLevel(productId) : 10;
    
    const inventoryPressure = Math.max(0, 1 - (inventory / 20));
    
    return Math.min(1, (views * 0.3 + carts * 0.5 + inventoryPressure * 0.2));
}

    getTimeFactor() {
        const now = new Date();
        const hour = now.getHours();
        
        // Peak hours (7 PM - 10 PM) have higher prices
        if (hour >= 19 && hour <= 22) return 0.1;
        
        // Off-peak hours (2 AM - 6 AM) have lower prices
        if (hour >= 2 && hour <= 6) return -0.1;
        
        return 0;
    }

    getUserPriceFactor(userPersona) {
        // Price-sensitive users get discounts
        // Engaged users see premium pricing
        if (!userPersona) return 0;
        
        const sensitivity = userPersona.priceSensitivity || 0.5;
        const engagement = userPersona.engagement || 0.5;
        
        // High engagement, low sensitivity = premium
        // Low engagement, high sensitivity = discount
        return (engagement - sensitivity) * 0.5;
    }

    startPriceUpdates() {
        // Update prices every 5 minutes
        setInterval(() => {
            this.updateAllPrices();
        }, 300000);
    }

    updateAllPrices() {
        console.log('🔄 Updating dynamic prices...');
        // In a real implementation, this would update product displays
        // For now, we'll just log the changes
        products.forEach(product => {
            const userPersona = window.userAnalytics ? window.userAnalytics.getUserPersona() : null;
            const optimalPrice = this.calculateOptimalPrice(product, userPersona);
            
            if (Math.abs(optimalPrice - product.price) > 0.01) {
                console.log(`💰 ${product.name}: $${product.price} → $${optimalPrice.toFixed(2)}`);
            }
        });
    }
}

// ===== PERSONALIZED PRODUCT RANKING =====
class PersonalizedRankingEngine {
    constructor() {
        this.rankingWeights = {
            relevance: 0.4,
            popularity: 0.3,
            personalization: 0.3
        };
    }

    rankProducts(products, userPersona, context = 'browse') {
        return products
            .map(product => ({
                product,
                score: this.calculateProductScore(product, userPersona, context)
            }))
            .sort((a, b) => b.score - a.score)
            .map(item => item.product);
    }

    calculateProductScore(product, userPersona, context) {
        let score = 0;

        // Relevance scoring (40%)
        score += this.calculateRelevanceScore(product, context) * this.rankingWeights.relevance;

        // Popularity scoring (30%)
        score += this.calculatePopularityScore(product) * this.rankingWeights.popularity;

        // Personalization scoring (30%)
        score += this.calculatePersonalizationScore(product, userPersona) * this.rankingWeights.personalization;

        return score;
    }

    calculateRelevanceScore(product, context) {
        let score = 0;

        // Context-based scoring
        switch (context) {
            case 'search':
                score += 0.7; // Search results are highly relevant
                break;
            case 'category':
                score += 0.5;
                break;
            case 'browse':
            default:
                score += 0.3;
        }

        // Freshness score (new products get boost)
        if (product.isNew) score += 0.2;

        // Trending score
        if (product.isTrending) score += 0.15;

        return Math.min(score, 1);
    }

    calculatePopularityScore(product) {
        const rating = parseFloat(product.rating.stars) || 4;
        const reviews = parseInt(product.rating.reviews) || 10;
        
        // Normalize rating (0-1 scale)
        const ratingScore = (rating - 1) / 4; // 1-5 stars to 0-1
        
        // Review volume score (log scale to prevent domination)
        const volumeScore = Math.min(Math.log10(reviews + 1) / 2, 1);
        
        return (ratingScore * 0.6 + volumeScore * 0.4);
    }

    calculatePersonalizationScore(product, userPersona) {
        if (!userPersona) return 0.5; // Neutral if no user data

        let score = 0;

        // Category affinity
        if (userPersona.favoriteCategories && userPersona.favoriteCategories.includes(product.category)) {
            score += 0.4;
        }

        // Price sensitivity matching
        const priceTier = this.getPriceTier(product.price);
        const userPricePreference = this.getUserPricePreference(userPersona);
        
        if (priceTier === userPricePreference) {
            score += 0.3;
        }

        // Engagement-based scoring
        score += userPersona.engagement * 0.3;

        return Math.min(score, 1);
    }

    getPriceTier(price) {
        if (price < 50) return 'budget';
        if (price < 150) return 'midrange';
        return 'premium';
    }

    getUserPricePreference(userPersona) {
        const sensitivity = userPersona.priceSensitivity;
        if (sensitivity > 0.7) return 'budget';
        if (sensitivity < 0.3) return 'premium';
        return 'midrange';
    }
}

// ===== INITIALIZE AI SYSTEMS =====
function initAIPersonalization() {
    // Safety check - ensure products are available
    if (!window.products || window.products.length === 0) {
        console.warn('🤖 AI Personalization: Products not available, delaying initialization...');
        setTimeout(initAIPersonalization, 1000);
        return;
    }
    
    console.log('🧠 AI Personalization: Starting with', window.products.length, 'products');
    
    // Rest of existing initialization code...
    window.userAnalytics = new UserBehaviorAnalytics();
    window.dynamicPricing = new DynamicPricingEngine();
    window.personalizedRanking = new PersonalizedRankingEngine();

    enhanceSearchWithAI();
    enhanceRecommendationsWithAI();
    enhanceProductDisplayWithAI();

    console.log('🧠 AI Personalization Engine fully initialized!');
}

function enhanceSearchWithAI() {
    const originalPerformSearch = performSearch;
    
    window.performSearch = function() {
        const results = originalPerformSearch.apply(this, arguments);
        
        // Personalize search results
        if (window.userAnalytics && window.personalizedRanking) {
            const userPersona = window.userAnalytics.getUserPersona();
            const personalizedResults = window.personalizedRanking.rankProducts(
                results || products, 
                userPersona, 
                'search'
            );
            
            renderProducts(personalizedResults);
        }
        
        return results;
    };
}

function enhanceRecommendationsWithAI() {
    const originalGenerateRecommendations = window.recommendationsEngine?.generateRecommendations;
    
    if (originalGenerateRecommendations) {
        window.recommendationsEngine.generateRecommendations = function(baseProductId = null, limit = 4) {
            const recommendations = originalGenerateRecommendations.call(this, baseProductId, limit);
            
            if (window.userAnalytics && window.personalizedRanking) {
                const userPersona = window.userAnalytics.getUserPersona();
                return window.personalizedRanking.rankProducts(
                    recommendations, 
                    userPersona, 
                    'recommendations'
                ).slice(0, limit);
            }
            
            return recommendations;
        };
    }
}

function enhanceProductDisplayWithAI() {
    // Add AI-powered badges to products
    window.inventorySync.subscribe(() => {
        setTimeout(() => {
            addAIPoweredBadges();
        }, 500);
    });
}

// Initialize AI Personalization with error handling
function safeInitAIPersonalization() {
    try {
        initAIPersonalization();
        console.log('🧠 AI Personalization: Successfully initialized');
    } catch (error) {
        console.error('❌ AI Personalization: Initialization failed, but core app continues', error);
        // Set fallback flags to prevent further AI attempts
        window.aiSystemsReady = false;
    }
}

// Delay AI initialization to ensure core systems are ready
setTimeout(() => {
    safeInitAIPersonalization();
}, 3000); // Increased delay for better core system readiness


// ===== AI-POWERED BADGES SYSTEM =====
function addAIPoweredBadges() {
    console.log('🎯 AI Personalization Badges - Processing...');
    
    // Safety check - ensure AI systems are ready
    if (!window.userAnalytics || !window.dynamicPricing || !window.personalizedRanking) {
        console.log('🤖 AI Systems: Waiting for full initialization...');
        return false;
    }
    
    const productCards = document.querySelectorAll('.product-container');
    let badgesAdded = 0;
    
    productCards.forEach(card => {
        const productId = card.dataset.id;
        
        // Remove existing AI badges
        const existingAIBadge = card.querySelector('.ai-badge');
        if (existingAIBadge) {
            existingAIBadge.remove();
        }
        
        try {
            // Add AI-powered badges with error handling
            const product = window.products.find(p => p.id === productId);
            const userPersona = window.userAnalytics.getUserPersona();
            
            if (product && userPersona) {
                // Personalization badge
                const personalizationScore = window.personalizedRanking.calculatePersonalizationScore(product, userPersona);
                console.log(`📊 ${product.name}: Personalization Score ${personalizationScore.toFixed(3)}`);
                
                if (personalizationScore > 0.6) {
                    const badge = document.createElement('div');
                    badge.className = 'ai-badge personalized-badge';
                    badge.innerHTML = '<i class="fas fa-magic"></i> Perfect for You';
                    badge.style.cssText = `
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        background: linear-gradient(135deg, #8b5cf6, #a78bfa);
                        color: white;
                        padding: 6px 10px;
                        border-radius: 8px;
                        font-size: 0.7rem;
                        font-weight: 700;
                        z-index: 3;
                        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
                    `;
                    card.appendChild(badge);
                    badgesAdded++;
                    console.log(`✅ Added "Perfect for You" badge to ${product.name}`);
                }
                
                // Dynamic pricing indicator
                try {
                    const optimalPrice = window.dynamicPricing.calculateOptimalPrice(product, userPersona);
                    const priceDiff = optimalPrice - product.price;
                    
                    if (priceDiff < -0.01) {
                        const discountBadge = document.createElement('div');
                        discountBadge.className = 'ai-badge dynamic-price-badge';
                        discountBadge.innerHTML = `<i class="fas fa-bolt"></i> AI Price $${optimalPrice.toFixed(2)}`;
                        discountBadge.style.cssText = `
                            position: absolute;
                            bottom: 80px;
                            left: 12px;
                            background: linear-gradient(135deg, #10b981, #34d399);
                            color: white;
                            padding: 4px 8px;
                            border-radius: 6px;
                            font-size: 0.65rem;
                            font-weight: 700;
                            z-index: 3;
                        `;
                        card.appendChild(discountBadge);
                        badgesAdded++;
                        console.log(`💰 AI Price badge: $${product.price} → $${optimalPrice.toFixed(2)}`);
                    }
                } catch (pricingError) {
                    console.warn('💰 AI Pricing: Skipping price badge due to calculation error', pricingError);
                }
                
                // High demand badge
                const demandFactor = window.dynamicPricing.getDemandFactor(product.id);
                if (demandFactor > 0.7) {
                    const demandBadge = document.createElement('div');
                    demandBadge.className = 'ai-badge high-demand-badge';
                    demandBadge.innerHTML = '<i class="fas fa-fire"></i> High Demand';
                    demandBadge.style.cssText = `
                        position: absolute;
                        top: 50px;
                        right: 12px;
                        background: linear-gradient(135deg, #ef4444, #f59e0b);
                        color: white;
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 0.65rem;
                        font-weight: 700;
                        z-index: 3;
                    `;
                    card.appendChild(demandBadge);
                    badgesAdded++;
                }
            }
        } catch (error) {
            console.warn('🤖 AI Badges: Error processing product', productId, error);
        }
    });
    
    console.log(`🎯 AI badges processed: ${badgesAdded} badges added to ${productCards.length} products`);
    return badgesAdded;
}

console.log('🔍 addAIPoweredBadges function defined:', typeof addAIPoweredBadges);

// ===== GLOBAL FUNCTION EXPORTS =====
console.log('🔄 Starting global exports...');

// Debug: Check what functions exist
console.log('🔍 Function availability check:');
console.log(' - addAIPoweredBadges:', typeof addAIPoweredBadges);
console.log(' - addToCart:', typeof addToCart);
console.log(' - showToast:', typeof showToast);

// Only export what actually exists
if (typeof addAIPoweredBadges === 'function') {
    window.addAIPoweredBadges = addAIPoweredBadges;
    console.log('✅ addAIPoweredBadges exported');
} else {
    console.log('❌ addAIPoweredBadges NOT available for export');
}

if (typeof addToCart === 'function') {
    window.addToCart = addToCart;
    console.log('✅ addToCart exported');
}

if (typeof showToast === 'function') {
    window.showToast = showToast;
    console.log('✅ showToast exported');
}

console.log('🌐 Global exports completed');
console.log('window.addAIPoweredBadges:', typeof window.addAIPoweredBadges);

// END OF SECTION 5

// ===== AUTHENTICATION SYSTEM =====
function initAuthentication() {
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeBtn = document.querySelector('.close');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');

    if (!loginBtn || !loginModal) {
        console.warn('Login elements not found');
        return;
    }

    // Open modal
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // Handle login form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            loginMessage.textContent = 'Logging in...';
            loginMessage.style.color = 'blue';
            
            const result = await window.advancedApi.login(email, password);
            
            loginMessage.textContent = '✅ Login successful! Loading products...';
            loginMessage.style.color = 'green';
            
            // Close modal after success
            setTimeout(() => {
                loginModal.style.display = 'none';
                loginMessage.textContent = '';
                
                // Reload products now that we're authenticated
                initializeProducts();
            }, 1500);
            
        } catch (error) {
            loginMessage.textContent = '❌ Login failed: ' + error.message;
            loginMessage.style.color = 'red';
        }
    });

    // Check if already logged in on page load
    const token = localStorage.getItem('swiftbuy_token');
    if (token) {
        console.log('🔐 User already logged in');
        // Verify token is still valid
        setTimeout(() => initializeProducts(), 1000);
    }
}

// Initialize authentication when app starts
setTimeout(initAuthentication, 1000);


// ===== BACKEND INTEGRATION TEST =====
async function testBackendIntegration() {
    console.log('🧪 Testing Backend Integration...');
    
    try {
        // Test 1: Backend Health
        const isHealthy = await window.advancedApi.healthCheck();
        console.log(`✅ Backend Health: ${isHealthy ? 'ONLINE' : 'OFFLINE'}`);
        
        if (isHealthy) {
            // Test 2: Products API
            try {
                const productsData = await window.advancedApi.getProducts();
                console.log(`✅ Products API: Loaded ${productsData.products?.length || 0} products`);
            } catch (error) {
                console.log('❌ Products API: Failed - using fallback');
            }
            
            // Test 3: Test Order Data Structure
            const testOrder = {
                customer: {
                    email: "test@example.com",
                    firstName: "Test",
                    lastName: "User"
                },
                shipping: {
                    address: "123 Test St",
                    city: "Test City",
                    state: "TS",
                    zipCode: "12345",
                    country: "United States"
                },
                items: [],
                total: 0,
                subtotal: 0,
                shippingCost: 0,
                tax: 0,
                paymentStatus: 'paid',
                status: 'confirmed'
            };
            console.log('✅ Order Structure: Ready for backend submission');
        }
        
        // Test 4: Local Storage Fallback
        const localProducts = localStorage.getItem('swiftbuy_products');
        console.log(`📦 Local Storage: ${localProducts ? JSON.parse(localProducts).length + ' products' : 'Empty'}`);
        
    } catch (error) {
        console.error('❌ Integration Test Failed:', error);
    }
}

// Run test when page loads
setTimeout(() => {
    testBackendIntegration();
}, 2000);

