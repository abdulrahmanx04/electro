const mongoose = require("mongoose");

// ─── RELATIONSHIPS ─────────────────────────────────────────────────────────
// User →(one-to-many)→ Order          (a user can have many orders)
// User →(one-to-one)→  Cart           (a user has one cart)
// User →(one-to-many)→ PendingCheckout (a user can have pending checkouts)

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now()
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
