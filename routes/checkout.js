// routes/checkout.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const checkoutController = require('../controllers/checkoutController');

// GET  /api/checkout/config           — Stripe mode + publishable key
router.get('/config', checkoutController.getConfig);

// POST /api/checkout/create-session   — Create Stripe session for an existing order
router.post(
  '/create-session',
  authenticateToken,
  [body('orderId').notEmpty().withMessage('orderId is required')],
  checkoutController.createSession
);

// POST /api/checkout/complete-session — Confirm payment after Stripe redirect
router.post(
  '/complete-session',
  authenticateToken,
  [body('sessionId').notEmpty().withMessage('sessionId is required')],
  checkoutController.completeSession
);
router.get('/success', (req, res) => {
  res.send("Payment Successful")
});

router.get('/failed', (req, res) => {
  res.send("Payment Failed")
});



module.exports = router;
