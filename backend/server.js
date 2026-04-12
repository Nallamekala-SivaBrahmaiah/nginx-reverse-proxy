const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lakeflip';

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Database Schema and Model for Orders
const orderSchema = new mongoose.Schema({
  productName: String,
  price: String,
  customerName: String,
  email: String,
  address: String,
  location: String,
  paymentMethod: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'lakeflip-backend', dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Create a new order (when user buys an item)
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json({ success: true, message: 'Order placed successfully!', order: savedOrder });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Failed to place order.' });
  }
});

// Get all orders (for displaying history)
app.get('/api/orders', async (req, res) => {
  try {
    // Optionally group by email from query string `?email=john@example.com`
    const query = req.query.email ? { email: req.query.email } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
