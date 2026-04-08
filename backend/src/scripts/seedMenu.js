require('dotenv').config()
const mongoose = require('mongoose')
const MenuItem = require('../models/MenuItem')

const items = [
  { name: 'Rice & Curry', description: 'Traditional Sri Lankan rice and curry', price: 250, category: 'lunch' },
  { name: 'Kottu Roti', description: 'Chopped roti with vegetables and egg', price: 300, category: 'dinner' },
  { name: 'String Hoppers', description: 'Steamed rice noodle cakes with coconut sambol', price: 180, category: 'breakfast' },
  { name: 'Egg Sandwich', description: 'Toasted sandwich with boiled egg', price: 120, category: 'breakfast' },
  { name: 'Fried Rice', description: 'Vegetable fried rice', price: 280, category: 'lunch' },
  { name: 'Noodles', description: 'Stir-fried noodles with vegetables', price: 260, category: 'dinner' },
  { name: 'Short Eats Plate', description: 'Assorted short eats (3 pcs)', price: 150, category: 'snack' },
  { name: 'Milk Tea', description: 'Ceylon milk tea', price: 80, category: 'beverage' },
  { name: 'Juice', description: 'Fresh fruit juice', price: 100, category: 'beverage' },
]

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await MenuItem.deleteMany({})
  await MenuItem.insertMany(items)
  console.log('Menu seeded successfully')
  process.exit(0)
}).catch((err) => { console.error(err); process.exit(1) })
