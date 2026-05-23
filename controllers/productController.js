
const { validationResult } = require('express-validator');
const Product = require('../models/Product');

const getProducts = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { q, category, minPrice, maxPrice } = req.query;
    const filter = {};

    if (q) filter.title = { $regex: q, $options: 'i' };

    if (category) filter.category = category;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid product ID format' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getProducts, getProductById };
