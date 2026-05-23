// controllers/cartController.js

const { validationResult } = require('express-validator');

const Cart = require('../models/Cart');
const Product = require('../models/Product');

// ───────────────── HELPER ─────────────────
async function getOrCreateCart(userId) {

  let cart = await Cart.findOne({
    user: userId
  });

  if (!cart) {

    cart = await Cart.create({
      user: userId,
      items: []
    });
  }

  return cart;
}

// ───────────────── GET CART ─────────────────
const getCart = async (req, res) => {

  try {

    const cart = await getOrCreateCart(
      req.user.id
    );

    res.json(cart);

  } catch (err) {

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// ───────────────── ADD ITEM ─────────────────
const addItem = async (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {

    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {

    const { productId, quantity } =
      req.body;

    // FIND PRODUCT USING _id
    const product =
      await Product.findById(productId);

    if (!product) {

      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const cart =
      await getOrCreateCart(req.user.id);

    // FIND ITEM
    const existingIndex =
      cart.items.findIndex(
        (i) =>
          i.productId.toString() ===
          productId
      );

    // ITEM EXISTS
    if (existingIndex >= 0) {

      const newQty =
        cart.items[existingIndex]
          .quantity + Number(quantity);

      cart.items[existingIndex]
        .quantity = Math.min(newQty, 10);

    } else {

      // NEW ITEM
      cart.items.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        img: product.img,
        quantity: Number(quantity)
      });
    }

    await cart.save();

    res.status(201).json({
      message: 'Item added to cart',
      cart
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// ───────────────── UPDATE ITEM ─────────────────
const updateItem = async (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {

    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {

    const productId =
      req.params.productId;

    const cart =
      await Cart.findOne({
        user: req.user.id
      });

    if (!cart) {

      return res.status(404).json({
        error: 'Cart not found'
      });
    }

    const item = cart.items.find(
      (i) =>
        i.productId.toString() ===
        productId
    );

    if (!item) {

      return res.status(404).json({
        error: 'Item not found'
      });
    }

    item.quantity =
      Number(req.body.quantity);

    await cart.save();

    res.json({
      message: 'Cart updated',
      cart
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// ───────────────── REMOVE ITEM ─────────────────
const removeItem = async (req, res) => {

  try {

    const productId =
      req.params.productId;

    const cart =
      await Cart.findOne({
        user: req.user.id
      });

    if (!cart) {

      return res.status(404).json({
        error: 'Cart not found'
      });
    }

    const before =
      cart.items.length;

    cart.items =
      cart.items.filter(
        (i) =>
          i.productId.toString() !==
          productId
      );

    if (before === cart.items.length) {

      return res.status(404).json({
        error:
          'Item not found in cart'
      });
    }

    await cart.save();

    res.json({
      message:
        'Item removed from cart',
      cart
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error:
        'Internal server error'
    });
  }
};

// ───────────────── CLEAR CART ─────────────────
const clearCart = async (req, res) => {

  try {

    const cart =
      await Cart.findOne({
        user: req.user.id
      });

    if (!cart) {

      return res.status(404).json({
        error: 'Cart not found'
      });
    }

    cart.items = [];

    await cart.save();

    res.json({
      message: 'Cart cleared',
      cart
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error:
        'Internal server error'
    });
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart
};