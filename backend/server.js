const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const mealRoutes = require('./routes/mealRoutes');
const mealPlanRoutes = require('./routes/mealPlanRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

require('dotenv').config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users', userRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/mealplans', mealPlanRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
const frontendIndexPath = path.join(frontendBuildPath, 'index.html');
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

if (hasFrontendBuild) {
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(frontendIndexPath);
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running... Frontend build not found.');
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));