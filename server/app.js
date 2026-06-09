const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const placeRoutes = require('./routes/placeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const geoRoutes = require('./routes/geoRoutes');

connectDB();
configureCloudinary();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Local Nook API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', 'dist');
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.use(errorHandler);

module.exports = app;