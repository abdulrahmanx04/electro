// routes/admin.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, authorizeAdmin } = require('../middlewares/authMiddleware');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  deleteUser,
} = require('../controllers/adminController');


router.post(
  '/products',
  authenticateToken,
  authorizeAdmin,
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('category').notEmpty().withMessage('Category is required').trim(),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('img').notEmpty().withMessage('Image URL is required'),
    body('description').notEmpty().withMessage('Description is required'),
  ],
  createProduct
);

// PUT /api/admin/products/:id — Update product
router.put(
  '/products/:id',
  authenticateToken,
  authorizeAdmin,
  [
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  ],
  updateProduct
);

router.delete('/products/:id', authenticateToken, authorizeAdmin, deleteProduct);

router.get('/orders', authenticateToken, authorizeAdmin, getAllOrders);

router.put(
  '/orders/:id/status',
  authenticateToken,
  authorizeAdmin,
  [
    body('status')
      .isIn(['Pending', 'Paid', 'Completed'])
      .withMessage('Status must be Pending, Paid, or Completed'),
  ],
  updateOrderStatus
);


router.get('/users', authenticateToken, authorizeAdmin, getAllUsers);

router.delete('/users/:id', authenticateToken, authorizeAdmin, deleteUser);

module.exports = router;
