require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/slicecraft';

// ─── Schemas ───────────────────────────────────────────────────────────────

const AddressSchema = new mongoose.Schema({
  label: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  coordinates: { type: [Number], default: [0, 0] }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  savedAddresses: [AddressSchema]
}, { timestamps: true });

const MealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String },
  tags: [String],
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

const OrderItemSchema = new mongoose.Schema({
  mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
  title: { type: String, required: true },
  priceAtPurchase: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  items: [OrderItemSchema],
  totalPrice: { type: Number, required: true },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Unpaid'
  }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Meal = mongoose.model('Meal', MealSchema);
const Order = mongoose.model('Order', OrderSchema);

// ─── Helpers ───────────────────────────────────────────────────────────────

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ─── Meals: Authentic Italian Only (80 items) ──────────────────────────────

const categories = ['Pizzas', 'Pastas', 'Antipasti', 'Drinks', 'Desserts', 'Salads'];
const tagsPool = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Spicy', 'Popular', 'Chef\'s Choice', 'Premium', 'Staff Favorite', 'New', 'Seasonal', 'Shareable', 'Healthy', 'Low-Calorie', 'Artisanal', 'Classic', 'Family Size'];
const orderStatuses = ['Pending', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'];
const paymentStatuses = ['Paid', 'Unpaid'];
const cities = ['Cairo', 'Alexandria', 'Giza', 'Sharm El-Sheikh', 'Hurghada', 'Luxor', 'Aswan', 'Mansoura', 'Tanta', 'Port Said', 'Ismailia', 'Zagazig', 'Faiyum', 'Minya', 'Sohag'];
const streets = ['Tahrir Square', 'Corniche El-Nil', 'El-Horreya Road', 'Gamal Abdel Nasser', 'El-Gaish Road', 'Moustafa Kamel', 'Ahmed Orabi', 'El-Merghany', 'Road 9', 'El-Nasr Road', 'Pyramids Street', 'El-Moez Street', 'Khan El-Khalili', 'Zamalek Street', 'Maadi Corniche', 'Heliopolis Street', 'Nasr City Axis', '6th of October Bridge', 'Alexandria Desert Road', 'Suez Canal Street'];

const mealTemplates = [
  // Pizzas (14)
  { title: 'Margherita Classica', desc: 'San Marzano tomatoes, fresh mozzarella, basil, extra virgin olive oil on a wood-fired crust.', price: 18, cat: 'Pizzas', tags: ['Vegetarian', 'Classic'], img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80' },
  { title: 'Pepperoni Passion', desc: 'Double pepperoni, mozzarella, tomato sauce, oregano, chili flakes.', price: 21, cat: 'Pizzas', tags: ['Popular', 'Spicy'], img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80' },
  { title: 'Quattro Formaggi', desc: 'Mozzarella, gorgonzola, parmesan, and fontina cheeses with a hint of honey.', price: 24, cat: 'Pizzas', tags: ['Vegetarian', 'Premium'], img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80' },
  { title: 'Diavola', desc: 'Spicy salami, hot peppers, mozzarella, tomato sauce, basil.', price: 23, cat: 'Pizzas', tags: ['Spicy', 'Popular'], img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80' },
  { title: 'Capricciosa', desc: 'Ham, mushrooms, artichokes, olives, mozzarella, tomato sauce.', price: 25, cat: 'Pizzas', tags: ['Classic', 'Popular'], img: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800&q=80' },
  { title: 'Marinara', desc: 'Tomato sauce, garlic, oregano, extra virgin olive oil. No cheese.', price: 15, cat: 'Pizzas', tags: ['Vegan', 'Classic'], img: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&q=80' },
  { title: 'Prosciutto e Funghi', desc: 'Prosciutto, wild mushrooms, mozzarella, tomato sauce, parmesan shavings.', price: 26, cat: 'Pizzas', tags: ['Popular', 'Chef\'s Choice'], img: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80' },
  { title: 'Calzone Napoletano', desc: 'Folded pizza with ricotta, salami, mozzarella, and tomato sauce.', price: 22, cat: 'Pizzas', tags: ['Classic', 'Shareable'], img: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80' },
  { title: 'Pizza Bianca', desc: 'White pizza with ricotta, mozzarella, garlic, spinach, and truffle oil.', price: 27, cat: 'Pizzas', tags: ['Vegetarian', 'Premium'], img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80' },
  { title: 'Frutti di Mare', desc: 'Shrimp, mussels, calamari, clams, garlic, parsley, tomato sauce.', price: 29, cat: 'Pizzas', tags: ['Seafood', 'Premium'], img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80' },
  { title: 'Salsiccia e Friarielli', desc: 'Italian sausage, broccoli rabe, mozzarella, chili flakes, olive oil.', price: 24, cat: 'Pizzas', tags: ['Popular', 'Seasonal'], img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80' },
  { title: 'Quattro Stagioni', desc: 'Four seasons: artichokes, ham, mushrooms, olives on one pizza.', price: 26, cat: 'Pizzas', tags: ['Classic', 'Shareable'], img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80' },
  { title: 'Pizza al Tartufo', desc: 'Black truffle cream, mozzarella, porcini mushrooms, parmesan.', price: 32, cat: 'Pizzas', tags: ['Premium', 'Vegetarian'], img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80' },
  { title: 'Bufalina DOP', desc: 'Buffalo mozzarella DOP, cherry tomatoes, fresh basil, olive oil.', price: 28, cat: 'Pizzas', tags: ['Premium', 'Vegetarian', 'Chef\'s Choice'], img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80' },

  // Pastas (16)
  { title: 'Spaghetti Carbonara', desc: 'Crispy pancetta, egg yolk, pecorino romano, black pepper.', price: 19, cat: 'Pastas', tags: ['Classic', 'Popular'], img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80' },
  { title: 'Fettuccine Alfredo', desc: 'Creamy parmesan sauce, butter, fresh fettuccine, parsley.', price: 18, cat: 'Pastas', tags: ['Vegetarian', 'Classic'], img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80' },

  // Drinks (2)
  { title: 'Pomegranate Mint Breeze', desc: 'Freshly squeezed organic pomegranate juice infused with fresh mint and a touch of lime. 400ml', price: 6.5, cat: 'Drinks', tags: ['Fresh Juice', 'Healthy', 'Popular'], img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80' },
  { title: 'Avocado Mango Smoothie', desc: 'Creamy local avocado blended with sweet mango nectar, honey, and fresh almond milk. 400ml', price: 8.0, cat: 'Drinks', tags: ['Smoothie', 'Healthy', 'Premium'], img: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&q=80' }
];

function generateMeals() {
  return mealTemplates.map((m) => ({
    title: m.title,
    description: m.desc,
    price: m.price,
    category: m.cat,
    imageUrl: m.img || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    tags: m.tags,
    isAvailable: true
  }));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// ─── Users: Egyptian Names (30 users) ──────────────────────────────────────

const egyptianFirstNames = ['Omar', 'Amr', 'Youssef', 'Ahmed', 'Mohamed', 'Ali', 'Hassan', 'Khaled', 'Tarek', 'Ibrahim', 'Mahmoud', 'Karim', 'Mostafa', 'Hussein', 'Ramadan', 'Sara', 'Nour', 'Mariam', 'Fatma', 'Aya', 'Hana', 'Yasmin', 'Salma', 'Laila', 'Dina', 'Reem', 'Nada', 'Farah', 'Rania', 'Heba'];
const egyptianLastNames = ['Hassan', 'Mohamed', 'Ibrahim', 'Ahmed', 'Ali', 'Mahmoud', 'Omar', 'Youssef', 'Khalil', 'Said', 'Farouk', 'El-Sayed', 'Abdel-Rahman', 'Gamal', 'Fouad', 'Naguib', 'Rizk', 'Salem', 'Tawfik', 'Hamed', 'Ismail', 'Adel', 'Fathi', 'Mansour', 'Shawky', 'Gaber', 'Sobhy', 'Zaki', 'Anwar', 'Bakr'];

function generateUsers() {
  const users = [];

  // Seed the main Administrator user first
  users.push({
    name: 'Admin Marco',
    email: 'admin@slicecraft.com',
    passwordHash: hashPassword('AdminPassword123!'),
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
    points: 5000,
    savedAddresses: [
      {
        label: 'Zamalek HQ',
        street: '15 El-Horreya Road, Zamalek',
        city: 'Cairo',
        coordinates: [30.0596, 31.2241]
      }
    ]
  });

  for (let i = 0; i < 30; i++) {
    const fname = egyptianFirstNames[i % egyptianFirstNames.length];
    const lname = egyptianLastNames[i % egyptianLastNames.length];
    const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${i > 0 ? i : ''}@example.com`;
    const numAddresses = randomInt(1, 3);
    const addresses = [];
    for (let a = 0; a < numAddresses; a++) {
      addresses.push({
        label: a === 0 ? 'Home' : a === 1 ? 'Work' : 'Other',
        street: `${randomInt(1, 200)} ${randomItem(streets)}`,
        city: randomItem(cities),
        coordinates: [randomInt(29, 32) + Math.random(), randomInt(30, 32) + Math.random()]
      });
    }
    users.push({
      name: `${fname} ${lname}`,
      email,
      passwordHash: hashPassword('password123'),
      avatarUrl: `https://images.unsplash.com/photo-${i % 2 === 0 ? '1534528741775-53994a69daeb' : '1507003211169-0a1dd7228f2d'}?w=150&h=150&fit=crop&q=80`,
      points: randomInt(100, 1200),
      savedAddresses: addresses
    });
  }
  return users;
}

// ─── Orders (150 orders) ───────────────────────────────────────────────────

function generateOrders(users, meals) {
  const orders = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 150; i++) {
    const user = randomItem(users);
    const numItems = randomInt(1, 5);
    const orderMeals = randomItems(meals, numItems);
    const items = orderMeals.map(meal => ({
      mealId: meal._id,
      title: meal.title,
      priceAtPurchase: meal.price,
      quantity: randomInt(1, 3)
    }));

    const totalPrice = items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
    const address = user.savedAddresses.length > 0 ? randomItem(user.savedAddresses) : {
      street: `${randomInt(1, 200)} ${randomItem(streets)}`,
      city: randomItem(cities)
    };

    const createdAt = randomDate(sixMonthsAgo, now);
    const statusWeights = [0.1, 0.15, 0.15, 0.55, 0.05];
    const statusRoll = Math.random();
    let status;
    if (statusRoll < statusWeights[0]) status = 'Pending';
    else if (statusRoll < statusWeights[0] + statusWeights[1]) status = 'Preparing';
    else if (statusRoll < statusWeights[0] + statusWeights[1] + statusWeights[2]) status = 'OutForDelivery';
    else if (statusRoll < statusWeights[0] + statusWeights[1] + statusWeights[2] + statusWeights[3]) status = 'Delivered';
    else status = 'Cancelled';

    orders.push({
      userId: user._id,
      items,
      totalPrice: Math.round(totalPrice * 100) / 100,
      deliveryAddress: {
        street: address.street,
        city: address.city
      },
      status,
      paymentStatus: Math.random() > 0.15 ? 'Paid' : 'Unpaid',
      createdAt,
      updatedAt: createdAt
    });
  }
  return orders;
}

// ─── Main Seed Function ────────────────────────────────────────────────────

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connection successful. Seeding database...\n');

    // Clear existing data
    await User.deleteMany({});
    await Meal.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data.');

    // Seed Meals
    const mealsData = generateMeals();
    const meals = await Meal.insertMany(mealsData);
    console.log(`Seeded ${meals.length} Italian meals.`);

    // Seed Users
    const usersData = generateUsers();
    const users = await User.insertMany(usersData);
    console.log(`Seeded ${users.length} Egyptian users.`);

    // Seed Orders
    const ordersData = generateOrders(users, meals);
    const orders = await Order.insertMany(ordersData);
    console.log(`Seeded ${orders.length} orders.`);

    // Summary
    const categoryCounts = meals.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});

    console.log('\n=== Seed Summary ===');
    console.log('Meals by category:');
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    console.log('\nOrders by status:');
    Object.entries(statusCounts).forEach(([st, count]) => {
      console.log(`  ${st}: ${count}`);
    });

    console.log('\nDatabase seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
