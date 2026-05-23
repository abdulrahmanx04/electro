const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const PendingCheckout = require('../models/PendingCheckout');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith('sk_')) return null;
  return require('stripe')(key);
}

function getBaseUrl(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
}

// ─── CONFIG ────────────────────────────────────────────────────────────────
const getConfig = (req, res) => {
  const stripe = getStripe();
  res.json({
    stripeEnabled: Boolean(stripe),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    mode: stripe ? 'stripe' : 'mock',
  });
};

const createSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({
      error: 'Stripe is not configured.',
    });
  }

  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'Pending') {
      return res.status(400).json({ error: `Order is already ${order.status}` });
    }

    const alreadyPending = await PendingCheckout.findOne({
      stripeSessionId: order.stripeSessionId,
      status: 'pending',
    });

    if (alreadyPending) {
      return res.json({
        success: true,
        sessionId: alreadyPending.stripeSessionId,
      });
    }

    const baseUrl = getBaseUrl(req);

    const line_items = order.items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          images: item.img ? [item.img] : [],
        },
        unit_amount: Math.round(item.pricePerUnit * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${baseUrl}/checkout-success`,
      cancel_url: `${baseUrl}/checkout-failed`,
      customer_email: req.user.email,
      metadata: {
        userId: String(req.user.id),
        orderId: String(order._id),
      },
    });

    await PendingCheckout.create({
      user: req.user.id,
      orderId: order._id,
      items: order.items,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      stripeSessionId: session.id,
      status: 'pending',
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error('Stripe session error:', err);
    res.status(500).json({ error: 'Stripe session creation failed' });
  }
};

const completeSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured' });

  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    const pending = await PendingCheckout.findOne({ stripeSessionId: sessionId });
    if (!pending) {
      return res.status(404).json({ error: 'Checkout session not found' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    if (session.metadata?.userId !== String(req.user.id)) {
      return res.status(403).json({ error: 'Session does not belong to this user' });
    }

    const order = await Order.findByIdAndUpdate(
      pending.orderId,
      {
        status: 'Paid',
        stripeSessionId: sessionId,
        transactionId: session.payment_intent || sessionId,
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    pending.status = 'completed';
    await pending.save();

    return res.json({
      success: true,
      orderId: order._id,
      transactionId: order.transactionId,
      message: 'Payment confirmed via Stripe',
    });

  } catch (err) {
    console.error('Complete session error:', err);
    return res.status(500).json({ error: 'Could not verify payment' });
  }
};



module.exports = {
  getConfig,
  createSession,
  completeSession,
};