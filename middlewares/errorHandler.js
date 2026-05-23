
const apiNotFound = (req, res) => {
  res.status(404).json({ error: 'API route not found' });
};

const globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Something went wrong on the server.' });
  }
  res.status(500).send('Server error');
};

module.exports = { apiNotFound, globalErrorHandler };
