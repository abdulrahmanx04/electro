const Order = require('../models/Order');
const Cart = require('../models/Cart');

// ───────────────── PLACE ORDER ─────────────────
const placeOrder = async (req, res) => {
  try {

    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        error: 'Missing shipping address'
      });
    }

    // 🔥 GET CART FROM DB (DO NOT TRUST FRONTEND)
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        error: 'Cart is empty'
      });
    }

    const orderItems = cart.items.map(item => ({
      productId: item.productId,
      title: item.title,
      quantity: item.quantity,
      img: item.img,
      pricePerUnit: item.price   // 🔥 FIX HERE
    }));

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // CREATE ORDER
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      img: cart.items.map(item => item.img),
      shippingAddress
    });

    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: 'Order placed successfully',
      order
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const getUserOrders = async (req, res) => {
  try {

    const orders = await Order.find({
      user: req.user.id
    }).sort('-createdAt');

    res.json(orders);

  } catch (err) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const cancelOrder = async (req, res) => {
  try {

    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    if (
      ['Shipped', 'Delivered', 'Cancelled'].includes(order.status)
    ) {
      return res.status(400).json({
        error: `Cannot cancel order with status: ${order.status}`
      });
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  placeOrder,
  getUserOrders,
  cancelOrder
};