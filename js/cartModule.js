import { products } from './products.js';

// --- Atomic Operation System ---
let operationLock = false;
const operationQueue = [];

export function executeAtomicOperation(operation) {
    return new Promise((resolve, reject) => {
        operationQueue.push({ operation, resolve, reject });
        processOperationQueue();
    });
}

function processOperationQueue() {
    if (operationLock || operationQueue.length === 0) return;
    
    operationLock = true;
    const { operation, resolve, reject } = operationQueue.shift();
    
    try {
        const result = operation();
        resolve(result);
    } catch (error) {
        reject(error);
    } finally {
        operationLock = false;
        setTimeout(processOperationQueue, 10);
    }
}

export function isOperationInProgress() {
    return operationLock || operationQueue.length > 0;
}

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

// --- Enhanced Atomic Cart Operations ---
export async function addToCart(productId, quantity = 1) {
    return executeAtomicOperation(() => {
        const cart = loadCart();
        const product = products.find(p => p.id === productId);
        
        if (!product) throw new Error('Product not found');
        
        // Inventory check - use inventoryManager if available, else fallback
        let availableStock = product.inventory.stock;
        if (typeof inventoryManager !== 'undefined') {
            const inventory = inventoryManager.loadInventory();
            availableStock = inventory[productId]?.stock || product.inventory.stock;
        }
        
        if (availableStock < quantity) {
            throw new Error(`Only ${availableStock} item${availableStock !== 1 ? 's' : ''} available`);
        }

        // Update cart
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price_cents: Math.round(product.price * 100),
                quantity: quantity,
                image: product.image
            });
        }

        // Update inventory FIRST if manager exists
        if (typeof inventoryManager !== 'undefined') {
            inventoryManager.updateStock(productId, quantity);
        }

        // THEN save cart
        saveCart(cart);
        
        return true;
    });
}

export async function removeFromCart(productId, quantity = null) {
    return executeAtomicOperation(() => {
        const cart = loadCart();
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex === -1) return false;

        if (quantity === null || cart[itemIndex].quantity <= quantity) {
            // Remove entire item
            const removedQuantity = cart[itemIndex].quantity;
            cart.splice(itemIndex, 1);
            
            // Restock inventory if manager exists
            if (typeof inventoryManager !== 'undefined') {
                inventoryManager.restockProduct(productId, removedQuantity);
            }
        } else {
            // Reduce quantity
            cart[itemIndex].quantity -= quantity;
            
            // Restock partial
            if (typeof inventoryManager !== 'undefined') {
                inventoryManager.restockProduct(productId, quantity);
            }
        }

        saveCart(cart);
        return true;
    });
}