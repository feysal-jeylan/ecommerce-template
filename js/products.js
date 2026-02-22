// products.js - UPDATED WITH INVENTORY
export const products = [{
  id: "101",
  name: "Headset",
  category: "electronics",
  image: "images/headset transparent.png",
  rating: {
    stars: "★★★★☆",
    reviews: 128,
  },
  price: 132,
  inventory: {
    stock: 15,
    lowStockThreshold: 5
  }
}, {
  id: "102",
  name: "Light Black Shoe",
  category: "shoe",
  image: "images/transparent shoe.png",
  rating: {
    stars: "★★★★☆",
    reviews: 128
  },
  price: 100,
  inventory: {
    stock: 3, // Low stock
    lowStockThreshold: 5
  }
}, {
  id: "103",
  name: "Smart Watch",
  category: "electronics",
  image: "images/transparent watch.png",
  rating: {
    stars: "★★★★☆",
    reviews: 128
  },
  price: 120,
  inventory: {
    stock: 0, // Out of stock
    lowStockThreshold: 5
  }
}, {
  id: "104",
  name: "Best Sunglasses",
  category: "sunglasses",
  image: "images/sunglasses.png",
  rating: {
    stars: "★★★★☆",
    reviews: 128,      
  },
  price: 45,
  inventory: {
    stock: 25,
    lowStockThreshold: 5
  }
}, {
  id: "105",
  name: "Smart Backpacks",
  category: "Backpacks",
  image: "images/backpack.png",
  rating: {
    stars: "★★★★☆",
    reviews: 128,
  },
  price: 120,
  inventory: {
    stock: 8,
    lowStockThreshold: 5
  }
}];