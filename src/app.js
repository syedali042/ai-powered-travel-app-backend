const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const v1Router = require('./api/v1/routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', v1Router);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
