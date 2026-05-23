const mongoose = require("mongoose");

// ─── RELATIONSHIPS ─────────────────────────────────────────────────────────
// Order →(many-to-one)→ User         via user field (ObjectId ref)
// Order →(snapshot of)→ Product      via items[].productId (ObjectId ref)
//   — we snapshot title/price/img so order history never breaks
//     if a product is later edited or deleted

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  title: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  img: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    // many-to-one: many orders belong to one user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    shippingAddress: { type: String, required: true },
    stripeSessionId: { type: String, sparse: true, unique: true },
    transactionId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
