// cartModule.js - NEW FILE (Shared cart logic)
export const CART_KEY = 'swiftbuy_cart_v1';

export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to parse cart from storage', err);
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

export function cartItemCount() {
  const cart = loadCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
}

export function findItemInCart(cart, productId) {
  return cart.find(item => item.id === String(productId));
}


// added here before real debuggin started

// Add to cartModule.js
/*
let operationInProgress = false;

export function safeCartOperation(operation) {
    if (operationInProgress) {
        return Promise.reject(new Error('Operation in progress'));
    }
    
    operationInProgress = true;
    try {
        const result = operation();
        return Promise.resolve(result);
    } catch (error) {
        return Promise.reject(error);
    } finally {
        setTimeout(() => { operationInProgress = false; }, 50);
    }
}
*/