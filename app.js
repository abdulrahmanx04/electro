const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./db');
const { apiNotFound, globalErrorHandler } = require('./middlewares/errorHandler');
const { apiLimiter, authLimiter } = require('./middlewares/rateLimiter');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json());

app.use(
  express.static(path.join(__dirname, '../frontend'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  })
);


app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/products', apiLimiter, require('./routes/products'));
app.use('/api/cart', apiLimiter, require('./routes/cart'));
app.use('/api/orders', apiLimiter, require('./routes/orders'));
app.use('/api/checkout', apiLimiter, require('./routes/checkout'));
app.use('/api/admin', apiLimiter, require('./routes/admin'));


app.use('/api', apiNotFound);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/home.html'));
});

app.use(globalErrorHandler);

module.exports = app;

async function startServer() {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('===============================================');
    console.log('  ELECTROHUB BACKEND ONLINE');
    console.log(`  Server: http://localhost:${PORT}`);
    console.log('===============================================');
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err.message);
    console.error('Make sure MongoDB is running (see README).');
    process.exit(1);
  });
}