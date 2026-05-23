const mongoose = require("mongoose");

// ─── RELATIONSHIPS ─────────────────────────────────────────────────────────
// Cart →(one-to-one)→  User           via user field (ObjectId ref, unique)
// Cart →(many-to-one)→ Product        via items[].productId (ObjectId ref)
//   — price is re-fetched from Product on every add
//     so the cart always shows the latest price

const cartItemSchema = new mongoose.Schema({
  // Reference to Product for price validation
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  // Snapshot of product info at time of adding to cart
  title: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, max: 10 },
});

const cartSchema = new mongoose.Schema(
  {
    // one-to-one: each user has exactly one cart
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
