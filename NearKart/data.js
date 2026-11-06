/* ============================================================
   data.js  -  fixed data: categories, locations, sample shops
   ============================================================ */

var NK_CATEGORIES = [
  { name: 'Food', icon: '🍕' },
  { name: 'Electronics', icon: '💻' },
  { name: 'Beauty', icon: '💄' },
  { name: 'Fashion', icon: '👔' },
  { name: 'Sports', icon: '⚽' },
  { name: 'Books', icon: '📖' },
  { name: 'Mobile', icon: '📱' },
  { name: 'Home & Living', icon: '🏠' },
  { name: 'Gifts', icon: '🎁' }
];

/* shown inside the "More" menu */
var NK_EXTRA_CATEGORIES = [
  { name: 'Grocery', icon: '🛒' },
  { name: 'Pharmacy', icon: '💊' },
  { name: 'Pet Supplies', icon: '🐶' },
  { name: 'Stationery', icon: '✏️' },
  { name: 'Services', icon: '🛠️' }
];

/* state -> cities (used by the location picker) */
var NK_LOCATIONS = {
  'Maharashtra': ['Palghar', 'Boisar', 'Dahanu', 'Vasai', 'Virar', 'Mumbai', 'Thane', 'Navi Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Kolhapur', 'Solapur'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Jamnagar', 'Bhavnagar', 'Gandhinagar', 'Vapi', 'Valsad', 'Navsari', 'Junagadh'],
  'Delhi NCR': ['Delhi', 'Noida', 'Gurugram', 'Faridabad', 'Ghaziabad'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Tirupati'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'],
  'West Bengal': ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
  'Punjab & Chandigarh': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur'],
  'Goa': ['Panaji', 'Margao', 'Mapusa'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela']
};

/* demo shops so the site is not empty on first open */
var NK_SAMPLE_SHOPS = [
  {
    id: 's1', name: 'Urban Threads Fashion Store', owner: 'Sample Owner',
    category: 'Fashion', city: 'Palghar', address: 'Station Road',
    tagline: 'Fashion for everyone', color: '#7a4b2a', rating: 4.5, sample: true,
    products: [
      { id: 'p1', name: 'Cotton Hoodie', price: 1299, icon: '🧥' },
      { id: 'p2', name: 'Classic Shirt', price: 899, icon: '👔' },
      { id: 'p3', name: 'Denim Jeans', price: 1499, icon: '👖' }
    ]
  },
  {
    id: 's2', name: 'TechHub Electronics', owner: 'Sample Retail Ltd.',
    category: 'Electronics', city: 'Palghar', address: 'Market Yard',
    tagline: 'Latest electronics at best prices', color: '#1c4fd8', rating: 4.3, sample: true,
    products: [
      { id: 'p1', name: 'Wireless Headphones', price: 2499, icon: '🎧' },
      { id: 'p2', name: 'Smart Watch', price: 3999, icon: '⌚' },
      { id: 'p3', name: 'Laptop 14"', price: 45999, icon: '💻' }
    ]
  },
  {
    id: 's3', name: 'Glow Lane Beauty', owner: 'Sample Ventures Pvt. Ltd.',
    category: 'Beauty', city: 'Palghar', address: 'Main Bazaar',
    tagline: 'Be Beautiful, Be You', color: '#d6195e', rating: 4.6, sample: true,
    products: [
      { id: 'p1', name: 'Matte Lipstick', price: 499, icon: '💄' },
      { id: 'p2', name: 'Foundation', price: 799, icon: '🧴' },
      { id: 'p3', name: 'Makeup Brush Set', price: 649, icon: '🖌️' }
    ]
  },
  {
    id: 's4', name: 'Fresh Basket Grocery', owner: 'Sample Owner',
    category: 'Grocery', city: 'Mumbai', address: 'Andheri West',
    tagline: 'Fresh groceries at your door', color: '#0f9d58', rating: 4.4, sample: true,
    products: [
      { id: 'p1', name: 'Basmati Rice 5kg', price: 560, icon: '🍚' },
      { id: 'p2', name: 'Fresh Milk 1L', price: 66, icon: '🥛' },
      { id: 'p3', name: 'Seasonal Fruits 1kg', price: 180, icon: '🍎' }
    ]
  },
  {
    id: 's5', name: 'Tasty Bites Kitchen', owner: 'Sample Owner',
    category: 'Food', city: 'Surat', address: 'Adajan',
    tagline: 'Hot and fresh, every time', color: '#f57c00', rating: 4.2, sample: true,
    products: [
      { id: 'p1', name: 'Margherita Pizza', price: 249, icon: '🍕' },
      { id: 'p2', name: 'Veg Burger', price: 129, icon: '🍔' },
      { id: 'p3', name: 'Cold Coffee', price: 99, icon: '☕' }
    ]
  }
];