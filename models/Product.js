const mongoose = require("mongoose");

// ─── RELATIONSHIPS ─────────────────────────────────────────────────────────
// Product →(referenced-in)→ Order.items.productId   (one-to-many)
// Product →(referenced-in)→ Cart.items.productId    (one-to-many)
// Product →(referenced-in)→ PendingCheckout.items   (one-to-many)
// Note: we store a snapshot of title/price/img in Order & Cart
// so order history stays correct even if product is later edited/deleted

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true, // indexed for fast category filter queries
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    img: {
      type: String,
      required: [true, "Image URL is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    specs: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
