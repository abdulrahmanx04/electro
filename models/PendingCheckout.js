const mongoose = require("mongoose");


const pendingItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  title: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  quantity: { type: Number, required: true },
  img: { type: String, required: true },
});

const pendingCheckoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    items: { type: [pendingItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    shippingAddress: { type: String, required: true },
    stripeSessionId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "completed", 'paid'],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingCheckout", pendingCheckoutSchema);
