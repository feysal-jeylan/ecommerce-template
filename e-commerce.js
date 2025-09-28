// e-commerce.js - COMPLETE FIXED VERSION
import { products } from './products.js';
import { CART_KEY, loadCart, saveCart, cartItemCount } from './cartModule.js';

// --- DOM handles
const productGrid = document.getElementById('products-grid');
const cartCountEl = document.getElementById('cart-count');
const toastEl = document.getElementById('toast');
const searchInput = document.getElementById('search');

// --- utilities
const cents = n => Math.round(Number(n) * 100);
const money = c => '$' + (c / 100).toFixed(2);


// Initialize inventory management
const inventoryManager = initInventoryManagement();

// ===== SAFE GLOBAL EXPOSURE =====
// Make sure tracking functions are available globally without conflicts
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


// Wrapper function to save cart AND update UI
function saveCartAndUpdateUI(cart) {
  saveCart(cart);
  renderCartCount();
}

function renderCartCount() {
  const n = cartItemCount();
  cartCountEl.textContent = n;
  cartCountEl.setAttribute('aria-label', `${n} items in cart`);
}

// Enhanced toast notification with actions
let toastTimer = null;
function showToast(message, actions = []) {
  if (!toastEl) return;
  
  // Clear existing content
  toastEl.innerHTML = '';
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = 'toast-message';
  messageEl.textContent = message;
  toastEl.appendChild(messageEl);
  
  // Add action buttons if provided
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
  
  // Show toast
  toastEl.hidden = false;
  toastEl.classList.add('show');
  
  // Only auto-hide if no actions (for simple messages)
  if (actions.length === 0) {
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.hidden = true, 200);
    }, 1500);
  }
}

// In createProductHTML function, add wishlist button:
function createProductHTML(p) {
  const stockLevel = inventoryManager ? inventoryManager.getStockLevel(p.id) : p.inventory.stock;
  const isOutOfStock = stockLevel === 0;
  
  return `
    <article class="product-container ${isOutOfStock ? 'out-of-stock' : ''}" 
             data-id="${p.id}" 
             data-price-cents="${cents(p.price)}"
             data-stock="${stockLevel}">
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}">
      </div>
      
      <!-- ADD WISHLIST BUTTON HERE -->
      <button class="wishlist-btn" data-id="${p.id}" aria-label="Add to wishlist">
        <i class="far fa-heart"></i>
      </button>
      
      <div class="product-name">${p.name}</div>
      <div class="product-rating">${p.rating.stars} <span class="rating-count">(${p.rating.reviews})</span></div>
      <div class="product-price">${money(cents(p.price))}</div>
      <button class="add-to-cart" data-id="${p.id}" type="button" 
              aria-label="Add ${p.name} to cart"
              ${isOutOfStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
        ${isOutOfStock ? 'Out of Stock' : 'Add to cart'}
      </button>
    </article>
  `;
}

function renderProducts(list) {
  const arr = list || products;
  productGrid.innerHTML = arr.map(createProductHTML).join('');
}

// Enhanced addToCart function - SIMPLE FIX
function enhanceAddToCart() {
  // Store the ORIGINAL function safely
  const originalAddToCart = function(productId) {
    const cart = loadCart();
    const idStr = String(productId);
    const existing = cart.find(i => i.id === idStr);

    if (existing) {
      existing.quantity = (existing.quantity || 0) + 1;
    } else {
      const p = products.find(x => x.id === idStr);
      if (!p) return console.warn('Product not found for id', productId);
      cart.push({
        id: p.id,
        name: p.name,
        price_cents: cents(p.price),
        quantity: 1,
        image: p.image
      });
    }

   // REPLACE saveCart(cart); WITH THIS:
saveCartWithTracking(cart);
    showToast('Added to cart ✓');
    if (typeof floatingCart !== 'undefined' && floatingCart.openCartSidebar) {
      floatingCart.openCartSidebar();
    }
  };

  // Now override the global function
  window.addToCart = function(productId) {
    // Get fresh inventory data
    const inventory = loadInventory();
    const productStock = inventory[productId]?.stock || 0;
    
    if (productStock === 0) {
      showToast('Sorry, this product is out of stock!');
      return false;
    }
    
    if (productStock <= inventory[productId]?.lowStockThreshold) {
      showToast(`Low stock! Only ${productStock} item${productStock > 1 ? 's' : ''} left.`, [], 3000);
    }
    
    // Update stock FIRST
    if (updateStock(productId, 1)) {
      // THEN call the ORIGINAL function
      originalAddToCart(productId);
      
      // Refresh UI after a short delay
      setTimeout(() => {
        if (typeof refreshInventoryUI === 'function') {
          refreshInventoryUI();
        }
      }, 50);
      return true;
    }
    
    return false;
  };
}

// === ADD THIS NEW FUNCTION ===
function saveCartWithTracking(cart) {
  // Track newly added items
  const oldCart = loadCart();
  cart.forEach(item => {
    const wasInOldCart = oldCart.some(oldItem => oldItem.id === item.id);
    if (!wasInOldCart && typeof trackAddedToCart === 'function') {
      trackAddedToCart(item.id);
    }
  });
  
  // Save cart as normal
  saveCart(cart);
}

productGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.add-to-cart');
  if (btn) {
    const id = btn.dataset.id;
    btn.disabled = true;
    addToCart(id);
    setTimeout(() => btn.disabled = false, 400);
    return; // Stop here for add-to-cart clicks
  }
  
  // === ADD THIS TRACKING CODE ===
  const productCard = e.target.closest('.product-container');
  if (productCard && !e.target.closest('.add-to-cart')) {
    const productId = productCard.dataset.id;
    const product = products.find(p => p.id === productId);
    
    if (product) {
      // Track product view
      if (typeof trackProductView === 'function') {
        trackProductView(productId);
      }
      // Open quick view
      if (typeof openQuickView === 'function') {
        openQuickView(product);
      }
    }
  }
});
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
  const q = String(searchInput.value || '').trim().toLowerCase();
  if (!q) {
    renderProducts(products);
    return;
  }
  
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );
  renderProducts(filtered);
}

const debouncedSearch = debounce(performSearch, 300);

if (searchInput) {
  searchInput.addEventListener('input', debouncedSearch);
}

// Initialize page
renderProducts();
renderCartCount();

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
      alert('Mobile menu would open here. You can add navigation items!');
    });
  }

  // Enhanced categories dropdown
  function initCategoriesDropdown() {
    const categoriesBtn = document.querySelector('.btn-categories');
    const dropdown = document.querySelector('.dropdown');
    
    if (categoriesBtn && dropdown) {
      // Remove 'hidden' class and use 'show' class for animations
      dropdown.classList.remove('hidden');
      
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
    const searchInput = document.getElementById('search');
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
        if (typeof performSearch === 'function') {
          performSearch();
        }
      });
    }
  }

  // Initialize all features
  initMobileMenu();
  initCategoriesDropdown();
  enhanceSearch();
  
  console.log('🚀 Header enhancements loaded successfully!');
}

// Initialize header when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeaderFunctionality);
} else {
  initHeaderFunctionality();
}

// ===== QUICK VIEW MODAL FUNCTIONALITY =====
function initQuickViewModal() {
  const modal = document.getElementById('quickview-modal');
  const zoomModal = document.getElementById('zoom-modal');
  const overlay = document.querySelector('.quickview-overlay');
  const closeBtn = document.querySelector('.quickview-close');
  const quantityInput = document.getElementById('quickview-qty');
  let currentProduct = null;
  let currentImageIndex = 0;

  // Sample product images for demonstration
  const productImages = {
    "101": ["images/headset transparent.png", "images/headset-angle-1.jpg", "images/headset-angle-2.jpg", "images/headset-packaging.jpg"],
    "102": ["images/transparent shoe.png", "images/shoe-side.jpg", "images/shoe-top.jpg", "images/shoe-bottom.jpg"],
    "103": ["images/transparent watch.png", "images/watch-side.jpg", "images/watch-back.jpg", "images/watch-box.jpg"],
    "104": ["images/sunglasses.png", "sunglasses-side.jpg", "sunglasses-case.jpg", "sunglasses-model.jpg"],
    "105": ["images/backpack.png", "backpack-open.jpg", "backpack-side.jpg", "backpack-features.jpg"]
  };

  // Sample product specifications
  const productSpecs = {
    "101": [
      { label: "Type", value: "Over-ear Headphones" },
      { label: "Connectivity", value: "Wireless Bluetooth" },
      { label: "Battery Life", value: "30 hours" },
      { label: "Weight", value: "250g" },
      { label: "Color", value: "Black" },
      { label: "Warranty", value: "2 years" }
    ],
    "102": [
      { label: "Type", value: "Running Shoes" },
      { label: "Material", value: "Mesh & Synthetic" },
      { label: "Sole", value: "Rubber" },
      { label: "Weight", value: "280g" },
      { label: "Color", value: "Black/White" },
      { label: "Size", value: "US 7-12" }
    ],
    "103": [
      { label: "Type", value: "Smart Watch" },
      { label: "Display", value: "1.5\" AMOLED" },
      { label: "Battery", value: "7 days" },
      { label: "Waterproof", value: "50m" },
      { label: "Features", value: "Heart Rate, GPS" },
      { label: "Compatibility", value: "iOS & Android" }
    ],
    "104": [
      { label: "Type", value: "Sunglasses" },
      { label: "Lens", value: "Polarized" },
      { label: "Frame", value: "Acetate" },
      { label: "UV Protection", value: "100%" },
      { label: "Color", value: "Black" },
      { label: "Includes", value: "Case & Cloth" }
    ],
    "105": [
      { label: "Type", value: "Backpack" },
      { label: "Capacity", value: "25L" },
      { label: "Material", value: "Nylon" },
      { label: "Weight", value: "0.8kg" },
      { label: "Features", value: "USB Charging Port" },
      { label: "Color", value: "Gray" }
    ]
  };

  // Sample product descriptions
  const productDescriptions = {
    "101": "Premium wireless headphones with active noise cancellation. Features 30-hour battery life, premium sound quality, and comfortable over-ear design perfect for all-day use.",
    "102": "High-performance running shoes designed for comfort and durability. Features breathable mesh, cushioned sole, and excellent traction for any running surface.",
    "103": "Advanced smartwatch with health monitoring and smartphone connectivity. Track your fitness, receive notifications, and stay connected on the go.",
    "104": "Stylish polarized sunglasses with 100% UV protection. Features lightweight frame, comfortable fit, and comes with protective case and cleaning cloth.",
    "105": "Durable smart backpack with built-in USB charging port. Multiple compartments, water-resistant material, and comfortable shoulder straps for everyday use."
  };

  // Open modal function
  // Open modal function - FIXED VERSION
function openQuickView(product) {
  if (typeof trackProductView === 'function') trackProductView(product.id);
  currentProduct = product;
  currentImageIndex = 0;
  
  // Update modal content
  updateModalContent(product);
  
  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Add event listeners
  overlay.addEventListener('click', closeQuickView);
  closeBtn.addEventListener('click', closeQuickView);
  document.addEventListener('keydown', handleEscapeKey);

  // ===== ADD RECOMMENDATIONS CALL =====
  // Wait for modal to render, then show recommendations
  setTimeout(() => {
    // Check if recommendations engine is available
    if (typeof recommendationsEngine !== 'undefined' && 
        typeof recommendationsEngine.showQuickViewRecommendations === 'function') {
      recommendationsEngine.showQuickViewRecommendations(product.id);
    }
    // Fallback to direct function call
    else if (typeof showQuickViewRecommendations === 'function') {
      showQuickViewRecommendations(product.id);
    }
  }, 100);
}

  // Update modal content with product data
  function updateModalContent(product) {
    const images = productImages[product.id] || [product.image];
    
    document.getElementById('gallery-main-img').src = images[0];
    document.getElementById('gallery-main-img').alt = product.name;
    document.getElementById('quickview-title').textContent = product.name;
    document.getElementById('quickview-rating').innerHTML = `${product.rating.stars} <span class="rating-count">(${product.rating.reviews} reviews)</span>`;
    document.getElementById('quickview-price').textContent = money(cents(product.price));
    document.getElementById('quickview-desc-text').textContent = productDescriptions[product.id] || "Premium quality product with excellent customer reviews.";
    
    const specs = productSpecs[product.id] || [];
    const specsHtml = specs.map(spec => `
      <div class="spec-item">
        <span class="spec-label">${spec.label}:</span>
        <span class="spec-value">${spec.value}</span>
      </div>
    `).join('');
    document.getElementById('quickview-specs').innerHTML = specsHtml;
    
    generateThumbnails(images);
    quantityInput.value = 1;
  }

  // Generate thumbnail images
  function generateThumbnails(images) {
    const thumbnailsContainer = document.getElementById('gallery-thumbnails');
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
    document.getElementById('gallery-main-img').src = images[index];
    
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

    prevBtn.addEventListener('click', () => {
      const images = productImages[currentProduct.id] || [currentProduct.image];
      const newIndex = (currentImageIndex - 1 + images.length) % images.length;
      changeImage(newIndex, images);
    });

    nextBtn.addEventListener('click', () => {
      const images = productImages[currentProduct.id] || [currentProduct.image];
      const newIndex = (currentImageIndex + 1) % images.length;
      changeImage(newIndex, images);
    });

    zoomBtn.addEventListener('click', openZoom);
    mainImage.addEventListener('click', openZoom);
  }

  // Open zoom modal
  function openZoom() {
    const images = productImages[currentProduct.id] || [currentProduct.image];
    document.getElementById('zoom-image').src = images[currentImageIndex];
    zoomModal.classList.add('active');
    document.addEventListener('keydown', handleZoomEscapeKey);
  }

  // Close zoom modal
  function closeZoom() {
    zoomModal.classList.remove('active');
    document.removeEventListener('keydown', handleZoomEscapeKey);
  }

  function handleZoomEscapeKey(e) {
    if (e.key === 'Escape') {
      closeZoom();
    }
  }

  // Close modal function
  function closeQuickView() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    overlay.removeEventListener('click', closeQuickView);
    closeBtn.removeEventListener('click', closeQuickView);
    document.removeEventListener('keydown', handleEscapeKey);
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closeQuickView();
    }
  }

  // Quantity buttons functionality
  function setupQuantityButtons() {
    document.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
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

// FIXED: Setup modal add to cart - NO DOUBLE INVENTORY REDUCTION
  function setupModalAddToCart() {
    const addToCartBtn = document.getElementById('quickview-addtocart');
    
    addToCartBtn.addEventListener('click', () => {
      if (!currentProduct) return;
      
      // PROPER inventory check through inventoryManager
      if (typeof inventoryManager === 'undefined') {
        showToast('Inventory system not ready yet');
        return;
      }
      
      const inventory = inventoryManager.loadInventory();
      const productStock = inventory[currentProduct.id]?.stock || 0;
      const quantity = parseInt(quantityInput.value);
      
      if (productStock === 0) {
        showToast('Sorry, this product is out of stock!');
        return;
      }
      
      // Validate we have enough stock for the ENTIRE quantity
      if (productStock < quantity) {
        showToast(`Only ${productStock} item${productStock > 1 ? 's' : ''} available!`);
        return;
      }
      
      // FIX: Update inventory ONCE for the entire quantity
      inventoryManager.updateStock(currentProduct.id, quantity);
      
      // FIX: Use cartModule's addItemToCart instead of looping addToCart
      // This adds all items at once without individual inventory calls
      const cart = loadCart();
      const existingItem = cart.find(item => item.id === currentProduct.id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({
          id: currentProduct.id,
          name: currentProduct.name,
          price_cents: cents(currentProduct.price),
          quantity: quantity,
          image: currentProduct.image
        });
      }
      
      saveCart(cart);
      showToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart ✓`);
      
      // Refresh UI
      setTimeout(() => {
        if (typeof inventoryManager.refreshInventoryUI === 'function') {
          inventoryManager.refreshInventoryUI();
        }
        closeQuickView();
      }, 500);
    });
  }
  // Attach click event to all product cards
  function attachQuickViewListeners() {
    document.addEventListener('click', (e) => {
      const productCard = e.target.closest('.product-container');
      if (!productCard) return;
      
      if (e.target.closest('.add-to-cart')) return;
      
      const productId = productCard.dataset.id;
      const product = products.find(p => p.id === productId);
      
      if (product) {
        openQuickView(product);
      }
    });
  }

  // Setup zoom modal close events
  function setupZoomModal() {
    const zoomOverlay = document.querySelector('.zoom-overlay');
    const zoomClose = document.querySelector('.zoom-close');
    
    zoomOverlay.addEventListener('click', closeZoom);
    zoomClose.addEventListener('click', closeZoom);
  }

  // Initialize everything
  function init() {
    setupQuantityButtons();
    setupModalAddToCart();
    attachQuickViewListeners();
    setupGalleryNavigation();
    setupZoomModal();
    
    console.log('🚀 Enhanced Quick View modal with gallery ready!');
  }

  init();
}

// Initialize quick view modal
initQuickViewModal();

// ===== FLOATING CART SIDEBAR FUNCTIONALITY =====
function initFloatingCart() {
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartBody = document.getElementById('cart-sidebar-body');
  const cartFooter = document.getElementById('cart-sidebar-footer');
  const cartOverlay = document.querySelector('.cart-sidebar-overlay');
  const closeButtons = document.querySelectorAll('[data-close-cart]');
  const cartLink = document.getElementById('cart-link');

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
// I'll all of the code that are availabale above this function
  // Render cart items
  function renderCartItems() {
    const cart = loadCart();
    
    if (cart.length === 0) {
      cartBody.innerHTML = `
        <div class="cart-empty-state">
          <i class="fas fa-shopping-cart"></i>
          <p>Your cart is empty</p>
          <small>Start shopping to add items!</small>
        </div>
      `;
      cartFooter.hidden = true;
      return;
    }

    cartFooter.hidden = false;
    
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
  }

  // Update cart totals
  function updateCartTotals() {
    const cart = loadCart();
    const subtotal = cart.reduce((total, item) => total + (item.price_cents * item.quantity), 0);
    
    document.getElementById('cart-sidebar-subtotal').textContent = money(subtotal);
    document.getElementById('cart-sidebar-total').textContent = money(subtotal);
    
    const checkoutBtn = document.getElementById('cart-sidebar-checkout');
    if (checkoutBtn) {
      checkoutBtn.onclick = () => {
        closeCartSidebar();
        setTimeout(() => {
          window.location.href = 'checkout.html';
        }, 300);
      };
    }
  }

  // Attach event listeners to cart items
  function attachCartItemListeners() {
    document.querySelectorAll('.quantity-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = btn.dataset.id;
        const action = btn.dataset.action;
        updateItemQuantity(itemId, action);
      });
    });

    document.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = btn.dataset.remove;
        removeCartItem(itemId);
      });
    });
  }

 // Update item quantity - FIXED with proper inventory handling
function updateItemQuantity(itemId, action) {
  const cart = loadCart();
  const itemIndex = cart.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) return;
  
  if (action === 'increment') {
    // CHECK INVENTORY BEFORE ADDING
    if (typeof inventoryManager !== 'undefined') {
      const inventory = inventoryManager.loadInventory();
      const availableStock = inventory[itemId]?.stock || 0;
      
      if (availableStock === 0) {
        showToast('No more items available in stock!');
        return;
      }
    }
    
    cart[itemIndex].quantity += 1;
    
    // UPDATE INVENTORY IF MANAGER EXISTS
    if (typeof inventoryManager !== 'undefined') {
      inventoryManager.updateStock(itemId, 1);
    }
    
  } else if (action === 'decrement') {
    if (cart[itemIndex].quantity > 1) {
      cart[itemIndex].quantity -= 1;
      
      // RESTOCK INVENTORY IF MANAGER EXISTS
      if (typeof inventoryManager !== 'undefined') {
        inventoryManager.restockProduct(itemId, 1);
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
  
  // REFRESH INVENTORY UI
  if (typeof inventoryManager !== 'undefined' && inventoryManager.refreshInventoryUI) {
    setTimeout(inventoryManager.refreshInventoryUI, 100);
  }
}

 // Remove item from cart - FIXED with inventory restocking
function removeCartItem(itemId) {
  if (!confirm('Remove this item from your cart?')) return;
  
  const cart = loadCart();
  const itemIndex = cart.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) return;
  
  const quantityToRestock = cart[itemIndex].quantity;
  
  // Remove from cart
  const updatedCart = cart.filter(item => item.id !== itemId);
  saveCart(updatedCart);
  
  // RESTOCK INVENTORY
  if (typeof inventoryManager !== 'undefined') {
    inventoryManager.restockProduct(itemId, quantityToRestock);
  }
  
  renderCartItems();
  updateCartTotals();
  renderCartCount();
  
  showToast('Item removed from cart');
  
  // REFRESH INVENTORY UI
  if (typeof inventoryManager !== 'undefined' && inventoryManager.refreshInventoryUI) {
    setTimeout(inventoryManager.refreshInventoryUI, 100);
  }
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
    if (cartLink) {
      cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        const cart = loadCart();
        
        if (cart.length === 0) {
          openCartSidebar();
        } else {
          showToast('Your cart has items!', [
            {
              text: 'View Cart',
              primary: false,
              handler: () => {
                toastEl.classList.remove('show');
                setTimeout(() => toastEl.hidden = true, 200);
                openCartSidebar();
              }
            },
            {
              text: 'Checkout',
              primary: true,
              handler: () => {
                toastEl.classList.remove('show');
                setTimeout(() => toastEl.hidden = true, 200);
                closeCartSidebar();
                setTimeout(() => {
                  window.location.href = 'checkout.html';
                }, 300);
              }
            }
          ]);
        }
      });
    }

    closeButtons.forEach(btn => {
      btn.addEventListener('click', closeCartSidebar);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && cartSidebar.classList.contains('active')) {
        closeCartSidebar();
      }
    });

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

  return { openCartSidebar };
}

// Initialize floating cart
const floatingCart = initFloatingCart();

// Update the addToCart function to open sidebar when adding items
const originalAddToCart = addToCart;
addToCart = function(productId) {
  originalAddToCart.call(this, productId);
  floatingCart.openCartSidebar();
};

// ===== WISHLIST FUNCTIONALITY =====
function initWishlist() {
  const WISHLIST_KEY = 'swiftbuy_wishlist_v1';
  const wishlistSidebar = document.getElementById('wishlist-sidebar');
  const wishlistOverlay = document.querySelector('.wishlist-overlay');
  const closeButtons = document.querySelectorAll('[data-close-wishlist]');
  const wishlistBtn = document.querySelector('.icon-btn[aria-label="Wishlist"]');

  // ===== CORE WISHLIST FUNCTIONS =====
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

  // ===== WISHLIST UI MANAGEMENT =====
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

    wishlistBody.innerHTML = wishlist.map(item => `
      <div class="wishlist-item" data-id="${item.id}">
        <div class="wishlist-item-image">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="wishlist-item-details">
          <h4 class="wishlist-item-name">${item.name}</h4>
          <div class="wishlist-item-price">${money(cents(item.price))}</div>
          <div class="wishlist-item-actions">
            <button class="move-to-cart-btn" data-move-to-cart="${item.id}">
              <i class="fas fa-shopping-cart"></i>
              Add to Cart
            </button>
            <button class="remove-wishlist-btn" data-remove-wishlist="${item.id}" aria-label="Remove from wishlist">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

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

  // ===== GLOBAL WISHLIST CLICK HANDLER =====
  function setupGlobalWishlistHandler() {
    // Remove any existing listener to avoid duplicates
    document.removeEventListener('click', handleGlobalWishlistClick);
    
    // Add global listener for ALL wishlist buttons
    document.addEventListener('click', handleGlobalWishlistClick, true);
  }

  function handleGlobalWishlistClick(e) {
    // Handle all wishlist buttons everywhere
    const wishlistBtn = e.target.closest('.wishlist-btn, .recommendation-wishlist-btn');
    if (wishlistBtn) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
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
    
    // Handle header wishlist button
    const headerWishlistBtn = e.target.closest('.icon-btn[aria-label="Wishlist"]');
    if (headerWishlistBtn) {
      e.preventDefault();
      e.stopPropagation();
      openWishlistSidebar();
    }
  }

  // ===== SIDEBAR MANAGEMENT =====
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

  // ===== INITIALIZATION =====
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

  function addWishlistButtonsToProducts() {
    const productCards = document.querySelectorAll('.product-container');
    
    productCards.forEach(card => {
      const productId = card.dataset.id;
      const product = products.find(p => p.id === productId);
      
      if (product) {
        // Remove existing button to avoid duplicates
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

// Initialize wishlist
const wishlistSystem = initWishlist();


// ===== INVENTORY MANAGEMENT SYSTEM =====
function initInventoryManagement() {
  const INVENTORY_KEY = 'swiftbuy_inventory_v1';
  
  // Load current inventory from localStorage or use default
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
  
 // Save inventory to localStorage - SAFE VERSION
function saveInventory(inventory) {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  // DON'T trigger refresh here - it causes circular calls
  // The refresh will happen in addToCart function instead
}
  
  // Get current stock level for a product
  function getStockLevel(productId) {
    const inventory = loadInventory();
    return inventory[productId]?.stock || 0;
  }
  
  // Check if product is in stock
  function isInStock(productId, quantity = 1) {
    return getStockLevel(productId) >= quantity;
  }
  
  // Check if product is low stock
  function isLowStock(productId) {
    const inventory = loadInventory();
    const item = inventory[productId];
    return item && item.stock > 0 && item.stock <= item.lowStockThreshold;
  }
  
  // Update stock level (when items are sold)
  function updateStock(productId, quantity) {
    const inventory = loadInventory();
    if (inventory[productId]) {
      inventory[productId].stock = Math.max(0, inventory[productId].stock - quantity);
      saveInventory(inventory);
      return true;
    }
    return false;
  }
  
  // Add this function to your inventory manager
function restockProduct(productId, quantity) {
  const inventory = loadInventory();
  if (inventory[productId]) {
    inventory[productId].stock += quantity;
    saveInventory(inventory);
    return true;
  }
  return false;
}
  
  // Add stock badges to product cards
  function addStockBadges() {
    const productCards = document.querySelectorAll('.product-container');
    
    productCards.forEach(card => {
      const productId = card.dataset.id;
      const stockLevel = getStockLevel(productId);
      const lowStock = isLowStock(productId);
      
      // Remove existing badges
      const existingBadge = card.querySelector('.product-stock-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
      
      // Add out-of-stock overlay
      if (stockLevel === 0) {
        card.classList.add('out-of-stock');
      } else {
        card.classList.remove('out-of-stock');
      }
      
      // Create and add stock badge
      if (stockLevel === 0) {
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
    });
  }
  
  // Enhance addToCart function with inventory check
  function enhanceAddToCart() {
    const originalAddToCart = window.addToCart;
    
    window.addToCart = function(productId) {
      if (!isInStock(productId)) {
        showToast('Sorry, this product is out of stock!', [
          {
            text: 'Notify Me When Available',
            primary: true,
            handler: () => {
              // Would implement notification system here
              showToast('We\'ll notify you when it\'s back!');
            }
          }
        ]);
        return false;
      }
      
      if (isLowStock(productId)) {
        showToast('Low stock! Only a few items left.', [], 3000);
      }
      
      // Update stock before adding to cart
      if (updateStock(productId, 1)) {
        return originalAddToCart.call(this, productId);
      }
      
      return false;
    };
  }
  
  // Create inventory dashboard
  function createInventoryDashboard() {
    const inventory = loadInventory();
    const dashboard = document.createElement('div');
    dashboard.className = 'inventory-dashboard';
    dashboard.innerHTML = `
      <div class="inventory-header">
        <h3>Inventory Management</h3>
        <button class="btn-restock-all" onclick="restockAllProducts()">
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
                <button class="btn-restock" onclick="restockProduct('${product.id}', 10)" title="Add 10 units">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    // Add to page (you might want to put this in a specific location)
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.insertBefore(dashboard, mainElement.firstChild);
    }
  }
  
  
 // Global functions for the dashboard buttons - FIXED
window.restockProduct = function(productId, quantity) {
  if (restockProduct(productId, quantity)) {
    showToast(`Restocked ${quantity} units of ${products.find(p => p.id === productId).name}`);
    // PROPERLY refresh the UI
    setTimeout(refreshInventoryUI, 100);
  }
};

window.restockAllProducts = function() {
  const inventory = loadInventory();
  Object.keys(inventory).forEach(productId => {
    restockProduct(productId, 15);
  });
  showToast('All products restocked!');
  // PROPERLY refresh the UI
  setTimeout(refreshInventoryUI, 100);
};
// Refresh all inventory-related UI - SAFE VERSION
function refreshInventoryUI() {
  // Re-render ALL products to update badges
  renderProducts();
  
  // Update cart count
  renderCartCount();
  
  // Recreate dashboard
  if (document.querySelector('.inventory-dashboard')) {
    document.querySelector('.inventory-dashboard').remove();
    createInventoryDashboard();
  }
  
  // SAFELY update quick view modal if open (no currentProduct dependency)
  const quickViewModal = document.getElementById('quickview-modal');
  if (quickViewModal && quickViewModal.classList.contains('active')) {
    // Just close and reopen the modal to refresh content
    setTimeout(() => {
      if (window.currentProduct) {
        openQuickView(window.currentProduct);
      }
    }, 100);
  }
}
  
  // Initialize everything
  function init() {
    loadInventory(); // Initialize inventory data
    enhanceAddToCart();
    addStockBadges();
    createInventoryDashboard();
    
    // Refresh UI when inventory changes
    // Refersh Invetory UI is deleted from here


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
    refreshInventoryUI
  };
}





// ===== AI-POWERED RECOMMENDATIONS ENGINE - ADVANCED FIX =====
function initRecommendationsEngine() {
  let userBehavior = {
    viewedProducts: [],
    addedToCart: [],
    wishlisted: [],
    purchaseHistory: []
  };

  // --- FIXED: Proper data persistence ---
  function loadUserBehavior() {
    try {
      const saved = localStorage.getItem('swiftbuy_behavior');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with existing to preserve function references
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

  // --- FIXED: Tracking functions ---
  function trackProductView(productId) {
    loadUserBehavior();
    if (!userBehavior.viewedProducts.includes(productId)) {
      userBehavior.viewedProducts.push(productId);
      userBehavior.viewedProducts = userBehavior.viewedProducts.slice(-20); // Keep last 20
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

  // --- ADVANCED Recommendation Algorithm ---
  function generateRecommendations(baseProductId = null, limit = 4) {
    loadUserBehavior();
    const baseProduct = baseProductId ? products.find(p => p.id === baseProductId) : null;
    
    // Score products using multi-factor algorithm
    const scoredProducts = products
      .filter(product => {
        // Exclude out-of-stock and current product
        const stock = inventoryManager ? inventoryManager.getStockLevel(product.id) : product.inventory.stock;
        return stock > 0 && product.id !== baseProductId;
      })
      .map(product => {
        let score = 0;

        // 1. Category similarity (35% weight)
        if (baseProduct && product.category === baseProduct.category) {
          score += 35;
        }

        // 2. Price range matching (25% weight)
        if (baseProduct) {
          const priceRatio = Math.min(product.price, baseProduct.price) / Math.max(product.price, baseProduct.price);
          score += priceRatio * 25;
        }

        // 3. User behavior scoring (30% weight)
        if (userBehavior.viewedProducts.includes(product.id)) score += 10;
        if (userBehavior.addedToCart.includes(product.id)) score += 15;
        if (userBehavior.wishlisted.includes(product.id)) score += 12;
        if (userBehavior.purchaseHistory.includes(product.id)) score += 20;

        // 4. Popularity and quality (10% weight)
        score += (product.rating.reviews / 200) * 5;
        score += (parseFloat(product.rating.stars) || 4) * 1.25;

        // 5. Diversity factor (prevent same products)
        const randomFactor = Math.random() * 5;
        score += randomFactor;

        return { product, score };
      });

    // Sort and return top recommendations
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit + 2) // Get extra for diversity
      .sort(() => Math.random() - 0.5) // Shuffle slightly
      .slice(0, limit)
      .map(item => item.product);
  }

  // --- Keep your existing render functions BUT update this one ---
  
 // LOCATION: Lines 1050-1070
function attachRecommendationListeners(containerId) {
  
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', async (e) => {
        const btn = e.target.closest('.recommendation-cart-btn');
       if (btn) {
    // ADD THIS LINE TO PREVENT MULTIPLE CLICKS:
    if (btn.disabled) return;
    
    e.stopPropagation();
    const productId = btn.dataset.id;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    let success = false;
    if (!window.swiftbuyAPI || !window.swiftbuyAPI.addToCart) {
        console.error('SwiftBuy API not available - using fallback');
        success = await addToCart(productId);
        if (success && window.swiftbuyAPI?.trackAddedToCart) {
            window.swiftbuyAPI.trackAddedToCart(productId);
        }
    } else {
        success = await window.swiftbuyAPI.addToCart(productId);
    }
            
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
        
        // Add wishlist button handler here too
        const wishBtn = e.target.closest('.recommendation-wishlist-btn');
        if (wishBtn) {
            // ... wishlist handler
        }
    });
}

  // --- FIXED: Event tracking with safety checks ---
  function initEventTracking() {
    // Safe override of quick view
    const originalOpenQuickView = window.openQuickView;
    if (typeof originalOpenQuickView === 'function') {
      window.openQuickView = function(product) {
        const result = originalOpenQuickView.apply(this, arguments);
        trackProductView(product.id);
        setTimeout(() => showQuickViewRecommendations(product.id), 100);
        return result;
      };
    }

    // Enhanced cart tracking
    const originalSaveCart = saveCart;
    if (typeof originalSaveCart === 'function') {
      window.saveCart = function(cart) {
        const result = originalSaveCart.apply(this, arguments);
        // Track newly added items
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


  // ===== ADD THESE MISSING FUNCTIONS BACK =====
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

function showCartRecommendations() {
  const cart = loadCart();
  if (cart.length === 0) return;

  const cartProductIds = cart.map(item => item.id);
  let allRecommendations = [];
  
  cartProductIds.forEach(productId => {
    const recs = generateRecommendations(productId, 2);
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
      renderRecommendations(uniqueRecommendations, 'cart-recommendations-grid');
    }
  }
}

function renderRecommendations(recommendations, containerId) {
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
  attachRecommendationListeners(containerId);
}
// ===== END OF MISSING FUNCTIONS =====
  // --- Initialize with error handling ---
  function init() {
    try {
      loadUserBehavior();
      initEventTracking();
      
      // Initial render with delay for DOM readiness
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
    showCartRecommendations
  };
}




// Initialize recommendations engine
const recommendationsEngine = initRecommendationsEngine();

window.refreshRecommendationsUI = function() {
  const mainSection = document.getElementById('recommendations-section');
  const mainGrid = document.getElementById('recommendations-grid');
  
  if (mainSection && mainGrid) {
    try {
      const recs = recommendationsEngine.generateRecommendations(null, 4);
      if (recs && recs.length > 0) {
        mainSection.hidden = false;
        mainGrid.innerHTML = recs.map(product => `
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
      }
    } catch (error) {
      console.warn('UI refresh failed:', error);
    }
  }
};

// Initial refresh with delay
setTimeout(() => {
  refreshRecommendationsUI();
}, 2000);

// Refresh on user interactions
window.addEventListener('cartUpdated', () => {
  setTimeout(refreshRecommendationsUI, 1000);
});

window.addEventListener('wishlistUpdated', () => {
  setTimeout(refreshRecommendationsUI, 1000);
});

console.log('✅ UI refresh system loaded');
// ===== END OF UI REFRESH CODE =====

// Continue with your other initialization code...
renderProducts();
renderCartCount();

// ===== SAFE GLOBAL EXPOSURE =====
// Make sure tracking functions are available globally without conflicts
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


// ===== AUTO-REFRESH RECOMMENDATIONS =====
function refreshAllRecommendations() {
  if (typeof loadUserBehavior === 'function') {
    loadUserBehavior();
  }
  
  if (typeof showMainPageRecommendations === 'function') {
    const mainSection = document.getElementById('recommendations-section');
    if (mainSection && !mainSection.hidden) {
      showMainPageRecommendations();
    }
  }
  
  if (typeof currentProduct !== 'undefined' && currentProduct) {
    if (typeof showQuickViewRecommendations === 'function') {
      const quickviewRecs = document.getElementById('quickview-recommendations');
      if (quickviewRecs) {
        showQuickViewRecommendations(currentProduct.id);
      }
    }
  }
  
  const cartSidebar = document.getElementById('cart-sidebar');
  if (cartSidebar && cartSidebar.classList.contains('active')) {
    if (typeof showCartRecommendations === 'function') {
      const cartRecs = document.getElementById('cart-recommendations-grid');
      if (cartRecs) {
        showCartRecommendations();
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

// Also refresh on page load after a delay
setTimeout(refreshAllRecommendations, 2000);

console.log('🔄 Auto-refresh recommendations enabled!');






// ===== COMPLETE ACCESSIBILITY FIX =====
function fixModalAccessibility() {
  const modal = document.getElementById('quickview-modal');
  if (!modal) return;
  
  // Remove aria-hidden completely since we'll manage it dynamically
  modal.removeAttribute('aria-hidden');
  
  // Create observer to manage aria-hidden based on modal state
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        if (modal.classList.contains('active')) {
          // Modal is open - make it accessible
          modal.removeAttribute('aria-hidden');
          modal.setAttribute('aria-modal', 'true');
        } else {
          // Modal is closed - hide from screen readers
          modal.setAttribute('aria-hidden', 'true');
          modal.setAttribute('aria-modal', 'false');
        }
      }
    });
  });
  
  // Start observing the modal for class changes
  observer.observe(modal, { 
    attributes: true,
    attributeFilter: ['class']
  });
  
  console.log('✅ Modal accessibility fix applied');
}

// Initialize the fix when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fixModalAccessibility);
} else {
  setTimeout(fixModalAccessibility, 100);
}




// this is the nwe code I'm added here for debugging

// ===== SIMPLE WORKING FIX =====
setTimeout(() => {
  // Store the original function first
  const originalAddToCart = function(productId) {
    const cart = loadCart();
    const idStr = String(productId);
    const existing = cart.find(i => i.id === idStr);

    if (existing) {
      existing.quantity = (existing.quantity || 0) + 1;
    } else {
      const p = products.find(x => x.id === idStr);
      if (!p) return console.warn('Product not found for id', productId);
      cart.push({
        id: p.id,
        name: p.name,
        price_cents: cents(p.price),
        quantity: 1,
        image: p.image
      });
    }

    saveCart(cart);
    showToast('Added to cart ✓');
    if (typeof floatingCart !== 'undefined' && floatingCart.openCartSidebar) {
      floatingCart.openCartSidebar();
    }
  };

  // Override with inventory check
  window.addToCart = function(productId) {
    // Skip inventory check if manager isn't ready yet
    if (typeof inventoryManager === 'undefined') {
      return originalAddToCart(productId);
    }
    
    // Use safe function access through inventoryManager
    const inventory = inventoryManager.loadInventory();
    const productStock = inventory[productId]?.stock || 0;
    
    if (productStock === 0) {
      showToast('Sorry, this product is out of stock!');
      return false;
    }
    
    // Update stock first
    inventoryManager.updateStock(productId, 1);
    
    // Then call original function
    originalAddToCart(productId);
    
    // Refresh UI
    setTimeout(() => {
      if (inventoryManager.refreshInventoryUI) {
        inventoryManager.refreshInventoryUI();
      }
    }, 100);
    
    return true;
  };
  
  console.log('✅ addToCart fixed with proper function access!');
}, 500);



// new code

function refreshRecommendations() {
  if (typeof recommendationsEngine === 'undefined') return;
  
  // Refresh main recommendations
  if (typeof recommendationsEngine.showMainPageRecommendations === 'function') {
    recommendationsEngine.showMainPageRecommendations();
  }
  
  // Refresh quick view recommendations if open - FIXED: Check if currentProduct exists
  const quickviewModal = document.getElementById('quickview-modal');
  if (quickviewModal && quickviewModal.classList.contains('active') && 
      typeof currentProduct !== 'undefined' && currentProduct) {
    if (typeof recommendationsEngine.showQuickViewRecommendations === 'function') {
      recommendationsEngine.showQuickViewRecommendations(currentProduct.id);
    }
  }
  
  // Refresh cart recommendations if open
  const cartSidebar = document.getElementById('cart-sidebar');
  if (cartSidebar && cartSidebar.classList.contains('active')) {
    if (typeof recommendationsEngine.showCartRecommendations === 'function') {
      recommendationsEngine.showCartRecommendations();
    }
  }
}

// Auto-refresh after user interactions
['cartUpdated', 'wishlistUpdated'].forEach(eventName => {
  window.addEventListener(eventName, () => {
    setTimeout(refreshRecommendations, 800);
  });
});



// It seems all of the above code are functional cleaning up stopped right here.

// Ensure API is available for recommendations
setTimeout(() => {
    if (typeof window.swiftbuyAPI === 'undefined' && typeof GlobalAPI !== 'undefined') {
        window.swiftbuyAPI = GlobalAPI;
        console.log('✅ SwiftBuy API initialized for recommendations');
    }
}, 1000);


// this just debugging code 



