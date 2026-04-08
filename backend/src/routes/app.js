const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const apiRoutes = require('./routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Campus Food backend is running',
  });
});

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

module.exports = app;