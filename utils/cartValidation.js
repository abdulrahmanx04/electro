const Product = require('../models/Product');

function roundMoney(n) {
  return Math.round(n * 100) / 100;
}

async function validateAndNormalizeCart(items, expectedTotal) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'Order must include at least one item' };
  }

  let calculatedTotal = 0;
  const normalizedItems = [];

  for (const item of items) {
    const product = await Product.findOne({ id: Number(item.productId) });
    if (!product) {
      return { error: `Product ${item.productId} not found` };
    }
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      return { error: 'Quantity must be between 1 and 10' };
    }
    calculatedTotal = roundMoney(calculatedTotal + product.price * qty);
    normalizedItems.push({
      productId: product.id,
      title: product.title,
      pricePerUnit: product.price,
      quantity: qty,
      img: product.img,
    });
  }

  if (expectedTotal != null && roundMoney(Number(expectedTotal)) !== calculatedTotal) {
    return {
      error: 'Order total does not match product prices',
      expected: calculatedTotal,
      received: Number(expectedTotal),
    };
  }

  return { normalizedItems, calculatedTotal };
}

module.exports = { validateAndNormalizeCart, roundMoney };
