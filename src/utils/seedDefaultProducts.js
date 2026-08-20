import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

export const sampleProducts = [
  // 🥤 BEVERAGES
  {
    name: 'Coca-Cola Classic (330ml Can)',
    description: 'Crisp, refreshing taste of classic Coca-Cola in 330ml aluminum cans. Best served ice cold for restaurants, cafes, and retail stores.',
    category: 'Beverages',
    price: 40,
    discount: 5,
    stock: 500,
    minOrderQuantity: 1,
    sku: 'BEV-COKE-330',
    unit: 'can',
    packSize: '330ml Can',
    badge: 'Popular',
    isBestSeller: true,
    isFeatured: true,
    tags: ['coca-cola', 'coke', 'soda', 'cold drink', 'beverage', 'can'],
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Coca-Cola Wholesale Crate (24 Cans)',
    description: 'Master commercial wholesale carton of 24 Coca-Cola 330ml cans. Maximum value wholesale pack for bulk beverage procurement.',
    category: 'Beverages',
    price: 880,
    discount: 10,
    stock: 120,
    minOrderQuantity: 1,
    sku: 'BEV-COKE-24PK',
    unit: 'crate',
    packSize: '24 Cans / Crate',
    badge: 'Bulk Value',
    isBestSeller: true,
    isFeatured: true,
    tags: ['coca-cola', 'coke', 'crate', 'case', 'bulk', 'wholesale'],
    imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Pepsi Classic Chilled (500ml Pet Bottle)',
    description: 'Refreshing cola refreshment with crisp fizzy taste. High demand 500ml handy PET bottle for quick chilled counter sales.',
    category: 'Beverages',
    price: 38,
    discount: 0,
    stock: 450,
    minOrderQuantity: 1,
    sku: 'BEV-PEPSI-500',
    unit: 'bottle',
    packSize: '500ml Bottle',
    badge: 'Chilled',
    isBestSeller: true,
    isFeatured: false,
    tags: ['pepsi', 'cola', 'cold drink', 'bottle', 'beverage'],
    imageUrl: 'https://images.unsplash.com/photo-1543253687-c931c8e01820?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Sprite Lime & Lemon (750ml Bottle)',
    description: 'Clear, crisp lemon-lime flavored carbonated soft drink. 100% natural lemon-lime flavor with zero caffeine.',
    category: 'Beverages',
    price: 45,
    discount: 5,
    stock: 350,
    minOrderQuantity: 1,
    sku: 'BEV-SPRITE-750',
    unit: 'bottle',
    packSize: '750ml Bottle',
    badge: 'Refreshing',
    isBestSeller: false,
    isFeatured: true,
    tags: ['sprite', 'lime', 'lemon', 'cold drink', 'soda'],
    imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Thums Up Charged (250ml Can)',
    description: 'Taste the thunder with intense, strong carbonated Indian cola flavor. Popular favorite across wholesale food outlets.',
    category: 'Beverages',
    price: 35,
    discount: 0,
    stock: 600,
    minOrderQuantity: 1,
    sku: 'BEV-THUMS-250',
    unit: 'can',
    packSize: '250ml Can',
    badge: 'Bestseller',
    isBestSeller: true,
    isFeatured: true,
    tags: ['thums up', 'thumsup', 'strong cola', 'can', 'soda'],
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Maaza Real Mango Drink (1.2L Family Bottle)',
    description: 'Rich Alphonso mango pulp juice drink with thick authentic mango nectar. India’s favorite family mango beverage.',
    category: 'Beverages',
    price: 75,
    discount: 8,
    stock: 300,
    minOrderQuantity: 1,
    sku: 'BEV-MAAZA-12L',
    unit: 'bottle',
    packSize: '1.2L Bottle',
    badge: 'Real Pulp',
    isBestSeller: true,
    isFeatured: false,
    tags: ['maaza', 'mango', 'juice', 'fruit drink', 'bottle'],
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Red Bull Energy Drink (250ml Slim Can)',
    description: 'Premium functional beverage that vitalizes body and mind with caffeine, taurine, and B-group vitamins.',
    category: 'Beverages',
    price: 125,
    discount: 5,
    stock: 280,
    minOrderQuantity: 1,
    sku: 'BEV-REDBULL-250',
    unit: 'can',
    packSize: '250ml Can',
    badge: 'Energy Booster',
    isBestSeller: false,
    isFeatured: true,
    tags: ['red bull', 'energy drink', 'caffeine', 'can'],
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Bisleri Mineral Water Case (12 x 1L Bottles)',
    description: 'Packaged natural mineral water with 10-step purification process and added minerals. Essential for corporate & retail bulk supply.',
    category: 'Beverages',
    price: 210,
    discount: 5,
    stock: 400,
    minOrderQuantity: 1,
    sku: 'BEV-BISLERI-12PK',
    unit: 'pack',
    packSize: '12 x 1L Pack',
    badge: 'Pure & Safe',
    isBestSeller: true,
    isFeatured: false,
    tags: ['water', 'mineral water', 'bisleri', 'bulk pack', '1l'],
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80'
  },

  // 🥚 EGGS
  {
    name: 'Farm Fresh Table Eggs (Tray of 30 Eggs)',
    description: 'Grade-A fresh poultry white table eggs safely packaged in heavy-duty 30-egg pulp trays. Clean, uncracked, rich yellow yolk.',
    category: 'Eggs',
    price: 195,
    discount: 5,
    stock: 250,
    minOrderQuantity: 1,
    sku: 'EGG-TRAY-30',
    unit: 'tray',
    packSize: '30 Eggs / Tray',
    badge: 'Best Value',
    isBestSeller: true,
    isFeatured: true,
    tags: ['eggs', 'egg tray', '30 eggs', 'farm eggs', 'fresh', 'white eggs', 'poultry'],
    imageUrl: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Classic White Eggs (1 Dozen / 12 Eggs)',
    description: 'Daily fresh white eggs in protective 12-egg carton. High protein, rich taste, perfect for households, bakeries, and kitchens.',
    category: 'Eggs',
    price: 84,
    discount: 0,
    stock: 350,
    minOrderQuantity: 1,
    sku: 'EGG-DOZEN-12',
    unit: 'dozen',
    packSize: '12 Eggs / Dozen',
    badge: 'Daily Fresh',
    isBestSeller: true,
    isFeatured: false,
    tags: ['eggs', 'dozen', '12 eggs', 'white eggs', 'farm'],
    imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Fresh White Eggs (Half Dozen / 6 Eggs)',
    description: 'Standard 6-piece pack of fresh table eggs in compact carton. Quick-turnover retail pack.',
    category: 'Eggs',
    price: 45,
    discount: 0,
    stock: 400,
    minOrderQuantity: 1,
    sku: 'EGG-HALFDOZEN-6',
    unit: 'pack',
    packSize: '6 Eggs / Half Dozen',
    badge: 'Fresh',
    isBestSeller: false,
    isFeatured: false,
    tags: ['eggs', 'half dozen', '6 eggs', 'white eggs'],
    imageUrl: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Organic Farm Brown Eggs (1 Dozen / 12 Eggs)',
    description: 'Free-range, grain-fed country brown eggs with rich deep golden yolks. Higher Omega-3 content and zero antibiotics.',
    category: 'Eggs',
    price: 125,
    discount: 8,
    stock: 180,
    minOrderQuantity: 1,
    sku: 'EGG-BROWN-12',
    unit: 'dozen',
    packSize: '12 Eggs / Dozen',
    badge: 'Organic & Clean',
    isBestSeller: true,
    isFeatured: true,
    tags: ['brown eggs', 'organic eggs', 'free range', 'dozen', 'country eggs', 'protein'],
    imageUrl: 'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Premium Country Brown Eggs (Pack of 6)',
    description: 'Naturally fed country hen brown eggs in moisture-resistant 6-pack. Nutritious, dense, thick shell.',
    category: 'Eggs',
    price: 65,
    discount: 0,
    stock: 220,
    minOrderQuantity: 1,
    sku: 'EGG-BROWN-6',
    unit: 'pack',
    packSize: '6 Eggs / Pack',
    badge: 'High Protein',
    isBestSeller: false,
    isFeatured: true,
    tags: ['brown eggs', '6 eggs', 'country eggs', 'organic'],
    imageUrl: 'https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Commercial Egg Master Crate (210 Eggs / 7 Trays)',
    description: 'Bulk wholesale wooden/plastic reinforced master crate holding 7 full trays (210 eggs). For large commercial kitchens, caterers & supermarkets.',
    category: 'Eggs',
    price: 1290,
    discount: 12,
    stock: 60,
    minOrderQuantity: 1,
    sku: 'EGG-CRATE-210',
    unit: 'crate',
    packSize: '210 Eggs (7 Trays)',
    badge: 'Commercial Wholesale',
    isBestSeller: false,
    isFeatured: true,
    tags: ['crate', 'commercial', 'wholesale', '210 eggs', '7 trays', 'bulk'],
    imageUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&auto=format&fit=crop&q=80'
  },

  // 🛒 EXISTING PRODUCTS & WHOLESALE
  {
    name: 'Premium Pure Cane Sugar (50 Kg Wholesale Bag)',
    description: 'Refined double filtered sparkling white sugar for food preparation, confectionery, beverages, and wholesale retail distribution.',
    category: 'Existing Products',
    price: 2150,
    discount: 5,
    stock: 80,
    minOrderQuantity: 1,
    sku: 'SUP-SUGAR-50K',
    unit: 'bag',
    packSize: '50 Kg Bag',
    badge: 'Wholesale Standard',
    isBestSeller: false,
    isFeatured: false,
    tags: ['sugar', 'wholesale', 'bag', '50kg', 'baking', 'bulk'],
    imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Commercial Beverage Syrup Dispenser Can (5L)',
    description: 'Concentrated natural lemon & orange fruit fountain syrup for beverage coolers, soda fountains, and mocktail preparation.',
    category: 'Existing Products',
    price: 1350,
    discount: 8,
    stock: 90,
    minOrderQuantity: 1,
    sku: 'SUP-SYRUP-5L',
    unit: 'can',
    packSize: '5L Can',
    badge: 'Bulk Dispenser',
    isBestSeller: false,
    isFeatured: false,
    tags: ['syrup', 'concentrate', '5l', 'can', 'beverage supply'],
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80'
  }
];

export const seedDefaultProducts = async () => {
  const count = await Product.countDocuments({ isActive: true });
  if (count > 0) {
    return;
  }

  // Find seller or admin user to link
  const seller = (await User.findOne({ role: 'seller', isActive: true })) || (await User.findOne({ role: 'admin' }));
  if (!seller) {
    console.log('[Seed Products] Skipped (no seller/admin account found yet).');
    return;
  }

  const docs = sampleProducts.map((p) => ({
    ...p,
    seller: seller._id,
    isActive: true
  }));

  await Product.insertMany(docs);
  console.log(`[Seed Products] Successfully seeded ${docs.length} default Beverages & Eggs products!`);
};
