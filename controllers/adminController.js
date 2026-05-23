// controllers/adminController.js

const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// ═══════════════════════════════════════════════════════
//  PRODUCT MANAGEMENT
// ═══════════════════════════════════════════════════════

const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, category, price, img, description, specs } = req.body;
    const product = await Product.create({
      title,
      category,
      price: parseFloat(price),
      img,
      description,
      specs: specs || [],
    });
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, category, price, img, description, specs } = req.body;

    // ✅ CHANGED: findById instead of findOne({ id: numericId })
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.title       = title       || product.title;
    product.category    = category    || product.category;
    product.price       = price       ? parseFloat(price) : product.price;
    product.img         = img         || product.img;
    product.description = description || product.description;
    product.specs       = specs       || product.specs;
    await product.save();

    res.json({ message: 'Product updated successfully', product });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid product ID format' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    // ✅ CHANGED: findByIdAndDelete instead of findOneAndDelete({ id: numericId })
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid product ID format' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ═══════════════════════════════════════════════════════
//  ORDER MANAGEMENT
// ═══════════════════════════════════════════════════════

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('user', 'name email');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid order ID format' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ═══════════════════════════════════════════════════════
//  USER MANAGEMENT
// ═══════════════════════════════════════════════════════

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: `User "${user.name}" deleted successfully` });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid user ID format' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  deleteUser,
};
