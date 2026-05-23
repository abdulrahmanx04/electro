// routes/cart.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const cartController = require('../controllers/cartController');
const mongoose = require('mongoose');

const itemValidators = [
  body('productId')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid productId'),

  body('quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),
];

const quantityValidator = [
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
];

router.get('/', authenticateToken, cartController.getCart);
router.post('/', authenticateToken, itemValidators, cartController.addItem);
router.put('/:productId', authenticateToken, quantityValidator, cartController.updateItem);
router.delete('/:productId', authenticateToken, cartController.removeItem);
router.delete('/', authenticateToken, cartController.clearCart);

module.exports = router;
