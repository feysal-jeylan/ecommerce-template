export const products = [
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