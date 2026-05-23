const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');

let mongoServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  await User.deleteMany({});
  await Product.deleteMany({});
  await User.create({
    name: 'Test Admin',
    email: 'testadmin@test.com',
    password: await bcrypt.hash('testpass123', 10),
    isAdmin: true,
  });
  await Product.create({
    id: 99,
    title: 'Test Phone',
    category: 'Smartphones',
    price: 499,
    img: 'https://example.com/phone.jpg',
    description: 'Test product',
    specs: [],
  });
});

after(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

test('GET /api/products returns products', async () => {
  const res = await request(app).get('/api/products').expect(200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 1);
});

test('GET /api/products filters by category and price', async () => {
  const res = await request(app)
    .get('/api/products?category=Smartphones&minPrice=400&maxPrice=600')
    .expect(200);
  assert.ok(res.body.every((p) => p.category === 'Smartphones'));
  assert.ok(res.body.every((p) => p.price >= 400 && p.price <= 600));
});

test('POST /api/auth/login rejects invalid credentials', async () => {
  await request(app)
    .post('/api/auth/login')
    .send({ email: 'testadmin@test.com', password: 'wrong' })
    .expect(400);
});

test('POST /api/auth/login returns token for valid user', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testadmin@test.com', password: 'testpass123' })
    .expect(200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.isAdmin, true);
});

test('POST /api/admin/products requires admin token', async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testadmin@test.com', password: 'testpass123' });
  const token = login.body.token;

  const res = await request(app)
    .post('/api/admin/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'New Gadget',
      category: 'Accessories',
      price: 29.99,
      img: 'https://example.com/g.jpg',
      description: 'A gadget',
    })
    .expect(201);
  assert.ok(res.body.product);
});

test('POST /api/checkout/stripe creates order when authenticated', async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testadmin@test.com', password: 'testpass123' });
  const token = login.body.token;

  const res = await request(app)
    .post('/api/checkout/stripe')
    .set('Authorization', `Bearer ${token}`)
    .send({
      items: [{ productId: 99, quantity: 1 }],
      totalAmount: 499,
      shippingAddress: '123 Test St',
    })
    .expect(200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.orderId);
});

test('POST /api/checkout/stripe rejects tampered total', async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testadmin@test.com', password: 'testpass123' });

  await request(app)
    .post('/api/checkout/stripe')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
      items: [{ productId: 99, quantity: 1 }],
      totalAmount: 1,
      shippingAddress: '123 Test St',
    })
    .expect(400);
});

test('GET /api/checkout/config returns mode', async () => {
  const res = await request(app).get('/api/checkout/config').expect(200);
  assert.equal(typeof res.body.stripeEnabled, 'boolean');
  assert.ok(['stripe', 'mock'].includes(res.body.mode));
});

test('GET unknown API returns JSON 404', async () => {
  const res = await request(app).get('/api/not-a-route').expect(404);
  assert.equal(res.body.error, 'API route not found');
});
