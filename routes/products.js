
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { getProducts, getProductById } = require('../controllers/productController');

router.get(
  '/',
  [
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be a positive number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be a positive number'),
  ],
  getProducts
);

router.get('/:id', getProductById);

module.exports = router;
